/* ============================================================
   EXERCICES ANNUELS
   - Les données de production restent dans les champs historiques utilisés
     par l'UI, mais une copie canonique est conservée dans annualData[année].
   - Au changement d'exercice, l'ancien cycle est figé dans l'archive et les
     champs de travail sont réinitialisés pour l'exercice courant.
   - Le mécanisme est volontairement basé sur l'année courante : 2026 → 2027
     → 2028, sans condition codée en dur.
   ============================================================ */

export const CURRENT_YEAR = () => new Date().getFullYear();
export function getExerciseYear(dateCloture,fallback=CURRENT_YEAR()){const y=Number(String(dateCloture||"").slice(0,4));return Number.isInteger(y)&&y>=1900&&y<=2200?y:fallback}
export function listAnnualYears(client,current=CURRENT_YEAR()){const ys=new Set(Object.keys(client?.annualData||{}).map(Number));ys.add(Number(client?.annualActiveYear||current));ys.add(current);return [...ys].filter(Number.isFinite).sort((a,b)=>b-a)}
export function getAnnualSnapshot(client,year){const v=client?.annualData?.[String(year)];return v?clone(v):null}
export function withClientVersion(client,version){return {...client,_version:version==null?Math.max(1,Number(client?._version||1)):version}}

const MONTH_MAP = {
  tvaMois: {},
  tvaControle: {},
  tvaDetails: {},
  tvaPaiements: {},
  is: {},
  cfe: {},
  bilan: {},
  revision: { banqueMois: {}, cotisMois: {} },
  social: { odMois: {} },
};

const clone = (value) => {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
};

const hasValue = (value) => value !== undefined && value !== null && (
  typeof value !== "object" || Object.keys(value).length > 0
);

export function annualSnapshotFromClient(client) {
  const revision = client.revision || {};
  const social = client.social || {};
  return {
    // Conserver la clôture de l'exercice dans l'archive : la fiche active peut
    // avoir avancé sur l'année suivante après transmission du bilan.
    dateCloture: client.dateCloture || "",
    tvaMois: clone(client.tvaMois || {}),
    tvaControle: clone(client.tvaControle || {}),
    tvaDetails: clone(client.tvaDetails || {}),
    tvaPaiements: clone(client.tvaPaiements || {}),
    is: clone(client.is || {}),
    cfe: clone(client.cfe || {}),
    bilan: clone(client.bilan || {}),
    revision: {
      banqueMois: clone(revision.banqueMois || {}),
      cotisMois: clone(revision.cotisMois || {}),
    },
    social: { odMois: clone(social.odMois || {}) },
    dossierAnnuelChecklist: clone(client.dossierAnnuelChecklist || {}),
  };
}

function blankCurrentCycle(client) {
  const next = { ...client };
  next.tvaMois = {};
  next.tvaControle = {};
  next.tvaDetails = {};
  next.tvaPaiements = {};
  next.is = {};
  next.cfe = {};
  next.bilan = {};
  next.revision = { ...(client.revision || {}), banqueMois: {}, cotisMois: {} };
  next.social = { ...(client.social || {}), odMois: {} };
  // Le DA est déjà explicitement indexé par année et ne doit pas être détruit.
  next.dossierAnnuelChecklist = { ...(client.dossierAnnuelChecklist || {}) };
  return next;
}

function applySnapshot(client, snapshot) {
  if (!snapshot) return client;
  const next = { ...client };
  if (hasValue(snapshot.tvaMois)) next.tvaMois = clone(snapshot.tvaMois);
  if (hasValue(snapshot.tvaControle)) next.tvaControle = clone(snapshot.tvaControle);
  if (hasValue(snapshot.tvaDetails)) next.tvaDetails = clone(snapshot.tvaDetails);
  if (hasValue(snapshot.tvaPaiements)) next.tvaPaiements = clone(snapshot.tvaPaiements);
  if (hasValue(snapshot.is)) next.is = clone(snapshot.is);
  if (hasValue(snapshot.cfe)) next.cfe = clone(snapshot.cfe);
  if (hasValue(snapshot.bilan)) next.bilan = clone(snapshot.bilan);
  if (snapshot.revision) next.revision = { ...(next.revision || {}), banqueMois: clone(snapshot.revision.banqueMois || {}), cotisMois: clone(snapshot.revision.cotisMois || {}) };
  if (snapshot.social) next.social = { ...(next.social || {}), odMois: clone(snapshot.social.odMois || {}) };
  if (snapshot.dossierAnnuelChecklist) next.dossierAnnuelChecklist = clone(snapshot.dossierAnnuelChecklist);
  return next;
}

/**
 * Normalise un dossier chargé depuis une ancienne version.
 * Retourne [clientNormalise, changed].
 */
export function normalizeAnnualClient(client, nowYear = CURRENT_YEAR()) {
  const next = { ...client };
  const existing = next.annualData && typeof next.annualData === "object" ? clone(next.annualData) : {};
  // Répare les anciennes données où un bilan terminé d'une année a été
  // recopié sous l'année suivante. L'année portée par transmisAnnee est
  // prioritaire ; à défaut on utilise l'année de clôture conservée dans le snapshot.
  Object.entries(existing).forEach(([key, snap]) => {
    const transmittedYear = Number(snap?.bilan?.transmisAnnee || String(snap?.dateCloture || "").slice(0, 4));
    if (snap?.bilan?.transmis && Number.isInteger(transmittedYear) && transmittedYear >= 1900 && transmittedYear <= 2200 && Number(key) !== transmittedYear) {
      existing[String(transmittedYear)] = snap;
      delete existing[key];
    }
  });
  const closureYear = Number(String(next.dateCloture || "").slice(0, 4));
  const legacyYear = Number(next.annualActiveYear || next.annualYear || (closureYear || nowYear));
  let changed = !next.annualData || !next.annualActiveYear;

  // Première migration : les champs historiques sont considérés comme appartenant
  // à l'exercice actif au moment du premier lancement de la nouvelle version.
  if (!existing[String(legacyYear)] && annualHasData(next)) {
    existing[String(legacyYear)] = annualSnapshotFromClient(next);
    changed = true;
  }

  let activeYear = legacyYear;
  // Passage d'un exercice ancien à l'année courante : archivage atomique du cycle
  // précédent, puis nouveau cycle vierge.
  if (activeYear < nowYear) {
    if (!existing[String(activeYear)] || !annualHasDataSnapshot(existing[String(activeYear)])) {
      existing[String(activeYear)] = annualSnapshotFromClient(next);
    }
    const cleared = blankCurrentCycle(next);
    Object.assign(next, cleared);
    activeYear = nowYear;
    changed = true;
  }

  // Si la fiche vient déjà du nouveau format mais que les champs de travail sont
  // vides, on les recharge depuis l'archive de l'exercice actif.
  if (activeYear === nowYear && !annualHasData(next) && existing[String(nowYear)]) {
    Object.assign(next, applySnapshot(next, existing[String(nowYear)]));
    changed = true;
  }

  next.annualData = existing;
  next.annualActiveYear = activeYear;
  if (!next._version) { next._version = 1; changed = true; }
  return [next, changed];
}

function annualHasDataSnapshot(snapshot) {
  if (!snapshot) return false;
  return Object.keys(snapshot).some((key) => {
    const value = snapshot[key];
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return hasValue(value);
  });
}

export function annualHasData(client) {
  return annualHasDataSnapshot(annualSnapshotFromClient(client));
}

/** Ajoute la version actuelle des données à l'archive avant une sauvegarde. */
export function withAnnualSnapshot(client, year = CURRENT_YEAR()) {
  const annualData = client.annualData && typeof client.annualData === "object" ? clone(client.annualData) : {};
  annualData[String(year)] = annualSnapshotFromClient(client);
  return { ...client, annualData, annualActiveYear: year };
}

/**
 * Archive explicitement une année et ouvre la suivante. Utilisé notamment
 * lorsque le CA3 de décembre est marqué FAIT.
 */
export function rolloverAnnualClient(client, fromYear, toYear) {
  const annualData = client.annualData && typeof client.annualData === "object" ? clone(client.annualData) : {};
  annualData[String(fromYear)] = annualSnapshotFromClient(client);
  const next = blankCurrentCycle(client);
  next.annualData = annualData;
  next.annualActiveYear = toYear;
  return next;
}

export function isDecemberDone(client) {
  return String(client?.tvaMois?.Déc || "").toUpperCase() === "FAIT";
}

export function archiveYear(client, year) {
  const annualData = client.annualData && typeof client.annualData === "object" ? clone(client.annualData) : {};
  annualData[String(year)] = annualSnapshotFromClient(client);
  return { ...client, annualData };
}
