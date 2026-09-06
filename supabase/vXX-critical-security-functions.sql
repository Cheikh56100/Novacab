function_name,definition
current_cabinet_id,"CREATE OR REPLACE FUNCTION public.current_cabinet_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select portefeuille_id from public.team where auth_user_id=auth.uid() and statut='actif' limit 1
$function$
"
current_cabinet_is_manager,"CREATE OR REPLACE FUNCTION public.current_cabinet_is_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select coalesce(bool_or(role in ('admin','expert','chef_mission')),false)
  from public.team where auth_user_id=auth.uid() and statut='actif'
$function$
"
current_portefeuille_id,"CREATE OR REPLACE FUNCTION public.current_portefeuille_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.portefeuille_id
  from public.team t
  where t.auth_user_id = auth.uid()
    and t.statut = 'actif'
  limit 1;
$function$
"
current_team_id,"CREATE OR REPLACE FUNCTION public.current_team_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.id::text
  FROM public.team t
  WHERE t.auth_user_id = auth.uid()
    AND t.statut = 'actif'
  LIMIT 1;
$function$
"
current_team_role,"CREATE OR REPLACE FUNCTION public.current_team_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.role
  from public.team t
  where t.auth_user_id = auth.uid()
    and t.statut = 'actif'
  limit 1;
$function$
"
is_current_user_active,"CREATE OR REPLACE FUNCTION public.is_current_user_active()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.team t
    WHERE t.auth_user_id = auth.uid()
      AND t.statut = 'actif'
  );
$function$
"
is_current_user_cabinet_manager,"CREATE OR REPLACE FUNCTION public.is_current_user_cabinet_manager(target_portefeuille_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.team t
      WHERE t.auth_user_id = auth.uid()
        AND t.statut = 'actif'
        AND t.portefeuille_id = target_portefeuille_id
    );
$function$
"
is_super_admin,"CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.team t
    WHERE t.auth_user_id = auth.uid()
      AND t.statut = 'actif'
      AND t.role = 'super_admin'
  );
$function$
"