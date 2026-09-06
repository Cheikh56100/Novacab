# NOVACAB — Phase « finition produit »

Cette livraison pose la fondation de la migration multi-utilisateur demandée :

- **Source de vérité Supabase par cabinet** via `cabinet_product_states`.
- **RLS cabinet** fondée sur le collaborateur authentifié (`team.auth_user_id` → `portefeuille_id`).
- **Realtime** pour les états partagés.
- **Traçabilité** dans `product_audit_log`.
- **Notifications persistantes** avec clé de déduplication.
- **Automatisations J+7 / J+15 / J+30 / J+45**, idempotentes, dans `automation_runs`.
- **Administration** commence la migration : son état principal est chargé/sauvegardé dans Supabase avec fallback local.
- La création d'une facture programme automatiquement les quatre jalons et journalise l'action.

## À exécuter dans Supabase

1. Exécuter les migrations historiques du projet dans leur ordre habituel.
2. Exécuter `supabase-product-finish-migration.sql`.
3. Vérifier que chaque utilisateur actif possède une ligne `team` avec :
   - `auth_user_id`
   - `portefeuille_id`
   - `statut = 'actif'`
4. Vérifier Database → Replication pour `cabinet_product_states` et `notifications`.

## Principe de migration des autres modules

Chaque module doit suivre la même chaîne :

**détecter → afficher → permettre d'agir → tracer → ne rien oublier**

Concrètement :

1. déplacer son état métier hors de `localStorage` ;
2. le charger par cabinet ;
3. écrire avec RLS ;
4. écouter Realtime si plusieurs collaborateurs travaillent dessus ;
5. tracer les actions métier ;
6. créer les notifications/automatisations dédupliquées ;
7. conserver le cache local uniquement comme secours de migration.

## Prochaine passe recommandée

1. Portefeuille clients + fiche client
2. Tâches + Planning + Checklists
3. TVA / IS / CFE / Bilans
4. Social / paie + Juridique
5. Résiliations / reprises / missions exceptionnelles
6. Notifications + recherche globale + exports
7. Contrôles complets par rôle et parcours
8. Responsive, états vides, erreurs et nettoyage UI

> `cabinet_product_states` est une **couche de transition**. Les gros objets métier doivent ensuite être normalisés dans leurs propres tables Supabase avec `portefeuille_id` et RLS.

## V2.3 — Démarrage effectif de la finition produit

### Lot traité
- **Portefeuille clients** : la source distante existante reste la source de vérité ; la synchronisation multi-utilisateur est conservée.
- **Tâches** : création, mise à jour et clôture sont désormais tracées dans `product_audit_log`.
- **Relances** : toute tâche avec échéance programme J+7, J+15, J+30 et J+45 de façon idempotente.
- **États produit** : la sauvegarde partagée utilise désormais une RPC avec versionnement optimiste afin de réduire le risque d'écrasement silencieux entre onglets/collaborateurs.
- **Automatisations** : `process_due_automation_runs()` transforme les jalons échus en notifications dédupliquées.

### À configurer dans Supabase
1. Exécuter `supabase-product-finish-migration.sql`.
2. Configurer un job quotidien Supabase Cron/pg_cron qui appelle `process_due_automation_runs()`.
3. Tester avec deux comptes appartenant au même cabinet : création de tâche, mise à jour et réception des changements temps réel.

### Prochain lot
1. Planning
2. Checklists
3. Fiche client (parcours et actions critiques)
4. Notifications centralisées
5. TVA / IS / Bilans : détection → action → trace → contrôle des oublis

## V2.4 — Lot 2 : parcours partagé
- Planning : les déplacements d'échéance régénèrent les jalons J+7/J+15/J+30/J+45.
- Checklists : chaque modification est tracée dans le journal produit.
- Notifications : service dédié, lecture temps réel et notifications privées/cabinet.
- Supabase : RPC commune `audit_product_event`, index de lecture et garde-fou de visibilité.
- Principe produit appliqué : détecter → afficher → agir → tracer → ne rien oublier.
