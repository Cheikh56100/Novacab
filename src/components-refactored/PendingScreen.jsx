import { Clock } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Reveal } from "./Reveal.jsx";
import { Shared } from "./shared.js";
const { T, S } = Shared;



/* ============================================================
   PENDING SCREEN — compte inscrit avec un email dont le domaine
   n'est rattaché à aucun portefeuille connu : en attente de
   validation par l'Admin (démarchage / devis / création manuelle).
   ============================================================ */
function PendingScreen({ row, onLogout }) {
  return (
    <div style={{ ...S.appShell, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: `radial-gradient(circle at 20% 15%, ${T.amberSoft} 0%, ${T.paper} 45%), radial-gradient(circle at 85% 85%, #F1F5F9 0%, ${T.paper} 40%)` }}>
      <GlobalStyle />
      <Reveal style={{ textAlign: "center", maxWidth: 460, padding: 36, background: T.card, borderRadius: T.radiusLg, boxShadow: T.shadowLg, border: `1px solid ${T.line}` }}>
        <img src="/novacab-mark.png" alt="NOVACAB" style={{ width: 62, height: 50, objectFit: "contain", margin: "0 auto 4px" }} />
        <div style={{ fontFamily: T.serif, fontWeight: 800, fontSize: 18, color: T.ink, marginBottom: 14 }}>NOVA<span style={{ color: "#1D9BF0" }}>CAB</span></div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.amber, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={20} color="#fff" strokeWidth={2.2} />
        </div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 18, margin: "0 0 8px", color: T.ink }}>Inscription en attente de validation</h1>
        <p style={{ color: T.inkMuted, fontSize: 12.5, lineHeight: 1.7, marginBottom: 10 }}>
          Merci {row.nom} — votre demande pour <strong style={{ color: T.navy, fontSize: 14 }}>{row.cabinet_nom || "votre cabinet"}</strong> est bien enregistrée.
        </p>
        <p style={{ color: T.inkMuted, fontSize: 12.5, lineHeight: 1.7, marginBottom: 22 }}>
          Notre équipe va prendre contact avec vous prochainement pour échanger sur votre cabinet et activer votre accès.
        </p>
        <button onClick={onLogout} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: T.inkMuted }}>Déconnexion</button>
      </Reveal>
    </div>
  );
}

export { PendingScreen };
