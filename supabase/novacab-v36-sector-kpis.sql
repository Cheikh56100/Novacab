-- NOVACAB V36 — KPI sectoriels + notifications tickets
create table if not exists public.sector_kpis (
  id uuid primary key default gen_random_uuid(),
  secteur_id text not null,
  exercice integer not null,
  metric text not null,
  label text,
  median_value numeric not null default 0,
  unit text not null default '€',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(secteur_id, exercice, metric)
);

alter table public.sector_kpis enable row level security;

drop policy if exists sector_kpis_select_authenticated on public.sector_kpis;
create policy sector_kpis_select_authenticated on public.sector_kpis
for select to authenticated using (auth.uid() is not null);

drop policy if exists sector_kpis_manage_admin on public.sector_kpis;
create policy sector_kpis_manage_admin on public.sector_kpis
for all to authenticated using (is_super_admin() or current_team_role() = 'admin')
with check (is_super_admin() or current_team_role() = 'admin');

-- Exemple d'import de benchmark :
-- insert into public.sector_kpis (secteur_id, exercice, metric, label, median_value, unit, source)
-- values ('restauration', 2026, 'ca', 'Chiffre d’affaires médian', 250000, '€', 'Source benchmark à renseigner');
