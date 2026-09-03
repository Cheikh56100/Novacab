import { KeyRound } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, ACCES_CATEGORIES } = Core;
import { AccesCategoryPanel } from "./AccesCategoryPanel.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function AccesTab({ client, onUpdate, canEdit = true }) {
  const acces = client.acces || {};
  const patchCategory = (key, list) => { if (canEdit) onUpdate(client.id, { acces: { ...acces, [key]: list } }); };
  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.inkMuted, background: T.navySoft, padding: "8px 12px", borderRadius: 9, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <KeyRound size={14} color={T.navy} style={{ flexShrink: 0 }} />
        Ces informations sont sensibles : elles ne sont visibles que par les collaborateurs ayant accès à ce dossier. Pensez à changer les mots de passe partagés régulièrement.
      </div>
      {ACCES_CATEGORIES.map((cat, i) => (
        <div key={cat.key}>
          <AccesCategoryPanel category={cat} entries={acces[cat.key]} onUpdate={(list) => patchCategory(cat.key, list)} canEdit={canEdit} />
          {i < ACCES_CATEGORIES.length - 1 && <div style={{ height: 14 }} />}
        </div>
      ))}
    </div>
  );
}

export { AccesTab };
