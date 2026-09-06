-- NOVACAB V49 — notification des demandes métier → administration
-- Complément de V47 : une demande saisie par un collaborateur/chef/paie
-- notifie les Admin/Experts du portefeuille.

create or replace function public.notify_new_administration_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  manager record;
  actor text := coalesce(new.created_by, auth.uid()::text);
begin
  for manager in
    select id, auth_user_id
    from public.team
    where portefeuille_id = new.portefeuille_id
      and role in ('admin','expert')
      and statut = 'actif'
      and auth_user_id is not null
      and auth_user_id::text <> actor
  loop
    insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
    values (
      gen_random_uuid(),
      new.portefeuille_id,
      manager.auth_user_id::text,
      'administration_request',
      coalesce(new.title, 'Nouvelle demande à l’administration'),
      left(coalesce(new.description, ''), 240),
      jsonb_build_object('view','administration','clientId',new.client_id,'requestId',new.id),
      'administration-request:' || new.id::text || ':' || manager.auth_user_id::text
    )
    on conflict (portefeuille_id, dedupe_key) where dedupe_key is not null do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_administration_request on public.administration_requests;
create trigger trg_notify_new_administration_request
after insert on public.administration_requests
for each row execute function public.notify_new_administration_request();
