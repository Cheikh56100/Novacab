import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T, CHECKLIST_STATUS } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



function ChecklistStatusButton({ status, onClick }) {
  return <button type="button" onClick={onClick} className="clickable" style={{ border: `1px solid ${status === "fait" ? T.green : status === "en_cours" ? T.amber : T.red}`, background: status === "fait" ? T.greenSoft : status === "en_cours" ? T.amberSoft : T.redSoft, color: status === "fait" ? T.green : status === "en_cours" ? T.amber : T.red, borderRadius: 999, padding: "4px 9px", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>{CHECKLIST_STATUS[status]}</button>;
}

export { ChecklistStatusButton };
