import { Eye, EyeOff, Copy } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



function SocialAccessPassword({ value, onChange, placeholder = "Mot de passe / clé", disabled = false }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value || ""); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "1 1 220px" }}>
      <input disabled={disabled} type={visible ? "text" : "password"} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, fontFamily: T.mono, fontSize: 12, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, minWidth: 0 }} />
      <button type="button" disabled={disabled} onClick={() => setVisible(v => !v)} title={visible ? "Masquer" : "Afficher"}
        style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 7, padding: 6, cursor: "pointer", color: T.inkMuted, display: "flex" }}>
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button type="button" onClick={copy} title="Copier" style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 7, padding: 6, cursor: "pointer", color: copied ? T.green : T.inkMuted, display: "flex" }}>
        <Copy size={13} />
      </button>
    </div>
  );
}

export { SocialAccessPassword };
