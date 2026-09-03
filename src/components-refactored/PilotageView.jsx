import { Users, Check, Mail, Clock3, CalendarDays } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { KpiCard } from "./KpiCard.jsx";
import { MobileKpiSummary } from "./MobileKpiSummary.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useMemo } = React;



/* ============================================================
   DASHBOARD
   ============================================================ */

/* ============================================================
   PILOTAGE CABINET — vue chef de mission : risques, demandes,
   validations, charge et rentabilité.
   ============================================================ */
function PilotageView({ clients, tasks, team, me, onOpenClient, onView }) {
  const active = clients.filter((c) => c.statutDossier !== "inactif");
  const requests = active.flatMap((c) => (c.demandesClient || []).map((r) => ({ ...r, clientId: c.id, clientNom: c.nom }))).filter((r) => r.statut !== "controle");
  const validations = active.filter((c) => c.validationDossier?.collaborateur && !c.validationDossier?.chefMission);
  const relances = requests.filter((r) => r.relanceLe && new Date(r.relanceLe) <= new Date());
  const workload = useMemo(() => team.map((m) => {
    const dossiers = active.filter((c) => c.collab === m.nom).length;
    const taches = (tasks || []).filter((t) => t.assignee_id === m.id || t.assignee === m.nom || t.collaborateur === m.nom).filter((t) => t.statut !== "termine").length;
    return { ...m, dossiers, taches };
  }).sort((a,b) => (b.taches + b.dossiers) - (a.taches + a.dossiers)), [team, active, tasks]);
  const rentabilite = active.filter((c) => Number(c.rentabilite?.tempsPrevu) > 0 && Number(c.rentabilite?.tempsReel) > Number(c.rentabilite?.tempsPrevu) * 1.25);
  const lateTasks = (tasks || []).filter((t) => t.bucket === "retard" || t.statut === "en_retard");
  return <div>
    <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Pilotage cabinet</h1></Reveal>
    <p style={{ color: T.inkMuted, fontSize: 12.5, margin: "0 0 18px" }}>Le cockpit du chef de mission : ce qui nécessite une action, une relance ou une validation.</p>
    <MobileKpiSummary
      title="Pilotage cabinet"
      items={[
        { label: "Tâches en retard", value: lateTasks.length, tone: lateTasks.length ? "red" : "green", onClick: () => onView("mes-taches") },
        { label: "Pièces à relancer", value: relances.length, tone: relances.length ? "amber" : "green" },
        { label: "À valider CDM", value: validations.length, tone: validations.length ? "amber" : "green" },
        { label: "Dossiers à risque", value: rentabilite.length, tone: rentabilite.length ? "amber" : "green" },
        { label: "Dossiers actifs", value: active.length, tone: "neutral", onClick: () => onView("clients") },
      ]}
    />
    <div className="hidden md:grid grid-cols-2 md:grid-cols-5 gap-3" style={{ marginBottom: 18 }}>
      <KpiCard label="Tâches en retard" value={lateTasks.length} icon={CalendarDays} tone={lateTasks.length ? "red" : "green"} onClick={() => onView("mes-taches")} />
      <KpiCard label="Pièces à relancer" value={relances.length} icon={Mail} tone={relances.length ? "amber" : "green"} />
      <KpiCard label="À valider CDM" value={validations.length} icon={Check} tone={validations.length ? "amber" : "green"} />
      <KpiCard label="Dossiers à risque" value={rentabilite.length} icon={Clock3} tone={rentabilite.length ? "amber" : "green"} />
      <KpiCard label="Dossiers actifs" value={active.length} icon={Users} tone="neutral" onClick={() => onView("clients")} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Panel title="Tâches en retard" right={<Stamped tone={lateTasks.length ? "red" : "green"} small>{lateTasks.length}</Stamped>}>
        {lateTasks.slice(0,7).map(t => <div key={t.id} className="hoverRow clickable" onClick={() => onOpenClient(t.client_id || t.client?.id)} style={{display:"flex",gap:9,alignItems:"center",padding:"9px 5px",borderBottom:`1px solid ${T.line}`}}><Clock3 size={13} color={T.red}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{t.nom || t.label || "Tâche"}</div><div style={{fontSize:10.5,color:T.inkMuted}}>{t.client?.nom || "Dossier"}{t.date_echeance ? ` · échéance ${t.date_echeance}` : ""}</div></div><Stamped tone="red" small>En retard</Stamped></div>)}
        {!lateTasks.length && <EmptyNote text="Aucune tâche en retard." />}
      </Panel>
      <Panel title="Pièces et relances" right={<Stamped tone={relances.length ? "amber" : "green"} small>{relances.length}</Stamped>}>
        {relances.slice(0,7).map(r => <div key={`${r.clientId}-${r.id}`} className="hoverRow clickable" onClick={() => onOpenClient(r.clientId)} style={{display:"flex",gap:9,alignItems:"center",padding:"9px 5px",borderBottom:`1px solid ${T.line}`}}><Mail size={13} color={T.amber}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{r.clientNom}</div><div style={{fontSize:10.5,color:T.inkMuted}}>{r.libelle || "Pièce demandée"}</div></div><Stamped tone="amber" small>Relancer</Stamped></div>)}
        {!relances.length && <EmptyNote text="Aucune relance à effectuer." />}
      </Panel>
      <Panel title="Validations chef de mission" right={<Stamped tone={validations.length ? "amber" : "green"} small>{validations.length}</Stamped>}>
        {validations.slice(0,7).map(c => <div key={c.id} className="hoverRow clickable" onClick={() => onOpenClient(c.id)} style={{display:"flex",gap:9,alignItems:"center",padding:"9px 5px",borderBottom:`1px solid ${T.line}`}}><Check size={13} color={T.amber}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{c.nom}</div><div style={{fontSize:10.5,color:T.inkMuted}}>Le collaborateur a terminé sa partie</div></div><Stamped tone="amber" small>À valider</Stamped></div>)}
        {!validations.length && <EmptyNote text="Aucun dossier en attente de validation." />}
      </Panel>
      <Panel title="Charge de l'équipe">
        {workload.slice(0,8).map(m => <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",borderBottom:`1px solid ${T.line}`}}><div style={{width:30,height:30,borderRadius:9,background:m.color||T.navySoft,color:m.color?"#fff":T.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{(m.nom||"?").slice(0,2).toUpperCase()}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{m.nom}</div><div style={{fontSize:10.5,color:T.inkMuted}}>{m.dossiers} dossier{m.dossiers>1?"s":""} · {m.taches} tâche{m.taches>1?"s":""} active{m.taches>1?"s":""}</div></div><Stamped tone={m.taches>12?"red":m.taches>7?"amber":"green"} small>{m.taches>12?"Surchargé":m.taches>7?"À surveiller":"OK"}</Stamped></div>)}
        {!workload.length && <EmptyNote text="Aucune donnée d'équipe." />}
      </Panel>
    </div>
    <div style={{height:16}} />
    <Panel title="Dossiers dont le temps réel dépasse le prévu">
      {rentabilite.slice(0,8).map(c => <div key={c.id} className="hoverRow clickable" onClick={() => onOpenClient(c.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 5px",borderBottom:`1px solid ${T.line}`}}><Clock3 size={13} color={T.amber}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{c.nom}</div><div style={{fontSize:10.5,color:T.inkMuted}}>Prévu {c.rentabilite.tempsPrevu} h · Réel {c.rentabilite.tempsReel} h</div></div><Stamped tone="amber" small>Rentabilité</Stamped></div>)}
      {!rentabilite.length && <EmptyNote text="Aucun dossier ne dépasse actuellement le seuil de 25 %." />}
    </Panel>
  </div>;
}

export { PilotageView };
