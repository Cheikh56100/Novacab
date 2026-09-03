import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;


function AcompteRow({ client, fields, field, onUpdate }) {
  const obj = client[field] || {};
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 4px", borderBottom: `1px solid ${T.line}`, flexWrap: "wrap" }}>
      <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{client.nom}</div>
      {fields.map(([k, label]) => (
        <label key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.inkMuted }}>
          <input type="checkbox" checked={!!obj[k]} onChange={() => onUpdate(client.id, { [field]: { ...obj, [k]: !obj[k] } })} /> {label}
        </label>
      ))}
    </div>
  );
}

export { AcompteRow };
