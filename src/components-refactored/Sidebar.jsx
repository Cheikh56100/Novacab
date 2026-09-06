import { LayoutGrid, Users, Receipt, FileWarning, Landmark, Building2, ClipboardCheck, Search, ChevronRight, X, UserCircle2, ChevronDown, RefreshCw, History, CalendarDays, CalendarRange, Settings2, ChevronLeft, ShieldCheck, LogOut, Mail, Briefcase, UserCheck, Eye, Contact, Scale, WalletCards, Shield, Trash2, TrendingUp } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T, ROLE_LABELS, displayCabinetName } = Shared;
const { useState, useEffect } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



function Sidebar({ view, setView, me, meRole, mePortefeuille, team, onLogout, counts, collapsed, setCollapsed, mobileOpen, setMobileOpen, administrationTab, setAdministrationTab }) {
  const isSuperAdmin = meRole === "super_admin";
    const MANAGEMENT_ROLES = ["admin", "super_admin", "expert", "chef_mission"];
  const SUPER_ADMIN_ONLY = ["super_admin"];
  const GROUPS = [
    {
      id: "pilotage-quotidien", label: "Pilotage & quotidien",
      items: [
        { id: "planning", label: "Mon planning", icon: CalendarRange },
        { id: "mes-taches", label: "Mes tâches", icon: ClipboardCheck },
        { id: "pilotage", label: "Pilotage cabinet", icon: LayoutGrid, roles: MANAGEMENT_ROLES },
        { id: "equipe", label: "Équipe", icon: Settings2, roles: MANAGEMENT_ROLES },
        { id: "demo", label: "Comptes démo", icon: Eye, roles: ["admin", "super_admin"] },
        { id: "mon-espace", label: "Mon espace collaborateur", icon: UserCircle2, roles: ["admin", "expert", "chef_mission", "collaborateur", "gestionnaire_paie"] },
      ],
    },
    {
      id: "novacab-admin", label: "Administration NOVACAB", roles: SUPER_ADMIN_ONLY,
      items: [
        { id: "equipe", label: "Cabinets & équipes", icon: Settings2, roles: SUPER_ADMIN_ONLY },
        { id: "super-demandes", label: "Demandes NOVACAB", icon: Scale, roles: SUPER_ADMIN_ONLY },
        { id: "super-tva", label: "Échéances TVA", icon: CalendarDays, roles: SUPER_ADMIN_ONLY },
        { id: "super-audit", label: "Journal d’audit", icon: ShieldCheck, roles: SUPER_ADMIN_ONLY },
        { id: "super-tech", label: "État technique", icon: Settings2, roles: SUPER_ADMIN_ONLY },
        { id: "super-abonnements", label: "Abonnements", icon: Receipt, roles: SUPER_ADMIN_ONLY },
        { id: "admin-collaborateurs", label: "Portefeuilles collaborateurs", icon: Users, roles: SUPER_ADMIN_ONLY },
        { id: "demo", label: "Comptes démo", icon: Eye, roles: SUPER_ADMIN_ONLY },
      ],
    },
    {
      id: "clients-missions", label: "Clients & missions",
      items: [
        { id: "clients", label: "Registre clients", icon: Users, badge: counts.total },
        { id: "demandes-administration", label: "Demandes à l’administration", icon: Mail, roles: ["expert","chef_mission","collaborateur","gestionnaire_paie"] },
        { id: "holdings", label: "Gestion des Holdings", icon: Building2, roles: MANAGEMENT_ROLES },
        { id: "regimes", label: "Changements de régime", icon: RefreshCw, roles: MANAGEMENT_ROLES },
        {
          id: "evenements-client", label: "Événements client", icon: CalendarDays,
          children: [
            { id: "resiliation", label: "Résiliations", icon: FileWarning },
            { id: "reprise", label: "Reprises", icon: RefreshCw },
            { id: "missionsExcep", label: "Missions exceptionnelles", icon: Briefcase },
          ],
        },
        { id: "checklists", label: "Checklists DA / DP", icon: ClipboardCheck, roles: ["admin","expert","chef_mission","collaborateur"] },
      ],
    },
    {
      id: "compta-fiscalite", label: "Comptabilité & fiscalité",
      items: [
        { id: "revision", label: "Révision", icon: Search, roles: ["admin","expert","chef_mission","collaborateur"] },
        { id: "tva", label: "TVA (CA3 / CA12)", icon: Receipt, badge: counts.tvaAlert, badgeTone: "amber", roles: ["admin","expert","chef_mission","collaborateur"] },
        { id: "acomptes", label: "Impôts & cotisations", icon: Landmark, roles: ["admin","expert","chef_mission","collaborateur"] },
        { id: "bilans", label: "Bilans", icon: FileWarning, badge: counts.bilanRetard, badgeTone: "red", roles: ["admin","expert","chef_mission","collaborateur"] },
        { id: "fiscal", label: "Suivi fiscal", icon: CalendarDays, roles: ["admin","expert","chef_mission","collaborateur"] },

      ],
    },
    {
      id: "social-juridique", label: "Social & juridique",
      subgroups: [
        {
          id: "social", label: "Social",
          items: [
            { id: "social", label: "Suivi social", icon: UserCheck, roles: ["admin","expert","chef_mission","gestionnaire_paie"] },
            { id: "cotisations", label: "Cotisations sociales", icon: Landmark, roles: ["admin","expert","chef_mission","gestionnaire_paie"] },
            { id: "gestionnaire-paie", label: "Gestionnaire de paie", icon: Contact, roles: ["admin","expert","chef_mission","gestionnaire_paie"] },
            { id: "acces-organismes", label: "Accès organismes sociaux", icon: ShieldCheck, roles: MANAGEMENT_ROLES },
          ],
        },
        {
          id: "juridique", label: "Juridique",
          items: [
            { id: "prestations-juridiques", label: "Prestations juridiques", icon: Scale, roles: MANAGEMENT_ROLES },
            { id: "age", label: "Assemblées (AGE / AGO)", icon: Building2, badge: counts.ageAlert, badgeTone: "amber", roles: MANAGEMENT_ROLES },
          ],
        },
      ],
    },
    {
      id: "cabinet-outils", label: "Cabinet & outils",
      items: [
        { id: "applications", label: "Applications", icon: LayoutGrid },
        { id: "mails-types", label: "Mails types", icon: Mail },
        { id: "archives", label: "Archives / exercices", icon: History },
        { id: "corbeille", label: "Corbeille", icon: Trash2, roles: ["admin", "expert"] },
      ],
    },
  ];

  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [openChildren, setOpenChildren] = useState(() => new Set());
  const [openAdminFolder, setOpenAdminFolder] = useState("Suivi de production");
  const toggleGroup = (groupId) => setOpenGroups((prev) => {
    const next = new Set(prev);
    next.has(groupId) ? next.delete(groupId) : next.add(groupId);
    return next;
  });

  const isAllowed = (item) => !item.roles || item.roles.includes(meRole);
  const flattenItems = (items = []) => items.flatMap((it) => it.children?.length ? [...it.children] : [it]);
  const groupItems = (g) => g.subgroups ? g.subgroups.flatMap((sg) => flattenItems(sg.items)) : flattenItems(g.items);
  const groupOf = (v) => GROUPS.find((g) => groupItems(g).some((it) => it.id === v))?.id;

  // Finition UX : on ne retire aucun élément de navigation. On ouvre
  // simplement le groupe contenant l’écran actif afin que l’utilisateur
  // comprenne immédiatement où il se trouve après une navigation profonde.
  useEffect(() => {
    const activeGroup = groupOf(view);
    if (activeGroup) {
      setOpenGroups((prev) => prev.has(activeGroup) ? prev : new Set([...prev, activeGroup]));
    }
    const activeChildParents = GROUPS.flatMap((g) => (g.items || [])).filter((it) =>
      Array.isArray(it.children) && it.children.some((child) => child.id === view)
    ).map((it) => it.id);
    if (activeChildParents.length) {
      setOpenChildren((prev) => new Set([...prev, ...activeChildParents]));
    }
  }, [view]);

  const meColor = team.find((t) => t.nom === me)?.color || T.navy;

  const badgeToneCls = (tone) => tone === "red" ? "bg-badge-red-bg text-badge-red-text" : tone === "amber" ? "bg-badge-amber-bg text-badge-amber-text" : "bg-accent-soft text-accent-deep";

  // isMobile=true force toujours l'affichage déplié (le mode "réduit" n'a de sens que sur desktop)
  const SidebarInner = ({ isMobile }) => {
    const isCollapsed = isMobile ? false : collapsed;
    const NavButton = ({ it, indent }) => {
      const hasChildren = Array.isArray(it.children) && it.children.length > 0;
      const childActive = hasChildren && it.children.some((child) => view === child.id);
      const active = view === it.id || childActive; const Icon = it.icon;
      return (
        <button onClick={() => { if (hasChildren) { setOpenChildren((prev) => { const next = new Set(prev); next.has(it.id) ? next.delete(it.id) : next.add(it.id); return next; }); } else { setView(it.id); if (isMobile) setMobileOpen?.(false); } }} title={it.label}
          aria-current={active ? "page" : undefined}
          className={`nav-item relative w-full ${isCollapsed ? "justify-center px-0" : `justify-start ${indent ? "pl-6" : ""}`} ${active ? "nav-item-active" : ""}`}>
          {active && !isCollapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent-deep" />}
          <Icon size={15} strokeWidth={2} className="shrink-0" />
          {!isCollapsed && <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-left">{it.label}</span>}
          {!isCollapsed && !!it.badge && (
            <span className={`font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeToneCls(it.badgeTone)}`}>{it.badge}</span>
          )}
          {!isCollapsed && hasChildren && (
            <ChevronRight size={13} className={`shrink-0 transition-transform ${openChildren.has(it.id) ? "rotate-90" : ""}`} />
          )}
        </button>
      );
    };
    return (
      <div className={`h-full flex-shrink-0 text-inksoft flex flex-col py-5 px-3 border-r border-line transition-[width] duration-200 ${isCollapsed ? "w-[76px]" : "w-[258px]"}`} style={{background:T.sidebarBg}}>
        <div className={`flex items-center gap-2.5 pb-4 mb-1 border-b border-line ${isCollapsed ? "justify-center px-0" : "px-1.5"}`}>
          <img src="/novacab-mark.png" alt="NOVACAB" className="w-9 h-9 object-contain shrink-0 rounded-lg" />
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-extrabold tracking-tight text-ink">NOVACAB</div>
              <div className="font-mono text-[8px] text-inkmuted leading-tight">TOUT VOTRE CABINET. UN SEUL PILOTE. ⭐</div>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileOpen?.(false)} className="ml-auto text-inkmuted hover:text-ink">
              <X size={18} />
            </button>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
            className={`flex items-center gap-1.5 mb-3 bg-transparent border border-line rounded-lg text-inkmuted cursor-pointer hover:text-ink hover:border-accent transition-colors ${isCollapsed ? "justify-center w-full py-1.5" : "justify-end px-2.5 py-1"}`}>
            <ChevronLeft size={14} className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
            {!isCollapsed && <span className="text-[11px] font-medium">Réduire</span>}
          </button>
        )}
        <nav className="flex flex-col gap-1 overflow-y-auto">
          {(!isSuperAdmin && (meRole === "admin" || meRole === "expert")) && (
            <div className={`mt-1 mb-2 rounded-2xl border ${view === "administration" || view === "permissions-matrix" || view === "pilotage" ? "border-accent bg-accent-soft/70" : "border-line bg-app/80"} overflow-hidden`}>
              {!isCollapsed && (
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.13em] font-extrabold text-accent-deep">
                      <ShieldCheck size={13}/> Espace actuel
                    </div>
                    <span className="text-[8.5px] font-bold text-inkmuted">{meRole === "expert" ? "Expert-comptable" : "Admin"}</span>
                  </div>
                  <div className="mt-1 text-[12px] font-extrabold text-ink">{view === "administration" || view === "permissions-matrix" ? "Administration & Direction" : "Espace opérationnel"}</div>
                  <div className="mt-0.5 text-[10px] text-inkmuted leading-relaxed">Deux espaces, un seul cabinet.</div>
                </div>
              )}
              <div className={`${isCollapsed ? "p-1" : "p-1.5"} flex ${isCollapsed ? "flex-col" : "flex-row"} gap-1`}>
                <button onClick={() => { setAdministrationTab?.("pilotage"); setView("dashboard"); if (isMobile) setMobileOpen?.(false); }} title="Vue comptable / cabinet"
                  className={`flex-1 flex items-center gap-2 ${isCollapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2.5"} rounded-xl text-left transition-colors ${view === "pilotage" ? "bg-accent text-white shadow-sm" : "text-ink hover:bg-accent-soft/60"}`}>
                  <LayoutGrid size={15} className="shrink-0"/>
                  {!isCollapsed && <span className="text-[10.5px] font-extrabold">Vue comptable</span>}
                </button>
                <button onClick={() => { setAdministrationTab?.("pilotage"); setView("administration"); if (isMobile) setMobileOpen?.(false); }} title="Vue administration & direction"
                  className={`flex-1 flex items-center gap-2 ${isCollapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2.5"} rounded-xl text-left transition-colors ${view === "administration" || view === "permissions-matrix" ? "bg-accent text-white shadow-sm" : "text-ink hover:bg-accent-soft/60"}`}>
                  <WalletCards size={15} className="shrink-0"/>
                  {!isCollapsed && <span className="text-[10.5px] font-extrabold">Vue admin</span>}
                </button>
              </div>
            </div>
          )}

          {/* En Vue admin, la sidebar devient dédiée au centre de pilotage : aucun menu métier général ne vient la noyer. */}
          {!isSuperAdmin && (meRole === "admin" || meRole === "expert") && (view === "administration" || view === "permissions-matrix") ? (
            <div className="flex flex-col gap-1">
              {!isCollapsed && <div className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-[.13em] font-extrabold text-inkmuted">Centre de pilotage</div>}
              {[
                {label:"Dossiers & missions", icon:Users, items:[["missions-exceptionnelles-admin","Missions exceptionnelles",Briefcase],["resiliations-admin","Résiliations",FileWarning],["entrees","Entrées de mission",ChevronRight],["sorties","Sorties de mission",ChevronRight]]},
                {label:"Suivi de production", icon:FileWarning, items:[["bilans-admin","Tableau des bilans",FileWarning],["pilotage","Vue d’ensemble",LayoutGrid],["echeancier","Échéancier",CalendarDays],["planning-admin","Planning de production",CalendarRange]]},
                {label:"Finance & honoraires", icon:WalletCards, items:[["facturation","Facturation",Receipt],["budgets-admin","Budgets & échéances",CalendarDays],["relances","Relances",Mail],["rentabilite","Honoraires & rentabilité",TrendingUp],["rejets","Rejets",RefreshCw],["ebics","EBICS",Landmark],["box","Box",Briefcase]]},
                {label:"Équipe & organisation", icon:Users, items:[["equipe-admin","Équipe",Users],["charge-admin","Charge de travail",TrendingUp],["repartition-admin","Répartition des dossiers",Briefcase],["couts","Coûts & abonnements",WalletCards],["contrats","Fournisseurs & contrats",ClipboardCheck],["licences","Licences",Users]]},
                {label:"Pilotage & contrôle", icon:ShieldCheck, items:[["alertes","Centre des alertes",Eye],["archives-demandes","Archives des demandes",History],["reporting","Reporting",Receipt],["controle","Contrôle interne",ShieldCheck],["journal","Journal des actions",History]]}
              ].map((folder) => {
                const FolderIcon = folder.icon;
                const activeFolder = folder.items.some(([id]) => administrationTab === id);
                const expanded = isCollapsed || openAdminFolder === folder.label || activeFolder;
                return <div key={folder.label} className={`rounded-xl border ${activeFolder ? "border-accent/50 bg-accent-soft/20" : "border-line/70 bg-app/40"} overflow-hidden mb-1.5`}>
                  {!isCollapsed && <button type="button" onClick={() => setOpenAdminFolder((current) => current === folder.label ? "" : folder.label)} className="w-full flex items-center gap-2 px-2.5 py-2 text-[9px] uppercase tracking-[.08em] font-extrabold text-inkmuted hover:text-ink hover:bg-app/60">
                    <FolderIcon size={13}/><span className="flex-1 text-left">{folder.label}</span><ChevronDown size={11} className={`transition-transform ${expanded ? "" : "-rotate-90"}`}/>
                  </button>}
                  {expanded && <div className="px-1 pb-1">{folder.items.map(([id,label,Icon]) => <button type="button" key={id} onClick={() => { setAdministrationTab?.(id); setOpenAdminFolder(folder.label); setView("administration"); if (isMobile) setMobileOpen?.(false); }} title={label} className={`nav-item relative w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} ${view === "administration" && administrationTab === id ? "nav-item-active" : ""}`}>
                    {view === "administration" && administrationTab === id && !isCollapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent-deep" />}<Icon size={15} strokeWidth={2} className="shrink-0" />{!isCollapsed && <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-left">{label}</span>}
                  </button>)}</div>}
                </div>;
              })}
              {meRole === "admin" && (
                <button onClick={() => { setView("permissions-matrix"); if (isMobile) setMobileOpen?.(false); }} title="Matrice des droits"
                  className={`mt-2 border-t border-line/70 pt-2 nav-item relative w-full ${isCollapsed ? "justify-center px-0" : "justify-start"} ${view === "permissions-matrix" ? "nav-item-active" : ""}`}>
                  <Shield size={15} className="shrink-0" />
                  {!isCollapsed && <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-left">Matrice des droits</span>}
                </button>
              )}
            </div>
          ) : (
            <>
              <NavButton it={{ id: isSuperAdmin ? "super-overview" : "dashboard", label: isSuperAdmin ? "Vue globale NOVACAB" : "Vue d'ensemble", icon: LayoutGrid }} />
              {!isSuperAdmin && (meRole === "admin" || meRole === "expert") && view !== "pilotage" && (
                <div className="sr-only" aria-hidden="true" />
              )}
              <div className="h-1.5" />
              {(isSuperAdmin ? GROUPS.filter((g) => g.id === "novacab-admin") : GROUPS.filter((g) => !g.roles || g.roles.includes(meRole))).map((g) => {
                const isOpen = isCollapsed || openGroups.has(g.id);
                return (
                  <div key={g.id}>
                    {!isCollapsed && (
                      <button onClick={() => toggleGroup(g.id)}
                        className="flex items-center gap-1.5 w-full bg-transparent border-none px-3 pt-3 pb-2 nav-group-title text-[#17345F] hover:text-[#10294A] transition-colors cursor-pointer">
                        <span className="flex-1 text-left">{g.label}</span>
                        <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? "" : "-rotate-90"}`} />
                      </button>
                    )}
                    {isOpen && (
                      <div className="flex flex-col gap-0.5">
                        {g.subgroups ? g.subgroups.map((sg) => {
                          const subgroupOpen = isCollapsed || openGroups.has(`${g.id}:${sg.id}`) || sg.items.some((it) => it.id === view || (it.children || []).some((c) => c.id === view));
                          const toggleSubgroup = () => setOpenGroups((prev) => {
                            const next = new Set(prev);
                            const key = `${g.id}:${sg.id}`;
                            next.has(key) ? next.delete(key) : next.add(key);
                            return next;
                          });
                          return <div key={sg.id}>
                            {!isCollapsed && <button onClick={toggleSubgroup} className="flex items-center gap-1.5 w-full bg-transparent border-none px-3 py-1.5 text-[10px] font-bold text-inkmuted cursor-pointer"><span className="flex-1 text-left">{sg.label}</span><ChevronDown size={11} className={`transition-transform ${subgroupOpen ? "" : "-rotate-90"}`}/></button>}
                            {subgroupOpen && sg.items.filter(isAllowed).map((it) => <NavButton key={it.id} it={it}/>) }
                          </div>;
                        }) : g.items.filter(isAllowed).map((it) => <NavButton key={it.id} it={it}/>) }
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>
        <div className="mt-auto pt-3.5 border-t border-line flex flex-col gap-1.5">
          <div title={mePortefeuille ? `Cabinet : ${displayCabinetName(mePortefeuille.nom)}` : "Aucun cabinet"}
            className={`flex items-center gap-2 w-full bg-app border border-line rounded-[11px] text-ink ${isCollapsed ? "justify-center p-1.5" : "justify-start px-2 py-2"}`}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0" style={{ background: meColor }}>{me?.[0]}</span>
            {!isCollapsed && (
              <div className="text-left overflow-hidden">
                <div className="text-[11.5px] font-bold whitespace-nowrap overflow-hidden text-ellipsis">{me}</div>
                <div className="text-[10px] text-inkmuted whitespace-nowrap overflow-hidden text-ellipsis">
                  {ROLE_LABELS[meRole] || meRole}{mePortefeuille ? ` · ${displayCabinetName(mePortefeuille.nom)}` : ""}
                </div>
              </div>
            )}
          </div>
          {onLogout && (
            <button onClick={onLogout} title="Déconnexion"
              className={`flex items-center gap-2 w-full bg-transparent border-none cursor-pointer rounded-[10px] text-red-500 text-[11.5px] font-semibold hover:bg-red-50 transition-colors ${isCollapsed ? "justify-center p-1.5" : "justify-start px-2 py-1.5"}`}>
              <LogOut size={14} />
              {!isCollapsed && <span>Déconnexion</span>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop : sidebar fixe */}
      <div className="hidden md:block"><SidebarInner isMobile={false} /></div>
      {/* Mobile : tiroir (drawer) avec overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen?.(false)} />
          <div className="relative z-10 h-full shadow-2xl"><SidebarInner isMobile={true} /></div>
        </div>
      )}
    </>
  );
}

export { Sidebar };
