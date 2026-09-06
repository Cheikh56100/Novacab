# NOVACAB V2.2.1 — Administration UX + raccordements métier

## UX
- Administration / Direction et Expert-comptable utilisent le même espace protégé.
- Dernier espace utilisé conservé ; première connexion Admin/Expert orientée Administration.
- Sidebar Administration regroupée par fonctionnalité.
- Navigation admin enrichie avec Missions exceptionnelles et Résiliations.
- Tableau de bord Direction avec KPI et mini-graphiques.
- Applications compactes et classées par fonctionnalité.

## Raccordements métier → administration
- Bilan terminé → facturation à réclamer.
- Mission exceptionnelle créée → notification Admin/Expert + file « Missions exceptionnelles à préparer ».
- Résiliation démarrée → notification Admin/Expert + file « Résiliations à traiter ».
- Entrée / sortie de mission → notification de pilotage.
- TVA marquée Fait → remontée au pilotage Admin/Expert.

## Sécurité
Les notifications inter-utilisateurs sont générées par un trigger PostgreSQL SECURITY DEFINER avec déduplication par cabinet / événement / destinataire. Un collaborateur ne peut donc pas écrire directement dans la boîte d'un autre utilisateur.
