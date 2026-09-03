import { AlertTriangle } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, RESILIATION_INITIATEURS, RESILIATION_MOTIFS } = Core;
import { Stamped } from "./Stamped.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { SelectPill } from "./SelectPill.jsx";
import { TextInput } from "./TextInput.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T, logActivity, todayISO, fmtFR } = Shared;



function ResiliationTab({ client, me, meId, portefeuilleId, onUpdate }) {
  const r = client.resiliation || {};
  const patch = (fields) => onUpdate(client.id, { resiliation: { ...r, ...fields } });

  const activer = () => {
    const entry = { date: r.date || todayISO(), initiateur: r.initiateur, motif: r.motif === "Autre" ? r.motifAutre : r.motif, par: me };
    patch({ active: true, historique: [...(r.historique || []), entry] });
    // Statut intermédiaire : le dossier est en cours de sortie mais pas encore totalement clos côté cabinet.
    onUpdate(client.id, { statutDossier: "transfert" });
    logActivity({ clientId: client.id, portefeuilleId, type: "resiliation", message: `Résiliation démarrée (motif : ${entry.motif || "—"})`, auteurId: meId });
  };
  const annuler = () => {
    patch({ active: false });
    onUpdate(client.id, { statutDossier: "actif" });
    logActivity({ clientId: client.id, portefeuilleId, type: "resiliation", message: "Résiliation annulée", auteurId: meId });
  };
  const finaliser = () => {
    onUpdate(client.id, { statutDossier: "inactif" });
    logActivity({ clientId: client.id, portefeuilleId, type: "resiliation", message: "Sortie du dossier finalisée (Inactif)", auteurId: meId });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: 0 }}>Résiliation du dossier</h4>
        <Stamped tone={r.active ? "red" : "green"} small>{r.active ? "Dossier résilié" : "Dossier actif"}</Stamped>
      </div>

      {r.active && (
        <div style={{ fontSize: 11.5, color: T.red, background: T.redSoft, padding: "8px 12px", borderRadius: 9, marginBottom: 16 }}>
          Ce dossier est marqué comme résilié — le statut a été basculé sur « En transfert » en attendant la clôture complète.
          <button onClick={annuler} style={{ marginLeft: 10, background: "none", border: "none", color: T.navy, fontWeight: 700, cursor: "pointer", fontSize: 11.5 }}>Annuler la résiliation</button>
          {r.piecesRestituees && (
            <button onClick={finaliser} style={{ marginLeft: 10, background: "none", border: "none", color: T.red, fontWeight: 700, cursor: "pointer", fontSize: 11.5 }}>Finaliser la sortie (Inactif)</button>
          )}
        </div>
      )}

      <FieldRow label="Date de résiliation">
        <input type="date" value={r.date || ""} onChange={(e) => patch({ date: e.target.value })}
          style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} />
      </FieldRow>
      <FieldRow label="Initiateur"><SelectPill value={r.initiateur} options={RESILIATION_INITIATEURS} onChange={(v) => patch({ initiateur: v })} /></FieldRow>
      <FieldRow label="Motif"><SelectPill value={r.motif} options={RESILIATION_MOTIFS} onChange={(v) => patch({ motif: v })} /></FieldRow>
      {r.motif === "Autre" && <FieldRow label="Précisez"><TextInput defaultValue={r.motifAutre} onCommit={(v) => patch({ motifAutre: v })} width={200} align="left" /></FieldRow>}

      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>Obligations légales & déontologiques</h4>
      <FieldRow label="Lettre de résiliation envoyée">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ToggleBtn on={!!r.lettreEnvoyee} onClick={() => patch({ lettreEnvoyee: !r.lettreEnvoyee, lettreDate: !r.lettreEnvoyee ? todayISO() : r.lettreDate })} />
          {r.lettreEnvoyee && <input type="date" value={r.lettreDate || ""} onChange={(e) => patch({ lettreDate: e.target.value })}
            style={{ fontFamily: T.mono, fontSize: 12, padding: "4px 7px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }} />}
        </div>
      </FieldRow>
      <FieldRow label="Préavis contractuel respecté"><ToggleBtn on={!!r.preavisRespecte} onClick={() => patch({ preavisRespecte: !r.preavisRespecte })} /></FieldRow>
      <FieldRow label="Pièces comptables restituées au client">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ToggleBtn on={!!r.piecesRestituees} onClick={() => patch({ piecesRestituees: !r.piecesRestituees, piecesRestitueesDate: !r.piecesRestituees ? todayISO() : r.piecesRestitueesDate })} tone="green" />
          {r.piecesRestituees && <input type="date" value={r.piecesRestitueesDate || ""} onChange={(e) => patch({ piecesRestitueesDate: e.target.value })}
            style={{ fontFamily: T.mono, fontSize: 12, padding: "4px 7px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }} />}
        </div>
      </FieldRow>

      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>Confraternité</h4>
      <FieldRow label="Confrère repreneur"><TextInput defaultValue={r.confrereRepreneur} onCommit={(v) => patch({ confrereRepreneur: v })} placeholder="Nom du cabinet" width={200} align="left" /></FieldRow>
      <FieldRow label="Lettre de confraternité envoyée"><ToggleBtn on={!!r.lettreConfraterniteEnvoyee} onClick={() => patch({ lettreConfraterniteEnvoyee: !r.lettreConfraterniteEnvoyee })} /></FieldRow>
      <FieldRow label="Lettre de confraternité reçue"><ToggleBtn on={!!r.lettreConfraterniteRecue} onClick={() => patch({ lettreConfraterniteRecue: !r.lettreConfraterniteRecue })} /></FieldRow>

      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>Situation financière</h4>
      <FieldRow label="Honoraires">
        <SelectPill value={r.honorairesSituation} options={["soldes", "restant_du"]} labels={{ soldes: "Soldés", restant_du: "Restant dû" }} onChange={(v) => patch({ honorairesSituation: v })} />
      </FieldRow>
      <FieldRow label="Dernière clôture traitée">
        <input type="date" value={r.derniereCloture || ""} onChange={(e) => patch({ derniereCloture: e.target.value })}
          style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} />
      </FieldRow>

      {!r.active && (
        <button onClick={activer} style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, background: T.red, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <AlertTriangle size={14} /> Confirmer la résiliation
        </button>
      )}

      {(r.historique || []).length > 0 && (
        <>
          <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>Historique</h4>
          {r.historique.map((h, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.inkMuted, padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>
              {fmtFR(h.date)} — {h.motif} · par {h.par}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export { ResiliationTab };
