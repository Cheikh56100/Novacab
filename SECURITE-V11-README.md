# NOVACAB TVA Auto — V11

## Sécurité
- Journal d’audit réservé à l’Administrateur.
- Lecture protégée côté Supabase/RLS.
- Journalisation des changements de mot de passe.
- Les collaborateurs ne disposent d’aucune vue d’audit.

## Périmètre
NOVACAB Review a été retiré. Le dossier client et les modules TVA existants restent inchangés.

## Migration
Exécuter `supabase/supabase-v11-security-audit-admin.sql` dans Supabase après les migrations existantes.
