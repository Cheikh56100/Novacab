import { Contact } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { SelectPill } from "./SelectPill.jsx";
import { TextInput } from "./TextInput.jsx";
import { ConcerneToggle } from "./ConcerneToggle.jsx";



function SocialTab({ client, onUpdate }) {
  const s = client.social || {};
  const patch = (f) => onUpdate(client.id, { social: { ...s, ...f } });
  const alert = seuilEffectifAlert(s.effectif);
  return (
    <div>
      <FieldRow label="Concerné par le social">
        <ConcerneToggle on={!!s.concerne} onChange={(v) => patch({ concerne: v })} />
      </FieldRow>
      <FieldRow label="Effectif">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TextInput defaultValue={s.effectif} onCommit={(v) => patch({ effectif: v })} width={60} />
          {alert && <Stamped tone={alert.tone} small>{alert.label}</Stamped>}
        </div>
      </FieldRow>
      <FieldRow label="Cabinet de paie"><TextInput defaultValue={s.cabinetPaie} onCommit={(v) => patch({ cabinetPaie: v })} width={160} align="left" /></FieldRow>
      <FieldRow label="Contact gestionnaire — nom"><TextInput defaultValue={s.gestionnaireNom} onCommit={(v) => patch({ gestionnaireNom: v })} width={160} align="left" /></FieldRow>
      <FieldRow label="Contact gestionnaire — adresse"><TextInput defaultValue={s.gestionnaireAdresse} onCommit={(v) => patch({ gestionnaireAdresse: v })} width={220} align="left" /></FieldRow>
      <FieldRow label="Contact gestionnaire — email"><TextInput defaultValue={s.gestionnaireEmail} onCommit={(v) => patch({ gestionnaireEmail: v })} width={180} align="left" /></FieldRow>
      <FieldRow label="Contact gestionnaire — tél."><TextInput defaultValue={s.gestionnaireTel} onCommit={(v) => patch({ gestionnaireTel: v })} width={140} align="left" /></FieldRow>
      <FieldRow label="Convention collective"><TextInput defaultValue={s.conventionCollective} onCommit={(v) => patch({ conventionCollective: v })} width={180} align="left" /></FieldRow>
      <FieldRow label="Régime social du dirigeant">
        <SelectPill value={s.regimeDirigeant} options={["assimile_salarie", "tns"]} labels={{ assimile_salarie: "Assimilé salarié", tns: "TNS" }} onChange={(v) => patch({ regimeDirigeant: v })} />
      </FieldRow>
    </div>
  );
}

export { SocialTab };
