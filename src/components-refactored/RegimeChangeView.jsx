import { RefreshCw, History } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, REGIMES_TVA } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, todayISO, fmtFR } = Shared;

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
   CHANGEMENTS DE RÉGIME TVA
   ============================================================ */
function RegimeChangeView({ clients, me, search, onUpdate }) {
  const sorted = useMemo(() => [...clients].sort((a, b) => a.nom.localeCompare(b.nom)), [clients]);
  const [clientId, setClientId] = useState(sorted[0]?.id || "");
  const [nouveau, setNouveau] = useState("CA3");
  const [dateChangement, setDateChangement] = useState(todayISO());
  const [motif, setMotif] = useState("Dépassement de seuil de chiffre d'affaires");
  const [motifAutre, setMotifAutre] = useState("");

  const filteredList = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter((c) => c.nom.toLowerCase().includes(q));
  }, [sorted, search]);

  const client = clients.find((c) => c.id === clientId);

  const submit = () => {
    if (!client) return;
    const finalMotif = motif === "Autre" ? (motifAutre.trim() || "Autre") : motif;
    const entry = { date: dateChangement || todayISO(), ancien: client.tvaRegime || "—", nouveau, motif: finalMotif, par: me };
    onUpdate(client.id, { tvaRegime: nouveau, regimeHistory: [...(client.regimeHistory || []), entry] });
    setMotifAutre("");
  };

  const allHistory = useMemo(() => {
    const rows = [];
    clients.forEach((c) => (c.regimeHistory || []).forEach((h) => rows.push({ ...h, client: c.nom })));
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [clients]);

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Changements de régime TVA</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Enregistrez un passage réel normal / réel simplifié / franchise, avec traçabilité complète.</p>

      <Panel title="Enregistrer un changement">
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
            {filteredList.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.inkMuted, padding: "0 4px" }}>
            Régime actuel : <Stamped tone="neutral" small>{client?.tvaRegime || "—"}</Stamped>
          </div>
          <select value={nouveau} onChange={(e) => setNouveau(e.target.value)} style={inputStyle}>{REGIMES_TVA.map((r) => <option key={r} value={r}>Nouveau : {r}</option>)}</select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Date du changement</div>
            <input type="date" value={dateChangement} onChange={(e) => setDateChangement(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Motif</div>
            <select value={motif} onChange={(e) => setMotif(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option>Dépassement de seuil de chiffre d'affaires</option><option>Option du client</option>
              <option>Création / reprise de dossier</option><option>Régularisation administrative</option><option>Autre</option>
            </select>
          </div>
        </div>
        {motif === "Autre" && <input placeholder="Précisez le motif" value={motifAutre} onChange={(e) => setMotifAutre(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 14 }} />}
        <button onClick={submit} disabled={!client} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} /> Enregistrer le changement
        </button>
      </Panel>

      <div style={{ height: 16 }} />
      <Panel title={`Historique des changements (${allHistory.length})`} right={<History size={16} color={T.inkMuted} />}>
        {allHistory.length === 0 ? <EmptyNote text="Aucun changement de régime enregistré pour l'instant." /> : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.9fr 1.6fr 0.9fr 0.9fr", padding: "6px 4px", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: T.inkMuted, fontWeight: 600, borderBottom: `1px solid ${T.line}` }}>
              <div>Dossier</div><div>Ancien</div><div>Nouveau</div><div>Motif</div><div>Date</div><div>Par</div>
            </div>
            {allHistory.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.9fr 1.6fr 0.9fr 0.9fr", padding: "9px 4px", fontSize: 12.5, borderBottom: `1px solid ${T.line}`, alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>{h.client}</div>
                <div style={{ fontFamily: T.mono, color: T.inkMuted }}>{h.ancien}</div>
                <div style={{ fontFamily: T.mono, color: T.green, fontWeight: 600 }}>{h.nouveau}</div>
                <div style={{ color: T.inkSoft }}>{h.motif}</div>
                <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.inkMuted }}>{fmtFR(h.date)}</div>
                <div style={{ fontSize: 12 }}>{h.par}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export { RegimeChangeView };
