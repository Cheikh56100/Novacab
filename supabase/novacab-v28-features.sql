-- NOVACAB V28 — fonctionnalités tickets/champs personnalisés
-- Les champs personnalisés sont volontairement stockés dans le JSON client existant.
-- Exécuter uniquement si votre table clients ne possède pas de colonne JSON de données applicatives.
-- Tickets : vérifier/ajouter les colonnes suivantes si elles manquent.
alter table public.tasks add column if not exists date_realisation date;
alter table public.tasks add column if not exists date_archivage timestamptz;
alter table public.tasks add column if not exists commentaire text;
alter table public.tasks add column if not exists priorite text default 'normale';
alter table public.tasks add column if not exists responsable_id text;
alter table public.tasks add column if not exists portefeuille_id text;
-- Index utiles pour la vue client et le tableau Tickets.
create index if not exists tasks_client_id_idx on public.tasks(client_id);
create index if not exists tasks_statut_idx on public.tasks(statut);
