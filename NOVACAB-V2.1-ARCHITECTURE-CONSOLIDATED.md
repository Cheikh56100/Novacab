# NOVACAB V2.1 — Architecture consolidée

Cette version consolide les points prioritaires identifiés lors de l’audit du ZIP.

## Changements

- `portefeuille_id` devient la référence canonique du périmètre cabinet/RLS.
- `current_cabinet_id()` et `current_cabinet_is_manager()` restent des alias de compatibilité vers les helpers canoniques.
- Notifications centralisées dans `src/services/notifications.js`, avec migration douce des anciens champs `destinataire_id` / `lu`.
- Normalisateur comptable centralisé : `401/411` et `0/9` sont compris sans diffuser ces exceptions dans le moteur TVA.
- Les règles `401METRO` / `411METRO` restent réutilisables pour `0METRO` / `9METRO`.
- L’état Administration (pilotage, coûts, contrats, licences) est conservé dans `cabinet_product_states` et non plus uniquement dans le navigateur.
- Ajout de `npm run verify:architecture`.

## Migration Supabase

Appliquer après les migrations existantes :

`supabase/v2.1-architecture-consolidation.sql`

La migration est additive et n’efface pas les anciennes colonnes de compatibilité.

## Tests

`npm test`

`npm run build`

`npm run verify:architecture`
