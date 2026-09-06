# NOVACAB V2.2.1 — Audit des parcours réels

## Corrections appliquées
- Ajout d’un accès direct **Mes tâches** dans la navigation principale.
- Ajout d’un accès direct **Aides par secteur** dans Cabinet & outils : la route existait mais n’était pas accessible depuis la navigation.

## Parcours contrôlés
- Client → fiche client → fiscalité / social / juridique / révision : cohérents.
- TVA → TVA Auto : la logique reste centrée sur les journaux importés et la préparation de TVA.
- Applications → Import FEC / Balance & KPI : séparé du cœur NOVACAB.
- Planning ↔ tâches : les deux écrans existent et partagent les tâches réelles.
- Archives → Corbeille : présents, avec restauration côté corbeille.
- Administration → droits : matrice des droits disponible.

## Points à traiter avant V2.3
1. Vérification de bout en bout des permissions par rôle sur chaque parcours.
2. Vérification des sauvegardes distantes après chaque modification métier.
3. Finalisation de l’audit SQL/RLS avant toute nouvelle migration.
4. Harmonisation finale des libellés fiscaux et des écrans redondants.
