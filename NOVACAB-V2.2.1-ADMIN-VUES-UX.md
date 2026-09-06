# NOVACAB V2.2.1 — Administration & Direction : séparation des vues

## Décision UX
Pour les profils Admin et Expert, la sidebar distingue désormais clairement deux espaces :
- **Vue comptable** : retour à l'espace métier NOVACAB et à sa navigation générale.
- **Vue admin** : espace dédié Administration & Direction.

Lorsque **Vue admin** est active, la navigation générale (Clients & missions, Comptabilité & fiscalité, Social & juridique, Cabinet & outils, etc.) est masquée afin de ne pas noyer le centre de pilotage.

La sidebar affiche alors uniquement le **Centre de pilotage** et ses rubriques Administration : Vue d'ensemble, Facturation, Relances, Entrées/Sorties, EBICS, Box, Rejets, Rentabilité, Alertes, Échéancier, Reporting, Coûts, Contrats, Licences, Contrôle interne et Journal.

La **Matrice des droits** reste séparée et accessible uniquement à l'Admin.

## Conservation du travail existant
- Les rôles et permissions existants ne sont pas élargis.
- La logique mensuelle (mois de travail, clôture, archive, réouverture contrôlée) est conservée.
- Les parcours métier des autres rôles restent inchangés.
- Le pilotage Administration continue d'utiliser ses onglets internes, désormais synchronisés avec la sidebar dédiée.
