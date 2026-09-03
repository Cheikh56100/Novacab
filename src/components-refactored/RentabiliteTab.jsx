import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { TextInput } from "./TextInput.jsx";
import { Shared } from "./shared.js";
const { T, fmtEUR } = Shared;




function RentabiliteTab({ client, onUpdate }) {
  const r = client.rentabilite || { tempsPrevu:"", tempsReel:"", tarifHoraire:"", margeCible:"" };
  const patch = (p) => onUpdate(client.id, { rentabilite: { ...r, ...p } });
  const prev = Number(r.tempsPrevu), real = Number(r.tempsReel), rate = Number(r.tarifHoraire);
  const depassement = prev > 0 && real > prev ? ((real - prev) / prev) * 100 : 0;
  const ca = real > 0 && rate > 0 ? real * rate : 0;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h4 style={{fontFamily:T.serif,fontSize:13,color:T.navy,margin:0}}>Temps & rentabilité du dossier</h4><Stamped tone={depassement>25?"red":depassement>0?"amber":"green"} small>{depassement>0?`+${depassement.toFixed(0)} % vs prévu`:"Dans le prévu"}</Stamped></div>
    <FieldRow label="Temps prévu (h)"><TextInput defaultValue={r.tempsPrevu} onCommit={v=>patch({tempsPrevu:v})} placeholder="ex. 12" width={120}/></FieldRow>
    <FieldRow label="Temps réel (h)"><TextInput defaultValue={r.tempsReel} onCommit={v=>patch({tempsReel:v})} placeholder="ex. 14,5" width={120}/></FieldRow>
    <FieldRow label="Taux horaire (€)"><TextInput defaultValue={r.tarifHoraire} onCommit={v=>patch({tarifHoraire:v})} placeholder="ex. 85" width={120}/></FieldRow>
    <FieldRow label="Marge cible (%)"><TextInput defaultValue={r.margeCible} onCommit={v=>patch({margeCible:v})} placeholder="ex. 35" width={120}/></FieldRow>
    <div className="grid grid-cols-2 gap-2.5" style={{marginTop:16}}>
      <div style={{border:`1px solid ${T.line}`,borderRadius:T.radiusSm,padding:"10px 11px",background:T.paper}}><div style={{fontSize:9.5,color:T.inkMuted,textTransform:"uppercase",fontWeight:700}}>Heures</div><div style={{fontSize:17,fontWeight:800,fontFamily:T.mono,marginTop:3}}>{real||0} / {prev||0}</div></div>
      <div style={{border:`1px solid ${T.line}`,borderRadius:T.radiusSm,padding:"10px 11px",background:T.paper}}><div style={{fontSize:9.5,color:T.inkMuted,textTransform:"uppercase",fontWeight:700}}>Valorisation</div><div style={{fontSize:17,fontWeight:800,fontFamily:T.mono,marginTop:3}}>{ca?fmtEUR(ca):"—"}</div></div>
    </div>
  </div>;
}

export { RentabiliteTab };
