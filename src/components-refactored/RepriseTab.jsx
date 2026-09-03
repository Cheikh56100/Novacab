import { Check, RefreshCw } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, REPRISE_PIECES } = Core;
import { Stamped } from "./Stamped.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { TextInput } from "./TextInput.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T, logActivity, todayISO, fmtFR } = Shared;



function RepriseTab({ client, me, meId, portefeuilleId, onUpdate }) {
  const r = client.reprise || {};
  const pieces = r.pieces || {};
  const patch = (fields) => onUpdate(client.id, { reprise: { ...r, ...fields } });
  const togglePiece = (k) => patch({ pieces: { ...pieces, [k]: !pieces[k] } });

  const activer = () => {
    const entry = { date: r.date || todayISO(), confrereCedant: r.confrereCedant, par: me };
    patch({ active: true, historique: [...(r.historique || []), entry] });
    // Statut intermédiaire : le dossier entre au cabinet mais n'est pas encore pleinement opérationnel.
    onUpdate(client.id, { statutDossier: "transfert" });
    logActivity({ clientId: client.id, portefeuilleId, type: "reprise", message: `Reprise démarrée (confrère cédant : ${r.confrereCedant || "—"})`, auteurId: meId });
  };
  const annuler = () => {
    patch({ active: false });
    onUpdate(client.id, { statutDossier: "actif" });
    logActivity({ clientId: client.id, portefeuilleId, type: "reprise", message: "Reprise annulée", auteurId: meId });
  };
  const finaliser = () => {
    onUpdate(client.id, { statutDossier: "actif" });
    logActivity({ clientId: client.id, portefeuilleId, type: "reprise", message: "Reprise finalisée (dossier actif)", auteurId: meId });
  };

  const doneCount = REPRISE_PIECES.filter((k) => pieces[k]).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: 0 }}>Reprise du dossier</h4>
        <Stamped tone={r.active ? "amber" : "neutral"} small>{r.active ? "Reprise en cours" : "Aucune reprise en cours"}</Stamped>
      </div>

      {r.active && (
        <div style={{ fontSize: 11.5, color: T.amber, background: T.amberSoft, padding: "8px 12px", borderRadius: 9, marginBottom: 16 }}>
          Ce dossier est marqué en cours de reprise — statut « En transfert ».
          <button onClick={annuler} style={{ marginLeft: 10, background: "none", border: "none", color: T.navy, fontWeight: 700, cursor: "pointer", fontSize: 11.5 }}>Annuler la reprise</button>
          {doneCount === REPRISE_PIECES.length && (
            <button onClick={finaliser} style={{ marginLeft: 10, background: "none", border: "none", color: T.green, fontWeight: 700, cursor: "pointer", fontSize: 11.5 }}>Finaliser la reprise (Actif)</button>
          )}
        </div>
      )}

      <FieldRow label="Date de reprise">
        <input type="date" value={r.date || ""} onChange={(e) => patch({ date: e.target.value })}
          style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} />
      </FieldRow>
      <FieldRow label="Confrère cédant"><TextInput defaultValue={r.confrereCedant} onCommit={(v) => patch({ confrereCedant: v })} placeholder="Nom du cabinet cédant" width={200} align="left" /></FieldRow>
      <FieldRow label="Lettre de confraternité envoyée"><ToggleBtn on={!!r.lettreConfraterniteEnvoyee} onClick={() => patch({ lettreConfraterniteEnvoyee: !r.lettreConfraterniteEnvoyee })} /></FieldRow>
      <FieldRow label="Lettre de confraternité reçue"><ToggleBtn on={!!r.lettreConfraterniteRecue} onClick={() => patch({ lettreConfraterniteRecue: !r.lettreConfraterniteRecue })} /></FieldRow>

      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>Suivi des pièces reprises</h4>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
          <span style={{ color: T.inkMuted }}>Progression</span><span style={{ fontFamily: T.mono, fontWeight: 600 }}>{doneCount}/{REPRISE_PIECES.length}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: T.paperDeep, overflow: "hidden" }}>
          <div style={{ width: `${(doneCount / REPRISE_PIECES.length) * 100}%`, height: "100%", background: T.navy }} />
        </div>
      </div>
      {REPRISE_PIECES.map((k) => (
        <div key={k} onClick={() => togglePiece(k)} className="clickable" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: `1px solid ${T.line}` }}>
          <span style={{ width: 19, height: 19, borderRadius: 5, border: `1.5px solid ${pieces[k] ? T.green : T.line}`, background: pieces[k] ? T.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {pieces[k] && <Check size={13} color="#fff" strokeWidth={3} />}
          </span>
          <span style={{ fontSize: 12.5, color: pieces[k] ? T.inkMuted : T.ink, textDecoration: pieces[k] ? "line-through" : "none" }}>{k}</span>
        </div>
      ))}

      {!r.active && (
        <button onClick={activer} style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, background: T.amber, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <RefreshCw size={14} /> Démarrer le suivi de reprise
        </button>
      )}

      {(r.historique || []).length > 0 && (
        <>
          <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>Historique</h4>
          {r.historique.map((h, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.inkMuted, padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>
              {fmtFR(h.date)} — confrère : {h.confrereCedant || "—"} · par {h.par}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export { RepriseTab };
