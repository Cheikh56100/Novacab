import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { LegendDot } from "./LegendDot.jsx";
import { Panel } from "./Panel.jsx";
import { ChecklistStatusButton } from "./ChecklistStatusButton.jsx";
import { Shared } from "./shared.js";
const { T, checklistProgress } = Shared;


function ChecklistCard({ title, items, statusMap, onCycle, compact = false }) {
  const p = checklistProgress(statusMap, items);
  return <Panel title={<div style={{ display: "flex", alignItems: "center", gap: 9 }}><span>{title}</span><Stamped tone={p.pct === 100 ? "green" : p.enCours ? "amber" : "red"} small>{p.fait}/{p.total} · {p.pct}%</Stamped></div>}>
    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: T.paperDeep, marginBottom: 12 }}><div style={{ width: `${p.pct}%`, background: T.green }} /><div style={{ width: `${p.total ? (p.enCours / p.total) * 100 : 0}%`, background: T.amber }} /></div>
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit,minmax(300px,1fr))", gap: 7 }}>
      {items.map((it) => { const status = statusMap?.[it.id] || "non_fait"; return <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 10px", border: `1px solid ${T.line}`, borderRadius: 9, background: T.card }}><span style={{ fontSize: 11.5, color: T.ink, lineHeight: 1.35 }}>{it.label}</span><ChecklistStatusButton status={status} onClick={() => onCycle(it.id)} /></div>; })}
    </div>
    <div style={{ display: "flex", gap: 12, marginTop: 11, flexWrap: "wrap" }}><LegendDot color={T.red} label={`${p.nonFait} non fait`} /><LegendDot color={T.amber} label={`${p.enCours} en cours`} /><LegendDot color={T.green} label={`${p.fait} fait`} /></div>
  </Panel>;
}

export { ChecklistCard };
