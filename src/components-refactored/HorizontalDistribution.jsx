import { Users } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, DASHBOARD_CHART_COLORS } = Core;
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function HorizontalDistribution({
  title,
  items,
  icon: Icon = Users,
  onItemClick,
}) {
  const safe = (items || []).filter(
    (x) => Number(x.value) > 0
  );

  const max = Math.max(
    1,
    ...safe.map((x) => Number(x.value))
  );

  return (
    <Panel
      title={title}
      right={<Icon size={15} color={T.inkMuted} />}
    >
      {!safe.length ? (
        <EmptyNote text="Aucune donnée disponible." />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 11,
          }}
        >
          {safe.slice(0, 8).map((item, i) => {
            const pct =
              (Number(item.value) / max) * 100;

            const color =
              item.color ||
              DASHBOARD_CHART_COLORS[
                i % DASHBOARD_CHART_COLORS.length
              ];

            return (
              <div
                key={`${item.label}-${i}`}
                onClick={() => onItemClick?.(item)}
                className={onItemClick ? "clickable" : ""}
                style={{ cursor: onItemClick ? "pointer" : "default", padding: "4px 5px", borderRadius: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 5,
                    fontSize: 10.5,
                  }}
                >
                  <span
                    style={{
                      color: T.inkSoft,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>

                  <strong
                    style={{
                      color: T.ink,
                      fontFamily: T.mono,
                    }}
                  >
                    {item.value}
                  </strong>
                </div>

                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: T.paperDeep,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: color,
                      transition: "width .35s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export { HorizontalDistribution };
