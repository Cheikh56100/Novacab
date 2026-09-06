import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER } = Core;
import { Stamped } from "./Stamped.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;


function CotisationMonthlyGrid({ client, onUpdate }) {
  const rev = client.revision || {};
  const cotisMois = rev.cotisMois || {};
  const types = cotisationTypesFor(client).map((t) => ({
    ...t,
    // Compatibilité avec les anciennes données : le libellé doit rester visible
    // même si seul la clé de l'organisme a été enregistrée.
    label: t.label || t.name || t.organisme || t.key || "Cotisation",
  }));
  const cycleCell = (typeKey, mois) => {
    const monthsObj = cotisMois[typeKey] || {};
    onUpdate(client.id, { revision: { ...rev, cotisMois: { ...cotisMois, [typeKey]: { ...monthsObj, [mois]: bankCycle(monthsObj[mois]) } } } });
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 190px) 1fr", gap: 8, alignItems: "center", padding: "0 4px 7px", borderBottom: `1px solid ${T.line}`, marginBottom: 9 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 800, color: T.inkMuted }}>Organisme / cotisation</div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 800, color: T.inkMuted }}>Suivi mensuel</div>
      </div>
      {types.map((t) => (
        <div key={t.key} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 190px) 1fr", gap: 8, alignItems: "start", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, padding: "7px 4px", minHeight: 30, display: "flex", alignItems: "center" }}>{t.label || t.key || "Cotisation"}</div>
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
