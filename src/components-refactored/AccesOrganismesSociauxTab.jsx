import { Plus, ShieldCheck } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { EmptyNote } from "./EmptyNote.jsx";
import { SocialAccessRow } from "./SocialAccessRow.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useEffect, useCallback } = React;



function AccesOrganismesSociauxTab({ client, portefeuilleId, meId, canEdit = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => { setLoading(true); setRows(await loadOrganismesSociauxRemote(portefeuilleId, client.id)); setLoading(false); }, [portefeuilleId, client.id]);
  useEffect(() => { reload(); }, [reload]);
  const add = async () => {
    if (!canEdit) return;
    const row = await insertOrganismeSocialRemote({ portefeuille_id: portefeuilleId, client_id: client.id, organisme: "URSSAF", libelle: "", identifiant: "", secret: "", siret: client.siret || "", note: "", created_by: meId || null });
    if (row) setRows(prev => [...prev, row]);
  };
  const save = async draft => { if (!canEdit) return; const row = await updateOrganismeSocialRemote(draft.id, { organisme: draft.organisme, libelle: draft.libelle, identifiant: draft.identifiant, secret: draft.secret, siret: draft.siret, note: draft.note, updated_by: meId || null, updated_at: new Date().toISOString() }); if (row) setRows(prev => prev.map(r => r.id === row.id ? row : r)); };
  const remove = async id => { if (!canEdit) return; if (!confirm("Supprimer définitivement cet accès ?")) return; if (await deleteOrganismeSocialRemote(id)) setRows(prev => prev.filter(r => r.id !== id)); };
  return <div>
    <div style={{ fontSize: 11.5, color: T.inkSoft, background: T.navySoft, padding: "9px 12px", borderRadius: 9, marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}><ShieldCheck size={15} color={T.navy} /> Accès hautement sensibles. <b>Consultation et modification réservées aux Admin, Experts et Chefs de mission.</b></div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}><div><div style={{ fontWeight: 800, color: T.navy, fontSize: 13.5 }}>Organismes sociaux — {client.nom}</div><div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 2 }}>Codes, identifiants et accès du dossier</div></div>{canEdit && <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 5, background: T.navy, color: "#fff", border: 0, borderRadius: 8, padding: "7px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Ajouter</button>}</div>
    {loading ? <EmptyNote text="Chargement…" /> : rows.length ? rows.map(row => <SocialAccessRow key={row.id} row={row} onSave={save} onDelete={() => remove(row.id)} canEdit={canEdit} />) : <EmptyNote text="Aucun accès organisme social enregistré pour ce dossier." />}
  </div>;
}

export { AccesOrganismesSociauxTab };
