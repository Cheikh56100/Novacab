-- NOVACAB V48 — Gestion équipe globale du Super Admin
-- Corrige l'affectation d'un membre existant à un portefeuille.
-- Le Super Admin est hors périmètre cabinet : son écriture doit passer par
-- un RPC SECURITY DEFINER dédié, sans dépendre des policies du cabinet courant.

create or replace function public.super_admin_update_team_member(
  p_team_id text,
  p_patch jsonb
)
returns public.team
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row public.team;
  v_portefeuille_id text;
  v_role text;
  v_statut text;
  v_nom text;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Action réservée au Super Admin NOVACAB';
  end if;

  if p_team_id is null or btrim(p_team_id) = '' then
    raise exception 'Membre introuvable';
  end if;

  if not exists (select 1 from public.team where id = p_team_id) then
    raise exception 'Membre introuvable';
  end if;

  v_portefeuille_id := nullif(btrim(coalesce(p_patch->>'portefeuille_id','')), '');
  v_role := nullif(btrim(coalesce(p_patch->>'role','')), '');
  v_statut := nullif(btrim(coalesce(p_patch->>'statut','')), '');
  v_nom := nullif(btrim(coalesce(p_patch->>'nom','')), '');

  if v_portefeuille_id is not null
     and not exists (select 1 from public.portefeuilles p where p.id = v_portefeuille_id) then
    raise exception 'Portefeuille introuvable';
  end if;

  if v_role is not null
     and v_role not in ('super_admin','admin','expert','chef_mission','collaborateur','gestionnaire_paie') then
    raise exception 'Rôle invalide';
  end if;

  if v_statut is not null
     and v_statut not in ('actif','en_attente','inactif','suspendu') then
    raise exception 'Statut invalide';
  end if;

  update public.team
  set portefeuille_id = case when p_patch ? 'portefeuille_id' then v_portefeuille_id else portefeuille_id end,
      role = case when p_patch ? 'role' then v_role else role end,
      statut = case when p_patch ? 'statut' then v_statut else statut end,
      nom = case when v_nom is not null then v_nom else nom end
  where id = p_team_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.super_admin_update_team_member(text,jsonb) from public;
grant execute on function public.super_admin_update_team_member(text,jsonb) to authenticated;
