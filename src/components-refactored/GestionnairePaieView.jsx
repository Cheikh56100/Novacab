import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { ConcerneToggle } from "./ConcerneToggle.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const thStyle = {
  textAlign: "left",
  padding: "9px 8px",
  borderBottom: `1px solid ${T.line}`,
  color: T.inkMuted,
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
  background: T.paper,
};
const tdStyle = {
  padding: "8px",
  borderBottom: `1px solid ${T.line}`,
  verticalAlign: "middle",
};

const { useMemo } = React;


/* ============================================================
   GESTIONNAIRE DE PAIE — coordonnées du gestionnaire externe
   par dossier (nom, adresse, téléphone, e-mail).
   ============================================================ */
function GestionnairePaieView({ clients, search, setSearch, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const concernes = filtered.filter((c) => c.social?.concerne);
  const autres = filtered.filter((c) => !c.social?.concerne);
  const patchSocial = (c, patch) => onUpdate(c.id, { social: { ...(c.social || {}), ...patch } });
  const cellInput = { fontSize: 11.5, padding: "3px 6px", borderRadius: 5, border: `1px solid ${T.line}`, background: T.paper };
  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Gestionnaire de paie</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18, lineHeight: 1.6 }}>
        Coordonnées du gestionnaire de paie externe (cabinet de paie), dossier par dossier — utile pour contacter directement l'interlocuteur en cas de question sur les bulletins ou les OD de salaires.
      </p>
      <FilterBar search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={concernes.length} />
      <Panel title={`Dossiers concernés (${concernes.length})`}>
        {concernes.length === 0 ? <EmptyNote text="Aucun dossier marqué « concerné » pour l'instant — depuis Cadre social ou Cotisations sociales." /> : (
          <div className="scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Dossier</th><th style={thStyle}>Cabinet de paie</th><th style={thStyle}>Gestionnaire</th>
                  <th style={thStyle}>Adresse</th><th style={thStyle}>Téléphone</th><th style={thStyle}>E-mail</th>
                </tr>
              </thead>
              <tbody>
                {concernes.map((c) => (
                  <tr key={c.id} className="hoverRow">
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" }}>{c.nom}</td>
                    <td style={tdStyle}>
                      <input defaultValue={c.social?.cabinetPaie || ""} placeholder="ex. Silae, ADP…" onBlur={(e) => patchSocial(c, { cabinetPaie: e.target.value })} style={{ ...cellInput, width: 110 }} />
                    </td>
                    <td style={tdStyle}>
                      <input defaultValue={c.social?.gestionnaireNom || ""} placeholder="Nom du gestionnaire" onBlur={(e) => patchSocial(c, { gestionnaireNom: e.target.value })} style={{ ...cellInput, width: 130 }} />
                    </td>
                    <td style={tdStyle}>
                      <input defaultValue={c.social?.gestionnaireAdresse || ""} placeholder="Adresse" onBlur={(e) => patchSocial(c, { gestionnaireAdresse: e.target.value })} style={{ ...cellInput, width: 170 }} />
                    </td>
                    <td style={tdStyle}>
                      <input defaultValue={c.social?.gestionnaireTel || ""} placeholder="Téléphone" onBlur={(e) => patchSocial(c, { gestionnaireTel: e.target.value })} style={{ ...cellInput, width: 110 }} />
                    </td>
                    <td style={tdStyle}>
                      <input defaultValue={c.social?.gestionnaireEmail || ""} placeholder="E-mail" onBlur={(e) => patchSocial(c, { gestionnaireEmail: e.target.value })} style={{ ...cellInput, width: 170 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <div style={{ height: 16 }} />
      <Panel title={`Autres dossiers (${autres.length})`}>
        {autres.length === 0 ? <EmptyNote text="Tous les dossiers de cette sélection sont marqués concernés." /> : autres.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 12.5 }}>{c.nom}</span>
            <ConcerneToggle on={!!c.social?.concerne} onChange={(v) => patchSocial(c, { concerne: v })} />
          </div>
        ))}
      </Panel>
    </div>
  );
}

export { GestionnairePaieView };
