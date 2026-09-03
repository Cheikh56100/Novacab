import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { TextInput } from "./TextInput.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T, todayISO, fmtFR } = Shared;



function ValidationDossierTab({ client, onUpdate, me }) {
  const v = client.validationDossier || { collaborateur:false, chefMission:false, dateCollaborateur:"", dateChefMission:"", commentaire:"" };
  const complete = !!v.collaborateur && !!v.chefMission;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h4 style={{fontFamily:T.serif,fontSize:13,color:T.navy,margin:0}}>Validation de fin de dossier</h4><Stamped tone={complete?"green":"amber"} small>{complete?"Dossier validé":"Validation en attente"}</Stamped></div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",border:`1px solid ${T.line}`,borderRadius:T.radiusSm}}><ToggleBtn on={!!v.collaborateur} onClick={()=>onUpdate(client.id,{validationDossier:{...v,collaborateur:!v.collaborateur,dateCollaborateur:!v.collaborateur?todayISO():v.dateCollaborateur}})}/><div><div style={{fontWeight:700,fontSize:11.5}}>Collaborateur — dossier terminé</div><div style={{fontSize:10.5,color:T.inkMuted}}>{v.dateCollaborateur?`Le ${fmtFR(v.dateCollaborateur)}`:"Non validé"}</div></div></div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",border:`1px solid ${T.line}`,borderRadius:T.radiusSm}}><ToggleBtn on={!!v.chefMission} onClick={()=>onUpdate(client.id,{validationDossier:{...v,chefMission:!v.chefMission,dateChefMission:!v.chefMission?todayISO():v.dateChefMission}})}/><div><div style={{fontWeight:700,fontSize:11.5}}>Chef de mission — validation finale</div><div style={{fontSize:10.5,color:T.inkMuted}}>{v.dateChefMission?`Validé le ${fmtFR(v.dateChefMission)} par ${me||"le CDM"}`:"À valider"}</div></div></div>
      <FieldRow label="Commentaire"><TextInput defaultValue={v.commentaire} onCommit={x=>onUpdate(client.id,{validationDossier:{...v,commentaire:x}})} placeholder="Réserve ou remarque de clôture" width={360}/></FieldRow>
    </div>
  </div>;
}

export { ValidationDossierTab };
