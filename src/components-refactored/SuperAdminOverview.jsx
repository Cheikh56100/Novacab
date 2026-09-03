import { Users, Building2, Clock, Scale } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T, displayCabinetName } = Shared;

const inputStyle = {
  fontFamily: T.sans,
  fontSize: 12,
  padding: "8px 10px",
  borderRadius: 9,
  border: `1px solid ${T.line}`,
  background: T.card,
  color: T.ink,
  outline: "none",
};




function SuperAdminOverview({ portefeuilles, team, clients, requests, onNav }) {
  const activeTeam = team.filter((t) => t.statut === "actif");
  const pending = team.filter((t) => t.statut === "en_attente");
  const pendingRequests = requests.filter((r) => ["demande", "en_attente", "nouvelle"].includes(String(r.statut || "").toLowerCase()));
  const cards = [
    ["Cabinets", portefeuilles.length, Building2, "super-cabinets"],
    ["Utilisateurs actifs", activeTeam.length, Users, "super-team"],
    ["Comptes à valider", pending.length, Clock, "super-team"],
    ["Demandes à traiter", pendingRequests.length, Scale, "super-demandes"],
  ];
  return <div className="max-w-6xl mx-auto">
    <Reveal><div style={{marginBottom:18}}><div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:T.navy,textTransform:"uppercase"}}>Administration de la plateforme</div><h1 style={{fontFamily:T.serif,fontSize:25,fontWeight:800,color:T.ink,margin:"5px 0"}}>Vue globale NOVACAB</h1><div style={{fontSize:12,color:T.inkMuted}}>Pilotage central de tous les cabinets, utilisateurs, demandes et abonnements.</div></div></Reveal>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:16}}>{cards.map(([label,value,Icon,target])=><button key={label} onClick={()=>onNav(target)} style={{textAlign:"left",background:T.card,border:`1px solid ${T.line}`,borderRadius:16,padding:18,cursor:"pointer",boxShadow:T.shadow}}><Icon size={19} color={T.navy}/><div style={{fontSize:25,fontWeight:800,color:T.ink,marginTop:10}}>{value}</div><div style={{fontSize:11,color:T.inkMuted,marginTop:3}}>{label}</div></button>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.3fr) minmax(280px,.7fr)",gap:16}}>
      <Panel title="Cabinets NOVACAB"><div style={{display:"grid",gap:8}}>{portefeuilles.map((p)=><div key={p.id} style={{padding:12,border:`1px solid ${T.line}`,borderRadius:12,display:"flex",justifyContent:"space-between",gap:10}}><div><b>{displayCabinetName(p.nom)}</b><div style={{fontSize:10.5,color:T.inkMuted,marginTop:3}}>{p.domaine || "Domaine non renseigné"}</div></div><div style={{fontSize:11,color:T.inkMuted}}>{team.filter(t=>t.portefeuille_id===p.id && t.statut==="actif").length} utilisateur(s)</div></div>)}</div></Panel>
      <Panel title="Accès rapide"><div style={{display:"grid",gap:9}}><button onClick={()=>onNav("super-team")} style={{...inputStyle,textAlign:"left",cursor:"pointer",background:T.navy,color:"#fff",border:"none"}}>Gérer les équipes et validations</button><button onClick={()=>onNav("super-demandes")} style={{...inputStyle,textAlign:"left",cursor:"pointer",background:T.card}}>Traiter les demandes NOVACAB</button><button onClick={()=>onNav("super-abonnements")} style={{...inputStyle,textAlign:"left",cursor:"pointer",background:T.card}}>Consulter les abonnements</button></div></Panel>
    </div>
  </div>;
}

export { SuperAdminOverview };
