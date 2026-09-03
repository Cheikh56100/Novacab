import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { PaymentStatus } from "./PaymentStatus.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function PaymentLine({ label, amount, status, onAmountChange, onStatusChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 120px 165px", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.line}` }}>
      <div style={{ fontSize: 11.5, fontWeight: 600 }}>{label}</div>
      <input type="number" min="0" step="0.01" value={amount ?? ""} placeholder="Montant" onChange={(e) => onAmountChange(e.target.value)}
        style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, width: "100%", textAlign: "right" }} />
      <PaymentStatus value={status} onChange={onStatusChange} />
    </div>
  );
}

export { PaymentLine };
