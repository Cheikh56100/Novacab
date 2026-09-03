# NOVACAB — Comptes démo

Cette version ajoute un espace **Comptes démo** réservé à l'Admin.

## Ce qui a été ajouté

- Menu **Comptes démo** visible uniquement par l'Admin.
- Création d'un compte prospect avec :
  - cabinet/prospect
  - email
  - mot de passe temporaire
  - durée 7 / 30 / 90 jours ou sans expiration
- Création automatique d'un portefeuille isolé.
- Création automatique de **5 dossiers fictifs** :
  1. Boulangerie Martin — SARL / restauration
  2. BTP Construction Pro — SAS / BTP
  3. Tech Solutions — SAS / informatique
  4. Garage Auto Plus — SARL / automobile
  5. Studio Élégance — EI / services
- Bandeau **MODE DÉMO** pour le prospect.
- Réinitialisation des 5 dossiers.
- Désactivation / réactivation du compte.
- Suppression du compte démo.
- Expiration automatique de l'accès.
- Le compte démo est un profil Expert pour montrer les fonctionnalités métier, mais les modifications de l'équipe sont désactivées.
- Les données du compte démo sont isolées par `portefeuille_id`.

## Installation Supabase — obligatoire

### 1. SQL

Dans **Supabase > SQL Editor**, exécuter :

`supabase/supabase-demo-accounts.sql`

### 2. Edge Function

Déployer :

`supabase/functions/novacab-demo/index.ts`

Avec Supabase CLI :

```bash
supabase functions deploy novacab-demo --project-ref ybewryneaksqhtlagvxk
```

La fonction utilise automatiquement les secrets Supabase `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`. **Ne jamais mettre la service-role key dans React / App.jsx.**

Si le projet utilise le Dashboard Supabase pour les Edge Functions, créer une fonction nommée `novacab-demo` et copier le contenu de `supabase/functions/novacab-demo/index.ts`.

### 3. Frontend

Le frontend appelle la fonction avec :

```js
supabase.functions.invoke("novacab-demo", { body: { action, ...payload } })
```

Aucune clé secrète n'est ajoutée au frontend.

## Utilisation

1. Se connecter avec le compte Admin.
2. Ouvrir **Pilotage & quotidien > Comptes démo**.
3. Cliquer sur **Créer un compte démo**.
4. Renseigner l'email du prospect et un mot de passe temporaire.
5. Transmettre les identifiants affichés au prospect.
6. Le prospect utilise la page de connexion NOVACAB habituelle.
7. Depuis l'Admin, utiliser **Réinitialiser** pour remettre les 5 dossiers à leur état initial.

## Important

La création d'un utilisateur Supabase Auth nécessite la clé `service_role`. Pour cette raison, elle est réalisée exclusivement côté Edge Function. Elle ne doit jamais être exposée dans le code client.
