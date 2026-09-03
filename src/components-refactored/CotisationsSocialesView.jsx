import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { InfoHint } from "./InfoHint.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { CotisationMonthlyGrid } from "./CotisationMonthlyGrid.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;


function CotisationsSocialesView({ clients, search, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const concernes = filtered.filter((c) => c.social?.concerne);
  const [expanded, setExpanded] = useState(null);
  const completion = (c) => {
    const rev = c.revision || {}; const cotisMois = rev.cotisMois || {};
    const types = cotisationTypesFor(c); const m = currentMonthKey();
    const done = types.filter((t) => (cotisMois[t.key]?.[m] || "") !== "").length;
    return { done, total: types.length };
  };
  const renderRow = (c) => {
    const isOpen = expanded === c.id;
    const comp = completion(c);
    return (
      <div key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="hoverRow clickable" onClick={() => setExpanded(isOpen ? null : c.id)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
          <Stamped tone={comp.done === comp.total ? "green" : comp.done > 0 ? "amber" : "neutral"} small>{comp.done}/{comp.total} ce mois-ci</Stamped>
          {isOpen ? <ChevronUp size={15} color={T.inkMuted} /> : <ChevronDown size={15} color={T.inkMuted} />}
        </div>
        {isOpen && <div style={{ padding: "0 4px 16px" }}><CotisationMonthlyGrid client={c} onUpdate={onUpdate} /></div>}
      </div>
    );
  };
  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Cotisations sociales</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18, lineHeight: 1.6 }}>
        <InfoHint summary={<>Révision des comptes de cotisations, mois par mois. Cliquez une cellule : vide → <Stamped tone="green" small>Fait</Stamped> → <Stamped tone="neutral" small>N/A</Stamped>.</>}>
          Révision des comptes de cotisations — URSSAF, caisse de retraite, prévoyance (et PRO BTP / CIBTP pour les dossiers du bâtiment) — mois par mois, dossier par dossier.
          {" "}Cliquez une cellule : vide → <Stamped tone="green" small>Fait</Stamped> → <Stamped tone="neutral" small>N/A</Stamped>. L'historique est conservé mois par mois.
        </InfoHint>
      </p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={concernes.length} />
      <Panel title={`Dossiers concernés (${concernes.length})`}>
        {concernes.length === 0 ? <EmptyNote text="Aucun dossier marqué « concerné par le social » pour l'instant." /> : concernes.map(renderRow)}
      </Panel>
    </div>
  );
}

export { CotisationsSocialesView };
