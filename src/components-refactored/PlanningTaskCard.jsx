import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Shared } from "./shared.js";
import { TASK_PRIORITE_BY_CODE } from "../constants/pilotage";
import { TASK_PRIORITE_TONE } from "./core.js";
const { T } = Shared;



function PlanningTaskCard({ task, client, draggable = true, onOpenClient }) {
  const tone = TASK_PRIORITE_TONE[task.priorite] || "neutral";
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => draggable && e.dataTransfer.setData("text/plain", JSON.stringify({ type: "task", id: task.id }))}
      onClick={() => task.isAuto && client && onOpenClient && onOpenClient(client.id)}
      style={{
        background: T.card, border: `1px solid ${T.line}`, borderLeft: `4px solid ${tone === "red" ? T.red : tone === "amber" ? T.amber : T.navy}`,
        borderRadius: 9, padding: "9px 10px", marginBottom: 7, cursor: task.isAuto ? "pointer" : (draggable ? "grab" : "default"), boxShadow: T.shadowSm,
      }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {client ? client.nom : "Sans dossier"}
        </span>
        {task.isAuto ? <Stamped tone="neutral" small>Auto</Stamped> : <Stamped tone={tone} small>{TASK_PRIORITE_BY_CODE[task.priorite]?.label}</Stamped>}
      </div>
      <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.nom}</div>
    </div>
  );
}

export { PlanningTaskCard };
