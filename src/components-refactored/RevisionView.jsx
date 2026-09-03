import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { RevisionTab } from "./RevisionTab.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;


function RevisionView({ clients, search, roleFilter, setRoleFilter, me, onUpdate, setView }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const [expanded, setExpanded] = useState(null);

  const revisionStatus = (c) => {
    const rev = c.revision || {};
    const bankDone = MOIS_ORDER.every((m) => (rev.banqueMois?.[m] || "") !== "");
    if (bankDone) return "complete";
    if (rev.banqueMois && Object.keys(rev.banqueMois).length) return "encours";
    return "nondemarre";
  };

  const late = filtered.filter((c) => revisionStatus(c) === "nondemarre");
  const encours = filtered.filter((c) => revisionStatus(c) === "encours");
  const complete = filtered.filter((c) => revisionStatus(c) === "complete");

  const renderRow = (c) => {
    const isOpen = expanded === c.id;
    return (
      <div key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="hoverRow clickable" onClick={() => setExpanded(isOpen ? null : c.id)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
          <Stamped tone={revisionStatus(c) === "complete" ? "green" : revisionStatus(c) === "encours" ? "amber" : "neutral"} small>
            {revisionStatus(c) === "complete" ? "Terminée" : revisionStatus(c) === "encours" ? "En cours" : "Non démarrée"}
          </Stamped>
          {isOpen ? <ChevronUp size={15} color={T.inkMuted} /> : <ChevronDown size={15} color={T.inkMuted} />}
        </div>
        {isOpen && <div style={{ padding: "0 4px 16px" }}><RevisionTab client={c} onUpdate={onUpdate} setView={setView} /></div>}
      </div>
    );
  };

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Révision comptable</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>
        Rapprochements bancaires, dossier par dossier. Le suivi des OD de salaires et la révision des comptes de cotisations se font désormais depuis le menu « Social &amp; paie ».
      </p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`Non démarrée (${late.length})`}>{late.length === 0 ? <EmptyNote text="Aucun dossier dans cette situation." /> : late.map(renderRow)}</Panel>
      <div style={{ height: 16 }} />
      <Panel title={`En cours (${encours.length})`}>{encours.length === 0 ? <EmptyNote text="Aucun dossier dans cette situation." /> : encours.map(renderRow)}</Panel>
      <div style={{ height: 16 }} />
      <Panel title={`Terminée (${complete.length})`}>{complete.length === 0 ? <EmptyNote text="Aucun dossier dans cette situation." /> : complete.map(renderRow)}</Panel>
    </div>
  );
}

export { RevisionView };
