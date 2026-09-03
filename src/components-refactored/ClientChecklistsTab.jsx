import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { ChecklistCard } from "./ChecklistCard.jsx";
import { Shared } from "./shared.js";
const { DA_CHECKLIST_ITEMS, DP_CHECKLIST_ITEMS, getDPStatus } = Shared;


function ClientChecklistsTab({ client, year, onUpdate }) {
  const dpStatus = Object.fromEntries(DP_CHECKLIST_ITEMS.map((it) => [it.id, getDPStatus(client, it.id)]));
  const daStatus = client.dossierAnnuelChecklist?.[year] || {};
  const cycleDP = (id) => onUpdate(client.id, { missionStatus: { ...(client.missionStatus || {}), [id]: nextChecklistStatus(dpStatus[id]) }, mission: { ...(client.mission || {}), [id]: nextChecklistStatus(dpStatus[id]) === "fait" } });
  const cycleDA = (id) => onUpdate(client.id, { dossierAnnuelChecklist: { ...(client.dossierAnnuelChecklist || {}), [year]: { ...daStatus, [id]: nextChecklistStatus(daStatus[id]) } } });
  return <div style={{ display: "grid", gap: 16 }}><ChecklistCard title={`Checklist Dossier Annuel (DA) — ${year}`} items={DA_CHECKLIST_ITEMS} statusMap={daStatus} onCycle={cycleDA} /><ChecklistCard title="Checklist Dossier Permanent (DP)" items={DP_CHECKLIST_ITEMS} statusMap={dpStatus} onCycle={cycleDP} /></div>;
}

export { ClientChecklistsTab };
