-- NOVACAB V10 — Espace collaborateur
-- Profil professionnel, formations, compétences, objectifs, réalisations,
-- entretiens, documents et historique.

create table if not exists public.team_profiles (
  team_id text primary key references public.team(id) on delete cascade,
  formations jsonb not null default '[]'::jsonb,
  competences jsonb not null default '[]'::jsonb,
  objectifs jsonb not null default '[]'::jsonb,
  realisations jsonb not null default '[]'::jsonb,
  entretiens jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  historique jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_profiles enable row level security;

drop policy if exists "team_profiles_select" on public.team_profiles;
drop policy if exists "team_profiles_insert" on public.team_profiles;
drop policy if exists "team_profiles_update" on public.team_profiles;

grant select, insert, update on public.team_profiles to authenticated;

create policy "team_profiles_select"
on public.team_profiles
for select to authenticated
using (
  exists (
    select 1 from public.team me
    where me.auth_user_id = auth.uid()
      and (
        me.id = team_profiles.team_id
        or (
          me.role in ('admin','expert','chef_mission')
          and me.portefeuille_id = (select t.portefeuille_id from public.team t where t.id = team_profiles.team_id)
        )
      )
  )
);

create policy "team_profiles_insert"
on public.team_profiles
for insert to authenticated
with check (
  exists (
    select 1 from public.team me
    where me.auth_user_id = auth.uid()
      and me.id = team_profiles.team_id
  )
);

create policy "team_profiles_update"
on public.team_profiles
for update to authenticated
using (
  exists (
    select 1 from public.team me
    where me.auth_user_id = auth.uid()
      and (
        me.id = team_profiles.team_id
        or (
          me.role in ('admin','expert','chef_mission')
          and me.portefeuille_id = (select t.portefeuille_id from public.team t where t.id = team_profiles.team_id)
        )
      )
  )
)
with check (
  exists (
    select 1 from public.team me
    where me.auth_user_id = auth.uid()
      and (
        me.id = team_profiles.team_id
        or (
          me.role in ('admin','expert','chef_mission')
          and me.portefeuille_id = (select t.portefeuille_id from public.team t where t.id = team_profiles.team_id)
        )
      )
  )
);
