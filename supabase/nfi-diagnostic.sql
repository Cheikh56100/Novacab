-- Diagnostic NFI/NOVACAB
select auth.uid() as current_auth_user;
select id, nom, email, role, statut, portefeuille_id, auth_user_id from public.team where auth_user_id=auth.uid();
select count(*) as total_clients from public.clients;
select count(*) as total_fec from public.financial_imports;
select * from public.nfi_list_clients();
