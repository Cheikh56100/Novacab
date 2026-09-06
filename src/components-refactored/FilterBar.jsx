import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, REGIMES_TVA, ROLE_FILTER_OPTIONS, STATUT_FILTER_OPTIONS } = Core;


function FilterBar({ roleFilter, setRoleFilter, count, regimeFilter, setRegimeFilter, statutFilter, setStatutFilter, search, setSearch }) {
  const selectCls = "input-field !py-1.5 !w-auto text-xs md:text-[13px] font-medium cursor-pointer";
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 py-0.5">
      <select value={roleFilter || "Tous"} onChange={(e) => setRoleFilter(e.target.value)} className={selectCls} title="Filtrer par mon rôle">
        {ROLE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value === "Tous" ? o.label : `Mon rôle : ${o.label}`}</option>)}
      </select>
      {setRegimeFilter && (
        <select value={regimeFilter || "Tous"} onChange={(e) => setRegimeFilter(e.target.value)} className={`${selectCls} font-mono`} title="Filtrer par régime TVA">
          <option value="Tous">Régime TVA : Tous</option>
          {REGIMES_TVA.map((r) => <option key={r} value={r}>Régime TVA : {r}</option>)}
        </select>
      )}
      {setStatutFilter && (
        <select value={statutFilter || "actif"} onChange={(e) => setStatutFilter(e.target.value)} className={selectCls} title="Filtrer par statut du dossier">
          {STATUT_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>Statut : {o.label}</option>)}
        </select>
      )}
      <span className="ml-auto font-mono text-[11.5px] text-inkmuted whitespace-nowrap">{count} dossier(s)</span>
    </div>
  );
}

export { FilterBar };
