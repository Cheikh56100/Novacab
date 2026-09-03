import { Users, Receipt, Landmark, Plus, ShieldCheck, Download } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { AccesOrganismesSociauxView } from "./AccesOrganismesSociauxView.jsx";
import { GestionnairePaieView } from "./GestionnairePaieView.jsx";
import { CotisationsSocialesView } from "./CotisationsSocialesView.jsx";
import { SocialImportPreviewModal } from "./SocialImportPreviewModal.jsx";
import { CadreSocialView } from "./CadreSocialView.jsx";
import { NewTaskForm } from "./NewTaskForm.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo, useRef } = React;



function SocialPaieCentre({ clients, team, search, setSearch, roleFilter, setRoleFilter, me, meRole, onUpdate, portefeuilleId, onOpenClient, onCreateTask }) {
  const [tab, setTab] = useState("overview");
  const [showNewAction, setShowNewAction] = useState(false);
  const [socialImport, setSocialImport] = useState({ open: false, file: null, preview: null, busy: false, error: "" });
  const socialFileRef = useRef(null);

  const normalizeHeader = (v) => normalizeText(v).replace(/\s+/g, "");
  const normalizeMonth = (v) => {
    const raw = normalizeText(v);
    const aliases = { janvier:"Jan", jan:"Jan", fevrier:"Fév", fev:"Fév", février:"Fév", fevr:"Fév", mars:"Mar", avril:"Avr", avr:"Avr", mai:"Mai", juin:"Juin", juillet:"Juil", juil:"Juil", aout:"Août", août:"Août", septembre:"Sept", sept:"Sept", octobre:"Oct", oct:"Oct", novembre:"Nov", nov:"Nov", decembre:"Déc", décembre:"Déc", dec:"Déc" };
    if (/^\d{1,2}$/.test(raw)) return MOIS_ORDER[Number(raw)-1] || null;
    return aliases[raw] || MOIS_ORDER.find(m => normalizeText(m) === raw) || null;
  };
  const normalizeOdStatus = (v) => {
    const x = normalizeText(v).toUpperCase();
    if (!x) return "";
    if (["RECU","RECUE","RECUe","RECEIVED"].includes(x) || x.includes("RECU")) return "RECU";
    if (x.includes("COMPTA") || x.includes("COMPTABIL")) return "COMPTA";
    if (x === "NA" || x.includes("NON APPLICABLE")) return "NA";
    return null;
  };
  const parseSocialImport = async (file) => {
    setSocialImport({ open: true, file, preview: null, busy: true, error: "" });
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const rows = rawRows.map((raw, index) => {
        const norm = {}; Object.entries(raw).forEach(([k,v]) => norm[normalizeHeader(k)] = String(v ?? "").trim());
        const clientName = norm.client || norm.clientnom || norm.dossier || norm.societe || norm.societenom || "";
        const siren = (norm.siren || norm.siret || "").replace(/\D/g, "");
        const month = normalizeMonth(norm.mois || norm.periode || norm.month || "");
        const status = normalizeOdStatus(norm.statut || norm.etat || norm.od || norm.etatod || "");
        const client = clients.find(c => (clientName && c.nom.toLowerCase() === clientName.toLowerCase()) || (siren && String(c.siren || "").replace(/\D/g, "") === siren.slice(0,9)));
        const errors = [];
        if (!client) errors.push("dossier introuvable (nom ou SIREN)");
        if (!month) errors.push("mois invalide");
        if (status === null || status === "") errors.push("statut obligatoire : Reçu, Compta ou N/A");
        return { index: index + 2, client, clientName, siren, month, status, errors, raw };
      });
      const valid = rows.filter(r => r.errors.length === 0);
      setSocialImport({ open: true, file, preview: { rows, valid }, busy: false, error: "" });
    } catch (e) {
      setSocialImport({ open: true, file, preview: null, busy: false, error: e?.message || "Impossible de lire le fichier." });
    }
  };
  const confirmSocialImport = async () => {
    const valid = socialImport.preview?.valid || []; if (!valid.length) return;
    setSocialImport(s => ({ ...s, busy: true, error: "" }));
    try {
      for (const r of valid) {
        const c = r.client; const social = c.social || {}; const odMois = { ...(social.odMois || {}) };
        odMois[r.month] = r.status; await onUpdate(c.id, { social: { ...social, odMois } });
      }
      setSocialImport({ open: false, file: null, preview: null, busy: false, error: "" });
    } catch (e) { setSocialImport(s => ({ ...s, busy: false, error: e?.message || "L'import n'a pas pu être finalisé." })); }
  };
  const filtered = useMemo(() => filterClients(clients, search, roleFilter, me), [clients, search, roleFilter, me]);
  const concernes = filtered.filter((c) => c.social?.concerne);
  const currentMonth = currentMonthKey();
  const totalDossiers = concernes.length;
  const odRecus = concernes.filter((c) => ["RECU", "COMPTA"].includes((c.social?.odMois?.[currentMonth] || "").toUpperCase())).length;
  const odCompta = concernes.filter((c) => (c.social?.odMois?.[currentMonth] || "").toUpperCase() === "COMPTA").length;
  const cotisDone = concernes.filter((c) => {
    const types = cotisationTypesFor(c); const rev = c.revision || {}; const cm = rev.cotisMois || {};
    return types.length > 0 && types.every((t) => (cm[t.key]?.[currentMonth] || "") !== "");
  }).length;
  const stats = [
    { label: "Dossiers sociaux", value: totalDossiers, detail: "dossiers concernés", icon: Users, tone: "blue" },
    { label: "OD de salaires", value: odRecus, detail: `${odCompta} comptabilisées`, icon: Receipt, tone: "green" },
    { label: "Cotisations", value: cotisDone, detail: "dossiers suivis ce mois", icon: Landmark, tone: "purple" },
    { label: "Accès organismes", value: "Sécurisés", detail: "URSSAF · Net-entreprises · SYLAE…", icon: ShieldCheck, tone: "orange" },
  ];
  const tone = { blue: "#17345F", green: "#16A34A", purple: "#7C3AED", orange: "#EA580C" };
  const tabs = [
    ["overview", "Vue d'ensemble"],
    ["social", "Suivi social (OD salaires)"],
    ["cotisations", "Cotisations sociales"],
    ["paie", "Gestionnaire de paie"],
    ["acces", "Accès organismes sociaux"],
  ];
  return <div>
    <Reveal>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div><h1 style={{fontFamily:T.serif,fontSize:22,fontWeight:800,color:T.ink,margin:0}}>Social &amp; paie</h1><p style={{color:T.inkMuted,fontSize:12.5,margin:"5px 0 0"}}>Suivez les OD de salaires, les cotisations et les accès aux organismes sociaux.</p></div>
        <div className="flex gap-2">
          <input ref={socialFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f=e.target.files?.[0]; e.target.value=""; if(f) parseSocialImport(f); }} />
          <button className="btn-secondary" onClick={()=>socialFileRef.current?.click()}><Download size={14}/> Importer Excel/CSV</button>
          <button className="btn-primary" onClick={()=>setShowNewAction(true)}><Plus size={14}/> Nouvelle action</button>
        </div>
      </div>
    </Reveal>
    <div className="flex gap-5 border-b border-line mb-4 overflow-x-auto scrollbar">
      {tabs.map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`whitespace-nowrap px-2 pb-2.5 text-[11.5px] font-semibold border-b-2 transition-colors ${tab===id?"border-accent text-accent":"border-transparent text-inkmuted hover:text-ink"}`}>{label}</button>)}
    </div>
    {tab === "overview" && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {stats.map((s)=><div key={s.label} className="card p-4 flex items-start gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${tone[s.tone]}12`,color:tone[s.tone]}}><s.icon size={19}/></div><div><div className="text-[11px] text-inkmuted">{s.label}</div><div className="text-xl font-extrabold text-ink mt-0.5">{s.value}</div><div className="text-[10px] text-inkmuted mt-1">{s.detail}</div></div></div>)}
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <Panel title="Suivi des OD de salaires">
          <div className="flex items-center justify-between py-2 border-b border-line"><span className="text-xs text-inksoft">Dossiers concernés</span><b className="text-sm text-ink">{totalDossiers}</b></div>
          <div className="flex items-center justify-between py-2 border-b border-line"><span className="text-xs text-inksoft">OD reçues</span><b className="text-sm text-ink">{odRecus}</b></div>
          <div className="flex items-center justify-between py-2"><span className="text-xs text-inksoft">OD comptabilisées</span><b className="text-sm text-green-600">{odCompta}</b></div>
          <button className="text-xs font-semibold text-accent mt-2" onClick={()=>setTab("social")}>Voir le suivi complet →</button>
        </Panel>
        <Panel title="Cotisations sociales">
          <div className="flex items-center justify-between py-2 border-b border-line"><span className="text-xs text-inksoft">Suivi complet ce mois</span><b className="text-sm text-green-600">{cotisDone}/{totalDossiers}</b></div>
          <div className="flex items-center justify-between py-2"><span className="text-xs text-inksoft">Types suivis</span><span className="text-xs text-inkmuted">URSSAF · retraite · prévoyance · BTP</span></div>
          <button className="text-xs font-semibold text-accent mt-2" onClick={()=>setTab("cotisations")}>Voir les cotisations →</button>
        </Panel>
      </div>
      <div className="mt-4">
        <Panel title="Échéances et accès sensibles">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-accent-soft p-3"><div className="flex items-center gap-2 text-xs font-bold text-accent"><ShieldCheck size={15}/> Accès organismes sociaux</div><p className="text-[11px] text-inkmuted mt-1.5">Les identifiants sensibles sont centralisés et protégés. Accès réservé aux profils habilités.</p><button className="text-xs font-semibold text-accent" onClick={()=>setTab("acces")}>Ouvrir la rubrique →</button></div>
            <div className="rounded-xl border border-line p-3"><div className="text-xs font-bold text-ink">Gestionnaire de paie</div><p className="text-[11px] text-inkmuted mt-1.5">Coordonnées des cabinets de paie externes et interlocuteurs par dossier.</p><button className="text-xs font-semibold text-accent" onClick={()=>setTab("paie")}>Voir les gestionnaires →</button></div>
          </div>
        </Panel>
      </div>
    </>}
    {tab === "social" && <CadreSocialView clients={clients} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={onUpdate} />}
    {tab === "cotisations" && <CotisationsSocialesView clients={clients} search={search} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={onUpdate} />}
    {tab === "paie" && <GestionnairePaieView clients={clients} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} me={me} onUpdate={onUpdate} />}
    {tab === "acces" && <AccesOrganismesSociauxView clients={(clients || []).filter((c) => c.portefeuilleId === portefeuilleId)} portefeuilleId={portefeuilleId} me={me} meRole={meRole} onOpenClient={onOpenClient} />}
    {showNewAction && <div style={{ position:"fixed", inset:0, zIndex:80, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={()=>setShowNewAction(false)} style={{ position:"absolute", inset:0, background:"rgba(15,23,42,.42)" }} />
      <div className="scrollbar" style={{ position:"relative", width:"min(760px,92vw)", maxHeight:"88vh", overflowY:"auto" }}>
        <NewTaskForm clients={clients} team={team || []} onCancel={()=>setShowNewAction(false)} onSubmit={async payload => { await onCreateTask?.(payload); setShowNewAction(false); }} />
      </div>
    </div>}
    {socialImport.open && <SocialImportPreviewModal state={socialImport} onClose={()=>!socialImport.busy && setSocialImport({open:false,file:null,preview:null,busy:false,error:""})} onConfirm={confirmSocialImport} />}
  </div>;
}

export { SocialPaieCentre };
