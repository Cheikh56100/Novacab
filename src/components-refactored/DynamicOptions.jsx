import React from "react";
import * as Core from "./core.js";
const { useState } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;


function DynamicOptions({value,options,onChange,onOptions}){
 const [adding,setAdding]=useState(false),[label,setLabel]=useState("");
 const add=()=>{const x=label.trim();if(!x)return;const next=[...new Set([...options,x])];onOptions(next);onChange(x);setLabel("");setAdding(false)};
 return <div style={{display:"flex",gap:6}}><select value={value} onChange={e=>onChange(e.target.value)} className="input-field" style={{flex:1}}><option value="">Choisir…</option>{options.map(x=><option key={x}>{x}</option>)}</select>{adding?<><input autoFocus value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Nouvelle option" className="input-field" style={{width:140}}/><button onClick={add} className="btn-primary">+</button></>:<button onClick={()=>setAdding(true)} title="Ajouter une option" className="btn-secondary">+</button>}</div>
}

export { DynamicOptions };
