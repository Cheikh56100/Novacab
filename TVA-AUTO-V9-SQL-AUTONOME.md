# NOVACAB TVA AUTO V9 — SQL AUTONOME

## Installation
1. Ouvrir Supabase > SQL Editor.
2. Coller/exécuter `supabase/tva-engine-v9-autonome.sql`.
3. Cette migration crée les tables TVA manquantes, notamment `public.tva_rules`, avant de créer les règles et index.
4. Elle peut être exécutée même si les migrations TVA V4/V6/V8 n'ont jamais été exécutées.

## Architecture des règles
- Taux par défaut du dossier : `clients.data.tvaDefaultRate`.
- Règle de compte : `tva_rules`.
- Compte mixte : `tva_rules.is_mixed = true` ; aucun taux unique n'est imposé.
- Règle mot-clé : `tva_keyword_rules`, globalement ou avec `account_number`.
- Priorité : compte + mot-clé > compte > défaut dossier > arbitrage.

## Important
Les politiques RLS sont ouvertes aux utilisateurs `authenticated` pour rester compatibles avec l'application actuelle. Pour la production multi-portefeuilles, elles devront être remplacées par des politiques filtrant le portefeuille/client autorisé.
