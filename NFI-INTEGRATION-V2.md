# NOVACAB ↔ NFI — intégration V2

## Ce qui change
- NFI ne conserve plus de registre local de clients : `public.clients` NOVACAB est la source de vérité.
- Le bouton NFI dans Applications ouvre le dossier NOVACAB actif avec un SSO à code unique valable 90 secondes.
- Le code SSO ne transporte ni access_token ni refresh_token dans l'URL.
- Le nom affiché dans NFI provient de `public.team`.
- Les données financières NFI restent dans `nfi_*` et sont rattachées à `clients.id`.
- Les suppressions financières NFI sont réservées aux rôles `admin`, `expert` et `chef_mission` au niveau RLS.

## Déploiement Supabase
1. Appliquer `supabase/migrations/20260904_nfi_sso_handoff.sql` dans le projet NOVACAB.
2. Déployer `supabase/functions/nfi-sso-handoff`.
3. Conserver `verify_jwt = false` pour cette fonction : elle authentifie elle-même l'action `create` avec le bearer token et protège l'action `exchange` par un code aléatoire à usage unique.
4. NFI et NOVACAB doivent utiliser le même `VITE_SUPABASE_URL` et la même clé anon.
5. Définir `VITE_FINANCIAL_ANALYSIS_URL` dans NOVACAB.
