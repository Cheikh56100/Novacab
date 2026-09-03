# NOVACAB V40 — expérience utilisateur

## Objectif

La V40 ne cherche pas seulement à être fonctionnelle : elle doit donner à l'utilisateur une sensation de calme, de maîtrise et de progression dès la connexion.

### Principes
- **Une action évidente** : chaque écran doit répondre à « que dois-je faire maintenant ? ».
- **Hiérarchie visuelle** : urgences > actions du jour > information > détail.
- **Chaleur maîtrisée** : conserver une interface professionnelle avec de petites touches positives plutôt qu'un tableau de bord froid.
- **Densité contrôlée** : réduire les blocs visuels inutiles, utiliser les espaces et regrouper l'information.
- **Feedback** : toute action importante doit confirmer son résultat sans interrompre le travail.
- **Accessibilité** : focus clavier visible, contraste correct, support de `prefers-reduced-motion`.

## Accueil V40

Le dashboard dispose maintenant d'un bloc d'accueil orienté action :
- salutation contextuelle ;
- état synthétique du cabinet ;
- nombre de dossiers actifs ;
- nombre de priorités ;
- trois actions principales : priorités, dossier, nouveau client.

## Performance

Les animations sont limitées aux éléments de surface et respectent `prefers-reduced-motion`. Les modules lourds déjà lazy-loadés restent hors du chemin critique.

## Suite recommandée

1. Instrumenter les temps de chargement et les erreurs.
2. Découper davantage `CabinetApp` et `core`.
3. Lazy-loader les pages lourdes (analyse financière, TVA automatique, administration).
4. Virtualiser les très longues listes clients/tâches si les volumes réels le justifient.
5. Ajouter des tests de parcours utilisateur sur les actions critiques.
