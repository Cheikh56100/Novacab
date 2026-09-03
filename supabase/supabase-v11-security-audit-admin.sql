-- ============================================================
-- NOVACAB V11 — JOURNAL D'AUDIT SÉCURITÉ (ADMIN + SUPER ADMIN)
-- À exécuter après les migrations RLS existantes.
-- ============================================================

create table if not exists public.security_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  portefeuille_id text,
  actor_auth_user_id uuid,
  actor_team_id uuid,
  actor_name text,
  actor_email text,
  action text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_security_audit_portefeuille_created
  on public.security_audit(portefeuille_id, created_at desc);

alter table public.security_audit enable row level security;

drop policy if exists "security_audit_admin_select" on public.security_audit;
create policy "security_audit_admin_select"
on public.security_audit for select to authenticated
using (
  (public.current_team_role() = 'admin' and portefeuille_id = public.current_portefeuille_id())
  or public.is_super_admin()
);

drop policy if exists "security_audit_no_direct_insert" on public.security_audit;
drop policy if exists "security_audit_no_direct_update" on public.security_audit;
drop policy if exists "security_audit_no_direct_delete" on public.security_audit;

-- Les utilisateurs authentifiés peuvent journaliser un événement via RPC,
-- mais ne peuvent ni lire ni modifier directement le journal.
create or replace function public.record_security_event(
  p_action text,
  p_severity text default 'info',
  p_actor_name text default null,
  p_actor_email text default null,
  p_target_type text default null,
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_portefeuille text;
  v_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_severity not in ('info','warning','critical') then
    raise exception 'Niveau de gravité invalide';
  end if;

  select t.id, t.portefeuille_id
    into v_team_id, v_portefeuille
  from public.team t
  where t.auth_user_id = auth.uid() and t.statut = 'actif'
  limit 1;

  if v_team_id is null then
    raise exception 'Profil équipe introuvable';
  end if;

  insert into public.security_audit(
    portefeuille_id, actor_auth_user_id, actor_team_id, actor_name, actor_email,
    action, severity, target_type, target_id, metadata
  ) values (
    v_portefeuille, auth.uid(), v_team_id, left(p_actor_name, 200), left(p_actor_email, 320),
    left(p_action, 200), p_severity, left(p_target_type, 100), left(p_target_id, 200), coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_security_event(text,text,text,text,text,text,jsonb) from public;
grant execute on function public.record_security_event(text,text,text,text,text,text,jsonb) to authenticated;
revoke all on table public.security_audit from anon;
grant select on table public.security_audit to authenticated;
