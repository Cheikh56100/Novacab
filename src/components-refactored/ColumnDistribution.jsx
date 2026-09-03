import { BarChart3 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, DASHBOARD_CHART_COLORS } = Core;
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function ColumnDistribution({ title, items, maxItems = 7, onItemClick }) {
  const visible = (items || []).slice(0, maxItems);
  const max = Math.max(...visible.map(x => Number(x.value) || 0), 1);
  return <Panel title={title} right={<BarChart3 size={15} color={T.inkMuted} />}>
    {!visible.length ? <EmptyNote text="Aucune donnée renseignée pour le moment." /> : <div style={{ display: "flex", alignItems: "flex-end", gap: 9, minHeight: 150, paddingTop: 8 }}>
      {visible.map((item, i) => <div key={`${item.label}-${i}`} onClick={() => onItemClick?.(item)} style={{ flex: 1, minWidth: 38, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 145, cursor: onItemClick ? "pointer" : "default" }}>
        <strong style={{ fontFamily: T.mono, fontSize: 9.5, color: T.ink, marginBottom: 4 }}>{item.value}</strong>
        <div title={`${item.label}: ${item.value}`} style={{ width: "100%", maxWidth: 42, height: `${Math.max(10, (Number(item.value) / max) * 102)}px`, borderRadius: "7px 7px 3px 3px", background: item.color || DASHBOARD_CHART_COLORS[i % DASHBOARD_CHART_COLORS.length] }} />
        <span style={{ marginTop: 6, fontSize: 9, color: T.inkMuted, textAlign: "center", lineHeight: 1.2, maxWidth: 62, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
      </div>)}
    </div>}
  </Panel>;
}

export { ColumnDistribution };
