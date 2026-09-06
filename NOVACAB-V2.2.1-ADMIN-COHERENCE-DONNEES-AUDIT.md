# NOVACAB V2.2.1 — Audit cohérence des données Admin

## Principe
La Vue admin ne doit pas posséder une copie parallèle de l'état des dossiers. Les statuts de production et les honoraires du bilan sont dérivés des fiches clients et donc mis à jour automatiquement lorsque le collaborateur modifie son dossier.

## Synchronisation réalisée
- `bilan.transmis` / `bilanTermine` alimente automatiquement le Tableau des bilans.
- Une fin de bilan déclenche l'état `À facturer` si le bilan est terminé et que l'échéance correspondante n'est pas payée.
- Les périodicités disponibles sont : mensuel, trimestriel, semestriel, annuel.
- Les dates de facturation sont optionnelles et conservées dans la fiche honoraires du dossier.
- Le montant d'échéance est calculé à partir du montant TTC et de la périodicité.
- Le paiement effectué depuis l'Administration est réinjecté dans la fiche client.

## Référentiels administratifs
Les coûts/abonnements, fournisseurs/contrats et licences disposent désormais d'ajout, suppression, import Excel et export Excel. Les données importées sont ajoutées au référentiel existant.

## Points à poursuivre
1. Remplacer progressivement les états métier administratifs locaux par des tables Supabase dédiées si le volume augmente.
2. Ajouter une vraie génération de facture depuis une obligation de facturation, au lieu du seul statut `À facturer`.
3. Ajouter une piste d'audit détaillée des modifications de paiements et des imports.
4. Ajouter une validation des colonnes importées et un écran d'aperçu avant import en production.
5. Tester les cinq rôles sur une base Supabase réelle avec RLS actif.
