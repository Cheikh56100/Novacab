-- NOVACAB — migration sécurité des accès organismes sociaux
-- Les secrets ne sont plus stockés en clair. La clé de chiffrement est lue
-- depuis Supabase Vault (secret nommé "novacab_social_access_key").
--
-- PRÉREQUIS :
-- 1. Vault est disponible sur les projets Supabase ; la migration crée
--    automatiquement une clé aléatoire de 32 octets (64 caractères hex)
--    si le secret n'existe pas encore.
-- 2. Ne jamais mettre cette clé dans le frontend, Git ou un fichier .env client.
--
-- Après migration, l'application ne lit plus directement la table :
-- elle passe par les fonctions RPC ci-dessous, qui conservent les contrôles RLS.

create extension if not exists pgcrypto;
create extension if not exists supabase_vault with schema vault;

-- Supabase peut installer pgcrypto dans le schéma extensions. On inclut
-- les deux emplacements possibles afin que les fonctions pgp_* soient
-- résolues même si l'extension existait déjà avant cette migration.
set search_path = public, extensions, vault;

-- Crée automatiquement la clé si elle n'existe pas encore.
-- Si une clé existe déjà mais est trop courte, on n'écrase rien :
-- la migration s'arrêtera explicitement afin d'éviter une perte d'accès
-- aux données déjà chiffrées.
do $$
declare
  existing_key text;
begin
  select decrypted_secret
    into existing_key
  from vault.decrypted_secrets
  where name = 'novacab_social_access_key'
  limit 1;

  if existing_key is null then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'novacab_social_access_key',
      'Clé de chiffrement AES-256 des accès organismes sociaux NOVACAB'
    );
  elsif length(existing_key) < 32 then
    raise exception 'Clé Vault novacab_social_access_key existante trop courte (>= 32 caractères requises).';
  end if;
end $$;

alter table if exists public.acces_organismes_sociaux
  add column if not exists secret_encrypted bytea;

do $$
declare
  encryption_key text;
begin
  select decrypted_secret into encryption_key
  from vault.decrypted_secrets
  where name = 'novacab_social_access_key'
  limit 1;

  if encryption_key is null or length(encryption_key) < 32 then
    raise exception 'Clé Vault novacab_social_access_key absente ou trop courte (>= 32 caractères requises).';
  end if;

  update public.acces_organismes_sociaux
  set secret_encrypted = pgp_sym_encrypt(coalesce(secret, ''), encryption_key, 'cipher-algo=aes256')
  where secret_encrypted is null;
end $$;

alter table if exists public.acces_organismes_sociaux
  drop column if exists secret;

alter table if exists public.acces_organismes_sociaux
  rename column secret_encrypted to secret;

alter table if exists public.acces_organismes_sociaux
  alter column secret set default null;

-- Le champ chiffré ne doit jamais être exposé directement à l'API.
revoke select (secret) on public.acces_organismes_sociaux from anon, authenticated;

create or replace function public._novacab_social_key()
returns text
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  k text;
begin
  select decrypted_secret into k
  from vault.decrypted_secrets
  where name = 'novacab_social_access_key'
  limit 1;

  if k is null or length(k) < 32 then
    raise exception 'Clé Vault novacab_social_access_key absente ou invalide.';
  end if;
  return k;
end;
$$;

revoke all on function public._novacab_social_key() from public, anon, authenticated;

create or replace function public._novacab_social_allowed(p_portefeuille_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team t
    where t.auth_user_id::text = auth.uid()::text
      and t.statut = 'actif'
      and t.role in ('admin', 'expert', 'chef_mission')
      and t.portefeuille_id = p_portefeuille_id
  );
$$;

create or replace function public.list_acces_organismes_sociaux(
  p_portefeuille_id text,
  p_client_id text default null
)
returns table (
  id uuid,
  portefeuille_id text,
  client_id text,
  organisme text,
  libelle text,
  identifiant text,
  secret text,
  siret text,
  note text,
  created_by text,
  updated_by text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
begin
  if not public._novacab_social_allowed(p_portefeuille_id) then
    raise exception 'Accès refusé';
  end if;

  return query
  select a.id, a.portefeuille_id, a.client_id, a.organisme, a.libelle,
         a.identifiant,
         case when a.secret is null then '' else pgp_sym_decrypt(a.secret, public._novacab_social_key()) end,
         a.siret, a.note, a.created_by, a.updated_by, a.created_at, a.updated_at
  from public.acces_organismes_sociaux a
  where a.portefeuille_id = p_portefeuille_id
    and (p_client_id is null or a.client_id = p_client_id)
  order by a.client_id, a.organisme;
end;
$$;

create or replace function public.create_acces_organisme_social(
  p_portefeuille_id text, p_client_id text, p_organisme text default 'Autre',
  p_libelle text default '', p_identifiant text default '', p_secret text default '',
  p_siret text default '', p_note text default '', p_created_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  new_id uuid;
begin
  if not public._novacab_social_allowed(p_portefeuille_id) then raise exception 'Accès refusé'; end if;
  insert into public.acces_organismes_sociaux
    (portefeuille_id, client_id, organisme, libelle, identifiant, secret, siret, note, created_by)
  values
    (p_portefeuille_id, p_client_id, p_organisme, p_libelle, p_identifiant,
     pgp_sym_encrypt(coalesce(p_secret, ''), public._novacab_social_key(), 'cipher-algo=aes256'),
     p_siret, p_note, p_created_by)
  returning id into new_id;

  return (select jsonb_build_object(
    'id', a.id, 'portefeuille_id', a.portefeuille_id, 'client_id', a.client_id,
    'organisme', a.organisme, 'libelle', a.libelle, 'identifiant', a.identifiant,
    'secret', pgp_sym_decrypt(a.secret, public._novacab_social_key()),
    'siret', a.siret, 'note', a.note, 'created_by', a.created_by,
    'updated_by', a.updated_by, 'created_at', a.created_at, 'updated_at', a.updated_at
  ) from public.acces_organismes_sociaux a where a.id = new_id);
end;
$$;

create or replace function public.update_acces_organisme_social(
  p_id uuid, p_organisme text, p_libelle text, p_identifiant text, p_secret text,
  p_siret text, p_note text, p_updated_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  portefeuille text;
begin
  select portefeuille_id into portefeuille from public.acces_organismes_sociaux where id = p_id;
  if portefeuille is null or not public._novacab_social_allowed(portefeuille) then raise exception 'Accès refusé'; end if;

  update public.acces_organismes_sociaux
  set organisme=p_organisme, libelle=p_libelle, identifiant=p_identifiant,
      secret=pgp_sym_encrypt(coalesce(p_secret, ''), public._novacab_social_key(), 'cipher-algo=aes256'),
      siret=p_siret, note=p_note, updated_by=p_updated_by, updated_at=now()
  where id=p_id;

  return (select jsonb_build_object(
    'id', a.id, 'portefeuille_id', a.portefeuille_id, 'client_id', a.client_id,
    'organisme', a.organisme, 'libelle', a.libelle, 'identifiant', a.identifiant,
    'secret', pgp_sym_decrypt(a.secret, public._novacab_social_key()),
    'siret', a.siret, 'note', a.note, 'created_by', a.created_by,
    'updated_by', a.updated_by, 'created_at', a.created_at, 'updated_at', a.updated_at
  ) from public.acces_organismes_sociaux a where a.id = p_id);
end;
$$;

create or replace function public.delete_acces_organisme_social(p_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  portefeuille text;
begin
  select portefeuille_id into portefeuille from public.acces_organismes_sociaux where id = p_id;
  if portefeuille is null or not public._novacab_social_allowed(portefeuille) then raise exception 'Accès refusé'; end if;
  delete from public.acces_organismes_sociaux where id=p_id;
  return true;
end;
$$;

grant execute on function public.list_acces_organismes_sociaux(text,text) to authenticated;
grant execute on function public.create_acces_organisme_social(text,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.update_acces_organisme_social(uuid,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.delete_acces_organisme_social(uuid) to authenticated;

comment on column public.acces_organismes_sociaux.secret is
'Secret chiffré au repos avec pgcrypto/AES-256. Ne jamais exposer cette colonne directement à PostgREST.';
