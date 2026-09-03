import { Plus, Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MISSION_EXCEP_TYPES, MISSION_EXCEP_STATUTS, MISSION_EXCEP_STATUT_LABELS } = Core;
import { Stamped } from "./Stamped.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { SelectPill } from "./SelectPill.jsx";
import { TextInput } from "./TextInput.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T, todayISO, fmtFR } = Shared;
const { useState } = React;



function MissionsExceptionnellesTab({ client, team, onUpdate }) {
  const missions = client.missionsExceptionnelles || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: MISSION_EXCEP_TYPES[0], dateDemande: todayISO(), dateLivraisonPrevue: "", statut: "a_faire", collaborateur: "", honoraires: "", lettreSignee: false, notes: "" });

  const addMission = () => {
    const entry = { id: `me-${Date.now()}`, ...form };
    onUpdate(client.id, { missionsExceptionnelles: [...missions, entry] });
    setForm({ type: MISSION_EXCEP_TYPES[0], dateDemande: todayISO(), dateLivraisonPrevue: "", statut: "a_faire", collaborateur: "", honoraires: "", lettreSignee: false, notes: "" });
    setShowForm(false);
  };
  const patchMission = (id, patch) => onUpdate(client.id, { missionsExceptionnelles: missions.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const removeMission = (id) => onUpdate(client.id, { missionsExceptionnelles: missions.filter((m) => m.id !== id) });

  const sorted = [...missions].sort((a, b) => (a.dateDemande < b.dateDemande ? 1 : -1));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: 0 }}>Missions exceptionnelles ({missions.length})</h4>
        <button onClick={() => setShowForm((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 9, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={13} /> Nouvelle mission
        </button>
      </div>

      {showForm && (
        <div style={{ background: T.paper, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <FieldRow label="Type de mission"><SelectPill value={form.type} options={MISSION_EXCEP_TYPES} allowEmpty={false} onChange={(v) => setForm({ ...form, type: v })} /></FieldRow>
          <FieldRow label="Date de la demande"><input type="date" value={form.dateDemande} onChange={(e) => setForm({ ...form, dateDemande: e.target.value })} style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} /></FieldRow>
          <FieldRow label="Livraison prévue"><input type="date" value={form.dateLivraisonPrevue} onChange={(e) => setForm({ ...form, dateLivraisonPrevue: e.target.value })} style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} /></FieldRow>
          <FieldRow label="Collaborateur en charge"><SelectPill value={form.collaborateur} options={team.map((t) => t.nom)} onChange={(v) => setForm({ ...form, collaborateur: v })} /></FieldRow>
          <FieldRow label="Honoraires spécifiques"><TextInput defaultValue={form.honoraires} onCommit={(v) => setForm({ ...form, honoraires: v })} placeholder="ex. 800 € HT" width={160} /></FieldRow>
          <FieldRow label="Lettre de mission spécifique signée"><ToggleBtn on={form.lettreSignee} onClick={() => setForm({ ...form, lettreSignee: !form.lettreSignee })} /></FieldRow>
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 6 }}>Notes / livrable</div>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${T.line}`, fontSize: 12, background: T.card, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 11.5 }}>Annuler</button>
            <button onClick={addMission} style={{ padding: "7px 14px", borderRadius: 9, border: "none", background: T.navy, color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>Créer</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? <EmptyNote text="Aucune mission exceptionnelle pour ce dossier." /> : sorted.map((m) => (
        <div key={m.id} style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, background: T.card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 12.5 }}>{m.type}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={m.statut} onChange={(e) => patchMission(m.id, { statut: e.target.value })}
                style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, padding: "3px 6px", borderRadius: 7, border: `1px solid ${T.line}`, background: T.card }}>
                {MISSION_EXCEP_STATUTS.map((s) => <option key={s} value={s}>{MISSION_EXCEP_STATUT_LABELS[s]}</option>)}
              </select>
              <button onClick={() => removeMission(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkMuted }}><Trash2 size={13} /></button>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.inkMuted, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>Demande : {fmtFR(m.dateDemande)}</span>
            {m.dateLivraisonPrevue && <span>Livraison prévue : {fmtFR(m.dateLivraisonPrevue)}</span>}
            {m.collaborateur && <span>Collab. : {m.collaborateur}</span>}
            {m.honoraires && <span>Honoraires : {m.honoraires}</span>}
            <Stamped tone={m.lettreSignee ? "green" : "amber"} small>{m.lettreSignee ? "Lettre signée" : "Lettre à signer"}</Stamped>
          </div>
          {m.notes && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 8, whiteSpace: "pre-wrap" }}>{m.notes}</div>}
        </div>
      ))}
    </div>
  );
}

export { MissionsExceptionnellesTab };
