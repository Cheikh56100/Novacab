-- NOVACAB V31 — Automatisations intelligentes (migration additive)
-- Ne supprime aucun utilisateur, mot de passe, rôle, portefeuille ou client.

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text,
  nom text not null,
  declencheur text not null,
  conditions jsonb not null default '{}'::jsonb,
  action text not null,
  action_payload jsonb not null default '{}'::jsonb,
  actif boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.client_alerts (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  portefeuille_id text,
  type text not null,
  niveau text not null default 'attention',
  titre text not null,
  message text,
  source text not null default 'automation',
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_alerts_client_idx on public.client_alerts(client_id, created_at desc);
create index if not exists automation_rules_portefeuille_idx on public.automation_rules(portefeuille_id, actif);

-- V31.1 — raccordement réel du moteur intelligent aux données existantes.
alter table public.client_alerts add column if not exists dedupe_key text;
alter table public.client_alerts add column if not exists updated_at timestamptz not null default now();
do $$ begin
  if not exists (select 1 from pg_constraint where conname='client_alerts_client_dedupe_key') then
    alter table public.client_alerts add constraint client_alerts_client_dedupe_key unique (client_id, dedupe_key);
  end if;
end $$;
create index if not exists client_alerts_open_idx on public.client_alerts(client_id, resolved_at) where resolved_at is null;

-- Table optionnelle de journalisation des passages du moteur, utile pour l'audit.
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text,
  status text not null default 'success',
  clients_processed integer not null default 0,
  alerts_generated integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists automation_runs_portefeuille_idx on public.automation_runs(portefeuille_id, created_at desc);

-- Sécurité : aucune politique permissive globale n'est ajoutée ici.
-- Les règles RLS existantes du cabinet restent la référence. Si RLS est activé
-- sur client_alerts, ajoutez une politique portefeuille cohérente avec les autres tables.
