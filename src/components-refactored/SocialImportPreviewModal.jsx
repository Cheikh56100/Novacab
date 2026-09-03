import { X } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function SocialImportPreviewModal({ state, onClose, onConfirm }) {
  const rows = state.preview?.rows || []; const valid = state.preview?.valid || [];
  return <div style={{ position:"fixed", inset:0, zIndex:90, display:"flex", alignItems:"center", justifyContent:"center" }}>
    <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(15,23,42,.42)" }} />
    <div className="scrollbar" style={{ position:"relative", width:"min(900px,94vw)", maxHeight:"88vh", overflowY:"auto", background:T.paper, borderRadius:16, boxShadow:T.shadowLg, padding:22 }}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
        <div><h3 style={{margin:0,fontFamily:T.serif,fontSize:16,fontWeight:800,color:T.ink}}>Import social — aperçu et contrôle</h3>
        <p style={{margin:"5px 0 0",fontSize:11.5,color:T.inkMuted}}>Aucun import n'est exécuté avant votre confirmation.</p></div>
        <button onClick={onClose} disabled={state.busy} className="topIconBtn"><X size={16}/></button>
      </div>
      <div style={{marginTop:14,padding:12,border:`1px solid ${T.line}`,borderRadius:12,background:T.card}}>
        <div style={{fontSize:11,fontWeight:800,color:T.ink,marginBottom:6}}>Format attendu</div>
        <div style={{fontSize:11,color:T.inkSoft,lineHeight:1.65}}>Colonnes recommandées : <b>Client ou Dossier</b> + <b>Mois</b> + <b>Statut</b>. SIREN/SIRET accepté pour identifier le dossier. Le <b>statut est obligatoire</b> : Reçu, Compta ou N/A. Le mois peut être écrit en toutes lettres ou 1–12.</div>
      </div>
      {state.busy && !state.preview && <EmptyNote text="Analyse du fichier et vérification des colonnes…" />}
      {state.error && <div style={{marginTop:10,padding:10,borderRadius:10,background:T.redSoft,color:T.red,fontSize:11}}>{state.error}</div>}
      {state.preview && <><div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}><Stamped tone="green" small>{valid.length} ligne(s) prête(s)</Stamped><Stamped tone={rows.length-valid.length?"amber":"green"} small>{rows.length-valid.length} ligne(s) à corriger</Stamped></div>
        <div className="scrollbar" style={{marginTop:10,maxHeight:330,overflowY:"auto",border:`1px solid ${T.line}`,borderRadius:10,background:T.card}}>
          {rows.slice(0,50).map(r=><div key={r.index} style={{display:"grid",gridTemplateColumns:"44px 1.2fr 90px 90px 1.3fr",gap:8,padding:"7px 9px",borderBottom:`1px solid ${T.line}`,fontSize:10.5,alignItems:"center"}}><span style={{color:T.inkMuted}}>L{r.index}</span><b>{r.client?.nom || r.clientName || "—"}</b><span>{r.month || "—"}</span><span>{r.status || "—"}</span><span style={{color:r.errors.length?T.red:T.green}}>{r.errors.length?r.errors.join(" · "):"OK"}</span></div>)}
        </div>
        {rows.length>50 && <div style={{fontSize:10,color:T.inkMuted,marginTop:6}}>Aperçu limité aux 50 premières lignes.</div>}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}><button className="btn-secondary" onClick={onClose} disabled={state.busy}>Annuler</button><button className="btn-primary" onClick={onConfirm} disabled={state.busy || valid.length===0}>{state.busy?"Import en cours…":`Confirmer l'import (${valid.length})`}</button></div>
      </>}
    </div>
  </div>;
}

export { SocialImportPreviewModal };
