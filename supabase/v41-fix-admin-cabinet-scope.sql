-- NOVACAB V41 — Correctif critique : scoper le rôle 'admin' à son propre cabinet
-- ============================================================
-- Constat : dans plusieurs migrations passées, `current_team_role() = 'admin'`
-- était utilisé comme un bypass GLOBAL (tous cabinets), jamais combiné à
-- portefeuille_id = current_portefeuille_id(). Tant que personne n'avait
-- role='admin' (seul 'super_admin' existait), ce n'était pas exploitable.
-- Maintenant que de vrais admins de cabinet sont créés, ce correctif est
-- indispensable pour restaurer l'isolation multi-cabinet.
--
-- Principe : un 'admin' garde tous ses droits, mais UNIQUEMENT sur son
-- propre portefeuille_id. Les actions réellement globales restent
-- réservées à is_super_admin().
-- À exécuter dans Supabase SQL Editor, après les migrations existantes.
-- ============================================================

-- ------------------------------------------------------------
-- 1) TEAM — supprimer les anciennes policies non scopées.
--    (insert/update/delete sont déjà correctement gérées par
--    super-admin-team-rls.sql via is_current_user_cabinet_manager ;
--    ces anciennes policies faisaient doublon en autorisant un bypass
--    global en plus, à cause de l'OR entre policies permissives.)
-- ------------------------------------------------------------
drop policy if exists "team_insert_managers" on public.team;
drop policy if exists "team_update_managers" on public.team;
drop policy if exists "team_delete_admin" on public.team;

-- Lecture : un admin/expert/chef_mission voit son cabinet, pas les autres.
drop policy if exists "team_select_authenticated" on public.team;
create policy "team_select_authenticated"
on public.team for select to authenticated
using (
  auth_user_id = auth.uid()
  or portefeuille_id = public.current_portefeuille_id()
  or public.is_super_admin()
);

-- ------------------------------------------------------------
-- 2) CLIENTS
-- ------------------------------------------------------------
drop policy if exists "clients_insert_authenticated_portefeuille" on public.clients;
create policy "clients_insert_authenticated_portefeuille"
on public.clients for insert to authenticated
with check (
  portefeuille_id = public.current_portefeuille_id()
  or public.is_super_admin()
);

drop policy if exists "clients_delete_authenticated_portefeuille" on public.clients;
create policy "clients_delete_authenticated_portefeuille"
on public.clients for delete to authenticated
using (
  portefeuille_id = public.current_portefeuille_id()
  or public.is_super_admin()
);

-- Select/update : version V40 (droits fins par dossier) corrigée —
-- 'admin' rejoint 'expert'/'chef_mission' comme rôle manager à l'intérieur
-- du cabinet, au lieu de bypasser le portefeuille_id.
drop policy if exists "clients_select_authenticated_portefeuille" on public.clients;
create policy "clients_select_authenticated_portefeuille"
on public.clients for select to authenticated
using (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('admin','expert','chef_mission')
      or coalesce(jsonb_array_length(data->'accesDossier'), 0) = 0
      or exists (
        select 1
        from jsonb_array_elements(coalesce(data->'accesDossier','[]'::jsonb)) a
        where a->>'teamId' = public.current_team_id()
      )
      or data->>'collab' = (select t.nom from public.team t where t.id::text = public.current_team_id())
      or data->>'expert' = (select t.nom from public.team t where t.id::text = public.current_team_id())
      or data->>'chefMission' = (select t.nom from public.team t where t.id::text = public.current_team_id())
      or data->>'gestionnairePaie' = (select t.nom from public.team t where t.id::text = public.current_team_id())
    )
  )
);

drop policy if exists "clients_update_authenticated_portefeuille" on public.clients;
create policy "clients_update_authenticated_portefeuille"
on public.clients for update to authenticated
using (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('admin','expert','chef_mission')
      or coalesce(jsonb_array_length(data->'accesDossier'), 0) = 0
      or exists (
        select 1
        from jsonb_array_elements(coalesce(data->'accesDossier','[]'::jsonb)) a
        where a->>'teamId' = public.current_team_id() and coalesce(a->>'level','lecture') = 'modification'
      )
      or data->>'collab' = (select t.nom from public.team t where t.id::text = public.current_team_id())
    )
  )
)
with check (
  portefeuille_id = public.current_portefeuille_id()
  or public.is_super_admin()
);

-- ------------------------------------------------------------
-- 3) PORTEFEUILLES (cabinets) — créer/résilier un cabinet est une action
--    plateforme : réservée au Super Admin. Un admin de cabinet peut
--    seulement mettre à jour les infos DU SIEN.
-- ------------------------------------------------------------
drop policy if exists "portefeuilles_insert_admin" on public.portefeuilles;
create policy "portefeuilles_insert_admin"
on public.portefeuilles for insert to authenticated
with check (public.is_super_admin());

drop policy if exists "portefeuilles_update_admin" on public.portefeuilles;
create policy "portefeuilles_update_admin"
on public.portefeuilles for update to authenticated
using (
  public.is_super_admin()
  or (public.current_team_role() = 'admin' and id = public.current_portefeuille_id())
)
with check (
  public.is_super_admin()
  or (public.current_team_role() = 'admin' and id = public.current_portefeuille_id())
);

drop policy if exists "portefeuilles_delete_admin" on public.portefeuilles;
create policy "portefeuilles_delete_admin"
on public.portefeuilles for delete to authenticated
using (public.is_super_admin());

-- ------------------------------------------------------------
-- 4) CLIENT_ALERTS
-- ------------------------------------------------------------
drop policy if exists client_alerts_select_portefeuille on public.client_alerts;
drop policy if exists client_alerts_insert_portefeuille on public.client_alerts;
drop policy if exists client_alerts_update_portefeuille on public.client_alerts;
drop policy if exists client_alerts_delete_portefeuille on public.client_alerts;
create policy client_alerts_select_portefeuille on public.client_alerts for select to authenticated using (portefeuille_id = public.current_portefeuille_id() or public.is_super_admin());
create policy client_alerts_insert_portefeuille on public.client_alerts for insert to authenticated with check (portefeuille_id = public.current_portefeuille_id() or public.is_super_admin());
create policy client_alerts_update_portefeuille on public.client_alerts for update to authenticated using (portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()) with check (portefeuille_id = public.current_portefeuille_id() or public.is_super_admin());
create policy client_alerts_delete_portefeuille on public.client_alerts for delete to authenticated using (portefeuille_id = public.current_portefeuille_id() or public.is_super_admin());

-- ------------------------------------------------------------
-- 5) TVA — toutes les tables liées à un client, isolation via
--    clients.portefeuille_id. On retire le bypass 'admin' global :
--    le portefeuille_id du client suffit à couvrir un admin sur SON cabinet.
-- ------------------------------------------------------------
drop policy if exists tva_declarations_portefeuille on public.tva_declarations;
create policy tva_declarations_portefeuille
on public.tva_declarations for all to authenticated
using (
  exists (select 1 from public.clients c where c.id = tva_declarations.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.clients c where c.id = tva_declarations.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

drop policy if exists tva_rules_portefeuille on public.tva_rules;
create policy tva_rules_portefeuille
on public.tva_rules for all to authenticated
using (
  exists (select 1 from public.clients c where c.id = tva_rules.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.clients c where c.id = tva_rules.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

drop policy if exists tva_keyword_rules_portefeuille on public.tva_keyword_rules;
create policy tva_keyword_rules_portefeuille
on public.tva_keyword_rules for all to authenticated
using (
  exists (select 1 from public.clients c where c.id = tva_keyword_rules.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.clients c where c.id = tva_keyword_rules.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

drop policy if exists tva_transactions_portefeuille on public.tva_transactions;
create policy tva_transactions_portefeuille
on public.tva_transactions for all to authenticated
using (
  exists (select 1 from public.tva_declarations d join public.clients c on c.id = d.client_id
    where d.id = tva_transactions.declaration_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.tva_declarations d join public.clients c on c.id = d.client_id
    where d.id = tva_transactions.declaration_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

drop policy if exists tva_sources_portefeuille on public.tva_sources;
create policy tva_sources_portefeuille
on public.tva_sources for all to authenticated
using (
  exists (select 1 from public.clients c where c.id = tva_sources.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.clients c where c.id = tva_sources.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

drop policy if exists tva_acomptes_portefeuille on public.tva_acomptes;
create policy tva_acomptes_portefeuille
on public.tva_acomptes for all to authenticated
using (
  exists (select 1 from public.clients c where c.id = tva_acomptes.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.clients c where c.id = tva_acomptes.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

drop policy if exists annual_archives_portefeuille on public.annual_archives;
create policy annual_archives_portefeuille
on public.annual_archives for all to authenticated
using (
  exists (select 1 from public.clients c where c.id = annual_archives.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
)
with check (
  exists (select 1 from public.clients c where c.id = annual_archives.client_id
    and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
);

-- Tables optionnelles (V4/V5) : ne toucher que si elles existent.
do $$
begin
  if to_regclass('public.tva_audit_versions') is not null then
    execute 'drop policy if exists tva_audit_portefeuille on public.tva_audit_versions';
    execute $policy$
      create policy tva_audit_portefeuille
      on public.tva_audit_versions for all to authenticated
      using (
        exists (select 1 from public.tva_declarations d join public.clients c on c.id = d.client_id
          where d.id = tva_audit_versions.declaration_id
          and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
      )
      with check (
        exists (select 1 from public.tva_declarations d join public.clients c on c.id = d.client_id
          where d.id = tva_audit_versions.declaration_id
          and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
      )
    $policy$;
  end if;

  if to_regclass('public.tva_operation_rules') is not null then
    execute 'drop policy if exists tva_operation_portefeuille on public.tva_operation_rules';
    execute $policy$
      create policy tva_operation_portefeuille
      on public.tva_operation_rules for all to authenticated
      using (
        exists (select 1 from public.clients c where c.id = tva_operation_rules.client_id
          and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
      )
      with check (
        exists (select 1 from public.clients c where c.id = tva_operation_rules.client_id
          and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
      )
    $policy$;
  end if;

  if to_regclass('public.tva_declaration_mappings') is not null then
    execute 'drop policy if exists tva_mapping_portefeuille on public.tva_declaration_mappings';
    execute $policy$
      create policy tva_mapping_portefeuille
      on public.tva_declaration_mappings for all to authenticated
      using (
        exists (select 1 from public.tva_declarations d join public.clients c on c.id = d.client_id
          where d.id = tva_declaration_mappings.declaration_id
          and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
      )
      with check (
        exists (select 1 from public.tva_declarations d join public.clients c on c.id = d.client_id
          where d.id = tva_declaration_mappings.declaration_id
          and (c.portefeuille_id = public.current_portefeuille_id() or public.is_super_admin()))
      )
    $policy$;
  end if;
end $$;

-- ============================================================
-- Non traité volontairement : supabase/novacab-v36-sector-kpis.sql
-- (table sector_kpis, policy sector_kpis_manage_admin). Cette table n'a
-- PAS de portefeuille_id : ce sont des benchmarks sectoriels partagés par
-- tous les cabinets, donc "admin = accès global" est un choix assumé, pas
-- une fuite de données client. Décision produit à confirmer : voulez-vous
-- que seul le Super Admin puisse éditer ces benchmarks globaux, ou que
-- chaque admin de cabinet le puisse aussi (impact : un admin d'un cabinet
-- peut modifier une donnée vue par tous les autres cabinets) ?
-- ============================================================
