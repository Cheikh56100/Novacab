import { Info } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import * as Core from "./core.js";
const { useState, useEffect, useRef } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



/* ============================================================
   INFO HINT — résumé court + icône "i" pour afficher le détail
   au clic (évite les paragraphes d'explication trop longs)
   ============================================================ */
function InfoHint({ summary, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);
  return (
    <span className="relative inline-flex items-center gap-1.5 flex-wrap" ref={ref}>
      <span>{summary}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Voir le détail"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-line text-inkmuted hover:border-accent hover:text-accent transition-colors cursor-pointer shrink-0 align-middle"
      >
        <Info size={11} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .15 }}
          className="absolute left-0 top-[calc(100%+6px)] z-[80] w-[360px] max-w-[90vw] rounded-xl border border-line bg-card shadow-2xl p-3 text-[11.5px] leading-relaxed text-ink"
        >
          {children}
        </motion.div>
      )}
    </span>
  );
}

export { InfoHint };
