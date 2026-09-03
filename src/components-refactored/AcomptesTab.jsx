import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { PaymentLine } from "./PaymentLine.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function AcomptesTab({ client, onUpdate }) {
  const is = client.is || {}; const cfe = client.cfe || {};
  const toggleIs = (f) => onUpdate(client.id, { is: { ...is, [f]: !is[f] } });
  const toggleCfe = (f) => onUpdate(client.id, { cfe: { ...cfe, [f]: !cfe[f] } });
  const updatePayment = (tax, key, field, value) => {
    const source = tax === "is" ? is : cfe;
    onUpdate(client.id, { [tax]: { ...source, paiements: { ...(source.paiements || {}), [key]: { ...(source.paiements?.[key] || {}), [field]: value } } } });
  };
  const isConcerne = Number(is.montantN1) > 3000;
  const cfeConcerne = Number(cfe.montantN1) > 3000;
  const numInputStyle = { fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, width: 110, textAlign: "right" };
  return (
    <div>
      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "4px 0 8px" }}>Impôt sur les sociétés</h4>
      <FieldRow label="Montant IS N-1">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="number" defaultValue={is.montantN1 ?? ""} placeholder="0"
            onBlur={(e) => {
              const v = e.target.value;
              onUpdate(client.id, { is: { ...is, montantN1: v, concerne: Number(v) > 3000 } });
            }} style={numInputStyle} />
          <Stamped tone={isConcerne ? "amber" : "neutral"} small>{isConcerne ? "Concerné (> 3000€)" : "Non concerné"}</Stamped>
        </div>
      </FieldRow>
      <Panel title="Paiements IS">
        {[
          ["mars", "Acompte IS — mars"],
          ["juin", "Acompte IS — juin"],
          ["sept", "Acompte IS — septembre"],
          ["dec", "Acompte IS — décembre"],
          ["solde", "Solde IS"],
        ].map(([key, label]) => (
          <PaymentLine key={key} label={label} amount={is.paiements?.[key]?.montant ?? (key === "solde" ? "" : (Number(is.montantN1) > 3000 ? (Number(is.montantN1)/4).toFixed(2) : ""))} status={is.paiements?.[key]?.statut || (is[key] ? "paye" : "a_payer")}
            onAmountChange={(v) => updatePayment("is", key, "montant", v)}
            onStatusChange={(v) => updatePayment("is", key, "statut", v)} />
        ))}
      </Panel>
      <h4 style={{ fontFamily: T.serif, fontSize: 13, color: T.navy, margin: "20px 0 8px" }}>CFE</h4>
      <FieldRow label="Montant CFE N-1">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="number" defaultValue={cfe.montantN1 ?? ""} placeholder="0"
            onBlur={(e) => {
              const v = e.target.value;
              onUpdate(client.id, { cfe: { ...cfe, montantN1: v, concerne: Number(v) > 3000 } });
            }} style={numInputStyle} />
          <Stamped tone={cfeConcerne ? "amber" : "neutral"} small>{cfeConcerne ? "Concerné (> 3000€)" : "Non concerné"}</Stamped>
        </div>
      </FieldRow>
      <FieldRow label="Acompte juin"><ToggleBtn on={!!cfe.juin} onClick={() => toggleCfe("juin")} /></FieldRow>
      <FieldRow label="Solde décembre"><ToggleBtn on={!!cfe.dec} onClick={() => toggleCfe("dec")} /></FieldRow>
      <div style={{ height: 12 }} />
      <Panel title="Paiements CFE">
        {[["juin", "Acompte CFE — juin"], ["dec", "Solde CFE — décembre"]].map(([key, label]) => (
          <PaymentLine key={key} label={label} amount={cfe.paiements?.[key]?.montant ?? (key === "juin" && Number(cfe.montantN1)>3000 ? (Number(cfe.montantN1)/2).toFixed(2) : "")} status={cfe.paiements?.[key]?.statut || (cfe[key] ? "paye" : "a_payer")}
            onAmountChange={(v) => updatePayment("cfe", key, "montant", v)}
            onStatusChange={(v) => updatePayment("cfe", key, "statut", v)} />
        ))}
      </Panel>
    </div>
  );
}

export { AcomptesTab };
