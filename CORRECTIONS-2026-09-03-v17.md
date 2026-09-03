# NOVACAB V40 — corrections v17

- Défini `thStyle` et `tdStyle` dans `TvaGrid.jsx`.
- Défini `thStyle` et `tdStyle` dans `GestionnairePaieView.jsx`.
- Défini `thStyle` et `tdStyle` dans `CadreSocialView.jsx` (même défaut latent).
- `FinancialAnalysisV30View.jsx` récupère désormais `SECTEURS_ACTIVITE` depuis `core.js`.
- Migration Supabase des accès organismes sociaux : résolution robuste des fonctions `pgcrypto` via `search_path = public, extensions, vault`, afin de couvrir les installations Supabase où `pgcrypto` est dans `extensions`.
- Le 404 RPC observé est cohérent avec l'échec de création de la fonction lors de la migration : une fois la migration SQL réexécutée avec cette correction, `list_acces_organismes_sociaux` pourra être créée.
