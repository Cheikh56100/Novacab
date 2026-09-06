import test from "node:test";
import assert from "node:assert/strict";
import {
  num,
  cleanHeader,
  normalizeAccount,
  normalizeRow,
  filterTvaRows,
  detectDuplicates,
  inferOperation,
  inferAmounts,
  buildPreparation,
  summarize,
  confidence,
} from "./tvaEngine.js";
import { detectAccountType, equivalentLegacyAccount } from "./accountNormalizer.js";

// ------------------------------------------------------------
// Utilitaires existants (déjà couverts, conservés tels quels)
// ------------------------------------------------------------

test("num normalise les formats monétaires français et internationaux", () => {
  assert.equal(num("1 234,56 €"), 1234.56);
  assert.equal(num("1,234.56"), 1234.56);
  assert.equal(num(""), 0);
});

test("cleanHeader ignore accents et espaces superflus", () => {
  assert.equal(cleanHeader("  Libellé   Écriture "), "libelle ecriture");
});

test("normalizeAccount conserve une référence comptable propre", () => {
  assert.equal(normalizeAccount("  411000 "), "411000");
  assert.equal(normalizeAccount("401.000"), "401");
});

// ------------------------------------------------------------
// num() : cas limites non couverts avant cet audit
// ------------------------------------------------------------

test("num() — cas limite : séparateur de milliers français sans décimales", () => {
  // Un export texte "1.234" (point = séparateur de milliers, pas de virgule
  // décimale) est actuellement interprété comme 1,234 au lieu de 1234.
  // Ce test DOCUMENTE le comportement actuel (potentiellement faux) plutôt
  // que de l'approuver : à surveiller si des exports texte (CSV) utilisent
  // ce format sans jamais accoler de décimales.
  assert.equal(num("1.234"), 1.234, "comportement actuel observé — à valider avec un vrai export CSV");
});

// ------------------------------------------------------------
// confidence() : le nom du test d'origine ("bornée entre 0 et 1") était
// trompeur — la fonction renvoie un pourcentage (0-100), pas un ratio.
// ------------------------------------------------------------

test("confidence() renvoie un pourcentage entier (0-100), pas un ratio (0-1)", () => {
  assert.equal(confidence([]), 0);
  assert.equal(confidence([{ needsArbitrage: false }]), 100);
  assert.equal(confidence([{ needsArbitrage: true }]), 0);
  assert.equal(
    confidence([{ needsArbitrage: true }, { needsArbitrage: false }]),
    50
  );
});

// ------------------------------------------------------------
// filterTvaRows : seules les lignes 401/411 doivent être retenues
// ------------------------------------------------------------

test("le normalisateur comptable reconnaît 401/411 et les conventions 0/9", () => {
  assert.equal(detectAccountType("0ABC123"), "401");
  assert.equal(detectAccountType("9ABC123"), "411");
  assert.equal(detectAccountType("401METRO"), "401");
  assert.equal(detectAccountType("411METRO"), "411");
  assert.equal(detectAccountType("0METRO"), "401");
  assert.equal(detectAccountType("9METRO"), "411");
  assert.equal(equivalentLegacyAccount("0METRO"), "401METRO");
  assert.equal(equivalentLegacyAccount("9METRO"), "411METRO");
  assert.equal(detectAccountType("7METRO"), null);
});

test("filterTvaRows ne retient que les comptes 401 (fournisseurs) et 411 (clients)", () => {
  const rows = [
    normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Fournisseur A", Débit: "120", Crédit: "0" }),
    normalizeRow({ Compte: "411000", Date: "01/03/2026", Libellé: "Client B", Débit: "0", Crédit: "240" }),
    normalizeRow({ Compte: "512000", Date: "01/03/2026", Libellé: "Banque", Débit: "0", Crédit: "120" }),
  ];
  const { kept, ignored } = filterTvaRows(rows);
  assert.equal(kept.length, 2);
  assert.equal(ignored.length, 1);
  assert.equal(kept[0].accountType, "401");
  assert.equal(kept[1].accountType, "411");
});

// ------------------------------------------------------------
// inferAmounts : cas standards, mixtes, exonérés, non récupérables
// ------------------------------------------------------------

test("inferAmounts calcule correctement le HT/TVA pour une opération standard", () => {
  const row = normalizeRow({ Compte: "411000", Date: "01/03/2026", Libellé: "Vente", Débit: "0", Crédit: "1200" });
  const result = inferAmounts(row, { default_tva_rate: 20 });
  assert.equal(result.ht, 1000);
  assert.equal(result.tva, 200);
  assert.equal(result.needsArbitrage, false);
});

test("inferAmounts demande un arbitrage quand le compte est marqué MIXTE", () => {
  const row = normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Achat divers", Débit: "600", Crédit: "0" });
  const result = inferAmounts(row, { default_tva_rate: 20, is_mixed: true });
  assert.equal(result.needsArbitrage, true);
  assert.equal(result.tva, 0, "tant qu'aucun arbitrage humain n'est fait, aucune TVA ne doit être comptée");
});

test("inferAmounts demande un arbitrage quand aucun taux n'est connu", () => {
  const row = normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Achat sans règle", Débit: "600", Crédit: "0" });
  const result = inferAmounts(row, {});
  assert.equal(result.needsArbitrage, true);
});

test("inferAmounts traite une opération exonérée/hors champ sans TVA, HT = montant brut", () => {
  const row = normalizeRow({ Compte: "411000", Date: "01/03/2026", Libellé: "Vente export", Débit: "0", Crédit: "500" });
  const result = inferAmounts(row, { operationType: "exonere" });
  assert.equal(result.tva, 0);
  assert.equal(result.ht, 500);
  assert.equal(result.needsArbitrage, false);
});

test("inferAmounts marque une charge non récupérable comme non recouvrable", () => {
  const row = normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Amende", Débit: "300", Crédit: "0" });
  const result = inferAmounts(row, { operationType: "non_recuperable" });
  assert.equal(result.tvaRecoverable, false);
});

// ------------------------------------------------------------
// inferOperation : détection automatique par mots-clés du libellé
// ------------------------------------------------------------

test("inferOperation détecte l'autoliquidation BTP à partir du libellé", () => {
  const row = normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Sous-traitance BTP travaux", Débit: "300", Crédit: "0" });
  assert.equal(inferOperation(row, {}), "autoliquidation_btp");
});

test("inferOperation détecte une acquisition intracommunautaire (UE)", () => {
  const row = normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Achat fournisseur UE Allemagne", Débit: "300", Crédit: "0" });
  assert.equal(inferOperation(row, {}), "acquisition_ue");
});

test("inferOperation NE détecte PAS automatiquement un avoir à partir du libellé", () => {
  // Constat d'audit : 'avoir' figure dans OPERATION_TYPES mais inferOperation()
  // ne cherche jamais ce mot-clé. Un avoir doit donc être classé manuellement
  // (règle de compte ou mot-clé) — ce test documente cette limite actuelle.
  const row = normalizeRow({ Compte: "411000", Date: "01/03/2026", Libellé: "Avoir facture 001", Débit: "1200", Crédit: "0" });
  assert.equal(inferOperation(row, {}), "standard");
});

// ------------------------------------------------------------
// buildPreparation : priorité des règles (mot-clé > compte > dossier)
// ------------------------------------------------------------

test("buildPreparation applique une règle de compte quand aucun mot-clé ne correspond", () => {
  const rows = filterTvaRows([
    normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Fournisseur X", Débit: "120", Crédit: "0" }),
  ]).kept;
  const prepared = buildPreparation(rows, { "401000": { default_tva_rate: 20 } });
  assert.equal(prepared[0].ruleSource, "compte");
  assert.equal(prepared[0].tva, 20);
});

test("buildPreparation priorise une règle mot-clé sur la règle de compte générique", () => {
  const rows = filterTvaRows([
    normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Restaurant Chez Paul", Débit: "120", Crédit: "0" }),
  ]).kept;
  const rules = { "401000": { default_tva_rate: 20 } };
  const keywordRules = [{ keyword: "restaurant", match_type: "contains", default_tva_rate: 10, enabled: true }];
  const prepared = buildPreparation(rows, rules, keywordRules);
  assert.equal(prepared[0].ruleSource, "mot_cle");
  assert.equal(prepared[0].rate, 10, "la restauration à 10% doit l'emporter sur la règle générique du compte à 20%");
});

// ------------------------------------------------------------
// detectDuplicates
// ------------------------------------------------------------

test("detectDuplicates repère deux écritures strictement identiques", () => {
  const row = normalizeRow({ Compte: "401000", Date: "02/03/2026", Libellé: "Test", Débit: "100", Crédit: "0", Journal: "BQ1" });
  const dups = detectDuplicates([row, { ...row }]);
  assert.equal(dups.length, 1);
});

// ------------------------------------------------------------
// summarize : agrégats déclarés (collectée / déductible / nette)
// ------------------------------------------------------------

test("summarize additionne correctement TVA collectée et déductible à 20%", () => {
  const rows = filterTvaRows([
    normalizeRow({ Compte: "411000", Date: "01/03/2026", Libellé: "Vente", Débit: "0", Crédit: "1200" }),
    normalizeRow({ Compte: "401000", Date: "01/03/2026", Libellé: "Achat", Débit: "600", Crédit: "0" }),
  ]).kept;
  const prepared = buildPreparation(rows, {
    "411000": { default_tva_rate: 20 },
    "401000": { default_tva_rate: 20 },
  });
  const summary = summarize(prepared);
  assert.equal(summary.total_collected, 200);
  assert.equal(summary.total_deductible, 100);
  assert.equal(summary.net_tva, 100);
});

// ------------------------------------------------------------
// 🔴 BUG CONFIRMÉ PAR L'AUDIT — sens des avoirs / notes de crédit
// ------------------------------------------------------------
//
// Ce test est VOLONTAIREMENT écrit avec le résultat comptable attendu,
// pas avec le résultat produit aujourd'hui par le moteur. Il échoue avec
// le code actuel — c'est le but : documenter un bug réel avant qu'il ne
// soit corrigé, plutôt que de figer le bug dans les tests.
//
// Constat : inferAmounts() calcule `gross = Math.abs(r.debit - r.credit)`.
// La valeur absolue fait disparaître le sens de l'écriture. Une facture
// et son avoir intégral (même montant, sens inversé) sont donc tous les
// deux ADDITIONNÉS à la TVA collectée au lieu que le second vienne
// annuler le premier.
//
// Vérifié empiriquement : facture 1200€ TTC (20%) + avoir 1200€ TTC sur
// la même facture → total_collected retourné = 400€ au lieu de 0€ attendu.
test("🔴 BUG (audit) : un avoir intégral doit annuler la TVA collectée de sa facture, pas s'y additionner", () => {
  const invoice = normalizeRow({ Compte: "411000", Date: "01/03/2026", Libellé: "Facture 001", Débit: "0", Crédit: "1200" });
  const creditNote = normalizeRow({ Compte: "411000", Date: "05/03/2026", Libellé: "Avoir facture 001", Débit: "1200", Crédit: "0" });

  const { kept } = filterTvaRows([invoice, creditNote]);
  const rules = { "411000": { default_tva_rate: 20, is_mixed: false, operationType: "avoir" } };
  const prepared = buildPreparation(kept, rules);
  const summary = summarize(prepared);

  assert.equal(
    summary.total_collected,
    0,
    "Comportement observé actuellement : 400€ au lieu de 0€ — voir note d'audit RLS/TVA du " + new Date().toISOString().slice(0, 10)
  );
});