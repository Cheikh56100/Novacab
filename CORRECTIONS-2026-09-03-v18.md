# NOVACAB — corrections V18

- Restauration des modèles de « Mails types » avec titres, descriptions et catégories cohérentes.
- Ajout du module « Applications » dans « Cabinet & outils ».
- Ajout du lien direct vers OFX Bridge. Le lien du futur logiciel d’analyse financière est piloté par `VITE_FINANCIAL_ANALYSIS_URL`.
- Retrait de « Analyse financière » et « Référentiels KPI sectoriels » du menu « Comptabilité & fiscalité ».
- Suppression de la détection d’anomalies comptables de l’analyse financière interne.
- Correction des imports FEC : un seul import actif par client/exercice, suppression de tous les doublons du même exercice et effacement du snapshot client lors de la suppression.
- Correction des évolutions sur exercice partiel : si les mêmes mois existent dans N et N-1, la comparaison est calculée sur cette fenêtre au lieu d’afficher systématiquement « période non comparable ».
