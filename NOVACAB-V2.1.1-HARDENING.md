# NOVACAB V2.1.1 — Hardening

Correctifs inclus :
- cache local des états produit isolé par `portefeuille_id`; aucun fallback local générique entre cabinets;
- Administration : Supabase devient la source de vérité, avec sauvegarde distante débouncée de 500 ms;
- politiques RLS notifications : ciblage d'un autre utilisateur réservé aux managers/super-admins; suppression limitée au destinataire ou manager;
- RPC `save_cabinet_product_state` et `unread_notification_count` garanties par la migration V2.1;
- vérificateur d'architecture renforcé;
- tests supplémentaires sur les conventions comptables `0`/`9`.

## Déploiement
1. Appliquer `supabase/v2.1-architecture-consolidation.sql` après les migrations historiques.
2. Déployer le frontend.
3. Exécuter `npm test`.
4. Exécuter `npm run verify:architecture`.
5. Tester avec deux utilisateurs de cabinets différents et vérifier qu'aucun cache local ou notification ne traverse le périmètre.
