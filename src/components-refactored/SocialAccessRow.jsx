import { Check, Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { SocialAccessPassword } from "./SocialAccessPassword.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState } = React;



function SocialAccessRow({ row, onSave, onDelete, canEdit = true }) {
  const [draft, setDraft] = useState({ ...row });
  const dirty = JSON.stringify(draft) !== JSON.stringify(row);
  const patch = p => setDraft(d => ({ ...d, ...p }));
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 11, padding: "10px 12px", marginBottom: 8, background: T.paper }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <select disabled={!canEdit} value={draft.organisme || "Autre"} onChange={e => patch({ organisme: e.target.value })}
          style={{ minWidth: 165, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, fontWeight: 700, color: T.ink }}>
          {ORGANISMES_SOCIAUX.map(x => <option key={x}>{x}</option>)}
        </select>
        <input disabled={!canEdit} value={draft.libelle || ""} onChange={e => patch({ libelle: e.target.value })} placeholder="Libellé / dossier"
          style={{ flex: "1 1 180px", padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12 }} />
        {canEdit && <button type="button" onClick={onDelete} title="Supprimer" style={{ marginLeft: "auto", background: "none", border: "none", color: T.inkMuted, cursor: "pointer" }}><Trash2 size={14} /></button>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input disabled={!canEdit} value={draft.identifiant || ""} onChange={e => patch({ identifiant: e.target.value })} placeholder="Identifiant"
          style={{ flex: "1 1 150px", padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12 }} />
        <input disabled={!canEdit} value={draft.siret || ""} onChange={e => patch({ siret: e.target.value })} placeholder="SIRET (optionnel)"
          style={{ flex: "1 1 150px", padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, fontFamily: T.mono }} />
        <SocialAccessPassword value={draft.secret} onChange={v => patch({ secret: v })} disabled={!canEdit} />
      </div>
      <textarea disabled={!canEdit} value={draft.note || ""} onChange={e => patch({ note: e.target.value })} placeholder="Note / URL / précision"
        rows={2} style={{ width: "100%", marginTop: 8, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, fontSize: 12, resize: "vertical" }} />
      {dirty && canEdit && <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={() => onSave(draft)} style={{ display: "flex", alignItems: "center", gap: 5, background: T.navy, color: "#fff", border: 0, borderRadius: 8, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}><Check size={13} /> Enregistrer</button>
      </div>}
    </div>
  );
}

export { SocialAccessRow };
