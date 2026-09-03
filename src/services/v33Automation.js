/* V33 — petites automatisations sûres, sans modification destructive des données. */
export function documentClassification(name = "") {
  const n = String(name).toUpperCase();
  if (/FEC/.test(n)) return "FEC";
  if (/BALANCE|BAL\b/.test(n)) return "Balance";
  if (/LIASSE|2065|2033/.test(n)) return "Liasse fiscale";
  if (/TVA|CA3|CA12/.test(n)) return "Déclaration TVA";
  return "Autre";
}

export function dossierCompleteness(client = {}) {
  const checks = [
    ["Nom", client.nom],
    ["SIREN", client.siren],
    ["Date de clôture", client.date_cloture || client.dateCloture],
    ["Responsable", client.responsable || client.chef_mission || client.gestionnaire],
    ["Logiciel", client.logiciel || client.logiciel_comptable],
  ];
  const missing = checks.filter(([, value]) => !String(value || "").trim()).map(([label]) => label);
  return { total: checks.length, completed: checks.length - missing.length, percent: Math.round(((checks.length-missing.length)/checks.length)*100), missing };
}
