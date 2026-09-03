import { ChevronDown, ArrowUpRight, ChevronUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { ResiliationTab } from "./ResiliationTab.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;


function ResiliationsView({ clients, search, roleFilter, setRoleFilter, me, meId, portefeuilleId, onUpdate }) {
  // statutFilter="tous" : corrige le bug où un dossier disparaissait de la liste dès le
  // démarrage de la résiliation. Dès qu'une résiliation démarrait, le dossier passait en
  // statut "transfert", mais cette vue ne regardait (via filterClients) que les dossiers
  // "actif" par défaut — le dossier disparaissait donc sans aucun moyen d'y revenir.
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me, undefined, "tous"), [clients, search, roleFilter, me]);
  const [expanded, setExpanded] = useState(null);

  const enCours = filtered.filter((c) => c.resiliation?.active);
  const autres = filtered.filter((c) => !c.resiliation?.active);

  const renderRow = (c) => {
    const isOpen = expanded === c.id;
    const r = c.resiliation || {};
    const finalisee = r.active && c.statutDossier === "inactif";
    const pretAFinaliser = r.active && !!r.piecesRestituees && c.statutDossier === "transfert";
    return (
      <div key={c.id} style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="hoverRow clickable" onClick={() => setExpanded(isOpen ? null : c.id)}
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 4px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, minWidth: 140 }}>{c.nom}</div>
          {finalisee && <Stamped tone="neutral" small>Sortie finalisée</Stamped>}
          {!finalisee && r.active && <Stamped tone={pretAFinaliser ? "green" : "red"} small>{pretAFinaliser ? "Prêt à finaliser" : "En cours"}</Stamped>}
          {!r.active && <Stamped tone="neutral" small>Dossier actif</Stamped>}
          {r.motif && <span style={{ fontSize: 11, color: T.inkMuted }}>{r.motif}</span>}
          {r.active && !finalisee && !isOpen && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.navy, display: "flex", alignItems: "center", gap: 3 }}>
              Reprendre <ArrowUpRight size={12} />
            </span>
          )}
          {isOpen ? <ChevronUp size={15} color={T.inkMuted} /> : <ChevronDown size={15} color={T.inkMuted} />}
        </div>
        {isOpen && <div style={{ padding: "0 4px 16px" }}><ResiliationTab client={c} me={me} meId={meId} portefeuilleId={portefeuilleId} onUpdate={onUpdate} /></div>}
      </div>
    );
  };

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Résiliations</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Suivi des dossiers résiliés et des dossiers en cours de sortie.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <Panel title={`Résiliés / en cours (${enCours.length})`}>{enCours.length === 0 ? <EmptyNote text="Aucun dossier résilié pour l'instant." /> : enCours.map(renderRow)}</Panel>
      <div style={{ height: 16 }} />
      <Panel title="Tous les autres dossiers">{autres.length === 0 ? <EmptyNote text="Aucun autre dossier dans cette sélection." /> : autres.map(renderRow)}</Panel>
    </div>
  );
}

export { ResiliationsView };
