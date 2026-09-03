import { Plus, Trash2, Pencil, Wallet, ShieldAlert } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T, ROLE_LABELS, displayCabinetName } = Shared;

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



function EquipeView({ team, portefeuilles, clients, myRole, isAdmin, myPortefeuilleId, canManageTeam, onAdd, onRename, onDelete, onUpdateMember, onAddPortefeuille, onArchivePortefeuille, onDeletePortefeuille }) {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("collaborateur");
  const [newPortefeuille, setNewPortefeuille] = useState(myPortefeuilleId || "");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [pfNom, setPfNom] = useState("");
  const [pfDomaine, setPfDomaine] = useState("");
  const [validating, setValidating] = useState(null); // id de la demande en cours de validation
  const [validatePortefeuille, setValidatePortefeuille] = useState("");
  const [validateNewPf, setValidateNewPf] = useState(false);
  const [validateNewPfNom, setValidateNewPfNom] = useState("");
  const [validateNewPfDomaine, setValidateNewPfDomaine] = useState("");
  const [validateRole, setValidateRole] = useState("collaborateur");

  const countFor = (nom) => clients.filter((c) => c.collab === nom || c.expert === nom || c.chefMission === nom).length;
  const portefeuilleName = (id) => displayCabinetName(portefeuilles.find((p) => p.id === id)?.nom || "—");

  const pending = team.filter((t) => t.statut === "en_attente");
  const activeTeam = team.filter((t) => t.statut !== "en_attente");
  // Regroupement par portefeuille (utile surtout pour l'Admin, qui voit tous les cabinets)
  const groups = useMemo(() => {
    const byId = new Map();
    activeTeam.forEach((t) => {
      const key = t.portefeuille_id || "—";
      if (!byId.has(key)) byId.set(key, []);
      byId.get(key).push(t);
    });
    return Array.from(byId.entries());
  }, [activeTeam]);

  const startValidation = (row) => {
    setValidating(row.id);
    setValidatePortefeuille(portefeuilles[0]?.id || "");
    setValidateNewPf(false);
    setValidateNewPfNom(row.cabinet_nom || "");
    setValidateNewPfDomaine("");
    setValidateRole("collaborateur");
  };

  const confirmValidation = async (row) => {
    if (validateNewPf) {
      if (!validateNewPfNom.trim()) return;
      const id = onAddPortefeuille(validateNewPfNom, validateNewPfDomaine);
      if (!id) return;
      const ok = await onUpdateMember(row.id, { portefeuille_id: id, role: validateRole, statut: "actif" });
      if (!ok) return;
    } else {
      if (!validatePortefeuille) return;
      const ok = await onUpdateMember(row.id, { portefeuille_id: validatePortefeuille, role: validateRole, statut: "actif" });
      if (!ok) return;
    }
    setValidating(null);
  };

  return (
    <div>
      <Reveal><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div><h1 style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 800, color: T.ink, margin: "0 0 4px" }}>Équipe</h1><div style={{fontSize:10.5,color:T.inkMuted}}>Personnes, rôles et affectations du cabinet.</div></div><div style={{display:"flex",gap:7}}><span style={{padding:"7px 10px",borderRadius:9,background:T.greenSoft,fontSize:11,fontWeight:800}}>{activeTeam.length} actifs</span>{pending.length>0&&<span style={{padding:"7px 10px",borderRadius:9,background:T.amberSoft,fontSize:11,fontWeight:800}}>{pending.length} en attente</span>}</div></div></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>
        {isAdmin ? "Gérez les portefeuilles (cabinets), les rôles et les demandes d'accès." : "Rôles et affectations de votre cabinet."}
      </p>

      {!canManageTeam && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.inkMuted, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
          <ShieldAlert size={15} />
          Seuls les Experts et Chefs de mission peuvent modifier les rôles et affecter des portefeuilles. Les Gestionnaires de paie disposent de leur rôle métier mais ne peuvent pas administrer l'équipe.
        </div>
      )}

      {isAdmin && pending.length > 0 && (
        <>
          <Panel title={`Demandes en attente (${pending.length})`}>
            {pending.map((row) => (
              <div key={row.id} style={{ padding: "12px 4px", borderBottom: `1px solid ${T.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: row.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontWeight: 600, fontSize: 12, color: "#fff", flexShrink: 0 }}>{row.nom?.[0]}</span>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{row.nom}</div>
                    <div style={{ fontSize: 11, color: T.inkMuted }}>{row.email}{row.telephone ? ` · ${row.telephone}` : ""}{row.cabinet_nom ? ` · ${row.cabinet_nom}` : ""}</div>
                  </div>
                  {validating !== row.id && (
                    <button onClick={() => startValidation(row)} style={{ background: T.navy, color: "#fff", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Valider l'accès</button>
                  )}
                </div>
                {validating === row.id && (
                  <div style={{ marginTop: 10, padding: 12, background: T.paper, borderRadius: 12, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
                        <input type="radio" checked={!validateNewPf} onChange={() => setValidateNewPf(false)} /> Portefeuille existant
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
                        <input type="radio" checked={validateNewPf} onChange={() => setValidateNewPf(true)} /> Nouveau portefeuille
                      </label>
                    </div>
                    {!validateNewPf ? (
                      <select value={validatePortefeuille} onChange={(e) => setValidatePortefeuille(e.target.value)} style={inputStyle}>
                        {portefeuilles.map((p) => <option key={p.id} value={p.id}>{displayCabinetName(p.nom)}{p.domaine ? ` (${p.domaine})` : ""}</option>)}
                      </select>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input placeholder="Nom du cabinet" value={validateNewPfNom} onChange={(e) => setValidateNewPfNom(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                        <input placeholder="Domaine email (ex. cabinet.fr)" value={validateNewPfDomaine} onChange={(e) => setValidateNewPfDomaine(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      </div>
                    )}
                    <select value={validateRole} onChange={(e) => setValidateRole(e.target.value)} style={inputStyle}>
                      <option value="collaborateur">Collaborateur</option>
                      <option value="expert">Expert</option>
                      <option value="chef_mission">Chef de mission</option>
                      <option value="gestionnaire_paie">Gestionnaire de paie</option>
                    </select>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setValidating(null)} style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 11.5 }}>Annuler</button>
                      <button onClick={() => confirmValidation(row)} style={{ padding: "7px 14px", borderRadius: 9, border: "none", background: T.green, color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}>Confirmer</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Panel>
          <div style={{ height: 16 }} />
        </>
      )}

      {isAdmin && (
        <>
          <Panel title="Portefeuilles (cabinets)">
            {portefeuilles.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: `1px solid ${T.line}` }}>
                <Wallet size={15} color={T.navy} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{displayCabinetName(p.nom)}</div>
                  {p.domaine && <div style={{ fontSize: 11, color: T.inkMuted }}>@{p.domaine}</div>}
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMuted }}>{activeTeam.filter((t) => t.portefeuille_id === p.id).length} membre(s)</span>
                <span style={{padding:"3px 8px",borderRadius:999,fontSize:10,fontWeight:700,background:(p.statut||"actif")==="actif"?T.greenSoft:T.amberSoft,color:T.ink}}>{(p.statut||"actif")==="actif"?"Actif":"Résilié"}</span>
                {(p.statut||"actif")==="actif" && <button onClick={async()=>{const reason=prompt(`Motif de fin de contrat pour ${p.nom} :`,"Fin de contrat / désistement");if(reason!==null&&confirm(`Résilier et archiver ${p.nom} ? Le cabinet ne sera plus actif mais ses données seront conservées.`))await onArchivePortefeuille?.(p.id,reason)}} style={{padding:"6px 9px",borderRadius:8,border:`1px solid ${T.amber}`,background:"transparent",color:T.gold,fontSize:10.5,fontWeight:700,cursor:"pointer"}}>Résilier</button>}
                {activeTeam.filter((t)=>t.portefeuille_id===p.id).length===0 && <button onClick={async()=>{if(confirm(`SUPPRESSION DÉFINITIVE de ${p.nom} ? Cette action n'est possible que si le portefeuille ne contient plus de données.`))await onDeletePortefeuille?.(p.id)}} style={{padding:"6px 9px",borderRadius:8,border:`1px solid ${T.red}`,background:"transparent",color:T.red,fontSize:10.5,fontWeight:700,cursor:"pointer"}}>Supprimer</button>}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input placeholder="Nom du nouveau cabinet" value={pfNom} onChange={(e) => setPfNom(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="Domaine email (ex. cabinet.fr)" value={pfDomaine} onChange={(e) => setPfDomaine(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => { if (pfNom.trim()) { onAddPortefeuille(pfNom, pfDomaine); setPfNom(""); setPfDomaine(""); } }} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Plus size={15} /> Créer
              </button>
            </div>
          </Panel>
          <div style={{ height: 16 }} />
        </>
      )}

      {isAdmin && (
        <>
          <Panel title="Ajouter un membre manuellement">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du collaborateur" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={inputStyle}>
                <option value="collaborateur">Collaborateur</option>
                <option value="expert">Expert</option>
                <option value="chef_mission">Chef de mission</option>
                <option value="gestionnaire_paie">Gestionnaire de paie</option>
              </select>
              <select value={newPortefeuille} onChange={(e) => setNewPortefeuille(e.target.value)} style={inputStyle}>
                <option value="">Aucun portefeuille</option>
                {portefeuilles.map((p) => <option key={p.id} value={p.id}>{displayCabinetName(p.nom)}</option>)}
              </select>
              <button onClick={() => { onAdd(newName, newPortefeuille, newRole); setNewName(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={15} /> Ajouter
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: T.inkMuted, marginTop: 8 }}>Réservé aux entrées sans compte (contact externe, dépannage) — les collaborateurs rejoignent normalement en s'inscrivant eux-mêmes.</div>
          </Panel>
          <div style={{ height: 16 }} />
        </>
      )}

      {groups.map(([pfId, members]) => (
        <React.Fragment key={pfId}>
          <Panel title={isAdmin ? `${portefeuilleName(pfId)} (${members.length})` : `Membres de l'équipe (${members.length})`}>
            {members.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", borderBottom: `1px solid ${T.line}`, flexWrap: "wrap" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontWeight: 600, fontSize: 12, color: "#fff", flexShrink: 0 }}>{t.nom?.[0]}</span>
                {editing === t.id ? (
                  <input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus
                    onBlur={() => { onRename(t.nom, editValue); setEditing(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { onRename(t.nom, editValue); setEditing(null); } }}
                    style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
                ) : (
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>{t.nom}</span>
                    {t.email && <div style={{ fontSize: 10.5, color: T.inkMuted }}>{t.email}</div>}
                  </div>
                )}
                {canManageTeam ? (
                  <select value={t.role || "collaborateur"} onChange={(e) => onUpdateMember(t.id, { role: e.target.value })} style={{ ...inputStyle, padding: "6px 10px", fontSize: 11.5 }}>
                    <option value="collaborateur">Collaborateur</option>
                    <option value="expert">Expert</option>
                    <option value="chef_mission">Chef de mission</option>
                    <option value="gestionnaire_paie">Gestionnaire de paie</option>
                    {t.role === "admin" && <option value="admin">Admin</option>}
                  </select>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.navy, background: T.navySoft, padding: "3px 9px", borderRadius: 999 }}>{ROLE_LABELS[t.role] || t.role}</span>
                )}
                {isAdmin && (
                  <select value={t.portefeuille_id || ""} onChange={(e) => onUpdateMember(t.id, { portefeuille_id: e.target.value || null })} style={{ ...inputStyle, padding: "6px 10px", fontSize: 11.5 }}>
                    <option value="">Aucun portefeuille</option>
                    {portefeuilles.map((p) => <option key={p.id} value={p.id}>{displayCabinetName(p.nom)}</option>)}
                  </select>
                )}
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMuted }}>{countFor(t.nom)} dossier(s)</span>
                {canManageTeam && (
                  <>
                    <button onClick={() => { setEditing(t.id); setEditValue(t.nom); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkMuted }}><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm(`Supprimer ${t.nom} de l'équipe ? Ses dossiers seront désassignés.`)) onDelete(t.nom); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.red }}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </Panel>
          <div style={{ height: 16 }} />
        </React.Fragment>
      ))}
    </div>
  );
}

export { EquipeView };
