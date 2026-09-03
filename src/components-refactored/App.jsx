import { Loader2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { CabinetApp } from "./CabinetApp.jsx";
import { NewPasswordPage } from "./NewPasswordPage.jsx";
import { AuthPage } from "./AuthPage.jsx";
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Shared } from "./shared.js";
const { T, S, supabase } = Shared;
const { useState, useEffect } = React;


function App() {
  useEffect(() => {
    const saved = localStorage.getItem("novacab-theme") || "light";
    const apply = (value) => document.documentElement.classList.toggle("dark", value === "dark");
    if (saved === "system") {
      apply(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else apply(saved === "dark" ? "dark" : "light");
  }, []);
  const [session, setSession] = useState(undefined); // undefined = vérification en cours, null = déconnecté
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ ...S.appShell, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, background: T.paper }}>
        <GlobalStyle />
        <Loader2 className="spin" size={26} color={T.navy} />
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", color: T.inkMuted, textTransform: "uppercase" }}>Vérification de la session…</div>
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (recoveryMode) return <NewPasswordPage onDone={() => setRecoveryMode(false)} />;
  if (!session) return <AuthPage />;
  return <CabinetApp session={session} onLogout={() => supabase.auth.signOut()} />;
}

export { App };
