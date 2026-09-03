import { Eye, EyeOff, Copy } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



function AccesPasswordField({ value, onCommit, disabled = false }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard indisponible — on ignore silencieusement */ }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        disabled={disabled}
        type={visible ? "text" : "password"}
        defaultValue={value}
        onBlur={(e) => onCommit(e.target.value)}
        placeholder="Mot de passe"
        style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 8, border: `1px solid ${T.line}`, width: 140, background: T.card }}
      />
      <button type="button" disabled={disabled} onClick={() => setVisible((v) => !v)} title={visible ? "Masquer" : "Afficher"}
        style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 7, padding: 5, cursor: "pointer", color: T.inkMuted, display: "flex" }}>
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button type="button" onClick={copy} title="Copier le mot de passe"
        style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 7, padding: 5, cursor: "pointer", color: copied ? T.green : T.inkMuted, display: "flex" }}>
        <Copy size={13} />
      </button>
      {copied && <span style={{ fontSize: 10.5, color: T.green, fontWeight: 700 }}>Copié !</span>}
    </div>
  );
}

export { AccesPasswordField };
