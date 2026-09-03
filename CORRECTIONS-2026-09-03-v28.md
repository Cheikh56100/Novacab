# NOVACAB V28 — correction import Excel TVA

- Correction robuste du chargement de `excelUtils.js` : `core.js` utilise désormais un import namespace (`* as ExcelUtils`) au lieu d'un import nommé susceptible de bloquer le module au démarrage.
- Les fonctions `exportTvaDeadlinesToExcel` et `importTvaDeadlinesFromExcel` restent des exports nommés directs dans `excelUtils.js`.
- Cette correction évite le crash d'instanciation Vite `does not provide an export named 'exportTvaDeadlinesToExcel'`.
