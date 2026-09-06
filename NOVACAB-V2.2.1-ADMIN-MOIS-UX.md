# NOVACAB V2.2.1 — Administration, vues et clôture mensuelle

## Changements
- Administration & Direction conserve sa place prioritaire pour Admin / Expert.
- La zone de navigation propose désormais deux accès explicites :
  - Vue comptable : accès au pilotage cabinet existant.
  - Vue admin : cockpit Administration & Direction.
- Le cockpit Administration & Direction travaille désormais par mois.
- Navigation mois précédent / mois suivant avec libellé explicite (ex. juin 2026, juillet 2026).
- Un mois peut être clôturé et archivé par l'Admin.
- Un mois clôturé reste consultable.
- Une modification d'un mois archivé nécessite l'action explicite « Modifier l’archive », qui rouvre le mois en édition contrôlée.
- Les données existantes du module Administration sont migrées dans le mois courant lors du premier chargement du nouveau format.
- Le stockage distant conserve les snapshots mensuels dans `cabinet_product_states` via le module `administration`.

## Correction Realtime
`subscribeCabinetState()` a été durci contre les channels Supabase déjà souscrits (re-render / HMR / double effet React). Le callback `postgres_changes` est enregistré avant `subscribe()` et les channels homonymes existants sont retirés proprement.

## Contrôles
- `npm test` : 20/20 OK
- `npm run verify:roles` : 5 rôles × 33 vues OK
- `npm run verify:architecture` : OK (avertissement historique `current_team_id` inchangé)
