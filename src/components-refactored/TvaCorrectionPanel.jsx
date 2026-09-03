import { XCircle } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



/* ============================================================
   PANNEAU DE CONTRÔLE TVA — éléments à modifier avant déclaration
   ============================================================ */
function TvaCorrectionPanel({ client, mois, initial, onClose, onSave, onMarkFixed }) {
  const [text, setText] = useState(initial || "");
  const isExisting = !!initial;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(28,37,65,0.4)" }} />
      <div className="scrollbar" style={{ position: "relative", background: T.paper, borderRadius: 14, padding: 24, width: 440, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <XCircle size={18} color="#6D28D9" />
          <h3 style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 600, color: T.navy, margin: 0 }}>TVA {mois} — {client.nom}</h3>
        </div>
        <p style={{ fontSize: 11.5, color: T.inkMuted, margin: "4px 0 14px" }}>
          Contrôlé non validé : précisez ce que le collaborateur doit modifier avant de pouvoir déclarer.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex. : facture n°4521 à recoder en 401, écart de 230 € sur le compte de TVA collectée…"
          rows={6}
          style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12.5, background: T.card, resize: "vertical", color: T.ink }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            {isExisting && (
              <button onClick={onMarkFixed} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 11.5, color: T.navy, fontWeight: 600 }}>
                Corrigé → repasser en revue (Fait)
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 12 }}>Annuler</button>
            <button onClick={() => onSave(text.trim())} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#6D28D9", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Enregistrer — Non validé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TvaCorrectionPanel };
