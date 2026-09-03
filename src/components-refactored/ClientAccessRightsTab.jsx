import React from "react";
import { Check, Shield, UserRound, X } from "lucide-react";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;

function ClientAccessRightsTab({ client, team = [], meRole, meId, onUpdate }) {
  const canManage = ["admin", "expert", "chef_mission"].includes(meRole);
  const current = Array.isArray(client.accesDossier) ? client.accesDossier : [];
  const members = team.filter((t) => t.statut !== "en_attente" && t.role !== "super_admin");
  const hasExplicit = current.length > 0;
  const isSelected = (id) => current.some((a) => String(a.teamId) === String(id));

  const toggle = (member) => {
    if (!canManage) return;
    const next = isSelected(member.id)
      ? current.filter((a) => String(a.teamId) !== String(member.id))
      : [...current, { teamId: member.id, level: "lecture" }];
    onUpdate(client.id, { accesDossier: next });
  };

  const setLevel = (member, level) => {
    if (!canManage) return;
    onUpdate(client.id, { accesDossier: current.map((a) => String(a.teamId) === String(member.id) ? { ...a, level } : a) });
  };

  return (
    <div>
      <Panel title="Droits d'accès du dossier">
        <div style={{ fontSize: 11.5, color: T.inkMuted, lineHeight: 1.55, marginBottom: 14 }}>
          Définissez précisément les collaborateurs autorisés à consulter ou modifier ce dossier. Les dossiers sans règle explicite conservent le fonctionnement actuel basé sur l'affectation métier.
        </div>
        {!canManage && (
          <div style={{ padding: 10, borderRadius: 10, background: T.paper, border: `1px solid ${T.line}`, color: T.inkMuted, fontSize: 11, marginBottom: 12 }}>
            Les droits d'accès sont gérés par un Admin, un Expert ou un Chef de mission.
          </div>
        )}
        {members.length === 0 ? <div style={{ color: T.inkMuted, fontSize: 11.5 }}>Aucun collaborateur disponible.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {members.map((member) => {
              const access = current.find((a) => String(a.teamId) === String(member.id));
              return (
                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", border: `1px solid ${access ? T.navy : T.line}`, borderRadius: 10, background: access ? T.navySoft : T.card }}>
                  <button type="button" disabled={!canManage} onClick={() => toggle(member)} aria-label={access ? "Retirer l'accès" : "Donner l'accès"} style={{ width: 24, height: 24, borderRadius: 7, border: `1px solid ${access ? T.navy : T.line}`, background: access ? T.navy : T.card, color: access ? "#fff" : T.inkMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: canManage ? "pointer" : "default" }}>
                    {access ? <Check size={14} /> : <UserRound size={13} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 750, color: T.ink }}>{member.nom}</div>
                    <div style={{ fontSize: 10.5, color: T.inkMuted }}>{member.role === "chef_mission" ? "Chef de mission" : member.role === "expert" ? "Expert" : member.role === "gestionnaire_paie" ? "Gestionnaire de paie" : "Collaborateur"}</div>
                  </div>
                  {access && canManage && <select value={access.level || "lecture"} onChange={(e) => setLevel(member, e.target.value)} style={{ border: `1px solid ${T.line}`, borderRadius: 8, padding: "6px 8px", background: T.card, color: T.ink, fontSize: 10.5 }}>
                    <option value="lecture">Lecture</option>
                    <option value="modification">Modification</option>
                  </select>}
                  {access && <span title={access.level === "modification" ? "Peut modifier" : "Lecture seule"} style={{ color: T.navy }}><Shield size={14} /></span>}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 14, padding: 10, borderRadius: 10, background: T.paper, border: `1px solid ${T.line}`, fontSize: 10.5, color: T.inkMuted, lineHeight: 1.5 }}>
          {hasExplicit ? <><b style={{ color: T.ink }}>Règle personnalisée active.</b> Seuls les collaborateurs sélectionnés disposent d'un accès au dossier, selon leur niveau.</> : <><b style={{ color: T.ink }}>Mode affectation métier.</b> Tant qu'aucune règle personnalisée n'est définie, l'accès suit le collaborateur, l'expert ou le chef de mission affecté au dossier.</>}
        </div>
      </Panel>
    </div>
  );
}

export { ClientAccessRightsTab };
