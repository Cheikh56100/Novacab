import { History } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, ACTIVITY_TYPE_LABELS } = Core;
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, supabase } = Shared;
const { useState, useEffect } = React;


function HistoriqueTab({ clientId, team }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setRows(null);
    supabase.from("activity_log").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(80)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("Erreur chargement historique :", error.message); setRows([]); return; }
        setRows(data || []);
      });
    return () => { cancelled = true; };
  }, [clientId]);

  const nameFor = (id) => team.find((t) => t.id === id)?.nom || "—";

  if (rows === null) return <div style={{ fontSize: 12.5, color: T.inkMuted, padding: "8px 0" }}>Chargement…</div>;
  if (rows.length === 0) return <EmptyNote text="Aucun événement enregistré pour ce dossier pour l'instant." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => (
        <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 4px", borderBottom: `1px solid ${T.line}` }}>
          <span style={{ marginTop: 2 }}><History size={13} color={T.inkMuted} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: T.ink }}>{r.message}</div>
            <div style={{ fontSize: 10.5, color: T.inkMuted, fontFamily: T.mono, marginTop: 2 }}>
              {ACTIVITY_TYPE_LABELS[r.type] || r.type} · {nameFor(r.auteur_id)} · {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              {" "}{new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { HistoriqueTab };
