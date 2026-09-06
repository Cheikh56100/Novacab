# NOVACAB V2.2.1 — Vérification finale rôles & permissions

## Périmètre

Rôles métier contrôlés :
- Admin
- Expert
- Chef de mission
- Collaborateur
- Gestionnaire de paie

## Contrôles

- Navigation visible dans la Sidebar.
- Navigation directe/restaurée depuis `localStorage` via `canAccessView`.
- Onglets de dossier via `canAccessClientTab`.
- Sections du compte via `canAccessAccountSection`.
- Actions d'équipe côté interface et garde-fous SQL.
- Actions sur les tâches : lecture/création, modification des tâches affectées, archivage et suppression réservés au management.
- Parcours juridique réservé au management.
- TVA Auto accessible aux rôles comptables concernés, exclue pour le Gestionnaire de paie.
- Matrice des droits réservée à l'Admin.

## Sécurité DB

La migration `supabase/v45-tasks-legal-rls.sql` active/renforce le RLS sur `tasks` et `legal_requests` si ces tables existent dans la base cible.

### `tasks`
- Lecture : membre actif du cabinet.
- Création : membre actif du cabinet.
- Modification : management du cabinet, ou tâche affectée à l'utilisateur connecté.
- Suppression : management du cabinet.
- Isolation par `portefeuille_id`.

### `legal_requests`
- Lecture / création / modification / suppression : Admin, Expert, Chef de mission du cabinet, ou Super Admin.
- Isolation par `portefeuille_id`.

## Important — source de vérité métier

Le fallback `localStorage` des demandes juridiques a été retiré. Une erreur Supabase/RLS ne doit jamais transformer un problème d'autorisation en données métier locales potentiellement visibles par un autre utilisateur.

## Résultats

- `node scripts/verify-roles.mjs` : **OK** — 5 rôles × 33 vues contrôlés.
- `npm test` : **20/20 OK**.
- `npm run verify:architecture` : **OK**.

Le seul avertissement restant est historique : `current_team_id()` est redéfini dans plusieurs migrations anciennes. La migration V2.1 reste la référence canonique ; les anciennes migrations ne sont pas supprimées pour éviter de casser un historique déjà déployé.
