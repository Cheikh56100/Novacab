import { Plus, Trash2, Pencil } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, logActivity } = Shared;
const { useState } = React;


/* ============================================================
   NOTES COLLABORATIVES — journal par dossier, visible et
   alimenté par tous les collaborateurs. Append-only : on ajoute,
   on ne modifie/supprime pas l'historique.
   ============================================================ */
function NotesTab({ client, me, meId, portefeuilleId, onUpdate }) {
  const [texte, setTexte] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTexte, setEditTexte] = useState("");
  const notes = client.notesCollab || [];
  const sorted = [...notes].sort((a, b) => (a.date < b.date ? 1 : -1));

  const addNote = () => {
    if (!texte.trim()) return;
    const entry = { id: `n-${Date.now()}`, texte: texte.trim(), auteur: me, date: new Date().toISOString() };
    onUpdate(client.id, { notesCollab: [...notes, entry] });
    logActivity({ clientId: client.id, portefeuilleId, type: "note", message: "Note ajoutée", auteurId: meId });
    setTexte("");
  };

  const startEdit = (n) => { setEditingId(n.id); setEditTexte(n.texte); };
  const cancelEdit = () => { setEditingId(null); setEditTexte(""); };
  const saveEdit = (id) => {
    if (!editTexte.trim()) return;
    onUpdate(client.id, { notesCollab: notes.map((n) => (n.id === id ? { ...n, texte: editTexte.trim() } : n)) });
    logActivity({ clientId: client.id, portefeuilleId, type: "note", message: "Note modifiée", auteurId: meId });
    cancelEdit();
  };
  const removeNote = (id) => {
    if (!confirm("Supprimer cette note ?")) return;
    onUpdate(client.id, { notesCollab: notes.filter((n) => n.id !== id) });
    logActivity({ clientId: client.id, portefeuilleId, type: "note", message: "Note supprimée", auteurId: meId });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={3}
          placeholder="Un besoin, une info à transmettre à l'équipe sur ce dossier…"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12.5, background: T.card, resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={addNote} disabled={!texte.trim()} style={{
            display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: "none", borderRadius: 10,
            padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: texte.trim() ? 1 : 0.6,
          }}>
            <Plus size={14} /> Ajouter la note
          </button>
        </div>
      </div>

      {sorted.length === 0 ? <EmptyNote text="Aucune note pour ce dossier pour l'instant." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((n) => (
            <div key={n.id} style={{ border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px", background: T.paper }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>{n.auteur}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkMuted }}>
                    {new Date(n.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" · "}
                    {new Date(n.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {n.auteur === me && editingId !== n.id && (
                    <>
                      <button onClick={() => startEdit(n)} title="Modifier" style={{ background: "none", border: "none", cursor: "pointer", color: T.inkMuted, display: "flex" }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => removeNote(n.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: T.red, display: "flex" }}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === n.id ? (
                <div>
                  <textarea value={editTexte} onChange={(e) => setEditTexte(e.target.value)} rows={3}
                    style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${T.line}`, fontSize: 12.5, background: T.card, resize: "vertical" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
                    <button onClick={cancelEdit} style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 8, padding: "5px 10px", fontSize: 11.5, cursor: "pointer", color: T.inkMuted }}>Annuler</button>
                    <button onClick={() => saveEdit(n.id)} disabled={!editTexte.trim()} style={{ background: T.navy, color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", opacity: editTexte.trim() ? 1 : 0.6 }}>Enregistrer</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: T.inkSoft, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{n.texte}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { NotesTab };
