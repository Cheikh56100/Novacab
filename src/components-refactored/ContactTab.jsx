import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Panel } from "./Panel.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { TextInput } from "./TextInput.jsx";



function ContactTab({ client, onUpdate }) {
  const contact = client.contact || {};
  const patch = (field, value) => onUpdate(client.id, { contact: { ...contact, [field]: value } });
  return (
    <div>
      <Panel title="Coordonnées du client">
        <FieldRow label="Nom du contact"><TextInput defaultValue={contact.contactNom} onCommit={(v) => patch("contactNom", v)} placeholder="Nom et prénom" width={220} align="left" /></FieldRow>
        <FieldRow label="Fonction"><TextInput defaultValue={contact.contactFonction} onCommit={(v) => patch("contactFonction", v)} placeholder="Dirigeant, comptable…" width={220} align="left" /></FieldRow>
        <FieldRow label="Téléphone"><TextInput defaultValue={contact.telephone} onCommit={(v) => patch("telephone", v)} placeholder="06 00 00 00 00" width={180} /></FieldRow>
        <FieldRow label="E-mail"><TextInput defaultValue={contact.email} onCommit={(v) => patch("email", v)} placeholder="contact@societe.fr" width={240} align="left" /></FieldRow>
        <FieldRow label="Adresse"><TextInput defaultValue={contact.adresse} onCommit={(v) => patch("adresse", v)} placeholder="Numéro et rue" width={280} align="left" /></FieldRow>
        <FieldRow label="Code postal"><TextInput defaultValue={contact.codePostal} onCommit={(v) => patch("codePostal", v)} placeholder="75000" width={100} /></FieldRow>
        <FieldRow label="Ville"><TextInput defaultValue={contact.ville} onCommit={(v) => patch("ville", v)} placeholder="Paris" width={180} align="left" /></FieldRow>
      </Panel>
    </div>
  );
}

export { ContactTab };
