import test from "node:test";
import assert from "node:assert/strict";
import { num, cleanHeader, normalizeAccount, confidence } from "./tvaEngine.js";

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

test("confidence reste bornée entre 0 et 1", () => {
  assert.equal(confidence([]), 0);
});
