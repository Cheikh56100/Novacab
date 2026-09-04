# NFI intégré à NOVACAB — 2026-09-04

Cette version intègre le module d'analyse financière NFI directement dans NOVACAB.

## Fonctionnement

- NOVACAB reste la source de vérité pour `clients`, `team` et `portefeuilles`.
- NFI lit les dossiers via `nfi_list_clients()` et `nfi_get_client()`.
- Les données financières NFI sont stockées uniquement dans `nfi_exercises`, `nfi_fec_imports`, `nfi_financial_analyses`, `nfi_forecasts` et `nfi_confidential_access`.
- Un clic sur « Applications > Analyse financière » ouvre désormais NFI dans NOVACAB, sans nouvel onglet ni second registre de clients.
- Si un dossier NOVACAB est déjà ouvert, NFI sélectionne automatiquement le même dossier par son `client.id` (SIREN en secours).
- Le référentiel sectoriel 2024 provient du classeur `BON Codes NAF_avec_secteurs_d_activités_et_Ratios_rempli.xlsx`. Les valeurs présentes dans le classeur sont reprises telles quelles ; les valeurs réellement absentes restent absentes et ne sont pas inventées.

## Base Supabase

Appliquer une fois la migration :

`supabase/migrations/20260904_nfi_integration.sql`

Elle crée les tables analytiques et les fonctions RPC NFI sans recréer les tables maîtresses NOVACAB.

La migration SSO `20260904_nfi_sso_handoff.sql` peut rester en place pour compatibilité avec l'ancienne ouverture externe NFI.

## Dépendance

NFI utilise `recharts`. La dépendance et le lockfile ont été ajoutés à cette version.

## Important

Les données financières d'un dossier NOVACAB n'apparaissent dans NFI que si un exercice NFI/FEC a été enregistré. L'absence d'un exercice ne doit pas être remplacée par une valeur de benchmark : le benchmark sectoriel est une référence marché distincte des comptes du dossier.
