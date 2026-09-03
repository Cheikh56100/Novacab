import { X } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;


function ContractModal({ onClose }) {
  return <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:18 }} onMouseDown={onClose}>
    <div style={{ width:760, maxWidth:"96vw", maxHeight:"88vh", overflow:"auto", background:T.card, borderRadius:18, padding:24, boxShadow:T.shadowLg }} onMouseDown={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><div style={{fontSize:11,fontWeight:800,color:T.navy,textTransform:"uppercase",letterSpacing:1}}>NOVACAB</div><h2 style={{margin:"4px 0",fontSize:21,color:T.ink}}>Contrat d'utilisation de la plateforme</h2><div style={{fontSize:11,color:T.inkMuted}}>Version NOVACAB-2026-08</div></div><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={20}/></button></div>
      <div style={{fontSize:12,lineHeight:1.7,color:T.inkSoft,marginTop:18,display:"grid",gap:14}}>
        <section><b>1. Objet.</b><br/>NOVACAB fournit au cabinet inscrit un accès à une plateforme de pilotage et de gestion selon la formule souscrite et les fonctionnalités activées.</section>
        <section><b>2. Compte et responsabilité.</b><br/>Le cabinet garantit l'exactitude des informations fournies, protège les accès de ses utilisateurs et désigne les personnes autorisées à administrer son espace.</section>
        <section><b>3. Données.</b><br/>Chaque cabinet conserve la responsabilité de ses données métier. NOVACAB organise l'accès technique conformément aux droits, rôles et paramètres configurés.</section>
        <section><b>4. Durée et résiliation.</b><br/>Le cabinet ou NOVACAB peut mettre fin à la relation selon les conditions commerciales applicables. En cas de fin de contrat, le cabinet peut être désactivé ou archivé avant toute suppression définitive des données.</section>
        <section><b>5. Évolution.</b><br/>Les fonctionnalités et le contrat peuvent évoluer. Une nouvelle version nécessitant une acceptation explicite sera présentée au cabinet lorsque nécessaire.</section>
        <section><b>6. Preuve de l'acceptation.</b><br/>L'acceptation est horodatée et associée au compte inscrit. Le Super Admin NOVACAB peut consulter le suivi contractuel dans l'administration.</section>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><button onClick={onClose} style={{padding:"9px 14px",border:"none",borderRadius:10,background:T.navy,color:"#fff",fontWeight:700,cursor:"pointer"}}>J'ai lu le contrat</button></div>
    </div>
  </div>;
}

export { ContractModal };
