-- NOVACAB V2.2.1 — archive des demandes + champs finance dossier
-- Les demandes terminées restent dans administration_requests : aucune suppression automatique.
create index if not exists idx_administration_requests_archive
  on public.administration_requests(portefeuille_id, status, completed_at desc);

-- Garantit que la clôture d'une demande conserve une date d'achèvement.
create or replace function public.set_administration_request_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'termine' and (old.status is distinct from 'termine') then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'termine' and old.status = 'termine' then
    new.completed_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_administration_request_completed_at on public.administration_requests;
create trigger trg_administration_request_completed_at
before update on public.administration_requests
for each row execute function public.set_administration_request_completed_at();
