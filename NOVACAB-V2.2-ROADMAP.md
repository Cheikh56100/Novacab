# NOVACAB V2.2 — périmètre final

## Conservé

### 1. TVA Auto — préparation depuis les journaux
- Import des journaux comptables utiles à la préparation de la TVA.
- Reconnaissance des comptes 401 / 411 et des conventions 0 / 9 utilisées par certains exports.
- Préparation, contrôle et arbitrage des écritures avant déclaration.

### 2. Import FEC / Balance & KPI
- Application spécialisée accessible depuis **Applications**.
- Import FEC / balance, contrôles de qualité et analyse KPI.

### 3. Matrice complète des droits
- Administration visuelle des permissions.
- Accessible dans **Administration & Direction**.

### 4. Recherche & récupération
- Une seule recherche principale dans la barre supérieure.
- Suppression du champ de recherche redondant dans les barres de filtres.
- Corbeille avec restauration et suppression définitive réservée aux profils autorisés.

## Supprimé
- Tableau de bord Expert-Comptable dédié.
- Assistant IA NOVA.

## V2.2.1 — Consolidation

La priorité suivante est la consolidation technique et UX : nettoyage des composants retirés, contrôle RLS/périmètre portefeuille, audit des usages localStorage et vérification des parcours existants. Aucun nouveau gros module métier n’est ajouté à ce stade.
