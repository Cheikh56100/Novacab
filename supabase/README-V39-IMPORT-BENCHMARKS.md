# V39 — Mise à jour des benchmarks

1. Exécuter `novacab-v39-benchmarks-sectoriels.sql` dans Supabase.
2. Conserver une ligne par secteur + exercice + indicateur.
3. Renseigner `source_key`, `source_url`, `published_at` et, si disponible, `q25_value` / `q75_value`.
4. Ne jamais remplacer une année historique : ajouter le nouvel exercice.

Sources de départ : Banque de France/FIBEN (publication annuelle) et BCE/INPI (percentiles par cohorte).
