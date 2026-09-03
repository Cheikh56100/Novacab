import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { ChecklistCard } from "./ChecklistCard.jsx";
import { Shared } from "./shared.js";
const { DP_CHECKLIST_ITEMS, getDPStatus } = Shared;


function MissionTab({ client, onUpdate }) {
  const statusMap = Object.fromEntries(DP_CHECKLIST_ITEMS.map((it) => [it.id, getDPStatus(client, it.id)]));
  const cycle = (id) => { const next = nextChecklistStatus(statusMap[id]); const missionStatus = { ...(client.missionStatus || {}), [id]: next }; const mission = { ...(client.mission || {}), [id]: next === "fait" }; onUpdate(client.id, { missionStatus, mission }); };
  return <ChecklistCard title="Checklist Dossier Permanent (DP)" items={DP_CHECKLIST_ITEMS} statusMap={statusMap} onCycle={cycle} />;
}

export { MissionTab };
