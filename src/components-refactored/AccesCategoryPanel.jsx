import { Plus } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { AccesEntryRow } from "./AccesEntryRow.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function AccesCategoryPanel({ category, entries, onUpdate, canEdit = true }) {
  const Icon = category.icon;
  const list = entries || [];
  const setList = (next) => onUpdate(next);
  const addEntry = () => setList([...list, { id: uid(), libelle: "", identifiant: "", motDePasse: "", note: "" }]);
  const updateEntry = (id, next) => setList(list.map((e) => (e.id === id ? next : e)));
  const removeEntry = (id) => {
    if (!confirm("Supprimer cet accès ?")) return;
    setList(list.filter((e) => e.id !== id));
  };
  return (
    <Panel title={`${category.label} (${list.length})`}>
      {list.length === 0 && <EmptyNote text="Aucun accès enregistré dans cette catégorie." />}
      {list.map((e) => <AccesEntryRow key={e.id} entry={e} onChange={(next) => updateEntry(e.id, next)} onRemove={() => removeEntry(e.id)} disabled={!canEdit} />)}
      {canEdit && <button type="button" onClick={addEntry} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, background: "none", border: `1px dashed ${T.line}`, borderRadius: 9, padding: "7px 12px", fontSize: 12, color: T.navy, cursor: "pointer" }}>
        <Plus size={13} /> Ajouter {category.placeholder ? `(${category.placeholder})` : "un accès"}
      </button>}
    </Panel>
  );
}

export { AccesCategoryPanel };
