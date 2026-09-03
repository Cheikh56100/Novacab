import { Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { AccesPasswordField } from "./AccesPasswordField.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function AccesEntryRow({ entry, onChange, onRemove, disabled = false }) {
  const patch = (f) => onChange({ ...entry, ...f });
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 11, padding: "10px 12px", marginBottom: 8, background: T.paper }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input disabled={disabled} defaultValue={entry.libelle} placeholder="Libellé (ex. BNP Paribas — compte courant)" onBlur={(e) => patch({ libelle: e.target.value })}
          style={{ flex: "1 1 200px", fontSize: 12.5, fontWeight: 600, padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }} />
        <button type="button" disabled={disabled} onClick={onRemove} title="Supprimer cet accès"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.inkMuted, display: "flex", flexShrink: 0 }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input disabled={disabled} defaultValue={entry.identifiant} placeholder="Identifiant" onBlur={(e) => patch({ identifiant: e.target.value })}
          style={{ fontSize: 12, padding: "5px 8px", borderRadius: 8, border: `1px solid ${T.line}`, width: 150, background: T.card }} />
        <AccesPasswordField value={entry.motDePasse} onCommit={(v) => patch({ motDePasse: v })} disabled={disabled} />
      </div>
      <textarea disabled={disabled} defaultValue={entry.note} placeholder="Note libre (URL, RIB, digicode…)" onBlur={(e) => patch({ note: e.target.value })}
        rows={2} style={{ width: "100%", marginTop: 8, fontSize: 12, padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, resize: "vertical", fontFamily: T.sans }} />
    </div>
  );
}

export { AccesEntryRow };
