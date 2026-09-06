import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { AcompteRow } from "./AcompteRow.jsx";
import { Shared } from "./shared.js";
const { T, exportAcomptesToExcel } = Shared;
const { useMemo } = React;



/* ============================================================
   ACOMPTES VIEW
   ============================================================ */
function AcomptesView({ clients, search, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const isConcerned = filtered.filter((c) => Number(c.is?.montantN1) > 3000);
const cfeConcerned = filtered.filter((c) => Number(c.cfe?.montantN1) > 3000);
  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Impôts &amp; taxes</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Dossiers dont l'impôt N-1 dépasse 3 000 €.</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={() => exportAcomptesToExcel([...isConcerned, ...cfeConcerned.filter((c) => !isConcerned.includes(c))])} className="btn-secondary !py-2">
          Exporter les informations générales
        </button>
      </div>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`Acomptes IS (${isConcerned.length} dossiers concernés)`}>
        {isConcerned.length === 0 ? <EmptyNote text="Aucun dossier marqué concerné pour l'instant." /> : isConcerned.map((c) => (
          <AcompteRow key={c.id} client={c} fields={[["mars", "Mars"], ["juin", "Juin"], ["sept", "Sept"], ["dec", "Déc"], ["solde", "Solde"]]} field="is" onUpdate={onUpdate} />
        ))}
      </Panel>
      <div style={{ height: 16 }} />
      <Panel title={`Acomptes CFE (${cfeConcerned.length} dossiers concernés)`}>
        {cfeConcerned.length === 0 ? <EmptyNote text="Aucun dossier marqué concerné pour l'instant." /> : cfeConcerned.map((c) => (
          <AcompteRow key={c.id} client={c} fields={[["juin", "Juin"], ["dec", "Déc (solde)"]]} field="cfe" onUpdate={onUpdate} />
        ))}
      </Panel>
    </div>
  );
}

export { AcomptesView };
