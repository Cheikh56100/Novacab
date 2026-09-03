-- NOVACAB V14 — Auth ↔ team synchronization
-- Fixes the post-login "Finalisation de votre compte" screen when a
-- Supabase Auth user exists but its public.team row is missing/unlinked.
-- Safe by design: a self-created account can ONLY become collaborator/active,
-- and its portefeuille is inferred from an existing matching email/domain.

create or replace function public.ensure_current_user_team()
returns public.team
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  email_value text := lower(coalesce(auth.jwt() ->> 'email', ''));
  domain_value text := split_part(email_value, '@', 2);
  full_name_value text := nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')), '');
  phone_value text := nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'telephone', '')), '');
  cabinet_value text := nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'cabinet_nom', '')), '');
  existing public.team%rowtype;
  portfolio_id text;
  portfolio_name text;
  created public.team%rowtype;
begin
  if uid is null or email_value = '' then
    raise exception 'Utilisateur authentifié introuvable';
  end if;

  -- 1) Already linked: return it unchanged.
  select * into existing
  from public.team
  where auth_user_id = uid
  order by created_at asc
  limit 1;

  if found then
    return existing;
  end if;

  -- 2) Existing team row with the same email but not linked yet: link it.
  select * into existing
  from public.team
  where lower(coalesce(email, '')) = email_value
    and (auth_user_id is null or auth_user_id = uid)
  order by created_at asc
  limit 1;

  if found then
    update public.team
       set auth_user_id = uid,
           telephone = coalesce(telephone, phone_value),
           cabinet_nom = coalesce(cabinet_nom, cabinet_value),
           statut = coalesce(statut, 'actif')
     where id = existing.id
     returning * into existing;
    return existing;
  end if;

  -- 3) Infer the cabinet from the email domain. Never trust a client-supplied
  -- portefeuille_id/role here. If no domain matches, create a pending row.
  select p.id, p.nom
    into portfolio_id, portfolio_name
  from public.portefeuilles p
  where domain_value <> ''
    and lower(coalesce(p.domaine, '')) = domain_value
  order by p.id
  limit 1;

  if portfolio_id is null and cabinet_value <> '' then
    select p.id, p.nom
      into portfolio_id, portfolio_name
    from public.portefeuilles p
    where lower(coalesce(p.nom, '')) = lower(cabinet_value)
    order by p.id
    limit 1;
  end if;

  insert into public.team (
    id, nom, color, email, telephone, cabinet_nom,
    role, statut, portefeuille_id, auth_user_id
  ) values (
    't-' || replace(gen_random_uuid()::text, '-', ''),
    coalesce(full_name_value, split_part(email_value, '@', 1)),
    '#3B82F6',
    email_value,
    phone_value,
    coalesce(cabinet_value, portfolio_name),
    'collaborateur',
    case when portfolio_id is null then 'en_attente' else 'actif' end,
    portfolio_id,
    uid
  ) returning * into created;

  return created;
end;
$$;

revoke all on function public.ensure_current_user_team() from public;
grant execute on function public.ensure_current_user_team() to authenticated;
