-- ============================================================
-- NOVACAB V45 — RLS finale des parcours Tâches & Juridique
-- ============================================================
-- Objectif : faire correspondre la sécurité DB aux permissions UI
-- vérifiées en V2.2.1.
--
-- Rôles cabinet :
--   admin / expert / chef_mission = management opérationnel
--   collaborateur / gestionnaire_paie = staff métier
--
-- Tâches : tous les membres actifs du cabinet peuvent lire/créer.
--          Un staff ne modifie/termine que ses tâches affectées.
--          Le management peut modifier/archiver/supprimer les tâches
--          du cabinet.
-- Juridique : parcours réservé au management du cabinet.
-- Super Admin conserve son accès plateforme.
--
-- Le script est volontairement conditionnel : il ne crée aucune table
-- et n'échoue pas si une table historique n'existe pas dans une base
-- plus ancienne.
-- ============================================================

-- ------------------------------------------------------------
-- 1) TASKS
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.tasks') is null then
    raise notice 'V45: public.tasks absente — policies tasks ignorées.';
    return;
  end if;

  alter table public.tasks enable row level security;

  drop policy if exists tasks_select_cabinet on public.tasks;
  create policy tasks_select_cabinet
  on public.tasks for select to authenticated
  using (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and coalesce(public.current_team_role(),'') in
        ('admin','expert','chef_mission','collaborateur','gestionnaire_paie')
    )
  );

  drop policy if exists tasks_insert_cabinet on public.tasks;
  create policy tasks_insert_cabinet
  on public.tasks for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and coalesce(public.current_team_role(),'') in
        ('admin','expert','chef_mission','collaborateur','gestionnaire_paie')
    )
  );

  drop policy if exists tasks_update_cabinet on public.tasks;
  create policy tasks_update_cabinet
  on public.tasks for update to authenticated
  using (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and (
        public.current_team_role() in ('admin','expert','chef_mission')
        or exists (
          select 1 from public.team t
          where t.id::text = tasks.responsable_id::text
            and t.auth_user_id = auth.uid()
            and coalesce(t.statut,'actif') = 'actif'
            and t.portefeuille_id = public.current_portefeuille_id()
        )
      )
    )
  )
  with check (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and coalesce(public.current_team_role(),'') in
        ('admin','expert','chef_mission','collaborateur','gestionnaire_paie')
    )
  );

  drop policy if exists tasks_delete_cabinet on public.tasks;
  create policy tasks_delete_cabinet
  on public.tasks for delete to authenticated
  using (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and public.current_team_role() in ('admin','expert','chef_mission')
    )
  );
end $$;

-- ------------------------------------------------------------
-- 2) LEGAL_REQUESTS
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.legal_requests') is null then
    raise notice 'V45: public.legal_requests absente — policies juridique ignorées.';
    return;
  end if;

  alter table public.legal_requests enable row level security;

  drop policy if exists legal_requests_cabinet_select on public.legal_requests;
  create policy legal_requests_cabinet_select
  on public.legal_requests for select to authenticated
  using (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and public.current_team_role() in ('admin','expert','chef_mission')
    )
  );

  drop policy if exists legal_requests_cabinet_insert on public.legal_requests;
  create policy legal_requests_cabinet_insert
  on public.legal_requests for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and public.current_team_role() in ('admin','expert','chef_mission')
    )
  );

  drop policy if exists legal_requests_cabinet_update on public.legal_requests;
  create policy legal_requests_cabinet_update
  on public.legal_requests for update to authenticated
  using (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and public.current_team_role() in ('admin','expert','chef_mission')
    )
  )
  with check (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and public.current_team_role() in ('admin','expert','chef_mission')
    )
  );

  drop policy if exists legal_requests_cabinet_delete on public.legal_requests;
  create policy legal_requests_cabinet_delete
  on public.legal_requests for delete to authenticated
  using (
    public.is_super_admin()
    or (
      portefeuille_id = public.current_portefeuille_id()
      and public.current_team_role() in ('admin','expert','chef_mission')
    )
  );
end $$;
