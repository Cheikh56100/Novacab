# NOVACAB V2.2.1 — Audit rôles & permissions sur les parcours

Date : 6 septembre 2026

## Périmètre

Rôles contrôlés : **Admin, Expert, Chef de mission, Collaborateur, Gestionnaire de paie**.

Le contrôle porte sur :
- navigation principale et navigation directe/restaurée ;
- accès aux dossiers clients et aux onglets sensibles ;
- administration & direction ;
- équipe, rôles et affectations ;
- tâches ;
- accès aux organismes sociaux ;
- matrice des droits ;
- cohérence UI / garde-fous Supabase.

## Résultat

Le parcours applicatif a été durci :

| Rôle | Parcours principal | Administration | Équipe | Données sensibles sociales | Matrice des droits |
|---|---|---|---|---|---|
| Admin | Complet cabinet | Oui | Oui | Oui | Oui |
| Expert | Complet métier | Cockpit oui | Oui | Oui | Non |
| Chef de mission | Complet opérationnel | Non | Oui | Oui | Non |
| Collaborateur | Dossiers + travail comptable/TVA | Non | Non | Non | Non |
| Gestionnaire de paie | Dossiers + social/paie | Non | Non | Social oui | Non |

## Correctifs appliqués

1. **Navigation protégée côté état** : `navTo()` refuse les vues non autorisées, y compris en navigation directe.
2. **Historique protégé** : retour arrière ne peut plus restaurer une vue interdite après changement de rôle.
3. **Client protégé** : un onglet client restauré depuis le stockage local est fermé s'il n'est plus visible dans le portefeuille du rôle courant.
4. **Onglets client sensibles** : Droits d'accès, Accès & codes, Accès organismes sociaux, Social, AGE/AGO et Forme juridique sont désormais filtrés par rôle.
5. **Matrice des droits** : réservée à l'Admin dans le parcours V2.2.1.
6. **Équipe** : les actions d'administration sont contrôlées dans les callbacks et l'UI ; un Expert/Chef ne peut pas promouvoir un compte en Admin/Expert.
7. **Tâches** : un utilisateur non-manager peut modifier/terminer ses tâches affectées ; archivage et suppression sont réservés au management.
8. **Validation de compte** : le RPC Supabase est aligné sur le parcours : Admin du cabinet ou Super Admin.
9. **Backend team** : `is_current_user_cabinet_manager()` vérifie désormais réellement le rôle, et non la seule appartenance au portefeuille.
10. **Backend matrice** : le RPC de persistance refuse les écritures sur `permissions-matrix` pour les rôles non Admin.

## Tests automatisés

- `npm run verify:roles` : **OK — 5 rôles × 31 vues contrôlés**.
- `npm test` : **20/20 tests TVA OK**.
- `npm run verify:architecture` : **OK**, avec l'avertissement historique déjà connu sur `current_team_id` redéfinie dans plusieurs migrations.

## Point restant à valider en environnement Supabase de production

Le dépôt contient des durcissements RLS pour les tables cœur, l'équipe, les dossiers et les états produit. En revanche, les tables `tasks` et `legal_requests` ne disposent pas de politiques RLS clairement présentes dans les migrations versionnées inspectées.

**Conclusion :** le parcours UI et les contrôles de rôle du code sont stabilisés, mais la V2.2.1 ne doit être déclarée totalement sécurisée qu'après vérification dans le projet Supabase de production que `tasks` et `legal_requests` sont bien protégées par RLS et que les policies correspondent aux cinq rôles.
