import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Shared } from "./shared.js";
const { T, fmtFR } = Shared;


function BilanTable({ clients, onUpdate }) {
  return (
    <div>
      {clients.map((c) => {
        const b = c.bilan || {};
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 4px", borderBottom: `1px solid ${T.line}`, flexWrap: "wrap" }}>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
            <span style={{ fontSize: 11.5, color: T.inkMuted }}>Clôture: {fmtFR(c.dateCloture)}</span>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.inkMuted }}><input type="checkbox" checked={!!b.finaliseApres} onChange={() => onUpdate(c.id, { bilan: { ...b, finaliseApres: !b.finaliseApres } })} /> finalisé après échéance</label>
            <Stamped tone={isBilanLate(c) ? "red" : "neutral"} small>{isBilanLate(c) ? "En retard" : "Dans les délais"}</Stamped>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.inkMuted }}><input type="checkbox" checked={!!b.courrier} onChange={() => onUpdate(c.id, { bilan: { ...b, courrier: !b.courrier } })} /> courrier classé</label>
          </div>
        );
      })}
    </div>
  );
}

export { BilanTable };
