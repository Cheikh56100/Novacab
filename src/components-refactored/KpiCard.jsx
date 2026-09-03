import { ArrowUpRight } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;


function KpiCard({ label, value, icon: Icon, tone, onClick, index = 0, linkLabel }) {
  const toneColor = tone === "red" ? T.red : tone === "amber" ? T.amber : tone === "green" ? T.green : T.navy;
  const toneSoft = tone === "red" ? T.redSoft : tone === "amber" ? T.amberSoft : tone === "green" ? T.greenSoft : T.navySoft;
  return (
    <Reveal index={index}>
      <div onClick={onClick} className={onClick ? "clickable" : ""} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: T.radiusLg, boxShadow: T.shadowSm, padding: "22px 24px" }}>
        <div style={{ marginBottom: 14, width: 38, height: 38, borderRadius: 10, background: toneColor, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} color="#FFFFFF" strokeWidth={2} /></div>
        <div style={{ fontFamily: T.serif, fontSize: 30, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: T.inkMuted, marginTop: 8, fontWeight: 500 }}>{label}</div>
        {onClick && (
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: T.navy, display: "flex", alignItems: "center", gap: 4 }}>
            {linkLabel || "Voir le détail"} <ArrowUpRight size={13} />
          </div>
        )}
      </div>
    </Reveal>
  );
}

export { KpiCard };
