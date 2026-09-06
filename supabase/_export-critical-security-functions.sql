-- ============================================================
-- À EXÉCUTER DANS LE SQL EDITOR SUPABASE (lecture seule, sans risque)
-- ============================================================
-- Constat d'audit : is_super_admin(), is_current_user_active() et
-- is_current_user_cabinet_manager() sont utilisées dans au moins 8
-- fichiers SQL du repo, mais leur CREATE FUNCTION n'existe dans
-- AUCUN fichier livré. Soit elles ont été créées à la main dans le
-- SQL Editor et jamais committées, soit elles n'existent pas et une
-- partie de vos policies échouerait sur une base reconstruite from
-- scratch.
--
-- Copiez le résultat de cette requête et collez-le dans un nouveau
-- fichier `supabase/vXX-critical-security-functions.sql` versionné
-- avec le reste du projet. C'est la fondation de toute l'isolation
-- multi-cabinet : elle doit pouvoir être relue et rejouée comme
-- n'importe quel autre code.
-- ============================================================

select
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_super_admin',
    'is_current_user_active',
    'is_current_user_cabinet_manager',
    'current_team_role',
    'current_portefeuille_id',
    'current_cabinet_id',
    'current_cabinet_is_manager',
    'current_team_id'
  )
order by p.proname;

-- ------------------------------------------------------------
-- Vérification complémentaire : current_team_id() est défini à la
-- fois dans supabase-annual-security-migration.sql ET dans
-- supabase/v40-dossier-access-rights.sql (CREATE OR REPLACE). La
-- requête ci-dessus vous montre la version RÉELLEMENT active en
-- base (la dernière exécutée l'emporte) — vérifiez qu'elle
-- correspond bien à celle que vous pensez avoir déployée, puis
-- supprimez la définition en double dans l'un des deux fichiers
-- source pour n'avoir plus qu'une seule source de vérité.
-- ------------------------------------------------------------
