import { Plus } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { EmptyNote } from "./EmptyNote.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { TextInput } from "./TextInput.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;

const inputStyle = {
  fontFamily: T.sans,
  fontSize: 12,
  padding: "8px 10px",
  borderRadius: 9,
  border: `1px solid ${T.line}`,
  background: T.card,
  color: T.ink,
  outline: "none",
};

const { useState } = React;



/* ============================================================
   AGE / AGO
   ============================================================ */
function AgeAgoEditor({ client, onUpdate }) {
  const history = client.ageAgoHistory || {};
  const years = Object.keys(history).sort((a, b) => b - a);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const addYear = () => { if (!newYear || history[newYear]) return; onUpdate(client.id, { ageAgoHistory: { ...history, [newYear]: { ago: false, depose: false, deposePar: "", capitauxInf: false, ageContinuite: false } } }); };
  const patchYear = (year, patch) => onUpdate(client.id, { ageAgoHistory: { ...history, [year]: { ...history[year], ...patch } } });
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input type="number" placeholder="Année" value={newYear} onChange={(e) => setNewYear(e.target.value)} style={{ width: 100, ...inputStyle, padding: "8px 10px" }} />
        <button onClick={addYear} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}><Plus size={14} /> Ajouter cet exercice</button>
      </div>
      {years.length === 0 ? <EmptyNote text="Aucun exercice suivi pour ce dossier." /> : years.map((year) => {
        const y = history[year];
        return (
          <div key={year} style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, background: T.card }}>
            <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 8 }}>Exercice {year}</div>
            <FieldRow label="Assemblée tenue (AGO)"><ToggleBtn on={!!y.ago} onClick={() => patchYear(year, { ago: !y.ago })} /></FieldRow>
            <FieldRow label="Déposée au greffe"><ToggleBtn on={!!y.depose} onClick={() => patchYear(year, { depose: !y.depose })} /></FieldRow>
            <FieldRow label="Déposée par"><TextInput defaultValue={y.deposePar} onCommit={(v) => patchYear(year, { deposePar: v })} placeholder="ex. Louis Dupont" width={140} /></FieldRow>
            <FieldRow label="Capitaux propres < 1/2 capital social"><ToggleBtn on={!!y.capitauxInf} onClick={() => patchYear(year, { capitauxInf: !y.capitauxInf })} tone="red" /></FieldRow>
            <FieldRow label="AGE continuité d'exploitation requise"><ToggleBtn on={!!y.ageContinuite} onClick={() => patchYear(year, { ageContinuite: !y.ageContinuite })} tone="red" /></FieldRow>
          </div>
        );
      })}
    </div>
  );
}

export { AgeAgoEditor };
