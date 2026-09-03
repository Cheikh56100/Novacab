import { Loader2, Plus, CircleDot, Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { SECTEURS_ACTIVITE, buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useEffect } = React;


function AidesSecteurView({ content, canEdit, onUpdate }) {
  const [active, setActive] = useState(SECTEURS_ACTIVITE[0].id);
  const data = content[active] || { aides: [], obligations: [] };

  // Cache par secteur : { loading, error, items } — évite de re-fetcher à chaque clic d'onglet
  const [newsCache, setNewsCache] = useState({});
  useEffect(() => {
    if (newsCache[active]?.items?.length || newsCache[active]?.loading) return;
    let cancelled = false;
    setNewsCache((prev) => ({ ...prev, [active]: { loading: true, error: null, items: prev[active]?.items || [] } }));
    fetchSecteurNews(active)
      .then((items) => { if (!cancelled) setNewsCache((prev) => ({ ...prev, [active]: { loading: false, error: null, items } })); })
      .catch((err) => { if (!cancelled) setNewsCache((prev) => ({ ...prev, [active]: { loading: false, error: err.message, items: [] } })); });
    return () => { cancelled = true; };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeNews = newsCache[active] || { loading: false, error: null, items: [] };

  const addLine = (field) => onUpdate(active, { [field]: [...(data[field] || []), ""] });
  const editLine = (field, idx, v) => {
    const arr = [...(data[field] || [])]; arr[idx] = v; onUpdate(active, { [field]: arr });
  };
  const removeLine = (field, idx) => {
    const arr = (data[field] || []).filter((_, i) => i !== idx); onUpdate(active, { [field]: arr });
  };

  const renderList = (field, title, tone) => (
    <Panel title={title}>
      {(data[field] || []).length === 0 && !canEdit ? <EmptyNote text="Rien de renseigné pour ce secteur." /> : null}
      {(data[field] || []).map((line, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderBottom: `1px solid ${T.line}` }}>
          <CircleDot size={7} color={tone} style={{ flexShrink: 0 }} />
          {canEdit ? (
            <input defaultValue={line} onBlur={(e) => editLine(field, idx, e.target.value)}
              style={{ flex: 1, fontSize: 12.5, border: "none", background: "transparent", padding: "2px 0" }} />
          ) : (
            <span style={{ flex: 1, fontSize: 12.5, color: T.ink }}>{line}</span>
          )}
          {canEdit && (
            <button onClick={() => removeLine(field, idx)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkMuted }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
      {canEdit && (
        <button onClick={() => addLine(field)} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, background: "none", border: `1px dashed ${T.line}`, borderRadius: 9, padding: "7px 12px", fontSize: 12, color: T.navy, cursor: "pointer" }}>
          <Plus size={13} /> Ajouter une ligne
        </button>
      )}
    </Panel>
  );

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 700, color: T.ink, margin: "0 0 6px" }}>Actualités & Aides par secteur</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 0, marginBottom: 18 }}>
        Aides, dispositifs et obligations réglementaires propres à chaque secteur d'activité.
        {canEdit ? " Modifiable directement ici." : " Lecture seule — seuls Expert, Chef de mission et Admin peuvent l'éditer."}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {SECTEURS_ACTIVITE.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{
            fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 999, cursor: "pointer",
            border: `1px solid ${active === s.id ? s.color : T.line}`,
            background: active === s.id ? s.color + "1A" : "transparent",
            color: active === s.id ? s.color : T.inkMuted,
          }}>{s.label}</button>
        ))}
      </div>
      {renderList("aides", "Aides & dispositifs", T.navy)}
      <div style={{ height: 14 }} />
      {renderList("obligations", "Obligations réglementaires", T.gold)}
      <div style={{ height: 14 }} />
      <Panel title="Actualités en direct (Google Actualités + Service-Public.fr)">
        {activeNews.loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px", color: T.inkMuted, fontSize: 12.5 }}>
            <Loader2 size={14} className="spin" /> Chargement des actualités…
          </div>
        )}
        {!activeNews.loading && activeNews.error && (
          <EmptyNote text={`Flux indisponible pour le moment (${activeNews.error})`} />
        )}
        {!activeNews.loading && !activeNews.error && activeNews.items.length === 0 && (
          <EmptyNote text="Aucune actualité récente trouvée pour ce secteur." />
        )}
        {!activeNews.loading && activeNews.items.map((it, idx) => (
          <a key={idx} href={it.link} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", padding: "8px 4px", borderBottom: `1px solid ${T.line}`, textDecoration: "none" }}>
            <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{it.title}</div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>
              {it.source}{it.date ? ` · ${new Date(it.date).toLocaleDateString("fr-FR")}` : ""}
            </div>
          </a>
        ))}
      </Panel>
      {content[active]?.updatedAt && (
        <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 14 }}>
          Dernière mise à jour : {new Date(content[active].updatedAt).toLocaleDateString("fr-FR")}{content[active].updatedBy ? ` par ${content[active].updatedBy}` : ""}
        </div>
      )}
    </div>
  );
}

export { AidesSecteurView };
