import { AlertTriangle, CalendarDays, ListTodo } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, fmtFR } = Shared;
const { useState } = React;




function MyWorkView({ tasks = [], clients = [], me, onOpenClient, onCompleteTask }) {
  const [procedure, setProcedure] = React.useState(() => { try { return JSON.parse(localStorage.getItem("novacab-procedure-templates") || "[]"); } catch { return []; } });
  const [recurring, setRecurring] = React.useState(() => { try { return JSON.parse(localStorage.getItem("novacab-recurring-tasks") || "[]"); } catch { return []; } });
  const mine = tasks.filter(t => !t.assigne_a || t.assigne_a === me || t.assigne === me);
  const open = mine.filter(t => t.statut !== "termine" && t.statut !== "archive");
  const overdue = open.filter(t => t.date_echeance && t.date_echeance < new Date().toISOString().slice(0,10));
  const today = new Date().toISOString().slice(0,10);
  const soon = open.filter(t => t.date_echeance && t.date_echeance >= today).slice(0,8);
  const addProcedure = () => { const name = window.prompt("Nom du modèle de procédure (ex. SCI)"); if (!name) return; const row={id:`proc-${Date.now()}`,name,steps:["À personnaliser"]}; const next=[...procedure,row]; setProcedure(next); localStorage.setItem("novacab-procedure-templates",JSON.stringify(next)); };
  const addRecurring = () => { const name=window.prompt("Nom de la tâche récurrente"); if(!name) return; const frequency=window.prompt("Fréquence : mensuelle ou annuelle", "mensuelle") || "mensuelle"; const row={id:`rec-${Date.now()}`,name,frequency}; const next=[...recurring,row]; setRecurring(next); localStorage.setItem("novacab-recurring-tasks",JSON.stringify(next)); };
  const Card=({title,value,sub,icon}) => <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,padding:16,boxShadow:T.shadowSm}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:11,color:T.inkMuted,fontWeight:700}}>{title}</div>{icon}</div><div style={{fontSize:26,fontWeight:850,color:T.ink,marginTop:8}}>{value}</div><div style={{fontSize:10.5,color:T.inkMuted,marginTop:3}}>{sub}</div></div>;
  return <div>
    <Reveal><h1 style={{fontFamily:T.serif,fontSize:24,fontWeight:850,color:T.ink,margin:"0 0 5px"}}>Mon travail</h1></Reveal>
    <p style={{color:T.inkMuted,fontSize:12,margin:"0 0 18px"}}>Une vue simple : ce que vous devez faire maintenant, ce qui est en retard et ce qui arrive.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:16}}>
      <Card title="À faire" value={open.length} sub="tâches ouvertes" icon={<ListTodo size={17} color={T.navy}/>}/><Card title="En retard" value={overdue.length} sub="à traiter en priorité" icon={<AlertTriangle size={17} color={T.red}/>}/><Card title="À venir" value={soon.length} sub="prochaines échéances" icon={<CalendarDays size={17} color={T.amber}/>}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(280px,.8fr)",gap:14,alignItems:"start"}}>
      <Panel title="Mes priorités"><div style={{display:"flex",flexDirection:"column",gap:7}}>{[...overdue,...soon].slice(0,12).map(t=>{const c=clients.find(x=>String(x.id)===String(t.client_id)); return <div key={t.id} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 0",borderBottom:`1px solid ${T.line}`}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:T.ink}}>{t.titre || t.nom || "Tâche"}</div><div style={{fontSize:10.5,color:T.inkMuted,marginTop:2}}>{c?.nom || "Sans client"}{t.date_echeance ? ` · ${fmtFR(t.date_echeance)}` : ""}</div></div>{c && <button onClick={()=>onOpenClient?.(c.id)} style={{border:`1px solid ${T.line}`,background:T.card,borderRadius:8,padding:"6px 8px",fontSize:10.5,cursor:"pointer"}}>Dossier</button>}<button onClick={()=>onCompleteTask?.(t.id)} style={{border:"none",background:T.navy,color:"white",borderRadius:8,padding:"6px 8px",fontSize:10.5,cursor:"pointer"}}>Terminer</button></div>})}{!open.length && <EmptyNote text="Aucune tâche ouverte : votre travail est à jour."/>}</div></Panel>
      <div style={{display:"flex",flexDirection:"column",gap:14}}><Panel title="Modèles de procédures"><p style={{fontSize:10.5,color:T.inkMuted}}>SCI, Holding, société classique… pour standardiser le travail du cabinet.</p>{procedure.map(p=><div key={p.id} style={{fontSize:11,fontWeight:700,padding:"6px 0",borderBottom:`1px solid ${T.line}`}}>{p.name}</div>)}<button onClick={addProcedure} style={{marginTop:10,width:"100%",padding:8,borderRadius:8,border:`1px dashed ${T.navy}`,background:"transparent",color:T.navy,fontWeight:700,cursor:"pointer"}}>+ Nouveau modèle</button></Panel>
      <Panel title="Tâches récurrentes"><p style={{fontSize:10.5,color:T.inkMuted}}>Préparez les tâches mensuelles et annuelles du cabinet.</p>{recurring.map(r=><div key={r.id} style={{fontSize:11,padding:"6px 0",borderBottom:`1px solid ${T.line}`}}><strong>{r.name}</strong><span style={{color:T.inkMuted}}> · {r.frequency}</span></div>)}<button onClick={addRecurring} style={{marginTop:10,width:"100%",padding:8,borderRadius:8,border:`1px dashed ${T.navy}`,background:"transparent",color:T.navy,fontWeight:700,cursor:"pointer"}}>+ Ajouter une récurrence</button></Panel></div>
    </div>
  </div>;
}

export { MyWorkView };
