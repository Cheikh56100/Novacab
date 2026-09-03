-- NOVACAB — correctif RLS client_alerts
-- À exécuter dans Supabase SQL Editor.
alter table public.client_alerts enable row level security;
drop policy if exists client_alerts_select_portefeuille on public.client_alerts;
drop policy if exists client_alerts_insert_portefeuille on public.client_alerts;
drop policy if exists client_alerts_update_portefeuille on public.client_alerts;
drop policy if exists client_alerts_delete_portefeuille on public.client_alerts;
create policy client_alerts_select_portefeuille on public.client_alerts for select to authenticated using (public.current_team_role() = 'admin' or portefeuille_id = public.current_portefeuille_id());
create policy client_alerts_insert_portefeuille on public.client_alerts for insert to authenticated with check (public.current_team_role() = 'admin' or portefeuille_id = public.current_portefeuille_id());
create policy client_alerts_update_portefeuille on public.client_alerts for update to authenticated using (public.current_team_role() = 'admin' or portefeuille_id = public.current_portefeuille_id()) with check (public.current_team_role() = 'admin' or portefeuille_id = public.current_portefeuille_id());
create policy client_alerts_delete_portefeuille on public.client_alerts for delete to authenticated using (public.current_team_role() = 'admin' or portefeuille_id = public.current_portefeuille_id());
