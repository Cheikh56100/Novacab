import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { BilanTable } from "./BilanTable.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useMemo } = React;



/* ============================================================
   BILANS VIEW
   ============================================================ */
function BilansView({ clients, search, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const late = filtered.filter(isBilanLate);
  const others = filtered.filter((c) => !isBilanLate(c) && c.bilan);
  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Suivi des bilans</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Repérez les dossiers en retard et suivez le courrier de relance.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`En retard (${late.length})`}>{late.length === 0 ? <EmptyNote text="Aucun bilan en retard sur cette sélection." /> : <BilanTable clients={late} onUpdate={onUpdate} />}</Panel>
      <div style={{ height: 16 }} />
      <Panel title="Autres dossiers suivis">{others.length === 0 ? <EmptyNote text="Aucun autre dossier avec suivi de bilan renseigné." /> : <BilanTable clients={others} onUpdate={onUpdate} />}</Panel>
    </div>
  );
}

export { BilansView };
