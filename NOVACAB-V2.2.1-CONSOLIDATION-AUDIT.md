# NOVACAB V2.2.1 — Audit de consolidation

## Périmètre
Audit statique du code source V2.2.1 : navigation, composants, persistance, Supabase/RLS et tests.

## 1. Nettoyage réalisé
Les anciennes briques retirées du produit ont été supprimées physiquement du source :
- Assistant NOVA
- Dashboard Expert-Comptable
- composants graphiques/espaces devenus orphelins identifiés par l'audit

Aucune référence active à ces composants n'est conservée dans `src/`.

## 2. Architecture / RLS
La fonction `public.current_team_id()` est historiquement redéfinie dans plusieurs migrations.
**Décision : ne pas modifier ni supprimer les anciennes migrations déjà susceptibles d'avoir été exécutées.**
La migration `v2.1-architecture-consolidation.sql` constitue la définition canonique finale pour les fonctions de périmètre.

Le script `scripts/verify-architecture.mjs` confirme :
- Architecture NOVACAB V2.1 : OK
- avertissement historique sur les redéfinitions de `current_team_id()`

Avant toute nouvelle migration métier, vérifier que les policies utilisent :
- `current_portefeuille_id()` comme périmètre canonique ;
- `current_team_role()` pour le rôle ;
- `is_super_admin()` uniquement lorsqu'un bypass plateforme est explicitement nécessaire.

## 3. Persistance
`localStorage` est conservé pour les préférences UI : thème, densité, langue, préférences de notification.

Des données métier disposent encore d'un cache local ou d'une persistance locale : profil collaborateur et modèles/signature de mails. Elles disposent d'une synchronisation serveur pour le profil collaborateur ; les modèles de mails restent locaux par conception actuelle.

**À ne pas faire sans migration dédiée :** déplacer ces données vers Supabase de manière improvisée.

## 4. Navigation
La recherche globale de la TopBar est distincte des recherches locales d'écran. Les recherches locales doivent rester lorsqu'elles filtrent la liste courante.

Le sélecteur de dossier dans la TopBar (`+`) n'est pas une deuxième recherche globale : il sert à ouvrir rapidement un dossier existant ou créer un client.

## 5. TVA Auto
Les tests du moteur TVA passent intégralement : **20/20**.
Les conventions comptables 401/411 et 0/9 restent dans le moteur TVA, pas dans un module Comptabilité autonome.

## 6. Routes / écrans
`AidesSecteurView` et `MissionsExceptionnellesView` sont bien raccordés à l'application.
Les routes/écrans qui ne figurent pas dans la navigation doivent être considérés comme candidats à une décision produit avant suppression.

## 7. Validation
- Tests Node : **20 passés, 0 échec**.
- Vérification architecture : **OK**, avec l'avertissement historique documenté ci-dessus.
- Build Vite : non exécuté dans l'environnement d'audit si les dépendances npm ne sont pas disponibles localement.
