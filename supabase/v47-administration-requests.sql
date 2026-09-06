-- NOVACAB V47 — Centre de demandes métier → Administration
-- TVA volontairement absente : elle reste un workflow métier.

create table if not exists public.administration_requests (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text not null,
  client_id text null,
  type text not null,
  title text not null,
  description text not null default '',
  priority text not null default 'normal' check (priority in ('normal','haute','urgente')),
  status text not null default 'a_traiter' check (status in ('a_traiter','en_cours','en_attente','termine')),
  created_by text not null default auth.uid()::text,
  assigned_to text null,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists administration_requests_portefeuille_idx on public.administration_requests(portefeuille_id, created_at desc);
create index if not exists administration_requests_status_idx on public.administration_requests(portefeuille_id, status, priority);
create unique index if not exists administration_requests_dedupe_idx on public.administration_requests(portefeuille_id, dedupe_key) where dedupe_key is not null;

create or replace function public.touch_administration_request()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.status = 'termine' and old.status is distinct from 'termine' and new.completed_at is null then new.completed_at = now(); end if;
  return new;
end; $$;

drop trigger if exists trg_touch_administration_request on public.administration_requests;
create trigger trg_touch_administration_request before update on public.administration_requests for each row execute function public.touch_administration_request();

alter table public.administration_requests enable row level security;

drop policy if exists administration_requests_select on public.administration_requests;
create policy administration_requests_select on public.administration_requests for select using (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and (
      public.current_team_role() in ('admin','expert')
      or created_by = auth.uid()::text
    )
  )
);

drop policy if exists administration_requests_insert on public.administration_requests;
create policy administration_requests_insert on public.administration_requests for insert with check (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and created_by = auth.uid()::text
  )
);

drop policy if exists administration_requests_update on public.administration_requests;
create policy administration_requests_update on public.administration_requests for update using (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and public.current_team_role() in ('admin','expert')
  )
) with check (
  public.is_super_admin()
  or (
    portefeuille_id = public.current_portefeuille_id()
    and public.current_team_role() in ('admin','expert')
  )
);

-- Recrée le raccordement métier → direction sans TVA.
create or replace function public.notify_admin_workflow_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cabinet_id text := coalesce(new.portefeuille_id, old.portefeuille_id);
  actor_user_id text := auth.uid()::text;
  manager record;
  mission record;
  old_missions jsonb := coalesce(old.data->'missionsExceptionnelles', '[]'::jsonb);
  new_missions jsonb := coalesce(new.data->'missionsExceptionnelles', '[]'::jsonb);
  old_entry text := nullif(old.data->>'dateEntreeMission','');
  new_entry text := nullif(new.data->>'dateEntreeMission','');
  old_resiliation_active boolean := coalesce((old.data->'resiliation'->>'active')::boolean, false);
  new_resiliation_active boolean := coalesce((new.data->'resiliation'->>'active')::boolean, false);
  old_sortie jsonb := coalesce(old.data->'sortieMission', '{}'::jsonb);
  new_sortie jsonb := coalesce(new.data->'sortieMission', '{}'::jsonb);
  dedupe text;
begin
  if cabinet_id is null then return new; end if;

  for mission in select value as mission from jsonb_array_elements(case when jsonb_typeof(new_missions)='array' then new_missions else '[]'::jsonb end) loop
    if not exists (select 1 from jsonb_array_elements(case when jsonb_typeof(old_missions)='array' then old_missions else '[]'::jsonb end) oldm where oldm->>'id' = mission.mission->>'id') then
      dedupe := format('mission-exceptionnelle:%s:%s', new.id, coalesce(mission.mission->>'id','new'));
      insert into public.administration_requests(portefeuille_id,client_id,type,title,description,priority,metadata,dedupe_key)
      values (cabinet_id,new.id,'mission_exceptionnelle','Nouvelle mission exceptionnelle',format('%s — %s. Préparez la lettre de mission et le suivi associé.',coalesce(new.data->>'nom',new.id),coalesce(mission.mission->>'type','Mission exceptionnelle')),'haute',jsonb_build_object('mission_id',mission.mission->>'id'),'workflow:'||dedupe)
      on conflict (portefeuille_id,dedupe_key) where dedupe_key is not null do nothing;
      for manager in select auth_user_id from public.team where portefeuille_id=cabinet_id and role in ('admin','expert') and statut='actif' and auth_user_id is not null and auth_user_id::text <> coalesce(actor_user_id,'') loop
        insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
        values(gen_random_uuid(),cabinet_id,manager.auth_user_id::text,'workflow','Nouvelle mission exceptionnelle à préparer',format('%s — %s.',coalesce(new.data->>'nom',new.id),coalesce(mission.mission->>'type','Mission exceptionnelle')),jsonb_build_object('client_id',new.id,'view','missions-exceptionnelles-admin','mission_id',mission.mission->>'id'),'workflow:'||dedupe||':'||manager.auth_user_id)
        on conflict do nothing;
      end loop;
    end if;
  end loop;

  if not old_resiliation_active and new_resiliation_active then
    dedupe := format('resiliation:%s:%s',new.id,coalesce(new.data->'resiliation'->>'date',to_char(now(),'YYYY-MM-DD')));
    insert into public.administration_requests(portefeuille_id,client_id,type,title,description,priority,metadata,dedupe_key)
    values(cabinet_id,new.id,'resiliation','Nouvelle résiliation à traiter',format('%s — préparez la sortie, les courriers et les contrôles.',coalesce(new.data->>'nom',new.id)),'urgente',jsonb_build_object('resiliation',new.data->'resiliation'),'workflow:'||dedupe)
    on conflict (portefeuille_id,dedupe_key) where dedupe_key is not null do nothing;
    for manager in select auth_user_id from public.team where portefeuille_id=cabinet_id and role in ('admin','expert') and statut='actif' and auth_user_id is not null and auth_user_id::text <> coalesce(actor_user_id,'') loop
      insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
      values(gen_random_uuid(),cabinet_id,manager.auth_user_id::text,'workflow','Nouvelle résiliation à traiter',format('%s — résiliation démarrée.',coalesce(new.data->>'nom',new.id)),jsonb_build_object('client_id',new.id,'view','resiliations-admin'),'workflow:'||dedupe||':'||manager.auth_user_id)
      on conflict do nothing;
    end loop;
  end if;

  if old_entry is null and new_entry is not null then
    dedupe := format('entree:%s:%s',new.id,new_entry);
    insert into public.administration_requests(portefeuille_id,client_id,type,title,description,priority,metadata,dedupe_key)
    values(cabinet_id,new.id,'entree_mission','Nouvelle entrée de mission',format('%s — entrée enregistrée le %s. Vérifiez lettre, mandats et accès.',coalesce(new.data->>'nom',new.id),new_entry),'haute',jsonb_build_object('date_entree',new_entry),'workflow:'||dedupe)
    on conflict (portefeuille_id,dedupe_key) where dedupe_key is not null do nothing;
  end if;

  if jsonb_typeof(new_sortie)='object' and new_sortie <> '{}'::jsonb and (jsonb_typeof(old_sortie) is distinct from 'object' or old_sortie = '{}'::jsonb) then
    dedupe := format('sortie:%s:%s',new.id,coalesce(new_sortie->>'date',to_char(now(),'YYYY-MM-DD')));
    insert into public.administration_requests(portefeuille_id,client_id,type,title,description,priority,metadata,dedupe_key)
    values(cabinet_id,new.id,'sortie_mission','Nouvelle sortie de mission à traiter',format('%s — une sortie nécessite une vérification administrative.',coalesce(new.data->>'nom',new.id)),'haute',jsonb_build_object('sortie',new_sortie),'workflow:'||dedupe)
    on conflict (portefeuille_id,dedupe_key) where dedupe_key is not null do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists trg_clients_admin_workflow_notifications on public.clients;
create trigger trg_clients_admin_workflow_notifications after update of data on public.clients for each row when (old.data is distinct from new.data) execute function public.notify_admin_workflow_change();
