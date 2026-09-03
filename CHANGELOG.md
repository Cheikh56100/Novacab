# V40.0.0 — Expérience & performance

- Refonte de l'accueil dashboard avec une hiérarchie orientée action.
- Ajout d'un bloc de bienvenue contextualisé et de raccourcis principaux.
- Renforcement des états de focus clavier et du support `prefers-reduced-motion`.
- Harmonisation des interactions de cartes et boutons.
- Documentation UX ajoutée dans `UX-REFONTE-V40.md`.

# NOVACAB — CHANGELOG CONSOLIDÉ

Historique consolidé des versions antérieures. Le versionnage technique de référence est désormais Git + `package.json`.


---

# CHANGELOG-V10-ESPACE-COLLABORATEUR

# NOVACAB V10 — Espace collaborateur

- Ajout du sous-menu **Événements client** avec flèche d'ouverture/fermeture et sous-dossiers Résiliations, Reprises et Missions exceptionnelles.
- Ajout de **Mon espace collaborateur** dans la navigation.
- Suivi personnel : formations, compétences, objectifs, réalisations, entretiens, documents et historique.
- Compteurs de synthèse : formations terminées, heures de formation, objectifs atteints, compétences avancées.
- Chaque ajout dans l'espace collaborateur alimente automatiquement l'historique du parcours.
- Persistance locale immédiate + persistance Supabase via la table `team_profiles`.
- Ajout de `supabase-team-profiles.sql` avec RLS : un collaborateur gère son espace ; Admin/Expert/Chef de mission peuvent consulter et administrer les profils de leur portefeuille.


---

# CHANGELOG-V11-SECURITE

# V11 — Sécurité et simplification

- Suppression complète du module NOVACAB Review.
- Conservation du dossier client et de la révision comptable classique.
- Journal d’audit visible uniquement par l’Admin.
- RLS et RPC prévus dans la migration Supabase.
- Journalisation du changement de mot de passe.


---

# CHANGELOG-V11-VUE-D-ENSEMBLE-B

# NOVACAB V11 — Vue d'ensemble compacte

## Modification principale
La Vue d'ensemble adopte l'organisation B validée :
- KPI principaux conservés en tête.
- Suivi des bilans annuels conservé avec les échéances calculées à partir de la clôture + 3 mois.
- Suppression des grands graphiques de répartition qui occupaient trop d'espace.
- Remplacement par un bloc compact « Indicateurs du portefeuille ».
- Indicateurs cliquables conservés pour accéder aux filtres/détails.
- Répartition des rôles (Collaborateur / Expert / Chef de mission) présentée sous forme compacte.
- Les vues spécialisées restent disponibles pour les analyses détaillées.
- Les tâches prioritaires, anomalies, rapprochements et échéances restent visibles comme zones opérationnelles.

## Validation technique
Le build Vite n'a pas pu être relancé dans cet environnement : l'installation npm a dépassé le délai disponible. Les fichiers sources ont toutefois été modifiés dans l'archive à partir de la V10.

## Correctif — mini-graphiques des indicateurs du portefeuille
- Ajout de mini-graphiques compacts dans les 8 cartes « Indicateurs du portefeuille ».
- Les mini-graphiques restent visuels et discrets afin de conserver l'organisation B : priorité aux tâches, alertes et échéances.
- Les cartes restent cliquables pour accéder au détail.


---

# CHANGELOG-V12-ANNUALISATION-SECURITE

# V12 — Annualisation, archivage et sécurité

## Application
- Ajout de `src/services/annual.js`.
- Chaque dossier conserve un historique annuel dans `annualData["YYYY"]`.
- `annualActiveYear` identifie l'exercice de travail.
- Migration automatique des anciennes données au premier lancement.
- Passage automatique à l'année courante au changement d'exercice.
- Archivage à chaque sauvegarde des données TVA, bilan, IS/CFE, révision bancaire/cotisations et OD sociales.
- DA conservé par année ; DP inchangé et permanent.
- Vue d'ensemble des bilans corrigée : le nombre attendu est calculé uniquement sur les dossiers dont `dateCloture` appartient à l'année affichée.
- Admin : visibilité portefeuille complète.
- Autres profils : visibilité limitée au portefeuille + dossiers affectés.
- Les erreurs de sauvegarde client remontent maintenant explicitement à l'utilisateur.

## Supabase
Exécuter `supabase-annual-security-migration.sql` après les scripts Supabase existants.
- RLS clients par portefeuille.
- RLS team par portefeuille/rôle.
- Portefeuilles en lecture authentifiée, écriture Admin.
- Fonctions SECURITY DEFINER pour éviter les récursions RLS.

## À vérifier avant production
- Tester la matrice des rôles avec plusieurs comptes.
- Tester 2026 → 2027 → 2028 avec données de test.
- Tester les exercices décalés.
- Tester le rollover TVA après CA3 décembre : l'archive est alimentée immédiatement ; le nouveau cycle opérationnel est ouvert au changement d'exercice.


---

# CHANGELOG-V12.1

# V12.1 — Archives et fonctionnement annuel

## GitHub : ajouter
- `src/services/legal.js`
- `src/services/permissions.js`
- `CHANGELOG-V12.1.md`
- `TESTS-V12.1-RLS-MULTIPORTEFEUILLES.md`

## GitHub : modifier/remplacer
- `src/App.jsx`
- `src/services/annual.js`
- `src/services/tasks.js`

## Fonctionnalités introduites
- menu **Archives / exercices** ;
- consultation TVA/CA3/CA12, DA, bilan, social, révision, IS/CFE par exercice ;
- tâches terminées/archivées consultables dans l'historique ;
- bouton Archiver avant suppression ; suppression définitive Admin uniquement ;
- demandes juridiques préparées pour Supabase avec fallback de continuité et migration du localStorage ;
- protection optimiste contre écrasement concurrent ;
- matrice de droits par champ ;
- bilans basés sur l'exercice réel / date de clôture, y compris 31/03, 30/06, etc. ;
- rollover annuel dynamique 2026 → 2027 → 2028 ;
- CA3 décembre : archivage du cycle lorsque l'exercice est réellement terminé.

## Supabase
Aucune migration Supabase n'est à exécuter pour cette livraison GitHub. La table `legal_requests` sera créée et les RLS finales seront traitées après validation de cette V12.1.


---

# CHANGELOG-V13-OPTIMISATION-UX-TVA

# V13 — Optimisation accueil / TVA Auto / Vue d'ensemble

## Navigation
- Suppression du doublon « Checklist Dossier Permanent (DP) » dans la sidebar.
- Suppression du raccourci « Registre clients » du bandeau d'accueil : le registre reste accessible depuis la rubrique Clients & missions.
- Suppression de « TVA Auto & Pré-comptabilité » de la sidebar pour alléger la navigation.
- TVA Auto est désormais accessible directement depuis l'onglet TVA de chaque dossier.

## TVA Auto
- Le dossier sélectionné est affiché très clairement en tête de page avec nom, SIREN et régime TVA.
- Depuis l'onglet TVA d'un client, bouton « Ouvrir TVA Auto » avec sélection automatique du bon dossier.
- Le bouton « Retour au dossier » revient directement au dossier concerné.
- Les acquisitions intracommunautaires B2 ne sont plus affichées si aucune écriture n'est réellement classée en acquisition UE.
- Détection automatique UE durcie : le simple mot « UE » dans un libellé ne suffit plus à classer une opération en acquisition intracommunautaire.

## Vue d'ensemble
- Suppression du bloc « Indicateurs du portefeuille » jugé trop chargé.
- Ajout de donuts 2D pour comparer :
  - forme juridique ;
  - secteur d'activité ;
  - catégorie fiscale ;
  - régime TVA.


---

# CHANGELOG-V14-ARCHITECTURE-SEED

# NOVACAB V14 — Architecture : extraction des données de seed

## Modification
Les données statiques `RAW_SEED_CLIENTS` ont été sorties de `src/App.jsx` vers `src/data/seedClients.js`.

## Pourquoi
`App.jsx` contenait une très grosse constante de données métier de démonstration/import initial. Cela alourdissait inutilement le fichier central et compliquait sa maintenance.

## Garantie de compatibilité
- aucune donnée modifiée
- aucun champ renommé
- aucun comportement métier modifié
- aucune requête Supabase modifiée
- aucun changement de navigation

`App.jsx` importe désormais la même constante depuis `src/data/seedClients.js`.


---

# CHANGELOG-V14-FIX-AUTH-TEAM

# NOVACAB V14 — Correctif Auth ↔ Équipe

## Problème corrigé
Après connexion, certains comptes restaient bloqués sur « Finalisation de votre compte… » lorsque la session Supabase Auth existait mais que `team.auth_user_id` n'était pas encore lié à l'utilisateur.

## Correctif
- Ajout de `supabase-auth-team-sync-v14.sql`.
- Ajout de `ensure_current_user_team()` en `SECURITY DEFINER`.
- La fonction lie d'abord une fiche `team` existante par email.
- Sinon, elle déduit le portefeuille à partir du domaine email ou du nom de cabinet.
- Un compte auto-synchronisé ne peut devenir que `collaborateur`.
- Un domaine non reconnu produit une fiche `en_attente`.
- L'interface appelle cette synchronisation uniquement si aucune fiche `team` liée à `auth.uid()` n'est visible.

## Installation Supabase
Exécuter `supabase-auth-team-sync-v14.sql` après les migrations de sécurité existantes.


---

# CHANGELOG-V14-FIX-TEAM-SCHEMA

# NOVACAB V14 — Correctif compatibilité schéma TEAM

## Problème
La V14 interrogeait `team.is_demo` et `team.demo_expires_at` alors que ces colonnes ne sont pas présentes dans toutes les bases existantes. Supabase répondait 400 et le chargement de l'équipe échouait.

## Correctif
- Le chargement normal de `team` utilise uniquement les colonnes historiques existantes.
- `is_demo` et `demo_expires_at` reçoivent des valeurs par défaut côté application.
- Le statut démo d'une session peut également être récupéré depuis `auth.user_metadata.is_demo`.
- Aucune donnée, RLS ou fonctionnalité métier existante n'est supprimée.

## Option comptes démo
Pour activer la gestion persistante des colonnes démo dans la table `team`, exécuter ensuite `supabase/supabase-demo-accounts.sql`. Ce n'est pas nécessaire pour les comptes normaux.


---

# CHANGELOG-V14-MODIFICATIONS-10-12

# NOVACAB V14 — Modifications 10 à 12

## 10 — UX / pilotage
- Ajout du « Centre des priorités » sur la Vue d’ensemble.
- Priorités calculées à partir des anomalies, tâches en retard/du jour et TVA à traiter.
- Chaque priorité renvoie vers le module existant correspondant.
- Aucun stockage ou automatisme destructif.

## 11 — Automatisation métier non destructive
- Ajout de `src/utils/workflow.js` pour centraliser les suggestions d’actions.
- Les suggestions n’écrivent aucune donnée et ne modifient pas les règles métier existantes.

## 12 — Finalisation
- Suppression d’un doublon de propriété `label: "N/A"` dans le dashboard.
- Version package portée à `0.0.4-v14`.
- Vérification syntaxique et build Vite effectués lorsque l’environnement le permet.


---

# CHANGELOG-V14-MODIFICATIONS-4-5-6

# NOVACAB V14 — Modifications 4, 5 et 6

## Modification 4 — Extraction des utilitaires de dates
Déplacement des fonctions génériques de dates, formats monétaires et échéance bilan vers `src/utils/dateUtils.js`.

Impact : aucun changement de comportement ; `App.jsx` devient plus léger et ces fonctions sont réutilisables.

## Modification 5 — Extraction des outils Excel
Déplacement des exports/imports du registre clients et contacts vers `src/utils/excelUtils.js`.

Impact : la logique Excel est isolée de l'interface React. Les validations existantes, notamment SIREN/SIRET et dates de clôture, sont conservées.

## Modification 6 — Centralisation des accès et checklists
Création de `src/utils/access.js` pour les libellés de rôles et habilitations organismes sociaux, et de `src/utils/checklists.js` pour les états et calculs de progression des checklists.

Impact : pas de changement de droits métier ; on centralise seulement des constantes/fonctions déjà existantes.

## Validation
- Archive V14 issue de la V14 Architecture Seed.
- Aucun fichier SQL ni moteur TVA modifié.
- Aucun écran métier supprimé.
- Build complet non confirmé dans l'environnement : `npm ci` a dépassé le délai disponible avant exécution de Vite.


---

# CHANGELOG-V14-MODIFICATIONS-7-8-9

# NOVACAB V14 — Modifications 7, 8 et 9

## 7 — Chargement Excel à la demande
Le package `xlsx` n'est plus chargé dans le bundle initial via des imports statiques. Les utilitaires Excel et les imports Excel du module organismes sociaux chargent `xlsx` uniquement lorsqu'une action Excel est réellement utilisée.

## 8 — Configuration Supabase injectable
Ajout de `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec fallback de compatibilité. Une installation existante continue de fonctionner ; Netlify peut désormais fournir la configuration par variables d'environnement.

## 9 — Error Boundary global
Ajout d'un filet de sécurité React autour de l'application. Une erreur d'interface isolée affiche une récupération contrôlée au lieu de faire disparaître toute l'application.

## Préservation
- Aucun SQL/RLS modifié.
- Aucun moteur TVA modifié.
- Aucune fonctionnalité métier supprimée.
- Les fonctions Excel restent disponibles avec la même API.


---

# CHANGELOG-V14-NOTIFICATIONS-FIX

# NOVACAB V14 — Correction notifications

- Le badge de la cloche ne mélange plus les échéances en retard avec les notifications persistantes.
- Les échéances en retard restent regroupées dans une alerte claire et ouvrent le planning.
- Les alertes d'échéances proches sont séparées des notifications réelles.
- Les notifications persistantes récentes restent affichées et indiquent lorsque la limite des 30 dernières est atteinte.
- Aucune donnée Supabase n'est modifiée.


---

# CHANGELOG-V14-NOTIFICATIONS-PURGE-ECHANCES

# NOVACAB V14 — Notifications : séparation planning / cloche

## Correction

Le panneau de notifications de la cloche n'affiche désormais **que les notifications réelles**.

Les échéances du planning (`isEcheance`) sont exclues du panneau et ne sont plus comptées dans le badge de la cloche.

Le nombre d'échéances en retard reste disponible sur l'icône **Planning** via `notifCount`.

## Résultat attendu

- Cloche : uniquement les notifications réelles non lues.
- Exemple : 1 notification réelle → badge `1`.
- Planning : conserve son propre compteur d'échéances en retard.
- Aucun enregistrement Supabase n'est supprimé ou modifié.


---

# CHANGELOG-V14-PERFORMANCE-TVA

# NOVACAB V14 — Optimisation du chargement du module TVA

## Modification 1 — Chargement différé de la TVA automatisée

### Avant
`TvaAutomation.jsx` était importé statiquement par `App.jsx`. Le code du module TVA était donc inclus dans le graphe de chargement initial de l'application.

### Après
Le module est chargé avec `React.lazy()` uniquement lorsque l'utilisateur ouvre `tva-auto`.

### Pourquoi
- Réduire le travail initial du navigateur.
- Ne pas charger le module TVA automatisée pour les utilisateurs qui restent sur le dashboard, les clients, les tâches, etc.
- Préparer un découpage progressif de la grosse `App.jsx` sans modifier la logique métier TVA.

### Sécurité / compatibilité
- Aucun changement de calcul TVA.
- Aucun changement Supabase/RLS.
- Aucun changement de données.
- Aucun changement de navigation.
- Un écran de chargement est affiché uniquement pendant le chargement du module.

## Validation
Le build complet n'a pas pu être exécuté dans l'environnement d'analyse : les dépendances npm présentes dans l'archive étaient incomplètes et `npm ci` a dépassé le délai disponible. Le code source modifié reste limité à l'import et au rendu du module TVA.


---

# CHANGELOG-V14-SECURITE-TVA

# NOVACAB V14 — Sécurité TVA

## Première modification

Les tables TVA ne sont plus accessibles à tous les utilisateurs authentifiés.

L'accès est maintenant contrôlé par le portefeuille du client, en réutilisant les fonctions de sécurité existantes :

- `public.current_portefeuille_id()`
- `public.current_team_role()`

Les tables protégées sont :

- `tva_declarations`
- `tva_rules`
- `tva_keyword_rules`
- `tva_transactions`
- `tva_sources`
- `tva_acomptes`
- `annual_archives`
- et, si elles existent, les tables TVA historiques `tva_audit_versions`, `tva_operation_rules`, `tva_declaration_mappings`.

## Comportement

- Un collaborateur ne voit que les données TVA des clients de son portefeuille.
- Les administrateurs conservent leur accès global conformément à la politique actuelle de NOVACAB.
- Les transactions, mappings et audits remontent au portefeuille via leur déclaration TVA parente.
- Les sources, règles et acomptes remontent directement via `client_id`.

## Installation

Pour une base existante : exécuter `supabase/tva-security-v14.sql` après les migrations de sécurité et TVA existantes.

Pour une installation neuve : `supabase/tva-engine-v9-autonome.sql` contient désormais directement les politiques sécurisées.


---

# CHANGELOG-V15-UX-COCKPIT

# NOVACAB V15 — UX Cockpit

- Vue d’ensemble simplifiée : 4 indicateurs principaux au lieu de 5.
- En-tête orienté priorités quotidiennes.
- Nouveau bloc « Votre cockpit du jour ».
- Réduction des graphiques décoratifs : secteur + avancement TVA.
- Navigation plus calme : seuls les groupes utiles sont ouverts initialement.
- Animations légères respectant `prefers-reduced-motion`.


---

# CHANGELOG-V17-FICHES-CLIENTS

# NOVACAB V17 — Fiches clients

- Ajout d'un cockpit de dossier en tête de chaque fiche client.
- Lecture immédiate du statut, TVA, collaborateur et clôture.
- Accès direct à l'accueil du dossier.
- Zone de contenu élargie pour réduire la sensation de surcharge et améliorer la lecture.
- Navigation existante conservée afin de ne pas casser les habitudes métier.


---

# CHANGELOG-V18-SUPER-ADMIN

# NOVACAB V18 — Super Admin

- Le rôle `super_admin` est reconnu comme administrateur applicatif.
- Accès à l'onglet Équipe restauré.
- Nouvelle section **Administration NOVACAB**.
- Accès **Cabinets & équipes** pour gérer les équipes et les demandes en attente.
- Accès **Demandes NOVACAB** pour consulter les demandes juridiques globales.
- Les vues de collaborateur ne sont plus proposées au Super Admin dans le menu.
- Script `supabase/super-admin-team-rls.sql` inclus pour permettre la validation/modification des équipes avec les politiques RLS existantes.


---

# CHANGELOG-V21-CONTRAT-APRES-VALIDATION

# NOVACAB V21 — Contrat après validation

Nouveau parcours :

1. Le prospect crée son compte.
2. Son accès est créé avec le statut `en_attente`.
3. Le Super Admin reçoit la notification et valide le compte en attribuant un portefeuille et un rôle.
4. Dès que la fiche `team` devient `actif`, l'utilisateur quitte automatiquement l'écran d'attente.
5. Le contrat NOVACAB apparaît.
6. Après signature horodatée, le contrat est enregistré et l'utilisateur accède à NOVACAB.

Le bouton de validation équipe attend désormais la confirmation Supabase avant d'afficher le compte comme activé.


---

# CHANGELOG-V24.3-BILANS-MANUELS

# NOVACAB V24.3 — Correction manuelle des bilans terminés

- Ajout d'une zone "Correction manuelle des bilans terminés" dans l'onglet Bilan.
- Accès strictement réservé au rôle `super_admin`.
- Sélection d'un exercice puis possibilité de le marquer comme terminé ou de le retirer des bilans terminés.
- Mise à jour de `annualData[année].bilan.transmis`, utilisée par le suivi des bilans annuels.
- Synchronisation du bilan actif lorsque l'exercice corrigé est l'exercice courant.
- Conçu pour corriger les incohérences apparues après un changement de date de clôture.


---

# CHANGELOG-V25-FACTURATION-ELECTRONIQUE

# V25 — Facturation électronique

- Suppression de l'onglet Corporate de la fiche client.
- Ajout de l'onglet « Facturation électronique ».
- Suivi du mandat autorisant le cabinet à choisir la plateforme.
- Si mandat = oui : plateforme choisie par le cabinet.
- Si mandat = non : plateforme choisie et communiquée par le client.
- Suivi de l'inscription de la société dans l'annuaire.
- Zone d'accès dédiée : URL, identifiant/e-mail, mot de passe et notes.
- Initialisation automatique du nouveau bloc pour les clients existants et les nouveaux dossiers.


---

# CHANGELOG-V28-EVOLUTION-PRODUIT

# NOVACAB V28 — évolution produit
- Sidebar : catégories fermées par défaut, titres plus grands bleu nuit.
- Fiche client : onglet Tickets avec création, assignation, priorité, échéance et historique.
- Fiche client : champs personnalisés illimités et listes enrichissables manuellement.
- Révision : import FEC/CSV/Excel et première synthèse KPI.
- Assistante NOVACAB : panneau flottant ouvrable/fermable et contextuel.
- Migration SQL fournie pour sécuriser les colonnes nécessaires aux tickets.


---

# CHANGELOG-V29

# NOVACAB V29
- Normalisation renforcée des libellés TVA : SHIV-SAI, SHIV SAI, SHIV.SAI et SHIVSAI.
- Priorité, type de correspondance et règles spécifiques par mot-clé.
- Nouveau moteur de mapping comptable pour FEC / balance.
- KPI : CA, VA, EBE, REX, résultat net, BFR, trésorerie nette, gearing, ROE, liquidité.
- Stockage des imports et KPI par client/exercice.


---

# CHANGELOG-V30-REFONTE-UX-ANALYSE

# NOVACAB V30 — Refonte UX et analyse financière

## Décisions fonctionnelles
- L'Analyse financière devient un module indépendant de la Révision.
- Comparaison standard sur trois exercices : N-2 / N-1 / N.
- La Révision reste dédiée aux contrôles et au travail comptable.
- Aucune réinitialisation de Supabase Auth : les identifiants, rôles, auth_user_id, clients et portefeuilles sont conservés.

## Interface
- Nouvelle entrée « Analyse financière » dans la navigation.
- Libellé « Révision & import FEC » simplifié en « Révision ».
- Les grands groupes du menu restent fermés par défaut.

## Données
- La V30 lit les imports de `financial_imports` par client et exercice.
- Pour chaque exercice, le dernier import est utilisé pour alimenter N-2/N-1/N.
- Migration SQL strictement additive : `supabase/novacab-v30.sql`.


---

# CHANGELOG-V31-NOVACAB-INTELLIGENT

# NOVACAB V31 — Intelligent

## Automatisations ajoutées
- Moteur de règles : déclencheur → condition → action.
- Alertes dossier : échéances, tickets en retard, anomalies financières.
- Suggestions de tickets de contrôle après import FEC / Balance.
- Score de santé du dossier (vert / orange / rouge).
- Centre d'actions : priorisation des dossiers et actions recommandées.
- Échéances intelligentes : rappels J-15 / J-7 / retard (prêtes à être connectées aux données existantes).
- Assistante opérationnelle : réponses orientées action et création de contrôles.

## Sécurité
Migration additive uniquement : Supabase Auth et les accès existants ne sont pas recréés ni supprimés.


---

# CHANGELOG-V31.1-AUTOMATISATIONS-REELLES

# NOVACAB V31.1 — Automatisations réellement raccordées

Cette évolution raccorde le moteur V31 aux données déjà présentes dans NOVACAB.

## Déclenchements automatiques
- tickets en retard → alerte critique ;
- tickets à moins de 7 jours → alerte d'attention ;
- résultat net négatif → alerte critique ;
- trésorerie nette négative → alerte critique ;
- BFR > 30 % du CA → alerte ;
- CA en baisse de plus de 10 % vs N-1 → alerte ;
- trésorerie en baisse sur N-2/N-1/N → tendance ;
- EBE en baisse sur N-2/N-1/N → tendance.

Les alertes sont dédupliquées par client et par règle afin d'éviter les doublons à chaque rafraîchissement.

Aucune donnée utilisateur, aucun compte Auth et aucun mot de passe ne sont modifiés.


---

# CHANGELOG-V32-PRODUCTIVITE

# NOVACAB V32 — Productivité

## Ajouts
- Nouvelle vue **Mon travail** : priorités, retards et prochaines échéances.
- Accès direct au dossier client et clôture rapide des tâches.
- **Modèles de procédures** personnalisables (ex. SCI, Holding, société classique).
- **Tâches récurrentes** mensuelles ou annuelles, préparées pour industrialiser les processus.

## Sécurité
Aucune modification destructive de Supabase Auth, des utilisateurs, rôles, portefeuilles ou clients.

## Note
Les modèles et récurrences sont actuellement stockés localement dans le navigateur afin de ne pas modifier inutilement la base. Une migration centralisée pourra être ajoutée ensuite pour les partager entre collaborateurs.


---

# CHANGELOG-V33-SIMPLIFICATION-AUTOMATISATION

# NOVACAB V33 — Simplification & automatisation

## Simplification
- Fusion de la logique « Mon travail » et « Tickets & tâches » dans Mon travail.
- Retrait du Centre d'actions comme destination indépendante.
- Retrait de « À surveiller » du menu principal : les alertes restent contextuelles dans Pilotage et Analyse financière.
- Fiche client ramenée à quatre groupes de navigation : Vue d'ensemble, Travail, Documents & informations, Plus.
- Les fonctions existantes ne sont pas supprimées : elles sont regroupées pour éviter la multiplication des onglets visibles.

## Automatisations ajoutées
- Classification de documents par nom (FEC, Balance, Liasse, TVA, Autre).
- Calcul de complétude d'un dossier et liste des informations manquantes.
- Architecture non destructive : aucune modification des comptes, mots de passe, rôles ou données Auth.

## À poursuivre
Les automatisations de classement et de complétude sont prêtes comme services. Leur branchement final aux composants d'import et à la fiche client peut être fait progressivement afin de respecter le schéma Supabase déjà en production.


---

# CHANGELOG-V35-AUTOMATISATION

# NOVACAB V35 — Automatisation & intelligence

## Inclus
- Comparaison financière sur périodes réellement comparables lorsque les imports N et N-1 contiennent le détail mensuel.
- Détection automatique du nombre de mois d'un FEC conservée et renforcée.
- Stockage dans les KPI des soldes par compte et des métriques mensuelles pour les prochaines analyses.
- Détection des variations inhabituelles de comptes entre deux exercices.
- Révision intelligente : contrôles proposés automatiquement selon les comptes détectés (banque, clients, fournisseurs, TVA, charges).
- TVA : normalisation renforcée des mots-clés (majuscules/minuscules, accents, tirets, points, espaces) et conservation de `normalized_keyword` / `target_account`.
- La timeline / historique dossier existante reste la source chronologique unique afin d'éviter un nouveau doublon.
- Les rubriques principales de la sidebar utilisent désormais le bleu NOVACAB plutôt que le noir.

## Important
Pour bénéficier de la comparaison exacte Janvier-Août entre N et N-1, les deux exercices doivent avoir été importés avec cette version afin que les métriques mensuelles soient disponibles.


---

# CHANGELOG-V37-KPI-SECTORIELS

# NOVACAB V37 — KPI sectoriels annuels

## Ajouts
- Référentiel `sector_kpis` historisé par secteur, exercice et indicateur.
- Détection du secteur client conservée depuis le code APE/NAF.
- Nouveau menu **Référentiels KPI sectoriels** pour les rôles de management.
- Ajout / mise à jour / suppression des benchmarks depuis NOVACAB.
- Les données de chaque exercice sont conservées : une mise à jour annuelle n'écrase pas l'historique.
- Source et unité stockées avec chaque KPI.

## Assistante NOVACAB
- Fenêtre avec zone de conversation réellement scrollable.
- Réponses directes aux questions sur le CA, l'EBE, le résultat net et la trésorerie.
- Prise en compte de l'année demandée et de la période réellement couverte par le FEC.

## Supabase
Exécuter `supabase-sector-kpis-v37.sql` dans SQL Editor.

### Mise à jour annuelle
Ajouter les lignes du nouvel exercice dans **Référentiels KPI sectoriels**. Les exercices précédents restent disponibles pour les analyses historiques.


---

# CHANGELOG-V39-BENCHMARKS-SECTORIELS

# NOVACAB V39 — Benchmarks sectoriels fiables

## Ajouts
- Référentiel sectoriel historisé par exercice.
- Source, URL, date de publication et date de vérification.
- Médiane + Q25/Q75 lorsque disponibles.
- Division NAF et tranche de chiffre d’affaires optionnelles.
- Sources initiales enregistrées : Banque de France/FIBEN et BCE/INPI.

## Important
Aucune valeur sectorielle n’est inventée ou préremplie artificiellement. Les valeurs doivent être importées depuis une publication identifiable. La structure V39 permet de les enrichir année après année sans redéployer l’application.


---

# CHANGELOG-V6-SOCIAL

# NOVACAB — V6 Social & imports

## Corrections
- Social & paie : bouton « Importer Excel/CSV » réellement fonctionnel.
- Social & paie : bouton « Nouvelle action » ouvre maintenant la création d'une tâche/action avec client, responsable, priorité et échéance.
- Import social : aperçu préalable, format attendu, contrôle des lignes et confirmation obligatoire avant écriture.
- Accès organismes sociaux : import du classeur avec aperçu préalable, règles de colonnes, lignes valides/à corriger et confirmation obligatoire.
- Accès organismes sociaux : rubrique visible par tous ; modification réservée aux Admin, Expert, Chef de mission et Gestionnaire de paie.
- Signature mail : option « Insérer automatiquement ma signature », éditable et mémorisée par utilisateur.
- Vue d'ensemble : nouveau graphique « Par catégorie fiscale » (BIC, BNC, BA, EI, IS…), avec filtre vers le registre.
- Fiche client : champ « Catégorie fiscale » avec auto-détection ou valeur explicite.
- Cotisations sociales : détection BTP prioritaire par code NAF 41/42/43, avec contrôles PRO BTP et CIBTP ajoutés aux vérifications proposées.

## Validation
Le projet est livré sous forme de source Vite/React. La commande `npm ci` n'a pas pu terminer dans l'environnement de génération (délai d'exécution), donc aucun build Vite complet n'est déclaré comme validé ici.


---

# CHANGELOG-V7-IMPORT-ORGANISMES

# NOVACAB V7 — Import Accès organismes sociaux

- Ajout du bouton **Télécharger le modèle Excel**.
- Le modèle contient deux feuilles : `Accès organismes` et `Instructions`.
- Ajout du bouton **Format attendu** avant tout import.
- Prévisualisation détaillée avant écriture en base.
- Rapprochement client par ordre : nom exact, SIREN, SIRET.
- Les colonnes obligatoires sont : `Organisme` + `Client/Dossier` ou `SIREN/SIRET`.
- Les colonnes `Libellé`, `Identifiant`, `Mot de passe`, `URL`, `Note` sont optionnelles.
- Les lignes non reconnues sont bloquées mais les lignes valides peuvent être importées.
- Les organismes non référencés sont conservés comme libellés personnalisés avec avertissement.
- Aucun accès n'est créé avant confirmation explicite.


---

# CHANGELOG-V8-MODE-SOMBRE

# NOVACAB V8 — Mode sombre professionnel

## Modifications

- Ajout d'un vrai thème **Sombre** depuis `Compte > Apparence` et `Compte > Préférences`.
- Le thème clair reste inchangé comme thème par défaut.
- Persistance du choix dans `localStorage` sous `novacab-theme`.
- Palette sombre alignée sur la maquette NOVACAB fournie : bleu nuit profond, cartes bleu ardoise, bordures bleutées discrètes, texte blanc cassé et accent bleu NOVACAB.
- Sidebar, barre supérieure, cartes, champs, listes, tableaux, badges, états actifs et composants de compte utilisent désormais les mêmes variables de thème.
- Suppression des principaux fonds blancs codés en dur afin d'éviter les ruptures visuelles en sombre.
- Contrôles `input/select/textarea` adaptés au mode sombre.
- Ombres et contrastes ajustés pour rester lisibles sans produire d'effet gris/blanc agressif.
- Le mode sombre ne modifie pas la logique métier ni les permissions.


---

# CHANGELOG-V9-CHECKLISTS-BILANS-REGISTRE

# NOVACAB — V9 : bilans, checklists, registre et navigation

## Modifications
- Ajout du suivi des bilans annuels avec calcul du nombre de dossiers actifs et du nombre de bilans restants.
- Les échéances de bilan utilisent la date de clôture + 3 mois ; aucune deadline fixe au 31/12 n'est affichée.
- Renommage de la progression de l'accueil en Checklist Dossier Permanent (DP).
- Ajout de la Checklist Dossier Annuel (DA).
- Statuts communs DA/DP : Non fait (rouge), En cours (orange), Fait (vert).
- Regroupement DA/DP dans une rubrique dédiée Checklists DA / DP, hors Accueil.
- Ajout de l'export Excel DA/DP avec synthèse et détail.
- Registre clients : import/export des informations générales et import/export des fiches contact.
- Ajout de modèles Excel pour les informations générales.
- Rafraîchissement : conservation de la vue, du dossier ouvert et des onglets ouverts via localStorage.
- Événements client : le dossier devient dépliable avec Résiliations, Reprises et Missions exceptionnelles ; le clic ne mène plus vers une page blanche.
- Accès organismes sociaux : consultation/modification réservées aux Admin, Experts et Chefs de mission dans l'interface et dans les politiques RLS fournies.

## V40+ — suivi des réunions, timeline, droits dossier et PDF
- Ajout d'une vue d'ensemble par dossier avec fil de vie (réunions, tâches, activités, documents).
- Les actions structurées d'un rendez-vous peuvent être assignées, datées et créent automatiquement des tâches NOVACAB.
- Ajout d'un niveau d'accès par dossier : lecture / modification, avec conservation du mode d'affectation métier pour les anciens dossiers.
- Ajout d'un export PDF via la fonction d'impression du navigateur pour les comptes-rendus de réunion.
- Le module Applications reste la porte d'accès aux logiciels spécialisés externes.
- Migration SQL : `supabase/v40-dossier-access-rights.sql`.
