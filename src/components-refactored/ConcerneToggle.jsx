import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;


function ConcerneToggle({ on, onChange, small }) {
  const size = small ? { fontSize: 9.5, padding: "2px 8px" } : { fontSize: 11, padding: "4px 11px" };
  return (
    <div style={{ display: "inline-flex", borderRadius: 999, border: `1px solid ${T.line}`, overflow: "hidden" }}>
      <button onClick={() => onChange(true)} style={{ ...size, fontWeight: 700, border: "none", cursor: "pointer", background: on ? T.navy : "transparent", color: on ? "#fff" : T.inkMuted }}>Concerné</button>
      <button onClick={() => onChange(false)} style={{ ...size, fontWeight: 700, border: "none", cursor: "pointer", background: !on ? T.paperDeep : "transparent", color: !on ? T.inkSoft : T.inkMuted }}>Non concerné</button>
    </div>
  );
}

export { ConcerneToggle };
