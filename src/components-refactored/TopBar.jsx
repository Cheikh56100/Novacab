import { Loader2, Receipt, FileWarning, Landmark, Building2, ClipboardCheck, Search, X, Check, Plus, CalendarDays, CalendarRange, Settings2, Menu, Bell, ArrowLeft } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { AccountMenu } from "./AccountMenu.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useEffect, useMemo, useRef } = React;



/* ============================================================
   TOP BAR
   ============================================================ */
function TopBar({ search, setSearch, saveStatus, me, meRole, meColor, cabinetName, openTabs, activeTab, onHome, onBack, canGoBack, onSelectTab, onCloseTab, onNav, onOpenClient, onNewClient, clients, notifCount, onOpenMobileMenu, notifications, onMarkNotificationRead, onOpenClient2, accountMenuOpen, setAccountMenuOpen, onOpenAccount, onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const pickerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") { setSearch(""); setSearchOpen(false); e.currentTarget.blur(); return; }
    if (e.key !== "Enter") return;
    const q = search.trim().toLowerCase();
    if (!q) return;
    // APRÈS
const matches = clients.filter((c) => c.nom.toLowerCase().includes(q) || String(c.siren || "").includes(q));
    if (matches.length >= 1) {
      onOpenClient(matches[0].id);
      setSearch("");
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const onDocClick = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
   // APRÈS
const list = q ? clients.filter((c) => c.nom.toLowerCase().includes(q) || String(c.siren || "").includes(q)) : clients;
    return list.slice(0, 40);
  }, [clients, pickerQuery]);

  const toolIcons = [
    { key: "tva", icon: Receipt, title: "TVA — CA3/CA12", onClick: () => onNav("tva") },
    { key: "bilans", icon: FileWarning, title: "Bilans", onClick: () => onNav("bilans") },
    { key: "acomptes", icon: Landmark, title: "Acomptes IS / CFE", onClick: () => onNav("acomptes") },
    { key: "age", icon: Building2, title: "AGE / AGO", onClick: () => onNav("age") },
    { key: "mission", icon: ClipboardCheck, title: "Dossiers en accueil", onClick: () => onNav("mission") },
    { key: "fiscal", icon: CalendarDays, title: "Suivi fiscal", onClick: () => onNav("fiscal") },
    { key: "planning", icon: CalendarRange, title: "Mon planning", badge: notifCount, onClick: () => onNav("planning") },
    { key: "equipe", icon: Settings2, title: "Équipe", onClick: () => onNav("equipe") },
  ];

  // La cloche ne contient que les notifications réelles.
  // Les échéances du planning sont affichées uniquement sur l'icône Planning.
  const persistedNotifications = (notifications || []).filter((n) => !n.isEcheance);
  const unread = persistedNotifications.filter((n) => !n.lu).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, background: T.card, borderBottom: `1px solid ${T.line}` }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px", height: 46, gap: 2 }}>
        <button onClick={onOpenMobileMenu} title="Menu" className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-inksoft hover:bg-app mr-1 shrink-0">
          <Menu size={18} strokeWidth={2} />
        </button>
        {canGoBack && (
          <button className="topIconBtn" onClick={onBack} title="Retour" style={{ marginRight: 2 }}>
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={onHome}
          title={`Retour à la vue d'ensemble — ${cabinetName || "NOVACAB"}`}
          className="flex items-center gap-2.5 ml-1 px-3 py-1.5 rounded-xl border border-line bg-card hover:border-accent hover:bg-accent-soft transition-all cursor-pointer min-w-[185px] max-w-[260px] text-left"
        >
          <span className="w-7 h-7 rounded-lg bg-accent-soft border border-line flex items-center justify-center shrink-0">
            <Building2 size={15} className="text-accent" strokeWidth={2.1} />
          </span>
          <span className="min-w-0">
            <span className="block text-[8.5px] uppercase tracking-wider text-inkmuted font-semibold">Cabinet</span>
            <span className="block text-[12px] font-extrabold text-ink truncate">{cabinetName || "NOVACAB"}</span>
          </span>
        </button>
        <div className="scrollbar" style={{ display: "flex", alignItems: "center", overflowX: "auto", gap: 2, maxWidth: "44vw" }}>
          {openTabs.map((t) => (
            <div key={t.id} className="topTab" onClick={() => onSelectTab(t.id)} style={{
              background: activeTab === t.id ? T.paperDeep : "transparent", color: activeTab === t.id ? T.navy : T.inkSoft,
              borderBottom: activeTab === t.id ? `2px solid ${T.navy}` : "2px solid transparent",
            }}>
              <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
              <X size={12} onClick={(e) => { e.stopPropagation(); onCloseTab(t.id); }} style={{ opacity: 0.6 }} />
            </div>
          ))}
        </div>

        <div ref={pickerRef} style={{ position: "relative" }}>
          <button className="topIconBtn" title="Ouvrir un dossier existant" onClick={() => setPickerOpen((s) => !s)}><Plus size={15} /></button>
          {pickerOpen && (
            <div style={{ position: "absolute", top: 36, left: 0, width: 280, background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, boxShadow: T.shadowLg, zIndex: 30, padding: 8 }}>
              <input autoFocus value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="Sélectionner un dossier…"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.line}`, fontSize: 12, marginBottom: 6 }} />
              <div className="scrollbar" style={{ maxHeight: 260, overflowY: "auto" }}>
                {pickerResults.map((c) => (
                  <div key={c.id} className="hoverRow clickable" onClick={() => { onOpenClient(c.id); setPickerOpen(false); setPickerQuery(""); }}
                    style={{ padding: "7px 8px", borderRadius: 7, fontSize: 12.5, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{c.nom}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkMuted }}>{c.siren}</span>
                  </div>
                ))}
                {pickerResults.length === 0 && <div style={{ padding: "10px 8px", fontSize: 12, color: T.inkMuted, fontStyle: "italic" }}>Aucun dossier trouvé.</div>}
              </div>
              <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 6, paddingTop: 6 }}>
                <div className="hoverRow clickable" onClick={() => { setPickerOpen(false); setPickerQuery(""); onNewClient && onNewClient(); }}
                  style={{ padding: "7px 8px", borderRadius: 7, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, color: T.navy, fontWeight: 600 }}>
                  <Plus size={13} /> Nouveau client
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.mono, fontSize: 10.5, color: T.inkMuted, marginRight: 8 }}>
            {saveStatus === "saving" && <><Loader2 size={12} className="spin" /> enreg.…</>}
            {saveStatus === "saved" && <><Check size={12} color={T.green} /> enregistré</>}
          </div>
          {searchOpen ? (
            <div className="relative flex-[0_1_260px] hidden sm:block mr-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-inkmuted" />
              <input ref={searchInputRef} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown}
                onBlur={() => !search && setSearchOpen(false)}
                placeholder="Rechercher un dossier, un SIREN…"
                className="input-field !rounded-full !py-1.5 !pl-8 !pr-16 !bg-app text-xs w-full" />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9.5px] font-mono text-inkmuted bg-card border border-line rounded px-1.5 py-0.5">Échap</kbd>
            </div>
          ) : (
            <button onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 0); }} title="Rechercher (⌘K)"
              className="topIconBtn hidden sm:inline-flex mr-1" aria-label="Rechercher">
              <Search size={16} strokeWidth={1.9} />
            </button>
          )}
          <button className="sm:hidden topIconBtn" title="Rechercher" onClick={() => setSearchOpen((s) => !s)}><Search size={16} strokeWidth={1.9} /></button>

          <div className="relative hidden md:block">
            <button onClick={() => setNotifOpen((s) => !s)} title="Notifications" className="topIconBtn"><Bell size={16} strokeWidth={1.9} />
              {!!unread && <span className="absolute top-1 right-1 bg-badge-red-text text-white text-[9px] font-bold rounded-full px-[4px] leading-[13px]">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-9 w-80 card p-3 z-30 max-h-96 overflow-y-auto scrollbar">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-ink">Notifications</div>
                  {persistedNotifications.length > 0 && (
                    <span className="text-[10px] text-inkmuted">{persistedNotifications.length} récentes</span>
                  )}
                </div>

                {persistedNotifications.length === 0 && (
                  <div className="text-xs text-inkmuted italic px-2 py-2">Aucune notification pour le moment.</div>
                )}

                {persistedNotifications.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-inkmuted px-1 mb-1">Notifications récentes</div>
                    {persistedNotifications.map((n) => (
                      <div key={n.id} onClick={() => { onMarkNotificationRead?.(n.id); if (n.client_id && onOpenClient2) onOpenClient2(n.client_id); setNotifOpen(false); }}
                        className="hoverRow clickable text-xs rounded-lg p-2 cursor-pointer flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${n.lu ? "bg-line" : "bg-badge-red-text"}`} />
                        <div className="min-w-0">
                          <div className={n.lu ? "text-inkmuted" : "text-ink font-medium"}>{n.message}</div>
                          <div className="text-[10px] text-inkmuted mt-0.5">{new Date(n.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    ))}
                    {persistedNotifications.length >= 30 && (
                      <div className="border-t border-line mt-2 pt-2 text-[10px] text-inkmuted text-center">Affichage des 30 notifications les plus récentes.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {toolIcons.map((ic) => {
            const Icon = ic.icon;
            return (
              <button key={ic.key} className="hidden md:inline-flex topIconBtn" title={ic.title} onClick={ic.onClick}>
                <Icon size={16} strokeWidth={1.9} />
                {!!ic.badge && (
                  <span style={{ position: "absolute", top: 2, right: 2, background: T.amber, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 999, padding: "0 4px", lineHeight: "13px" }}>{ic.badge}</span>
                )}
              </button>
            );
          })}
          <div className="ml-1.5 shrink-0"><AccountMenu me={me} meRole={meRole} cabinetName={cabinetName} open={accountMenuOpen} onToggle={() => setAccountMenuOpen((v) => !v)} onSelect={onOpenAccount} onLogout={onLogout} /></div>
        </div>
      </div>
      <style>{`.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export { TopBar };
