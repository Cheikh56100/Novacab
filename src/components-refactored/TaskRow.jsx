import { Check, History, Trash2, Clock3 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, TASK_PRIORITE_TONE } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { RoleBadge } from "./RoleBadge.jsx";
import { TASK_STATUTS, TASK_PRIORITE_BY_CODE } from "../constants/pilotage";
import { fmtFR } from "../utils/dateUtils";



function TaskRow({ task, index, client, responsable, onOpenClient, onUpdate, onComplete, onArchive, onDelete }) {
  return (
    <Reveal index={index} delay={0.05}>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-3 rounded-xl border border-line bg-card">
        {task.isAuto ? (
          <div className="w-5 h-5 rounded-full border-[1.5px] border-line flex items-center justify-center shrink-0" title="Échéance calculée automatiquement">
            <Clock3 size={11} className="text-inkmuted" />
          </div>
        ) : (
          <button onClick={() => onComplete(task)} title="Marquer terminé"
            className="w-5 h-5 rounded-full border-[1.5px] border-badge-green-text flex items-center justify-center shrink-0 hover:bg-badge-green-bg transition-colors">
            <Check size={12} className="text-badge-green-text" />
          </button>
        )}
        <div className="flex-1 min-w-[140px] sm:min-w-0">
          <div className={`font-semibold text-xs text-ink inline-block ${client ? "cursor-pointer hover:text-accent" : ""}`}
            onClick={() => client && onOpenClient(client.id)}>
            {client ? client.nom : "Dossier non lié"}
          </div>
          <div className="text-[11.5px] text-inkmuted">{task.nom}{task.commentaire ? ` — ${task.commentaire}` : ""}</div>
        </div>
        {!task.isAuto && (<><button onClick={() => onArchive?.(task)} title="Archiver" className="text-inkmuted"><History size={14}/></button><button onClick={() => onDelete(task.id)} title="Supprimer" className="text-inkmuted hover:text-badge-red-text transition-colors order-2 sm:order-none">
            <Trash2 size={13} />
          </button></>)}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto pl-[30px] sm:pl-0 order-3 sm:order-none">
          {responsable && <RoleBadge role="Resp." name={responsable.nom} />}
          {task.isAuto ? (
            <Stamped tone="neutral" small>Auto</Stamped>
          ) : (
            <select value={task.statut} onChange={(e) => onUpdate(task.id, { statut: e.target.value })}
              className="input-field !w-auto !py-1 !px-2 text-[10.5px] font-bold cursor-pointer">
              {TASK_STATUTS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          )}
          <Stamped tone={TASK_PRIORITE_TONE[task.priorite]} small>{TASK_PRIORITE_BY_CODE[task.priorite]?.label}</Stamped>
          {task.date_echeance && <span className="font-mono text-[10.5px] text-inkmuted whitespace-nowrap">{fmtFR(task.date_echeance)}</span>}
        </div>
      </div>
    </Reveal>
  );
}

export { TaskRow };
