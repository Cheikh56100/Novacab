-- NOVACAB V2.2.1 — Finance administration / traçabilité
-- Les budgets, honoraires, échéances et historiques sont stockés dans clients.
-- Cette migration ajoute un index utile aux demandes terminées et prépare la lecture historique.
create index if not exists idx_administration_requests_portefeuille_status_created
  on public.administration_requests(portefeuille_id, status, created_at desc);

-- Les demandes terminées restent volontairement dans administration_requests.
-- Aucune suppression automatique/trigger d'archivage ne doit être installé.
