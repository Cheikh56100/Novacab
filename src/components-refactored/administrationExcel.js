import * as XLSX from "xlsx";

const moneyFmt = '#,##0.00 [$€-fr-FR]';
const dateFmt = 'dd/mm/yyyy';

function autoWidth(rows) {
  const keys = Object.keys(rows[0] || {});
  return keys.map(k => ({
    wch: Math.min(42, Math.max(12, Math.max(k.length, ...rows.map(r => String(r[k] ?? "").length)) + 2))
  }));
}

function styleSheet(ws, rows, moneyKeys = [], percentKeys = []) {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!cols"] = autoWidth(rows);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) {
      cell.s = { font: { bold: true, color: "FFFFFF" }, fill: { fgColor: { rgb: "173B5C" } }, alignment: { vertical: "center" } };
    }
  }
  rows.forEach((row, ri) => {
    Object.keys(row).forEach((key, ci) => {
      const cell = ws[XLSX.utils.encode_cell({ r: ri + 1, c: ci })];
      if (!cell) return;
      if (moneyKeys.includes(key)) cell.z = moneyFmt;
      if (percentKeys.includes(key)) cell.z = '0.0%';
    });
  });
}

export function exportAdministrationExcel({ data, cabinetName = "NOVACAB", period = "Période sélectionnée", activeMonth = "", monthLabel = "" }) {
  const wb = XLSX.utils.book_new();
  const safe = (v) => v == null ? "" : v;
  const bilans = data.bilans || [];

  const bilanRows = bilans.map((r, i) => ({
    "Nbre": 1, "N°DOSSIER": safe(r.dossier || i + 1), "N° COMPTE": safe(r.compte), "CLIENTS": safe(r.client),
    "DATE DE CLOTURE": safe(r.dateCloture), "CDM": safe(r.cdm), "COLLAB FR": safe(r.collabFR), "COLLAB TG": safe(r.collabTG),
    "BILANS SPECIFIQUES": safe(r.specifique), "BILAN MENSUALISE": safe(r.mensualise), "BILAN+AG HT": Number(r.honorairesHT || 0),
    "BILAN+AG TTC": Number(r.honorairesTTC || 0), "BILAN PAYE": Number(r.paye || 0), "RESTANT A PAYER": Number(r.reste || 0),
    "PERIODICITE PAIEMENT": safe(r.periodicite), "PROCHAINE FACTURATION": safe(r.prochaineFacturation), "MONTANT ECHEANCE": Number(r.montantEcheance || 0), "STATUT FACTURATION": safe(r.billingStatus),
    "validation": safe(r.validation), "Avancement": Number(r.avancement || 0) / 100, "Statut": safe(r.statut), "Commentaire": safe(r.commentaire)
  }));

  const totalHT = bilans.reduce((a,r)=>a+Number(r.honorairesHT||0),0);
  const totalTTC = bilans.reduce((a,r)=>a+Number(r.honorairesTTC||0),0);
  const totalPaid = bilans.reduce((a,r)=>a+Number(r.paye||0),0);
  const totalRest = bilans.reduce((a,r)=>a+Number(r.reste||0),0);
  const summary = [
    ["NOVACAB — TABLEAU DES BILANS", ""], ["Cabinet", cabinetName], ["Mois de travail", monthLabel || activeMonth], ["Période d'export", period], ["Date d'extraction", new Date().toLocaleString("fr-FR")], ["", ""],
    ["INDICATEUR", "VALEUR"], ["Nombre de bilans", bilans.length], ["Bilans terminés", bilans.filter(r=>Number(r.avancement||0)>=100).length], ["Bilans en retard", bilans.filter(r=>r.statut==="En retard").length],
    ["Honoraires HT", totalHT], ["Honoraires TTC", totalTTC], ["Bilan payé", totalPaid], ["Restant à payer", totalRest]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary); wsSummary["!cols"]=[{wch:32},{wch:26}];
  ["A1","A7","B7"].forEach(a=>{if(wsSummary[a]) wsSummary[a].s={font:{bold:true,color:"FFFFFF"},fill:{fgColor:{rgb:"173B5C"}}}});
  ["B11","B12","B13","B14"].forEach(a=>{if(wsSummary[a])wsSummary[a].z=moneyFmt});
  XLSX.utils.book_append_sheet(wb, wsSummary, "SYNTHESE");

  const wsList = XLSX.utils.json_to_sheet(bilanRows); styleSheet(wsList, bilanRows, ["BILAN+AG HT","BILAN+AG TTC","BILAN PAYE","RESTANT A PAYER","MONTANT ECHEANCE"], ["Avancement"]); XLSX.utils.book_append_sheet(wb, wsList, "Liste des bilans");

  const byStatus = ["En retard","En cours","À démarrer","Terminé"].map(st => ({Statut:st, Nombre:bilans.filter(r=>r.statut===st).length, "Honoraires HT":bilans.filter(r=>r.statut===st).reduce((a,r)=>a+Number(r.honorairesHT||0),0), "Restant à payer":bilans.filter(r=>r.statut===st).reduce((a,r)=>a+Number(r.reste||0),0)}));
  const wsD1 = XLSX.utils.json_to_sheet(byStatus); styleSheet(wsD1, byStatus, ["Honoraires HT","Restant à payer"], []); XLSX.utils.book_append_sheet(wb, wsD1, "Détails1");

  const byCdm = Object.values(bilans.reduce((acc,r)=>{const k=r.cdm||"Non affecté"; acc[k] ||= {CDM:k,"Nombre de bilans":0,"Bilans terminés":0,"Honoraires HT":0,"Restant à payer":0}; acc[k]["Nombre de bilans"]++; if(Number(r.avancement||0)>=100)acc[k]["Bilans terminés"]++; acc[k]["Honoraires HT"]+=Number(r.honorairesHT||0); acc[k]["Restant à payer"]+=Number(r.reste||0); return acc;},{}));
  const wsD2 = XLSX.utils.json_to_sheet(byCdm); styleSheet(wsD2, byCdm, ["Honoraires HT","Restant à payer"], []); XLSX.utils.book_append_sheet(wb, wsD2, "Détails2");

  const byCollab = Object.values(bilans.reduce((acc,r)=>{const k=r.collabFR||"Non affecté"; acc[k] ||= {CDM:k,"Bilans terminés":0,"Restant à payer":0}; if(Number(r.avancement||0)>=100)acc[k]["Bilans terminés"]++; acc[k]["Restant à payer"]+=Number(r.reste||0); return acc;},{}));
  const wsStats = XLSX.utils.json_to_sheet(byCollab); styleSheet(wsStats, byCollab, ["Restant à payer"], []); XLSX.utils.book_append_sheet(wb, wsStats, "Stats collab");

  XLSX.writeFile(wb, `NOVACAB_Tableau_des_Bilans_${activeMonth || new Date().toISOString().slice(0,7)}.xlsx`);
}
