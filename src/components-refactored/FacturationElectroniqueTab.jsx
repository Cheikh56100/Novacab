import { Receipt, Eye, EyeOff, KeyRound } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { FieldRow } from "./FieldRow.jsx";
import { TextInput } from "./TextInput.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;

const inputStyle = {
  fontFamily: T.sans,
  fontSize: 12,
  padding: "8px 10px",
  borderRadius: 9,
  border: `1px solid ${T.line}`,
  background: T.card,
  color: T.ink,
  outline: "none",
};

const { useState } = React;


function FacturationElectroniqueTab({ client, onUpdate }) {
  const fe = client.facturationElectronique || {
    mandatAutoriseCabinet: null, plateformeChoisiePar: "", plateforme: "",
    inscritAnnuaire: null, annuaireDetails: "", acces: { url: "", identifiant: "", motDePasse: "", notes: "" }
  };
  const patch = (changes) => onUpdate(client.id, { facturationElectronique: { ...fe, ...changes } });
  const patchAcces = (changes) => patch({ acces: { ...(fe.acces || {}), ...changes } });
  const [showPassword, setShowPassword] = useState(false);
  const choixCabinet = fe.mandatAutoriseCabinet === true;
  const choixClient = fe.mandatAutoriseCabinet === false;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Receipt size={17} color={T.navy} />
        <h4 style={{ fontFamily: T.serif, fontSize: 14, color: T.navy, margin: 0 }}>Facturation électronique</h4>
      </div>
      <div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 18 }}>
        Suivi du mandat, de la plateforme retenue, de l'inscription dans l'annuaire et des accès nécessaires au dossier.
      </div>

      <FieldRow label="Mandat signé autorisant le cabinet à choisir la plateforme ?">
        <select value={fe.mandatAutoriseCabinet === null ? "" : fe.mandatAutoriseCabinet ? "oui" : "non"}
          onChange={(e) => {
            const v = e.target.value === "" ? null : e.target.value === "oui";
            patch({ mandatAutoriseCabinet: v, plateformeChoisiePar: v === true ? "cabinet" : v === false ? "client" : "" });
          }} style={{ ...inputStyle, width: 180 }}>
          <option value="">À renseigner</option><option value="oui">Oui</option><option value="non">Non</option>
        </select>
      </FieldRow>

      {choixCabinet && <div style={{ fontSize: 11.5, color: T.green, background: T.greenSoft, padding: "8px 10px", borderRadius: 8, margin: "0 0 10px" }}>
        Le mandat permet au cabinet de choisir la plateforme pour le compte de la société.
      </div>}
      {choixClient && <div style={{ fontSize: 11.5, color: T.amber, background: T.amberSoft, padding: "8px 10px", borderRadius: 8, margin: "0 0 10px" }}>
        Le client doit choisir sa plateforme et communiquer son choix au cabinet.
      </div>}

      <FieldRow label={choixCabinet ? "Plateforme choisie par le cabinet" : choixClient ? "Plateforme choisie et communiquée par le client" : "Plateforme retenue"}>
        <TextInput defaultValue={fe.plateforme || ""} onCommit={(v) => patch({ plateforme: v })}
          placeholder={choixClient ? "Plateforme communiquée par le client" : "Nom de la plateforme"} width={280} align="left" />
      </FieldRow>
      <FieldRow label="Société inscrite dans l'annuaire ?">
        <select value={fe.inscritAnnuaire === null ? "" : fe.inscritAnnuaire ? "oui" : "non"}
          onChange={(e) => patch({ inscritAnnuaire: e.target.value === "" ? null : e.target.value === "oui" })}
          style={{ ...inputStyle, width: 180 }}>
          <option value="">À vérifier</option><option value="oui">Oui</option><option value="non">Non</option>
        </select>
      </FieldRow>
      <FieldRow label="Référence / commentaire annuaire">
        <TextInput defaultValue={fe.annuaireDetails || ""} onCommit={(v) => patch({ annuaireDetails: v })} placeholder="Date, statut ou précision" width={280} align="left" />
      </FieldRow>

      <div style={{ borderTop: `1px solid ${T.line}`, margin: "22px 0 16px" }} />
      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "0 0 5px", display: "flex", alignItems: "center", gap: 6 }}><KeyRound size={15} /> Accès à la plateforme</h4>
      <div style={{ fontSize: 11.5, color: T.inkMuted, marginBottom: 12 }}>Identifiants utiles pour accéder à la plateforme de facturation électronique.</div>
      <FieldRow label="URL / lien de connexion"><TextInput defaultValue={fe.acces?.url || ""} onCommit={(v) => patchAcces({ url: v })} placeholder="https://..." width={300} align="left" /></FieldRow>
      <FieldRow label="Identifiant / e-mail"><TextInput defaultValue={fe.acces?.identifiant || ""} onCommit={(v) => patchAcces({ identifiant: v })} placeholder="Identifiant de connexion" width={280} align="left" /></FieldRow>
      <FieldRow label="Mot de passe">
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type={showPassword ? "text" : "password"} defaultValue={fe.acces?.motDePasse || ""} onBlur={(e) => patchAcces({ motDePasse: e.target.value })}
            placeholder="Mot de passe" style={{ ...inputStyle, width: 220 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Masquer" : "Afficher"}
            style={{ background: T.paperDeep, border: `1px solid ${T.line}`, borderRadius: 8, padding: "7px 9px", cursor: "pointer", color: T.inkMuted }}>
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </FieldRow>
      <FieldRow label="Notes sur les accès">
        <textarea defaultValue={fe.acces?.notes || ""} onBlur={(e) => patchAcces({ notes: e.target.value })} rows={3}
          placeholder="Double authentification, personne de contact, procédure de récupération…"
          style={{ width: "100%", padding: 9, borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 12, background: T.card, resize: "vertical" }} />
      </FieldRow>
    </div>
  );
}

export { FacturationElectroniqueTab };
