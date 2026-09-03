# NOVACAB — Accès organismes sociaux

Cette version ajoute une rubrique sécurisée pour les accès URSSAF, Net-entreprise, SYLAE, CIBTP, OPCO, France Travail, médecine du travail, etc.

## Sécurité

La rubrique est visible dans NOVACAB pour tous les utilisateurs actifs du portefeuille.
La modification des accès est réservée aux rôles :
- Admin
- Expert
- Chef de mission
- Gestionnaire de paie

La même séparation lecture/écriture est appliquée par les politiques RLS de Supabase.

## À faire dans Supabase

1. Ouvrir **Supabase → SQL Editor**.
2. Copier le contenu de `supabase-acces-organismes-sociaux.sql`.
3. Exécuter le script une seule fois.
4. Vérifier que la table `acces_organismes_sociaux` est créée.
5. Vérifier que la réplication Realtime est activée pour cette table si vous utilisez le temps réel.

Le portefeuille **Axe Experts** n'est pas renommé. NOVACAB reste le nom du logiciel de pilotage ; le nom réel du cabinet reste affiché dans l'application.

## Rôle Gestionnaire de paie

Le rôle `gestionnaire_paie` est maintenant pris en charge par NOVACAB.
Après création/validation du compte Auth, l'Admin peut attribuer ce rôle depuis **Équipe**.

Exécuter également `supabase-roles-social-migration.sql` une fois afin d'appliquer les droits RLS suivants :
- Accès organismes sociaux : lecture pour tous les utilisateurs actifs du portefeuille ;
- création/modification/suppression : Admin, Expert, Chef de mission et Gestionnaire de paie.


## Sécurité V39

Les secrets sont chiffrés au repos avec `pgcrypto` et une clé conservée dans Supabase Vault. Exécuter `supabase/2026-09-03-social-access-encryption.sql` après avoir créé le secret Vault `novacab_social_access_key` (clé aléatoire d'au moins 32 caractères). L'application utilise exclusivement les fonctions RPC sécurisées et ne sélectionne plus directement la colonne chiffrée.
