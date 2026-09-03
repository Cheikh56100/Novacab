import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { ChecklistCard } from "./ChecklistCard.jsx";
import { Shared } from "./shared.js";
const { T, DA_CHECKLIST_ITEMS, DP_CHECKLIST_ITEMS, getDPStatus, checklistProgress } = Shared;
const { useState, useMemo } = React;


function ChecklistsView({ clients, search, roleFilter, setRoleFilter, me, onUpdate }) {
  const year = new Date().getFullYear();
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const [tab,setTab]=useState("DA"); const [expanded,setExpanded]=useState(null);
  const items = tab === "DA" ? DA_CHECKLIST_ITEMS : DP_CHECKLIST_ITEMS;
  const rows = filtered.map(c=>({client:c, map:tab==="DA"?(c.dossierAnnuelChecklist?.[year]||{}):Object.fromEntries(DP_CHECKLIST_ITEMS.map(it=>[it.id,getDPStatus(c,it.id)]))})).map(x=>({...x,p:checklistProgress(x.map,items)})).sort((a,b)=>a.p.pct-b.p.pct);
  return <div><Reveal><h1 style={{fontFamily:T.serif,fontSize:18,fontWeight:800,color:T.ink,margin:"0 0 6px"}}>Checklists Dossier Annuel (DA) / Permanent (DP)</h1></Reveal><p style={{color:T.inkMuted,fontSize:12.5,margin:"0 0 16px"}}>Les deux checklists sont regroupées ici pour ne pas surcharger l'accueil du dossier.</p><div style={{display:"flex",gap:5,borderBottom:`1px solid ${T.line}`,marginBottom:14}}>{[["DA","Dossier Annuel"],["DP","Dossier Permanent"]].map(([id,label])=><button key={id} onClick={()=>setTab(id)} style={{padding:"9px 13px",border:"none",borderBottom:tab===id?`2px solid ${T.navy}`:"2px solid transparent",background:"transparent",fontWeight:700,fontSize:12,color:tab===id?T.navy:T.inkMuted,cursor:"pointer"}}>{label}</button>)}</div><FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={rows.length}/><Panel title={`${tab === "DA" ? "Checklist Dossier Annuel" : "Checklist Dossier Permanent"}${tab === "DA" ? ` — ${year}` : ""} (${rows.length})`}>{rows.map(({client,map,p})=>{const open=expanded===client.id; return <div key={client.id} style={{borderBottom:`1px solid ${T.line}`}}><div className="hoverRow clickable" onClick={()=>setExpanded(open?null:client.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 4px"}}><div style={{flex:1,fontWeight:700,fontSize:12.5}}>{client.nom}</div><Stamped tone={p.pct===100?"green":p.enCours?"amber":"red"} small>{p.fait}/{p.total} · {p.pct}%</Stamped>{open?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</div>{open&&<div style={{padding:"0 4px 16px"}}><ChecklistCard title={tab==="DA"?`DA ${year}`:"DP"} items={items} statusMap={map} onCycle={(id)=>{const next=nextChecklistStatus(map[id]); if(tab==="DA") onUpdate(client.id,{dossierAnnuelChecklist:{...(client.dossierAnnuelChecklist||{}),[year]:{...(client.dossierAnnuelChecklist?.[year]||{}),[id]:next}}}); else onUpdate(client.id,{missionStatus:{...(client.missionStatus||{}),[id]:next},mission:{...(client.mission||{}),[id]:next==="fait"}})}} compact/></div>}</div>})}</Panel></div>;
}

export { ChecklistsView };
