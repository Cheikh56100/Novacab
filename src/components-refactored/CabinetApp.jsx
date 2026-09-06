import { Loader2, Eye } from "lucide-react";
import React from "react";
import { useNavigationState } from "../hooks/useNavigationState.js";
import { canAccessView, canAccessAccountSection } from "../utils/access.js";
import { useCabinetDataSync } from "../hooks/useCabinetDataSync.js";
import { auditProductAction, scheduleFollowups } from "../services/cabinetState.js";
import { dispatchClientEvents } from "../services/workflowEvents.js";
import * as Core from "./core.js";
const { TvaAutomation, buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, updateSuperAdminTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { CollaboratorSpaceView } from "./CollaboratorSpaceView.jsx";
import { MailTypesView } from "./MailTypesView.jsx";
import { ApplicationsView } from "./ApplicationsView.jsx";
import { SaveToast } from "./SaveToast.jsx";
import { HoldingsView } from "./HoldingsView.jsx";
import { GlobalStyle } from "./GlobalStyle.jsx";
import { AccountSyncScreen } from "./AccountSyncScreen.jsx";
import { ContractSignatureScreen } from "./ContractSignatureScreen.jsx";
import { PendingScreen } from "./PendingScreen.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { AccountPage } from "./AccountPage.jsx";
import { TopBar } from "./TopBar.jsx";
import { PilotageView } from "./PilotageView.jsx";
import { PermissionsMatrixView } from "./PermissionsMatrixView.jsx";
import { AdministrationView } from "./AdministrationView.jsx";
import { AdministrationRequestsView } from "./AdministrationRequestsView.jsx";
import { ArchivesView } from "./ArchivesView.jsx";
import { CorbeilleView } from "./CorbeilleView.jsx";
import { Dashboard } from "./Dashboard.jsx";
import { ClientsRegistry } from "./ClientsRegistry.jsx";
import { ClientEditorPage } from "./ClientEditorPage.jsx";
import { AccesOrganismesSociauxView } from "./AccesOrganismesSociauxView.jsx";
import { ReprisesView } from "./ReprisesView.jsx";
import { TvaGrid } from "./TvaGrid.jsx";
import { BilansView } from "./BilansView.jsx";
import { AcomptesView } from "./AcomptesView.jsx";
import { ResiliationsView } from "./ResiliationsView.jsx";
import { MissionsExceptionnellesView } from "./MissionsExceptionnellesView.jsx";
import { LegalServicesView } from "./LegalServicesView.jsx";
import { AgeAgoView } from "./AgeAgoView.jsx";
import { RevisionView } from "./RevisionView.jsx";
import { ChecklistDPView } from "./ChecklistDPView.jsx";
import { ChecklistsView } from "./ChecklistsView.jsx";
import { RegimeChangeView } from "./RegimeChangeView.jsx";
import { GestionnairePaieView } from "./GestionnairePaieView.jsx";
import { CotisationsSocialesView } from "./CotisationsSocialesView.jsx";
import { SocialPaieCentre } from "./SocialPaieCentre.jsx";
import { SuiviFiscalView } from "./SuiviFiscalView.jsx";
import { TasksPage } from "./TasksPage.jsx";
import { PlanningView } from "./PlanningView.jsx";
import { DemoAccountsView } from "./DemoAccountsView.jsx";
import { SuperAdminOverview } from "./SuperAdminOverview.jsx";
import { SuperAdminSubscriptionsView } from "./SuperAdminSubscriptionsView.jsx";
import { SuperAdminTvaDeadlinesView } from "./SuperAdminTvaDeadlinesView.jsx";
import { AdminSecurityAudit } from "./AdminSecurityAudit.jsx";
import { SuperAdminTechnicalStatus } from "./SuperAdminTechnicalStatus.jsx";
import { EquipeView } from "./EquipeView.jsx";
import { AddClientModal } from "./AddClientModal.jsx";
import { Shared } from "./shared.js";
import { subscribeProductNotifications } from "../services/notifications.js";
import { fetchAdministrationRequests, createAdministrationRequest, updateAdministrationRequest, subscribeAdministrationRequests } from "../services/administrationWorkflow.js";
const { T, S, PALETTE, SEED_AIDES_SECTEUR, supabase, fetchTasks, createTask, updateTask, completeTask, archiveTask, deleteTask, subscribeTasks, runAutomation, fetchLegalRequests, createLegalRequest, updateLegalRequest, deleteLegalRequest, migrateLocalLegalRequests, logActivity, activityMessages, filterEditablePatch, CURRENT_YEAR, withAnnualSnapshot, rolloverAnnualClient, getExerciseYear, RAW_SEED_CLIENTS, displayCabinetName, canViewOrganismesSociaux } = Shared;
const { useState, useEffect, useMemo, useCallback, useRef, Suspense } = React;



/* ============================================================
   APP
   ============================================================ */
function CabinetApp({ session, onLogout }) {
  const [clients, setClients] = useState(null);
  const [legalRequests, setLegalRequests] = useState([]);
  const [team, setTeam] = useState(null);
  const [portefeuilles, setPortefeuilles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secteurContent, setSecteurContent] = useState({ ...SEED_AIDES_SECTEUR });
  const [tasksDb, setTasksDb] = useState([]);
  const [contractStatus, setContractStatus] = useState(null);
  const [contractChecked, setContractChecked] = useState(false);
  const [collaboratorProfile, setCollaboratorProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [administrationRequests, setAdministrationRequests] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [appNotice, setAppNotice] = useState(null);
  const showAppNotice = useCallback((message, tone = "error") => {
    setAppNotice({ message, tone });
    window.clearTimeout(showAppNotice._timer);
    showAppNotice._timer = window.setTimeout(() => setAppNotice(null), 4200);
  }, []);
  const myRow = useMemo(() => {
    if (!team || !session?.user?.id) return null;
    return team.find((t) => t.auth_user_id === session.user.id) || null;
  }, [team, session]);
  const me = myRow?.nom || null;
  const myRole = myRow?.role || null;
  const myPortefeuilleId = myRow?.portefeuille_id || null;
  const isSuperAdmin = myRole === "super_admin";
  const isAdmin = myRole === "admin" || isSuperAdmin;
  const navigation = useNavigationState({ canViewOrganismesSociaux, myRole });
  const [administrationTab, setAdministrationTab] = useState("pilotage");
  const {
    view, setView, mailClientId, setMailClientId, tvaAutoClientId, setTvaAutoClientId,
    search, setSearch, roleFilter, setRoleFilter, regimeFilter, setRegimeFilter,
    collabQuickFilter, setCollabQuickFilter, dashboardFilter, setDashboardFilter,
    showAddClient, setShowAddClient, openClientTabs, setOpenClientTabs,
    activeClientTab, setActiveClientTab, sidebarCollapsed, setSidebarCollapsed,
    mobileMenuOpen, setMobileMenuOpen, accountMenuOpen, setAccountMenuOpen,
    accountSection, setAccountSection, viewHistory, setViewHistory,
    openClientTab: openClientTabState, closeClientTab, goHome, openAccountSection: openAccountSectionState,
    navTo: navToState, goBack: goBackState, canGoBack,
  } = navigation;

  const { pendingLocalIds, clientsRef, clientSaveQueues, pendingLocalTeamIds, pendingLocalPortefeuilleIds } = useCabinetDataSync({
    session, clients, setClients, setTeam, setPortefeuilles, setSecteurContent, setLoading, seedSecteurContent: SEED_AIDES_SECTEUR,
  });

  // Tâches (table "tasks", indépendante des échéances fiscales calculées) : chargement
  // initial + rafraîchissement à chaque changement temps réel.
  useEffect(() => {
    let cancelled = false;
    const reload = () => fetchTasks().then((rows) => { if (!cancelled) setTasksDb(rows); });
    reload();
    const unsubscribe = subscribeTasks(reload);
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  // Centre de demandes : persistant et partagé entre collaborateurs et direction.
  useEffect(() => {
    if (!myPortefeuilleId || !myRow?.id) return undefined;
    let cancelled = false;
    const reload = async () => {
      try {
        const rows = await fetchAdministrationRequests({ portefeuilleId: myPortefeuilleId, management: myRole === "admin" || myRole === "expert" });
        if (!cancelled) setAdministrationRequests(rows);
      } catch (error) {
        console.warn("Centre de demandes indisponible :", error?.message || error);
        if (!cancelled) setAdministrationRequests([]);
      }
    };
    reload();
    const unsubscribe = subscribeAdministrationRequests(myPortefeuilleId, reload);
    return () => { cancelled = true; unsubscribe(); };
  }, [myPortefeuilleId, myRow?.id, myRole]);

  const handleCreateAdministrationRequest = useCallback(async (input) => {
    const created = await createAdministrationRequest(input);
    setAdministrationRequests((rows) => [created, ...rows]);
    return created;
  }, []);

  const handleUpdateAdministrationRequest = useCallback(async (id, patch) => {
    try {
      const updated = await updateAdministrationRequest(id, patch);
      setAdministrationRequests((rows) => rows.map((r) => r.id === id ? updated : r));
    } catch (error) {
      showAppNotice(error?.message || "Impossible de mettre à jour la demande administrative.");
    }
  }, [showAppNotice]);

  // V31 — moteur intelligent : transforme les données existantes (tickets +
  // imports financiers) en alertes persistées. Aucun accès ni donnée métier n'est modifié.
  useEffect(() => {
    if (!clients?.length) return;
    const timer = setTimeout(() => {
      runAutomation({ clients, tasks: tasksDb }).catch((err) => console.warn("Moteur intelligent V31", err));
    }, 900);
    return () => clearTimeout(timer);
  }, [clients, tasksDb]);


  // Après validation d'un nouveau cabinet, le contrat doit être présenté avant l'accès à l'application.
  // Cet effet doit être déclaré APRÈS l'initialisation de myRow pour éviter la TDZ JavaScript.
  useEffect(() => {
    const uid = session?.user?.id;
    const needsContract = !!session?.user?.user_metadata?.requires_contract_after_validation;
    if (!uid || !myRow || myRow.statut === "en_attente" || !needsContract) {
      setContractStatus(null);
      setContractChecked(true);
      return;
    }
    setContractChecked(false);
    loadMyContractStatusRemote(uid)
      .then((row) => setContractStatus(row))
      .catch((error) => {
        console.error("Erreur chargement contrat", error);
        setContractStatus(null);
      })
      .finally(() => setContractChecked(true));
  }, [session?.user?.id, session?.user?.user_metadata?.requires_contract_after_validation, myRow?.id, myRow?.statut]);
  // Le Super Admin dispose d'un espace plateforme dédié et n'arrive pas sur une vue collaborateur.
  useEffect(() => {
    if (isSuperAdmin && (view === "dashboard" || view === "mon-espace")) setView("super-overview");
  }, [isSuperAdmin, view]);
  const isDemoAccount = !!myRow?.is_demo || session?.user?.user_metadata?.is_demo === true;
  const demoExpired = isDemoAccount && myRow?.demo_expires_at && new Date(myRow.demo_expires_at).getTime() < Date.now();
  useEffect(() => {
    if (demoExpired) supabase.auth.signOut();
  }, [demoExpired]);


  useEffect(()=>{if(!myRow?.id)return;let cancelled=false;(async()=>{await migrateLocalLegalRequests({portefeuilleId:myRow.portefeuille_id,createdBy:myRow.id});const rows=await fetchLegalRequests({portefeuilleId:isAdmin?null:myRow.portefeuille_id});if(!cancelled)setLegalRequests(rows||[])})();return()=>{cancelled=true}},[myRow?.id,myRow?.portefeuille_id,isAdmin]);
  const canManageTeam = !isDemoAccount && (isAdmin || myRole === "expert" || myRole === "chef_mission");
  useEffect(() => {
    if (!myRow?.id) return;
    let cancelled = false;
    const key = `novacab-collaborator-profile-${myRow.id}`;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(key) || "null"); } catch {}
    if (local && !cancelled) setCollaboratorProfile(local);
    loadCollaboratorProfileRemote(myRow.id).then((remote) => {
      if (!cancelled && remote) {
        setCollaboratorProfile(remote);
        try { localStorage.setItem(key, JSON.stringify(remote)); } catch {}
      }
    });
    return () => { cancelled = true; };
  }, [myRow?.id]);
  const saveCollaboratorProfile = useCallback(async (patch) => {
    if (!myRow?.id) return false;
    const next = { ...(collaboratorProfile || {}), ...patch, team_id: myRow.id };
    setCollaboratorProfile(next);
    try { localStorage.setItem(`novacab-collaborator-profile-${myRow.id}`, JSON.stringify(next)); } catch {}
    setSaveStatus("saving");
    const remote = await upsertCollaboratorProfileRemote(myRow.id, patch);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1200);
    if (!remote) showAppNotice("Votre modification est conservée sur cet appareil, mais la synchronisation avec le serveur a échoué.", "warning");
    return !!remote;
  }, [myRow?.id, collaboratorProfile, showAppNotice]);
  useEffect(() => {
    if (view === "acces-organismes" && !canViewOrganismesSociaux(myRole)) setView("dashboard");
  }, [view, myRole]);
  const updateSecteurContent = useCallback((secteurId, patch) => {
    setSecteurContent((prev) => ({ ...prev, [secteurId]: { ...(prev?.[secteurId] || {}), ...patch } }));
    upsertSecteurContentRemote(secteurId, patch, me);
  }, [me]);
// Notifications (alertes TVA Fait → Chef de mission, confirmation → Collaborateur)
  useEffect(() => {
    if (!myRow?.id) return;
    let cancelled = false;
    const reload = () => loadNotificationsFromSupabase(myRow.id).then((rows) => { if (!cancelled) setNotifications(rows); });
    reload();
    const unsubscribe = subscribeProductNotifications(() => reload());
    return () => { cancelled = true; unsubscribe(); };
  }, [myRow?.id]);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    if (!String(id).startsWith("alert-")) markNotificationReadRemote(id);
  }, []);
  // Pour les opérations qui touchent plusieurs clients d'un coup (renommage/suppression d'un collaborateur)
  const persistMany = useCallback((clientsToSave) => {
    setSaveStatus("saving");
    clientsToSave.forEach((c) => pendingLocalIds.current.add(c.id));
    Promise.all(clientsToSave.map(async (c) => ({
      id: c.id,
      result: await updateClientRemote(c.id, c, Math.max(1, Number(c._version || 1))),
    }))).then((results) => {
      const versions = new Map(); const conflicts = [];
      results.forEach(({ id, result }) => {
        pendingLocalIds.current.delete(id);
        if (result?.ok && result.version) versions.set(id, result.version);
        if (!result?.ok && result?.conflict) conflicts.push(id);
      });
      if (versions.size) setClients((all) => all.map((c) => versions.has(c.id) ? { ...c, _version: versions.get(c.id) } : c));
      if (conflicts.length) {
        loadClientsFromSupabase().then((rows) => {
          if (!rows) return;
          const fresh = new Map(rows.map((row) => [row.id, migrateClients([row])[0]]));
          setClients((all) => all.map((c) => fresh.has(c.id) ? fresh.get(c.id) : c));
        });
        setSaveStatus("error");
        showAppNotice("Certains dossiers ont été modifiés ailleurs. Les versions les plus récentes ont été rechargées.", "warning");
      } else if (results.some(({ result }) => !result?.ok)) {
        setSaveStatus("error");
        showAppNotice("Certaines sauvegardes ont échoué. Vérifiez votre connexion.", "error");
      } else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 1200); }
    }).catch(() => {
      clientsToSave.forEach((c) => pendingLocalIds.current.delete(c.id));
      setSaveStatus("error");
      showAppNotice("Certaines sauvegardes ont échoué. Vérifiez votre connexion.", "error");
    });
  }, []);

  // Sauvegarde séquentielle par dossier : deux écritures du même client ne peuvent
  // jamais envoyer simultanément la même expectedVersion à Supabase.
  const updateClient = useCallback((id, patch) => {
    const current = clientsRef.current.find((c) => c.id === id);
    if (!current) return;

    const requestedUnarchive = patch?.statutDossier === "actif" && current.statutDossier === "inactif";
    if (patch?.dossierAnnuelChecklist || patch?.missionStatus || patch?.mission) {
      auditProductAction("checklists", "update", { entityType: "client", entityId: id, metadata: { source: "checklist" } });
    }
    const safePatch = filterEditablePatch(myRole, requestedUnarchive && myRole !== "admin" ? { ...patch, statutDossier: current.statutDossier } : patch);
    const baseVersion = Math.max(1, Number(current._version || 1));
    let updated = { ...current, ...safePatch, _version: baseVersion + 1 };

    const transmissionAvant = !!current.bilan?.transmis;
    const transmissionApres = !!updated.bilan?.transmis;
    const ancienExercice = getExerciseYear(current.dateCloture, null);
    if (!transmissionAvant && transmissionApres && current.dateCloture && ancienExercice) {
      const transmissionUndo = {
        previousDateCloture: current.dateCloture,
        previousAnnualActiveYear: current.annualActiveYear || ancienExercice,
        previousBilan: current.bilan || {}, previousAnnualData: current.annualData || {},
        createdAt: new Date().toISOString(),
      };
      const archiveClient = { ...updated, dateCloture: current.dateCloture, annualActiveYear: ancienExercice };
      const prochainExercice = ancienExercice + 1;
      updated = { ...rolloverAnnualClient(archiveClient, ancienExercice, prochainExercice), dateCloture: updated.dateCloture, bilanTransmissionUndo: transmissionUndo };
    } else {
      const ay = Number(updated.annualActiveYear || CURRENT_YEAR());
      const decDone = String(updated.tvaMois?.Déc || "").toUpperCase() === "FAIT";
      updated = decDone && ay < CURRENT_YEAR() ? rolloverAnnualClient(updated, ay, CURRENT_YEAR()) : withAnnualSnapshot(updated, ay);
    }

    // Mise à jour immédiate de l'interface, sans effet réseau dans setState.
    clientsRef.current = clientsRef.current.map((c) => c.id === id ? updated : c);
    setClients(clientsRef.current);
    pendingLocalIds.current.add(id);
    setSaveStatus("saving");

    const previous = clientSaveQueues.current.get(id) || Promise.resolve();
    const task = previous.catch(() => {}).then(async () => {
      // Chaque tâche conserve son instantané et sa version attendue : la file garantit l'ordre.
      const latest = updated;
      const expected = baseVersion;
      const result = await updateClientRemote(id, latest, expected);
      if (!result?.ok) {
        pendingLocalIds.current.delete(id);
        setSaveStatus("error");
        showAppNotice(result?.conflict
          ? "Ce dossier a été modifié ailleurs. La version la plus récente a été rechargée."
          : "La sauvegarde du dossier a échoué. Vérifiez votre connexion.", result?.conflict ? "warning" : "error");
        const rows = await loadClientsFromSupabase();
        const fresh = rows?.find((c) => c.id === id);
        if (fresh) {
          const migrated = migrateClients([fresh])[0];
          clientsRef.current = clientsRef.current.map((c) => c.id === id ? migrated : c);
          setClients(clientsRef.current);
        }
        return;
      }
      if (result.version) {
        clientsRef.current = clientsRef.current.map((c) => c.id === id && Number(c._version || 0) <= result.version ? { ...c, _version: result.version } : c);
        setClients(clientsRef.current);
      }
      pendingLocalIds.current.delete(id);
      setSaveStatus("saved");
      logActivity({ clientId: id, portefeuilleId: latest.portefeuilleId || null, type: "modification", message: `Dossier ${latest.nom || id} modifié par ${me || "utilisateur"}`, auteurId: myRow?.id || null });
      dispatchClientEvents({ previous: current, next: latest, portefeuilleId: latest.portefeuilleId || latest.portefeuille_id || myPortefeuilleId || null, auteurId: myRow?.id || null }).catch((error) => console.warn("Workflow événementiel :", error?.message || error));
      setTimeout(() => setSaveStatus("idle"), 1200);
    });
    clientSaveQueues.current.set(id, task);
    task.finally(() => { if (clientSaveQueues.current.get(id) === task) clientSaveQueues.current.delete(id); });
  }, [me, myRow?.id, myRole, showAppNotice]);

  const addClient = useCallback((newClient) => {
    if (!["admin","expert","chef_mission","collaborateur"].includes(myRole)) { showAppNotice("Votre rôle ne permet pas de créer un dossier client.", "warning"); return false; }
    const normalized = withAnnualSnapshot(newClient, CURRENT_YEAR());
    setClients((prev) => [...prev, normalized]);
    pendingLocalIds.current.add(normalized.id);
    setSaveStatus("saving");
    insertClientRemote(normalized).then((result) => {
      if (!result?.ok) {
        setSaveStatus("error");
        alert("Impossible d'enregistrer le nouveau dossier. Vérifiez votre connexion puis réessayez.");
        return;
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    });
  }, [myRole, showAppNotice]);
  const archiveClient=useCallback(async(id)=>{const c=clients.find(x=>x.id===id);if(!c)return false;updateClient(id,{statutDossier:"inactif",archiveDossier:{date:new Date().toISOString(),par:myRow?.id||null}});return true},[clients,updateClient,myRow?.id]);
  const unarchiveClient=useCallback(async(id)=>{
    if(!isAdmin){ showAppNotice("Seul l'Admin peut désarchiver un dossier.", "warning"); return false; }
    const c=clients.find(x=>x.id===id);
    if(!c || c.statutDossier!=="inactif") return false;
    updateClient(id,{statutDossier:"actif",archiveDossier:null});
    return true;
  },[clients,isAdmin,updateClient,showAppNotice]);
  const trashClient = useCallback(async (id) => {
    if (!isAdmin) { showAppNotice("Seul l'Admin peut mettre un dossier à la corbeille.", "warning"); return false; }
    const c = clients.find(x => x.id === id);
    if (!c) return false;
    updateClient(id, { corbeilleDossier: { date: new Date().toISOString(), par: myRow?.id || null } });
    if (activeClientTab === id) setActiveClientTab(null);
    return true;
  }, [clients, isAdmin, myRow?.id, activeClientTab, updateClient, showAppNotice]);
  const restoreClient = useCallback(async (id) => {
    if (!isAdmin) { showAppNotice("Seul l'Admin peut restaurer un dossier.", "warning"); return false; }
    const c = clients.find(x => x.id === id); if (!c?.corbeilleDossier) return false;
    updateClient(id, { corbeilleDossier: null }); return true;
  }, [clients, isAdmin, updateClient, showAppNotice]);
  const deleteClientPermanently = useCallback(async (id) => {
    if (!isAdmin) return false;
    const c = clients.find(x => x.id === id);
    if (!c || !c.corbeilleDossier || !confirm(`Supprimer définitivement « ${c.nom} » ?\n\nCette action est irréversible.`)) return false;
    try { await deleteClientRemote(id); setClients(prev => prev.filter(x => x.id !== id)); if (activeClientTab === id) setActiveClientTab(null); return true; }
    catch (e) { alert("Suppression impossible."); return false; }
  }, [clients, isAdmin, activeClientTab]);
  const trashClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => c.corbeilleDossier && (isAdmin || !myPortefeuilleId || c.portefeuilleId === myPortefeuilleId));
  }, [clients, isAdmin, myPortefeuilleId]);

  // Import Excel/CSV : crée ou met à jour plusieurs fiches clients d'un coup.
  // Rapprochement par SIREN si renseigné, sinon par nom (insensible à la casse).
  const importClients = useCallback((rows) => {
    if (!rows || !rows.length) return { created: 0, updated: 0 };
    let created = 0, updated = 0;
    setClients((prev) => {
      const next = [...prev];
      const keyOf = (c) => (c.siren && String(c.siren).trim()) || (c.nom || "").trim().toLowerCase();
      const byKey = new Map(next.map((c) => [keyOf(c), c]));
      const toInsert = [];
      const toUpdate = [];
      rows.forEach((row) => {
        const key = (row.siren && String(row.siren).trim()) || (row.nom || "").trim().toLowerCase();
        if (!key) return;
        const existing = byKey.get(key);
        if (existing) {
          const merged = { ...existing, ...row, id: existing.id };
          const idx = next.findIndex((c) => c.id === existing.id);
          next[idx] = merged;
          byKey.set(key, merged);
          toUpdate.push(merged);
          updated += 1;
        } else {
          const id = row.siren ? `siren-${row.siren}` : `c-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const createdClient = migrateClients([{ ...row, id }])[0];
          next.push(createdClient);
          byKey.set(key, createdClient);
          toInsert.push(createdClient);
          created += 1;
        }
      });
      setSaveStatus("saving");
      Promise.all([
        ...toInsert.map(async (c) => { pendingLocalIds.current.add(c.id); return { id: c.id, result: await insertClientRemote(c) }; }),
        ...toUpdate.map(async (c) => { pendingLocalIds.current.add(c.id); return { id: c.id, result: await updateClientRemote(c.id, c, Math.max(1, Number(c._version || 1))) }; }),
      ]).then((results) => {
        const versions = new Map(); let failure = false; let conflict = false;
        results.forEach(({ id, result }) => {
          pendingLocalIds.current.delete(id);
          if (result?.ok && result.version) versions.set(id, result.version);
          if (!result?.ok) { failure = true; conflict ||= !!result?.conflict; }
        });
        if (versions.size) setClients((all) => all.map((c) => versions.has(c.id) ? { ...c, _version: versions.get(c.id) } : c));
        if (conflict) {
          loadClientsFromSupabase().then((rows) => {
            if (!rows) return;
            const fresh = new Map(rows.map((row) => [row.id, migrateClients([row])[0]]));
            setClients((all) => all.map((c) => fresh.has(c.id) ? fresh.get(c.id) : c));
          });
          setSaveStatus("error");
          showAppNotice("Un ou plusieurs dossiers importés ont été modifiés ailleurs. Les versions récentes ont été rechargées.", "warning");
        } else if (failure) { setSaveStatus("error"); showAppNotice("L'import a été partiellement sauvegardé. Vérifiez votre connexion.", "error"); }
        else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 1200); }
      }).catch(() => {
        [...toInsert, ...toUpdate].forEach((c) => pendingLocalIds.current.delete(c.id));
        setSaveStatus("error"); showAppNotice("La sauvegarde de l'import a échoué. Vérifiez votre connexion.", "error");
      });
      return next;
    });
    return { created, updated };
  }, []);

  const renameTeamMember = useCallback((oldName, newName) => {
    if (!canManageTeam) { showAppNotice("Action réservée aux rôles de management.", "warning"); return; }
    if (!newName.trim() || newName === oldName) return;
    const member = team.find((t) => t.nom === oldName);
    if (member) {
      setTeam((prev) => prev.map((t) => (t.nom === oldName ? { ...t, nom: newName } : t)));
      pendingLocalTeamIds.current.add(member.id);
      updateTeamMemberRemote(member.id, { nom: newName });
    }
    setClients((prev) => {
      const next = prev.map((c) => ({
        ...c,
        collab: c.collab === oldName ? newName : c.collab,
        expert: c.expert === oldName ? newName : c.expert,
        chefMission: c.chefMission === oldName ? newName : c.chefMission,
      }));
      persistMany(next);
      return next;
    });
  }, [team, persistMany, canManageTeam, showAppNotice]);

  // Ajout manuel réservé à l'Admin (les collaborateurs rejoignent normalement en s'inscrivant eux-mêmes) :
  // utile pour un contact externe sans compte, ou pour dépanner.
  const addTeamMember = useCallback((nom, portefeuilleId, role) => {
    if (!isAdmin) { showAppNotice("Seul l’Admin peut ajouter manuellement un membre.", "warning"); return; }
    if (!nom.trim() || team.some((t) => t.nom === nom.trim())) return;
    const color = PALETTE[team.length % PALETTE.length];
    const member = { id: `t-${Date.now()}`, nom: nom.trim(), color, role: role || "collaborateur", statut: "actif", portefeuille_id: portefeuilleId || null };
    setTeam((prev) => [...prev, member]);
    pendingLocalTeamIds.current.add(member.id);
    insertTeamMemberRemote(member);
  }, [team, isAdmin, showAppNotice]);


  const refreshTeam = useCallback(async () => {
    const rows = await loadTeamFromSupabase();
    if (rows) setTeam(rows);
    return rows;
  }, []);

  const createDemoAccount = useCallback(async (payload) => {
    if (!isAdmin) throw new Error("Action réservée à l'Admin.");
    const result = await invokeDemoFunction("create", payload);
    await refreshTeam();
    return result;
  }, [isAdmin, refreshTeam]);

  const resetDemoAccount = useCallback(async (teamId) => {
    if (!isAdmin) throw new Error("Action réservée à l'Admin.");
    const result = await invokeDemoFunction("reset", { teamId });
    await refreshTeam();
    return result;
  }, [isAdmin, refreshTeam]);

  const disableDemoAccount = useCallback(async (teamId) => {
    if (!isAdmin) throw new Error("Action réservée à l'Admin.");
    const result = await invokeDemoFunction("disable", { teamId });
    await refreshTeam();
    return result;
  }, [isAdmin, refreshTeam]);

  const deleteDemoAccount = useCallback(async (teamId) => {
    if (!isAdmin) throw new Error("Action réservée à l'Admin.");
    const result = await invokeDemoFunction("delete", { teamId });
    await refreshTeam();
    return result;
  }, [isAdmin, refreshTeam]);

  const deleteTeamMember = useCallback((nom) => {
    if (!canManageTeam) { showAppNotice("Action réservée aux rôles de management.", "warning"); return; }
    const member = team.find((t) => t.nom === nom);
    setTeam((prev) => prev.filter((t) => t.nom !== nom));
    if (member) {
      pendingLocalTeamIds.current.add(member.id);
      deleteTeamMemberRemote(member.id);
    }
    setClients((prev) => {
      const next = prev.map((c) => ({
        ...c,
        collab: c.collab === nom ? "" : c.collab,
        expert: c.expert === nom ? "" : c.expert,
        chefMission: c.chefMission === nom ? "" : c.chefMission,
      }));
      persistMany(next);
      return next;
    });
  }, [team, persistMany, canManageTeam, showAppNotice]);

  // Modification générique d'une fiche équipe : rôle, portefeuille, validation d'une
  // demande en attente (statut -> actif). Réservé côté base aux Experts/Chefs de
  // mission (sur leur propre portefeuille) et à l'Admin (partout) — voir RLS "team_update".
  const updateTeamMember = useCallback(async (id, patch) => {
    if (!canManageTeam) { showAppNotice("Action réservée aux rôles de management.", "warning"); return false; }
    const target = team.find(t => t.id === id);
    if (!isAdmin && (patch?.role === "admin" || patch?.role === "expert" || target?.role === "admin" || target?.role === "super_admin")) { showAppNotice("Seul l’Admin peut gérer les comptes d’administration ou d’expertise.", "warning"); return false; }
    pendingLocalTeamIds.current.add(id);
    const ok = isSuperAdmin
      ? await updateSuperAdminTeamMemberRemote(id, patch)
      : await updateTeamMemberRemote(id, patch);
    pendingLocalTeamIds.current.delete(id);
    if (!ok) {
      showAppNotice("La validation n'a pas pu être enregistrée. Aucun accès n'a été activé.", "error");
      return false;
    }
    setTeam((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (isSuperAdmin) await refreshTeam();
    return true;
  }, [showAppNotice, canManageTeam, isAdmin, isSuperAdmin, team, refreshTeam]);

  // Création d'un nouveau portefeuille : réservée au Super Admin
const addPortefeuille = useCallback(async (nom, domaine) => {
  if (!nom.trim()) return null;

  try {
    const result = await insertPortefeuilleRemote({
      nom: nom.trim(),
      domaine: domaine?.trim()
        ? domaine.trim().toLowerCase()
        : null,
    });

    if (result?.error) {
      console.error(
        "Impossible de créer le portefeuille :",
        result.error.message
      );

      return null;
    }

    const portefeuille = result?.data;

    if (!portefeuille?.id) {
      console.error(
        "Création du portefeuille échouée : aucun ID retourné."
      );

      return null;
    }

    // Ajout uniquement après confirmation Supabase
    setPortefeuilles((prev) => {
      const exists = prev.some(
        (item) => item.id === portefeuille.id
      );

      if (exists) return prev;

      return [...prev, portefeuille];
    });

    return portefeuille.id;

  } catch (err) {

    console.error(
      "Erreur création portefeuille :",
      err?.message || err
    );

    return null;
  }
}, []);

  const archivePortefeuille = useCallback(async (id, reason = "Fin de contrat / désistement") => {
    const err = await archivePortefeuilleRemote(id, reason);
    if (err) { alert(`Impossible de résilier ce cabinet : ${err.message}`); return false; }
    setPortefeuilles(prev => prev.map(p => p.id === id ? { ...p, statut: "resilie", resiliation_motif: reason, resilie_at: new Date().toISOString() } : p));
    return true;
  }, []);

  const deletePortefeuille = useCallback(async (id) => {
    const err = await deletePortefeuilleRemote(id);
    if (err) { alert(`Suppression impossible : ${err.message}`); return false; }
    setPortefeuilles(prev => prev.filter(p => p.id !== id));
    return true;
  }, []);

  const myClients = useMemo(() => {
    if (!clients || !me) return [];
    if (isAdmin) return clients.filter(c => !c.corbeilleDossier);
    // La visibilité applicative suit le portefeuille, puis l'affectation métier.
    // La même règle est renforcée côté RLS Supabase.
    return clients.filter((c) => {
      if (c.corbeilleDossier) return false;
      if (myPortefeuilleId && c.portefeuilleId && c.portefeuilleId !== myPortefeuilleId) return false;
      const explicit = Array.isArray(c.accesDossier) ? c.accesDossier : [];
      // Les managers conservent la visibilité de leur portefeuille ; les autres
      // collaborateurs doivent être affectés ou explicitement autorisés.
      if (myRole === "expert" || myRole === "chef_mission") return true;
      if (explicit.length > 0) return explicit.some((a) => String(a.teamId) === String(myRow?.id));
      return c.collab === me || c.expert === me || c.chefMission === me || c.gestionnairePaie === me;
    });
  }, [clients, me, isAdmin, myPortefeuilleId]);

  useEffect(() => {
    const allowedIds = new Set(myClients.map((c) => String(c.id)));
    setOpenClientTabs((tabs) => tabs.filter((t) => allowedIds.has(String(t.id))));
    if (activeClientTab && !allowedIds.has(String(activeClientTab))) setActiveClientTab(null);
  }, [myClients, activeClientTab]);

  const myTasks = useMemo(() => {
    if (!myClients.length) return [];
    const events = computeFiscalEvents(myClients);
    const missionTasks = myClients.filter((c) => {
      const m = c.mission; if (!m) return false;
      const vals = Object.values(m); if (!vals.length) return false;
      return vals.filter(Boolean).length < vals.length;
    }).map((c) => ({ id: `${c.id}-mission`, client: c, category: "DP", label: "Checklist Dossier Permanent incomplète", date: new Date(), tone: "amber" }));
    return [...events, ...missionTasks].map((t) => ({ ...t, bucket: taskBucket(t.date) }));
  }, [myClients]);

  const echeanceAlerts = useMemo(() => computeEcheanceAlerts(myClients), [myClients]);

  // Même échéances, mais mises en forme comme des "tâches" pour s'afficher dans la page Mes tâches
  const autoTasksForPage = useMemo(() => myTasks.map((t) => ({
    id: `auto-${t.id}`,
    isAuto: true,
    client_id: t.client.id,
    nom: t.label,
    commentaire: t.category,
    statut: "a_faire",
    priorite: t.tone === "red" ? "urgente" : t.tone === "amber" ? "haute" : "normale",
    date_echeance: t.date ? t.date.toISOString().slice(0, 10) : null,
    responsable_id: null,
  })), [myTasks]);

  // Tâches réelles (table "tasks") visibles : celles du portefeuille du dossier
  // consulté (l'Admin, sans portefeuille attitré, voit tout).
  const archiveTasksDb = useMemo(() => { if(!tasksDb)return []; return isAdmin?tasksDb:tasksDb.filter(t=>!t.portefeuille_id||t.portefeuille_id===myPortefeuilleId); },[tasksDb,isAdmin,myPortefeuilleId]);

  const visibleTasksDb = useMemo(() => {
    if (!tasksDb) return [];
    if (isAdmin) return tasksDb.filter(t=>String(t.statut||"").toLowerCase()!=="archive");
    return tasksDb.filter((t) => String(t.statut||"").toLowerCase() !== "archive" && (!t.portefeuille_id || t.portefeuille_id === myPortefeuilleId));
  }, [tasksDb, isAdmin, myPortefeuilleId]);

  const handleCreateTask = useCallback(async (payload) => {
    const row = await createTask({ ...payload, portefeuille_id: payload.portefeuille_id || myPortefeuilleId || null, created_by: me });
    if (row) {
      auditProductAction("tasks", "create", { entityType: "task", entityId: row.id, metadata: { client_id: row.client_id, priorite: row.priorite } });
      if (row.date_echeance) scheduleFollowups("task", row.id, row.date_echeance, { label: row.nom });
      logActivity({ clientId: row.client_id, portefeuilleId: row.portefeuille_id, type: "tache", message: activityMessages.tacheCreee(row.nom), auteurId: myRow?.id });
      // Un ticket assigné doit prévenir immédiatement et visiblement son responsable.
      if (row.responsable_id) {
        const client = clients.find(c => String(c.id) === String(row.client_id));
        const deadline = row.date_echeance ? ` · échéance ${row.date_echeance}` : '';
        insertNotificationRemote({recipient_team_id: row.responsable_id,
                    client_id: row.client_id,
          client_nom: client?.nom || '',
          type: 'ticket_assigne',
          message: `🎫 Nouveau ticket assigné : ${row.nom}${client?.nom ? ` — ${client.nom}` : ''}${deadline}`,
        });
      }
    }
    return row;
  }, [myPortefeuilleId, me, myRow, clients]);

  const handleUpdateTask = useCallback(async (id, patch) => {
    const existing = tasksDb.find(t => String(t.id) === String(id));
    const manager = ["admin","expert","chef_mission"].includes(myRole);
    if (!existing || (!manager && String(existing.responsable_id || "") !== String(myRow?.id || ""))) {
      showAppNotice("Vous ne pouvez modifier que vos tâches affectées, sauf pour les rôles de management.", "warning");
      return null;
    }
    const row = await updateTask(id, patch);
    if (row) auditProductAction("tasks", patch.statut === "termine" ? "complete" : "update", { entityType: "task", entityId: row.id, metadata: patch });
    if (row?.date_echeance && Object.prototype.hasOwnProperty.call(patch, "date_echeance")) {
      scheduleFollowups("task", row.id, row.date_echeance, { label: row.nom, client_id: row.client_id });
    }
    if (row && patch.statut === "termine") {
      logActivity({ clientId: row.client_id, portefeuilleId: row.portefeuille_id, type: "tache", message: activityMessages.tacheTerminee(row.nom), auteurId: myRow?.id });
    }
    return row;
  }, [myRow, myRole, tasksDb, showAppNotice]);

  const handleArchiveTask=useCallback(async(task)=>{
    if(!task?.id||task.isAuto) return null;
    if (!["admin","expert","chef_mission"].includes(myRole)) { showAppNotice("L’archivage des tâches est réservé au management.", "warning"); return null; }
    const row=await archiveTask(task.id); if(row)setTasksDb(prev=>prev.map(t=>t.id===task.id?row:t)); return row;
  },[myRole,showAppNotice]);

  const handleCompleteTask = useCallback(async (task) => {
    const existing = tasksDb.find(t => String(t.id) === String(task?.id));
    const manager = ["admin","expert","chef_mission"].includes(myRole);
    if (!existing || (!manager && String(existing.responsable_id || "") !== String(myRow?.id || ""))) {
      showAppNotice("Vous ne pouvez terminer que vos tâches affectées, sauf pour les rôles de management.", "warning");
      return null;
    }
    const row = await completeTask(task.id);
    if (row) {
      auditProductAction("tasks", "complete", { entityType: "task", entityId: row.id });
      logActivity({ clientId: row.client_id, portefeuilleId: row.portefeuille_id, type: "tache", message: activityMessages.tacheTerminee(row.nom), auteurId: myRow?.id });
    }
    return row;
  }, [myRow, myRole, tasksDb, showAppNotice]);

  const handleDeleteTask = useCallback(async (id) => {
    if (!["admin","expert","chef_mission"].includes(myRole)) { showAppNotice("La suppression des tâches est réservée au management.", "warning"); return false; }
    const ok = await deleteTask(id);
    if (ok) setTasksDb(prev => prev.filter(t => String(t.id) !== String(id)));
    return ok;
  }, [myRole, showAppNotice]);

  const handleCreateLegal=useCallback(async(p)=>{const r=await createLegalRequest({...p,portefeuille_id:p.portefeuille_id||myPortefeuilleId||null,created_by:myRow?.id||null});if(r)setLegalRequests(x=>[r,...x.filter(a=>a.id!==r.id)]);return r},[myPortefeuilleId,myRow?.id]);
  const handleUpdateLegal=useCallback(async(id,p)=>{const r=await updateLegalRequest(id,p);if(r)setLegalRequests(x=>x.map(a=>a.id===id?r:a));return r},[]);
  const handleDeleteLegal=useCallback(async(id)=>{const ok=await deleteLegalRequest(id);if(ok)setLegalRequests(x=>x.filter(a=>a.id!==id));return ok},[]);

  // Ces dérivés/hook doivent être déclarés avant tous les retours conditionnels.
  // Sinon, le nombre/ordre des hooks change entre le rendu de chargement et le rendu normal.
  const openClientTab = useCallback((id) => openClientTabState(id, clients || []), [openClientTabState, clients]);
  const openAccountSection = openAccountSectionState;
  const navTo = navToState;
  const goBack = goBackState;

  if (loading || !team) {
    return (
      <div style={{ ...S.appShell, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <Loader2 className="spin" size={28} color={T.navy} />
        <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: "0.08em", color: T.inkMuted, textTransform: "uppercase" }}>Ouverture du registre…</div>
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (!myRow) {
    return (
      <AccountSyncScreen
        onRetry={() => { setLoading(true); loadTeamFromSupabase().then((t) => { setTeam(t || []); setLoading(false); }); }}
        onLogout={onLogout}
      />
    );
  }
  if (myRow.statut === "en_attente") {
    return <PendingScreen row={myRow} onLogout={onLogout} />;
  }
  if (!contractChecked) {
    return <AccountSyncScreen onRetry={() => window.location.reload()} onLogout={onLogout} />;
  }
  if (session?.user?.user_metadata?.requires_contract_after_validation && contractStatus?.statut !== "accepte") {
    return <ContractSignatureScreen
      row={myRow}
      onAccepted={async () => {
        await acceptMyCabinetContractRemote();
        await supabase.auth.refreshSession();
        setContractStatus({ ...(contractStatus || {}), statut: "accepte", accepted_at: new Date().toISOString() });
      }}
      onLogout={onLogout}
    />;
  }

  const meColor = team.find((t) => t.nom === me)?.color || T.navy;
  const activeClient = activeClientTab ? myClients.find((c) => c.id === activeClientTab) || null : null;

  // Navigation métier déléguée au hook pour garder CabinetApp centré sur l’orchestration.\n\n  // Équipe "visible" pour les listes déroulantes (assigner un collaborateur/expert/chef
  // de mission à un dossier) : uniquement les comptes actifs de mon portefeuille — l'Admin,
  // qui n'appartient à aucun portefeuille en particulier, voit tout le monde.
  const visibleTeam = (team || []).filter((t) => t.statut !== "en_attente" && (isAdmin || t.portefeuille_id === myPortefeuilleId));
  const myPortefeuille = (portefeuilles || []).find((p) => p.id === myPortefeuilleId) || null;

  if (demoExpired) {
    return <div style={{...S.appShell,alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,background:T.paper}}>
      <GlobalStyle/><Eye size={30} color={T.navy}/><div style={{fontFamily:T.serif,fontWeight:800,fontSize:20,color:T.ink}}>Compte démo expiré</div>
      <div style={{fontSize:12.5,color:T.inkMuted}}>Cet accès de démonstration n'est plus actif. Contactez l'administrateur de NOVACAB.</div>
    </div>;
  }

  return (
    <div style={S.appShell}>
      <GlobalStyle />
      <Sidebar view={view} setView={(v) => navTo(v)} administrationTab={administrationTab} setAdministrationTab={setAdministrationTab} me={me} meRole={myRole} mePortefeuille={myPortefeuille} team={team}
        onLogout={onLogout} counts={{ ...computeCounts(myClients), tachesActives: visibleTasksDb.filter((t) => t.statut !== "termine").length + autoTasksForPage.length }}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div style={S.main}>
        <TopBar search={search} setSearch={setSearch} saveStatus={saveStatus} me={me} meRole={myRole} meColor={meColor}
          cabinetName={displayCabinetName(myRow?.cabinet_nom || myPortefeuille?.nom)}
          openTabs={openClientTabs} activeTab={activeClientTab} onHome={goHome} onBack={goBack} canGoBack={canGoBack}
          onSelectTab={(id) => setActiveClientTab(id)} onCloseTab={closeClientTab}
          onNav={navTo} onOpenClient={openClientTab} onNewClient={() => setShowAddClient(true)} clients={myClients}
          notifCount={undefined}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          notifications={[...echeanceAlerts, ...notifications]} onMarkNotificationRead={markNotificationRead} onOpenClient2={openClientTab}
          accountMenuOpen={accountMenuOpen} setAccountMenuOpen={setAccountMenuOpen} onOpenAccount={openAccountSection} onLogout={onLogout}
 />
        <div className="px-3 py-3 md:px-7 md:py-6" style={{ ...S.content, padding: undefined }}>
          {activeClient ? (
            // key={activeClient.id} force le remontage complet du composant à chaque
            // changement d'onglet : les champs non-contrôlés (defaultValue) et l'état
            // interne (onglet secondaire "Infos / TVA / Bilan…") sont ainsi réinitialisés
            // avec les données du dossier sélectionné, au lieu de rester figés sur
            // l'ancien dossier affiché.
            <ClientEditorPage
  key={activeClient.id}
  client={activeClient}
  team={visibleTeam}
  me={me}
  meRole={myRole}
  meId={myRow?.id}
  portefeuilleId={myPortefeuilleId}
  onUpdate={updateClient}
  onDelete={isAdmin ? trashClient : undefined}
  onArchive={archiveClient}
  onUnarchive={unarchiveClient}
  isAdmin={isAdmin}
  onClose={() => closeClientTab(activeClient.id)}
  setView={navTo}
  tasks={visibleTasksDb}
  onCreateTask={handleCreateTask}
  onUpdateTask={handleUpdateTask}
  onCompleteTask={handleCompleteTask}
  onOpenTvaAuto={(clientId) => { setTvaAutoClientId(clientId); navTo("tva-auto"); }}
/>
          ) : (
            <>
              {view === "pilotage" && <PilotageView clients={myClients} tasks={[...visibleTasksDb, ...autoTasksForPage]} team={visibleTeam} me={me} onOpenClient={openClientTab} onView={navTo} />}
              {view === "permissions-matrix" && myRole === "admin" && <PermissionsMatrixView />}
              {view === "administration" && (myRole === "admin" || myRole === "expert") && (
                <AdministrationView clients={myClients} team={visibleTeam} tasks={visibleTasksDb} administrationRequests={administrationRequests} onUpdateAdministrationRequest={handleUpdateAdministrationRequest} onOpenClient={openClientTab} onNavigate={navTo} onUpdateClient={updateClient} activeTab={administrationTab} onTabChange={setAdministrationTab} setCollabQuickFilter={setCollabQuickFilter} setDashboardFilter={setDashboardFilter} />
              )}
              {view.startsWith("account-") && (
                <AccountPage section={view.replace("account-", "")} myRow={myRow} myPortefeuille={myPortefeuille} session={session} me={me} meRole={myRole}
                  cabinetName={displayCabinetName(myRow?.cabinet_nom || myPortefeuille?.nom)} onUpdateMember={updateTeamMember} onLogout={onLogout}
                  onSectionChange={(section) => openAccountSection(section)} />
              )}
              {isDemoAccount && !demoExpired && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412", display: "flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 650 }}>
                <Eye size={15} /> MODE DÉMO — données fictives. Ce compte est destiné à la démonstration de NOVACAB.
              </div>
            )}
              {view === "demandes-administration" && !["admin","super_admin"].includes(myRole) && <AdministrationRequestsView requests={administrationRequests} clients={myClients} portefeuilleId={myPortefeuilleId} onOpenClient={openClientTab} onCreate={handleCreateAdministrationRequest} />}
              {view === "dashboard" && (
                <Dashboard myClients={myClients} tasks={myTasks} me={me} meRole={myRole} team={visibleTeam}
                  cabinetName={displayCabinetName(myRow?.cabinet_nom || myPortefeuille?.nom)}
                  onNewClient={() => setShowAddClient(true)}
                  onOpenClient={(id) => { navTo("clients"); openClientTab(id); }} setView={navTo}
                  onSuperviseClick={(collab) => { setCollabQuickFilter(collab); setDashboardFilter(null); navTo("clients"); }}
                  onDashboardFilter={(filter) => { setDashboardFilter(filter); setCollabQuickFilter(null); navTo("clients"); }} />
              )}
              {view === "holdings" && <HoldingsView clients={clients} portefeuilleId={myRow?.portefeuille_id || ""} isSuperAdmin={isSuperAdmin} />}
                            {view === "clients" && (
                <ClientsRegistry clients={myClients} allClients={clients} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                  regimeFilter={regimeFilter} setRegimeFilter={setRegimeFilter} me={me} isAdmin={isAdmin}
                  collabQuickFilter={collabQuickFilter} setCollabQuickFilter={setCollabQuickFilter}
                  dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter}
                  selected={activeClientTab} setSelected={openClientTab} onAdd={() => setShowAddClient(true)}
                  onUpdate={updateClient}
onImport={importClients} onAddClient={addClient} />
              )}
              {view === "tva-auto" && (
                <Suspense fallback={<div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: T.inkSoft }}><Loader2 size={18} className="animate-spin" /> Chargement du module TVA…</div>}>
                  <TvaAutomation clients={myClients} me={me} onUpdate={updateClient} initialClientId={tvaAutoClientId} onBackToClient={(id) => { if (id) openClientTab(id); else navTo("tva"); }} />
                </Suspense>
              )}
              {view === "tva" && <TvaGrid clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                me={me}
                onCycle={(id, mois, val) => {
                  const c = clients.find(x => x.id === id);
                  if (!c) return;
                  const previous = (c.tvaMois?.[mois] || "").toUpperCase();
                  updateClient(id, { tvaMois: { ...(c.tvaMois || {}), [mois]: val } });
                  // Collaborateur passe la cellule à "Fait" -> notification persistante au chef de mission.
                  if (val === "FAIT" && previous !== "FAIT") {
                    const dest = c.chefMission_id
                      ? team.find((t) => t.id === c.chefMission_id)
                      : (team.find((t) => t.nom === c.chefMission) || team.find((t) => t.role === "chef_mission" && (!c.portefeuilleId || t.portefeuille_id === c.portefeuilleId)));
                    if (dest && dest.id !== myRow?.id) insertNotificationRemote({recipient_team_id: dest.id,                       client_id: c.id, client_nom: c.nom, type: "tva_fait",
                      message: `${me} a préparé la TVA de ${mois} pour ${c.nom} — à vérifier.`,
                    });
                  }
                  // Chef de mission confirme (Fait -> OK) -> notifie le collaborateur en retour
                  if (val === "OK" && previous === "FAIT" && c.collab && c.collab !== me) {
                    const dest = team.find((t) => t.nom === c.collab);
                    if (dest) insertNotificationRemote({recipient_team_id: dest.id,                       client_id: c.id, client_nom: c.nom, type: "tva_confirme",
                      message: `${me} a confirmé la TVA de ${mois} pour ${c.nom}.`,
                    });
                  }
                  // Collaborateur déclare (Contrôlé -> Validé) -> notifie le chef de mission qui avait contrôlé
                  if (val === "OK" && previous === "CONTROLE") {
                    const dest = c.chefMission_id
                      ? team.find((t) => t.id === c.chefMission_id)
                      : (team.find((t) => t.nom === c.chefMission) || team.find((t) => t.role === "chef_mission" && (!c.portefeuilleId || t.portefeuille_id === c.portefeuilleId)));
                    if (dest && dest.id !== myRow?.id) insertNotificationRemote({recipient_team_id: dest.id,                       client_id: c.id, client_nom: c.nom, type: "tva_declaree",
                      message: `${me} a déclaré la TVA de ${mois} pour ${c.nom}.`,
                    });
                  }
                }}
                onReview={(id, mois, decision, commentaire) => {
                  const c = clients.find(x => x.id === id);
                  if (!c) return;
                  const patch = { tvaMois: { ...(c.tvaMois || {}), [mois]: decision } };
                  const nextControle = { ...(c.tvaControle || {}) };
                  if (decision === "NON_VALIDE") {
                    nextControle[mois] = { commentaire: commentaire || "", par: me, date: new Date().toISOString() };
                  } else {
                    // Contrôle validé : la remarque précédente n'a plus lieu d'être
                    delete nextControle[mois];
                  }
                  patch.tvaControle = nextControle;
                  updateClient(id, patch);
                  // Le chef de mission / expert qui contrôle notifie le collaborateur du dossier,
                  // qu'il soit invité à déclarer (contrôlé et validé) ou à corriger avant de déclarer (non validé).
                  if (c.collab && c.collab !== me) {
                    const dest = team.find((t) => t.nom === c.collab);
                    if (dest) insertNotificationRemote({recipient_team_id: dest.id,                       client_id: c.id, client_nom: c.nom,
                      type: decision === "CONTROLE" ? "tva_confirme" : "tva_a_corriger",
                      message: decision === "CONTROLE"
                        ? `${me} a contrôlé et validé la TVA de ${mois} pour ${c.nom} — la déclaration peut être faite.`
                        : `${me} a contrôlé la TVA de ${mois} pour ${c.nom} : des modifications sont nécessaires avant la déclaration.${commentaire ? " " + commentaire : ""}`,
                    });
                  }
                }}
                onUpdate={updateClient} onOpenClient={openClientTab} onGenerateMail={(clientId) => { setMailClientId(clientId); navTo("mails-types"); }} />}
              {view === "super-overview" && isSuperAdmin && <SuperAdminOverview portefeuilles={portefeuilles || []} team={team || []} clients={clients || []} requests={legalRequests || []} onNav={navTo} />}
              {view === "super-cabinets" && isSuperAdmin && <EquipeView team={team} portefeuilles={portefeuilles || []} clients={clients} myRole={myRole} isAdmin={isAdmin} myPortefeuilleId={myPortefeuilleId} canManageTeam={canManageTeam} onAdd={addTeamMember} onRename={renameTeamMember} onDelete={deleteTeamMember} onUpdateMember={updateTeamMember} onAddPortefeuille={addPortefeuille} onArchivePortefeuille={archivePortefeuille} onDeletePortefeuille={deletePortefeuille} />}
              {view === "super-team" && isSuperAdmin && <EquipeView team={team} portefeuilles={portefeuilles || []} clients={clients} myRole={myRole} isAdmin={isAdmin} myPortefeuilleId={myPortefeuilleId} canManageTeam={canManageTeam} onAdd={addTeamMember} onRename={renameTeamMember} onDelete={deleteTeamMember} onUpdateMember={updateTeamMember} onAddPortefeuille={addPortefeuille} onArchivePortefeuille={archivePortefeuille} onDeletePortefeuille={deletePortefeuille} />}
              {view === "super-abonnements" && isSuperAdmin && <SuperAdminSubscriptionsView portefeuilles={portefeuilles || []} team={team || []} clients={clients || []} />}
              {view === "super-tva" && isSuperAdmin && <SuperAdminTvaDeadlinesView clients={clients || []} onUpdate={updateClient} />}
              {view === "super-audit" && isSuperAdmin && <AdminSecurityAudit session={session} me={me} meRole={myRole} />}
              {view === "super-tech" && isSuperAdmin && <SuperAdminTechnicalStatus clients={clients || []} team={team || []} portefeuilles={portefeuilles || []} />}
              {view === "mon-espace" && !isSuperAdmin && <CollaboratorSpaceView me={me} meRole={myRole} cabinetName={displayCabinetName(myRow?.cabinet_nom || myPortefeuille?.nom)} profile={collaboratorProfile || {}} onSave={saveCollaboratorProfile} />}
              {view === "mails-types" && <MailTypesView clients={myClients} initialClientId={mailClientId} me={me} cabinetName={displayCabinetName(myRow?.cabinet_nom || myPortefeuille?.nom)} />}
              {view === "bilans" && <BilansView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "acomptes" && <AcomptesView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "archives" && <ArchivesView clients={myClients} tasks={archiveTasksDb} isAdmin={isAdmin || myRole === "expert"} onUnarchive={unarchiveClient} onOpenClient={openClientTab} />}
              {view === "corbeille" && (isAdmin || myRole === "expert") && <CorbeilleView clients={trashClients} isAdmin={isAdmin} onRestore={restoreClient} onDeletePermanently={deleteClientPermanently} onOpenClient={openClientTab} />}
              {view === "super-demandes" && isSuperAdmin && <LegalServicesView clients={clients} requests={legalRequests} onCreate={handleCreateLegal} onUpdate={handleUpdateLegal} onDelete={handleDeleteLegal} />}
              {view === "prestations-juridiques" && <LegalServicesView clients={myClients} requests={legalRequests} onCreate={handleCreateLegal} onUpdate={handleUpdateLegal} onDelete={handleDeleteLegal} />}
              {view === "age" && <AgeAgoView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "applications" && <ApplicationsView session={session} activeClient={activeClient} />}
              {view === "revision" && (
  <RevisionView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} setView={navTo} />
)}
              {view === "mission" && <ChecklistDPView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "checklists" && <ChecklistsView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "regimes" && <RegimeChangeView clients={myClients} me={me} search={search} onUpdate={updateClient} />}
{view === "gestionnaire-paie" && <GestionnairePaieView clients={myClients} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "cotisations" && <CotisationsSocialesView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} />}
              {view === "social" && <SocialPaieCentre clients={myClients} team={visibleTeam} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} meRole={myRole} onUpdate={updateClient} portefeuilleId={myPortefeuilleId} onOpenClient={openClientTab} onCreateTask={handleCreateTask} />}
              {view === "acces-organismes" && canViewOrganismesSociaux(myRole) && <AccesOrganismesSociauxView clients={(clients || []).filter((c) => c.portefeuilleId === myPortefeuilleId)} portefeuilleId={myPortefeuilleId} me={me} meRole={myRole} onOpenClient={openClientTab} />}
              {view === "fiscal" && <SuiviFiscalView clients={myClients} team={team} />}
              {view === "resiliation" && <ResiliationsView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} meId={myRow?.id} portefeuilleId={myPortefeuilleId} onUpdate={updateClient} />}
{view === "missionsExcep" && <MissionsExceptionnellesView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={updateClient} team={team} />}
              {view === "reprise" && <ReprisesView clients={myClients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} meId={myRow?.id} portefeuilleId={myPortefeuilleId} onUpdate={updateClient} />}
              {view === "mes-taches" && (
                <TasksPage tasks={[...visibleTasksDb, ...autoTasksForPage]} clients={myClients} team={visibleTeam} me={me} myRow={myRow}
                  onCreate={handleCreateTask} onUpdate={handleUpdateTask} onComplete={handleCompleteTask} onArchive={handleArchiveTask}
                  onDelete={handleDeleteTask} onOpenClient={openClientTab} />
              )}
            {view === "planning" && (
              <PlanningView
                tasks={[...visibleTasksDb, ...autoTasksForPage].filter((t) => !["TVA", "IS", "CFE", "Bilan", "Clôture", "AGO"].includes(t.commentaire))}
                clients={myClients} me={me}
                onUpdate={handleUpdateTask} onOpenClient={openClientTab} />
            )}
              {view === "demo" && isAdmin && (
                <DemoAccountsView
                  team={team || []}
                  onCreate={createDemoAccount}
                  onReset={resetDemoAccount}
                  onDisable={disableDemoAccount}
                  onDelete={deleteDemoAccount}
                  showNotice={showAppNotice}
                />
              )}
              {view === "equipe" && (
                <EquipeView team={team} portefeuilles={portefeuilles || []} clients={clients}
                  myRole={myRole} isAdmin={isAdmin} myPortefeuilleId={myPortefeuilleId}
                  canManageTeam={canManageTeam}
                  onAdd={addTeamMember} onRename={renameTeamMember} onDelete={deleteTeamMember}
                  onUpdateMember={updateTeamMember} onAddPortefeuille={addPortefeuille} onArchivePortefeuille={archivePortefeuille} onDeletePortefeuille={deletePortefeuille} />
              )}
            </>
          )}
        </div>
      </div>

      {showAddClient && (
        <AddClientModal team={visibleTeam} me={me} portefeuilleId={myPortefeuilleId} onClose={() => setShowAddClient(false)}
          onCreate={(c) => { addClient(c); setShowAddClient(false); setOpenClientTabs((prev) => [...prev, { id: c.id, label: c.nom }]); setActiveClientTab(c.id); }} />
      )}
      <SaveToast status={saveStatus} />
      {appNotice && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 250,
          padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
          background: appNotice.tone === "warning" ? T.amberSoft : T.redSoft,
          color: appNotice.tone === "warning" ? T.amber : T.red, border: `1px solid ${T.line}`, boxShadow: T.shadowLg,
          maxWidth: "min(92vw, 620px)", textAlign: "center"
        }} className="reveal">{appNotice.message}</div>
      )}
    </div>
  );
}

export { CabinetApp };
