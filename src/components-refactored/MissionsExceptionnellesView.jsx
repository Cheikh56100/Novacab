import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { MissionsExceptionnellesTab } from "./MissionsExceptionnellesTab.jsx";
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;



function MissionsExceptionnellesView({ clients, search, roleFilter, setRoleFilter, me, onUpdate, team }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const [expanded, setExpanded] = useState(null);

  const avecMissions = filtered.filter((c) => (c.missionsExceptionnelles || []).length > 0);
  const sansMission = filtered.filter((c) => !(c.missionsExceptionnelles || []).length);

  const renderRow = (c) => {
    const isOpen = expanded === c.id;
    const nb = (c.missionsExceptionnelles || []).length;
    return (
      <div key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="hoverRow clickable" onClick={() => setExpanded(isOpen ? null : c.id)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
          <Stamped tone={nb > 0 ? "amber" : "neutral"} small>{nb} mission{nb > 1 ? "s" : ""}</Stamped>
          {isOpen ? <ChevronUp size={15} color={T.inkMuted} /> : <ChevronDown size={15} color={T.inkMuted} />}
        </div>
        {isOpen && <div style={{ padding: "0 4px 16px" }}><MissionsExceptionnellesTab client={c} team={team} onUpdate={onUpdate} /></div>}
      </div>
    );
  };

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Missions exceptionnelles</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Missions ponctuelles en dehors de la lettre de mission récurrente.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`Dossiers avec mission(s) en cours (${avecMissions.length})`}>{avecMissions.length === 0 ? <EmptyNote text="Aucune mission exceptionnelle en cours." /> : avecMissions.map(renderRow)}</Panel>
      <div style={{ height: 16 }} />
      <Panel title="Tous les autres dossiers">{sansMission.length === 0 ? <EmptyNote text="Aucun autre dossier dans cette sélection." /> : sansMission.map(renderRow)}</Panel>
    </div>
  );
}

export { MissionsExceptionnellesView };
