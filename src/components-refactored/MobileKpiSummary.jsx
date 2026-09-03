import { X, ArrowUpRight } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;


function MobileKpiSummary({ title = "Vue d'ensemble", headlineItem, items = [] }) {
  const [open, setOpen] = useState(false);
  const headline = headlineItem || items[0];
  const rest = items.filter((it) => it !== headline);
  return (
    <div className="md:hidden" style={{ marginBottom: 18 }}>
      <div
        onClick={() => setOpen(true)}
        className="clickable"
        style={{
          background: `linear-gradient(135deg, ${T.sidebarBg2}, ${T.sidebarBg})`,
          borderRadius: T.radiusLg, padding: "18px 18px 16px", color: "#fff", boxShadow: T.shadow,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11.5, color: T.sidebarInkMuted, fontWeight: 600 }}>{headline?.label || title}</div>
            <div style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 800, marginTop: 2 }}>{headline?.value ?? "—"}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            title="Voir tous les indicateurs"
            style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: 9, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowUpRight size={15} strokeWidth={2.3} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {rest.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.sidebarInk }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: toneColors(it.tone).dot, flexShrink: 0 }} />
              {it.value} {it.label.toLowerCase()}
            </div>
          ))}
        </div>
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 70 }} />
          <div style={{
            position: "fixed", left: 10, right: 10, top: "10%", bottom: "10%", background: T.card, borderRadius: T.radiusLg,
            padding: "16px 18px", boxShadow: T.shadowLg, zIndex: 71, overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>{title}</h3>
              <button onClick={() => setOpen(false)} style={{ width: 28, height: 28, borderRadius: 999, background: T.paper, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.inkSoft }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((it, i) => {
                const c = toneColors(it.tone);
                return (
                  <div
                    key={i}
                    onClick={it.onClick ? () => { setOpen(false); it.onClick(); } : undefined}
                    className={it.onClick ? "hoverRow clickable" : ""}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: T.paper, border: `1px solid ${T.line}`, borderRadius: 14, padding: "12px 14px" }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 8, background: c.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{it.label}</div>
                      {it.sublabel && <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 1 }}>{it.sublabel}</div>}
                    </div>
                    <div style={{ fontWeight: 800, color: c.text, fontSize: 15 }}>{it.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { MobileKpiSummary };
