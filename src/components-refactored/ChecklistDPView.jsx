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
const { T, DP_CHECKLIST_ITEMS, getDPStatus } = Shared;
const { useState, useMemo } = React;



/* ============================================================
   MISSION VIEW
   ============================================================ */
function ChecklistDPView({ clients, search, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const rows = filtered.map((c) => ({ client: c, progress: missionCompletion(c) })).sort((a, b) => a.progress.pct - b.progress.pct);
  const [expanded, setExpanded] = useState(null);
  return <div><Reveal><h1 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 6px" }}>Checklist Dossier Permanent (DP)</h1></Reveal><p style={{ color: T.inkMuted, fontSize: 12.5, margin: "0 0 18px" }}>La progression de l'accueil devient la checklist du dossier permanent, avec les trois états Non fait / En cours / Fait.</p><FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={rows.length} /><Panel title={`Dossiers DP (${rows.length})`}>{rows.map(({client,progress}) => { const open=expanded===client.id; const statusMap=Object.fromEntries(DP_CHECKLIST_ITEMS.map(it=>[it.id,getDPStatus(client,it.id)])); return <div key={client.id} style={{borderBottom:`1px solid ${T.line}`}}><div className="hoverRow clickable" onClick={()=>setExpanded(open?null:client.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 4px"}}><div style={{flex:1,fontWeight:700,fontSize:12.5}}>{client.nom}</div><Stamped tone={progress.pct===100?"green":progress.enCours?"amber":"red"} small>{progress.fait}/{progress.total} · {progress.pct}%</Stamped>{open?<ChevronUp size={15} color={T.inkMuted}/>:<ChevronDown size={15} color={T.inkMuted}/>}</div>{open&&<div style={{padding:"0 4px 16px"}}><ChecklistCard title="Dossier Permanent" items={DP_CHECKLIST_ITEMS} statusMap={statusMap} onCycle={(id)=>{const next=nextChecklistStatus(statusMap[id]);onUpdate(client.id,{missionStatus:{...(client.missionStatus||{}),[id]:next},mission:{...(client.mission||{}),[id]:next==="fait"}})}} compact/></div>}</div>})}</Panel></div>;
}

export { ChecklistDPView };
