import { ExternalLink } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { SECTEURS_ACTIVITE, buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, REGIMES_TVA, REGIMES_TVA_LABELS } = Core;
import { FieldRow } from "./FieldRow.jsx";
import { SelectPill } from "./SelectPill.jsx";
import { TextInput } from "./TextInput.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function InfosTab({ client, team, onUpdate, setView }) {
  const teamNames = team.map((t) => t.nom);
  return (
    <div>
      <FieldRow label="SIREN"><TextInput defaultValue={client.siren} onCommit={(v) => onUpdate(client.id, { siren: v })} width={140} /></FieldRow>
      <FieldRow label="Honoraires actuels">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{client.honoraires?.montant || "—"}</span>
          {setView && (
            <button onClick={() => setView("honoraires")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${T.line}`, borderRadius: 8, padding: "3px 9px", fontSize: 11, color: T.navy, cursor: "pointer", fontWeight: 600 }}>
              <ExternalLink size={12} /> Modifier
            </button>
          )}
        </div>
      </FieldRow>
      <FieldRow label="Logiciel"><SelectPill value={client.logiciel} options={["MYUNISOFT", "QUADRA"]} onChange={(v) => onUpdate(client.id, { logiciel: v })} /></FieldRow>
      <FieldRow label="Lien SharePoint">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TextInput defaultValue={client.lienSharepoint} onCommit={(v) => onUpdate(client.id, { lienSharepoint: v })} placeholder="https://…sharepoint.com/…" width={200} align="left" />
          {client.lienSharepoint && (
            <a href={client.lienSharepoint} target="_blank" rel="noopener noreferrer" title="Ouvrir dans SharePoint"
              style={{ color: T.navy, display: "flex", alignItems: "center" }}>
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      </FieldRow>
      <FieldRow label="Forme juridique"><SelectPill value={client.formeJuridique} options={["EI", "EURL", "SARL", "SAS", "SASU", "SCI", "SCM", "SELARL", "SA", "SNC", "Association"]} onChange={(v) => onUpdate(client.id, { formeJuridique: v })} /></FieldRow>
      <FieldRow label="Régime fiscal"><SelectPill value={client.regimeFiscal} options={["IS", "IR"]} labels={{ IS: "IS — Impôt sur les sociétés", IR: "IR — Impôt sur le revenu" }} onChange={(v) => onUpdate(client.id, { regimeFiscal: v })} /></FieldRow>
      <FieldRow label="Catégorie fiscale"><SelectPill value={client.categorieFiscale || ""} options={["", "BIC", "BNC", "BA", "EI", "IS"]} labels={{ "": "Auto-détection", BIC: "BIC — bénéfices industriels et commerciaux", BNC: "BNC — bénéfices non commerciaux", BA: "BA — bénéfices agricoles", EI: "EI — entreprise individuelle", IS: "IS — société à l'IS" }} onChange={(v) => onUpdate(client.id, { categorieFiscale: v })} /></FieldRow>
      <FieldRow label="Capital social"><TextInput defaultValue={client.capital} onCommit={(v) => onUpdate(client.id, { capital: v })} placeholder="ex. 5 000 €" width={140} /></FieldRow>
      <FieldRow label="Code NAF / APE"><TextInput defaultValue={client.codeNaf} onCommit={(v) => onUpdate(client.id, { codeNaf: v.toUpperCase(), secteur: classifyNaf(v) })} placeholder="ex. 56.10A" width={140} /></FieldRow>
      <FieldRow label="Activité"><TextInput defaultValue={client.activite} onCommit={(v) => onUpdate(client.id, { activite: v })} placeholder="Information descriptive" width={200} align="left" /></FieldRow>
      <FieldRow label="Secteur">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
            background: (SECTEURS_ACTIVITE.find((s) => s.id === client.secteur)?.color || T.inkMuted) + "22",
            color: SECTEURS_ACTIVITE.find((s) => s.id === client.secteur)?.color || T.inkMuted,
          }}>
            {SECTEURS_ACTIVITE.find((s) => s.id === client.secteur)?.label || "Non classé"}
          </span>
          <SelectPill
            value={client.secteur}
            options={SECTEURS_ACTIVITE.map((s) => s.id)}
            labels={Object.fromEntries(SECTEURS_ACTIVITE.map((s) => [s.id, s.label]))}
            onChange={(v) => onUpdate(client.id, { secteur: v, secteurManuel: true })}
          />
        </div>
      </FieldRow>
      <FieldRow label="Date de création de la société"><input type="date" defaultValue={client.dateCreation || ""} onChange={(e) => onUpdate(client.id, { dateCreation: e.target.value })} style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} /></FieldRow>
      <FieldRow label="Premier exercice"><SelectPill value={client.typePremierExercice || "court_31_12"} options={["court_31_12", "long_personnalise"]} labels={{court_31_12:"31/12 de l'année de création", long_personnalise:"Exercice long / clôture personnalisée"}} onChange={(v) => onUpdate(client.id, { typePremierExercice: v })} /></FieldRow>
            <FieldRow label="Date de clôture d'exercice"><input type="date" defaultValue={client.dateCloture || ""} onChange={(e) => onUpdate(client.id, { dateCloture: e.target.value })} style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card }} /></FieldRow>
      <div style={{ height: 6 }} />
      <FieldRow label="Collaborateur"><SelectPill value={client.collab} options={teamNames} onChange={(v) => onUpdate(client.id, { collab: v })} /></FieldRow>
      <FieldRow label="Expert"><SelectPill value={client.expert} options={teamNames} onChange={(v) => onUpdate(client.id, { expert: v })} /></FieldRow>
      <FieldRow label="Chef de mission"><SelectPill value={client.chefMission} options={teamNames} onChange={(v) => {
        const chef = team.find((t) => t.nom === v);
        onUpdate(client.id, { chefMission: v, chefMission_id: chef?.id || "" });
      }} /></FieldRow>
      <FieldRow label="Régime TVA"><SelectPill value={client.tvaRegime} options={REGIMES_TVA} labels={REGIMES_TVA_LABELS} onChange={(v) => onUpdate(client.id, { tvaRegime: v })} /></FieldRow>
    </div>
  );
}

export { InfosTab };
