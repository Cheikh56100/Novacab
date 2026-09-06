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


function FormeJuridiqueEditor({ client, onUpdate }) {
  const history = client.formeJuridiqueHistory || {};
  const years = Object.keys(history).sort((a, b) => b - a);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const items = getFormeJuridiqueItems(client);
  const addYear = () => {
    if (!newYear || history[newYear]) return;
    const blank = Object.fromEntries(items.map((it) => [it.id, false]));
    onUpdate(client.id, { formeJuridiqueHistory: { ...history, [newYear]: { ...blank, notes: "" } } });
  };
  const patchYear = (year, patch) => onUpdate(client.id, { formeJuridiqueHistory: { ...history, [year]: { ...history[year], ...patch } } });

  if (!client.formeJuridique) {
    return <EmptyNote text="Renseignez d'abord la forme juridique dans l'onglet Infos générales." />;
  }
  if (items.length === 0) {
    return <EmptyNote text={`Aucune checklist définie pour "${client.formeJuridique}" pour le moment.`} />;
  }

  return (
    <div>
      <div style={{ padding: "12px 14px", border: `1px solid ${T.line}`, borderRadius: 12, background: T.paper, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: T.navy }}>Ce que NOVACAB vous propose de vérifier</div>
        <div style={{ fontSize: 11.5, color: T.inkMuted, lineHeight: 1.55, marginTop: 4 }}>La checklist est adaptée à la forme juridique du dossier. Elle sert de fil conducteur pour la revue annuelle ; les obligations exactes dépendent du dossier, des statuts et des seuils applicables.</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input type="number" placeholder="Année" value={newYear} onChange={(e) => setNewYear(e.target.value)} style={{ width: 100, ...inputStyle, padding: "8px 10px" }} />
        <button onClick={addYear} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}><Plus size={14} /> Ajouter cet exercice</button>
      </div>
      {years.length === 0 ? <EmptyNote text="Aucun exercice suivi pour ce dossier." /> : years.map((year) => {
        const y = history[year] || {};
        return (
          <div key={year} style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, background: T.card }}>
            <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 8 }}>
              Exercice {year} · <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMuted }}>{client.formeJuridique}</span>
            </div>
            {items.map((it) => (
              <FieldRow key={it.id} label={it.label}>
                <ToggleBtn on={!!y[it.id]} onClick={() => patchYear(year, { [it.id]: !y[it.id] })} />
              </FieldRow>
            ))}
            <FieldRow label="Notes"><TextInput defaultValue={y.notes} onCommit={(v) => patchYear(year, { notes: v })} placeholder="—" width={200} align="left" /></FieldRow>
          </div>
        );
      })}
    </div>
  );
}

export { FormeJuridiqueEditor };
