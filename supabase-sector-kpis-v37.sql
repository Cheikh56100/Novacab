-- NOVACAB V37 — Référentiels KPI sectoriels annuels
create table if not exists public.sector_kpis (
  id uuid primary key default gen_random_uuid(),
  secteur_id text not null,
  exercice integer not null,
  metric text not null,
  label text,
  median_value numeric not null,
  unit text default '€',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sector_kpis add column if not exists secteur_id text;
alter table public.sector_kpis add column if not exists exercice integer;
alter table public.sector_kpis add column if not exists metric text;
alter table public.sector_kpis add column if not exists label text;
alter table public.sector_kpis add column if not exists median_value numeric;
alter table public.sector_kpis add column if not exists unit text default '€';
alter table public.sector_kpis add column if not exists source text;
alter table public.sector_kpis add column if not exists created_at timestamptz default now();
alter table public.sector_kpis add column if not exists updated_at timestamptz default now();

create index if not exists sector_kpis_lookup_idx on public.sector_kpis (secteur_id, exercice);
create unique index if not exists sector_kpis_unique_idx on public.sector_kpis (secteur_id, exercice, metric);
alter table public.sector_kpis enable row level security;

drop policy if exists sector_kpis_select_authenticated on public.sector_kpis;
drop policy if exists sector_kpis_manage_manager on public.sector_kpis;
create policy sector_kpis_select_authenticated on public.sector_kpis for select to authenticated using (auth.uid() is not null);
create policy sector_kpis_manage_manager on public.sector_kpis for all to authenticated
using (public.is_current_user_active() and public.current_team_role() = any(array['admin','expert','chef_mission','super_admin']))
with check (public.is_current_user_active() and public.current_team_role() = any(array['admin','expert','chef_mission','super_admin']));
