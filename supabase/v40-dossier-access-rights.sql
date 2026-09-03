-- NOVACAB V40 — migration droits d’accès par dossier
-- À exécuter après les migrations sécurité existantes.
drop policy if exists "clients_select" on public.clients;
drop policy if exists "clients_update" on public.clients;
-- Les données annuelles sont stockées dans clients.data.annualData["YYYY"].
-- Aucune migration SQL des données métier n'est nécessaire : la version web
-- archive automatiquement les champs TVA/social/bilan/IS/CFE/révision à chaque
-- sauvegarde et lors du changement d'exercice.
-- ============================================================

-- ============================================================
-- V40+ — droits d'accès fins par dossier
-- ------------------------------------------------------------
-- Les dossiers peuvent désormais contenir data.accesDossier :
-- [{"teamId":"...","level":"lecture|modification"}]
-- Les managers gardent la visibilité de leur portefeuille ; les
-- collaborateurs non managers ne voient que leurs dossiers affectés
-- ou explicitement autorisés.
-- ============================================================
create or replace function public.current_team_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select t.id::text
  from public.team t
  where t.auth_user_id = auth.uid()
    and t.statut = 'actif'
  limit 1;
$$;

drop policy if exists "clients_select_authenticated_portefeuille" on public.clients;
create policy "clients_select_authenticated_portefeuille"
on public.clients for select to authenticated
using (
  public.current_team_role() = 'admin'
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('expert','chef_mission')
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
  public.current_team_role() = 'admin'
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('expert','chef_mission')
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
  public.current_team_role() = 'admin'
  or portefeuille_id = public.current_portefeuille_id()
);
