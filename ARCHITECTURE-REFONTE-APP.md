# Refonte architecturelle de l'interface NOVACAB V39

## Objectif
Le monolithe `src/App.jsx` de plus de 10 000 lignes a été remplacé par une architecture modulaire.

## Résultat
- `src/App.jsx` : point d'entrée de 2 lignes.
- `src/components-refactored/` : un fichier JSX par composant UI extrait (127 composants).
- `src/components-refactored/core.js` : fonctions métier/accès Supabase et constantes partagées qui ne sont pas des composants UI.
- Les dépendances entre composants sont explicites via des imports ES modules.

## Organisation
Les composants restent nommés comme dans la V39 afin de limiter les risques fonctionnels lors de la refonte. Le découpage par domaine peut maintenant se faire sans toucher au point d'entrée.

## Vérification
- Analyse syntaxique JSX/JS effectuée avec TypeScript : OK.
- Vérification des imports relatifs : OK.
- Vérification TypeScript sans émission sur les sources refactorées : OK.
- Le build Vite complet n'a pas pu être exécuté dans cet environnement faute de dépendances npm installées localement.

## Suite recommandée
1. Installer les dépendances avec `npm ci`.
2. Exécuter `npm run build`.
3. Exécuter `npm test`.
4. Puis regrouper les fichiers unitaires dans des sous-dossiers `dashboard/`, `clients/`, `tva/`, `social/`, `tasks/`, `admin/` lorsque les tests d'intégration seront verts.
