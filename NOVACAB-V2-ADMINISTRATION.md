
# NOVACAB V2 — Administration / Direction

Cette version ajoute un cockpit Administration & Direction orienté « zéro oubli ».

## Modules
- Pilotage cabinet
- Facturation
- Relances niveaux 0 à 4 + historique
- Entrées de mission
- Sorties de mission
- EBICS
- Box
- Suivi des rejets
- Rentabilité client
- Centre des alertes
- Échéancier cabinet
- Reporting Direction

## Accès
- `admin` : Administration & Direction
- `expert` : Administration & Direction (pilotage direction)
- `collaborateur` / `gestionnaire_paie` : aucun accès au cockpit

## Persistance
Le cockpit est immédiatement exploitable avec une persistance locale de secours (`localStorage`) afin de ne pas bloquer la V2.
Le fichier `supabase/novacab-v2-administration.sql` fournit la structure additive destinée à la persistance Supabase en production.

## Priorité de déploiement
1. Gestion des rôles + cockpit
2. Relances / sorties
3. EBICS / Box / rejets
4. Rentabilité / alertes / reporting
5. Automatisations Supabase et notifications
