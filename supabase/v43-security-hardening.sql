-- ============================================================
-- NOVACAB V43 — Durcissement sécurité : tables sans RLS
-- ============================================================
-- Constat d'audit (RLS) :
--  1) supabase/novacab-v2-administration.sql crée 9 tables
--     (admin_invoices, admin_tools, admin_rejects,
--     admin_mission_checklists, admin_reminders,
--     admin_reminder_history, admin_costs, admin_contracts,
--     admin_licenses, admin_audit_log) SANS jamais activer RLS
--     ni créer de policy. Aucun fichier ultérieur ne les corrige.
--  2) supabase/novacab-v31.sql crée `automation_rules` sans RLS
--     (contrairement à sa table sœur `automation_runs`, elle,
--     correctement scopée dans supabase-product-finish-migration.sql).
--  3) Les colonnes portefeuille_id de ces 9 tables admin_* ont été
--     déclarées en `uuid`, alors que partout ailleurs dans le schéma
--     (team, clients, tasks, client_alerts, automation_runs...)
--     portefeuille_id est du type `text`. On caste donc explicitement
--     dans les policies pour rester compatible sans avoir à modifier
--     le type de colonne (opération plus invasive, à faire séparément
--     si vous préférez l'homogénéiser).
--
-- Prérequis AVANT d'exécuter ce fichier :
--  - v41-fix-admin-cabinet-scope.sql doit déjà être appliqué
--    (ce script réutilise telles quelles les fonctions
--    public.current_portefeuille_id(), public.current_team_role()
--    et public.is_super_admin() sans les redéfinir).
--  - Voir aussi `supabase/_export-critical-security-functions.sql`
--    fourni à part : à exécuter en premier pour committer enfin la
--    définition réelle de is_super_admin() / is_current_user_active()
--    / is_current_user_cabinet_manager(), introuvable dans le code
--    versionné à ce jour.
--
-- Principe retenu (conforme au commentaire d'origine du fichier V2) :
--   - super_admin : accès plateforme complet ;
--   - admin / expert du cabinet : accès complet, mais UNIQUEMENT sur
--     leur propre portefeuille_id (jamais un bypass global) ;
--   - collaborateur / gestionnaire_paie : aucun accès à ces tables.
-- ============================================================

-- ------------------------------------------------------------
-- 0) Garde-fou : on vérifie que les fonctions requises existent
--    avant d'aller plus loin, pour échouer proprement plutôt que
--    de poser des policies invalides.
-- ------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.current_portefeuille_id()') is null then
    raise exception 'public.current_portefeuille_id() est introuvable — appliquez d''abord les migrations existantes.';
  end if;
  if to_regprocedure('public.current_team_role()') is null then
    raise exception 'public.current_team_role() est introuvable — appliquez d''abord les migrations existantes.';
  end if;
  if to_regprocedure('public.is_super_admin()') is null then
    raise exception 'public.is_super_admin() est introuvable dans cette base. Exportez-la et committez-la avant de continuer (voir en-tête de ce fichier).';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) AUTOMATION_RULES (novacab-v31.sql) — jamais scopée.
-- ------------------------------------------------------------
alter table public.automation_rules enable row level security;

drop policy if exists automation_rules_cabinet on public.automation_rules;
create policy automation_rules_cabinet
on public.automation_rules for all to authenticated
using (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and public.current_team_role() in ('admin', 'expert', 'chef_mission')
  )
)
with check (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and public.current_team_role() in ('admin', 'expert', 'chef_mission')
  )
);

-- ------------------------------------------------------------
-- 2) TABLES ADMINISTRATION (novacab-v2-administration.sql)
--    CRUD complet pour admin/expert/chef_mission de leur propre
--    cabinet, ou super_admin. Rien pour les autres rôles.
-- ------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'admin_invoices',
    'admin_tools',
    'admin_rejects',
    'admin_mission_checklists',
    'admin_reminders',
    'admin_costs',
    'admin_contracts',
    'admin_licenses'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_cabinet on public.%I', t, t);
    execute format($f$
      create policy %I_cabinet
      on public.%I for all to authenticated
      using (
        public.is_super_admin()
        or (
          portefeuille_id::text = public.current_portefeuille_id()
          and public.current_team_role() in ('admin','expert','chef_mission')
        )
      )
      with check (
        public.is_super_admin()
        or (
          portefeuille_id::text = public.current_portefeuille_id()
          and public.current_team_role() in ('admin','expert','chef_mission')
        )
      )
    $f$, t, t);
  end loop;
end $$;

-- admin_reminder_history : journal d'historique, ajout et lecture
-- seulement (pas d'update/delete, cohérent avec un usage d'audit).
alter table public.admin_reminder_history enable row level security;

drop policy if exists admin_reminder_history_select on public.admin_reminder_history;
create policy admin_reminder_history_select
on public.admin_reminder_history for select to authenticated
using (
  public.is_super_admin()
  or (
    portefeuille_id::text = public.current_portefeuille_id()
    and public.current_team_role() in ('admin','expert','chef_mission')
  )
);

drop policy if exists admin_reminder_history_insert on public.admin_reminder_history;
create policy admin_reminder_history_insert
on public.admin_reminder_history for insert to authenticated
with check (
  public.is_super_admin()
  or (
    portefeuille_id::text = public.current_portefeuille_id()
    and public.current_team_role() in ('admin','expert','chef_mission')
  )
);

-- admin_audit_log : journal d'audit — lecture par les managers du
-- cabinet, écriture (insert) ouverte à tout collaborateur actif de
-- son cabinet (pour tracer ses propres actions), mais AUCUNE
-- modification ni suppression : un journal d'audit ne doit pas
-- pouvoir être réécrit, même par un admin de cabinet.
alter table public.admin_audit_log enable row level security;

drop policy if exists admin_audit_log_select on public.admin_audit_log;
create policy admin_audit_log_select
on public.admin_audit_log for select to authenticated
using (
  public.is_super_admin()
  or (
    portefeuille_id::text = public.current_portefeuille_id()
    and public.current_team_role() in ('admin','expert','chef_mission')
  )
);

drop policy if exists admin_audit_log_insert on public.admin_audit_log;
create policy admin_audit_log_insert
on public.admin_audit_log for insert to authenticated
with check (
  public.is_super_admin()
  or portefeuille_id::text = public.current_portefeuille_id()
);

-- Volontairement : aucune policy update/delete sur admin_audit_log.
-- Seul un accès direct (service_role, hors RLS) pourra purger ce
-- journal si une politique de conservation légale l'exige.

-- ============================================================
-- Décision produit à trancher (non traitée ici, comme documenté
-- par v41 lui-même) : la table `sector_kpis` reste éditable par
-- TOUT admin de cabinet (bypass global assumé car donnée partagée
-- entre cabinets, pas une donnée client). Si vous voulez restreindre
-- l'édition au seul Super Admin, dites-le moi et j'ajoute la policy.
-- ============================================================
