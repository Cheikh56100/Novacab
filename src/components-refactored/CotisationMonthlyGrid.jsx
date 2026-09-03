import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER } = Core;
import { Stamped } from "./Stamped.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;


function CotisationMonthlyGrid({ client, onUpdate }) {
  const rev = client.revision || {};
  const cotisMois = rev.cotisMois || {};
  const types = cotisationTypesFor(client);
  const cycleCell = (typeKey, mois) => {
    const monthsObj = cotisMois[typeKey] || {};
    onUpdate(client.id, { revision: { ...rev, cotisMois: { ...cotisMois, [typeKey]: { ...monthsObj, [mois]: bankCycle(monthsObj[mois]) } } } });
  };
  return (
    <div>
      {types.map((t) => (
        <div key={t.key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>{t.label}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {MOIS_ORDER.map((m) => (
              <button key={m} className="clickable" onClick={() => cycleCell(t.key, m)} style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 8, padding: "6px 4px", minWidth: 50, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.inkMuted, marginBottom: 3 }}>{m}</div>
                <Stamped tone={bankTone(cotisMois[t.key]?.[m])} small>{bankLabel(cotisMois[t.key]?.[m])}</Stamped>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { CotisationMonthlyGrid };
