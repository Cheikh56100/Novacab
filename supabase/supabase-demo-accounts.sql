-- NOVACAB — COMPTES DÉMO
-- À exécuter une fois dans Supabase > SQL Editor.
alter table public.team add column if not exists is_demo boolean not null default false;
alter table public.team add column if not exists demo_expires_at timestamptz;

create index if not exists idx_team_demo on public.team(is_demo, demo_expires_at);

-- Les comptes démo utilisent les mêmes RLS que les comptes normaux,
-- mais leur portefeuille est dédié et créé par la fonction Edge sécurisée.
