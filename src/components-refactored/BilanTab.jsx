import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { FieldRow } from "./FieldRow.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
const { T, CURRENT_YEAR, getExerciseYear, todayISO, addYearISO, fmtFR, fmtEUR, getBilanEcheance, getBilanStatut } = Shared;
const { useState } = React;

// Étapes de révision du bilan. Conservées localement pour éviter qu’un référentiel
// optionnel manquant ne puisse faire tomber tout l’écran du dossier client.
const BILAN_REVISION_STEPS = [
  { id: "a_faire", label: "À faire" },
  { id: "en_cours", label: "En cours" },
  { id: "terminee", label: "Terminée" },
];



function BilanTab({ client, onUpdate, meRole }) {
  const isSuperAdmin = meRole === "super_admin";
  const [manualYear, setManualYear] = useState("");
  const b = client.bilan || {};
  const patch = (fields) => onUpdate(client.id, { bilan: { ...b, ...fields } });
  const toggle = (field) => patch({ [field]: !b[field] });
  const toggleTransmission = () => {
    const next = !b.transmis;
    if (next && !b.transmis && client.dateCloture) {
      const exercice = getExerciseYear(client.dateCloture, CURRENT_YEAR());
      const ok = window.confirm(
        `Confirmer la fin du bilan ${exercice} ?\n\n` +
        `Le bilan sera comptabilisé comme terminé pour ${exercice} et le dossier passera sur l'exercice suivant.\n\n` +
        `Vous pourrez annuler cette action depuis ce même écran si elle a été faite par erreur.`
      );
      if (!ok) return;
      onUpdate(client.id, {
        bilan: { ...b, transmis: true, transmisDate: todayISO(), transmisAnnee: exercice },
        dateCloture: addYearISO(client.dateCloture, 1),
      });
      return;
    }
    patch({ transmis: false });
  };

  const cancelTransmission = () => {
    const undo = client.bilanTransmissionUndo;

    // Cas normal : la V4 a enregistré exactement l'état précédent.
    if (undo) {
      const exercice = Number(undo.previousAnnualActiveYear || getExerciseYear(undo.previousDateCloture, CURRENT_YEAR()));
      const ok = window.confirm(
        `Annuler la fin du bilan ${exercice} ?\n\n` +
        `Le dossier reviendra à son état précédent et le bilan ne sera plus comptabilisé comme terminé.\n\n` +
        `Attention : cette action ne peut pas annuler une télétransmission réellement envoyée à l'extérieur.`
      );
      if (!ok) return;
      const annualData = JSON.parse(JSON.stringify(undo.previousAnnualData || {}));
      // Sécurité : l'annulation doit aussi retirer le bilan de l'exercice du
      // "Suivi des bilans annuels". On ne se contente pas de remettre la fiche
      // dans son état précédent : on force explicitement l'exercice concerné
      // à ne plus être marqué transmis.
      if (annualData[String(exercice)]?.bilan) {
        annualData[String(exercice)] = {
          ...annualData[String(exercice)],
          bilan: {
            ...annualData[String(exercice)].bilan,
            transmis: false,
            transmisDate: "",
          },
        };
        delete annualData[String(exercice)].bilan.transmisAnnee;
      }
      const restoredBilan = { ...(undo.previousBilan || {}), transmis: false, transmisDate: "" };
      delete restoredBilan.transmisAnnee;

      onUpdate(client.id, {
        dateCloture: undo.previousDateCloture,
        annualActiveYear: exercice,
        annualData,
        bilan: restoredBilan,
        bilanTransmissionUndo: null,
      });
      return;
    }

    // Rattrapage des validations faites AVANT la V4 : même sans historique
    // d'annulation, on permet à l'utilisateur de retirer le mauvais statut
    // "bilan terminé" de l'exercice concerné.
    const annualEntries = Object.entries(client.annualData || {})
      .map(([year, snapshot]) => ({ year: Number(year), snapshot }))
      .filter(({ year, snapshot }) => Number.isInteger(year) && snapshot?.bilan?.transmis);
    const fallback = annualEntries
      .sort((a, b) => b.year - a.year)[0];
    const exercice = Number(
      b.transmisAnnee ||
      fallback?.snapshot?.bilan?.transmisAnnee ||
      fallback?.year ||
      getExerciseYear(client.dateCloture, CURRENT_YEAR())
    );
    const snapshot = fallback?.snapshot;
    if (!snapshot && !b.transmis) return;

    const ok = window.confirm(
      `Annuler la validation du bilan ${exercice} ?\n\n` +
      `Ce dossier a été marqué comme bilan terminé par erreur. Il sera retiré des bilans terminés de ${exercice} et le bilan redeviendra non terminé.\n\n` +
      `Attention : cette action ne peut pas annuler une télétransmission réellement envoyée à l'extérieur.`
    );
    if (!ok) return;

    const annualData = JSON.parse(JSON.stringify(client.annualData || {}));
    if (annualData[String(exercice)]) {
      annualData[String(exercice)] = {
        ...annualData[String(exercice)],
        bilan: {
          ...(annualData[String(exercice)].bilan || {}),
          transmis: false,
          transmisDate: "",
        },
      };
      delete annualData[String(exercice)].bilan.transmisAnnee;
    }
    // Nettoyage des éventuelles anciennes copies mal classées : un bilan
    // 2025 annulé ne doit plus apparaître comme terminé en 2025 ni en 2026.
    Object.entries(annualData).forEach(([year, snapshot]) => {
      if (Number(year) !== exercice && Number(snapshot?.bilan?.transmisAnnee) === exercice) {
        annualData[year] = {
          ...snapshot,
          bilan: { ...(snapshot.bilan || {}), transmis: false, transmisDate: "" },
        };
        delete annualData[year].bilan.transmisAnnee;
      }
    });

    // Si le dossier était déjà passé à l'exercice suivant, on le replace sur
    // l'exercice du bilan corrigé et on recharge son état annuel.
    const restoredSnapshot = annualData[String(exercice)];
    const restoredBilan = { ...(restoredSnapshot?.bilan || {}), transmis: false, transmisDate: "" };
    delete restoredBilan.transmisAnnee;

    onUpdate(client.id, {
      ...(restoredSnapshot?.dateCloture ? { dateCloture: restoredSnapshot.dateCloture } : {}),
      annualActiveYear: exercice,
      annualData,
      bilan: restoredBilan,
      bilanTransmissionUndo: null,
    });
  };
  // Correction manuelle réservée au Super Admin. Utile notamment après une
  // modification de date de clôture : les archives annuelles existantes ne sont
  // pas automatiquement reclassées comme "terminées" ou "à faire".
  const completedAnnualYears = Object.entries(client.annualData || {})
    .filter(([year, snapshot]) => Number.isInteger(Number(year)) && !!snapshot?.bilan?.transmis)
    .map(([year]) => Number(year));
  const currentExercise = getExerciseYear(client.dateCloture, CURRENT_YEAR());
  const manualYears = Array.from(new Set([
    ...Object.keys(client.annualData || {}).map(Number).filter(Number.isInteger),
    ...completedAnnualYears,
    currentExercise,
    currentExercise - 1,
  ])).sort((a, b) => b - a);
  const selectedManualYear = Number(manualYear || completedAnnualYears[0] || currentExercise);
  const selectedSnapshot = (client.annualData || {})[String(selectedManualYear)] || {};
  const selectedIsFinished = selectedManualYear === Number(b.transmisAnnee || 0)
    ? !!b.transmis
    : !!selectedSnapshot?.bilan?.transmis;

  const setManualBilanStatus = (finished) => {
    const year = Number(selectedManualYear);
    if (!Number.isInteger(year)) return;
    const action = finished ? "marquer comme terminé" : "retirer des bilans terminés";
    if (!window.confirm(`Confirmer : ${action} pour l'exercice ${year} ?\n\nCette correction est réservée au Super Admin et mettra à jour le suivi des bilans annuels.`)) return;

    const annualData = JSON.parse(JSON.stringify(client.annualData || {}));
    const baseSnapshot = annualData[String(year)] || {
      dateCloture: year === currentExercise ? client.dateCloture : "",
      bilan: {},
    };
    annualData[String(year)] = {
      ...baseSnapshot,
      bilan: {
        ...(baseSnapshot.bilan || {}),
        transmis: !!finished,
        transmisDate: finished ? (baseSnapshot.bilan?.transmisDate || todayISO()) : "",
        ...(finished ? { transmisAnnee: year } : {}),
      },
    };
    if (!finished) delete annualData[String(year)].bilan.transmisAnnee;

    // Si le Super Admin corrige l'exercice actuellement ouvert, on synchronise
    // aussi le bilan actif afin que l'écran et le tableau de bord concordent.
    const patchData = { annualData };
    if (year === currentExercise) {
      const nextBilan = { ...b, transmis: !!finished, transmisDate: finished ? (b.transmisDate || todayISO()) : "" };
      if (finished) nextBilan.transmisAnnee = year;
      else delete nextBilan.transmisAnnee;
      patchData.bilan = nextBilan;
    }
    onUpdate(client.id, patchData);
  };

  const echeance = getBilanEcheance(client.dateCloture);
  const statut = getBilanStatut(b, client.dateCloture);
  const enRetard = echeance && todayISO() > echeance && !b.transmis;
  const honoraires = client.honoraires || {};
  const billingPeriod = honoraires.bilanPeriodicite || honoraires.facturationPeriodicite || "annuel";
  const periodCount = { annuel: 1, semestriel: 2, trimestriel: 4, mensuel: 12 }[billingPeriod] || 1;
  const billingDates = Array.isArray(honoraires.bilanDates) ? honoraires.bilanDates : [];
  const setBilling = (patchFields) => onUpdate(client.id, { honoraires: { ...honoraires, ...patchFields } });
  const billingDateCount = periodCount;

  return (
    <div>
      {/* 1) Cartouches de statut */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: "1 1 160px", border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10.5, color: T.inkMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Statut</div>
          <Stamped tone={statut.tone}>{statut.label}</Stamped>
        </div>
        <div style={{ flex: "1 1 160px", border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10.5, color: T.inkMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Échéance légale (clôture + 3 mois)</div>
          <div style={{ fontFamily: T.mono, fontSize: 13.5, fontWeight: 700, color: enRetard ? T.red : T.ink }}>{fmtFR(echeance)}</div>
        </div>
        <div style={{ flex: "1 1 160px", border: `1px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10.5, color: T.inkMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Date de clôture</div>
          <div style={{ fontFamily: T.mono, fontSize: 13.5, fontWeight: 700 }}>{fmtFR(client.dateCloture)}</div>
        </div>
      </div>

      {/* 2) Facturation du dossier — source de vérité partagée avec l'Administration */}
      <Panel title="Honoraires & facturation du bilan">
        <FieldRow label="Montant du bilan HT">
          <input type="number" min="0" step="0.01" value={honoraires.bilanMontantHT ?? ""} onChange={(e) => setBilling({ bilanMontantHT: e.target.value })}
            placeholder="Ex. 1 500" style={{ fontFamily: T.mono, fontSize: 12, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, width: 180 }} />
        </FieldRow>
        <FieldRow label="Montant du bilan TTC">
          <input type="number" min="0" step="0.01" value={honoraires.bilanMontantTTC ?? ""} onChange={(e) => setBilling({ bilanMontantTTC: e.target.value })}
            placeholder="Ex. 1 800" style={{ fontFamily: T.mono, fontSize: 12, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, width: 180 }} />
        </FieldRow>
        <FieldRow label="Périodicité de paiement">
          <select value={billingPeriod} onChange={(e) => setBilling({ bilanPeriodicite: e.target.value })}
            style={{ fontSize: 12, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }}>
            <option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option><option value="semestriel">Semestriel</option><option value="annuel">Annuel</option>
          </select>
        </FieldRow>
        <FieldRow label="Dates de facturation (optionnelles)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {Array.from({ length: billingDateCount }).map((_, i) => (
              <input key={i} type="date" value={billingDates[i] || ""} onChange={(e) => { const next = [...billingDates]; next[i] = e.target.value; setBilling({ bilanDates: next }); }}
                style={{ fontFamily: T.mono, fontSize: 11.5, padding: "6px 7px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }} />
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Montant déjà payé">
          <input type="number" min="0" step="0.01" value={honoraires.bilanPaye ?? client.bilanPaye ?? ""} onChange={(e) => setBilling({ bilanPaye: e.target.value })}
            placeholder="0" style={{ fontFamily: T.mono, fontSize: 12, padding: "7px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, width: 180 }} />
        </FieldRow>
        <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 9, background: T.accentSoft || "#f3f6fa", fontSize: 11, color: T.inkMuted }}>
          La fin du bilan alimente automatiquement le <strong>Tableau des bilans</strong> de l'Administration. La périodicité et les dates servent à calculer les échéances de facturation.
        </div>
      </Panel>

      {/* 3) Étapes d'avancement */}
      <Panel title="Étapes d'avancement">
        <FieldRow label="Révision comptable">
          <div style={{ display: "flex", gap: 6 }}>
            {BILAN_REVISION_STEPS.map((s) => (
              <button key={s.id} onClick={() => patch({ revision: s.id })} style={{
                fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${(b.revision || "a_faire") === s.id ? T.navy : T.line}`,
                background: (b.revision || "a_faire") === s.id ? T.navy + "1A" : "transparent",
                color: (b.revision || "a_faire") === s.id ? T.navy : T.inkMuted,
              }}>{s.label}</button>
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Révision de fin de bilan">
          {(() => {
            const checklist = b.finBilanChecklist || {};
            const items = [
              ["capitauxPropres", "Capitaux propres / capital social"],
              ["marges", "Marges et variations anormales"],
              ["cfe", "CFE et comptabilisation"],
              ["tvaCadrage", "Cadrage de TVA"],
              ["banque", "Rapprochements bancaires"],
              ["fournisseurs", "Comptes fournisseurs et soldes anciens"],
              ["clients", "Comptes clients et créances anciennes"],
              ["social", "Comptes sociaux, charges et dettes"],
              ["emprunts", "Emprunts et intérêts"],
              ["immobilisations", "Immobilisations et amortissements"],
              ["chargesProduits", "Charges / produits à rattacher"],
              ["comptesAttente", "Comptes d'attente et comptes divers"],
              ["impots", "IS/IR, CFE et autres impôts"],
              ["annexes", "Annexes et éléments de liasse"],
            ];
            const done = items.filter(([id]) => checklist[id]).length;
            return (
              <div style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 11px", background: T.paper }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: T.inkMuted }}>{done}/{items.length} contrôles réalisés</span>
                  <Stamped tone={done === items.length ? "green" : "amber"} small>{done === items.length ? "Révision complète" : "À finaliser"}</Stamped>
                </div>
                {items.map(([id, label]) => (
                  <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 2px", borderBottom: `1px solid ${T.line}`, fontSize: 11.5, color: checklist[id] ? T.inkMuted : T.ink, textDecoration: checklist[id] ? "line-through" : "none", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!checklist[id]} onChange={() => patch({ finBilanChecklist: { ...checklist, [id]: !checklist[id] } })} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            );
          })()}
        </FieldRow>
        <FieldRow label="Projet de bilan validé par le client">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ToggleBtn on={!!b.valideClient} onClick={() => patch({ valideClient: !b.valideClient, valideClientDate: !b.valideClient ? todayISO() : b.valideClientDate })} />
            {b.valideClient && (
              <input type="date" value={b.valideClientDate || ""} onChange={(e) => patch({ valideClientDate: e.target.value })}
                style={{ fontFamily: T.mono, fontSize: 12, padding: "4px 7px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }} />
            )}
          </div>
        </FieldRow>
        <FieldRow label="Transmis (liasse télétransmise)">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ToggleBtn on={!!b.transmis} onClick={toggleTransmission} tone="green" />
            {b.transmis && (
              <>
                <input type="date" value={b.transmisDate || ""} onChange={(e) => patch({ transmisDate: e.target.value })}
                  style={{ fontFamily: T.mono, fontSize: 12, padding: "4px 7px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card }} />
                <button type="button" className="btn-secondary !py-1.5" onClick={cancelTransmission} title="Annuler la fin du bilan si elle a été faite par erreur">
                  Annuler la transmission
                </button>
              </>
            )}
            {!b.transmis && client.bilanTransmissionUndo && (
              <button type="button" className="btn-secondary !py-1.5" onClick={cancelTransmission}>
                Restaurer l'état précédent
              </button>
            )}
          </div>
        </FieldRow>
      </Panel>

      <div style={{ height: 14 }} />

      {/* 3) Données financières clés */}
      <Panel title="Données financières clés">
        <FieldRow label="Chiffre d'affaires (CA)">
          <input type="number" defaultValue={b.ca ?? ""} onBlur={(e) => patch({ ca: e.target.value })} placeholder="0"
            style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, width: 140 }} />
        </FieldRow>
        <FieldRow label="Résultat net (bénéfice / perte)">
          <input type="number" defaultValue={b.resultat ?? ""} onBlur={(e) => patch({ resultat: e.target.value })} placeholder="0"
            style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, width: 140 }} />
        </FieldRow>
        <FieldRow label="Capital social">
          <input type="number" defaultValue={client.capitalSocial ?? ""} onBlur={(e) => onUpdate(client.id, { capitalSocial: e.target.value })} placeholder="0"
            style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, width: 140 }} />
        </FieldRow>
        <FieldRow label="Capitaux propres">
          <input type="number" defaultValue={b.capitauxPropres ?? ""} onBlur={(e) => patch({ capitauxPropres: e.target.value })} placeholder="0"
            style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, width: 140 }} />
        </FieldRow>
        <FieldRow label="Trésorerie finale">
          <input type="number" defaultValue={b.tresorerie ?? ""} onBlur={(e) => patch({ tresorerie: e.target.value })} placeholder="0"
            style={{ fontFamily: T.mono, fontSize: 12.5, padding: "5px 8px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, width: 140 }} />
        </FieldRow>
        {(b.ca !== undefined && b.ca !== "") || (b.resultat !== undefined && b.resultat !== "") ? (
          <div style={{ display: "flex", gap: 18, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}`, flexWrap: "wrap" }}>
            <div><span style={{ fontSize: 11, color: T.inkMuted }}>CA </span><strong style={{ fontFamily: T.mono }}>{fmtEUR(b.ca)}</strong></div>
            <div><span style={{ fontSize: 11, color: T.inkMuted }}>Résultat </span><strong style={{ fontFamily: T.mono, color: Number(b.resultat) < 0 ? T.red : T.green }}>{fmtEUR(b.resultat)}</strong></div>
            {b.capitauxPropres !== undefined && b.capitauxPropres !== "" && <div><span style={{ fontSize: 11, color: T.inkMuted }}>Capitaux propres </span><strong style={{ fontFamily: T.mono }}>{fmtEUR(b.capitauxPropres)}</strong></div>}
            {b.tresorerie !== undefined && b.tresorerie !== "" && <div><span style={{ fontSize: 11, color: T.inkMuted }}>Trésorerie </span><strong style={{ fontFamily: T.mono }}>{fmtEUR(b.tresorerie)}</strong></div>}
          </div>
        ) : null}
      </Panel>

      <div style={{ height: 14 }} />

      {isSuperAdmin && (
        <>
          <div style={{ height: 14 }} />
          <Panel title="Correction manuelle des bilans terminés — Super Admin">
            <div style={{ fontSize: 11.5, color: T.inkMuted, marginBottom: 10 }}>
              Utilisez cette zone pour corriger manuellement le statut d'un exercice après une modification de date de clôture. La correction est enregistrée dans l'historique annuel du dossier et alimente directement le suivi des bilans restants.
            </div>
            <FieldRow label="Exercice à corriger">
              <select value={String(selectedManualYear)} onChange={(e) => setManualYear(e.target.value)} style={{ fontSize: 12, padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.line}`, background: T.card, minWidth: 130 }}>
                {manualYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Statut actuel">
              <Stamped tone={selectedIsFinished ? "green" : "amber"} small>{selectedIsFinished ? "Bilan terminé" : "Bilan restant"}</Stamped>
            </FieldRow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" onClick={() => setManualBilanStatus(true)} className="btn-primary" disabled={selectedIsFinished}>Marquer comme terminé</button>
              <button type="button" onClick={() => setManualBilanStatus(false)} className="btn-secondary" disabled={!selectedIsFinished}>Retirer des bilans terminés</button>
            </div>
          </Panel>
        </>
      )}

      {/* 4) Legacy — ne pas supprimer : alimente le tableau de bord et les échéances fiscales */}
      <Panel title="Suivi du retard (utilisé par le tableau de bord)">
        <FieldRow label="Finalisé après échéance"><ToggleBtn on={!!b.finaliseApres} onClick={() => toggle("finaliseApres")} /></FieldRow>
        <FieldRow label="Non encore finalisé (en retard)"><ToggleBtn on={!!b.nonFinalise} onClick={() => toggle("nonFinalise")} tone="red" /></FieldRow>
        <FieldRow label="Courrier de retard signé et classé"><ToggleBtn on={!!b.courrier} onClick={() => toggle("courrier")} /></FieldRow>
      </Panel>
    </div>
  );
}

export { BilanTab };
