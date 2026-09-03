// Suggestions de workflow non destructives : elles ne créent aucune donnée automatiquement.
// Elles servent à proposer les prochaines actions à partir des données déjà chargées.
export function buildWorkflowSuggestions({ tasks = [], anomalies = [], clients = [], currentMonthStatus = () => "NA" }) {
  const suggestions = [];
  const late = tasks.filter((t) => t.bucket === "retard");
  const today = tasks.filter((t) => t.bucket === "aujourdhui");
  const critical = anomalies.filter((a) => a.gravite === "haute");
  const tva = clients.filter((c) => ["FAIT", "ATTENTE", "NON_VALIDE", "RETARD"].includes(currentMonthStatus(c)));
  if (critical.length) suggestions.push({ type: "anomaly", priority: "high", count: critical.length, action: "surveillance" });
  if (late.length) suggestions.push({ type: "task", priority: "high", count: late.length, action: "mes-taches" });
  if (today.length) suggestions.push({ type: "task", priority: "medium", count: today.length, action: "mes-taches" });
  if (tva.length) suggestions.push({ type: "tva", priority: "medium", count: tva.length, action: "tva" });
  return suggestions;
}
