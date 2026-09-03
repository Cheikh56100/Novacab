import { Search, Plus, ShieldCheck, Download, Info } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { SocialAccessRow } from "./SocialAccessRow.jsx";
import { OrganismesImportPreviewModal } from "./OrganismesImportPreviewModal.jsx";
import { Shared } from "./shared.js";
const { T, canEditOrganismesSociaux } = Shared;
const { useState, useEffect, useMemo, useCallback, useRef } = React;



function AccesOrganismesSociauxView({ clients, portefeuilleId, me, meRole, onOpenClient }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const fileRef = useRef(null);

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    const data = await loadOrganismesSociauxRemote(portefeuilleId);
    setRows(data);
    setLoading(false);
  }, [portefeuilleId]);
  useEffect(() => { reload(); }, [reload]);

  const byClient = useMemo(() => {
    const map = new Map();
    rows.forEach(r => { if (!map.has(r.client_id)) map.set(r.client_id, []); map.get(r.client_id).push(r); });
    return [...map.entries()].map(([clientId, access]) => ({ client: clients.find(c => c.id === clientId), access }))
      .filter(x => x.client)
      .sort((a,b) => String(a.client.nom).localeCompare(String(b.client.nom), "fr"));
  }, [rows, clients]);

  const filtered = byClient.filter(group => {
    const q = search.trim().toLowerCase(); if (!q) return true;
    return group.client.nom.toLowerCase().includes(q) || String(group.client.siren || "").includes(q) || group.access.some(a => `${a.organisme} ${a.identifiant} ${a.libelle}`.toLowerCase().includes(q));
  });

  const createRow = async (client) => {
    if (!canEditOrganismesSociaux(meRole)) return;
    const row = await insertOrganismeSocialRemote({ portefeuille_id: portefeuilleId, client_id: client.id, organisme: "URSSAF", libelle: "", identifiant: "", secret: "", siret: client.siret || "", note: "", created_by: me });
    if (row) setRows(prev => [...prev, row]);
  };
  const saveRow = async draft => {
    if (!canEditOrganismesSociaux(meRole)) return;
    const row = await updateOrganismeSocialRemote(draft.id, { organisme: draft.organisme, libelle: draft.libelle, identifiant: draft.identifiant, secret: draft.secret, siret: draft.siret, note: draft.note, updated_by: me, updated_at: new Date().toISOString() });
    if (row) setRows(prev => prev.map(r => r.id === row.id ? row : r));
  };
  const deleteRow = async id => {
    if (!canEditOrganismesSociaux(meRole)) return;
    if (!confirm("Supprimer définitivement cet accès ?")) return;
    if (await deleteOrganismeSocialRemote(id)) setRows(prev => prev.filter(r => r.id !== id));
  };

  const importExcel = async file => {
    if (!canEditOrganismesSociaux(meRole) || !file) return;
    setImporting(true); setError("");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      if (!wb.SheetNames.length) throw new Error("Le classeur ne contient aucune feuille exploitable.");
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      if (!data.length) throw new Error("Aucune ligne de données détectée. Utilisez la première feuille avec une ligne d'en-têtes.");
      const normalizeKey = key => String(key).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      const prepared = data.map((raw, index) => {
        const norm = {}; Object.entries(raw).forEach(([k,v]) => norm[normalizeKey(k)] = String(v ?? "").trim());
        const clientName = norm.client || norm.clientnom || norm.dossier || norm.societe || norm.societenom || norm.entreprise || norm.entreprisenom || "";
        const sirenRaw = norm.siren || "";
        const siretRaw = norm.siret || "";
        const siren = sirenRaw.replace(/\D/g, "");
        const siret = siretRaw.replace(/\D/g, "");
        const client = clients.find(c => {
          const cName = String(c.nom || "").trim().toLowerCase();
          const cSiren = String(c.siren || "").replace(/\D/g, "");
          const cSiret = String(c.siret || "").replace(/\D/g, "");
          return (clientName && cName === clientName.toLowerCase()) || (siren && cSiren === siren) || (siret && cSiret === siret);
        });
        const organismeRaw = norm.organisme || norm.organismesocial || norm.type || "";
        const knownOrganisme = ORGANISMES_SOCIAUX.find(x => x.toLowerCase() === organismeRaw.toLowerCase());
        const organisme = knownOrganisme || organismeRaw;
        const errors = [];
        const warnings = [];
        if (!client) errors.push(clientName || siren || siret ? "dossier introuvable (nom/SIREN/SIRET)" : "client ou identifiant de rapprochement manquant");
        if (!organisme) errors.push("organisme manquant");
        const identifiant = norm.identifiant || norm.login || norm.username || "";
        const secret = norm.motdepasse || norm.password || norm.secret || norm.cle || "";
        if (!identifiant && !secret) warnings.push("aucun identifiant ni secret fourni");
        if (organismeRaw && !knownOrganisme) warnings.push("organisme non référencé : conservé comme libellé personnalisé");
        return { line:index+2, client, organisme:organisme || "Autre", libelle:norm.libelle || norm.nom || "", identifiant, secret, siret:siret || client?.siret || "", note:norm.note || norm.url || "", errors, warnings };
      });
      const requiredHeaders = ["Client (ou Dossier)", "SIREN ou SIRET", "Organisme"];
      const actualHeaders = Object.keys(data[0] || {});
      const normalizedHeaders = actualHeaders.map(normalizeKey);
      const hasClientHeader = ["client","clientnom","dossier","societe","societenom","entreprise","entreprisenom"].some(h => normalizedHeaders.includes(h));
      const hasIdHeader = ["siren","siret"].some(h => normalizedHeaders.includes(h));
      const hasOrgHeader = ["organisme","organismesocial","type"].some(h => normalizedHeaders.includes(h));
      const missingHeaders = [];
      if (!hasClientHeader && !hasIdHeader) missingHeaders.push("Client/Dossier ou SIREN/SIRET");
      if (!hasOrgHeader) missingHeaders.push("Organisme");
      setImportPreview({ rows: prepared, valid: prepared.filter(r => !r.errors.length), fileName:file.name, sheetName:wb.SheetNames[0], total:data.length, headers:actualHeaders, missingHeaders, requiredHeaders, warningsCount:prepared.reduce((n,r)=>n+r.warnings.length,0) });
    } catch (e) { setError(e?.message || "Impossible de lire le fichier Excel."); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const confirmImportExcel = async () => {
    const valid = importPreview?.valid || []; if (!valid.length) return;
    setImporting(true); setError("");
    try {
      let added=0;
      for (const r of valid) {
        const row=await insertOrganismeSocialRemote({ portefeuille_id:portefeuilleId, client_id:r.client.id, organisme:r.organisme, libelle:r.libelle, identifiant:r.identifiant, secret:r.secret, siret:r.siret, note:r.note, created_by:me });
        if(row){ setRows(prev=>[...prev,row]); added++; }
      }
      setImportPreview(null); if(!added) setError("Aucun accès n'a été créé. Vérifiez les droits et les données du fichier.");
    } catch(e){ setError(e?.message || "L'import n'a pas pu être finalisé."); } finally { setImporting(false); }
  };

  return (
    <div>
      <Reveal>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 18, color: T.ink }}>Accès organismes sociaux</h2>
            <p style={{ margin: "5px 0 0", color: T.inkMuted, fontSize: 11.5, lineHeight: 1.5 }}>URSSAF, Net-entreprise, SYLAE, CIBTP, OPCO, France Travail, médecine du travail… Un dossier à la fois, avec recherche et import Excel.</p>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => importExcel(e.target.files?.[0])} style={{ display: "none" }} disabled={!canEditOrganismesSociaux(meRole)} />
            {canEditOrganismesSociaux(meRole) && <button onClick={() => downloadOrganismesTemplate()} type="button" className="btn-secondary !py-2"><Download size={13} /> Télécharger le modèle Excel</button>}
            {canEditOrganismesSociaux(meRole) && <button onClick={() => setImportPreview({ mode:"instructions", fileName:"Format attendu" })} type="button" className="btn-secondary !py-2"><Info size={13} /> Format attendu</button>}
            {canEditOrganismesSociaux(meRole) && <button onClick={() => fileRef.current?.click()} disabled={importing} style={{ display: "flex", alignItems: "center", gap: 6, background: T.navy, color: "#fff", border: 0, borderRadius: 9, padding: "8px 12px", fontSize: 11.5, fontWeight: 700, cursor: importing ? "default" : "pointer", opacity: importing ? .7 : 1 }}><Download size={13} /> {importing ? "Analyse…" : "Importer le classeur Excel"}</button>}
            <span style={{ fontSize: 10.5, color: T.green, fontWeight: 700, background: T.greenSoft, padding: "6px 9px", borderRadius: 999 }}>{rows.length} accès enregistrés</span>
          </div>
        </div>
      </Reveal>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ position: "relative", flex: 1 }}><Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.inkMuted }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un dossier, SIREN ou organisme…" style={{ width: "100%", padding: "8px 10px 8px 31px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, fontSize: 12 }} /></div>
      </div>
      <div style={{ background: T.navySoft, color: T.inkSoft, borderRadius: 9, padding: "8px 11px", fontSize: 11, display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}><ShieldCheck size={14} color={T.navy} /> Rubrique protégée. <b>Accès réservé aux Admin, Experts et Chefs de mission.</b> Les droits sont également appliqués côté Supabase (RLS).</div>
      {error && <div style={{ background: T.redSoft, color: T.red, borderRadius: 9, padding: "8px 11px", fontSize: 11, marginBottom: 10 }}>{error}</div>}
      {loading ? <EmptyNote text="Chargement des accès…" /> : filtered.length === 0 ? <EmptyNote text="Aucun accès organisme social enregistré." /> : filtered.map(({ client, access }) => (
        <Panel key={client.id} title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><span>{client.nom}</span><span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted }}>{client.siren || ""}</span></div>} right={<Stamped tone="green" small>{access.length} organisme{access.length > 1 ? "s" : ""}</Stamped>}>
          {access.map(row => <SocialAccessRow key={row.id} row={row} onSave={saveRow} onDelete={() => deleteRow(row.id)} canEdit={canEditOrganismesSociaux(meRole)} />)}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {canEditOrganismesSociaux(meRole) && <button onClick={() => createRow(client)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px dashed ${T.line}`, borderRadius: 8, padding: "7px 10px", color: T.navy, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Ajouter un accès</button>}
            <button onClick={() => onOpenClient(client.id)} style={{ background: "none", border: "none", color: T.inkMuted, fontSize: 11, cursor: "pointer" }}>Ouvrir la fiche client →</button>
          </div>
        </Panel>
      ))}
      <OrganismesImportPreviewModal preview={importPreview} importing={importing} onClose={()=>setImportPreview(null)} onConfirm={confirmImportExcel} />
    </div>
  );
}

export { AccesOrganismesSociauxView };
