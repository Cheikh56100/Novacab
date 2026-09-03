import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { AgeAgoEditor } from "./AgeAgoEditor.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;



function AgeAgoView({ clients, search, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const [expanded, setExpanded] = useState(null);
  const withAlert = filtered.filter((c) => Object.values(c.ageAgoHistory || {}).some((y) => y.capitauxInf || y.ageContinuite));
  const rest = filtered.filter((c) => !withAlert.includes(c));
  const renderRow = (c) => {
    const h = c.ageAgoHistory || {}; const latestYear = Object.keys(h).sort((a, b) => b - a)[0]; const latest = latestYear ? h[latestYear] : null;
    const isOpen = expanded === c.id;
    return (
      <div key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="hoverRow clickable" onClick={() => setExpanded(isOpen ? null : c.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
          {latest ? (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <Stamped tone={latest.ago ? "green" : "neutral"} small>{latestYear} · {latest.ago ? "AGO tenue" : "AGO à tenir"}</Stamped>
              <Stamped tone={latest.depose ? "green" : "amber"} small>{latest.depose ? "Déposée" : "Non déposée"}</Stamped>
              {latest.capitauxInf && <Stamped tone="red" small>Capitaux &lt; 1/2</Stamped>}
              {latest.ageContinuite && <Stamped tone="red" small>AGE continuité</Stamped>}
            </div>
          ) : <Stamped tone="neutral" small>Aucun exercice suivi</Stamped>}
          {isOpen ? <ChevronUp size={15} color={T.inkMuted} /> : <ChevronDown size={15} color={T.inkMuted} />}
        </div>
        {isOpen && <div style={{ padding: "0 4px 16px" }}><AgeAgoEditor client={c} onUpdate={onUpdate} /></div>}
      </div>
    );
  };
  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>AGE / AGO</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Suivi par exercice : assemblée tenue, dépôt au greffe et par qui, situations à surveiller.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`Dossiers signalés (${withAlert.length})`}>{withAlert.length === 0 ? <EmptyNote text="Aucun dossier signalé pour le moment." /> : withAlert.map(renderRow)}</Panel>
      <div style={{ height: 16 }} />
      <Panel title="Tous les dossiers">{rest.length === 0 ? <EmptyNote text="Aucun autre dossier dans cette sélection." /> : rest.map(renderRow)}</Panel>
    </div>
  );
}

export { AgeAgoView };
