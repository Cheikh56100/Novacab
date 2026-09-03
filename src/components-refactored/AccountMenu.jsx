import { ChevronDown, Settings2, LogOut, Lock, UserRound, Bell, Moon, Laptop2, CircleHelp, Info } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T, ROLE_LABELS } = Shared;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



/* ============================================================
   MENU COMPTE — composant réutilisable pour tous les utilisateurs
   ============================================================ */
function AccountMenu({ me, meRole, cabinetName, open, onToggle, onSelect, onLogout }) {
  const items = [
    { id: "profile", label: "Mon profil", icon: UserRound, hint: "Informations personnelles" },
    { id: "security", label: "Sécurité", icon: Lock, hint: "Mot de passe, 2FA, sessions" },
    { id: "preferences", label: "Préférences", icon: Settings2, hint: "Interface, notifications, langue" },
    { id: "notifications", label: "Notifications", icon: Bell, hint: "Gérer vos notifications" },
    { id: "appearance", label: "Apparence", icon: Moon, hint: "Thème et affichage" },
    { id: "sessions", label: "Sessions actives", icon: Laptop2, hint: "Voir et gérer vos sessions" },
    { id: "help", label: "Aide & support", icon: CircleHelp, hint: "Centre d'aide, contact" },
    { id: "about", label: "À propos", icon: Info, hint: "NOVACAB · Version 1.4.0" },
  ];
  const initials = (me || "U").split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  const role = ROLE_LABELS[meRole] || meRole || "Utilisateur";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="group flex items-center gap-2 rounded-xl border border-line bg-card px-2 py-1.5 hover:border-accent hover:shadow-sm transition-all cursor-pointer"
      >
        <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0" style={{ background: T.navy }}>{initials}</span>
        <span className="hidden lg:block text-left min-w-0 max-w-[145px]">
          <span className="block text-[11.5px] font-bold text-ink truncate">{me || "Utilisateur"}</span>
          <span className="block text-[9.5px] text-inkmuted truncate">{role} · {cabinetName || "NOVACAB"}</span>
        </span>
        <ChevronDown size={14} className={`text-inkmuted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .16 }}
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[300px] overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
        >
          <div className="p-4 border-b border-line bg-app">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-white" style={{ background: T.navy }}>{initials}</span>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-ink truncate">{me || "Utilisateur"}</div>
                <div className="text-[11px] text-inkmuted">{role} · {cabinetName || "NOVACAB"}</div>
                <div className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> En ligne</div>
              </div>
            </div>
          </div>
          <div className="p-2">
            {items.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} role="menuitem" type="button" onClick={() => onSelect(item.id)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer">
                <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><Icon size={15} /></span>
                <span className="min-w-0"><span className="block text-[11.5px] font-bold text-ink">{item.label}</span><span className="block text-[9.5px] text-inkmuted mt-0.5">{item.hint}</span></span>
              </button>;
            })}
          </div>
          <div className="border-t border-line p-2">
            <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><LogOut size={15} /></span>
              <span className="text-[11.5px] font-bold">Déconnexion</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export { AccountMenu };
