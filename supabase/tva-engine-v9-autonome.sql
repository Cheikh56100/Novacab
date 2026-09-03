-- NOVACAB TVA AUTO V9 — MIGRATION AUTONOME
-- Peut être exécutée sur une base où les anciennes migrations TVA n'ont jamais été exécutées.
-- Elle crée d'abord les dépendances minimales puis les tables TVA et leurs index/RLS.
create extension if not exists pgcrypto;

-- 1) Dépendance minimale clients (compatible avec supabase-init.sql du projet)
create table if not exists public.clients (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 2) Déclarations TVA
create table if not exists public.tva_declarations (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  period text not null,
  status text not null default 'draft',
  base_ht_20 numeric(14,2) not null default 0,
  base_ht_10 numeric(14,2) not null default 0,
  base_ht_55 numeric(14,2) not null default 0,
  base_ht_21 numeric(14,2) not null default 0,
  base_ht_20_enc numeric(14,2) not null default 0,
  base_ht_10_enc numeric(14,2) not null default 0,
  base_ht_55_enc numeric(14,2) not null default 0,
  base_ht_21_enc numeric(14,2) not null default 0,
  base_ht_20_dec numeric(14,2) not null default 0,
  base_ht_10_dec numeric(14,2) not null default 0,
  base_ht_55_dec numeric(14,2) not null default 0,
  base_ht_21_dec numeric(14,2) not null default 0,
  total_collected numeric(14,2) not null default 0,
  total_deductible numeric(14,2) not null default 0,
  autoliquidation_tva numeric(14,2) not null default 0,
  autoliquidation_collectee numeric(14,2) not null default 0,
  autoliquidation_deductible numeric(14,2) not null default 0,
  immobilisations numeric(14,2) not null default 0,
  non_recoverable numeric(14,2) not null default 0,
  net_before_credit numeric(14,2) not null default 0,
  carry_forward_credit numeric(14,2) not null default 0,
  credit_used numeric(14,2) not null default 0,
  credit_generated numeric(14,2) not null default 0,
  net_tva numeric(14,2) not null default 0,
  ca12_reference_tva numeric(14,2) not null default 0,
  ca12_acompte_juillet numeric(14,2) not null default 0,
  ca12_acompte_decembre numeric(14,2) not null default 0,
  validation_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, period)
);

-- 3) Règles de compte : un compte peut être MIXTE.
create table if not exists public.tva_rules (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  account_number text not null,
  account_type text not null check (account_type in ('401','411')),
  default_tva_rate numeric(5,2),
  is_mixed boolean not null default false,
  operation_type text not null default 'standard',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, account_number)
);

-- 4) Règles par mot-clé : globales ou ciblées sur un compte.
create table if not exists public.tva_keyword_rules (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  keyword text not null,
  match_type text not null default 'word' check (match_type in ('word','exact','starts_with','contains')),
  account_number text,
  default_tva_rate numeric(5,2),
  operation_type text not null default 'standard',
  priority integer not null default 50,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalisation des anciennes installations.
alter table public.tva_rules add column if not exists account_type text;
alter table public.tva_rules add column if not exists default_tva_rate numeric(5,2);
alter table public.tva_rules add column if not exists is_mixed boolean not null default false;
alter table public.tva_rules add column if not exists operation_type text not null default 'standard';
alter table public.tva_rules add column if not exists enabled boolean not null default true;
alter table public.tva_rules add column if not exists created_at timestamptz not null default now();
alter table public.tva_rules add column if not exists updated_at timestamptz not null default now();

-- 5) Transactions TVA
create table if not exists public.tva_transactions (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references public.tva_declarations(id) on delete cascade,
  account_number text not null,
  account_type text,
  label text,
  transaction_date date,
  source_file text,
  journal text,
  bank_name text,
  piece text,
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0,
  ht numeric(14,2) not null default 0,
  tva_rate numeric(5,2),
  tva_amount numeric(14,2) not null default 0,
  tva_type text,
  operation_type text not null default 'standard',
  is_autoliquidation boolean not null default false,
  tva_recoverable boolean not null default true,
  rule_source text,
  rule_label text,
  needs_arbitrage boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6) Sources/imports (utilisé par le service TVA)
create table if not exists public.tva_sources (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  declaration_id uuid references public.tva_declarations(id) on delete set null,
  file_name text not null,
  journal_code text,
  bank_name text,
  row_count integer not null default 0,
  imported_at timestamptz not null default now()
);

-- 7) Acomptes CA12
create table if not exists public.tva_acomptes (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  year integer not null,
  echeance text not null check(echeance in ('juillet','decembre')),
  reference_tva numeric(14,2) not null default 0,
  taux numeric(5,2) not null default 0,
  montant_theorique numeric(14,2) not null default 0,
  montant_retenu numeric(14,2) not null default 0,
  statut text not null default 'A_PREPARER' check(statut in ('A_PREPARER','DECLARE','PAYE','ANNULE')),
  date_declaration date,
  date_paiement date,
  motif_modulation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, year, echeance)
);

-- 8) Archives annuelles
create table if not exists public.annual_archives (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  year integer not null,
  file_path text,
  status text not null default 'ACTIVE',
  cadrage_status text not null default 'A_CONTROLER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, year, file_path)
);

-- 9) Index
create index if not exists idx_tva_decl_client_period on public.tva_declarations(client_id, period);
create index if not exists idx_tva_tx_decl on public.tva_transactions(declaration_id);
create index if not exists idx_tva_rules_client_account on public.tva_rules(client_id, account_number);
create index if not exists idx_tva_kw_client on public.tva_keyword_rules(client_id, enabled, priority desc);
create index if not exists idx_tva_kw_account on public.tva_keyword_rules(client_id, account_number);
create index if not exists idx_tva_sources_client on public.tva_sources(client_id, imported_at desc);
create index if not exists idx_tva_acomptes_client_year on public.tva_acomptes(client_id, year, echeance);
create index if not exists idx_annual_archives_client_year on public.annual_archives(client_id, year);

-- 10) Unicité robuste des règles compte + mot-clé, y compris account_number NULL.
create unique index if not exists uq_tva_keyword_client_keyword_account
  on public.tva_keyword_rules(client_id, lower(trim(keyword)), coalesce(account_number, ''));

-- 11) RLS : isolation par portefeuille/client.
-- 1) Déclarations TVA
-- ------------------------------------------------------------
drop policy if exists tva_declarations_auth on public.tva_declarations;
drop policy if exists tva_declarations_portefeuille on public.tva_declarations;
create policy tva_declarations_portefeuille
on public.tva_declarations
for all
to authenticated
using (
  exists (
    select 1
    from public.clients c
    where c.id = tva_declarations.client_id
      and (
        public.current_team_role() = 'admin'
        or c.portefeuille_id = public.current_portefeuille_id()
      )
  )
)
with check (
  exists (
    select 1
    from public.clients c
    where c.id = tva_declarations.client_id
      and (
        public.current_team_role() = 'admin'
        or c.portefeuille_id = public.current_portefeuille_id()
      )
  )
);

-- ------------------------------------------------------------
-- 2) Règles par compte
-- ------------------------------------------------------------
drop policy if exists tva_rules_auth on public.tva_rules;
drop policy if exists tva_rules_portefeuille on public.tva_rules;
create policy tva_rules_portefeuille
on public.tva_rules
for all
to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = tva_rules.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = tva_rules.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
);

-- ------------------------------------------------------------
-- 3) Règles par mot-clé
-- ------------------------------------------------------------
drop policy if exists tva_keyword_rules_auth on public.tva_keyword_rules;
drop policy if exists tva_keyword_rules_portefeuille on public.tva_keyword_rules;
create policy tva_keyword_rules_portefeuille
on public.tva_keyword_rules
for all
to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = tva_keyword_rules.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = tva_keyword_rules.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
);

-- ------------------------------------------------------------
-- 4) Transactions : isolation via la déclaration TVA
-- ------------------------------------------------------------
drop policy if exists tva_transactions_auth on public.tva_transactions;
drop policy if exists tva_transactions_portefeuille on public.tva_transactions;
create policy tva_transactions_portefeuille
on public.tva_transactions
for all
to authenticated
using (
  exists (
    select 1
    from public.tva_declarations d
    join public.clients c on c.id = d.client_id
    where d.id = tva_transactions.declaration_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
)
with check (
  exists (
    select 1
    from public.tva_declarations d
    join public.clients c on c.id = d.client_id
    where d.id = tva_transactions.declaration_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
);

-- ------------------------------------------------------------
-- 5) Sources / imports TVA
-- ------------------------------------------------------------
drop policy if exists tva_sources_auth on public.tva_sources;
drop policy if exists tva_sources_portefeuille on public.tva_sources;
create policy tva_sources_portefeuille
on public.tva_sources
for all
to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = tva_sources.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = tva_sources.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
);

-- ------------------------------------------------------------
-- 6) Acomptes TVA
-- ------------------------------------------------------------
drop policy if exists tva_acomptes_auth on public.tva_acomptes;
drop policy if exists tva_acomptes_portefeuille on public.tva_acomptes;
create policy tva_acomptes_portefeuille
on public.tva_acomptes
for all
to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = tva_acomptes.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = tva_acomptes.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
);

-- ------------------------------------------------------------
-- 7) Archives annuelles
-- ------------------------------------------------------------
drop policy if exists annual_archives_auth on public.annual_archives;
drop policy if exists annual_archives_portefeuille on public.annual_archives;
create policy annual_archives_portefeuille
on public.annual_archives
for all
to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = annual_archives.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
)
with check (
  exists (
    select 1 from public.clients c
    where c.id = annual_archives.client_id
      and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
  )
);

-- ------------------------------------------------------------
-- 8) Tables TVA historiques créées par V4/V5 si elles existent
-- ------------------------------------------------------------
-- Audit versions : accès via la déclaration parente.
do $$
begin
  if to_regclass('public.tva_audit_versions') is not null then
    execute 'alter table public.tva_audit_versions enable row level security';
    execute 'drop policy if exists tva_audit_auth on public.tva_audit_versions';
    execute 'drop policy if exists tva_audit_portefeuille on public.tva_audit_versions';
    execute $policy$
      create policy tva_audit_portefeuille
      on public.tva_audit_versions
      for all to authenticated
      using (
        exists (
          select 1
          from public.tva_declarations d
          join public.clients c on c.id = d.client_id
          where d.id = tva_audit_versions.declaration_id
            and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
        )
      )
      with check (
        exists (
          select 1
          from public.tva_declarations d
          join public.clients c on c.id = d.client_id
          where d.id = tva_audit_versions.declaration_id
            and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
        )
      )
    $policy$;
  end if;

  if to_regclass('public.tva_operation_rules') is not null then
    execute 'alter table public.tva_operation_rules enable row level security';
    execute 'drop policy if exists tva_operation_auth on public.tva_operation_rules';
    execute 'drop policy if exists tva_operation_portefeuille on public.tva_operation_rules';
    execute $policy$
      create policy tva_operation_portefeuille
      on public.tva_operation_rules
      for all to authenticated
      using (
        exists (
          select 1 from public.clients c
          where c.id = tva_operation_rules.client_id
            and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
        )
      )
      with check (
        exists (
          select 1 from public.clients c
          where c.id = tva_operation_rules.client_id
            and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
        )
      )
    $policy$;
  end if;

  if to_regclass('public.tva_declaration_mappings') is not null then
    execute 'alter table public.tva_declaration_mappings enable row level security';
    execute 'drop policy if exists tva_mapping_auth on public.tva_declaration_mappings';
    execute 'drop policy if exists tva_mapping_portefeuille on public.tva_declaration_mappings';
    execute $policy$
      create policy tva_mapping_portefeuille
      on public.tva_declaration_mappings
      for all to authenticated
      using (
        exists (
          select 1
          from public.tva_declarations d
          join public.clients c on c.id = d.client_id
          where d.id = tva_declaration_mappings.declaration_id
            and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
        )
      )
      with check (
        exists (
          select 1
          from public.tva_declarations d
          join public.clients c on c.id = d.client_id
          where d.id = tva_declaration_mappings.declaration_id
            and (public.current_team_role() = 'admin' or c.portefeuille_id = public.current_portefeuille_id())
        )
      )
    $policy$;
  end if;
end $$;


comment on table public.tva_rules is 'Règles TVA par compte. is_mixed=true signifie que plusieurs taux peuvent coexister sur le même compte.';
comment on table public.tva_keyword_rules is 'Règles TVA par mot-clé, globales ou spécifiques à un compte.';
comment on column public.tva_keyword_rules.account_number is 'Compte auxiliaire optionnel. Une règle ciblée est prioritaire sur une règle globale.';
comment on column public.clients.data is 'Contient notamment tvaDefaultRate pour le taux par défaut du dossier.';

-- Fin V9 : aucune dépendance aux anciennes migrations TVA.
