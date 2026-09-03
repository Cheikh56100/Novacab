import { Plus, Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { SelectPill } from "./SelectPill.jsx";
import { Shared } from "./shared.js";
const { T, todayISO, fmtFR } = Shared;
const { useState } = React;



/* ============================================================
   DEMANDES CLIENT / PIÈCES — suivi simple sans imposer de GED.
   ============================================================ */
function DemandesPiecesTab({ client, onUpdate }) {
  const [label, setLabel] = useState("");
  const [relanceLe, setRelanceLe] = useState("");
  const demandes = client.demandesClient || [];
  const add = () => {
    if (!label.trim()) return;
    const item = { id: uid(), libelle: label.trim(), demandeLe: todayISO(), relanceLe: relanceLe || "", statut: "demande", note: "" };
    onUpdate(client.id, { demandesClient: [...demandes, item] }); setLabel(""); setRelanceLe("");
  };
  const patch = (id, patch) => onUpdate(client.id, { demandesClient: demandes.map(d => d.id === id ? { ...d, ...patch } : d) });
  const remove = (id) => onUpdate(client.id, { demandesClient: demandes.filter(d => d.id !== id) });
  const counts = { demande: demandes.filter(d=>d.statut==="demande").length, recu: demandes.filter(d=>d.statut==="recu").length, controle: demandes.filter(d=>d.statut==="controle").length };
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h4 style={{fontFamily:T.serif,fontSize:13,color:T.navy,margin:0}}>Demandes clients & pièces</h4><div style={{display:"flex",gap:5}}><Stamped tone={counts.demande?"amber":"green"} small>{counts.demande} demandée{counts.demande>1?"s":""}</Stamped><Stamped tone="green" small>{counts.recu} reçue{counts.recu>1?"s":""}</Stamped></div></div>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ex. Relevé bancaire de juillet" style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${T.line}`,fontSize:11.5,width:250}}/><input type="date" value={relanceLe} onChange={e=>setRelanceLe(e.target.value)} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${T.line}`,fontSize:11.5}}/><button onClick={add} style={{border:"none",background:T.navy,color:"white",borderRadius:8,padding:"7px 11px",fontSize:11.5,fontWeight:700,cursor:"pointer"}}><Plus size={13} style={{verticalAlign:"-2px"}}/> Demander</button></div>
    {!demandes.length ? <EmptyNote text="Aucune pièce demandée. Ajoute ici les éléments attendus du client."/> : <div style={{display:"flex",flexDirection:"column",gap:7}}>{demandes.map(d=><div key={d.id} style={{border:`1px solid ${T.line}`,borderRadius:T.radiusSm,padding:"9px 10px",background:T.paper}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,fontWeight:700,fontSize:11.5}}>{d.libelle}</div><SelectPill value={d.statut} options={["demande","recu","controle"]} onChange={v=>patch(d.id,{statut:v})}/><button onClick={()=>remove(d.id)} style={{border:"none",background:"none",color:T.inkMuted,cursor:"pointer"}}><Trash2 size={13}/></button></div><div style={{fontSize:10.5,color:T.inkMuted,marginTop:5}}>Demandé le {fmtFR(d.demandeLe)}{d.relanceLe?` · Relance ${fmtFR(d.relanceLe)}`:""}</div></div>)}</div>}
  </div>;
}

export { DemandesPiecesTab };
