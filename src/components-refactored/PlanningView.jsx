import { ChevronRight, ChevronLeft, Download } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, PLANNING_FILTERS, PLANNING_HOURS, PLANNING_SLOT_H, TASK_PRIORITE_TONE } = Core;
import { Reveal } from "./Reveal.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { PlanningTaskCard } from "./PlanningTaskCard.jsx";
import { Shared } from "./shared.js";
const { T, fmtFR, sameDay, startOfWeek } = Shared;

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


const { useState, useMemo, useRef } = React;



function PlanningView({ tasks, clients, me, onUpdate, onOpenClient }) {
  const clickTimeoutRef = useRef(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState("toutes");
  const [dragOverCell, setDragOverCell] = useState(null);

  const weekStart = useMemo(() => { const s = startOfWeek(new Date()); s.setDate(s.getDate() + weekOffset * 7); return s; }, [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const unscheduled = useMemo(() => {
    let list = tasks.filter((t) => t.statut !== "termine" && !t.heure_debut);
    if (filter !== "toutes") list = list.filter((t) => planningBucket(t, weekStart) === filter);
    return list.sort((a, b) => (a.date_echeance || "9999").localeCompare(b.date_echeance || "9999"));
  }, [tasks, filter, weekStart]);

  const scheduled = useMemo(() => tasks.filter((t) => t.statut !== "termine" && t.heure_debut && t.date_echeance), [tasks]);
  const isoOf = (d) => d.toISOString().slice(0, 10);

  const handleDrop = (dayIso, hour) => (e) => {
    e.preventDefault();
    setDragOverCell(null);
    let data;
    try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    if (!data?.id) return;
    onUpdate(data.id, { date_echeance: dayIso, heure_debut: `${String(hour).padStart(2, "0")}:00` });
  };

  const unschedule = (task) => onUpdate(task.id, { heure_debut: null });

  return (
    <div>
      <Reveal>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
          <div>
            <h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: 0 }}>Mon planning</h1>
            <p style={{ color: T.inkMuted, fontSize: 12.5, margin: "4px 0 0" }}>Glissez une tâche sur un créneau pour la planifier, {me}.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setWeekOffset((w) => w - 1)} style={navBtnStyle}><ChevronLeft size={15} /></button>
            <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 12.5, color: T.navy, minWidth: 150, textAlign: "center" }}>
              Semaine du {fmtFR(isoOf(weekStart))}
            </span>
            <button onClick={() => setWeekOffset((w) => w + 1)} style={navBtnStyle}><ChevronRight size={15} /></button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ ...navBtnStyle, width: "auto", padding: "0 10px", fontSize: 11 }}>Aujourd'hui</button>}
            <button onClick={() => exportPlanningToICS(scheduled, clientById)} title="Télécharge un fichier .ics avec toutes les tâches planifiées, à importer dans Outlook"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.line}`, borderRadius: 9, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, color: T.navy, cursor: "pointer" }}>
              <Download size={13} /> Exporter vers Outlook
            </button>
          </div>
        </div>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14, marginTop: 16, alignItems: "start" }}>
        {/* ---------- À planifier ---------- */}
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 12, boxShadow: T.shadowSm }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
            À planifier <span style={{ color: T.inkMuted, fontWeight: 500 }}>({unscheduled.length})</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {PLANNING_FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                fontSize: 10.5, padding: "4px 9px", borderRadius: 999, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${filter === f.id ? T.navy : T.line}`,
                background: filter === f.id ? T.navySoft : T.card, color: filter === f.id ? T.navy : T.inkMuted,
              }}>{f.label}</button>
            ))}
          </div>
          <div className="scrollbar" style={{ maxHeight: 560, overflowY: "auto" }}>
            {unscheduled.length === 0 ? <EmptyNote text="Tout est planifié." /> : unscheduled.map((t) => (
              <PlanningTaskCard key={t.id} task={t} client={clientById[t.client_id]} onOpenClient={onOpenClient} />
            ))}
          </div>
        </div>

        {/* ---------- Grille semaine ---------- */}
        <div className="scrollbar" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: T.radius, overflow: "auto", boxShadow: T.shadowSm }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px repeat(5, minmax(140px, 1fr))", minWidth: 760 }}>
            <div style={{ borderBottom: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}` }} />
            {weekDays.map((d) => {
              const isToday = sameDay(d, new Date());
              return (
                <div key={d.toISOString()} style={{
                  padding: "9px 8px", textAlign: "center", borderBottom: `1px solid ${T.line}`, borderRight: `1px solid ${T.line}`,
                  background: isToday ? T.navySoft : T.paper,
                }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: T.inkMuted, fontWeight: 700 }}>{d.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                  <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 13, color: isToday ? T.navy : T.ink }}>{d.getDate()}</div>
                </div>
              );
            })}

            {PLANNING_HOURS.map((h) => (
              <React.Fragment key={h}>
                <div style={{ fontSize: 10.5, color: T.inkMuted, textAlign: "right", paddingRight: 6, paddingTop: 3, borderRight: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, height: PLANNING_SLOT_H }}>{h}h</div>
                {weekDays.map((d) => {
                  const dayIso = isoOf(d);
                  const cellKey = `${dayIso}-${h}`;
                  const items = scheduled.filter((t) => t.date_echeance === dayIso && parseInt((t.heure_debut || "").slice(0, 2), 10) === h);
                  const isOver = dragOverCell === cellKey;
                  return (
                    <div key={cellKey}
                      onDragOver={(e) => { e.preventDefault(); setDragOverCell(cellKey); }}
                      onDragLeave={() => setDragOverCell((c) => (c === cellKey ? null : c))}
                      onDrop={handleDrop(dayIso, h)}
                      style={{
                        borderRight: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, minHeight: PLANNING_SLOT_H,
                        background: isOver ? T.navySoft : "transparent", padding: 3,
                      }}>
                      {items.map((t) => {
                        const dureeH = Math.max(1, Math.round((t.duree_minutes || 60) / 60));
                        const client = clientById[t.client_id];
                        const tone = TASK_PRIORITE_TONE[t.priorite] || "neutral";
                        const bg = tone === "red" ? T.redSoft : tone === "amber" ? T.amberSoft : T.navySoft;
                        const fg = tone === "red" ? T.red : tone === "amber" ? T.amber : T.navy;
                        return (
                          <div key={t.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ type: "task", id: t.id }))}
                            onClick={() => {
  if (clickTimeoutRef.current) return;
  clickTimeoutRef.current = setTimeout(() => {
    clickTimeoutRef.current = null;
    client && onOpenClient(client.id);
  }, 250);
}}
onDoubleClick={(e) => {
  e.stopPropagation();
  clearTimeout(clickTimeoutRef.current);
  clickTimeoutRef.current = null;
  unschedule(t);
}}
                            title="Double-clic pour déplanifier"
                            style={{
                              background: bg, border: `1px solid ${fg}33`, borderRadius: 7, padding: "4px 6px", cursor: "grab",
                              height: `calc(${dureeH * PLANNING_SLOT_H}px - 6px)`, overflow: "hidden",
                            }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client ? client.nom : t.nom}</div>
                            <div style={{ fontSize: 9.5, color: fg, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.nom}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { PlanningView };
