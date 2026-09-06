import React from "react";
import { Send, Clock3, CheckCircle2, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { Shared } from "./shared.js";
import { createAdministrationRequest, ADMIN_REQUEST_TYPES, ADMIN_REQUEST_PRIORITIES, ADMIN_REQUEST_STATUS, administrationRequestLabel } from "../services/administrationWorkflow.js";

const { T } = Shared;

const REQUEST_OPTIONS = [
  [ADMIN_REQUEST_TYPES.ADMIN_BLOCKER, "Blocage administratif"],
  [ADMIN_REQUEST_TYPES.LETTER_REQUEST, "Lettre / document"],
  [ADMIN_REQUEST_TYPES.MISSING_DOCUMENT, "Document manquant"],
  [ADMIN_REQUEST_TYPES.EXCEPTIONAL_MISSION, "Mission exceptionnelle"],
  [ADMIN_REQUEST_TYPES.RESILIATION, "Résiliation"],
  [ADMIN_REQUEST_TYPES.MISSION_ENTRY, "Entrée de mission"],
  [ADMIN_REQUEST_TYPES.MISSION_EXIT, "Sortie de mission"],
  [ADMIN_REQUEST_TYPES.OTHER, "Autre demande"],
];

function StatusBadge({ status }) {
  const map = {
    a_traiter: ["À traiter", T.amberSoft, T.amber],
    en_cours: ["En cours", T.navySoft, T.navy],
    en_attente: ["En attente", T.paperDeep, T.inkMuted],
    termine: ["Terminée", T.greenSoft, T.green],
  };
  const [label, bg, color] = map[status] || [status, T.paperDeep, T.inkMuted];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 999, background: bg, color, fontSize: 10.5, fontWeight: 750 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />{label}</span>;
}

export function AdministrationRequestsView({ requests = [], clients = [], portefeuilleId, onOpenClient, onCreate }) {
  const [type, setType] = React.useState(ADMIN_REQUEST_TYPES.ADMIN_BLOCKER);
  const [priority, setPriority] = React.useState(ADMIN_REQUEST_PRIORITIES.NORMAL);
  const [clientId, setClientId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");

  const ownRequests = requests;
  const openCount = ownRequests.filter((r) => r.status !== ADMIN_REQUEST_STATUS.DONE).length;

  const submit = async (event) => {
    event.preventDefault();
    if (!portefeuilleId || !description.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      await (onCreate || createAdministrationRequest)({
        portefeuilleId,
        clientId: clientId || null,
        type,
        priority,
        description: description.trim(),
        metadata: { source: "espace_operational", requested_from: "centre_demandes" },
      });
      setDescription("");
      setClientId("");
      setType(ADMIN_REQUEST_TYPES.ADMIN_BLOCKER);
      setPriority(ADMIN_REQUEST_PRIORITIES.NORMAL);
      setNotice("Demande transmise à l’administration.");
    } catch (error) {
      setNotice(error?.message || "Impossible de transmettre la demande.");
    } finally {
      setBusy(false);
    }
  };

  return <div style={{ maxWidth: 1080, margin: "0 auto" }}>
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: T.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Centre de demandes</div>
      <h1 style={{ margin: "4px 0 5px", fontFamily: T.serif, fontSize: 25, color: T.ink }}>Demander une intervention à l’administration</h1>
      <p style={{ margin: 0, fontSize: 12.5, color: T.inkMuted, maxWidth: 720 }}>Un espace simple pour transmettre un besoin à la Direction sans quitter l’espace opérationnel. La demande reste suivie ici jusqu’à sa clôture.</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, .85fr)", gap: 16, alignItems: "start" }}>
      <form onSubmit={submit} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 18, boxShadow: T.shadowSm }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: T.amberSoft, color: T.amber }}><Send size={16} /></span>
          <div><div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Nouvelle demande</div><div style={{ fontSize: 10.5, color: T.inkMuted }}>Elle sera visible immédiatement par l’administration.</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 10.5, color: T.inkMuted, fontWeight: 700 }}>Type
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 9, padding: "9px 10px", background: T.paper, color: T.ink, fontSize: 11.5 }}>
              {REQUEST_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 10.5, color: T.inkMuted, fontWeight: 700 }}>Priorité
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 9, padding: "9px 10px", background: T.paper, color: T.ink, fontSize: 11.5 }}>
              <option value="normal">Normale</option><option value="haute">Haute</option><option value="urgente">Urgente</option>
            </select>
          </label>
        </div>
        <label style={{ display: "grid", gap: 5, marginTop: 10, fontSize: 10.5, color: T.inkMuted, fontWeight: 700 }}>Dossier concerné <span style={{ fontWeight: 500 }}>(facultatif)</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 9, padding: "9px 10px", background: T.paper, color: T.ink, fontSize: 11.5 }}>
            <option value="">Aucun dossier précis</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.nom}{client.siren ? ` · ${client.siren}` : ""}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 5, marginTop: 10, fontSize: 10.5, color: T.inkMuted, fontWeight: 700 }}>Message
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} placeholder="Décrivez clairement ce que vous attendez de l’administration…" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.line}`, borderRadius: 9, padding: "10px", background: T.paper, color: T.ink, fontSize: 11.5, resize: "vertical" }} />
        </label>
        {notice && <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 9, background: notice.startsWith("Demande") ? T.greenSoft : T.redSoft, color: notice.startsWith("Demande") ? T.green : T.red, fontSize: 11, fontWeight: 650 }}>{notice}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><button type="submit" disabled={busy || !description.trim() || !portefeuilleId} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", borderRadius: 9, padding: "9px 14px", background: busy ? T.inkMuted : T.navy, color: "#fff", fontSize: 11.5, fontWeight: 750, cursor: busy ? "wait" : "pointer" }}><Send size={14} />{busy ? "Transmission…" : "Transmettre à l’administration"}</button></div>
      </form>

      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, boxShadow: T.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}><div><div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Mes demandes</div><div style={{ fontSize: 10.5, color: T.inkMuted }}>Suivi des demandes que vous avez transmises.</div></div><span style={{ padding: "5px 8px", borderRadius: 999, background: openCount ? T.amberSoft : T.greenSoft, color: openCount ? T.amber : T.green, fontSize: 10.5, fontWeight: 800 }}>{openCount} ouverte{openCount > 1 ? "s" : ""}</span></div>
        {!ownRequests.length ? <div style={{ padding: "28px 12px", textAlign: "center", border: `1px dashed ${T.line}`, borderRadius: 12, color: T.inkMuted, fontSize: 11.5 }}>Aucune demande pour le moment.</div> : <div style={{ display: "grid", gap: 9 }}>
          {ownRequests.slice(0, 12).map((request) => {
            const client = clients.find((c) => String(c.id) === String(request.client_id));
            return <div key={request.id} style={{ border: `1px solid ${T.line}`, borderRadius: 11, padding: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 11.5, fontWeight: 800, color: T.ink }}>{request.title || administrationRequestLabel(request.type)}</div><div style={{ fontSize: 10, color: T.inkMuted, marginTop: 3 }}>{client?.nom || "Cabinet"} · {new Date(request.created_at).toLocaleDateString("fr-FR")}</div></div><StatusBadge status={request.status} /></div>
              <div style={{ marginTop: 7, fontSize: 10.8, lineHeight: 1.5, color: T.inksoft }}>{request.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 8 }}><span style={{ fontSize: 9.5, color: request.priority === "urgente" ? T.red : T.inkMuted, fontWeight: 750 }}>{request.priority === "urgente" ? "Urgente" : request.priority === "haute" ? "Priorité haute" : "Priorité normale"}</span>{client && onOpenClient && <button type="button" onClick={() => onOpenClient(client.id)} style={{ border: "none", background: "transparent", color: T.navy, fontSize: 10, fontWeight: 750, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>Ouvrir le dossier <ExternalLink size={11}/></button>}</div>
            </div>;
          })}
        </div>}
      </div>
    </div>
  </div>;
}
