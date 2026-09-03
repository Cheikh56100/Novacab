# NOVACAB — passe de refonte V40

## Objectif
Réduire le couplage de `CabinetApp` et éviter qu'un composant d'orchestration porte toute la synchronisation réseau et la navigation.

## Changements de cette passe

- `App.jsx` reste un point d'entrée minimal.
- La navigation du cabinet est isolée dans `src/hooks/useNavigationState.js`.
- Le chargement initial + Realtime des tables `clients`, `team` et `portefeuilles` est isolé dans `src/hooks/useCabinetDataSync.js`.
- Les marqueurs anti-écho Realtime (`pendingLocalIds`, etc.) restent encapsulés dans le hook et sont exposés uniquement aux mutations qui en ont besoin.
- Une couche de compatibilité `src/components-refactored/shared.js` centralise temporairement les dépendances héritées du monolithe. Elle est volontairement documentée comme transitoire : les nouveaux composants doivent importer directement leur service/hook/domain.
- Correction d'une référence orpheline à `setSession` dans le flux de signature de contrat.

## Cibles suivantes

1. Découper `core.js` par domaine métier et transformer `core.js` en simple barrel d'exports.
2. Sortir les mutations clients de `CabinetApp` dans `useClientMutations`.
3. Sortir équipe/portefeuilles dans `useTeam` et `usePortefeuilles`.
4. Supprimer progressivement les imports via `shared.js` au profit d'importations explicites.
5. Ajouter tests unitaires TVA, échéances, permissions et isolation multi-portefeuilles.
6. Ajouter tests de sécurité des RPC d'accès aux secrets et de l'audit trail.

## Règle d'architecture

`Page/Component -> Hook -> Service -> Supabase/RPC`

La logique métier réutilisable ne doit pas être créée dans un composant React.
