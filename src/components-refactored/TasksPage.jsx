import { Plus } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { TaskRow } from "./TaskRow.jsx";
import { NewTaskForm } from "./NewTaskForm.jsx";
import { bucketize as bucketizeDeadlines, BUCKET_LABELS as DEADLINE_BUCKET_LABELS } from "../services/deadlines";
import { TASK_STATUTS, TASK_PRIORITES, taskSortWeight } from "../constants/pilotage";
const { useState, useMemo } = React;



function TasksPage({ tasks, clients, team, me, myRow, onCreate, onUpdate, onComplete, onArchive, onDelete, onOpenClient }) {
  const [filterResponsable, setFilterResponsable] = useState("Tous");
  const [filterClient, setFilterClient] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Toutes");
  const [filterPriorite, setFilterPriorite] = useState("Toutes");
  const [showForm, setShowForm] = useState(false);

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const memberById = useMemo(() => Object.fromEntries((team || []).map((t) => [t.id, t])), [team]);

  const filtered = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (filterResponsable !== "Tous" && t.responsable_id !== filterResponsable) return false;
      if (filterClient !== "Tous" && t.client_id !== filterClient) return false;
      if (filterStatut !== "Toutes" && t.statut !== filterStatut) return false;
      if (filterPriorite !== "Toutes" && t.priorite !== filterPriorite) return false;
      return true;
    });
  }, [tasks, filterResponsable, filterClient, filterStatut, filterPriorite]);

  const buckets = useMemo(() => {
    const getDate = (t) => {
      if (!t.date_echeance) return null;
      const [y, m, d] = t.date_echeance.split("-").map(Number);
      return new Date(y, m - 1, d);
    };
    const b = bucketizeDeadlines(filtered.filter((t) => t.statut !== "termine"), getDate);
    const sansEcheance = filtered.filter((t) => t.statut !== "termine" && !t.date_echeance);
    b.avenir = [...new Set([...b.avenir, ...sansEcheance])];
    Object.keys(b).forEach((k) => { b[k] = b[k].sort((x, y) => taskSortWeight(x) - taskSortWeight(y)); });
    return b;
  }, [filtered]);

  const nbTermineesFiltrees = filtered.filter((t) => t.statut === "termine").length;
  const selectCls = "input-field !py-1.5 !w-auto text-xs md:text-[13px] font-medium cursor-pointer";

  return (
    <div>
      <Reveal>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-bold text-[17px] text-ink m-0">Mes tâches</h1>
            <p className="text-inkmuted text-xs mt-1 mb-0">
              {filtered.length - nbTermineesFiltrees} tâche(s) active(s), {nbTermineesFiltrees} terminée(s) sur la sélection.
            </p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus size={14} /> Nouvelle tâche
          </button>
        </div>
      </Reveal>

      {showForm && (
        <NewTaskForm clients={clients} team={team} onCancel={() => setShowForm(false)}
          onSubmit={async (payload) => { await onCreate(payload); setShowForm(false); }} />
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <select value={filterResponsable} onChange={(e) => setFilterResponsable(e.target.value)} className={selectCls}>
          <option value="Tous">Collaborateur : Tous</option>
          {(team || []).map((t) => <option key={t.id} value={t.id}>Collaborateur : {t.nom}</option>)}
        </select>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className={selectCls}>
          <option value="Tous">Client : Tous</option>
          {clients.map((c) => <option key={c.id} value={c.id}>Client : {c.nom}</option>)}
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={selectCls}>
          <option value="Toutes">Statut : Tous</option>
          {TASK_STATUTS.map((s) => <option key={s.code} value={s.code}>Statut : {s.label}</option>)}
        </select>
        <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)} className={selectCls}>
          <option value="Toutes">Priorité : Toutes</option>
          {TASK_PRIORITES.map((p) => <option key={p.code} value={p.code}>Priorité : {p.label}</option>)}
        </select>
      </div>

      {["retard", "aujourdhui", "semaine", "avenir"].map((bucketKey) => (
        <div key={bucketKey} className="mb-5">
          <Panel title={`${DEADLINE_BUCKET_LABELS[bucketKey]} (${buckets[bucketKey]?.length || 0})`}>
            {!buckets[bucketKey]?.length ? <EmptyNote text="Rien ici." /> : (
              <div className="flex flex-col gap-2">
                {buckets[bucketKey].map((t, i) => (
                  <TaskRow key={t.id} task={t} index={i} client={clientById[t.client_id]} responsable={memberById[t.responsable_id]}
                    onOpenClient={onOpenClient} onUpdate={onUpdate} onComplete={onComplete} onArchive={onArchive} onDelete={onDelete} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      ))}
    </div>
  );
}

export { TasksPage };
