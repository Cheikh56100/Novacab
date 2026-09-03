-- ============================================================
-- NOVACAB — SÉCURITÉ + ANNUALISATION
-- À exécuter APRÈS supabase-init.sql / migrations existantes.
-- ============================================================

-- Colonnes nécessaires à l'isolation par portefeuille.
alter table public.clients add column if not exists portefeuille_id text;
alter table public.team add column if not exists portefeuille_id text;
alter table public.team add column if not exists auth_user_id uuid;
alter table public.team add column if not exists role text default 'collaborateur';
alter table public.team add column if not exists statut text default 'actif';

create index if not exists idx_clients_portefeuille on public.clients(portefeuille_id);
create index if not exists idx_team_auth_user on public.team(auth_user_id);
create index if not exists idx_team_portefeuille on public.team(portefeuille_id);

-- Fonctions SECURITY DEFINER pour éviter la récursion RLS sur team.
create or replace function public.current_team_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select t.role
  from public.team t
  where t.auth_user_id = auth.uid()
    and t.statut = 'actif'
  limit 1;
$$;

create or replace function public.current_portefeuille_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select t.portefeuille_id
  from public.team t
  where t.auth_user_id = auth.uid()
    and t.statut = 'actif'
  limit 1;
$$;

create or replace function public.is_cabinet_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_team_role() in ('admin','expert','chef_mission'), false);
$$;

-- CLIENTS : aucun accès anonyme, isolation stricte par portefeuille.
alter table public.clients enable row level security;
drop policy if exists "clients_select" on public.clients;
drop policy if exists "clients_insert" on public.clients;
drop policy if exists "clients_update" on public.clients;
drop policy if exists "clients_delete" on public.clients;

create policy "clients_select_authenticated_portefeuille"
on public.clients for select to authenticated
using (
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);

create policy "clients_insert_authenticated_portefeuille"
on public.clients for insert to authenticated
with check (
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);

create policy "clients_update_authenticated_portefeuille"
on public.clients for update to authenticated
using (
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
)
with check (
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);

create policy "clients_delete_authenticated_portefeuille"
on public.clients for delete to authenticated
using (
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);

-- TEAM : lecture de son propre profil et de son portefeuille pour les responsables.
alter table public.team enable row level security;
drop policy if exists "team_select" on public.team;
drop policy if exists "team_insert" on public.team;
drop policy if exists "team_update" on public.team;
drop policy if exists "team_delete" on public.team;

create policy "team_select_authenticated"
on public.team for select to authenticated
using (
  auth_user_id = auth.uid()
  or public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);

create policy "team_insert_managers"
on public.team for insert to authenticated
with check (
  public.current_team_role() = 'admin'
  or (public.current_team_role() in ('expert','chef_mission') and portefeuille_id = public.current_portefeuille_id())
);

create policy "team_update_managers"
on public.team for update to authenticated
using (
  public.current_team_role() = 'admin'
  or (public.current_team_role() in ('expert','chef_mission') and portefeuille_id = public.current_portefeuille_id())
)
with check (
  public.current_team_role() = 'admin'
  or (public.current_team_role() in ('expert','chef_mission') and portefeuille_id = public.current_portefeuille_id())
);

create policy "team_delete_admin"
on public.team for delete to authenticated
using (public.current_team_role() = 'admin');

-- Portefeuilles : visibilité authentifiée ; écritures réservées aux admins.
alter table public.portefeuilles enable row level security;
drop policy if exists "portefeuilles_select" on public.portefeuilles;
drop policy if exists "portefeuilles_insert" on public.portefeuilles;
drop policy if exists "portefeuilles_update" on public.portefeuilles;
drop policy if exists "portefeuilles_delete" on public.portefeuilles;
create policy "portefeuilles_select_authenticated" on public.portefeuilles for select to authenticated using (true);
create policy "portefeuilles_insert_admin" on public.portefeuilles for insert to authenticated with check (public.current_team_role() = 'admin');
create policy "portefeuilles_update_admin" on public.portefeuilles for update to authenticated using (public.current_team_role() = 'admin') with check (public.current_team_role() = 'admin');
create policy "portefeuilles_delete_admin" on public.portefeuilles for delete to authenticated using (public.current_team_role() = 'admin');

-- ============================================================
-- NOTE ANNUALISATION
-- Les données annuelles sont stockées dans clients.data.annualData["YYYY"].
-- Aucune migration SQL des données métier n'est nécessaire : la version web
-- archive automatiquement les champs TVA/social/bilan/IS/CFE/révision à chaque
-- sauvegarde et lors du changement d'exercice.
-- ============================================================

-- ============================================================
-- V40+ — droits d'accès fins par dossier
-- ------------------------------------------------------------
-- Les dossiers peuvent désormais contenir data.accesDossier :
-- [{"teamId":"...","level":"lecture|modification"}]
-- Les managers gardent la visibilité de leur portefeuille ; les
-- collaborateurs non managers ne voient que leurs dossiers affectés
-- ou explicitement autorisés.
-- ============================================================
create or replace function public.current_team_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select t.id::text
  from public.team t
  where t.auth_user_id = auth.uid()
    and t.statut = 'actif'
  limit 1;
$$;

drop policy if exists "clients_select_authenticated_portefeuille" on public.clients;
create policy "clients_select_authenticated_portefeuille"
on public.clients for select to authenticated
using (
  public.current_team_role() = 'admin'
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('expert','chef_mission')
      or coalesce(jsonb_array_length(data->'accesDossier'), 0) = 0
      or exists (
        select 1
        from jsonb_array_elements(coalesce(data->'accesDossier','[]'::jsonb)) a
        where a->>'teamId' = public.current_team_id()
      )
      or data->>'collab' = (select t.nom from public.team t where t.id::text = public.current_team_id())
      or data->>'expert' = (select t.nom from public.team t where t.id::text = public.current_team_id())
      or data->>'chefMission' = (select t.nom from public.team t where t.id::text = public.current_team_id())
      or data->>'gestionnairePaie' = (select t.nom from public.team t where t.id::text = public.current_team_id())
    )
  )
);

drop policy if exists "clients_update_authenticated_portefeuille" on public.clients;
create policy "clients_update_authenticated_portefeuille"
on public.clients for update to authenticated
using (
  public.current_team_role() = 'admin'
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('expert','chef_mission')
      or coalesce(jsonb_array_length(data->'accesDossier'), 0) = 0
      or exists (
        select 1
        from jsonb_array_elements(coalesce(data->'accesDossier','[]'::jsonb)) a
        where a->>'teamId' = public.current_team_id() and coalesce(a->>'level','lecture') = 'modification'
      )
      or data->>'collab' = (select t.nom from public.team t where t.id::text = public.current_team_id())
    )
  )
)
with check (
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);
