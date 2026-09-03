import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { InfoHint } from "./InfoHint.jsx";
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



function CadreSocialView({ clients, search, setSearch, roleFilter, setRoleFilter, me, onUpdate }) {
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const concernes = filtered.filter((c) => c.social?.concerne);
  const autres = filtered.filter((c) => !c.social?.concerne);

  const patchSocial = (c, patch) => onUpdate(c.id, { social: { ...(c.social || {}), ...patch } });
  const cycleMonth = (c, mois) => {
    const odMois = c.social?.odMois || {};
    patchSocial(c, { odMois: { ...odMois, [mois]: odCycle(odMois[mois]) } });
  };

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Cadre social</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18, lineHeight: 1.6 }}>
        <InfoHint summary={<>Suivi de réception et comptabilisation des OD de salaire. Cliquez une cellule : vide → <Stamped tone="amber" small>Reçu</Stamped> → <Stamped tone="green" small>Compta</Stamped> → <Stamped tone="neutral" small>N/A</Stamped>.</>}>
          Le cabinet n'établit pas les bulletins de paie. Ce suivi concerne uniquement la réception et la comptabilisation des OD de salaire transmises par le cabinet de paie externe.
          {" "}Cliquez une cellule : vide → <Stamped tone="amber" small>Reçu</Stamped> → <Stamped tone="green" small>Compta</Stamped> → <Stamped tone="neutral" small>N/A</Stamped>.
        </InfoHint>
      </p>
      <FilterBar search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} />

      <Panel title={`Dossiers concernés (${concernes.length})`}>
        {concernes.length === 0 ? <EmptyNote text="Aucun dossier marqué « concerné » pour l'instant." /> : (
          <div className="scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5 }}>
            <thead>
  <tr>
    <th style={thStyle}>Dossier</th><th style={thStyle}>Effectif</th><th style={thStyle}>Cabinet de paie</th>
    <th style={thStyle}>Convention collective</th><th style={thStyle}>Régime dirigeant</th><th style={thStyle}>Seuil</th>
    {MOIS_ORDER.map((m) => <th key={m} style={{ ...thStyle, textAlign: "center" }}>{m}</th>)}
  </tr>
</thead>
<tbody>
  {concernes.map((c) => (
    <tr key={c.id} className="hoverRow">
      <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" }}>{c.nom}</td>
      <td style={tdStyle}>
        <input defaultValue={c.social?.effectif || ""} placeholder="—" onBlur={(e) => patchSocial(c, { effectif: e.target.value })}
          style={{ width: 44, textAlign: "center", fontFamily: T.mono, fontSize: 11.5, padding: "3px 2px", borderRadius: 5, border: `1px solid ${T.line}`, background: T.paper }} />
      </td>
      <td style={tdStyle}>
        <input defaultValue={c.social?.cabinetPaie || ""} placeholder="ex. Silae, ADP…" onBlur={(e) => patchSocial(c, { cabinetPaie: e.target.value })}
          style={{ width: 120, fontSize: 11.5, padding: "3px 6px", borderRadius: 5, border: `1px solid ${T.line}`, background: T.paper }} />
      </td>
      <td style={tdStyle}>
        <input defaultValue={c.social?.conventionCollective || ""} placeholder="ex. Syntec" onBlur={(e) => patchSocial(c, { conventionCollective: e.target.value })}
          style={{ width: 100, fontSize: 11.5, padding: "3px 6px", borderRadius: 5, border: `1px solid ${T.line}`, background: T.paper }} />
      </td>
      <td style={tdStyle}>
        <select defaultValue={c.social?.regimeDirigeant || ""} onChange={(e) => patchSocial(c, { regimeDirigeant: e.target.value })}
          style={{ fontFamily: T.mono, fontSize: 11, padding: "3px 4px", borderRadius: 5, border: `1px solid ${T.line}`, background: T.paper }}>
          <option value="">—</option><option value="assimile_salarie">Assimilé salarié</option><option value="tns">TNS</option>
        </select>
      </td>
      <td style={tdStyle}>
        {(() => { const s = seuilEffectifAlert(c.social?.effectif); return s ? <Stamped tone={s.tone} small>{s.label}</Stamped> : <span style={{ color: T.inkMuted }}>—</span>; })()}
      </td>
      {MOIS_ORDER.map((m) => (
        <td key={m} style={{ ...tdStyle, textAlign: "center" }}>
          <button className="clickable" onClick={() => cycleMonth(c, m)} style={{ background: "none", border: "none", padding: 0 }}>
            <Stamped tone={odTone(c.social?.odMois?.[m])} small>{odLabel(c.social?.odMois?.[m])}</Stamped>
          </button>
        </td>
      ))}
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

export { CadreSocialView };
