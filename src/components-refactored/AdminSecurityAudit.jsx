import { Loader2, RefreshCw } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { fetchSecurityAudit } = Shared;
const { useState, useEffect, useCallback } = React;



function AdminSecurityAudit({ session, me, meRole }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!(meRole === "admin" || meRole === "super_admin")) return;
    setLoading(true); setError("");
    const rows = await fetchSecurityAudit({ limit: 100 });
    setEvents(rows);
    setLoading(false);
    if (!rows.length) setError("Aucun événement d’audit disponible ou accès non configuré côté Supabase.");
  }, [meRole]);
  useEffect(() => { load(); }, [load]);
  if (!(meRole === "admin" || meRole === "super_admin")) return <Panel title="Accès refusé"><div className="text-sm text-inkmuted">Le journal d’audit est réservé aux administrateurs et au Super Admin.</div></Panel>;
  const fmt = (v) => v ? new Date(v).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" }) : "—";
  return <div className="space-y-3">
    <Panel title="Journal d’audit sécurité">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div><div className="text-sm font-bold text-ink">Accès administrateur uniquement</div><div className="text-xs text-inkmuted mt-1">Les collaborateurs ne peuvent ni consulter ni modifier ce journal.</div></div>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading && <Loader2 size={14} className="spin"/>}<RefreshCw size={14}/> Actualiser</button>
      </div>
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs p-3">{error}</div>}
      {loading ? <EmptyNote text="Chargement du journal…"/> : <div className="overflow-auto rounded-xl border border-line">
        <table className="w-full text-left min-w-[760px]"><thead><tr className="border-b border-line bg-app text-[10px] uppercase tracking-wide text-inkmuted"><th className="p-3">Date</th><th className="p-3">Événement</th><th className="p-3">Niveau</th><th className="p-3">Utilisateur</th><th className="p-3">Cible</th></tr></thead><tbody>
        {events.map(e => <tr key={e.id} className="border-b border-line last:border-0 text-xs"><td className="p-3 text-inkmuted whitespace-nowrap">{fmt(e.created_at)}</td><td className="p-3 font-semibold text-ink">{e.action}</td><td className="p-3"><Stamped tone={e.severity === "critical" ? "red" : e.severity === "warning" ? "amber" : "green"} small>{e.severity}</Stamped></td><td className="p-3 text-inksoft">{e.actor_name || e.actor_email || "—"}</td><td className="p-3 text-inkmuted">{e.target_type ? `${e.target_type}${e.target_id ? ` · ${e.target_id}` : ""}` : "—"}</td></tr>)}
        {!events.length && !loading && <tr><td colSpan="5" className="p-8 text-center text-xs text-inkmuted">Aucun événement.</td></tr>}
        </tbody></table></div>}
    </Panel>
  </div>;
}

export { AdminSecurityAudit };
