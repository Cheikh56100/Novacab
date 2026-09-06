import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canAccessView, canAccessAccountSection } from "../utils/access.js";

/**
 * Navigation state for the cabinet workspace.
 * Keeps browser persistence and tab/history semantics outside CabinetApp.
 */
export function useNavigationState({ canViewOrganismesSociaux, myRole }) {
  const savedNavigation = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("novacab-navigation") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isManagement = myRole === "admin" || myRole === "expert";
  const requestedInitialView = savedNavigation.view === "analysis-financiere" || savedNavigation.view === "sector-kpis"
    ? "applications"
    : (savedNavigation.view || (isManagement ? "administration" : "dashboard"));
  const initialView = canAccessView(myRole, requestedInitialView) ? requestedInitialView : "dashboard";
  const [view, setView] = useState(initialView);
  const [mailClientId, setMailClientId] = useState(null);
  const [tvaAutoClientId, setTvaAutoClientId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous");
  const [regimeFilter, setRegimeFilter] = useState("Tous");
  const [collabQuickFilter, setCollabQuickFilter] = useState(null);
  const [dashboardFilter, setDashboardFilter] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [openClientTabs, setOpenClientTabs] = useState(savedNavigation.openClientTabs || []);
  const [activeClientTab, setActiveClientTab] = useState(savedNavigation.activeClientTab || null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountSection, setAccountSection] = useState("profile");
  const initialHistory = (savedNavigation.viewHistory || []).map((v) => v === "analysis-financiere" || v === "sector-kpis" ? "applications" : v);
  const [viewHistory, setViewHistory] = useState(initialHistory);

  useEffect(() => {
    // Le rôle est parfois disponible quelques millisecondes après le montage.
    // Une fois connu, on applique le dernier espace utilisé, ou Administration
    // par défaut pour Admin / Expert sur une première connexion.
    if (!isManagement) {
      if (view === "administration" || view === "permissions-matrix") setView("dashboard");
      return;
    }
    const savedWorkspace = savedNavigation.workspace;
    if (savedWorkspace === "admin" && view !== "administration" && view !== "permissions-matrix") {
      setView("administration");
    } else if (!savedNavigation.view && view === "dashboard") {
      setView("administration");
    }
  }, [myRole]);

  useEffect(() => {
    try {
      localStorage.setItem("novacab-navigation", JSON.stringify({
        view,
        workspace: (view === "administration" || view === "permissions-matrix") ? "admin" : "workspace",
        openClientTabs,
        activeClientTab,
        viewHistory,
      }));
    } catch {}
  }, [view, openClientTabs, activeClientTab, viewHistory]);

  const openClientTab = useCallback((id, clients = []) => {
    const c = clients.find((x) => String(x.id) === String(id));
    if (!c) return;
    setOpenClientTabs((prev) => (prev.some((t) => t.id === id) ? prev : [...prev, { id, label: c.nom }]));
    setActiveClientTab(id);
  }, []);

  const closeClientTab = useCallback((id) => {
    setOpenClientTabs((prev) => {
      const closedIndex = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (activeClientTab === id) {
        const neighbor = next[closedIndex] || next[closedIndex - 1] || null;
        setActiveClientTab(neighbor ? neighbor.id : null);
      }
      return next;
    });
  }, [activeClientTab]);

  const goHome = useCallback(() => setActiveClientTab(null), []);

  const openAccountSection = useCallback((section) => {
    if (!canAccessAccountSection(myRole, section)) return;
    setAccountSection(section);
    setAccountMenuOpen(false);
    setActiveClientTab(null);
    setViewHistory((h) => (view.startsWith("account-") ? h : [...h, view]));
    setView(`account-${section}`);
  }, [view, myRole]);

  const navTo = useCallback((nextView) => {
    if (!canAccessView(myRole, nextView)) return;
    if (nextView === "acces-organismes" && !canViewOrganismesSociaux(myRole)) return;
    setViewHistory((h) => (nextView === view ? h : [...h, view]));
    setView(nextView);
    setActiveClientTab(null);
    if (nextView !== "clients") {
      setCollabQuickFilter(null);
      setDashboardFilter(null);
    }
  }, [canViewOrganismesSociaux, myRole, view]);

  const goBack = useCallback(() => {
    if (activeClientTab) {
      setActiveClientTab(null);
      return;
    }
    setViewHistory((h) => {
      const nextHistory = [...h];
      while (nextHistory.length) {
        const previous = nextHistory.pop();
        if (canAccessView(myRole, previous)) {
          setView(previous);
          return nextHistory;
        }
      }
      setView("dashboard");
      return [];
    });
  }, [activeClientTab, myRole]);

  return {
    view, setView,
    mailClientId, setMailClientId,
    tvaAutoClientId, setTvaAutoClientId,
    search, setSearch,
    roleFilter, setRoleFilter,
    regimeFilter, setRegimeFilter,
    collabQuickFilter, setCollabQuickFilter,
    dashboardFilter, setDashboardFilter,
    showAddClient, setShowAddClient,
    openClientTabs, setOpenClientTabs,
    activeClientTab, setActiveClientTab,
    sidebarCollapsed, setSidebarCollapsed,
    mobileMenuOpen, setMobileMenuOpen,
    accountMenuOpen, setAccountMenuOpen,
    accountSection, setAccountSection,
    viewHistory, setViewHistory,
    openClientTab, closeClientTab, goHome, openAccountSection, navTo, goBack,
    canGoBack: !!activeClientTab || viewHistory.length > 0,
  };
}
