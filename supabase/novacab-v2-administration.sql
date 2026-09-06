-- NOVACAB V2 — Administration / Direction
-- This migration is intentionally additive. Apply it in Supabase after validating
-- your existing RLS conventions. The V2 UI currently falls back to localStorage so
-- the workspace is immediately usable; these tables are the production persistence target.

create table if not exists public.admin_invoices (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  client_id text,
  invoice_number text not null,
  amount numeric(12,2) not null default 0,
  due_date date not null,
  status text not null default 'a_venir' check (status in ('a_venir','en_retard','payee','annulee')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_tools (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  client_id text,
  tool_type text not null check (tool_type in ('ebics','box')),
  status text not null,
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  monthly_cost numeric(10,2) default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_rejects (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  client_id text,
  rejection_date date not null default current_date,
  amount numeric(12,2) default 0,
  cabinet_cost numeric(12,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_mission_checklists (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  client_id text not null,
  mission_type text not null check (mission_type in ('entree','sortie')),
  steps jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (client_id, mission_type)
);

create table if not exists public.admin_reminders (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  client_id text,
  invoice_id uuid references public.admin_invoices(id) on delete cascade,
  level integer not null default 0 check (level between 0 and 4),
  scheduled_for date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_reminder_history (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  reminder_id uuid references public.admin_reminders(id) on delete cascade,
  channel text not null,
  comment text,
  author_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_invoices_portefeuille on public.admin_invoices(portefeuille_id);
create index if not exists idx_admin_invoices_due on public.admin_invoices(due_date);
create index if not exists idx_admin_tools_portefeuille on public.admin_tools(portefeuille_id);
create index if not exists idx_admin_rejects_portefeuille on public.admin_rejects(portefeuille_id);
create index if not exists idx_admin_checklists_portefeuille on public.admin_mission_checklists(portefeuille_id);

-- RLS must be adapted to the cabinet/team schema already used by NOVACAB.
-- Do not enable broad public policies. Recommended rule:
--   admin / expert: access rows from their portefeuille_id;
--   super_admin: platform-level access;
--   collaborators: no access to administration tables.


create table if not exists public.admin_costs (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  provider text not null,
  tool_name text not null,
  monthly_cost numeric(12,2) not null default 0,
  annual_cost numeric(12,2) generated always as (monthly_cost * 12) stored,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_contracts (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  provider text not null,
  contract_name text not null,
  start_date date,
  end_date date,
  notice_days integer default 0,
  monthly_cost numeric(12,2) default 0,
  auto_renewal boolean not null default false,
  document_path text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_licenses (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  provider text not null,
  tool_name text not null,
  total_licenses integer not null default 0,
  used_licenses integer not null default 0,
  unit_monthly_cost numeric(10,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id uuid,
  actor_id uuid,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_costs_portefeuille on public.admin_costs(portefeuille_id);
create index if not exists idx_admin_contracts_portefeuille on public.admin_contracts(portefeuille_id);
create index if not exists idx_admin_licenses_portefeuille on public.admin_licenses(portefeuille_id);
create index if not exists idx_admin_audit_portefeuille_date on public.admin_audit_log(portefeuille_id, created_at desc);
