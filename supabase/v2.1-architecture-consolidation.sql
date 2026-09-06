-- NOVACAB V2.1 — Architecture consolidée
-- Migration additive et idempotente. À exécuter APRÈS les migrations existantes.
-- Objectif : une source de vérité pour le périmètre RLS, notifications modernes
-- et conventions comptables. Aucun DROP de données métier.

begin;

-- ============================================================
-- 1. Identité / périmètre : portefeuille_id est canonique.
-- current_cabinet_* reste uniquement comme alias de compatibilité.
-- ============================================================
create or replace function public.current_team_id()
returns text language sql stable security definer set search_path=public,auth as $$
  select t.id::text
  from public.team t
  where t.auth_user_id = auth.uid() and coalesce(t.statut,'actif')='actif'
  order by t.created_at asc
  limit 1
$$;

create or replace function public.current_team_role()
returns text language sql stable security definer set search_path=public,auth as $$
  select t.role
  from public.team t
  where t.auth_user_id = auth.uid() and coalesce(t.statut,'actif')='actif'
  order by t.created_at asc
  limit 1
$$;

create or replace function public.current_portefeuille_id()
returns text language sql stable security definer set search_path=public,auth as $$
  select t.portefeuille_id
  from public.team t
  where t.auth_user_id = auth.uid() and coalesce(t.statut,'actif')='actif'
  order by t.created_at asc
  limit 1
$$;

create or replace function public.current_cabinet_id()
returns text language sql stable security definer set search_path=public,auth as $$
  select public.current_portefeuille_id()
$$;

create or replace function public.is_cabinet_manager()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select coalesce(public.current_team_role() in ('admin','expert','chef_mission'),false)
$$;

create or replace function public.current_cabinet_is_manager()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select public.is_cabinet_manager()
$$;

-- ============================================================
-- 2. Notifications : schéma canonique + migration douce des anciens champs.
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text not null,
  user_id text null,
  type text not null default 'info',
  title text not null default 'Notification',
  message text,
  action jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists portefeuille_id text;
alter table public.notifications add column if not exists user_id text;
alter table public.notifications add column if not exists type text not null default 'info';
alter table public.notifications add column if not exists title text not null default 'Notification';
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists action jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists dedupe_key text;
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

-- Migration des anciens exports si les colonnes existent.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='destinataire_id') then
    execute $mig$update public.notifications n
      set user_id = t.auth_user_id::text
      from public.team t
      where n.user_id is null and n.destinataire_id::text = t.id::text and t.auth_user_id is not null$mig$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='lu') then
    execute $mig$update public.notifications set read_at = coalesce(read_at, created_at) where lu is true and read_at is null$mig$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='destinataire_id') then
    execute $mig$update public.notifications n
      set portefeuille_id = t.portefeuille_id
      from public.team t
      where n.portefeuille_id is null and n.destinataire_id::text = t.id::text$mig$;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='expediteur_id') then
    -- L'expéditeur historique n'a pas d'équivalent obligatoire dans le modèle V2.1.
    null;
  end if;
end $$;

create index if not exists notifications_scope_idx on public.notifications(portefeuille_id, user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(portefeuille_id, user_id, read_at, created_at desc);
create unique index if not exists notifications_dedupe_unique_v21 on public.notifications(portefeuille_id, dedupe_key) where dedupe_key is not null;

alter table public.notifications enable row level security;
drop policy if exists notifications_cabinet on public.notifications;
drop policy if exists notifications_v21_select on public.notifications;
drop policy if exists notifications_v21_insert on public.notifications;
drop policy if exists notifications_v21_update on public.notifications;
drop policy if exists notifications_v21_delete on public.notifications;

create policy notifications_v21_select on public.notifications
for select to authenticated
using (public.is_super_admin() or (portefeuille_id = public.current_portefeuille_id() and (user_id is null or user_id = auth.uid()::text)));

create policy notifications_v21_insert on public.notifications
for insert to authenticated
with check (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (user_id is null or user_id = auth.uid()::text or public.is_cabinet_manager())
  )
);

create policy notifications_v21_update on public.notifications
for update to authenticated
using (public.is_super_admin() or (portefeuille_id = public.current_portefeuille_id() and user_id = auth.uid()::text))
with check (public.is_super_admin() or (portefeuille_id = public.current_portefeuille_id() and user_id = auth.uid()::text));

create policy notifications_v21_delete on public.notifications
for delete to authenticated
using (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (user_id = auth.uid()::text or public.is_cabinet_manager())
  )
);

-- ============================================================
-- 3. Etats produit : l'administration est explicitement multi-utilisateur.
-- ============================================================
create table if not exists public.cabinet_product_states (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text not null,
  module_key text not null,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique(portefeuille_id,module_key)
);
alter table public.cabinet_product_states enable row level security;
grant select,insert,update,delete on public.cabinet_product_states to authenticated;
drop policy if exists cabinet_product_states_select on public.cabinet_product_states;
drop policy if exists cabinet_product_states_write on public.cabinet_product_states;
create policy cabinet_product_states_select on public.cabinet_product_states
for select to authenticated
using (public.is_super_admin() or portefeuille_id = public.current_portefeuille_id());
create policy cabinet_product_states_write on public.cabinet_product_states
for all to authenticated
using (public.is_super_admin() or portefeuille_id = public.current_portefeuille_id())
with check (public.is_super_admin() or portefeuille_id = public.current_portefeuille_id());


-- 4. RPCs nécessaires à la persistance et à l'audit produit.
create or replace function public.save_cabinet_product_state(
  p_module_key text, p_state jsonb, p_expected_version integer default null
) returns table(version integer, updated_at timestamptz)
language plpgsql security definer set search_path=public,auth as $$
declare cid text; v integer; u uuid;
begin
  cid := public.current_portefeuille_id();
  u := auth.uid();
  if cid is null or u is null then raise exception 'Cabinet ou utilisateur introuvable'; end if;
  insert into public.cabinet_product_states(portefeuille_id,module_key,state,version,updated_at,updated_by)
  values(cid,p_module_key,coalesce(p_state,'{}'::jsonb),1,now(),u)
  on conflict(portefeuille_id,module_key) do update set
    state = excluded.state,
    version = public.cabinet_product_states.version + 1,
    updated_at = now(),
    updated_by = u
  where p_expected_version is null or public.cabinet_product_states.version = p_expected_version
  returning cabinet_product_states.version,cabinet_product_states.updated_at into v,updated_at;
  if v is null then raise exception 'Conflit de version: actualisez les données'; end if;
  return query select v, now();
end $$;
grant execute on function public.save_cabinet_product_state(text,jsonb,integer) to authenticated;

create or replace function public.unread_notification_count()
returns integer language sql stable security definer set search_path=public,auth as $$
  select count(*)::integer
  from public.notifications n
  where n.portefeuille_id = public.current_portefeuille_id()
    and n.read_at is null
    and (n.user_id is null or n.user_id = auth.uid()::text)
$$;
grant execute on function public.unread_notification_count() to authenticated;

commit;
