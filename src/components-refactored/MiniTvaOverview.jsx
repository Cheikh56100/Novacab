import { ArrowUpRight } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { LegendDot } from "./LegendDot.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function MiniTvaOverview({ clients, setView }) {
  const key = currentMonthKey();
  const relevant = clients.filter((c) => c.tvaRegime === "CA3");
  const statuses = relevant.map((c) => effectiveTvaStatus(c, key));
  const ok = statuses.filter((s) => s === "OK").length;
  const fait = statuses.filter((s) => s === "FAIT").length;
  const na = statuses.filter((s) => s === "NA").length;
  const late = statuses.filter((s) => s === "RETARD").length;
  const enAttente = relevant.length - ok - fait - na - late;
  const total = relevant.length || 1;
  return (
    <div>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${(ok / total) * 100}%`, background: T.green }} />
        <div style={{ width: `${(fait / total) * 100}%`, background: T.amber }} />
        <div style={{ width: `${(late / total) * 100}%`, background: T.red }} />
        <div style={{ width: `${(na / total) * 100}%`, background: T.line }} />
        <div style={{ width: `${(enAttente / total) * 100}%`, background: T.paperDeep }} />
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12.5, flexWrap: "wrap" }}>
        <LegendDot color={T.green} label={`${ok} déclarées`} />
        <LegendDot color={T.amber} label={`${fait} préparées (à vérifier)`} />
        <LegendDot color={T.red} label={`${late} en retard`} />
        <LegendDot color={T.line} label={`${na} non applicable`} />
        <button onClick={() => setView("tva")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.navy, fontWeight: 600, fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}>
          Voir le détail <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}

export { MiniTvaOverview };
