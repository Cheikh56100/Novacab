-- ============================================================
-- NOVACAB V44 — Hardening rôles & parcours V2.2.1
-- ============================================================
-- Objectif : aligner les garde-fous Supabase avec les parcours UI
-- vérifiés pour Admin / Expert / Chef de mission / Collaborateur /
-- Gestionnaire de paie.
--
-- Principes :
--   * Super Admin = plateforme, hors périmètre cabinet.
--   * Admin = administration complète de SON cabinet.
--   * Expert / Chef de mission = management opérationnel, sans
--     élévation vers Admin/Expert ni administration de la matrice.
--   * Collaborateur / Gestionnaire de paie = pas de gestion d'équipe.
-- ============================================================

-- 1) La fonction historique ne vérifiait que l'appartenance au cabinet.
--    Elle autorisait donc potentiellement tout membre actif à satisfaire
--    les policies team_* qui l'utilisent.
create or replace function public.is_current_user_cabinet_manager(target_portefeuille_id text)
returns boolean
language sql stable security definer set search_path=public,auth
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.team t
      where t.auth_user_id = auth.uid()
        and coalesce(t.statut,'actif') = 'actif'
        and t.portefeuille_id = target_portefeuille_id
        and t.role in ('admin','expert','chef_mission')
    );
$$;

-- 2) Empêcher côté DB l'élévation de rôle par Expert/Chef de mission.
--    Les garde-fous UI restent utiles, mais le contrôle canonique est DB.
create or replace function public.enforce_team_role_permissions()
returns trigger
language plpgsql security definer set search_path=public,auth
as $$
declare actor_role text;
begin
  actor_role := public.current_team_role();

  if public.is_super_admin() or actor_role = 'admin' then
    return new;
  end if;

  if actor_role not in ('expert','chef_mission') then
    raise exception 'Action équipe réservée au management';
  end if;

  if TG_OP = 'UPDATE' and OLD.role in ('admin','expert','super_admin') then
    raise exception 'Seul l''Admin peut gérer un compte d''administration ou d''expertise';
  end if;

  if NEW.role in ('admin','expert','super_admin') then
    raise exception 'Seul l''Admin peut attribuer ce rôle';
  end if;

  if NEW.portefeuille_id is distinct from public.current_portefeuille_id() then
    raise exception 'Un manager ne peut modifier que son portefeuille';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_team_role_permissions on public.team;
create trigger trg_team_role_permissions
before insert or update on public.team
for each row execute function public.enforce_team_role_permissions();

-- 3) Validation d'un nouveau compte : l'Admin du cabinet peut valider
--    une demande pour SON portefeuille ; le Super Admin reste global.
create or replace function public.approve_team_account(
  p_team_id text,
  p_portefeuille_id text,
  p_role text default 'collaborateur'
)
returns public.team
language plpgsql
security definer
set search_path = public,auth
as $$
declare
  v_row public.team;
  v_role text := coalesce(nullif(btrim(p_role),''),'collaborateur');
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  if not (
    public.is_super_admin()
    or (
      public.current_team_role() = 'admin'
      and p_portefeuille_id = public.current_portefeuille_id()
    )
  ) then
    raise exception 'Validation de compte réservée à l''Admin du cabinet ou au Super Admin';
  end if;

  if p_portefeuille_id is null or btrim(p_portefeuille_id) = '' then
    raise exception 'Un cabinet doit être attribué avant validation';
  end if;

  if v_role not in ('admin','expert','chef_mission','collaborateur','gestionnaire_paie') then
    raise exception 'Rôle invalide';
  end if;

  if not exists (select 1 from public.portefeuilles where id = p_portefeuille_id) then
    raise exception 'Cabinet introuvable';
  end if;

  update public.team
  set portefeuille_id = p_portefeuille_id,
      role = v_role,
      statut = 'actif'
  where id = p_team_id
    and statut = 'en_attente'
  returning * into v_row;

  if not found then
    raise exception 'Compte en attente introuvable ou déjà traité';
  end if;

  return v_row;
end;
$$;

revoke all on function public.approve_team_account(text,text,text) from public;
grant execute on function public.approve_team_account(text,text,text) to authenticated;

-- 4) La matrice des droits est une fonction d'administration : même si
--    l'interface est cachée aux autres rôles, son RPC ne doit pas être
--    appelable par un Collaborateur/Gestionnaire/Expert/Chef.
create or replace function public.save_cabinet_product_state(
  p_module_key text,
  p_state jsonb,
  p_expected_version integer default null
) returns table(version integer, updated_at timestamptz)
language plpgsql security definer set search_path=public,auth
as $$
declare
  cid text; v integer; u uuid;
begin
  cid := public.current_portefeuille_id();
  u := auth.uid();
  if cid is null or u is null then
    raise exception 'Cabinet ou utilisateur introuvable';
  end if;

  if p_module_key = 'permissions-matrix'
     and public.current_team_role() <> 'admin'
     and not public.is_super_admin() then
    raise exception 'La matrice des droits est réservée à l''Admin';
  end if;

  insert into public.cabinet_product_states(portefeuille_id,module_key,state,version,updated_at,updated_by)
  values(cid,p_module_key,coalesce(p_state,'{}'::jsonb),1,now(),u)
  on conflict(portefeuille_id,module_key) do update set
    state = excluded.state,
    version = public.cabinet_product_states.version + 1,
    updated_at = now(),
    updated_by = u
  where p_expected_version is null or public.cabinet_product_states.version = p_expected_version
  returning cabinet_product_states.version,cabinet_product_states.updated_at into v,updated_at;

  if v is null then
    raise exception 'Conflit de version: actualisez les données';
  end if;

  return query select v, now();
end;
$$;

grant execute on function public.save_cabinet_product_state(text,jsonb,integer) to authenticated;
