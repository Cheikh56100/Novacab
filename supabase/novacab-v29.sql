-- NOVACAB V29
-- Règles intelligentes de reconnaissance des libellés TVA
create table if not exists public.tva_keyword_rules (
 id uuid primary key default gen_random_uuid(), portefeuille_id text not null, keyword text not null,
 normalized_keyword text not null, target_account text, match_type text not null default 'contains', priority integer not null default 0,
 enabled boolean not null default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists tva_keyword_rules_scope_idx on public.tva_keyword_rules(portefeuille_id, enabled, priority desc);
-- Résultats d'imports FEC / balances pour comparaison N, N-1, N-2
create table if not exists public.financial_imports (
 id uuid primary key default gen_random_uuid(), client_id text not null, portefeuille_id text, exercice text,
 source_type text not null check(source_type in ('fec','balance','csv','excel')), file_name text, payload jsonb not null default '{}'::jsonb,
 kpis jsonb not null default '{}'::jsonb, created_at timestamptz default now()
);
create index if not exists financial_imports_client_idx on public.financial_imports(client_id, created_at desc);
