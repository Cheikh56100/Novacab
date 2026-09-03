import { ChevronRight, ChevronLeft } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, sameDay } = Shared;

const navBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: 9,
  border: `1px solid ${T.line}`,
  background: T.card,
  color: T.navy,
  cursor: "pointer",
};



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
   SUIVI FISCAL — calendrier / agenda
   ============================================================ */
function SuiviFiscalView({ clients, team }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [clientFilter, setClientFilter] = useState("Tous");
  const [collabFilter, setCollabFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const allEvents = useMemo(() => computeFiscalEvents(clients), [clients]);
  const collabOptions = useMemo(() => Array.from(new Set(clients.map((c) => c.collab).filter(Boolean))), [clients]);
  const categories = ["TVA", "IS", "CFE", "Bilan", "Clôture", "AGO"];

  const monthEvents = allEvents.filter((e) =>
    e.date.getFullYear() === viewDate.getFullYear() && e.date.getMonth() === viewDate.getMonth() &&
    (clientFilter === "Tous" || e.client.nom === clientFilter) &&
    (collabFilter === "Tous" || e.client.collab === collabFilter) &&
    (categoryFilter === "Toutes" || e.category === categoryFilter)
  ).sort((a, b) => a.date - b.date);

  const byDay = {};
  monthEvents.forEach((e) => { const d = e.date.getDate(); byDay[d] = byDay[d] || []; byDay[d].push(e); });

  const firstWeekday = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Suivi fiscal</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>Calendrier de l'ensemble des échéances fiscales de mes dossiers.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={inputStyle}>
          <option value="Tous">Tous les clients</option>
          {clients.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </select>
        <select value={collabFilter} onChange={(e) => setCollabFilter(e.target.value)} style={inputStyle}>
          <option value="Tous">Tous les collaborateurs</option>
          {collabOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["Toutes", ...categories].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
              padding: "6px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
              border: `1px solid ${categoryFilter === cat ? T.navy : T.line}`, background: categoryFilter === cat ? T.navy : T.card,
              color: categoryFilter === cat ? "#fff" : T.inkSoft, cursor: "pointer",
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setMonthOffset((m) => m - 1)} style={navBtnStyle}><ChevronLeft size={15} /></button>
          <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 13, color: T.navy, textTransform: "capitalize", minWidth: 140, textAlign: "center" }}>{monthLabel}</span>
          <button onClick={() => setMonthOffset((m) => m + 1)} style={navBtnStyle}><ChevronRight size={15} /></button>
          {monthOffset !== 0 && <button onClick={() => setMonthOffset(0)} style={{ ...navBtnStyle, fontSize: 11, width: "auto", padding: "0 10px" }}>Aujourd'hui</button>}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: T.shadowSm, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d} style={{ fontSize: 10.5, color: T.inkMuted, textAlign: "center", fontWeight: 600 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const evts = byDay[day] || [];
            const isToday = sameDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day), now);
            return (
              <div key={i} style={{
                minHeight: 66, border: `1px solid ${isToday ? T.navy : T.line}`, borderRadius: 9, padding: 5,
                background: isToday ? T.amberSoft : T.paper,
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 10.5, color: isToday ? T.amber : T.inkMuted, fontWeight: isToday ? 700 : 500, marginBottom: 3 }}>{day}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {evts.slice(0, 3).map((e) => <div key={e.id} title={`${e.client.nom} — ${e.label}`} style={{ fontSize: 9.5, padding: "1px 4px", borderRadius: 3, background: T.card, color: T.inkSoft, border: `1px solid ${T.line}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.client.nom}</div>)}
                  {evts.length > 3 && <div style={{ fontSize: 9, color: T.inkMuted }}>+{evts.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Panel title={`Échéances du mois (${monthEvents.length})`}>
        {monthEvents.length === 0 ? <EmptyNote text="Aucune échéance sur cette période avec ces filtres." /> : (
          <div>
            {monthEvents.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: `1px solid ${T.line}` }}>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.inkMuted, width: 34 }}>{String(e.date.getDate()).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{e.client.nom}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMuted }}>{e.label} {e.client.collab ? `· ${e.client.collab}` : ""}</div>
                </div>
                <Stamped tone={e.tone} small>{e.category}</Stamped>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export { SuiviFiscalView };
