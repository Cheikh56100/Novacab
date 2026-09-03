import { Plus, Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Panel } from "./Panel.jsx";
import { DynamicOptions } from "./DynamicOptions.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



/* ============================================================
   V28 — CHAMPS PERSONNALISÉS & TICKETS PAR DOSSIER
   Les définitions et valeurs sont stockées dans le JSON du client :
   aucune migration obligatoire pour démarrer.
   ============================================================ */
function CustomFieldsTab({ client, onUpdate, canConfigure }) {
  const fields = client.customFields || [];
  const add = () => onUpdate(client.id, { customFields:[...fields,{id:uid(),label:"Nouveau champ",type:"text",options:[],value:""}] });
  const patch = (id, patch) => onUpdate(client.id,{customFields:fields.map(f=>f.id===id?{...f,...patch}:f)});
  const remove = (id) => onUpdate(client.id,{customFields:fields.filter(f=>f.id!==id)});
  return <div>
    <Panel title="Champs personnalisés"><p style={{fontSize:12,color:T.inkMuted,marginTop:0}}>Ajoutez autant de lignes que nécessaire pour adapter la fiche au fonctionnement du cabinet.</p>
      {fields.map(f=><div key={f.id} style={{display:"grid",gridTemplateColumns:"minmax(150px,1fr) 140px minmax(180px,1fr) auto",gap:8,alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.line}`}}>
        <input value={f.label} disabled={!canConfigure} onChange={e=>patch(f.id,{label:e.target.value})} className="input-field" placeholder="Libellé"/>
        <select value={f.type} disabled={!canConfigure} onChange={e=>patch(f.id,{type:e.target.value,value:""})} className="input-field"><option value="text">Texte</option><option value="number">Nombre</option><option value="date">Date</option><option value="select">Liste</option><option value="boolean">Oui / Non</option></select>
        {f.type==='select'?<DynamicOptions value={f.value||""} options={f.options||[]} onChange={v=>patch(f.id,{value:v})} onOptions={opts=>patch(f.id,{options:opts})}/>:f.type==='boolean'?<select value={String(f.value||"")} onChange={e=>patch(f.id,{value:e.target.value})} className="input-field"><option value="">—</option><option value="oui">Oui</option><option value="non">Non</option></select>:<input type={f.type==='number'?'number':f.type==='date'?'date':'text'} value={f.value||""} onChange={e=>patch(f.id,{value:e.target.value})} className="input-field" placeholder="Valeur"/>}
        {canConfigure&&<button onClick={()=>remove(f.id)} title="Supprimer" style={{border:0,background:"none",color:T.red,cursor:"pointer"}}><Trash2 size={15}/></button>}
      </div>)}
      {canConfigure&&<button onClick={add} className="btn-secondary" style={{marginTop:12}}><Plus size={14}/> Ajouter un champ</button>}
    </Panel>
  </div>
}

export { CustomFieldsTab };
