-- NOVACAB V30 — UX/UI + analyse financière sur 3 exercices
-- Migration additive : aucun compte Supabase Auth, aucun utilisateur et aucune donnée existante ne sont supprimés.

alter table public.financial_imports add column if not exists imported_by uuid;
alter table public.financial_imports add column if not exists analysis_version text default 'v30';
create index if not exists financial_imports_client_exercice_idx on public.financial_imports(client_id, exercice desc, created_at desc);

-- Une même importation peut être historisée ; l'UI V30 retient la plus récente pour chaque exercice.
comment on table public.financial_imports is 'Imports FEC/balance utilisés pour l’analyse financière indépendante sur N-2, N-1 et N.';
