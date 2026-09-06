-- NOVACAB V46 — Raccordements métier → Administration
-- Les événements saisis par un collaborateur dans un dossier créent une
-- notification sécurisée pour les comptes Admin / Expert du cabinet.
-- La notification est générée côté base afin qu'un collaborateur ne puisse
-- jamais s'auto-attribuer le droit d'écrire dans la boîte d'un autre utilisateur.

create or replace function public.notify_admin_workflow_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cabinet_id text;
  actor_user_id text;
  manager record;
  mission record;
  old_missions jsonb := coalesce(old.data->'missionsExceptionnelles', '[]'::jsonb);
  new_missions jsonb := coalesce(new.data->'missionsExceptionnelles', '[]'::jsonb);
  old_tva jsonb := coalesce(old.data->'tvaMois', '{}'::jsonb);
  new_tva jsonb := coalesce(new.data->'tvaMois', '{}'::jsonb);
  old_entry text;
  new_entry text;
  old_resiliation_active boolean := coalesce((old.data->'resiliation'->>'active')::boolean, false);
  new_resiliation_active boolean := coalesce((new.data->'resiliation'->>'active')::boolean, false);
  old_sortie jsonb := coalesce(old.data->'sortieMission', '{}'::jsonb);
  new_sortie jsonb := coalesce(new.data->'sortieMission', '{}'::jsonb);
  dedupe text;
begin
  cabinet_id := coalesce(new.portefeuille_id, old.portefeuille_id);
  if cabinet_id is null then return new; end if;

  actor_user_id := auth.uid()::text;

  -- 1. Nouvelle mission exceptionnelle.
  for mission in
    select value as mission
    from jsonb_array_elements(case when jsonb_typeof(new_missions) = 'array' then new_missions else '[]'::jsonb end)
  loop
    if not exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(old_missions) = 'array' then old_missions else '[]'::jsonb end) oldm
      where oldm->>'id' = mission.mission->>'id'
    ) then
      for manager in
        select auth_user_id from public.team
        where portefeuille_id = cabinet_id
          and role in ('admin','expert')
          and statut = 'actif'
          and auth_user_id is not null
          and auth_user_id::text <> coalesce(actor_user_id, '')
      loop
        dedupe := format('workflow:mission-exceptionnelle:%s:%s:%s', new.id, coalesce(mission.mission->>'id','new'), manager.auth_user_id);
        insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
        values (
          cabinet_id, manager.auth_user_id::text, 'workflow',
          'Nouvelle mission exceptionnelle à préparer',
          format('%s — %s. Préparez la lettre de mission et le suivi associé.', coalesce(new.data->>'nom', new.id), coalesce(mission.mission->>'type','Mission exceptionnelle')),
          jsonb_build_object('client_id', new.id, 'view', 'missions-exceptionnelles-admin', 'mission_id', mission.mission->>'id'),
          dedupe
        ) on conflict do nothing;
      end loop;
    end if;
  end loop;

  -- 2. Résiliation démarrée.
  if not old_resiliation_active and new_resiliation_active then
    for manager in
      select auth_user_id from public.team
      where portefeuille_id = cabinet_id
        and role in ('admin','expert')
        and statut = 'actif'
        and auth_user_id is not null
        and auth_user_id::text <> coalesce(actor_user_id, '')
    loop
      dedupe := format('workflow:resiliation:%s:%s:%s', new.id, coalesce(new.data->'resiliation'->>'date', to_char(now(),'YYYY-MM-DD')), manager.auth_user_id);
      insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
      values (
        cabinet_id, manager.auth_user_id::text, 'workflow',
        'Nouvelle résiliation à traiter',
        format('%s — résiliation démarrée. Préparez la sortie, les courriers et les contrôles.', coalesce(new.data->>'nom', new.id)),
        jsonb_build_object('client_id', new.id, 'view', 'resiliations-admin'),
        dedupe
      ) on conflict do nothing;
    end loop;
  end if;

  -- 3. Nouvelle entrée de mission (date d'entrée renseignée).
  old_entry := nullif(old.data->>'dateEntreeMission','');
  new_entry := nullif(new.data->>'dateEntreeMission','');
  if old_entry is null and new_entry is not null then
    for manager in
      select auth_user_id from public.team
      where portefeuille_id = cabinet_id
        and role in ('admin','expert')
        and statut = 'actif'
        and auth_user_id is not null
        and auth_user_id::text <> coalesce(actor_user_id, '')
    loop
      dedupe := format('workflow:entree:%s:%s:%s', new.id, new_entry, manager.auth_user_id);
      insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
      values (
        cabinet_id, manager.auth_user_id::text, 'workflow',
        'Nouvelle entrée de mission',
        format('%s — entrée de mission enregistrée le %s. Vérifiez la lettre, les mandats et les accès.', coalesce(new.data->>'nom', new.id), new_entry),
        jsonb_build_object('client_id', new.id, 'view', 'entrees'),
        dedupe
      ) on conflict do nothing;
    end loop;
  end if;

  -- 4. Sortie de mission structurée nouvellement renseignée.
  if (jsonb_typeof(new_sortie) = 'object' and new_sortie <> '{}'::jsonb)
     and (jsonb_typeof(old_sortie) is distinct from 'object' or old_sortie = '{}'::jsonb) then
    for manager in
      select auth_user_id from public.team
      where portefeuille_id = cabinet_id
        and role in ('admin','expert')
        and statut = 'actif'
        and auth_user_id is not null
        and auth_user_id::text <> coalesce(actor_user_id, '')
    loop
      dedupe := format('workflow:sortie:%s:%s:%s', new.id, coalesce(new_sortie->>'date',to_char(now(),'YYYY-MM-DD')), manager.auth_user_id);
      insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
      values (
        cabinet_id, manager.auth_user_id::text, 'workflow',
        'Nouvelle sortie de mission à traiter',
        format('%s — une sortie de mission nécessite une vérification administrative.', coalesce(new.data->>'nom', new.id)),
        jsonb_build_object('client_id', new.id, 'view', 'sorties'),
        dedupe
      ) on conflict do nothing;
    end loop;
  end if;

  -- 5. TVA marquée Fait : l'information remonte au pilotage sans créer de doublon.
  if jsonb_typeof(new_tva) = 'object' then
    for mission in select key, value from jsonb_each_text(new_tva)
    loop
      if upper(coalesce(mission.value,'')) = 'FAIT'
         and upper(coalesce(old_tva->>mission.key,'')) <> 'FAIT' then
        for manager in
          select auth_user_id from public.team
          where portefeuille_id = cabinet_id
            and role in ('admin','expert')
            and statut = 'actif'
            and auth_user_id is not null
            and auth_user_id::text <> coalesce(actor_user_id, '')
        loop
          dedupe := format('workflow:tva:%s:%s:%s', new.id, mission.key, manager.auth_user_id);
          insert into public.notifications(id,portefeuille_id,user_id,type,title,message,action,dedupe_key)
          values (
            cabinet_id, manager.auth_user_id::text, 'workflow',
            'TVA validée par le collaborateur',
            format('%s — TVA %s marquée « Fait ».', coalesce(new.data->>'nom', new.id), mission.key),
            jsonb_build_object('client_id', new.id, 'view', 'tva'),
            dedupe
          ) on conflict do nothing;
        end loop;
      end if;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_clients_admin_workflow_notifications on public.clients;
create trigger trg_clients_admin_workflow_notifications
after update of data on public.clients
for each row
when (old.data is distinct from new.data)
execute function public.notify_admin_workflow_change();

-- Les notifications doivent être disponibles dans Realtime pour les comptes ciblés.
do $$
begin
  alter table public.notifications replica identity full;
exception when others then null;
end $$;
