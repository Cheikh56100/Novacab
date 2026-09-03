import { CalendarDays, Check, Mail, Plus, Trash2, X, FileText } from "lucide-react";
import React from "react";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, logActivity } = Shared;
const { useMemo, useState } = React;

const blankAction = () => ({ id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, texte: "", responsableId: "", echeance: "" });
const blankMeeting = () => ({ id: `meeting-${Date.now()}`, date: new Date().toISOString().slice(0, 10), objet: "", participants: "", points: "", decisions: "", actions: "", actionItems: [blankAction()], prochaineEcheance: "" });

function formatDate(value) {
  if (!value) return "Date non renseignée";
  try { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`)); } catch { return value; }
}

function ClientMeetingsTab({ client, me, meId, portefeuilleId, team = [], onUpdate, onCreateTask }) {
  const [form, setForm] = useState(blankMeeting);
  const [showForm, setShowForm] = useState(false);
  const meetings = useMemo(() => [...(client.reunions || [])].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))), [client.reunions]);
  const contact = client.contact || {};
  const members = team.filter((t) => t.statut !== "en_attente" && t.role !== "super_admin");
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const updateAction = (id, key, value) => setForm((f) => ({ ...f, actionItems: f.actionItems.map((a) => a.id === id ? { ...a, [key]: value } : a) }));
  const addAction = () => setForm((f) => ({ ...f, actionItems: [...(f.actionItems || []), blankAction()] }));
  const removeAction = (id) => setForm((f) => ({ ...f, actionItems: (f.actionItems || []).filter((a) => a.id !== id) }));

  const addMeeting = async () => {
    if (!form.date || !form.objet.trim()) return;
    const actionItems = (form.actionItems || []).filter((a) => a.texte.trim()).map((a) => ({ ...a, texte: a.texte.trim() }));
    const entry = { ...form, objet: form.objet.trim(), participants: form.participants.trim(), points: form.points.trim(), decisions: form.decisions.trim(), actions: form.actions.trim(), actionItems, prochaineEcheance: form.prochaineEcheance.trim(), auteur: me, auteurId: meId, createdAt: new Date().toISOString() };
    // On enregistre d'abord le compte-rendu dans le dossier : il reste la source métier du rendez-vous.
    onUpdate(client.id, { reunions: [...(client.reunions || []), entry] });
    // Chaque action structurée devient une tâche pilotable dans NOVACAB.
    if (onCreateTask) {
      for (const action of actionItems) {
        await onCreateTask({
          client_id: client.id,
          nom: action.texte,
          statut: "a_faire",
          priorite: "normale",
          date_echeance: action.echeance || null,
          responsable_id: action.responsableId || null,
          commentaire: `Réunion du ${formatDate(entry.date)} — ${entry.objet}`,
          portefeuille_id: portefeuilleId || null,
        });
      }
    }
    logActivity({ clientId: client.id, portefeuilleId, type: "note", message: `Compte-rendu de réunion ajouté — ${entry.objet}`, auteurId: meId });
    setForm(blankMeeting()); setShowForm(false);
  };

  const removeMeeting = (id) => {
    if (!confirm("Supprimer ce compte-rendu de réunion ? Les actions déjà créées restent dans les tâches afin de conserver la traçabilité.")) return;
    onUpdate(client.id, { reunions: (client.reunions || []).filter((r) => r.id !== id) });
    logActivity({ clientId: client.id, portefeuilleId, type: "note", message: "Compte-rendu de réunion supprimé", auteurId: meId });
  };

  const mailMeeting = (meeting) => {
    const recipient = contact.email || "";
    const subject = `Compte-rendu de notre rendez-vous du ${formatDate(meeting.date)} — ${client.nom}`;
    const structuredActions = (meeting.actionItems || []).map((a) => `• ${a.texte}${a.responsableId ? ` — ${team.find((m) => String(m.id) === String(a.responsableId))?.nom || "Responsable"}` : ""}${a.echeance ? ` — échéance ${formatDate(a.echeance)}` : ""}`).join("\n");
    const lines = [
      `Bonjour ${contact.contactNom || "Madame, Monsieur"},`, "",
      `Suite à notre rendez-vous du ${formatDate(meeting.date)}, voici le récapitulatif des points évoqués pour ${client.nom}.`, "",
      meeting.objet ? `Objet du rendez-vous : ${meeting.objet}` : "",
      meeting.participants ? `Participants : ${meeting.participants}` : "",
      meeting.points ? `\nPoints évoqués\n${meeting.points}` : "",
      meeting.decisions ? `\nDécisions / éléments actés\n${meeting.decisions}` : "",
      structuredActions ? `\nActions à réaliser\n${structuredActions}` : (meeting.actions ? `\nActions à réaliser\n${meeting.actions}` : ""),
      meeting.prochaineEcheance ? `\nProchaine échéance\n${meeting.prochaineEcheance}` : "",
      "", "Bien cordialement,", me || "",
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
  };

  const printMeeting = (meeting) => {
    const actions = (meeting.actionItems || []).map((a) => `<li>${escapeHtml(a.texte)}${a.responsableId ? ` — ${escapeHtml(team.find((m) => String(m.id) === String(a.responsableId))?.nom || "Responsable")}` : ""}${a.echeance ? ` — échéance ${escapeHtml(formatDate(a.echeance))}` : ""}</li>`).join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Compte-rendu — ${escapeHtml(client.nom)}</title><style>body{font-family:Arial,sans-serif;color:#17345F;margin:48px;line-height:1.5}h1{font-size:24px;margin-bottom:4px}h2{font-size:14px;margin:24px 0 7px;border-bottom:1px solid #d8e0eb;padding-bottom:5px}p,li{font-size:12px;color:#26364f;white-space:pre-wrap}.meta{font-size:11px;color:#6f819c}ul{padding-left:20px}.footer{margin-top:42px;font-size:10px;color:#6f819c}</style></head><body><div class="meta">NOVACAB · Compte-rendu de réunion</div><h1>${escapeHtml(client.nom)}</h1><div class="meta">${escapeHtml(formatDate(meeting.date))} · ${escapeHtml(meeting.objet || "Rendez-vous")}</div>${section("Participants", meeting.participants)}${section("Points évoqués", meeting.points)}${section("Décisions / éléments actés", meeting.decisions)}${actions ? `<h2>Actions à réaliser</h2><ul>${actions}</ul>` : section("Actions à réaliser", meeting.actions)}${section("Prochaine échéance / prochain point", meeting.prochaineEcheance)}<div class="footer">Compte-rendu saisi dans NOVACAB par ${escapeHtml(meeting.auteur || "—")}.</div><script>window.onload=()=>setTimeout(()=>window.print(),150)</script></body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=800");
    if (!w) { alert("Autorisez les fenêtres pop-up pour exporter le PDF."); return; }
    w.document.write(html); w.document.close();
  };

  return <div>
    <Panel title="Rendez-vous & comptes-rendus">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: T.inkMuted, lineHeight: 1.5 }}>Conservez les points évoqués, décisions et actions. Les actions structurées deviennent automatiquement des tâches du dossier.</div>
        <button type="button" className="btn-primary" onClick={() => { setForm(blankMeeting()); setShowForm((v) => !v); }}><Plus size={14} /> Nouveau rendez-vous</button>
      </div>
      {showForm && <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, background: T.paper, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 180px) 1fr", gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700 }}>Date<input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className="input-field" style={{ width: "100%", marginTop: 5 }} /></label>
          <label style={{ fontSize: 11, fontWeight: 700 }}>Objet / thème du rendez-vous<input value={form.objet} onChange={(e) => update("objet", e.target.value)} placeholder="Ex. Point bilan 2025 / prévisionnel" className="input-field" style={{ width: "100%", marginTop: 5 }} /></label>
          <label style={{ gridColumn: "1 / -1", fontSize: 11, fontWeight: 700 }}>Participants<input value={form.participants} onChange={(e) => update("participants", e.target.value)} placeholder="Client, dirigeant, collaborateur…" className="input-field" style={{ width: "100%", marginTop: 5 }} /></label>
          <label style={{ gridColumn: "1 / -1", fontSize: 11, fontWeight: 700 }}>Points évoqués<textarea rows={4} value={form.points} onChange={(e) => update("points", e.target.value)} placeholder="Les sujets abordés pendant le rendez-vous…" className="input-field" style={{ width: "100%", marginTop: 5, resize: "vertical" }} /></label>
          <label style={{ gridColumn: "1 / -1", fontSize: 11, fontWeight: 700 }}>Décisions / éléments actés<textarea rows={4} value={form.decisions} onChange={(e) => update("decisions", e.target.value)} placeholder="Ce qui a été décidé…" className="input-field" style={{ width: "100%", marginTop: 5, resize: "vertical" }} /></label>
        </div>
        <div style={{ marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 800, color: T.ink }}>Actions à réaliser</div><button type="button" className="btn-secondary" onClick={addAction}><Plus size={13}/> Ajouter une action</button></div>
          {(form.actionItems || []).map((action) => <div key={action.id} style={{ display: "grid", gridTemplateColumns: "1fr 170px 145px 32px", gap: 7, marginBottom: 7, alignItems: "center" }}>
            <input value={action.texte} onChange={(e) => updateAction(action.id, "texte", e.target.value)} placeholder="Action à réaliser" className="input-field" />
            <select value={action.responsableId} onChange={(e) => updateAction(action.id, "responsableId", e.target.value)} className="input-field"><option value="">Responsable…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select>
            <input type="date" value={action.echeance} onChange={(e) => updateAction(action.id, "echeance", e.target.value)} className="input-field" title="Échéance" />
            <button type="button" onClick={() => removeAction(action.id)} className="btn-secondary" title="Supprimer"><X size={13}/></button>
          </div>)}
          <label style={{ display: "block", fontSize: 10.5, color: T.inkMuted, marginTop: 6 }}>Actions libres / notes complémentaires<textarea rows={2} value={form.actions} onChange={(e) => update("actions", e.target.value)} className="input-field" style={{ width: "100%", marginTop: 4, resize: "vertical" }} /></label>
        </div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginTop: 10 }}>Prochaine échéance / prochain point<input value={form.prochaineEcheance} onChange={(e) => update("prochaineEcheance", e.target.value)} placeholder="Ex. 15/09/2026 — transmettre les pièces" className="input-field" style={{ width: "100%", marginTop: 5 }} /></label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button><button type="button" className="btn-primary" disabled={!form.date || !form.objet.trim()} onClick={addMeeting}><Check size={14} /> Enregistrer le compte-rendu</button></div>
      </div>}
      {meetings.length === 0 ? <EmptyNote text="Aucun rendez-vous enregistré pour ce dossier pour l'instant." /> : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{meetings.map((meeting) => {
        const structured = meeting.actionItems || [];
        return <div key={meeting.id} style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: 13, background: T.card }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div style={{ minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 7, color: T.navy, fontSize: 11, fontWeight: 800 }}><CalendarDays size={14} /> {formatDate(meeting.date)}</div><div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: T.ink }}>{meeting.objet}</div>{meeting.participants && <div style={{ marginTop: 3, fontSize: 10.5, color: T.inkMuted }}>Participants : {meeting.participants}</div>}</div><div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}><button type="button" className="btn-secondary" onClick={() => mailMeeting(meeting)}><Mail size={14} /> Récapitulatif</button><button type="button" className="btn-secondary" onClick={() => printMeeting(meeting)}><FileText size={14} /> PDF</button><button type="button" className="btn-secondary" onClick={() => removeMeeting(meeting.id)} title="Supprimer"><Trash2 size={14} /></button></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>{[["Points évoqués", meeting.points], ["Décisions / éléments actés", meeting.decisions], ["Actions complémentaires", meeting.actions], ["Prochaine échéance", meeting.prochaineEcheance]].filter(([,v]) => v).map(([label, value]) => <div key={label} style={{ padding: 10, borderRadius: 10, background: T.paper, border: `1px solid ${T.line}` }}><div style={{ fontSize: 10, color: T.inkMuted, fontWeight: 800, textTransform: "uppercase" }}>{label}</div><div style={{ whiteSpace: "pre-wrap", marginTop: 5, fontSize: 11.5, lineHeight: 1.5, color: T.inkSoft }}>{value}</div></div>)}</div>
          {structured.length > 0 && <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: T.navySoft, border: `1px solid ${T.line}` }}><div style={{ fontSize: 10, color: T.navy, fontWeight: 800, textTransform: "uppercase" }}>Actions issues du rendez-vous</div>{structured.map((a) => <div key={a.id} style={{ display: "flex", gap: 7, alignItems: "center", paddingTop: 6, fontSize: 11.5, color: T.ink }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: T.navy }} />{a.texte}{a.echeance && <span style={{ color: T.inkMuted }}>· {formatDate(a.echeance)}</span>}</div>)}</div>}
          <div style={{ marginTop: 9, fontSize: 10, color: T.inkMuted }}>Compte-rendu saisi par {meeting.auteur || "—"}</div>
        </div>;
      })}</div>}
    </Panel>
  </div>;
}
function escapeHtml(v) { return String(v || "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }
function section(title, value) { return value ? `<h2>${title}</h2><p>${escapeHtml(value)}</p>` : ""; }
export { ClientMeetingsTab };
