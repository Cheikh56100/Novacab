-- NOVACAB — Phase finition produit / multi-utilisateur
-- Exécuter après les migrations existantes.

create extension if not exists pgcrypto;

-- Identité cabinet de l'utilisateur connecté (source unique pour les RLS).
create or replace function public.current_cabinet_id()
returns text language sql stable security definer set search_path=public,auth as $$
  select portefeuille_id from public.team where auth_user_id=auth.uid() and statut='actif' limit 1
$$;

create or replace function public.current_cabinet_is_manager()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select coalesce(bool_or(role in ('admin','expert','chef_mission')),false)
  from public.team where auth_user_id=auth.uid() and statut='actif'
$$;

-- Etat produit transitoire: permet de sortir les modules localStorage progressivement
-- sans perdre les écrans existants. Une clé = un module, une ligne = un cabinet.
create table if not exists public.cabinet_product_states (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text not null,
  module_key text not null,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique(portefeuille_id,module_key)
);
alter table public.cabinet_product_states enable row level security;
grant select,insert,update,delete on public.cabinet_product_states to authenticated;
drop policy if exists cabinet_product_states_select on public.cabinet_product_states;
drop policy if exists cabinet_product_states_write on public.cabinet_product_states;
create policy cabinet_product_states_select on public.cabinet_product_states for select to authenticated using (portefeuille_id=current_cabinet_id());
create policy cabinet_product_states_write on public.cabinet_product_states for all to authenticated using (portefeuille_id=current_cabinet_id()) with check (portefeuille_id=current_cabinet_id());

-- Notifications persistantes + déduplication.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text not null,
  user_id text null,
  type text not null default 'info',
  title text not null,
  message text,
  action jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Si la table existait déjà avant cette migration,
-- on ajoute la colonne manquante.
alter table public.notifications
add column if not exists dedupe_key text;

-- Un seul index de déduplication.
create unique index if not exists notifications_dedupe_unique
on public.notifications(portefeuille_id, dedupe_key)
where dedupe_key is not null;
alter table public.notifications enable row level security;
grant select,insert,update,delete on public.notifications to authenticated;
drop policy if exists notifications_cabinet on public.notifications;
create policy notifications_cabinet on public.notifications for all to authenticated using (portefeuille_id=current_cabinet_id()) with check (portefeuille_id=current_cabinet_id());

-- Relances J+7/J+15/J+30/J+45: l'échéancier est généré côté DB, idempotent.
create table if not exists public.automation_runs (
 id uuid primary key default gen_random_uuid(), portefeuille_id text not null, rule_key text not null,
 entity_type text not null, entity_id text not null, status text not null default 'pending',
 scheduled_for date not null, executed_at timestamptz, payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(portefeuille_id,rule_key,entity_type,entity_id)
);
alter table public.automation_runs enable row level security;
grant select,insert,update,delete on public.automation_runs to authenticated;
drop policy if exists automation_runs_cabinet on public.automation_runs;
create policy automation_runs_cabinet on public.automation_runs for all to authenticated using (portefeuille_id=current_cabinet_id()) with check (portefeuille_id=current_cabinet_id());

-- Génère les quatre jalons pour une entité (facture, tâche, dossier, etc.).
create or replace function public.schedule_followups(
 p_portefeuille_id text, p_entity_type text, p_entity_id text, p_anchor_date date, p_payload jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path=public as $$
declare d integer;
begin
 if p_portefeuille_id <> current_cabinet_id() then raise exception 'Accès cabinet refusé'; end if;
 foreach d in array array[7,15,30,45] loop
   insert into public.automation_runs(portefeuille_id,rule_key,entity_type,entity_id,scheduled_for,payload)
   values(p_portefeuille_id,'J+'||d,p_entity_type,p_entity_id,p_anchor_date+d,p_payload)
   on conflict(portefeuille_id,rule_key,entity_type,entity_id) do update set scheduled_for=excluded.scheduled_for,payload=excluded.payload;
 end loop;
end $$;
grant execute on function public.schedule_followups(text,text,text,date,jsonb) to authenticated;

-- Traçabilité minimale commune aux parcours produit.
create table if not exists public.product_audit_log (
 id uuid primary key default gen_random_uuid(), portefeuille_id text not null,
 actor_id uuid references auth.users(id), module_key text not null, action text not null,
 entity_type text, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.product_audit_log enable row level security;
grant select,insert on public.product_audit_log to authenticated;
drop policy if exists product_audit_log_select on public.product_audit_log;
drop policy if exists product_audit_log_insert on public.product_audit_log;
create policy product_audit_log_select on public.product_audit_log for select to authenticated using (portefeuille_id=current_cabinet_id());
create policy product_audit_log_insert on public.product_audit_log for insert to authenticated with check (portefeuille_id=current_cabinet_id());

-- Realtime des états partagés.
do $$ begin
  alter publication supabase_realtime add table public.cabinet_product_states;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- V2.3 — Exécution des automatisations : les jalons échus deviennent des notifications.
-- À appeler via pg_cron / Supabase Cron chaque jour (ou manuellement via RPC).
create or replace function public.process_due_automation_runs(p_limit integer default 500)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare r record; processed integer := 0;
begin
  if auth.uid() is not null and not current_cabinet_is_manager() then
    raise exception 'Accès manager requis';
  end if;
  for r in
    select * from public.automation_runs
    where status='pending' and scheduled_for <= current_date
    order by scheduled_for asc
    limit greatest(1, least(coalesce(p_limit,500),1000))
    for update skip locked
  loop
    insert into public.notifications(portefeuille_id,type,title,message,action,dedupe_key)
    values(
      r.portefeuille_id,
      'followup',
      'Relance ' || r.rule_key || ' à traiter',
      coalesce(r.payload->>'label', r.entity_type || ' #' || r.entity_id),
      jsonb_build_object('entity_type',r.entity_type,'entity_id',r.entity_id,'rule_key',r.rule_key),
      'followup:' || r.portefeuille_id || ':' || r.rule_key || ':' || r.entity_type || ':' || r.entity_id
    ) on conflict (portefeuille_id,dedupe_key) where dedupe_key is not null do nothing;
    update public.automation_runs set status='done', executed_at=now() where id=r.id;
    processed := processed + 1;
  end loop;
  return processed;
end $$;
grant execute on function public.process_due_automation_runs(integer) to authenticated;

-- Versionnement optimiste : évite qu'un ancien onglet écrase silencieusement un état récent.
create or replace function public.save_cabinet_product_state(
  p_module_key text, p_state jsonb, p_expected_version integer default null
) returns table(version integer, updated_at timestamptz)
language plpgsql security definer set search_path=public,auth as $$
declare cid text; v integer;
begin
  cid := current_cabinet_id();
  if cid is null then raise exception 'Cabinet introuvable'; end if;
  insert into public.cabinet_product_states(portefeuille_id,module_key,state,version,updated_at,updated_by)
  values(cid,p_module_key,p_state,1,now(),auth.uid())
  on conflict(portefeuille_id,module_key) do update set
    state = excluded.state,
    version = public.cabinet_product_states.version + 1,
    updated_at = now(), updated_by = auth.uid()
  where p_expected_version is null or public.cabinet_product_states.version = p_expected_version
  returning cabinet_product_states.version,cabinet_product_states.updated_at into v,updated_at;
  if v is null then raise exception 'Conflit de version: actualisez les données'; end if;
  return query select v, now();
end $$;
grant execute on function public.save_cabinet_product_state(text,jsonb,integer) to authenticated;

-- V2.4 — Finition produit : notifications ciblées, audit des parcours et garde-fous.
alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id text;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();
create index if not exists notifications_cabinet_unread_idx on public.notifications(portefeuille_id, read_at, created_at desc);
create index if not exists product_audit_cabinet_module_idx on public.product_audit_log(portefeuille_id,module_key,created_at desc);
create index if not exists automation_due_idx on public.automation_runs(status,scheduled_for);

-- Une notification privée n'est visible que par son destinataire; les notifications cabinet restent partagées.
drop policy if exists notifications_cabinet on public.notifications;
create policy notifications_cabinet_select on public.notifications for select to authenticated
using (portefeuille_id=current_cabinet_id() and (user_id is null or user_id::text=auth.uid()::text));
create policy notifications_cabinet_insert on public.notifications for insert to authenticated
with check (portefeuille_id=current_cabinet_id());
create policy notifications_cabinet_update on public.notifications for update to authenticated
using (portefeuille_id=current_cabinet_id() and (user_id is null or user_id::text=auth.uid()::text))
with check (portefeuille_id=current_cabinet_id());
create policy notifications_cabinet_delete on public.notifications for delete to authenticated
using (portefeuille_id=current_cabinet_id() and current_cabinet_is_manager());

create or replace function public.audit_product_event(
  p_module_key text,p_action text,p_entity_type text default null,p_entity_id text default null,p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path=public,auth as $$
declare cid text; begin cid:=current_cabinet_id(); if cid is null then raise exception 'Cabinet introuvable'; end if;
insert into public.product_audit_log(portefeuille_id,actor_id,module_key,action,entity_type,entity_id,metadata)
values(cid,auth.uid(),p_module_key,p_action,p_entity_type,p_entity_id,coalesce(p_metadata,'{}'::jsonb)); end $$;
grant execute on function public.audit_product_event(text,text,text,text,jsonb) to authenticated;

-- Fonction de lecture pour le centre de notifications.
create or replace function public.unread_notification_count() returns integer language sql stable security definer set search_path=public,auth as $$
 select count(*)::integer from public.notifications n where n.portefeuille_id=current_cabinet_id() and n.read_at is null and (n.user_id is null or n.user_id::text=auth.uid()::text)
$$;
grant execute on function public.unread_notification_count() to authenticated;
