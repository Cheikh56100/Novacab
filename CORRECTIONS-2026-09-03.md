# Corrections — 2026-09-03

## 1. Ouverture du logiciel
Correction de `src/components-refactored/Dashboard.jsx` :
- `BUCKET_LABELS` était utilisé mais n'était pas exporté sous ce nom par `core.js`.
- Le dashboard utilise maintenant `DEADLINE_BUCKET_LABELS`, déjà fourni par le module `deadlines`.

Cela supprimait l'erreur bloquante :
`ReferenceError: BUCKET_LABELS is not defined`.

## 2. Migration Supabase — accès organismes sociaux
Correction de `supabase/2026-09-03-social-access-encryption.sql` :
- Vault est activé explicitement avec `supabase_vault`.
- Si `novacab_social_access_key` n'existe pas, une clé aléatoire de 32 octets (64 caractères hexadécimaux) est créée automatiquement dans Vault.
- Si une clé existe mais fait moins de 32 caractères, la migration s'arrête sans l'écraser.

La clé n'est pas écrite dans le frontend, Git ou un fichier `.env`.


## Correction complémentaire — Dashboard (erreur `Cannot read properties of undefined`)

Le Dashboard importait `DEADLINE_BUCKET_LABELS` depuis `core.js`, alors que `core.js` importait ce symbole mais ne le ré-exportait pas. Le résultat était `undefined`, puis `DEADLINE_BUCKET_LABELS[b]` provoquait le crash au rendu.

Correction : le Dashboard importe désormais directement `BUCKET_LABELS` depuis `services/deadlines`. Les libellés `demain`, `mois`, `trimestre` et `plus-tard` ont également été ajoutés au référentiel pour couvrir tous les filtres utilisés par le Dashboard.
