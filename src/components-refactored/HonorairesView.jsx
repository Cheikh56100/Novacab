import { Stamp, RefreshCw, History } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T, logActivity, todayISO, fmtFR } = Shared;

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

const { useState, useMemo } = React;


/* ============================================================
   HONORAIRES — montant courant + historique des changements,
   avec rappel "lettre de mission signée" et lien SharePoint.
   ============================================================ */
function HonorairesView({ clients, search, roleFilter, setRoleFilter, me, meId, portefeuilleId, onUpdate }) {
  const sorted = useMemo(() => [...clients].sort((a, b) => a.nom.localeCompare(b.nom)), [clients]);
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const [clientId, setClientId] = useState(sorted[0]?.id || "");
  const [nouveauMontant, setNouveauMontant] = useState("");
  const [dateChangement, setDateChangement] = useState(todayISO());
  const [motif, setMotif] = useState("Revalorisation annuelle");
  const [motifAutre, setMotifAutre] = useState("");
  const [lettreSignee, setLettreSignee] = useState(false);
  const [sharepointUrl, setSharepointUrl] = useState("");

  const client = clients.find((c) => c.id === clientId);

  const submit = () => {
    if (!client || !nouveauMontant.trim()) return;
    const finalMotif = motif === "Autre" ? (motifAutre.trim() || "Autre") : motif;
    const entry = {
      date: dateChangement || todayISO(), ancien: client.honoraires?.montant || "—", nouveau: nouveauMontant.trim(),
      motif: finalMotif, lettreSignee, sharepointUrl: lettreSignee ? sharepointUrl.trim() : "", par: me,
    };
    onUpdate(client.id, { honoraires: { montant: nouveauMontant.trim(), historique: [...(client.honoraires?.historique || []), entry] } });
    logActivity({ clientId: client.id, portefeuilleId, type: "honoraires", message: `Honoraires : ${entry.ancien} → ${entry.nouveau} (${finalMotif})`, auteurId: meId });
    setNouveauMontant(""); setMotifAutre(""); setLettreSignee(false); setSharepointUrl("");
  };

  const allHistory = useMemo(() => {
    const rows = [];
    clients.forEach((c) => (c.honoraires?.historique || []).forEach((h) => rows.push({ ...h, client: c.nom })));
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [clients]);

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Honoraires</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Montant courant par dossier et historique des changements. Un changement d'honoraires implique de vérifier la lettre de mission.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />

      <Panel title="Enregistrer un changement">
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10, marginBottom: 10 }}>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
            {sorted.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.inkMuted, padding: "0 4px" }}>
            Montant actuel : <strong style={{ color: T.ink }}>{client?.honoraires?.montant || "—"}</strong>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input placeholder="Nouveau montant (ex. 2 400 € HT/an)" value={nouveauMontant} onChange={(e) => setNouveauMontant(e.target.value)} style={inputStyle} />
          <input type="date" value={dateChangement} onChange={(e) => setDateChangement(e.target.value)} style={inputStyle} />
          <select value={motif} onChange={(e) => setMotif(e.target.value)} style={inputStyle}>
            <option>Revalorisation annuelle</option><option>Extension de mission</option>
            <option>Renégociation à la baisse</option><option>Nouveau dossier</option><option>Autre</option>
          </select>
        </div>
        {motif === "Autre" && <input placeholder="Précisez le motif" value={motifAutre} onChange={(e) => setMotifAutre(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 10 }} />}

        <div style={{ background: T.paper, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <FieldRow label={<span style={{ display: "flex", alignItems: "center", gap: 6 }}><Stamp size={14} /> Lettre de mission signée reçue ?</span>}>
            <ToggleBtn on={lettreSignee} onClick={() => setLettreSignee(!lettreSignee)} />
          </FieldRow>
          {lettreSignee && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Lien du document déposé sur SharePoint</div>
              <input placeholder="https://…sharepoint.com/…" value={sharepointUrl} onChange={(e) => setSharepointUrl(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
          )}
        </div>

        <button onClick={submit} disabled={!client || !nouveauMontant.trim()} style={{
          display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: (!client || !nouveauMontant.trim()) ? 0.6 : 1,
        }}>
          <RefreshCw size={14} /> Enregistrer le changement
        </button>
      </Panel>

      <div style={{ height: 16 }} />
      <Panel title={`Historique des changements (${allHistory.length})`} right={<History size={16} color={T.inkMuted} />}>
        {allHistory.length === 0 ? <EmptyNote text="Aucun changement d'honoraires enregistré pour l'instant." /> : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1.2fr 1fr 0.8fr 0.8fr", padding: "6px 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: T.inkMuted, fontWeight: 600, borderBottom: `1px solid ${T.line}` }}>
              <div>Dossier</div><div>Ancien</div><div>Nouveau</div><div>Motif</div><div>Date</div><div>Lettre</div><div>Par</div>
            </div>
            {allHistory.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1.2fr 1fr 0.8fr 0.8fr", padding: "9px 4px", fontSize: 12, borderBottom: `1px solid ${T.line}`, alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{h.client}</div>
                <div style={{ color: T.inkMuted, fontSize: 11.5 }}>{h.ancien}</div>
                <div style={{ color: T.green, fontWeight: 600, fontSize: 11.5 }}>{h.nouveau}</div>
                <div style={{ color: T.inkSoft, fontSize: 11.5 }}>{h.motif}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMuted }}>{fmtFR(h.date)}</div>
                <div>
                  {h.lettreSignee
                    ? (h.sharepointUrl ? <a href={h.sharepointUrl} target="_blank" rel="noreferrer"><Stamped tone="green" small>Signée ↗</Stamped></a> : <Stamped tone="green" small>Signée</Stamped>)
                    : <Stamped tone="amber" small>À signer</Stamped>}
                </div>
                <div style={{ fontSize: 11.5 }}>{h.par}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export { HonorairesView };
