import { CircleDot } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, DASHBOARD_CHART_COLORS } = Core;
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function DonutDistribution({ title, items, total, icon: Icon = CircleDot, onItemClick }) {
  const safeItems = (items || []).filter((x) => Number(x.value) > 0);

  const sum = safeItems.reduce(
    (acc, x) => acc + Number(x.value),
    0
  );

  let cursor = 0;

  const stops = safeItems.map((item, i) => {
    const pct = (Number(item.value) / (sum || 1)) * 100;
    const start = cursor;

    cursor += pct;

    return `${item.color || DASHBOARD_CHART_COLORS[i % DASHBOARD_CHART_COLORS.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });

  const shownTotal = total ?? sum;

  return (
    <Panel
      title={title}
      right={<Icon size={15} color={T.inkMuted} />}
    >
      {!safeItems.length ? (
        <EmptyNote text="Aucune donnée renseignée pour le moment." />
      ) : (
        <div className="grid grid-cols-[118px_1fr] sm:grid-cols-[136px_1fr] gap-4 items-center">

          <div
            style={{
              position: "relative",
              width: 118,
              height: 118,
              margin: "0 auto",
            }}
          >
            <div
              aria-label={`${shownTotal} dossiers`}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `conic-gradient(${stops.join(", ")})`,
                boxShadow:
                  "inset 0 0 0 1px rgba(15,23,42,.04)",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 19,
                borderRadius: "50%",
                background: T.card,
                border: `1px solid ${T.line}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <strong
                style={{
                  fontFamily: T.serif,
                  fontSize: 20,
                  lineHeight: 1,
                  color: T.ink,
                }}
              >
                {shownTotal}
              </strong>

              <span
                style={{
                  fontSize: 9.5,
                  color: T.inkMuted,
                  marginTop: 5,
                }}
              >
                dossiers
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            {safeItems.slice(0, 7).map((item, i) => {
              const pct =
                (Number(item.value) / (sum || 1)) * 100;

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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    minWidth: 0,
                    cursor: onItemClick ? "pointer" : "default",
                    padding: "4px 5px",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: color,
                      flexShrink: 0,
                    }}
                  />

                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 10.5,
                      color: T.inkSoft,
                    }}
                  >
                    {item.label}
                  </span>

                  <strong
                    style={{
                      fontSize: 10.5,
                      color: T.ink,
                      fontFamily: T.mono,
                    }}
                  >
                    {pct.toFixed(pct >= 10 ? 0 : 1)}%
                  </strong>
                </div>
              );
            })}

            {safeItems.length > 7 && (
              <span
                style={{
                  fontSize: 9.5,
                  color: T.inkMuted,
                }}
              >
                + {safeItems.length - 7} autres catégories
              </span>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

export { DonutDistribution };
