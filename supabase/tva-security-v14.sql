-- ============================================================
-- NOVACAB V14 — TVA : ISOLATION PAR PORTEFEUILLE
-- À exécuter APRÈS les migrations TVA existantes et après
-- supabase-annual-security-migration.sql.
--
-- Principe : les tables TVA restent liées au client. La RLS
-- remonte du client vers son portefeuille et réutilise les
-- fonctions SECURITY DEFINER existantes :
--   public.current_portefeuille_id()
--   public.current_team_role()
-- ============================================================

-- ------------------------------------------------------------
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

-- ============================================================
-- Fin V14 — TVA isolée par portefeuille.
-- ============================================================
