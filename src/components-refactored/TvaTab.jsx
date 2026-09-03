import { FileSpreadsheet } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, TVA_PERIODICITES, TVA_PERIODICITE_LABELS, REGIMES_TVA, REGIMES_TVA_LABELS, MOIS_ORDER, QUARTER_END_MONTHS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { SelectPill } from "./SelectPill.jsx";
import { TextInput } from "./TextInput.jsx";
import { PaymentLine } from "./PaymentLine.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useEffect } = React;



function TvaTab({ client, onUpdate, onOpenTvaAuto }) {
  const defaultMonth = client.tvaRegime === "CA12" ? "Mai" : currentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  useEffect(() => { setSelectedMonth(defaultMonth); }, [client.id, defaultMonth]);
  const currentMonth = client.tvaRegime === "CA12" ? "Mai" : selectedMonth;
  const currentStatus = effectiveTvaStatus(client, currentMonth);
  const currentNote = client.tvaControle?.[currentMonth]?.commentaire || "";
  const detailKey = currentMonth;
  const d = client.tvaDetails?.[detailKey] || {};
  const patchDetails = (field, value) => onUpdate(client.id, { tvaDetails: { ...(client.tvaDetails || {}), [detailKey]: { ...d, [field]: value } } });
  const monthOptions = client.tvaRegime === "CA12"
    ? ["Mai"]
    : MOIS_ORDER.filter((m) => client.tvaRegime !== "CA3" || client.tvaPeriodicite !== "trimestrielle" || QUARTER_END_MONTHS.includes(m));
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 14px",marginBottom:14,border:`1px solid ${T.line}`,borderRadius:12,background:T.navySoft}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:10,color:T.inkMuted,textTransform:"uppercase",letterSpacing:.6,fontWeight:800}}>Préparation automatisée</div>
          <div style={{fontSize:13,fontWeight:800,color:T.navy,marginTop:2}}>TVA Auto & Pré-comptabilité</div>
        </div>
        <button type="button" onClick={()=>onOpenTvaAuto?.(client.id)} style={{display:"inline-flex",alignItems:"center",gap:6,background:T.navy,color:"#fff",border:"none",borderRadius:9,padding:"8px 11px",cursor:"pointer",fontSize:11.5,fontWeight:800,whiteSpace:"nowrap"}}>
          <FileSpreadsheet size={14}/> Ouvrir TVA Auto
        </button>
      </div>
      <FieldRow label="Régime TVA"><SelectPill value={client.tvaRegime} options={REGIMES_TVA} labels={REGIMES_TVA_LABELS} onChange={(v) => onUpdate(client.id, { tvaRegime: v, tvaPeriodicite: v === "CA3" ? (client.tvaPeriodicite || "mensuelle") : client.tvaPeriodicite })} /></FieldRow>
      {client.tvaRegime === "CA3" && (
        <FieldRow label="Périodicité de déclaration">
          <SelectPill value={client.tvaPeriodicite || "mensuelle"} options={TVA_PERIODICITES} labels={TVA_PERIODICITE_LABELS} allowEmpty={false} onChange={(v) => onUpdate(client.id, { tvaPeriodicite: v })} />
        </FieldRow>
      )}
      {client.tvaRegime !== "CA12" && <FieldRow label="Jour limite de déclaration">
        <input type="number" min="1" max="31" defaultValue={client.tvaExig || ""} placeholder="ex. 19"
          onBlur={(e) => onUpdate(client.id, { tvaExig: e.target.value ? parseInt(e.target.value, 10) : "" })}
          style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, width: 60, textAlign: "right" }} />
      </FieldRow>}
      <FieldRow label="Période consultée">
        <select value={currentMonth} onChange={(e) => setSelectedMonth(e.target.value)} disabled={client.tvaRegime === "CA12"}
          style={{ fontFamily: T.mono, fontSize: 12, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.paper }}>
          {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Statut courant">
        <Stamped tone={tvaTone(currentStatus)} small>{tvaStatusLabel(currentStatus)}</Stamped>
      </FieldRow>
      {currentStatus === "NON_VALIDE" && currentNote && (
        <FieldRow label="Remarques du contrôle">
          <div style={{ fontSize: 12, color: T.ink, background: T.redSoft || "#FEECEC", border: `1px solid ${T.line}`, borderRadius: 8, padding: "8px 10px", maxWidth: 320 }}>{currentNote}</div>
        </FieldRow>
      )}
      <div style={{ height: 14 }} />
      <Panel title={`Données de déclaration — ${detailKey}`}>
        <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 10, lineHeight: 1.5 }}>Ces données sont alimentées automatiquement par <strong>TVA Auto</strong> lors de la validation et restent modifiables ici si une correction est nécessaire.</div>
        <FieldRow label="Montant HT encaissé"><TextInput defaultValue={d.htEncaisse ?? ""} onCommit={(v) => patchDetails("htEncaisse", v)} placeholder="ex. 25 000 €" width={170} /></FieldRow>
        <FieldRow label="TVA collectée"><TextInput defaultValue={d.tvaCollectee ?? ""} onCommit={(v) => patchDetails("tvaCollectee", v)} placeholder="ex. 5 000 €" width={170} /></FieldRow>
        <FieldRow label="TVA déductible"><TextInput defaultValue={d.tvaDeductible ?? ""} onCommit={(v) => patchDetails("tvaDeductible", v)} placeholder="ex. 1 800 €" width={170} /></FieldRow>
        <FieldRow label="TVA sous-traitant / autoliquidation"><TextInput defaultValue={d.tvaSousTraitant ?? ""} onCommit={(v) => patchDetails("tvaSousTraitant", v)} placeholder="ex. 200 € — si applicable" width={170} /></FieldRow>
        <FieldRow label="TVA nette avant crédit"><TextInput defaultValue={d.netAvantCredit ?? ""} onCommit={(v) => patchDetails("netAvantCredit", v)} placeholder="Calcul automatique" width={170} /></FieldRow>
        <FieldRow label="Crédit reporté"><TextInput defaultValue={d.creditReporte ?? ""} onCommit={(v) => patchDetails("creditReporte", v)} placeholder="ex. 500 €" width={170} /></FieldRow>
        <FieldRow label="Crédit utilisé"><TextInput defaultValue={d.creditUtilise ?? ""} onCommit={(v) => patchDetails("creditUtilise", v)} placeholder="ex. 300 €" width={170} /></FieldRow>
        <FieldRow label="Nouveau crédit à reporter"><TextInput defaultValue={d.creditTVA ?? ""} onCommit={(v) => patchDetails("creditTVA", v)} placeholder="ex. 200 €" width={170} /></FieldRow>
        <FieldRow label="Montant à payer"><TextInput defaultValue={d.montantAPayer ?? ""} onCommit={(v) => patchDetails("montantAPayer", v)} placeholder="ex. 3 000 €" width={170} /></FieldRow>
        <FieldRow label="Source"><Stamped tone={d.source === "TVA Auto" ? "blue" : "neutral"} small>{d.source || "Saisie manuelle"}</Stamped></FieldRow>
        <FieldRow label="Dernière validation"><span style={{ fontSize: 11.5, color: T.inkMuted }}>{d.validationDate ? new Date(d.validationDate).toLocaleString("fr-FR") : "—"}</span></FieldRow>
        <FieldRow label="Autres informations"><TextInput defaultValue={d.autres || ""} onCommit={(v) => patchDetails("autres", v)} placeholder="Acompte, remarque…" width={280} align="left" /></FieldRow>
      </Panel>
      <div style={{ height: 14 }} />
      <Panel title="Paiement de TVA">
        <PaymentLine
          label={client.tvaRegime === "CA12" ? "TVA annuelle — CA12" : `TVA ${currentMonth}`}
          amount={client.tvaPaiements?.[client.tvaRegime === "CA12" ? "CA12" : currentMonth]?.montant ?? ""}
          status={client.tvaPaiements?.[client.tvaRegime === "CA12" ? "CA12" : currentMonth]?.statut || "a_payer"}
          onAmountChange={(value) => { const k=client.tvaRegime === "CA12" ? "CA12" : currentMonth; onUpdate(client.id, { tvaPaiements: { ...(client.tvaPaiements || {}), [k]: { ...(client.tvaPaiements?.[k] || {}), montant: value } } }) }}
          onStatusChange={(value) => { const k=client.tvaRegime === "CA12" ? "CA12" : currentMonth; onUpdate(client.id, { tvaPaiements: { ...(client.tvaPaiements || {}), [k]: { ...(client.tvaPaiements?.[k] || {}), statut: value } } }) }}
        />
      </Panel>
      <div style={{ fontSize: 12, color: T.inkMuted, margin: "14px 0 0", lineHeight: 1.6 }}>
        {client.tvaRegime === "CA12"
          ? "Régime CA12 : une seule déclaration annuelle, exigible en Mai N+1."
          : client.tvaRegime === "CA3"
            ? client.tvaPeriodicite === "trimestrielle"
              ? "Régime CA3 trimestriel : une déclaration à la fin de chaque trimestre civil (Mars, Juin, Septembre, Décembre), exigible le mois suivant (M+1). Les autres mois sont non applicables."
              : "Régime CA3 mensuel : la TVA d'un mois donné est déclarée le mois suivant (M+1)."
            : "Sélectionnez un régime TVA pour activer le suivi des échéances."}
        {" "}Le suivi mois par mois (Fait / OK / N/A) se gère depuis l'écran <strong>TVA — CA3/CA12</strong>.
      </div>
    </div>
  );
}

export { TvaTab };
