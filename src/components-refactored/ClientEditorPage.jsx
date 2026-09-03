import { X, Check, Plus, ChevronDown, History, Trash2, RotateCcw } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, TVA_PERIODICITES, TVA_PERIODICITE_LABELS } = Core;
import { Reveal } from "./Reveal.jsx";
import { RoleBadge } from "./RoleBadge.jsx";
import { DemandesPiecesTab } from "./DemandesPiecesTab.jsx";
import { RentabiliteTab } from "./RentabiliteTab.jsx";
import { ValidationDossierTab } from "./ValidationDossierTab.jsx";
import { AccesOrganismesSociauxTab } from "./AccesOrganismesSociauxTab.jsx";
import { AccesTab } from "./AccesTab.jsx";
import { SocialTab } from "./SocialTab.jsx";
import { InfosTab } from "./InfosTab.jsx";
import { ContactTab } from "./ContactTab.jsx";
import { FacturationElectroniqueTab } from "./FacturationElectroniqueTab.jsx";
import { TvaTab } from "./TvaTab.jsx";
import { BilanTab } from "./BilanTab.jsx";
import { AcomptesTab } from "./AcomptesTab.jsx";
import { MissionTab } from "./MissionTab.jsx";
import { ClientChecklistsTab } from "./ClientChecklistsTab.jsx";
import { NotesTab } from "./NotesTab.jsx";
import { HistoriqueTab } from "./HistoriqueTab.jsx";
import { AgeAgoEditor } from "./AgeAgoEditor.jsx";
import { FormeJuridiqueEditor } from "./FormeJuridiqueEditor.jsx";
import { CustomFieldsTab } from "./CustomFieldsTab.jsx";
import { ClientTicketsTab } from "./ClientTicketsTab.jsx";
import { ClientMeetingsTab } from "./ClientMeetingsTab.jsx";
import { ClientOverviewTab } from "./ClientOverviewTab.jsx";
import { ClientAccessRightsTab } from "./ClientAccessRightsTab.jsx";
import { RevisionTab } from "./RevisionTab.jsx";
import { Shared } from "./shared.js";
const { T, canViewOrganismesSociaux, canEditOrganismesSociaux } = Shared;
const { useState, useEffect } = React;



/* ============================================================
   CLIENT DRAWER
   ============================================================ */
/* ============================================================
   CLIENT EDITOR — page pleine avec onglets (façon MyUnisoft)
   Remplace l'ancien tiroir latéral : le dossier s'ouvre dans un
   onglet de la barre du haut, comme "AC INVEST" chez MyUnisoft.
   ============================================================ */
function ClientEditorPage({
  client,
  team,
  me,
  meRole,
  meId,
  portefeuilleId,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
  isAdmin,
  onClose,
  setView,
  tasks = [],
  onCreateTask,
  onUpdateTask,
  onCompleteTask,
  onOpenTvaAuto
}) {
  const [tab, setTab] = useState("overview");
  // Brouillon local : toutes les modifications restent ici tant qu'on n'a pas cliqué "Enregistrer".
  // Reset uniquement quand on change de dossier (changement de client.id), pas à chaque frappe.
  const [draft, setDraft] = useState(client);
  useEffect(() => { setDraft(client); }, [client.id]);
  const explicitAccess = Array.isArray(client.accesDossier) ? client.accesDossier : [];
  const myAccess = explicitAccess.find((a) => String(a.teamId) === String(meId));
  const hasExplicitAccess = explicitAccess.length > 0;
  const canManageAccess = ["admin", "expert", "chef_mission"].includes(meRole);
  const canModifyClient = isAdmin || !hasExplicitAccess || myAccess?.level === "modification";
  const dirty = JSON.stringify(draft) !== JSON.stringify(client);
  const patchDraft = (_id, patch) => setDraft((d) => ({ ...d, ...patch }));
  // notesCollab est écrit en direct par NotesTab (temps réel, hors draft) : on ne le
  // laisse jamais dans le payload de sauvegarde, pour ne pas écraser une note ajoutée
  // entre-temps avec une version périmée du draft.
  const save = () => onUpdate(client.id, { ...draft, notesCollab: client.notesCollab });
  const discard = () => setDraft(client);
  const handleClose = () => {
    if (dirty && !confirm("Des modifications ne sont pas enregistrées. Fermer sans enregistrer ?")) return;
    onClose();
  };
  if (!client) return null;
  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "tickets", label: "Tickets" }, { id: "reunions", label: "Réunions" }, { id: "droits", label: "Droits d'accès" }, { id: "personnalise", label: "Champs personnalisés" },
    { id: "checklists", label: "Checklists DA / DP" },
    { id: "infos", label: "Infos générales" }, { id: "contact", label: "Fiche contact" }, { id: "facturationElectronique", label: "Facturation électronique" },
    { id: "tva", label: "TVA" }, { id: "bilan", label: "Bilan" }, { id: "acomptes", label: "Acomptes" },
    { id: "age", label: "AGE / AGO" }, { id: "formeJuridique", label: "Forme juridique" }, { id: "revision", label: "Révision" },
    { id: "acces", label: "Accès & codes" }, ...(canViewOrganismesSociaux(meRole) ? [{ id: "accesSociaux", label: "Accès organismes sociaux" }] : []),
    { id: "social", label: "Suivi social" }, { id: "suivi", label: "Demandes & pièces" }, { id: "rentabilite", label: "Temps & rentabilité" },
    { id: "validation", label: "Validation" }, { id: "notes", label: "Notes" }, { id: "historique", label: "Historique" },
  ];
  // V33 — navigation volontairement réduite : quatre accès principaux.
  // Les fonctions spécialisées restent disponibles dans les groupes, sans multiplier les onglets visibles.
  const navGroups = [
    { id: "overview", label: "Vue d'ensemble", items: ["overview"] },
    { id: "documents", label: "Documents & informations", items: ["infos", "contact", "facturationElectronique", "personnalise", "acces"] },
    { id: "tickets", label: "Tickets", items: ["tickets"] },
    { id: "reunions", label: "Réunions", items: ["reunions"] },
    { id: "droits", label: "Droits d'accès", items: ["droits"] },
    { id: "travail", label: "Travail", items: ["checklists", "revision", "rentabilite", "suivi"] },
    { id: "fiscalite", label: "Fiscalité", items: ["tva", "acomptes", "bilan"] },
    { id: "sociale", label: "Sociale", items: ["social", ...(canViewOrganismesSociaux(meRole) ? ["accesSociaux"] : [])] },
    { id: "more", label: "Plus", items: ["formeJuridique", "age", "validation", "notes", "historique"] },
  ];
  const tabLabel = (id) => tabs.find((t) => t.id === id)?.label || id;
  const [openClientNav, setOpenClientNav] = useState(null);
  const activeNavGroup = navGroups.find((g) => g.items.includes(tab));
  return (
    <div>
      <Reveal>
        <div className="flex items-start justify-between gap-3 flex-wrap" style={{ marginBottom: 4 }}>
          <div className="min-w-0">
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkMuted }}>{client.siren || "SIREN non renseigné"}</div>
            <input defaultValue={client.nom} onBlur={(e) => patchDraft(client.id, { nom: e.target.value || client.nom })}
              className="w-full sm:min-w-[260px] sm:w-auto"
              style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 700, color: T.ink, border: "none", background: "transparent", padding: "2px 0", margin: "2px 0 6px" }} />
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
              <RoleBadge role="Collab." name={client.collab} />
              <RoleBadge role="Expert" name={client.expert} />
              <RoleBadge role="Chef de mission" name={client.chefMission} />
              {client.tvaRegime && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.navy, fontWeight: 700, background: T.navySoft, padding: "2px 9px", borderRadius: 999 }}>{client.tvaRegime}{client.tvaRegime === "CA3" && client.tvaPeriodicite ? ` · ${TVA_PERIODICITE_LABELS[client.tvaPeriodicite]}` : ""}</span>}
              {client.regimeFiscal && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, fontWeight: 700, background: T.paperDeep, padding: "2px 9px", borderRadius: 999 }}>{client.regimeFiscal}</span>}
              {client.tvaExig && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, fontWeight: 700, background: T.paper, padding: "2px 9px", borderRadius: 999 }}>Exig. {client.tvaExig}</span>}
              {client.statutDossier === "transfert" ? (
                <span title="Résiliation ou reprise en cours — se termine automatiquement depuis l'onglet concerné"
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 10px 3px 8px", borderRadius: 999, background: T.amberSoft, color: T.amber }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.amber, flexShrink: 0 }} />
                  En transfert
                </span>
              ) : (
                <button
                  onClick={() => {
                    if (draft.statutDossier === "inactif" && !isAdmin) return;
                    patchDraft(client.id, { statutDossier: draft.statutDossier === "inactif" ? "actif" : "inactif" });
                  }}
                  disabled={draft.statutDossier === "inactif" && !isAdmin}
                  className="statusToggle"
                  title="Basculer le statut du dossier"
                  style={{
                    display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 10px 3px 8px", borderRadius: 999, border: "none",
                    background: client.statutDossier === "inactif" ? T.paperDeep : T.greenSoft,
                    color: client.statutDossier === "inactif" ? T.inkMuted : T.green,
                  }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: client.statutDossier === "inactif" ? T.inkMuted : T.green, flexShrink: 0 }} />
                  {client.statutDossier === "inactif" ? "Inactif" : "Actif"}
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {dirty && (
              <>
                <span style={{ fontSize: 11, color: T.amber, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber }} /> Modifications non enregistrées
                </span>
                <button onClick={discard} style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: T.inkMuted, fontSize: 12 }}>
                  Annuler
                </button>
                <button onClick={save} disabled={!canModifyClient} title={!canModifyClient ? "Lecture seule pour ce dossier" : "Enregistrer"} style={{ display: "flex", alignItems: "center", gap: 6, background: canModifyClient ? T.navy : T.inkMuted, border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  <Check size={14} /> Enregistrer
                </button>
              </>
            )}
            {onArchive && client.statutDossier !== "inactif" && <button onClick={()=>{if(confirm(`Archiver « ${client.nom} » ?`))onArchive(client.id)}} style={{display:"flex",alignItems:"center",gap:6,background:T.amberSoft,border:`1px solid ${T.line}`,borderRadius:9,padding:"7px 12px",cursor:"pointer",color:T.amber,fontSize:12,fontWeight:700}}><History size={14}/> Archiver</button>}
            {onUnarchive && isAdmin && client.statutDossier === "inactif" && <button onClick={()=>{if(confirm(`Désarchiver « ${client.nom} » ?`))onUnarchive(client.id)}} style={{display:"flex",alignItems:"center",gap:6,background:T.greenSoft,border:`1px solid ${T.line}`,borderRadius:9,padding:"7px 12px",cursor:"pointer",color:T.green,fontSize:12,fontWeight:700}}><RotateCcw size={14}/> Désarchiver</button>}
            {onDelete && (
  <button
    onClick={async () => {
      if (
        !confirm(
          `Supprimer définitivement le dossier « ${client.nom} » ?\n\nCette action est irréversible.`
        )
      ) {
        return;
      }

      const ok = await onDelete(client.id);

      if (ok) {
        onClose();
      }
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: T.redSoft,
      border: "1px solid #FECACA",
      borderRadius: 9,
      padding: "7px 12px",
      cursor: "pointer",
      color: T.red,
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    <Trash2 size={14} />
    Supprimer
  </button>
)}
            <button onClick={handleClose} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.line}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: T.inkMuted, fontSize: 12 }}>
              <X size={14} /> Fermer l'onglet
            </button>
          </div>
        </div>
      </Reveal>
      {/* V17 — Cockpit dossier : lecture immédiate avant d'entrer dans les rubriques */}
      <Reveal>
        <div style={{ marginTop: 14, marginBottom: 18, padding: 16, border: `1px solid ${T.line}`, borderRadius: 16, background: `linear-gradient(135deg, ${T.card}, ${T.paper})`, boxShadow: T.shadowSm }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Vue rapide du dossier</div>
              <div style={{ fontSize: 11.5, color: T.inkMuted, marginTop: 3 }}>Les informations essentielles avant d'ouvrir le détail.</div>
            </div>
            <button onClick={() => setTab("mission")} style={{ border: `1px solid ${T.line}`, background: T.card, borderRadius: 9, padding: "7px 11px", color: T.navy, fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>Ouvrir l'accueil client →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {[
              ["Statut", client.statutDossier === "inactif" ? "Inactif" : client.statutDossier === "transfert" ? "En transfert" : "Actif"],
              ["TVA", client.tvaRegime ? `${client.tvaRegime}${client.tvaPeriodicite ? ` · ${TVA_PERIODICITE_LABELS[client.tvaPeriodicite] || client.tvaPeriodicite}` : ""}` : "Non renseignée"],
              ["Collaborateur", client.collab || "À attribuer"],
              ["Clôture", client.dateCloture || client.cloture || "Non renseignée"]
            ].map(([label, value]) => <div key={label} style={{ padding: "11px 12px", borderRadius: 11, background: T.card, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 10, color: T.inkMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: T.ink, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
            </div>)}
          </div>
        </div>
      </Reveal>
      <div style={{ marginTop: 16, marginBottom: 22, borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", paddingBottom: 0 }} className="scrollbar">
          {navGroups.map((g) => {
            const active = activeNavGroup?.id === g.id;
            const hasMenu = g.items.length > 1;
            return <div key={g.id} style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "stretch" }}>
              <button
                type="button"
                onClick={() => { setTab(g.items[0]); setOpenClientNav(null); }}
                title={`Ouvrir ${g.label}`}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "10px 10px 10px 13px", background: active ? T.navySoft : "transparent", border: "none", borderBottom: active ? `2.5px solid ${T.navy}` : "2.5px solid transparent", cursor: "pointer", fontSize: 12.5, fontWeight: active ? 700 : 600, whiteSpace: "nowrap", color: active ? T.navy : T.inkMuted, marginBottom: -1, borderRadius: "8px 0 0 0"
                }}
              >{g.label}</button>
              {hasMenu && (
                <button
                  type="button"
                  aria-label={`Afficher les sous-rubriques de ${g.label}`}
                  aria-expanded={openClientNav === g.id}
                  onClick={(e) => { e.stopPropagation(); setOpenClientNav(openClientNav === g.id ? null : g.id); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 8px", background: active ? T.navySoft : "transparent", border: "none", borderBottom: active ? `2.5px solid ${T.navy}` : "2.5px solid transparent", cursor: "pointer", color: active ? T.navy : T.inkMuted, marginBottom: -1, borderRadius: "0 8px 0 0"
                  }}
                >
                  <ChevronDown size={12} style={{ transform: openClientNav === g.id ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                </button>
              )}
              {openClientNav === g.id && hasMenu && <div className="client-nav-menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40, minWidth: 190, padding: 6, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, boxShadow: T.shadowLg }}>
                {g.items.map((id) => <button key={id} type="button" onClick={() => { setTab(id); setOpenClientNav(null); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 9px", border: "none", borderRadius: 8, background: tab === id ? T.navySoft : "transparent", color: tab === id ? T.navy : T.inkSoft, cursor: "pointer", textAlign: "left", fontSize: 11.5, fontWeight: tab === id ? 700 : 600 }}>{tabLabel(id)}{tab === id && <Check size={13} />}</button>)}
              </div>}
            </div>;
          })}
        </div>
        {activeNavGroup && activeNavGroup.items.length > 1 && <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 2px 8px", color: T.inkMuted, fontSize: 10.5, overflowX: "auto" }} className="scrollbar">
          <span style={{ fontWeight: 700, color: T.inkSoft }}>{activeNavGroup.label} :</span>
          {activeNavGroup.items.map((id) => <button key={id} onClick={() => setTab(id)} style={{ border: `1px solid ${tab === id ? T.navy : T.line}`, background: tab === id ? T.navySoft : T.card, color: tab === id ? T.navy : T.inkMuted, borderRadius: 999, padding: "4px 9px", fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer" }}>{tabLabel(id)}</button>)}
        </div>}
      </div>
      {!canModifyClient && <div style={{ width: "100%", maxWidth: 1120, marginBottom: 10, padding: "9px 12px", borderRadius: 10, background: T.paper, border: `1px solid ${T.line}`, color: T.inkMuted, fontSize: 11 }}>Dossier en <b style={{ color: T.ink }}>lecture seule</b> selon les droits d’accès configurés.</div>}
      <div style={{ width: "100%", maxWidth: 1120, background: T.card, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "22px 24px", boxShadow: T.shadowSm }}>
        {tab === "overview" && <ClientOverviewTab client={client} tasks={tasks} team={team} onOpenTab={setTab} />}
        {tab === "infos" && <InfosTab client={draft} team={team} onUpdate={patchDraft} setView={setView} />}
        {tab === "contact" && <ContactTab client={draft} onUpdate={patchDraft} />}
        {tab === "facturationElectronique" && <FacturationElectroniqueTab client={draft} onUpdate={patchDraft} />}
        {tab === "tva" && <TvaTab client={draft} onUpdate={patchDraft} onOpenTvaAuto={onOpenTvaAuto} />}
        {tab === "bilan" && <BilanTab client={draft} onUpdate={patchDraft} meRole={meRole} />}
        {tab === "acomptes" && <AcomptesTab client={draft} onUpdate={patchDraft} />}
        {tab === "age" && <AgeAgoEditor client={draft} onUpdate={patchDraft} />}
        {tab === "formeJuridique" && <FormeJuridiqueEditor client={draft} onUpdate={patchDraft} />}
{tab === "revision" && <RevisionTab client={draft} onUpdate={patchDraft} onPersistUpdate={onUpdate} setView={setView} />}
        {tab === "mission" && <MissionTab client={draft} onUpdate={patchDraft} />}
        {tab === "tickets" && <ClientTicketsTab client={client} tasks={tasks} team={team} onCreate={onCreateTask} onUpdate={onUpdateTask} onComplete={onCompleteTask} portefeuilleId={portefeuilleId} />}
        {tab === "reunions" && <ClientMeetingsTab client={client} me={me} meId={meId} portefeuilleId={portefeuilleId} team={team} onUpdate={onUpdate} onCreateTask={canModifyClient ? onCreateTask : null} />}
        {tab === "droits" && <ClientAccessRightsTab client={client} team={team} meRole={meRole} meId={meId} onUpdate={onUpdate} />}
        {tab === "personnalise" && <CustomFieldsTab client={draft} onUpdate={patchDraft} canConfigure={["admin","super_admin","expert","chef_mission"].includes(meRole)} />}
        {tab === "checklists" && <ClientChecklistsTab client={draft} year={new Date().getFullYear()} onUpdate={patchDraft} />}
        {tab === "acces" && <AccesTab client={draft} onUpdate={patchDraft} canEdit={canEditOrganismesSociaux(meRole)} />}
        {tab === "accesSociaux" && canViewOrganismesSociaux(meRole) && <AccesOrganismesSociauxTab client={draft} portefeuilleId={portefeuilleId} meId={meId} canEdit={canEditOrganismesSociaux(meRole)} />}
        {tab === "social" && <SocialTab client={draft} onUpdate={patchDraft} />}
        {tab === "suivi" && <DemandesPiecesTab client={draft} onUpdate={patchDraft} />}
        {tab === "rentabilite" && <RentabiliteTab client={draft} onUpdate={patchDraft} />}
        {tab === "validation" && <ValidationDossierTab client={draft} onUpdate={patchDraft} me={me} />}
        {tab === "notes" && <NotesTab client={client} me={me} meId={meId} portefeuilleId={portefeuilleId} onUpdate={onUpdate} />}
        {tab === "historique" && <HistoriqueTab clientId={client.id} team={team} />}
      </div>
    </div>
  );
}

export { ClientEditorPage };
