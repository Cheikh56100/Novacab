# NOVACAB V2.2.1 — Métier ↔ Administration

## Ce qui est livré
- Centre de demandes administratif persistant via `administration_requests`.
- RLS : un collaborateur/chef de mission peut créer et consulter ses demandes ; Admin/Expert gèrent les demandes du cabinet.
- Realtime sur les demandes du cabinet.
- Bouton dossier « Demander une intervention admin » pour les rôles opérationnels.
- File direction avec priorité, statut, ouverture du dossier, prise en charge et clôture.
- Raccordements automatiques côté base pour : mission exceptionnelle, résiliation, entrée de mission, sortie de mission.
- Notifications Admin/Expert automatiques pour mission exceptionnelle et résiliation.
- TVA explicitement exclue du workflow Administration : elle reste dans l’espace métier.

## Migration
Appliquer `supabase/v47-administration-requests.sql` après les migrations existantes, notamment V46.
V47 recrée le trigger métier → administration sans aucun raccordement TVA.

## Contrôles
- `scripts/verify-roles.mjs` : OK
- `scripts/verify-architecture.mjs` : OK (warning historique `current_team_id`, inchangé)
- Transpilation syntaxique : AdministrationView, CabinetApp, ClientEditorPage, administrationWorkflow : OK
- Build Vite complet non exécuté ici car les dépendances `node_modules` ne sont pas présentes dans l'environnement d'audit.
