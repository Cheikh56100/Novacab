-- NOVACAB V42 — Tickets internes (collab/expert/chef_mission <-> admin)
-- À exécuter après v41-fix-admin-cabinet-scope.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tables
-- ------------------------------------------------------------
create table if not exists public.internal_tickets (
  id uuid primary key default gen_random_uuid(),
  portefeuille_id text not null,
  created_by text not null references public.team(id),
  assigned_to text references public.team(id),
  subject text not null,
  category text not null default 'general', -- 'general','rh','materiel','client','it','autre'
  priority text not null default 'normale' check (priority in ('basse','normale','haute','urgente')),
  status text not null default 'ouvert' check (status in ('ouvert','en_cours','resolu','ferme')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.internal_tickets(id) on delete cascade,
  author_id text not null references public.team(id),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists internal_tickets_portefeuille_status_idx
  on public.internal_tickets(portefeuille_id, status, updated_at desc);
create index if not exists internal_tickets_created_by_idx on public.internal_tickets(created_by);
create index if not exists internal_ticket_messages_ticket_idx on public.internal_ticket_messages(ticket_id, created_at);

alter table public.internal_tickets enable row level security;
alter table public.internal_ticket_messages enable row level security;
grant select, insert, update on public.internal_tickets to authenticated;
grant select, insert on public.internal_ticket_messages to authenticated;

-- ------------------------------------------------------------
-- 2) RLS — un salarié voit ses propres tickets ; un manager
--    (admin/expert/chef_mission) voit tous les tickets DE SON CABINET ;
--    le Super Admin voit tout.
-- ------------------------------------------------------------
drop policy if exists internal_tickets_select on public.internal_tickets;
create policy internal_tickets_select on public.internal_tickets for select to authenticated
using (
  created_by = public.current_team_id()
  or assigned_to = public.current_team_id()
  or (portefeuille_id = public.current_portefeuille_id() and public.current_team_role() in ('admin','expert','chef_mission'))
  or public.is_super_admin()
);

-- Pas d'insert/update direct depuis le client : tout passe par les RPC ci-dessous,
-- qui vérifient le cabinet et journalisent proprement.
drop policy if exists internal_tickets_no_direct_write on public.internal_tickets;
create policy internal_tickets_no_direct_write on public.internal_tickets for insert to authenticated with check (false);
drop policy if exists internal_tickets_no_direct_update on public.internal_tickets;
create policy internal_tickets_no_direct_update on public.internal_tickets for update to authenticated using (false);

drop policy if exists internal_ticket_messages_select on public.internal_ticket_messages;
create policy internal_ticket_messages_select on public.internal_ticket_messages for select to authenticated
using (
  exists (
    select 1 from public.internal_tickets t
    where t.id = internal_ticket_messages.ticket_id
      and (
        t.created_by = public.current_team_id()
        or t.assigned_to = public.current_team_id()
        or (t.portefeuille_id = public.current_portefeuille_id() and public.current_team_role() in ('admin','expert','chef_mission'))
        or public.is_super_admin()
      )
  )
);
drop policy if exists internal_ticket_messages_no_direct_write on public.internal_ticket_messages;
create policy internal_ticket_messages_no_direct_write on public.internal_ticket_messages for insert to authenticated with check (false);

-- ------------------------------------------------------------
-- 3) RPC — créer un ticket (collab -> admin, ou admin -> collab via assigned_to)
-- ------------------------------------------------------------
create or replace function public.create_internal_ticket(
  p_subject text,
  p_message text,
  p_category text default 'general',
  p_priority text default 'normale',
  p_assigned_to text default null
) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  v_team_id text;
  v_portefeuille text;
  v_role text;
  v_ticket_id uuid;
begin
  select t.id, t.portefeuille_id, t.role into v_team_id, v_portefeuille, v_role
  from public.team t where t.auth_user_id = auth.uid() and t.statut = 'actif' limit 1;

  if v_team_id is null then raise exception 'Profil équipe introuvable'; end if;
  if btrim(coalesce(p_subject,'')) = '' then raise exception 'Sujet requis'; end if;
  if btrim(coalesce(p_message,'')) = '' then raise exception 'Message requis'; end if;

  -- Si assigné explicitement, il doit appartenir au même cabinet.
  if p_assigned_to is not null and not exists (
    select 1 from public.team t2 where t2.id = p_assigned_to and t2.portefeuille_id = v_portefeuille
  ) then
    raise exception 'Destinataire invalide pour ce cabinet';
  end if;

  insert into public.internal_tickets(portefeuille_id, created_by, assigned_to, subject, category, priority)
  values (v_portefeuille, v_team_id, p_assigned_to, left(p_subject,200), coalesce(p_category,'general'), coalesce(p_priority,'normale'))
  returning id into v_ticket_id;

  insert into public.internal_ticket_messages(ticket_id, author_id, message)
  values (v_ticket_id, v_team_id, p_message);

  -- Notifie : si l'auteur n'est pas manager, on prévient les admins/experts/chefs de mission
  -- de son cabinet ; si l'auteur EST manager, on prévient le destinataire assigné.
  if v_role not in ('admin','expert','chef_mission') then
    insert into public.notifications(portefeuille_id, user_id, type, title, message, action, dedupe_key)
    select v_portefeuille, t3.auth_user_id::text, 'internal_ticket',
      'Nouveau ticket : ' || left(p_subject,120), left(p_message,300),
      jsonb_build_object('ticket_id', v_ticket_id),
      'internal_ticket:new:' || v_ticket_id::text || ':' || t3.id
    from public.team t3
    where t3.portefeuille_id = v_portefeuille and t3.role in ('admin','expert','chef_mission') and t3.statut = 'actif';
  elsif p_assigned_to is not null then
    insert into public.notifications(portefeuille_id, user_id, type, title, message, action, dedupe_key)
    select v_portefeuille, t4.auth_user_id::text, 'internal_ticket',
      'Nouveau ticket : ' || left(p_subject,120), left(p_message,300),
      jsonb_build_object('ticket_id', v_ticket_id),
      'internal_ticket:new:' || v_ticket_id::text || ':' || t4.id
    from public.team t4 where t4.id = p_assigned_to;
  end if;

  perform public.audit_product_event('internal_tickets','create', 'internal_ticket', v_ticket_id::text, jsonb_build_object('subject', p_subject));

  return v_ticket_id;
end $$;
grant execute on function public.create_internal_ticket(text,text,text,text,text) to authenticated;

-- ------------------------------------------------------------
-- 4) RPC — répondre à un ticket
-- ------------------------------------------------------------
create or replace function public.reply_internal_ticket(
  p_ticket_id uuid,
  p_message text
) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  v_team_id text; v_role text; v_ticket public.internal_tickets;
  v_msg_id uuid;
begin
  select t.id, t.role into v_team_id, v_role
  from public.team t where t.auth_user_id = auth.uid() and t.statut = 'actif' limit 1;
  if v_team_id is null then raise exception 'Profil équipe introuvable'; end if;
  if btrim(coalesce(p_message,'')) = '' then raise exception 'Message requis'; end if;

  select * into v_ticket from public.internal_tickets where id = p_ticket_id;
  if v_ticket.id is null then raise exception 'Ticket introuvable'; end if;

  if not (
    v_ticket.created_by = v_team_id
    or v_ticket.assigned_to = v_team_id
    or (v_ticket.portefeuille_id = public.current_portefeuille_id() and v_role in ('admin','expert','chef_mission'))
    or public.is_super_admin()
  ) then
    raise exception 'Accès refusé à ce ticket';
  end if;

  insert into public.internal_ticket_messages(ticket_id, author_id, message)
  values (p_ticket_id, v_team_id, p_message) returning id into v_msg_id;

  update public.internal_tickets
    set updated_at = now(), status = case when status = 'ferme' then 'ouvert' else status end
    where id = p_ticket_id;

  -- Notifie l'autre camp : si le créateur répond, on prévient les managers du cabinet ;
  -- si un manager répond, on prévient le créateur.
  if v_team_id = v_ticket.created_by then
    insert into public.notifications(portefeuille_id, user_id, type, title, message, action, dedupe_key)
    select v_ticket.portefeuille_id, t3.auth_user_id::text, 'internal_ticket',
      'Réponse sur le ticket : ' || left(v_ticket.subject,120), left(p_message,300),
      jsonb_build_object('ticket_id', p_ticket_id),
      'internal_ticket:msg:' || v_msg_id::text || ':' || t3.id
    from public.team t3
    where t3.portefeuille_id = v_ticket.portefeuille_id and t3.role in ('admin','expert','chef_mission') and t3.statut='actif';
  else
    insert into public.notifications(portefeuille_id, user_id, type, title, message, action, dedupe_key)
    select v_ticket.portefeuille_id, t4.auth_user_id::text, 'internal_ticket',
      'Réponse sur le ticket : ' || left(v_ticket.subject,120), left(p_message,300),
      jsonb_build_object('ticket_id', p_ticket_id),
      'internal_ticket:msg:' || v_msg_id::text || ':' || t4.id
    from public.team t4 where t4.id = v_ticket.created_by;
  end if;

  perform public.audit_product_event('internal_tickets','reply', 'internal_ticket', p_ticket_id::text, '{}'::jsonb);
  return v_msg_id;
end $$;
grant execute on function public.reply_internal_ticket(uuid,text) to authenticated;

-- ------------------------------------------------------------
-- 5) RPC — changer le statut (réservé aux managers du cabinet + Super Admin)
-- ------------------------------------------------------------
create or replace function public.update_internal_ticket_status(
  p_ticket_id uuid,
  p_status text
) returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_role text; v_ticket public.internal_tickets;
begin
  if p_status not in ('ouvert','en_cours','resolu','ferme') then raise exception 'Statut invalide'; end if;
  select * into v_ticket from public.internal_tickets where id = p_ticket_id;
  if v_ticket.id is null then raise exception 'Ticket introuvable'; end if;

  select t.role into v_role from public.team t where t.auth_user_id = auth.uid() and t.statut='actif' limit 1;

  if not (
    (v_ticket.portefeuille_id = public.current_portefeuille_id() and v_role in ('admin','expert','chef_mission'))
    or public.is_super_admin()
  ) then
    raise exception 'Seuls les managers du cabinet peuvent changer le statut';
  end if;

  update public.internal_tickets set status = p_status, updated_at = now() where id = p_ticket_id;
  perform public.audit_product_event('internal_tickets','status_change', 'internal_ticket', p_ticket_id::text, jsonb_build_object('status', p_status));
end $$;
grant execute on function public.update_internal_ticket_status(uuid,text) to authenticated;

-- Realtime, comme pour notifications/cabinet_product_states.
do $$ begin
  alter publication supabase_realtime add table public.internal_tickets;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.internal_ticket_messages;
exception when duplicate_object then null; end $$;
