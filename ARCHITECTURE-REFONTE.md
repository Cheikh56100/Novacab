# NOVACAB — plan de découpage de l'application

## Étape livrée en V39

- Les accès aux organismes sociaux ont été sortis de `App.jsx` vers `src/services/socialAccess.js`.
- `App.jsx` ne contient plus d'accès direct à `acces_organismes_sociaux`.
- Les secrets sociaux passent par des RPC Supabase dédiées et sont chiffrés au repos.

## Découpage à poursuivre

`App.jsx` reste volontairement un point d'orchestration historique. Le prochain chantier doit extraire, dans cet ordre :

1. `features/tva/` — écrans et orchestration TVA.
2. `features/clients/` — fiche dossier et onglets client.
3. `features/echeances/` — échéances et règles.
4. `features/portefeuilles/` — portefeuille et KPI.
5. `features/demo/` — comptes démo.
6. `features/admin/` — administration et sécurité.

Chaque extraction doit conserver le comportement fonctionnel et être validée par `npm test` puis `npm run build`. Ne pas effectuer un découpage monolithique en une seule modification.
