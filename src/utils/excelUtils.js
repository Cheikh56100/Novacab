let xlsxPromise;
function getXLSX() {
  xlsxPromise ||= import("xlsx");
  return xlsxPromise;
}
import { isValidISODate } from "./dateUtils";
import { CHECKLIST_STATUS, DA_CHECKLIST_ITEMS, DP_CHECKLIST_ITEMS, getDPStatus, checklistProgress } from "./checklists";
const EXCEL_COLUMNS = [
  { key: "nom", label: "Nom" },
  { key: "siren", label: "SIREN" },
  { key: "logiciel", label: "Logiciel" },
  { key: "lienSharepoint", label: "Lien SharePoint" },
  { key: "collab", label: "Collaborateur" },
  { key: "expert", label: "Expert" },
  { key: "chefMission", label: "Chef de mission" },
  { key: "formeJuridique", label: "Forme juridique" },
  { key: "capital", label: "Capital" },
  { key: "activite", label: "Activité" },
  { key: "secteur", label: "Secteur (auto)" },
  { key: "dateCloture", label: "Date clôture (AAAA-MM-JJ)" },
  { key: "tvaRegime", label: "Régime TVA" },
  { key: "tvaExig", label: "Jour exigibilité TVA" },
];
// En-têtes acceptés en entrée (tolère quelques variantes usuelles côté Excel)
const EXCEL_IMPORT_ALIASES = {
  nom: ["nom", "client", "dossier", "raison sociale"],
  siren: ["siren", "siret"],
  logiciel: ["logiciel"],
  lienSharepoint: ["lien sharepoint", "sharepoint", "lien", "url"],
  collab: ["collaborateur", "collab"],
  expert: ["expert"],
  chefMission: ["chef de mission", "chefmission"],
  formeJuridique: ["forme juridique", "formejuridique"],
  capital: ["capital", "capital social"],
  activite: ["activité", "activite"],
  secteur: ["secteur", "secteur d'activite", "secteur activite"],
  dateCloture: ["date clôture (aaaa-mm-jj)", "date cloture", "date de clôture", "date clôture", "datecloture"],
  tvaRegime: ["régime tva", "regime tva", "tvaregime"],
  tvaExig: ["jour exigibilité tva", "jour exigibilite tva", "tvaexig", "exigibilité"],
};
function normalizeHeader(h) { return String(h || "").trim().toLowerCase(); }
function buildHeaderMap(headers) {
  const map = {};
  headers.forEach((h) => {
    const norm = normalizeHeader(h);
    for (const key of Object.keys(EXCEL_IMPORT_ALIASES)) {
      if (EXCEL_IMPORT_ALIASES[key].includes(norm)) { map[h] = key; return; }
    }
  });
  return map;
}
async function exportClientsToExcel(clients, filename = "registre-clients-novacab.xlsx") {
  const XLSX = await getXLSX();
  const rows = clients.map((c) => {
    const row = {};
    EXCEL_COLUMNS.forEach(({ key, label }) => { row[label] = c[key] ?? ""; });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: EXCEL_COLUMNS.map((c) => c.label) });
  ws["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  XLSX.writeFile(wb, filename);
}
async function downloadClientsGeneralTemplate() {
  const XLSX = await getXLSX();
  const rows = [{
    "Nom": "Nom société", "SIREN": "999999999", "Logiciel": "", "Lien SharePoint": "",
    "Collaborateur": "", "Expert": "", "Chef de mission": "", "Forme juridique": "",
    "Capital": "", "Activité": "", "Secteur (auto)": "", "Date clôture (AAAA-MM-JJ)": "",
    "Régime TVA": "CA3", "Jour exigibilité TVA": "24"
  }];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Infos générales");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Règle", "Une ligne = un dossier client. Nom ou SIREN permet le rapprochement."]]), "Instructions");
  XLSX.writeFile(wb, "modele-informations-generales-NOVACAB.xlsx");
}
async function exportClientContactsToExcel(clients, filename = "fiches-contacts-novacab.xlsx") {
  const XLSX = await getXLSX();
  const rows = clients.map((c) => ({
    "Raison Sociale": c.nom || "", "SIREN": c.siren || "", "Nom du contact": c.contact?.contactNom || "",
    "Fonction": c.contact?.contactFonction || "", "Téléphone": c.contact?.telephone || "", "E-mail": c.contact?.email || ""
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [28, 16, 28, 22, 20, 34].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, "Fiches contact");
  XLSX.writeFile(wb, filename);
}
async function exportChecklistsDaDpToExcel(clients, year = new Date().getFullYear(), filename = `checklists-DA-DP-${year}.xlsx`) {
  const rows = clients.map((c) => {
    const dp = checklistProgress(Object.fromEntries(DP_CHECKLIST_ITEMS.map((it) => [it.id, getDPStatus(c, it.id)])), DP_CHECKLIST_ITEMS);
    const daMap = c.dossierAnnuelChecklist?.[year] || {};
    const da = checklistProgress(daMap, DA_CHECKLIST_ITEMS);
    return { Client: c.nom || "", SIREN: c.siren || "", "DA — Faits": da.fait, "DA — En cours": da.enCours, "DA — Non faits": da.nonFait, "DA — Progression": `${da.pct}%`, "DP — Faits": dp.fait, "DP — En cours": dp.enCours, "DP — Non faits": dp.nonFait, "DP — Progression": `${dp.pct}%` };
  });
  const detail = [];
  clients.forEach((c) => {
    DA_CHECKLIST_ITEMS.forEach((it) => detail.push({ Client: c.nom || "", SIREN: c.siren || "", Type: "DA", Année: year, Tâche: it.label, Statut: CHECKLIST_STATUS[c.dossierAnnuelChecklist?.[year]?.[it.id] || "non_fait"] }));
    DP_CHECKLIST_ITEMS.forEach((it) => detail.push({ Client: c.nom || "", SIREN: c.siren || "", Type: "DP", Année: "Permanent", Tâche: it.label, Statut: CHECKLIST_STATUS[getDPStatus(c, it.id)] }));
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const wd = XLSX.utils.json_to_sheet(detail);
  ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
  wd["!cols"] = [24,16,10,12,55,18].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, "Synthèse");
  XLSX.utils.book_append_sheet(wb, wd, "Détail DA-DP");
  XLSX.writeFile(wb, filename);
}

async function exportAcomptesToExcel(clients, filename = "acomptes-is-cfe.xlsx") {
  const XLSX = await getXLSX();
  const rows = clients.map((c) => ({
    "Dossier": c.nom || "",
    "SIREN": c.siren || "",
    "Montant N-1 (IS)": c.is?.montantN1 ?? "",
    "Concerné IS": Number(c.is?.montantN1) > 3000 ? "Oui" : "Non",
    "Acompte mars": c.is?.mars ? "Fait" : "",
    "Acompte juin (IS)": c.is?.juin ? "Fait" : "",
    "Acompte sept": c.is?.sept ? "Fait" : "",
    "Acompte déc (IS)": c.is?.dec ? "Fait" : "",
    "Montant N-1 (CFE)": c.cfe?.montantN1 ?? "",
    "Concerné CFE": Number(c.cfe?.montantN1) > 3000 ? "Oui" : "Non",
    "Acompte juin (CFE)": c.cfe?.juin ? "Fait" : "",
    "Solde déc (CFE)": c.cfe?.dec ? "Fait" : "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Acomptes");
  XLSX.writeFile(wb, filename);
}

// Lit un fichier .xlsx/.xls/.csv et retourne une liste d'objets clients partiels
// (uniquement les champs reconnus), prêts à être fusionnés avec le registre existant.
// Si une ou plusieurs lignes contiennent des valeurs non conformes (date invalide,
// SIREN invalide, etc.), l'import COMPLET est refusé (rejet de la Promise) avec un
// message détaillant les lignes fautives — plutôt que d'accepter des données
// corrompues qui feraient planter l'application plus tard, ailleurs dans l'écran.
function parseClientsExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX();
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!raw.length) return resolve([]);
        const headerMap = buildHeaderMap(Object.keys(raw[0]));
        const rowErrors = [];
        const rows = raw.map((r, i) => {
          const out = {};
          const excelRowNum = i + 2; // +1 pour l'index 0-based, +1 pour la ligne d'en-tête
          Object.keys(r).forEach((h) => {
            const key = headerMap[h];
            if (!key) return;
            let v = r[h];
            if (key === "tvaExig") v = v === "" ? "" : parseInt(v, 10) || "";
            if (typeof v === "string") v = v.trim();
            if (key === "siren" && v !== "") {
              v = String(v).trim();
              if (!/^\d{9}$/.test(v) && !/^\d{14}$/.test(v)) {
                rowErrors.push({ row: excelRowNum, nom: r.nom || r.Nom || "(sans nom)", field: "SIREN/SIRET", value: v, reason: "doit contenir 9 chiffres (SIREN) ou 14 chiffres (SIRET)" });
              }
            }
            if (key === "dateCloture" && v !== "") {
              if (v instanceof Date) {
                v = v.toISOString().slice(0, 10);
              } else if (typeof v === "number") {
                // numéro de série Excel -> date JS
                const d = XLSX.SSF.parse_date_code(v);
                v = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
              } else if (typeof v === "string") {
                v = v.trim();
              }
              if (!isValidISODate(v)) {
                rowErrors.push({ row: excelRowNum, nom: out.nom || "(sans nom)", field: "Date clôture", value: v, reason: "format attendu AAAA-MM-JJ (ex. 2025-12-31)" });
              }
            }
            out[key] = v;
          });
          return out;
        }).filter((r) => r.nom || r.siren);

        if (rowErrors.length > 0) {
          const detail = rowErrors.slice(0, 8).map(
            (e) => `Ligne ${e.row} (${e.nom}) : "${e.field}" invalide ("${e.value}") — ${e.reason}`
          ).join("\n");
          const more = rowErrors.length > 8 ? `\n… et ${rowErrors.length - 8} autre(s) ligne(s) invalide(s).` : "";
          reject(new Error(
            `Import refusé : ${rowErrors.length} ligne(s) non conforme(s). Aucune donnée n'a été importée.\n${detail}${more}`
          ));
          return;
        }

        resolve(rows);
            } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

/* ============================================================
   IMPORT DES FICHES CONTACT (dirigeant / interlocuteur par dossier)
   ============================================================ */
async function downloadContactsTemplate() {
  const XLSX = await getXLSX();
  const rows = [
    { "Raison Sociale": "Nom société", "SIREN": "999999999", "Nom du contact": "M. DUPONT Jean", "Fonction": "Gérant", "Téléphone": "06 00 00 00 00", "E-mail": "contact@societe.fr" },
  ];
  const instructions = [
    ["Colonne", "Obligatoire", "Détail", "Exemple"],
    ["Raison Sociale", "Oui si SIREN absent", "Nom exact du dossier tel qu'enregistré dans NOVACAB (alias acceptés : Client, Dossier, Société)", "Nom société"],
    ["SIREN", "Oui si Raison Sociale absente", "Permet un rapprochement fiable même si le nom diffère légèrement (alias : SIRET)", "799300223"],
    ["Nom du contact", "Non", "Nom et prénom de l'interlocuteur (alias : Mandataire Social - Nom / Prénom sur deux colonnes séparées)", "M. DUPONT Jean"],
    ["Fonction", "Non", "Gérant, Président, Comptable… (alias : Mandataire Social - Fonction)", "Gérant"],
    ["Téléphone", "Non", "Alias acceptés : Tél, Siège - Téléphone", "06 00 00 00 00"],
    ["E-mail", "Non", "Alias acceptés : Mail, E-mail Compte", "contact@szdeco.fr"],
    [],
    ["Règles d'import", "", "", ""],
    ["1", "", "Une ligne = une fiche contact pour un dossier existant dans NOVACAB.", ""],
    ["2", "", "Le dossier est recherché par nom exact, puis par SIREN.", ""],
    ["3", "", "Raison Sociale ou SIREN est nécessaire pour rapprocher la ligne à un dossier.", ""],
    ["4", "", "Les lignes qui ne correspondent à aucun dossier existant sont affichées avant import et ne sont jamais importées.", ""],
    ["5", "", "Les champs déjà renseignés dans NOVACAB sont écrasés par le fichier importé pour les colonnes présentes.", ""],
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [26, 14, 24, 18, 18, 28].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, "Fiches contact");
  const wi = XLSX.utils.aoa_to_sheet(instructions);
  wi["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 72 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wi, "Instructions");
  XLSX.writeFile(wb, "modele-fiches-contact-NOVACAB.xlsx");
}
function normalizeContactKey(key) {
  return String(key).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}
function parseContactsExcelFile(file, clients) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.onload = async (e) => {
      try {
        const XLSX = await getXLSX();
        const wb = XLSX.read(e.target.result, { type: "array" });
        if (!wb.SheetNames.length) throw new Error("Le classeur ne contient aucune feuille exploitable.");
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
        if (!data.length) throw new Error("Aucune ligne de données détectée. Utilisez la première feuille avec une ligne d'en-têtes.");
        const actualHeaders = Object.keys(data[0] || {});
        const normalizedHeaders = actualHeaders.map(normalizeContactKey);
        const hasClientHeader = ["raisonsociale", "client", "dossier", "societe", "societenom", "entreprise", "entreprisenom", "nom"].some((h) => normalizedHeaders.includes(h));
        const hasIdHeader = ["siren", "siret"].some((h) => normalizedHeaders.includes(h));
        const missingHeaders = [];
        if (!hasClientHeader && !hasIdHeader) missingHeaders.push("Raison Sociale ou SIREN/SIRET");

        const prepared = data.map((raw, index) => {
          const norm = {};
          Object.entries(raw).forEach(([k, v]) => { norm[normalizeContactKey(k)] = String(v ?? "").trim(); });
          const clientName = norm.raisonsociale || norm.client || norm.dossier || norm.societe || norm.societenom || norm.entreprise || norm.entreprisenom || norm.nom || "";
          const siren = (norm.siren || "").replace(/\D/g, "");
          const siret = (norm.siret || "").replace(/\D/g, "");
          const client = clients.find((c) => {
            const cName = String(c.nom || "").trim().toLowerCase();
            const cSiren = String(c.siren || "").replace(/\D/g, "");
            const cSiret = String(c.siret || "").replace(/\D/g, "");
            return (clientName && cName === clientName.toLowerCase()) || (siren && cSiren === siren) || (siret && (cSiret === siret || cSiren === siret));
          });
          const nomSepare = [norm.mandatairesocialnom, norm.mandatairesocialprenom].filter(Boolean).join(" ").trim();
          const contactNom = norm.nomducontact || norm.contact || norm.nomcontact || nomSepare || "";
          const contactFonction = norm.fonction || norm.mandatairesocialfonction || norm.poste || "";
          const telephone = norm.telephone || norm.tel || norm.siegetelephone || "";
          const email = norm.email || norm.emailcompte || norm.mail || norm.adressemail || "";
          const errors = [];
          if (!client) errors.push(clientName || siren || siret ? "dossier introuvable (nom/SIREN)" : "raison sociale ou SIREN manquant");
          const warnings = [];
          if (client && !contactNom && !telephone && !email) warnings.push("ligne vide (aucune coordonnée à importer)");
          return { line: index + 2, client, clientName: clientName || client?.nom || "", contactNom, contactFonction, telephone, email, errors, warnings };
        });

        resolve({ rows: prepared, valid: prepared.filter((r) => !r.errors.length), fileName: file.name, sheetName: wb.SheetNames[0], total: data.length, headers: actualHeaders, missingHeaders, warningsCount: prepared.reduce((n, r) => n + r.warnings.length, 0) });
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

export {
  exportClientsToExcel,
  downloadClientsGeneralTemplate,
  exportClientContactsToExcel,
  exportChecklistsDaDpToExcel,
  exportAcomptesToExcel,
  parseClientsExcelFile,
  downloadContactsTemplate,
  parseContactsExcelFile,
};

// Export/import du tableau de pilotage TVA — réservé à l'interface Super Admin.
// Le premier onglet reprend la vue écran : 1 ligne par dossier et 1 colonne par mois.
export async function exportTvaDeadlinesToExcel(clients, year = new Date().getFullYear(), filename = `echeances-tva-${year}.xlsx`) {
  const XLSX = await getXLSX();
  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const statusLabel = (value) => ({ OK:"Validé", FAIT:"Fait", RETARD:"Retard", CONTROLE:"Contrôlé", NON_VALIDE:"Non validé", NA:"N/A" }[String(value||"").toUpperCase()] || "À préparer");
  const eligible = (clients || []).filter(c => c?.tvaRegime && c.tvaRegime !== "FRANCHISE");
  const rows = eligible.map(c => {
    const row = { "Dossier": c.nom || "", "Régime": c.tvaRegime || "", "Exig.": c.tvaExig || "" };
    MONTHS.forEach(m => { row[m] = statusLabel(c.tvaMois?.[m]); });
    return row;
  }).sort((a,b) => String(a.Dossier).localeCompare(String(b.Dossier), "fr"));
  const ws = XLSX.utils.json_to_sheet(rows, { header:["Dossier","Régime","Exig.",...MONTHS] });
  ws["!cols"] = [{wch:34},{wch:12},{wch:9},...MONTHS.map(()=>({wch:12}))];
  const meta = eligible.map(c => ({"Dossier":c.nom||"","ID dossier":c.id||"","SIREN":c.siren||""}));
  const metaWs = XLSX.utils.json_to_sheet(meta, {header:["Dossier","ID dossier","SIREN"]});
  metaWs["!cols"] = [{wch:34},{wch:42},{wch:18}];
  const detailRows=[]; const QUARTERS=new Set(["Mars","Juin","Septembre","Décembre"]);
  eligible.forEach(c=>{
    const periods=c.tvaRegime==="CA12"?["Mai"]:(c.tvaPeriodicite==="trimestrielle"?[...QUARTERS]:MONTHS);
    periods.forEach(m=>{ const d=c.tvaDetails?.[m]||{}; detailRows.push({"Dossier":c.nom||"","SIREN":c.siren||"","Période":m,"TVA collectée":d.tvaCollectee??"","TVA déductible":d.tvaDeductible??"","TVA sous-traitant":d.tvaSousTraitant??"","TVA à payer":d.montantAPayer??""}); });
  });
  const detailWs=XLSX.utils.json_to_sheet(detailRows); detailWs["!cols"]=[{wch:34},{wch:18},{wch:15},{wch:18},{wch:18},{wch:20},{wch:18}];
  const instructions=XLSX.utils.aoa_to_sheet([
    ["TABLEAU DE PILOTAGE TVA — NOVACAB"],["Année",String(year)],
    ["Utilisation","Le tableau Échéances TVA reprend la même organisation que NOVACAB : un dossier par ligne, puis Janvier à Décembre."],
    ["Modification","Modifiez uniquement les cellules de mois avec : À préparer, Fait, Validé, Retard, Contrôlé, Non validé ou N/A."],
    ["Réimportation","Le Super Admin peut réimporter ce même fichier pour mettre à jour les statuts."],
    ["Montants","Les montants figurent dans l’onglet Détail TVA lorsqu’une déclaration TVA Auto validée les fournit."],
  ]); instructions["!cols"]=[{wch:22},{wch:115}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Échéances TVA"); XLSX.utils.book_append_sheet(wb,detailWs,"Détail TVA"); XLSX.utils.book_append_sheet(wb,metaWs,"_NOVACAB_ID"); XLSX.utils.book_append_sheet(wb,instructions,"Instructions");
  if (wb.Workbook?.Sheets) { const sh=wb.Workbook.Sheets.find(x=>x.name==="_NOVACAB_ID"); if(sh) sh.Hidden=1; }
  XLSX.writeFile(wb,filename);
}
export async function importTvaDeadlinesFromExcel(file) {
  return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onerror=()=>reject(new Error("Impossible de lire le fichier.")); reader.onload=async e=>{ try {
    const XLSX=await getXLSX(); const wb=XLSX.read(e.target.result,{type:"array"}); const sheet=wb.Sheets["Échéances TVA"]||wb.Sheets[wb.SheetNames[0]]; const raw=XLSX.utils.sheet_to_json(sheet,{defval:""});
    const statusMap={"":"", "à préparer":"", "a préparer":"", "fait":"FAIT", "validé":"OK", "retard":"RETARD", "contrôlé":"CONTROLE", "controle":"CONTROLE", "non validé":"NON_VALIDE", "n/a":"NA", "na":"NA"};
    const MONTHS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]; const out=[];
    raw.forEach((r,i)=>{ const client=String(r["Dossier"]||r["Client"]||"").trim(); if(!client) return; MONTHS.forEach(periodKey=>{ if(!(periodKey in r)) return; const rawStatus=String(r[periodKey]??"").trim().toLowerCase(); const status=statusMap[rawStatus]; if(status===undefined) throw new Error(`Statut invalide à la ligne ${i+2}, ${periodKey} : ${r[periodKey]}`); out.push({clientId:"",siren:"",client,periodKey,status,detail:{}}); }); });
    const metaSheet=wb.Sheets["_NOVACAB_ID"]; if(metaSheet){ const meta=XLSX.utils.sheet_to_json(metaSheet,{defval:""}); const byName=new Map(meta.map(x=>[String(x.Dossier||"").trim().toLowerCase(),x])); out.forEach(u=>{const m=byName.get(u.client.trim().toLowerCase()); if(m){u.clientId=m["ID dossier"]||"";u.siren=m.SIREN||"";}}); }
    resolve(out);
  } catch(err){reject(err);} }; reader.readAsArrayBuffer(file); });
}



