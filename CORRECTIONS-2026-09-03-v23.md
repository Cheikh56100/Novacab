# NOVACAB V23 — Corrections

- Correction du crash de la Vue d'ensemble : import manquant de `Plus` dans `Dashboard.jsx`.
- Nettoyage de l'import dupliqué dans `MailTypesView.jsx`.
- Les montants du modèle TVA sont désormais alimentés uniquement depuis la déclaration TVA Auto validée de la période courante (`tva_declarations`).
- Si aucune déclaration validée n'existe pour la période, les variables TVA restent vides (aucun faux montant repris depuis des données anciennes/locales).
- Le montant de TVA à payer provient de `net_tva` de la déclaration validée.
- La sous-traitance/autoliquidation provient de `autoliquidation_tva`.
- Les variables disponibles ont été retirées de l'interface Mails types.
- Le modèle TVA par défaut est `tva-synthese`.
