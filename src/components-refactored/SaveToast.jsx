import { Loader2, Check } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



/* ============================================================
   TOAST DE SAUVEGARDE — retour visuel clair après modification
   d'un champ (ex. Infos générales), en plus du petit indicateur
   discret dans la barre du haut.
   ============================================================ */
function SaveToast({ status }) {
  if (status !== "saved" && status !== "saving") return null;
  const saved = status === "saved";
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 200,
      display: "flex", alignItems: "center", gap: 8,
      padding: "9px 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600,
      background: saved ? T.green : T.card, color: saved ? "#fff" : T.inkMuted,
      border: saved ? "none" : `1px solid ${T.line}`,
      boxShadow: T.shadowLg,
    }} className="reveal">
      {saved ? <Check size={14} /> : <Loader2 size={14} className="spin" />}
      {saved ? "Enregistré" : "Enregistrement…"}
    </div>
  );
}

export { SaveToast };
