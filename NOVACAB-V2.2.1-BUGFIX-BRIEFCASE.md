# NOVACAB V2.2.1 — Bugfix AdministrationView

Correction du crash React `ReferenceError: Briefcase is not defined` dans `AdministrationView.jsx`.

Cause : l'icône `Briefcase` était utilisée dans la configuration des groupes « Dossiers & missions » et « Équipe & organisation » sans être importée depuis `lucide-react`.

Correction : ajout de `Briefcase` à la liste des imports.

Vérifications :
- `node --test` : 20/20 OK
- `verify:roles` : 5 rôles × 33 vues OK
- `verify:architecture` : OK (avertissement historique current_team_id inchangé)
- Build non exécuté : aucun package-lock.json dans le projet, donc `npm ci` n'est pas applicable dans cet environnement.
