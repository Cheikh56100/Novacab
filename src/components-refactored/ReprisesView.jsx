import { ChevronDown, ArrowUpRight, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, REPRISE_PIECES } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { RepriseTab } from "./RepriseTab.jsx";
import { ResiliationsView } from "./ResiliationsView.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;



function ReprisesView({ clients, search, roleFilter, setRoleFilter, me, meId, portefeuilleId, onUpdate }) {
  // statutFilter="tous" : sans ça, le filtre par défaut ("actif") masque les dossiers
  // dès qu'une reprise démarre et bascule le statut sur "transfert" — le dossier
  // disparaissait alors purement et simplement de cette liste. Voir aussi ResiliationsView.
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me, undefined, "tous"), [clients, search, roleFilter, me]);
  const [expanded, setExpanded] = useState(null);

  const enCours = filtered.filter((c) => c.reprise?.active);
  const autres = filtered.filter((c) => !c.reprise?.active);

  const renderRow = (c) => {
    const isOpen = expanded === c.id;
    const r = c.reprise || {};
    const pieces = r.pieces || {};
    const doneCount = REPRISE_PIECES.filter((k) => pieces[k]).length;
    const finalisee = r.active && c.statutDossier === "actif";
    const pretAFinaliser = r.active && !finalisee && doneCount === REPRISE_PIECES.length;
    return (
      <div key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="hoverRow clickable" onClick={() => setExpanded(isOpen ? null : c.id)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
          {finalisee && <Stamped tone="green" small>Terminée</Stamped>}
          {!finalisee && r.active && <Stamped tone={pretAFinaliser ? "green" : "amber"} small>{pretAFinaliser ? "Prêt à finaliser" : "En cours"}</Stamped>}
          {!r.active && <Stamped tone="neutral" small>—</Stamped>}
          {r.confrereCedant && <span style={{ fontSize: 11, color: T.inkMuted }}>{r.confrereCedant}</span>}
          {r.active && !finalisee && !isOpen && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.navy, display: "flex", alignItems: "center", gap: 3 }}>
              Reprendre <ArrowUpRight size={12} />
            </span>
          )}
          {isOpen ? <ChevronUp size={15} color={T.inkMuted} /> : <ChevronDown size={15} color={T.inkMuted} />}
        </div>
        {isOpen && <div style={{ padding: "0 4px 16px" }}><RepriseTab client={c} me={me} meId={meId} portefeuilleId={portefeuilleId} onUpdate={onUpdate} /></div>}
      </div>
    );
  };

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Reprises</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Dossiers repris à un confrère cédant : suivi des pièces et de la transition.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`Reprises en cours (${enCours.length})`}>{enCours.length === 0 ? <EmptyNote text="Aucune reprise en cours." /> : enCours.map(renderRow)}</Panel>
      <div style={{ height: 16 }} />
      <Panel title="Tous les autres dossiers">{autres.length === 0 ? <EmptyNote text="Aucun autre dossier dans cette sélection." /> : autres.map(renderRow)}</Panel>
    </div>
  );
}

export { ReprisesView };
