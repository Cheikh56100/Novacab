/**
 * Règles de liaison NOVACAB : les écrans de pilotage ne recopient pas les
 * données métier, ils les dérivent de la fiche dossier et des tâches.
 */
export const BILLING_PERIODS = {
  mensuel: 12,
  trimestriel: 4,
  semestriel: 2,
  annuel: 1,
};

export const billingPeriodLabel = (value) => ({
  mensuel: "Mensuel",
  trimestriel: "Trimestriel",
  semestriel: "Semestriel",
  annuel: "Annuel",
}[value] || value || "Annuel");

export function getBilanYear(client) {
  return Number(client?.bilan?.transmisAnnee || client?.annualActiveYear || String(client?.dateCloture || "").slice(0, 4) || new Date().getFullYear());
}

export function getBilanBilling(client) {
  const h = client?.honoraires || {};
  const periodicite = h.bilanPeriodicite || h.facturationPeriodicite || "annuel";
  const montantHT = Number(h.bilanMontantHT || 0);
  const montantTTC = Number(h.bilanMontantTTC || 0);
  const periods = BILLING_PERIODS[periodicite] || 1;
  const paidMap = h.bilanPaiements || {};
  const totalPaid = Number(h.bilanPaye || client?.bilanPaye || 0);
  const duePerPeriod = (montantTTC || montantHT) / periods;
  const start = h.bilanDateFacturation || h.bilanDates?.[0] || client?.bilan?.transmisDate || null;
  const dates = Array.isArray(h.bilanDates) ? h.bilanDates.filter(Boolean) : [];
  return { periodicite, periods, montantHT, montantTTC, duePerPeriod, paidMap, totalPaid, start, dates };
}

export function getProductionStatus(client, tasks = []) {
  const bilanFinished = !!client?.bilan?.transmis;
  const dossierFinished = !!client?.dossierAnnuelChecklist && Object.values(client.dossierAnnuelChecklist || {}).length > 0 && Object.values(client.dossierAnnuelChecklist || {}).every(Boolean);
  const clientTasks = tasks.filter(t => String(t.client_id || t.clientId || "") === String(client?.id || ""));
  const openTasks = clientTasks.filter(t => !["termine", "done", "archive"].includes(String(t.statut || t.status || "").toLowerCase()));
  return {
    bilanFinished,
    dossierFinished,
    taskCount: clientTasks.length,
    openTasks: openTasks.length,
    state: bilanFinished ? "termine" : openTasks.length ? "en_cours" : "a_traiter",
  };
}

export function getAdministrationSignals(client, tasks = []) {
  const billing = getBilanBilling(client);
  const production = getProductionStatus(client, tasks);
  const billingKey = `${getBilanYear(client)}-${billing.periodicite}`;
  const paidForKey = !!billing.paidMap[billingKey];
  const due = production.bilanFinished && !paidForKey && billing.duePerPeriod > 0;
  return {
    production,
    billing,
    billingKey,
    amountToClaim: due ? billing.duePerPeriod : 0,
    billingStatus: paidForKey ? "Payé" : due ? "À réclamer" : "À suivre",
  };
}
