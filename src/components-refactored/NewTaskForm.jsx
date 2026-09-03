import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Panel } from "./Panel.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { TASK_PRIORITES } from "../constants/pilotage";
const { useState } = React;



function NewTaskForm({ clients, team, onCancel, onSubmit }) {
  const [nom, setNom] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [responsableId, setResponsableId] = useState("");
  const [priorite, setPriorite] = useState("normale");
  const [dateEcheance, setDateEcheance] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    await onSubmit({
      nom: nom.trim(), client_id: clientId || null, responsable_id: responsableId || null,
      priorite, statut: "a_faire", date_echeance: dateEcheance || null, commentaire: commentaire.trim() || null,
    });
    setSaving(false);
  };

  return (
    <Panel title="Nouvelle tâche">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <FieldRow label="Nom de la tâche">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Relancer client pour justificatifs"
            className="input-field !w-56" />
        </FieldRow>
        <FieldRow label="Client">
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-field !w-auto">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Responsable">
          <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="input-field !w-auto">
            <option value="">— Non assigné —</option>
            {(team || []).map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Priorité">
          <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className="input-field !w-auto">
            {TASK_PRIORITES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Échéance">
          <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} className="input-field !w-auto" />
        </FieldRow>
      </div>
      <FieldRow label="Commentaire">
        <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} className="input-field !w-full resize-y" />
      </FieldRow>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel} className="btn-secondary">Annuler</button>
        <button onClick={submit} disabled={saving || !nom.trim()} className="btn-primary disabled:opacity-60">
          {saving ? "Création…" : "Créer la tâche"}
        </button>
      </div>
    </Panel>
  );
}

export { NewTaskForm };
