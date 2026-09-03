import React from "react";
import { Users, BriefcaseBusiness, UserCheck, UserPlus, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { Shared } from "./shared.js";

const { T, displayCabinetName, assignDossiersToCollaboratorRemote, removeDossiersFromCollaboratorRemote } = Shared;
const { useMemo, useState } = React;

function AdminCollaborators({ clients = [], team = [], portefeuilles = [], onRefreshClients, showNotice }) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedPortefeuilleId, setSelectedPortefeuilleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState("modification");

  const collaborators = useMemo(
    () => (team || []).filter((m) =>
      m.statut !== "inactif" &&
      m.role !== "super_admin" &&
      ["collaborateur", "expert", "chef_mission", "gestionnaire_paie", "admin"].includes(m.role)
    ),
    [team]
  );

  const selectedMember = collaborators.find((m) => String(m.id) === String(selectedTeamId));
  const selectedPortefeuille = (portefeuilles || []).find((p) => String(p.id) === String(selectedPortefeuilleId));

  const dossierList = useMemo(() => {
    if (!selectedPortefeuilleId) return [];
    return (clients || []).filter((c) => String(c.portefeuilleId || c.portefeuille_id || "") === String(selectedPortefeuilleId));
  }, [clients, selectedPortefeuilleId]);

  const assignedCount = useMemo(() => {
    if (!selectedTeamId) return 0;
    return dossierList.filter((c) =>
      Array.isArray(c.accesDossier) &&
      c.accesDossier.some((a) => String(a.teamId) === String(selectedTeamId))
    ).length;
  }, [dossierList, selectedTeamId]);

  const run = async (action) => {
    if (!selectedTeamId || !selectedPortefeuilleId) {
      showNotice?.("Sélectionnez un collaborateur et un portefeuille.", "warning");
      return;
    }
    setBusy(true);
    try {
      const result = await action(selectedPortefeuilleId, selectedTeamId);
      if (result?.error) throw result.error;
      showNotice?.(
        `${result.count} dossier(s) ${action === removeDossiersFromCollaboratorRemote ? "retiré(s) de" : "affecté(s) à"} ${selectedMember?.nom || "ce collaborateur"}.`,
        "success"
      );
      await onRefreshClients?.();
    } catch (error) {
      showNotice?.(error?.message || "L'opération a échoué.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>Portefeuilles collaborateurs</div>
        <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 4 }}>
          Le Super Admin peut affecter en une fois les dossiers d’un cabinet à un collaborateur.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Users size={16} color={T.navy} />
            <b style={{ fontSize: 12 }}>Collaborateur</b>
          </div>
          <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}
            style={{ width: "100%", padding: "10px 11px", border: `1px solid ${T.line}`, borderRadius: 9, background: T.card, color: T.ink }}>
            <option value="">Choisir un collaborateur…</option>
            {collaborators.map((m) => (
              <option key={m.id} value={m.id}>{m.nom} — {m.role || "collaborateur"}</option>
            ))}
          </select>
          {selectedMember && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.inkMuted }}>
              <UserCheck size={14} />
              {selectedMember.email || "Email non renseigné"}
            </div>
          )}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <BriefcaseBusiness size={16} color={T.navy} />
            <b style={{ fontSize: 12 }}>Portefeuille / cabinet</b>
          </div>
          <select value={selectedPortefeuilleId} onChange={(e) => setSelectedPortefeuilleId(e.target.value)}
            style={{ width: "100%", padding: "10px 11px", border: `1px solid ${T.line}`, borderRadius: 9, background: T.card, color: T.ink }}>
            <option value="">Choisir un portefeuille…</option>
            {(portefeuilles || []).filter((p) => p.statut !== "resilie").map((p) => (
              <option key={p.id} value={p.id}>{displayCabinetName(p.nom)}{p.domaine ? ` — ${p.domaine}` : ""}</option>
            ))}
          </select>
          {selectedPortefeuille && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.inkMuted }}>
              {dossierList.length} dossier(s) dans ce portefeuille · {assignedCount} déjà affecté(s)
            </div>
          )}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Affectation en masse</div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 3 }}>
              Exemple : sélectionner Jacques Martin + AXE-EXPERTS pour lui donner tous les dossiers AXE-EXPERTS.
            </div>
          </div>
          <select value={level} onChange={(e) => setLevel(e.target.value)}
            style={{ padding: "8px 10px", border: `1px solid ${T.line}`, borderRadius: 8, background: T.card, color: T.ink, fontSize: 11 }}>
            <option value="modification">Accès modification</option>
            <option value="lecture">Accès lecture seule</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button disabled={busy || !selectedTeamId || !selectedPortefeuilleId}
            onClick={() => run((p, t) => assignDossiersToCollaboratorRemote(p, t, level))}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 13px", border: "none", borderRadius: 9, background: T.navy, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: busy ? .6 : 1 }}>
            <UserPlus size={14} /> Affecter tous les dossiers
          </button>
          <button disabled={busy || !selectedTeamId || !selectedPortefeuilleId}
            onClick={() => run(removeDossiersFromCollaboratorRemote)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 13px", border: `1px solid ${T.line}`, borderRadius: 9, background: T.card, color: T.red || "#b91c1c", fontWeight: 700, cursor: "pointer", opacity: busy ? .6 : 1 }}>
            <XCircle size={14} /> Retirer tous les accès
          </button>
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: T.ink }}>
            <ShieldCheck size={14} />
            Aperçu des dossiers
          </div>
          {!selectedPortefeuilleId ? (
            <div style={{ padding: 18, fontSize: 11, color: T.inkMuted }}>Choisissez un portefeuille pour afficher ses dossiers.</div>
          ) : !dossierList.length ? (
            <div style={{ padding: 18, fontSize: 11, color: T.inkMuted }}>Aucun dossier dans ce portefeuille.</div>
          ) : (
            <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
              {dossierList.slice(0, 100).map((c) => {
                const access = (c.accesDossier || []).find((a) => String(a.teamId) === String(selectedTeamId));
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", border: `1px solid ${T.line}`, borderRadius: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nom || "Dossier sans nom"}</div>
                      <div style={{ fontSize: 10, color: T.inkMuted }}>{c.siren || c.formeJuridique || "Informations générales"}</div>
                    </div>
                    {access ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: T.green || "#15803d" }}>
                        <CheckCircle2 size={13} /> {access.level === "lecture" ? "Lecture" : "Modification"}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: T.inkMuted }}>Non affecté</span>
                    )}
                  </div>
                );
              })}
              {dossierList.length > 100 && <div style={{ fontSize: 10, color: T.inkMuted, paddingTop: 5 }}>100 premiers dossiers affichés sur {dossierList.length}.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { AdminCollaborators };
