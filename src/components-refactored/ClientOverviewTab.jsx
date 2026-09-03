import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, FileText, Mail, MessageSquare, Ticket, UserRound } from "lucide-react";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, supabase, ACTIVITY_TYPE_LABELS } = Shared;

function fmtDate(value) {
  if (!value) return "—";
  try { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value.includes("T") ? value : `${value}T12:00:00`)); } catch { return value; }
}

function ClientOverviewTab({ client, tasks = [], team = [], onOpenTab }) {
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    let cancelled = false;
    supabase.from("activity_log").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(80).then(({ data, error }) => {
      if (!cancelled) setActivities(error ? [] : (data || []));
    });
    return () => { cancelled = true; };
  }, [client.id]);

  const meetings = Array.isArray(client.reunions) ? client.reunions : [];
  const clientTasks = tasks.filter((t) => String(t.client_id) === String(client.id) && String(t.statut || "").toLowerCase() !== "archive");
  const openTasks = clientTasks.filter((t) => String(t.statut || "").toLowerCase() !== "termine");
  const explicitAccess = Array.isArray(client.accesDossier) ? client.accesDossier.length : 0;

  const timeline = useMemo(() => {
    const meetingEvents = meetings.map((m) => ({ id: `meeting-${m.id}`, date: m.createdAt || m.date, type: "meeting", title: m.objet || "Rendez-vous", text: `Compte-rendu du ${fmtDate(m.date)}`, icon: CalendarDays }));
    const taskEvents = clientTasks.slice(0, 20).map((t) => ({ id: `task-${t.id}`, date: t.updated_at || t.created_at || t.date_echeance, type: "task", title: t.nom, text: t.statut === "termine" ? `Terminée${t.date_realisation ? ` le ${fmtDate(t.date_realisation)}` : ""}` : (t.date_echeance ? `Échéance ${fmtDate(t.date_echeance)}` : "À traiter"), icon: t.statut === "termine" ? CheckCircle2 : Ticket }));
    const activityEvents = activities.map((a) => ({ id: `activity-${a.id}`, date: a.created_at, type: a.type || "note", title: a.message, text: `${ACTIVITY_TYPE_LABELS[a.type] || a.type || "Activité"} · ${team.find((t) => String(t.id) === String(a.auteur_id))?.nom || "Utilisateur"}`, icon: a.type === "document" ? FileText : a.type === "tache" ? Ticket : MessageSquare }));
    return [...meetingEvents, ...taskEvents, ...activityEvents].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 60);
  }, [meetings, clientTasks, activities, team]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid md:grid-cols-4 gap-3">
        {[["Actions en cours", openTasks.length, Clock3], ["Rendez-vous", meetings.length, CalendarDays], ["Activités récentes", activities.length, MessageSquare], ["Accès personnalisés", explicitAccess, UserRound]].map(([label, value, Icon]) => (
          <div key={label} className="card p-4"><Icon size={15} style={{ color: T.navy, marginBottom: 7 }} /><div style={{ fontSize: 18, fontWeight: 850, color: T.ink }}>{value}</div><div style={{ fontSize: 10.5, color: T.inkMuted }}>{label}</div></div>
        ))}
      </div>
      <Panel title="Fil de vie du dossier">
        <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 12 }}>Réunions, actions, documents et événements sont regroupés ici pour retrouver rapidement ce qui s'est passé sur le dossier.</div>
        {timeline.length === 0 ? <EmptyNote text="Aucune activité enregistrée pour ce dossier pour l'instant." /> : (
          <div style={{ position: "relative", marginLeft: 7 }}>
            <div style={{ position: "absolute", left: 6, top: 4, bottom: 4, width: 1, background: T.line }} />
            {timeline.map((event) => { const Icon = event.icon; return <div key={event.id} style={{ position: "relative", display: "flex", gap: 12, padding: "0 0 14px 0" }}>
              <div style={{ zIndex: 1, width: 14, height: 14, borderRadius: "50%", background: T.card, border: `2px solid ${T.navy}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, marginTop: -2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div style={{ fontSize: 11.5, fontWeight: 750, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}><Icon size={13} style={{ color: T.navy }} /> {event.title}</div><span style={{ fontSize: 10, color: T.inkMuted, fontFamily: T.mono }}>{fmtDate(event.date)}</span></div>
                <div style={{ fontSize: 10.5, color: T.inkMuted, marginTop: 3 }}>{event.text}</div>
              </div>
            </div>; })}
          </div>
        )}
      </Panel>
      <Panel title="Actions à suivre">
        {openTasks.length === 0 ? <EmptyNote text="Aucune action en cours sur ce dossier." /> : openTasks.slice(0, 8).map((t) => <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 2px", borderBottom: `1px solid ${T.line}` }}><Ticket size={14} style={{ color: T.navy }} /><div style={{ flex: 1 }}><div style={{ fontSize: 11.5, fontWeight: 700, color: T.ink }}>{t.nom}</div><div style={{ fontSize: 10, color: T.inkMuted }}>{t.date_echeance ? `Échéance ${fmtDate(t.date_echeance)}` : "Sans échéance"}{t.responsable_id ? ` · ${team.find((m) => String(m.id) === String(t.responsable_id))?.nom || "Responsable"}` : ""}</div></div></div>)}
      </Panel>
    </div>
  );
}

export { ClientOverviewTab };
