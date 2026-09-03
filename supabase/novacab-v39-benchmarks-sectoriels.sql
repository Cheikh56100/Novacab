-- NOVACAB V39 — Benchmark sectoriel fiable et historisé
-- Sources de référence : Banque de France / FIBEN et BCE-INPI.
-- Ne pas insérer de valeurs estimées : chaque valeur doit être sourcée.

create table if not exists public.sector_kpi_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_name text not null,
  source_url text,
  published_at date,
  last_checked_at timestamptz default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.sector_kpis add column if not exists naf_division text;
alter table public.sector_kpis add column if not exists revenue_band text;
alter table public.sector_kpis add column if not exists q25_value numeric;
alter table public.sector_kpis add column if not exists q75_value numeric;
alter table public.sector_kpis add column if not exists source_key text;
alter table public.sector_kpis add column if not exists source_url text;
alter table public.sector_kpis add column if not exists published_at date;
alter table public.sector_kpis add column if not exists last_verified_at timestamptz;

create index if not exists sector_kpis_naf_exercice_idx on public.sector_kpis(naf_division, exercice);
create index if not exists sector_kpis_source_idx on public.sector_kpis(source_key);

alter table public.sector_kpi_sources enable row level security;
drop policy if exists sector_kpi_sources_select_authenticated on public.sector_kpi_sources;
drop policy if exists sector_kpi_sources_manage_manager on public.sector_kpi_sources;
create policy sector_kpi_sources_select_authenticated on public.sector_kpi_sources for select to authenticated using (auth.uid() is not null);
create policy sector_kpi_sources_manage_manager on public.sector_kpi_sources for all to authenticated
using (public.is_current_user_active() and public.current_team_role() = any(array['admin','expert','chef_mission','super_admin']))
with check (public.is_current_user_active() and public.current_team_role() = any(array['admin','expert','chef_mission','super_admin']));

insert into public.sector_kpi_sources(source_key,source_name,source_url,published_at,notes)
values
('BDF_FIBEN_2025','Banque de France — Fascicules d’indicateurs sectoriels (FIBEN)','https://www.banque-france.fr/fr/publications-et-statistiques/statistiques/fascicules-dindicateurs-sectoriels','2025-11-27','Publication annuelle : ratios sectoriels avec médiane et quartiles sur les deux dernières années disponibles.'),
('BCE_INPI_SECTOR','Ministères économiques et financiers — indicateurs sectoriels BCE/INPI','https://www.data.gouv.fr/datasets/indicateurs-sectoriels-financiers-bce-inpi','2023-02-27','Percentiles Q10/Q25/Q50/Q75/Q90 par cohorte, secteur, tranche de chiffre d’affaires et année.')
on conflict (source_key) do update set source_name=excluded.source_name,source_url=excluded.source_url,published_at=excluded.published_at,notes=excluded.notes,last_checked_at=now();
