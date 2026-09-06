# NOVACAB V2.1 — Administration Premium

## Ajouts
- Export Excel Direction complet et multi-onglets
- Synthèse Excel avec KPI
- Tableaux Excel filtrables, gel des en-têtes, formats € et %
- Coûts & abonnements
- Fournisseurs & contrats
- Licences et économies potentielles
- Contrôle interne
- Journal des actions
- Architecture Supabase additive pour ces modules

## Principe
L'administration devient un cockpit « zéro oubli » :
**détecter → attribuer → agir → tracer → reporter**.

## Export Excel
Le bouton `Export Excel` du cockpit produit :
- Synthèse
- Clients
- Facturation
- Relances
- EBICS
- Box
- Rejets
- Rentabilité
- Alertes
- Historique

## Production
La V2.1 utilise encore un fallback localStorage pour les nouveaux modules afin de rester immédiatement exploitable.
La migration Supabase ajoute les tables de production et doit être adaptée aux politiques RLS existantes avant déploiement.
