import { BarChart3 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;




function HorizontalBarDistribution({ title, items, maxItems = 7, onItemClick }) {
  const visible = (items || []).slice(0, maxItems);
  const max = Math.max(...visible.map(x => Number(x.value) || 0), 1);
  return <Panel title={title} right={<BarChart3 size={15} color={T.inkMuted} />}>
    {!visible.length ? <EmptyNote text="Aucune donnée renseignée pour le moment." /> : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {visible.map((item, i) => <div key={`${item.label}-${i}`} onClick={() => onItemClick?.(item)} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1fr) 2.2fr 34px", gap: 8, alignItems: "center", cursor: onItemClick ? "pointer" : "default" }}>
        <span style={{ fontSize: 10.5, color: T.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
        <div style={{ height: 10, background: T.paperDeep, borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${(Number(item.value) / max) * 100}%`, height: "100%", borderRadius: 999, background: item.color || T.navy }} /></div>
        <strong style={{ fontFamily: T.mono, fontSize: 10.5, color: T.ink, textAlign: "right" }}>{item.value}</strong>
      </div>)}
      {items.length > maxItems && <div style={{ fontSize: 10, color: T.inkMuted }}>+ {items.length - maxItems} catégories</div>}
    </div>}
  </Panel>;
}

export { HorizontalBarDistribution };
