# NOVACAB — Corrections V19

- Vue dossier : `Documents & informations` placé en première position, avant `Tickets`.
- Couleur principale bleue remplacée par le bleu foncé NOVACAB (`#17345F`) ; variantes profondes harmonisées.
- Assistant NOVACAB retiré de l'interface et de son intégration dans `CabinetApp`.
- OFX Bridge : description corrigée pour indiquer que les fichiers sont destinés aux outils comptables, pas à NOVACAB.
- Ajout d'un espace `Réunions` dans chaque dossier client.
  - Date, objet, participants.
  - Points évoqués.
  - Décisions / éléments actés.
  - Actions à réaliser.
  - Prochaine échéance / prochain point.
  - Historique des rendez-vous par dossier.
  - Suppression d'un compte-rendu.
  - Bouton `Récapitulatif` préparant un e-mail avec le compte-rendu.
- Les réunions sont stockées dans les données du dossier client (`reunions`) et initialisées à vide pour les dossiers existants.
