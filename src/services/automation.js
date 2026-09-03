import { supabase } from "../supabaseClient";

const isoToday = () => new Date().toISOString().slice(0,10);
const daysUntil = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`), n = new Date(); n.setHours(0,0,0,0);
  return Math.round((d-n)/86400000);
};

export function dossierHealth({tasks=[], alerts=[]}={}) {
  const overdue = tasks.filter(t => t.statut !== "termine" && t.date_echeance && daysUntil(t.date_echeance) < 0).length;
  const critical = alerts.filter(a => a.niveau === "critique" || a.niveau === "urgent").length;
  if (overdue || critical) return {code:"prioritaire", label:"Prioritaire", score:2};
  if (alerts.length || tasks.some(t => t.statut !== "termine" && t.date_echeance && daysUntil(t.date_echeance) <= 7)) return {code:"attention", label:"Attention", score:1};
  return {code:"controle", label:"Sous contrôle", score:0};
}

export function evaluateClientAutomation(client, tasks=[], imports=[]) {
  const alerts=[];
  const active = tasks.filter(t=>t.statut !== "termine" && t.statut !== "archive");
  const overdue = active.filter(t=>t.date_echeance && daysUntil(t.date_echeance)<0);
  if (overdue.length) alerts.push({niveau:"critique", type:"ticket_retard", dedupe_key:"ticket_retard", titre:`${overdue.length} ticket(s) en retard`, message:"Des actions du dossier ont dépassé leur échéance."});
  const soon = active.filter(t=>{const d=daysUntil(t.date_echeance); return d!==null && d>=0 && d<=7;});
  if (soon.length) alerts.push({niveau:"attention", type:"echeance_proche", dedupe_key:"echeance_7j", titre:`${soon.length} action(s) à moins de 7 jours`, message:"Anticiper les échéances proches."});

  const byYear = [...imports].sort((a,b)=>String(a.exercice).localeCompare(String(b.exercice)));
  const latest = byYear.at(-1)?.kpis || {};
  const prev = byYear.at(-2)?.kpis || {};
  const addKpi=(key, condition, niveau, titre, message)=>{ if(condition) alerts.push({niveau,type:"finance",dedupe_key:key,titre,message}); };
  addKpi("resultat_negatif", Number(latest.resultat_net)<0, "critique", "Résultat net négatif", "L'exercice le plus récent présente une perte.");
  addKpi("tresorerie_neg", Number(latest.tresorerie_nette)<0, "critique", "Trésorerie nette négative", "La trésorerie nette est négative sur le dernier exercice.");
  addKpi("bfr_eleve", Number(latest.ca)>0 && Number(latest.bfr)>Number(latest.ca)*0.30, "attention", "BFR élevé", "Le BFR dépasse 30 % du chiffre d'affaires.");
  addKpi("ca_baisse", Number(prev.ca)>0 && Number(latest.ca)<Number(prev.ca)*0.90, "attention", "Baisse significative du CA", "Le chiffre d'affaires recule de plus de 10 % par rapport à N-1.");
  if(byYear.length>=3){
    const last3=byYear.slice(-3).map(x=>x.kpis||{});
    const falling=(k)=>last3.every((x,i)=>i===0 || Number(x[k])<Number(last3[i-1][k]));
    addKpi("trend_treso_3ans", falling("tresorerie_nette"), "attention", "Trésorerie en baisse sur 3 ans", "La tendance sur N-2, N-1 et N est négative.");
    addKpi("trend_ebe_3ans", falling("ebe"), "attention", "EBE en baisse sur 3 ans", "La rentabilité opérationnelle se dégrade continûment.");
  }
  return alerts;
}

export async function loadFinancialImports(clientIds=[]) {
  if(!clientIds.length) return [];
  const {data,error}=await supabase.from("financial_imports").select("client_id, exercice, kpis, created_at").in("client_id",clientIds).order("exercice",{ascending:true});
  if(error){ console.warn("Automatisation: imports financiers indisponibles",error.message); return []; }
  return data||[];
}

export async function persistAlerts(alerts=[]) {
  if(!alerts.length) return [];
  const rows=alerts.map(a=>({...a, source:"automation", metadata:{automated:true, generated_on:isoToday()}}));
  const {data,error}=await supabase.from("client_alerts").upsert(rows,{onConflict:"client_id,dedupe_key"}).select();
  if(error){ console.warn("Automatisation: sauvegarde alertes",error.message); return []; }
  return data||[];
}

export async function runAutomation({clients=[],tasks=[]}={}) {
  const imports=await loadFinancialImports(clients.map(c=>c.id));
  const all=[];
  for(const client of clients){
    const clientTasks=tasks.filter(t=>String(t.client_id)===String(client.id));
    const clientImports=imports.filter(i=>String(i.client_id)===String(client.id));
    for(const alert of evaluateClientAutomation(client,clientTasks,clientImports)) all.push({client_id:client.id,portefeuille_id:client.portefeuilleId||client.portefeuille_id||null,...alert});
  }
  return persistAlerts(all);
}

export async function suggestTicketsFromAlerts(alerts=[], existingTasks=[]) {
  return alerts.filter(a=>["critique","urgent"].includes(a.niveau)).filter(a=>!existingTasks.some(t=>String(t.client_id)===String(a.client_id) && String(t.nom||"").includes(a.titre))).map(a=>({client_id:a.client_id, portefeuille_id:a.portefeuille_id, nom:`Contrôle : ${a.titre}`, commentaire:a.message||"Contrôle recommandé automatiquement par NOVACAB.", priorite:"haute", statut:"a_faire", source:"automation"}));
}
