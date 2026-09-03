import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;




function MiniMetricChart({ value, color = T.navy, variant = "neutral" }) {
  const n = Math.max(0, Number(Array.isArray(value) ? value.length : value) || 0);
  const seeds = {
    active: [34, 42, 38, 49, 45, 58, 62, 57, 68, 72],
    transfer: [58, 52, 55, 49, 46, 50, 44, 42, 38, 36],
    late: [22, 18, 20, 15, 14, 12, 10, 8, 7, Math.min(14, 7 + n)],
    mission: [66, 61, 64, 58, 53, 49, 45, 42, 39, 35],
    team: [34, 39, 42, 46, 45, 49, 52, 55, 58, 61],
    anomalies: [72, 66, 61, 63, 57, 52, 48, 51, 44, 40],
    neutral: [42, 46, 43, 50, 48, 54, 51, 58, 56, 61],
  };
  const pts = seeds[variant] || seeds.neutral;
  const min = Math.min(...pts), max = Math.max(...pts);
  const width = 92, height = 28;
  const points = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * width;
    const y = height - ((v - min) / Math.max(1, max - min)) * (height - 5) - 2.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div style={{ marginTop: 7, height: 28, display: "flex", alignItems: "center", gap: 6 }} aria-hidden="true">
      <svg width="92" height="28" viewBox="0 0 92 28" preserveAspectRatio="none" style={{ overflow: "visible", flex: 1, minWidth: 0 }}>
        <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <circle cx={width} cy={Number(points.split(" ").pop().split(",")[1])} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize: 9, color: T.inkMuted, whiteSpace: "nowrap" }}>aperçu</span>
    </div>
  );
}

export { MiniMetricChart };
