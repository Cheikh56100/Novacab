import { Plus } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



/* ============================================================
   DESIGN TOKENS — voir la définition de T tout en haut du fichier
   ============================================================ */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; } html { font-size: 12px; } body { margin: 0; background: ${T.paper}; font-size: 11.5px; } ::selection { background: ${T.navySoft}; }
      .hoverRow:hover { background: ${T.paperDeep} !important; } .clickable { cursor: pointer; }
      .topTab { display:flex; align-items:center; gap:6px; padding:7px 12px 7px 14px; font-size:12.5px; font-weight:600; border-radius:8px 8px 0 0; cursor:pointer; white-space:nowrap; }
      .topIconBtn { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9px; border:none; background:none; cursor:pointer; color:${T.inkMuted}; position:relative; flex-shrink:0; }
      .topIconBtn:hover { background:${T.paperDeep}; color:${T.ink}; }
      .scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } .scrollbar::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 8px; }
      input, select, button, textarea { font-family: ${T.sans}; }
      @media (max-width: 900px) { .novacab-mail-grid { grid-template-columns: 1fr !important; } }
      @media (max-width: 560px) { .novacab-mail-recipient-grid { grid-template-columns: 1fr !important; } }
      button { transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease, opacity .15s ease, border-color .15s ease; }
      button.clickable:hover, div.clickable:hover { transform: translateY(-1px); }
      button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible { outline: 2px solid ${T.navy}; outline-offset: 2px; }
      .filterField { border: 1px solid ${T.line}; background: ${T.card}; transition: border-color .15s ease, box-shadow .15s ease; }
      .filterField:hover { border-color: ${T.navy}; }
      .filterField:focus, .filterField:focus-visible { border-color: ${T.navy}; box-shadow: 0 0 0 3px ${T.navySoft}; outline: none; }
      .sideGroupHeader { transition: color .15s ease; cursor: pointer; }
      .sideGroupHeader:hover { color: #17345F !important; }
      .sideNavItem { transition: background-color .15s ease, color .15s ease; }
      .sideNavItem:hover { background: ${T.sidebarBg2} !important; color: #17345F !important; }
      .statusToggle { transition: background-color .15s ease, color .15s ease, border-color .15s ease; cursor: pointer; }
      .statusToggle:hover { filter: brightness(0.96); }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      .reveal { animation: fadeInUp .55s cubic-bezier(.16,.84,.44,1) both; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `}</style>
  );
}

export { GlobalStyle };
