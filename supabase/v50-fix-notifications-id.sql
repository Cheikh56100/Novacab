-- NOVACAB V50 — correctif notifications.id
-- Certaines installations historiques ont la colonne notifications.id en NOT NULL
-- sans DEFAULT, alors que les inserts métier n'envoient volontairement pas l'id.
-- On restaure le comportement canonique : UUID généré par PostgreSQL.

create extension if not exists pgcrypto;

alter table public.notifications
  alter column id set default gen_random_uuid();

-- Les triggers V47/V49 peuvent continuer à omettre id : le DEFAULT PostgreSQL
-- génère désormais systématiquement la valeur avant contrôle NOT NULL.
