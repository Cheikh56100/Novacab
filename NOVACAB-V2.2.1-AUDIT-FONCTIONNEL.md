# NOVACAB V2.2.1 — Audit fonctionnel écran par écran

## Périmètre
Audit statique du code livré V2.2.1 : navigation, routes, principaux écrans métier, cohérence des libellés, persistance et parcours visibles. Cet audit ne remplace pas un test manuel connecté à Supabase.

## Synthèse

| Domaine | État | Priorité | Conclusion |
|---|---|---:|---|
| Vue d'ensemble | 🟢 | P2 | Riche et opérationnelle ; ne pas transformer en dashboard KPI expert-comptable |
| Registre clients | 🟢 | P2 | Très complet ; surtout améliorer la lisibilité du parcours |
| Fiche client | 🟢 | P1 | Très riche ; principal enjeu = hiérarchie des informations |
| TVA / TVA Auto | 🟢🟢 | P1 | Domaine stratégique ; fiabiliser plutôt qu'ajouter |
| Révision | 🟢 | P1 | Déjà présente ; pas de nouveau module à créer |
| Impôts & taxes | 🟢 | P2 | Bon périmètre ; vocabulaire à harmoniser |
| Social / cotisations | 🟢 | P2 | Fonctionnel et explicite après correction des organismes |
| Juridique | 🟢 | P2 | Bon socle ; forme juridique pertinente |
| Planning / tâches | 🟢 | P1 | Présents ; vérifier les liens entre tâches, échéances et planning |
| Administration / droits | 🟢🟢 | P1 | Bon socle ; contrôler la cohérence des rôles et accès |
| Applications | 🟢 | P2 | Bon découplage ; FEC / Balance & KPI correctement externalisé |
| Archives / corbeille | 🟢 | P2 | Présentes ; parcours cohérent |
| Recherche | 🟠 | P1 | Une recherche globale + recherches locales : clarifier leur rôle |
| Persistance | 🟠 | P1 | Certaines données métier utilisent encore localStorage |
| Routes/navigation | 🟠 | P1 | Plusieurs routes existent sans entrée claire dans la sidebar |
| SQL / architecture | 🟠 | P0 | Les migrations historiques et fonctions canoniques doivent être vérifiées |

## 1. Vue d'ensemble

**Existant :** KPI de dossiers, TVA, bilans, tâches, échéances, répartitions et supervision.

**Verdict :** conserver. Ce n'est pas le « Tableau de bord Expert-Comptable » supprimé : il s'agit d'une vue générale du cabinet.

**À surveiller :** ne pas multiplier les KPI ni recréer un cockpit fiscal/social autonome.

## 2. Registre clients

**Existant :** recherche, filtres, portefeuille, collaborateurs, import/export Excel, fiches contacts, checklists, ouverture rapide d'un dossier.

**Verdict :** très complet.

**À améliorer :** lisibilité et hiérarchie des actions ; ne pas ajouter de nouvelles fonctions avant d'avoir simplifié les actions existantes.

## 3. Fiche client

**Existant :** vue d'ensemble, tickets, réunions, droits, champs personnalisés, documents/informations, TVA, bilan, impôts & taxes, AGE/AGO, forme juridique, révision, accès, social, demandes/pièces, rentabilité, validation, notes, historique.

**Verdict :** très riche.

**Point de vigilance P1 :** beaucoup d'onglets. Le travail prioritaire est de vérifier que chaque groupe répond à une question claire : informations, travail, fiscalité, social, plus.

**Correctif déjà cohérent :** Fiscalité → « Impôts & taxes » au lieu d'un intitulé limité aux acomptes.

## 4. TVA / TVA Auto

**Existant :** import de données, détection des colonnes, normalisation, doublons, préparation, règles, mots-clés, arbitrages, historique, précédente TVA validée, verrouillage et validation.

**Verdict :** fonctionnalité stratégique.

**Orientation :** les comptes 401/411 et conventions 0/9 restent une logique du moteur de préparation TVA, pas un module « Comptabilité & NOVA ».

**À faire P1 :** tests de cas réels et contrôle des résultats avant toute extension fonctionnelle.

## 5. Révision

**Existant :** suivi de révision et rapprochements bancaires, avec révision des comptes de cotisations reliée au social.

**Verdict :** ne pas créer un nouveau « dossier de révision ». Le module existe déjà.

**À améliorer :** cohérence des statuts et des passages entre Révision, Social, TVA et fiche client.

## 6. Impôts & taxes

**Existant :** IS, acomptes IS, solde IS, CFE, paiements et statuts.

**Verdict :** bon périmètre.

**Point de vigilance :** conserver le vocabulaire « Impôts & taxes » partout dans la fiche client et éviter les anciens intitulés « Acomptes » lorsqu'ils désignent l'ensemble du module.

## 7. Social / cotisations

**Existant :** suivi social, cotisations, paie, accès organismes sociaux.

**Verdict :** bon socle.

**Lisibilité :** les types d'organismes sont explicités (URSSAF, retraite, prévoyance, PRO BTP/CIBTP selon le dossier), puis suivis mois par mois.

**À faire :** vérifier la cohérence entre le type d'organisme affiché et les données enregistrées par dossier.

## 8. Juridique

**Existant :** prestations juridiques, AGE/AGO, résiliation, reprise, missions exceptionnelles, forme juridique.

**Forme juridique :** la checklist est déjà adaptée à la forme du dossier et rappelle qu'il s'agit d'une checklist de vigilance.

**Verdict :** pertinent ; ne pas transformer cela en moteur juridique exhaustif.

## 9. Planning / tâches / échéances

**Existant :** planning, tâches, tâches récurrentes, échéances, cockpit quotidien et liens depuis la vue d'ensemble.

**Constat P1 :** « Mes tâches » est une route fonctionnelle appelée depuis le Dashboard, mais n'est pas un item direct de la sidebar.

**Décision à prendre :** soit ajouter « Mes tâches » au pilotage quotidien, soit assumer qu'elle reste accessible uniquement depuis le cockpit. Pour un logiciel cabinet, l'accès direct est probablement préférable.

## 10. Applications

**Existant :** OFX Bridge, Import FEC / Balance & KPI, NOVACAB Tax, NOVACAB Mobilité.

**Verdict :** bon découpage.

**Point important :** Import FEC / Balance & KPI est bien traité comme application spécialisée externe et non comme module comptable interne. C'est conforme à la décision produit.

## 11. Recherche

**Constat P1 :** la TopBar contient une recherche globale. Plusieurs écrans possèdent aussi leur propre recherche locale, ce qui est normal.

**Problème identifié :** la recherche globale possède un bouton loupe desktop et un bouton loupe mobile, mais il ne s'agit pas de deux recherches différentes : ce sont deux variantes responsive du même contrôle.

**Conclusion :** ne pas supprimer la recherche mobile. En revanche, supprimer toute autre loupe qui ferait doublon dans la même zone fonctionnelle si elle existe visuellement dans le rendu final.

## 12. Archives / corbeille

**Existant :** archivage, désarchivage selon rôle, corbeille, restauration et suppression définitive réservée à l'administration.

**Verdict :** cohérent.

**À tester manuellement :** permissions et visibilité d'un dossier après passage en corbeille.

## 13. Administration / droits

**Existant :** cockpit administration, matrice complète des droits, audit, gestion équipe/portefeuilles et administration NOVACAB pour super-admin.

**Constat :** le libellé « Équipe » est utilisé dans plusieurs contextes, avec le même id de navigation. Ce n'est pas forcément un bug, mais c'est à clarifier visuellement pour éviter la confusion entre équipe du cabinet et cabinets/équipes côté super-admin.

## 14. Routes orphelines / accès indirects

Routes présentes dans le code mais sans entrée directe évidente dans la sidebar :

- `mes-taches` — accessible depuis le Dashboard ;
- `tva-auto` — accessible depuis la fiche client ;
- `aides-secteur` — aucune navigation directe trouvée dans le code audité ;
- `mission` — aucune navigation directe trouvée dans le code audité ;
- `super-cabinets` / `super-team` — variantes techniques autour d'Équipe côté super-admin.

**Priorité P1 :** décider si `aides-secteur` et `mission` sont volontairement cachées ou doivent être accessibles. Une route métier sans point d'accès clair est un risque de dette produit.

## 15. Persistance

### Préférences UI — OK
- thème ;
- densité ;
- langue ;
- préférences de notifications ;
- état de navigation.

### À revoir P1
- données juridiques dans `services/legal.js` ;
- modèles de mails personnalisés ;
- signature utilisateur ;
- profil collaborateur ;
- autres caches métier dans `cabinetState.js`.

**Règle cible :** Supabase = source de vérité métier ; localStorage = préférences/caches UI uniquement.

## 16. Nettoyage technique

Les anciennes briques NOVA / import autonome ont été retirées du répertoire source audité.

## 17. Priorités recommandées

### P0 — sécurité / données
1. Audit SQL/RLS et fonctions canoniques.
2. Vérification du périmètre cabinet/portefeuille/équipe.

### P1 — produit
1. Clarifier les routes sans accès direct.
2. Décider de l'accès direct à « Mes tâches ».
3. Vérifier les parcours fiche client.
4. Tester la chaîne TVA Auto sur cas réels.
5. Revoir les données métier encore persistées côté navigateur.
6. Harmoniser les intitulés.

### P2 — finition
1. Nettoyer les doublons de libellés super-admin.
2. Simplifier certaines actions de la fiche client.
3. Harmoniser les écrans vides, messages d'erreur et confirmations.

## Décision produit

**Aucune nouvelle grosse fonctionnalité recommandée à ce stade.**

La prochaine étape doit être la correction des points P0/P1 et un test manuel des parcours critiques :

`Connexion → Vue d'ensemble → Client → TVA → TVA Auto → Révision → Social → Juridique → Validation → Archives/Corbeille`.
