import { Mail, CheckCircle2, XCircle } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER, QUARTER_END_MONTHS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { InfoHint } from "./InfoHint.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { TvaCorrectionPanel } from "./TvaCorrectionPanel.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const thStyle = {
  textAlign: "left",
  padding: "9px 8px",
  borderBottom: `1px solid ${T.line}`,
  color: T.inkMuted,
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
  background: T.paper,
};
const tdStyle = {
  padding: "8px",
  borderBottom: `1px solid ${T.line}`,
  verticalAlign: "middle",
};

const { useState, useMemo } = React;



/* ============================================================
   TVA GRID VIEW
   ============================================================ */
function TvaGrid({ clients, search, roleFilter, setRoleFilter, me, onCycle, onReview, onUpdate, onOpenClient, onGenerateMail }) {
  const [collabFilter, setCollabFilter] = useState("Tous");
  const [regimeHeaderFilter, setRegimeHeaderFilter] = useState("Tous");
  const [exigHeaderFilter, setExigHeaderFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("nom"); // nom | retards
  // Cellule pour laquelle le petit menu "Contrôlé et validé / Contrôlé non validé" est ouvert
  const [reviewCell, setReviewCell] = useState(null); // { clientId, mois }
  // Panneau de saisie des éléments à modifier, ouvert quand on choisit "Contrôlé non validé"
  // (ou quand on rouvre une cellule déjà marquée "Non validé" pour consulter/modifier la remarque)
  const [correctionPanel, setCorrectionPanel] = useState(null); // { client, mois, initial }

  // La vue TVA doit rester robuste même pendant le chargement des dossiers.
  // On normalise systématiquement la source avant les filtres pour éviter qu'un
  // dossier incomplet ne fasse planter toute l'application à l'ouverture de l'onglet.
  const safeClients = Array.isArray(clients) ? clients.filter(Boolean) : [];
  const baseFiltered = useMemo(() =>
    filterClients(safeClients, search || "", roleFilter, me).filter((c) => !!c?.tvaRegime),
    [safeClients, search, roleFilter, me]
  );
  const collabOptions = useMemo(() =>
    Array.from(new Set(safeClients.map((c) => c?.collab).filter(Boolean))).sort(),
    [safeClients]
  );
  const regimeOptions = useMemo(() =>
    ["Tous", ...Array.from(new Set(baseFiltered.map((c) => c?.tvaRegime).filter(Boolean))).sort()],
    [baseFiltered]
  );
  const exigOptions = useMemo(() => {
    const values = baseFiltered
      .map((c) => c?.tvaExig)
      .filter((v) => v !== "" && v != null && Number.isFinite(Number(v)))
      .map((v) => Number(v));
    return ["Tous", ...Array.from(new Set(values)).sort((a, b) => a - b).map(String)];
  }, [baseFiltered]);
  const countRetards = (c) => MOIS_ORDER.filter((m) => effectiveTvaStatus(c, m) === "RETARD").length;
  const filtered = useMemo(() => {
    let out = collabFilter === "Tous" ? baseFiltered : baseFiltered.filter((c) => c?.collab === collabFilter);
    if (regimeHeaderFilter !== "Tous") out = out.filter((c) => c?.tvaRegime === regimeHeaderFilter);
    if (exigHeaderFilter !== "Tous") out = out.filter((c) => String(c?.tvaExig ?? "") === String(exigHeaderFilter));
    out = [...out].sort((a, b) => sortBy === "retards"
      ? countRetards(b) - countRetards(a)
      : String(a?.nom || "").localeCompare(String(b?.nom || ""))
    );
    return out;
  }, [baseFiltered, collabFilter, regimeHeaderFilter, exigHeaderFilter, sortBy]);
  return (
    <div>
      <Reveal><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div><h1 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 5px" }}>Échéances TVA</h1><div style={{fontSize:10.5,color:T.inkMuted}}>Suivez, préparez et contrôlez les déclarations sans perdre la vue d’ensemble.</div></div><div style={{padding:"8px 11px",borderRadius:10,background:T.navySoft,fontSize:11,fontWeight:800,color:T.navy}}>{safeClients.length} dossiers suivis</div></div></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 11, marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
        <InfoHint summary={<>Cliquez une cellule pour faire évoluer son statut.</>}>
          Cliquez une cellule vide pour la passer à <Stamped tone="amber" small>Fait</Stamped> — cela notifie le chef de mission que le dossier est prêt à être contrôlé.
          {" "}Cliquez ensuite sur <Stamped tone="amber" small>Fait</Stamped> pour choisir <Stamped tone="blue" small>Contrôlé et validé</Stamped> (le collaborateur est notifié qu'il peut déclarer) ou <Stamped tone="purple" small>Contrôlé non validé</Stamped> (des éléments sont à modifier avant la déclaration — un panneau s'ouvre pour préciser quoi).
          {" "}Une fois <Stamped tone="blue" small>Contrôlé et validé</Stamped>, le collaborateur clique la cellule dès que la déclaration est faite : elle passe alors à <Stamped tone="green" small>Validé</Stamped>. Cliquez une cellule <Stamped tone="purple" small>Non validé</Stamped> pour revoir la remarque. Date limite dépassée sans saisie → <Stamped tone="red" small>Retard</Stamped> automatique.
          {" "}CA3 : déclaration du mois M exigible en M+1. CA12 : une seule déclaration, en Mai N+1.
        </InfoHint>
      </p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <select value={collabFilter} onChange={(e) => setCollabFilter(e.target.value)} className="input-field !py-1.5 !w-auto text-xs" title="Filtrer par collaborateur">
          <option value="Tous">Collaborateur : Tous</option>
          {collabOptions.map((c) => <option key={c} value={c}>Collaborateur : {c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field !py-1.5 !w-auto text-xs" title="Trier">
          <option value="nom">Trier : Nom (A→Z)</option>
          <option value="retards">Trier : Nb de retards (décroissant)</option>
        </select>
      </div>
      <div className="scrollbar" style={{ overflowX: "auto", background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: T.shadowSm }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5 }}>
          <thead><tr>
            <th style={thStyle}>Dossier</th>
            <th style={thStyle}>
              <select value={regimeHeaderFilter} onChange={(e) => setRegimeHeaderFilter(e.target.value)} title="Filtrer par régime TVA"
                style={{ border: "none", background: "transparent", font: "inherit", color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 9.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                {regimeOptions.map((r) => <option key={r} value={r}>{r === "Tous" ? "Régime" : r}</option>)}
              </select>
            </th>
            <th style={{ ...thStyle, textAlign: "center" }}>
              <select value={exigHeaderFilter} onChange={(e) => setExigHeaderFilter(e.target.value)} title="Filtrer par jour d'exigibilité"
                style={{ border: "none", background: "transparent", font: "inherit", color: T.inkMuted, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 9.5, fontWeight: 600, cursor: "pointer", padding: 0, textAlign: "center" }}>
                {exigOptions.map((d) => <option key={d} value={d}>{d === "Tous" ? "Exig." : `Exig. ${d}`}</option>)}
              </select>
            </th>
            {MOIS_ORDER.map((m) => <th key={m} style={{ ...thStyle, textAlign: "center" }}>{m}</th>)}
            <th style={{ ...thStyle, textAlign: "center" }}>Mail</th>
          </tr></thead>
          <tbody>
{filtered.map((c, rowIndex) => {
  const isCa12 = c.tvaRegime === "CA12";
  const isCa3Trim = c.tvaRegime === "CA3" && c.tvaPeriodicite === "trimestrielle";
  // Les dernières lignes du tableau n'ont pas assez de place en dessous pour
  // afficher le petit menu de contrôle : on l'ouvre alors vers le haut plutôt
  // que vers le bas, pour qu'il reste toujours entièrement visible/cliquable.
  const openUpward = rowIndex >= filtered.length - 3;
  return (
              <tr key={c.id} className="hoverRow">
                <td className={onOpenClient ? "clickable" : undefined} onClick={() => onOpenClient && onOpenClient(c.id)}
                  style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap", color: onOpenClient ? T.navy : T.ink }}>{c.nom}</td>
                <td style={{ ...tdStyle, fontFamily: T.mono, color: T.inkMuted }}>
                  {c.tvaRegime}{isCa3Trim && <span style={{ marginLeft: 4, fontSize: 9.5, color: T.navy, background: T.navySoft, padding: "1px 5px", borderRadius: 999 }}>Trim.</span>}
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <input type="number" min="1" max="31" defaultValue={c.tvaExig || ""} placeholder="—"
                    onBlur={(e) => onUpdate(c.id, { tvaExig: e.target.value ? parseInt(e.target.value, 10) : "" })}
                    style={{ width: 42, textAlign: "center", fontFamily: T.mono, fontSize: 12, padding: "4px 2px", borderRadius: 5, border: `1px solid ${T.line}`, background: T.paper }} />
                </td>
                {MOIS_ORDER.map((m) => {
                  if (isCa12 && m !== "Mai") {
                    return <td key={m} style={{ ...tdStyle, textAlign: "center", color: T.inkMuted, opacity: 0.45 }}>—</td>;
                  }
                  if (isCa3Trim && !QUARTER_END_MONTHS.includes(m)) {
                    return <td key={m} style={{ ...tdStyle, textAlign: "center", color: T.inkMuted, opacity: 0.45 }}>—</td>;
                  }
                  const manual = (c.tvaMois?.[m] || "").toUpperCase(); const display = effectiveTvaStatus(c, m); const tone = tvaTone(display);
                  const note = c.tvaControle?.[m]?.commentaire || "";
                  const isReviewOpen = reviewCell && reviewCell.clientId === c.id && reviewCell.mois === m;
                  return (
                    <td key={m} style={{ ...tdStyle, textAlign: "center", position: "relative" }}>
                      <button
                        className="clickable"
                        title={manual === "NON_VALIDE" && note ? note : manual === "CONTROLE" ? "Déclaration faite ? Cliquez pour valider." : undefined}
                        onClick={() => {
                          if (manual === "") { onCycle(c.id, m, "FAIT"); return; }
                          if (manual === "FAIT") { setReviewCell({ clientId: c.id, mois: m }); return; }
                          if (manual === "CONTROLE") { onCycle(c.id, m, "OK"); return; }
                          if (manual === "OK") { onCycle(c.id, m, "NA"); return; }
                          if (manual === "NON_VALIDE") { setCorrectionPanel({ client: c, mois: m, initial: note }); return; }
                          onCycle(c.id, m, ""); // NA -> vide
                        }}
                        style={{ background: "none", border: "none", padding: 0 }}
                      >
                        <Stamped tone={tone} small>{tvaStatusLabel(display)}</Stamped>
                      </button>
                      {isReviewOpen && (
                        <>
                          <div onClick={() => setReviewCell(null)} style={{ position: "fixed", inset: 0, zIndex: 45 }} />
                          <div onClick={(e) => e.stopPropagation()} style={{
  position: "absolute", left: "50%", transform: "translateX(-50%)",
  ...(openUpward ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 }),
  zIndex: 46, width: 210, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 10,
  boxShadow: "0 14px 32px rgba(15,23,42,0.2)", padding: 6, display: "flex", flexDirection: "column", gap: 3,
}}>
                            <div style={{ fontSize: 9.5, color: T.inkMuted, padding: "3px 6px", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              Contrôle {c.nom} — {m}
                            </div>
                            <button
                              onClick={() => { onReview(c.id, m, "CONTROLE"); setReviewCell(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 7, textAlign: "left", fontSize: 12, fontWeight: 600, color: T.ink, background: "none", border: "none", borderRadius: 7, padding: "7px 8px", cursor: "pointer" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = T.greenSoft}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                            >
                              <CheckCircle2 size={14} color={T.green} /> Contrôlé et validé
                            </button>
                            <button
                              onClick={() => { setCorrectionPanel({ client: c, mois: m, initial: "" }); setReviewCell(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 7, textAlign: "left", fontSize: 12, fontWeight: 600, color: T.ink, background: "none", border: "none", borderRadius: 7, padding: "7px 8px", cursor: "pointer" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#EDE9FE"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                            >
                              <XCircle size={14} color="#6D28D9" /> Contrôlé non validé
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  );
                })}
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button onClick={(e) => { e.stopPropagation(); onGenerateMail?.(c.id); }} title="Générer le mail de TVA" style={{ display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${T.line}`, background: T.card, color: T.navy, borderRadius: 8, padding: "5px 7px", cursor: "pointer", fontSize: 10.5, fontWeight: 700 }}>
                    <Mail size={12} /> Générer
                  </button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyNote text="Aucun dossier soumis à la TVA dans cette sélection." />}
      </div>
      {correctionPanel && (
        <TvaCorrectionPanel
          client={correctionPanel.client}
          mois={correctionPanel.mois}
          initial={correctionPanel.initial}
          onClose={() => setCorrectionPanel(null)}
          onSave={(commentaire) => { onReview(correctionPanel.client.id, correctionPanel.mois, "NON_VALIDE", commentaire); setCorrectionPanel(null); }}
          onMarkFixed={() => { onCycle(correctionPanel.client.id, correctionPanel.mois, "FAIT"); setCorrectionPanel(null); }}
        />
      )}
    </div>
  );
}

export { TvaGrid };
