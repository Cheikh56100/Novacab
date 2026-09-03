-- NOVACAB — Super Admin : gestion globale des équipes et validations
-- À exécuter dans Supabase SQL Editor.

DROP POLICY IF EXISTS team_delete_admin_same_portefeuille ON public.team;
DROP POLICY IF EXISTS team_insert_admin_same_portefeuille ON public.team;
DROP POLICY IF EXISTS team_update_admin_same_portefeuille ON public.team;

CREATE POLICY team_delete_admin_same_portefeuille
ON public.team FOR DELETE TO authenticated
USING (public.is_current_user_cabinet_manager(portefeuille_id));

CREATE POLICY team_insert_admin_same_portefeuille
ON public.team FOR INSERT TO authenticated
WITH CHECK (public.is_current_user_cabinet_manager(portefeuille_id));

CREATE POLICY team_update_admin_same_portefeuille
ON public.team FOR UPDATE TO authenticated
USING (public.is_current_user_cabinet_manager(portefeuille_id))
WITH CHECK (public.is_current_user_cabinet_manager(portefeuille_id));
