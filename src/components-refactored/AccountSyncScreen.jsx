import { Loader2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Reveal } from "./Reveal.jsx";
import { Shared } from "./shared.js";
const { T, S } = Shared;
const { useEffect } = React;



/* ============================================================
   ACCOUNT SYNC SCREEN — cas rare où la fiche "team" (créée par le
   trigger à l'inscription) n'est pas encore visible côté client.
   ============================================================ */
function AccountSyncScreen({ onRetry, onLogout }) {
  useEffect(() => {
    const timer = setInterval(() => onRetry?.(), 2500);
    return () => clearInterval(timer);
  }, [onRetry]);
  return (
    <div style={{ ...S.appShell, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: `radial-gradient(circle at 20% 15%, ${T.navySoft} 0%, ${T.paper} 45%), radial-gradient(circle at 85% 85%, #F1F5F9 0%, ${T.paper} 40%)` }}>
      <GlobalStyle />
      <Reveal style={{ textAlign: "center", maxWidth: 420, padding: 36, background: T.card, borderRadius: T.radiusLg, boxShadow: T.shadowLg, border: `1px solid ${T.line}` }}>
        <Loader2 size={26} color={T.navy} className="spin" style={{ marginBottom: 14 }} />
        <h1 style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 17, margin: "0 0 8px", color: T.ink }}>Finalisation de votre compte…</h1>
        <p style={{ color: T.inkMuted, fontSize: 12.5, lineHeight: 1.6, marginBottom: 22 }}>
          Votre fiche collaborateur est en cours de création. Si ça persiste plus de quelques secondes, réessayez.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={onRetry} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: T.navy, color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>Réessayer</button>
          <button onClick={onLogout} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: T.inkMuted }}>Déconnexion</button>
        </div>
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </Reveal>
    </div>
  );
}

export { AccountSyncScreen };
