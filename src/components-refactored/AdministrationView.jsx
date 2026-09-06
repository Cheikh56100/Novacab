import React, { useMemo, useState } from "react";
import { exportAdministrationExcel } from "./administrationExcel.js";
import * as XLSX from "xlsx";
import { administrationRequestLabel, isOpenAdministrationRequest } from "../services/administrationWorkflow";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Box, Briefcase, CalendarDays,
  CheckCircle2, ChevronRight, CircleDollarSign, Clock3, FileCheck2,
  FileText, History, Landmark, Mail, Phone, Plus, RefreshCw, Settings2, ShieldCheck,
  Trash2, TrendingUp, Users, Wallet, XCircle, Zap, Folder, FileSpreadsheet, UserCog, Upload, Download, ClipboardList
} from "lucide-react";
import { Shared } from "./shared.js";
import { loadCabinetState, saveCabinetState, subscribeCabinetState, auditProductAction, scheduleFollowups } from "../services/cabinetState.js";
import { getAdministrationSignals, billingPeriodLabel } from "../services/administrationLiaison.js";
import { insertTeamMemberRemote } from "./core.js";
const { T } = Shared;

const money = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(v || 0));
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("fr-FR") : "—";
const daysLate = (date) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const inputClass = "border border-line rounded-lg bg-app px-2 py-1.5 text-[10.5px] text-ink w-full outline-none focus:border-accent";

const seedInvoices = (clients = []) => {
  const names = clients.slice(0, 8).map(c => c.nom).filter(Boolean);
  const base = [
    { client: names[0] || "Client A", invoice: "F2026-125", amount: 540, due: "2026-08-21", status: "en_retard" },
    { client: names[1] || "Client B", invoice: "F2026-126", amount: 780, due: "2026-08-28", status: "en_retard" },
    { client: names[2] || "Client C", invoice: "F2026-127", amount: 420, due: "2026-09-10", status: "a_venir" },
    { client: names[3] || "Client D", invoice: "F2026-128", amount: 1250, due: "2026-09-05", status: "payee" },
    { client: names[4] || "Client E", invoice: "F2026-129", amount: 690, due: "2026-08-15", status: "en_retard" },
  ];
  return base.map((x, i) => ({ ...x, id: `inv-${i+1}`, paidAt: x.status === "payee" ? "2026-09-04" : null }));
};

const seedTools = () => [];
const seedRejets = () => [];

const DEFAULT = () => ({
  invoices: [],
  tools: [],
  rejects: [],
  entries: [],
  exits: [],
  reminders: [],
  history: [],
  costs: [],
  contracts: [],
  licenses: [],
  workloads: [],
  distributions: []
});

function Card({ children, className = "", onClick }) {
  return <div onClick={onClick} className={`rounded-2xl border border-line bg-app shadow-sm ${onClick ? "cursor-pointer hover:border-accent transition-colors" : ""} ${className}`}>{children}</div>;
}
function Kpi({ label, value, icon: Icon, tone = "navy", detail, onClick }) {
  const tones = {
    navy: { bg: "bg-accent-soft", fg: "text-accent-deep" },
    green: { bg: "bg-emerald-50", fg: "text-emerald-700" },
    amber: { bg: "bg-amber-50", fg: "text-amber-700" },
    red: { bg: "bg-red-50", fg: "text-red-700" }
  };
  const t = tones[tone] || tones.navy;
  return <Card onClick={onClick} className="p-4">
    <div className="flex items-start justify-between gap-3">
      <div><div className="text-[10px] uppercase tracking-[.12em] text-inkmuted font-bold">{label}</div><div className="mt-2 text-2xl font-extrabold text-ink">{value}</div>{detail && <div className="mt-1 text-[10.5px] text-inkmuted">{detail}</div>}</div>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.bg} ${t.fg}`}><Icon size={17}/></div>
    </div>
  </Card>;
}
function Pill({ children, tone = "neutral" }) {
  const c = tone === "red" ? "bg-red-50 text-red-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-accent-soft text-accent-deep";
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${c}`}>{children}</span>;
}
function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return <div className="flex items-center justify-between gap-3 mb-4">
    <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-accent-soft text-accent-deep flex items-center justify-center"><Icon size={15}/></div><div><h2 className="text-[14px] font-extrabold text-ink m-0">{title}</h2>{subtitle && <p className="text-[10.5px] text-inkmuted m-0 mt-0.5">{subtitle}</p>}</div></div>
    {action}
  </div>;
}
function MiniBarChart({ data = [], formatter = (v) => v, onItemClick }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value || 0)));
  return <div className="space-y-2.5">{data.map((d) => {
    const pct = Math.max(4, Math.round((Number(d.value || 0) / max) * 100));
    return <button type="button" key={d.label} onClick={() => onItemClick?.(d)} className="w-full text-left">
      <div className="flex items-center justify-between gap-3 text-[10.5px] mb-1">
        <span className="font-semibold text-ink truncate">{d.label}</span>
        <span className="font-extrabold text-ink whitespace-nowrap">{formatter(d.value)}</span>
      </div>
      <div className="h-2 rounded-full bg-line overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </button>;
  })}</div>;
}

function Table({ columns, rows, empty = "Aucune donnée." }) {
  return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{columns.map(c => <th key={c.key} className="px-3 py-2 text-[9.5px] uppercase tracking-[.1em] text-inkmuted font-bold border-b border-line">{c.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r, i) => <tr key={r.id || i} className="border-b border-line last:border-0 hover:bg-app/70">{columns.map(c => <td key={c.key} className="px-3 py-2.5 text-[11px] text-ink">{c.render ? c.render(r) : r[c.key]}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-[11px] text-inkmuted">{empty}</td></tr>}</tbody></table></div>;
}

const ENTRY_STEPS = [
  ["lettre", "Lettre de mission"], ["sepa", "Mandat SEPA"], ["rib", "RIB"], ["kbis", "KBIS"], ["id", "Pièce d'identité"],
  ["box", "Box créée"], ["ebics", "EBICS créé"], ["ged", "GED créée"], ["fec", "FEC récupéré"], ["liasse", "Dernière liasse obtenue"]
];
const EXIT_STEPS = [
  ["fin", "Lettre de fin de mission"], ["manager", "Validation manager"], ["facture", "Dernière facture envoyée"], ["prelevement", "Prélèvements arrêtés"],
  ["ebics", "EBICS supprimé"], ["box", "Box supprimée"], ["acces", "Accès supprimés"], ["archive", "Dossier archivé"]
];

function ChecklistPanel({ clients, type, store, setStore }) {
  const key = type === "entry" ? "entries" : "exits";
  const steps = type === "entry" ? ENTRY_STEPS : EXIT_STEPS;
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const client = clients.find(c => String(c.id) === String(clientId));
  const existing = (store[key] || []).find(x => String(x.clientId) === String(clientId));
  const data = existing || { clientId, client: client?.nom || "", steps: {} };
  const toggle = (id) => {
    // Toujours calculer la prochaine valeur à partir de l'état le plus récent.
    // Cela évite qu'un écho Realtime ou un double rendu ne fasse perdre un clic.
    setStore(current => {
      const rows = current[key] || [];
      const currentRow = rows.find(x => String(x.clientId) === String(clientId));
      const currentSteps = currentRow?.steps || {};
      const next = {
        ...(currentRow || { clientId, client: client?.nom || "" }),
        steps: { ...currentSteps, [id]: !Boolean(currentSteps[id]) },
        updatedAt: new Date().toISOString(),
      };
      return {
        ...current,
        [key]: [...rows.filter(x => String(x.clientId) !== String(clientId)), next],
      };
    });
  };
  const done = steps.filter(([id]) => Boolean(data.steps?.[id])).length;
  return <Card className="p-5">
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <select value={clientId} onChange={e => setClientId(e.target.value)} className="border border-line rounded-xl bg-app px-3 py-2 text-[11px] min-w-[240px] outline-none">{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
      <Pill tone={done === steps.length ? "green" : "amber"}>{done}/{steps.length} terminés</Pill>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{steps.map(([id, label]) => {
      const checked = Boolean(data.steps?.[id]);
      return <button type="button" key={id} onClick={() => toggle(id)} aria-pressed={checked} className={`flex items-center gap-2.5 text-left p-3 rounded-xl border transition-colors ${checked ? "border-emerald-200 bg-emerald-50/60" : "border-line bg-app hover:border-accent"}`}>
        {checked ? <CheckCircle2 size={16} className="text-emerald-600"/> : <div className="w-4 h-4 rounded-full border border-line"/>}<span className={`text-[11px] font-semibold ${checked ? "line-through text-inkmuted" : "text-ink"}`}>{label}</span>
      </button>;
    })}</div>
  </Card>;
}

function AdministrationView({ clients = [], team = [], tasks = [], administrationRequests = [], onUpdateAdministrationRequest, onOpenClient, onNavigate, onUpdateClient, activeTab, onTabChange, setCollabQuickFilter, setDashboardFilter }) {
  const [store, setStoreState] = useState(() => DEFAULT(clients));
  const [remoteReady, setRemoteReady] = useState(false);
  const [internalTab, setInternalTab] = useState("pilotage");
  const tab = activeTab || internalTab;
  const setTab = (next) => { setInternalTab(next); onTabChange?.(next); };
  const [period, setPeriod] = useState("mois");
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [monthRecords, setMonthRecords] = useState({});
  const monthRecordsRef = React.useRef({});
  const activeMonthRef = React.useRef(activeMonth);
  React.useEffect(() => { activeMonthRef.current = activeMonth; }, [activeMonth]);
  const [archiveEditMode, setArchiveEditMode] = useState(false);
  const localStoreRevisionRef = React.useRef(0);
  const savedStoreRevisionRef = React.useRef(0);
  const remoteStoreWriteRef = React.useRef(false);
  const monthLabel = (key) => {
    const [y,m] = String(key).split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1).toLocaleDateString("fr-FR", { month:"long", year:"numeric" });
  };
  const normalizedMonth = (key) => /^\d{4}-\d{2}$/.test(key) ? key : currentMonth;
  const monthStatus = monthRecordsRef.current[activeMonth]?.status || "ouvert";
  const canEdit = monthStatus !== "cloture" || archiveEditMode;
  const setStore = (updater) => {
    if (!canEdit) return;
    localStoreRevisionRef.current += 1;
    setStoreState(updater);
  };


  React.useEffect(() => {
    let alive = true;
    loadCabinetState("administration", DEFAULT(clients)).then(({ state }) => {
      if (!alive) return;
      const fallback = DEFAULT(clients);
      if (state?.months) {
        const records = state.months || {};
        monthRecordsRef.current = records;
        setMonthRecords(records);
        const initialMonth = normalizedMonth(state.activeMonth || currentMonth);
        setActiveMonth(initialMonth);
        setStoreState({ ...fallback, ...(records[initialMonth]?.data || {}) });
      } else {
        const migrated = { [currentMonth]: { status:"ouvert", data:{ ...fallback, ...(state || {}) }, createdAt:new Date().toISOString() } };
        monthRecordsRef.current = migrated;
        setMonthRecords(migrated);
        setActiveMonth(currentMonth);
        setStoreState(migrated[currentMonth].data);
      }
      setRemoteReady(true);
    });
    const unsub = subscribeCabinetState("administration", (state) => {
      if (!alive || !state?.months || remoteStoreWriteRef.current || localStoreRevisionRef.current > savedStoreRevisionRef.current) return;
      monthRecordsRef.current = state.months;
      setMonthRecords(state.months);
      const active = state.months[activeMonthRef.current];
      if (active?.data) setStoreState(active.data);
    });
    return () => { alive = false; unsub(); };
  }, []);
  React.useEffect(() => {
    if (!remoteReady) return;
    const revisionAtSchedule = localStoreRevisionRef.current;
    const nextRecords = { ...monthRecordsRef.current, [activeMonth]: { ...(monthRecordsRef.current[activeMonth] || {}), data: store } };
    monthRecordsRef.current = nextRecords;
    setMonthRecords(nextRecords);
    const timer = setTimeout(async () => {
      remoteStoreWriteRef.current = true;
      try {
        await saveCabinetState("administration", { months: monthRecordsRef.current, activeMonth });
        if (localStoreRevisionRef.current === revisionAtSchedule) {
          savedStoreRevisionRef.current = revisionAtSchedule;
        }
      } finally {
        remoteStoreWriteRef.current = false;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [store, activeMonth, remoteReady]);
  const costs = store.costs || [];
  const contracts = store.contracts || [];
  const licenses = store.licenses || [];
  const toolRows = clients.map((c) => ({
    clientId: c.id,
    client: c.nom,
    ...(c.administration?.tools || {})
  }));
  const [ioTarget, setIoTarget] = useState(null);
  const importInputRef = React.useRef(null);
  const [newCatalogItem, setNewCatalogItem] = useState(null);
  const [newTeamUser, setNewTeamUser] = useState(false);
  const [newTeamNotice, setNewTeamNotice] = useState("");

  const exportCatalog = (key, sheetName) => {
    const wb = XLSX.utils.book_new();
    const rows = store[key] || [];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `NOVACAB_${sheetName.replaceAll(" ", "_")}_${activeMonth}.xlsx`);
  };
  const importCatalog = async (file, key) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) return;
      const cleaned = rows.map((r) => ({ ...r, id: r.id || uid(key.slice(0,3)) }));
      setStore(s => ({ ...s, [key]: [...cleaned, ...(s[key] || [])] }));
      auditProductAction("administration", "catalog_imported", { entityType:key, metadata:{ count:cleaned.length, file:file.name } });
    } catch (e) { console.error("Import Excel administration", e); }
  };
  const openImport = (key) => { setIoTarget(key); setTimeout(() => importInputRef.current?.click(), 0); };
  const addCatalogItem = (key, defaults) => {
    const item = { id: uid(key.slice(0,3)), ...defaults };
    setStore(s => ({ ...s, [key]: [item, ...(s[key] || [])], history: [{id:uid("hist"),date:new Date().toISOString(),channel:`Ajout ${key}`,comment:`${defaults.name || defaults.contract || defaults.tool || defaults.provider || "Élément"}`,author:"Administration"}, ...(s.history || [])] }));
    setNewCatalogItem(null);
  };
  const updateCatalogItem = (key, id, patch) => {
    setStore(s => ({ ...s, [key]: (s[key] || []).map(x => x.id === id ? { ...x, ...patch } : x), history: [{id:uid("hist"),date:new Date().toISOString(),channel:`Modification ${key}`,comment:`Élément ${id} modifié`,author:"Administration"}, ...(s.history || [])] }));
  };
  const removeCatalogItem = (key, id) => {
    if (!window.confirm("Supprimer cet élément du référentiel administratif ?")) return;
    setStore(s => ({ ...s, [key]: (s[key] || []).filter(x => x.id !== id), history: [{id:uid("hist"),date:new Date().toISOString(),channel:`Suppression ${key}`,comment:`Élément ${id} supprimé`,author:"Administration"}, ...(s.history || [])] }));
  };
  const updateTool = (clientId, patch) => {
    const c = clients.find(x => String(x.id) === String(clientId));
    if (!c) return;
    const next = { ...(c.administration?.tools || {}), ...patch };
    setStore(s => ({ ...s, tools: (s.tools || []).map(x => x.clientId === clientId ? { ...x, ...next } : x) }));
    onUpdateClient?.(c.id, { administration: { ...(c.administration || {}), tools: next } });
  };


  const activeClients = clients.filter(c => c.statutDossier !== "inactif");
  const outgoing = clients.filter(c => c.statutDossier === "inactif" || c.resiliation || c.sortieMission);
  const newClients = clients.filter(c => c.dateEntreeMission && new Date(c.dateEntreeMission).getFullYear() === 2026);
  const lateInvoices = store.invoices.filter(i => i.status === "en_retard" || (i.status !== "payee" && new Date(i.due) < new Date()));
  const unpaid = store.invoices.filter(i => i.status !== "payee");
  const toCollect = unpaid.reduce((a, i) => a + Number(i.amount || 0), 0);
  const installedEbics = store.tools.filter(x => x.ebics === "installe").length;
  const missingEbics = store.tools.filter(x => x.ebics === "a_installer").length;
  const activeBoxes = store.tools.filter(x => x.box === "active").length;
  const boxesToCancel = store.tools.filter(x => x.box === "a_resilier").length;
  const incompleteEntries = store.entries.filter(x => Object.values(x.steps || {}).filter(Boolean).length < ENTRY_STEPS.length);
  const incompleteExits = store.exits.filter(x => Object.values(x.steps || {}).filter(Boolean).length < EXIT_STEPS.length);
  const reminderDue = store.reminders.filter(r => !r.done);
  const totalRejectCost = store.rejects.reduce((a, r) => a + Number(r.cost || 0), 0);
  const financeDeadlineAlerts = clients.flatMap(c => {
    const date = c.finance?.echeancePaiement;
    if (!date || !c.finance?.budget) return [];
    const overdue = new Date(date) < new Date();
    return overdue ? [{ tone:"red", icon:CircleDollarSign, title:`Échéance de paiement en retard — ${c.nom}`, detail:`${daysLate(date)} jours · budget ${money(c.finance.budget)}`, tab:"budgets-admin", clientId:c.id }] : [];
  });

  const exceptionalMissions = clients.flatMap((c) => (c.missionsExceptionnelles || []).map((m) => ({ ...m, clientId:c.id, client:c.nom })));
  const activeExceptionalMissions = exceptionalMissions.filter((m) => !["termine", "annule"].includes(String(m.statut || "").toLowerCase()));
  const activeResiliations = clients.filter((c) => c.resiliation?.active);
  const openTasks = tasks.filter((t) => !["termine", "archive"].includes(String(t.statut || "").toLowerCase()));
  const openAdministrationRequests = administrationRequests.filter(isOpenAdministrationRequest);
  const requestCounts = {
    total: openAdministrationRequests.length,
    urgent: openAdministrationRequests.filter(r => r.priority === "urgente").length,
    mission: openAdministrationRequests.filter(r => r.type === "mission_exceptionnelle").length,
    resiliation: openAdministrationRequests.filter(r => r.type === "resiliation").length,
  };
  const teamLoad = team.map((m) => {
    const assigned = openTasks.filter((t) => String(t.assigned_to || t.collaborateur || t.assignedTo || "") === String(m.nom || "")).length;
    return { label:m.nom || "Sans nom", value:assigned };
  }).filter((x) => x.value > 0).sort((a,b) => b.value-a.value).slice(0, 6);

  const alerts = useMemo(() => [
    ...lateInvoices.map(i => ({ tone:"red", icon:CircleDollarSign, title:`Impayé — ${i.client}`, detail:`${money(i.amount)} · ${daysLate(i.due)} jours de retard`, tab:"relances" })),
    ...store.tools.filter(x => x.ebics === "a_installer").map(x => ({ tone:"amber", icon:Landmark, title:`EBICS à installer — ${x.client}`, detail:"Aucune installation enregistrée", tab:"ebics" })),
    ...store.tools.filter(x => x.box === "a_resilier").map(x => ({ tone:"amber", icon:Box, title:`Box à résilier — ${x.client}`, detail:`Coût ${money(x.boxCost)}/mois`, tab:"box" })),
    ...incompleteEntries.map(x => ({ tone:"amber", icon:ArrowDownRight, title:`Entrée incomplète — ${x.client}`, detail:"Des étapes restent à traiter", tab:"entrees" })),
    ...incompleteExits.map(x => ({ tone:"red", icon:ArrowUpRight, title:`Sortie non clôturée — ${x.client}`, detail:"Checklist obligatoire incomplète", tab:"sorties" })),
    ...activeExceptionalMissions.map(x => ({ tone:"amber", icon:Briefcase, title:`Mission exceptionnelle — ${x.client}`, detail:`${x.type || "Mission"} · lettre à préparer`, tab:"missions-exceptionnelles-admin", clientId:x.clientId })),
    ...activeResiliations.map(c => ({ tone:"red", icon:ArrowUpRight, title:`Résiliation à traiter — ${c.nom}`, detail:`${c.resiliation?.motif || "Motif à renseigner"} · sortie à sécuriser`, tab:"resiliations-admin", clientId:c.id })),
    ...financeDeadlineAlerts,
  ], [lateInvoices, store.tools, incompleteEntries, incompleteExits, activeExceptionalMissions, activeResiliations, financeDeadlineAlerts]);

  const bilanRows = clients.map((c) => {
    const signal = getAdministrationSignals(c, tasks);
    const h = c.honoraires || {};
    const ht = Number(h.bilanMontantHT || 0);
    const ttc = Number(h.bilanMontantTTC || ht);
    const paye = Number(h.bilanPaye || c.bilanPaye || 0);
    const reste = Math.max(0, ttc - paye);
    const statut = signal.production.bilanFinished ? "Terminé" : (signal.production.openTasks ? "En cours" : "À traiter");
    return { id:c.id, client:c.nom, dateCloture:c.dateCloture, cdm:c.chefMission, collabFR:c.collab || c.collaborateur, mensualise:billingPeriodLabel(signal.billing.periodicite), periodicite:signal.billing.periodicite, avancement:signal.production.bilanFinished ? 100 : signal.production.openTasks ? 50 : 0, honorairesHT:ht, honorairesTTC:ttc, paye, reste, statut, billingStatus:signal.billingStatus, billingKey:signal.billingKey, montantEcheance:signal.amountToClaim, prochaineFacturation:signal.billing.dates?.[0] || signal.billing.start || null, tasksOuvertes:signal.production.openTasks };
  });
  const archivedAdministrationRequests = administrationRequests.filter((r) => !isOpenAdministrationRequest(r));
  const portfolioDistribution = useMemo(() => {
    const active = clients.filter(c => c.statutDossier !== "inactif");
    const total = active.length || 1;
    const groups = {};
    active.forEach(c => {
      const portfolio = c.portefeuille_id || c.portefeuilleId || c.portefeuille || "Sans portefeuille";
      const collab = c.collab || c.collaborateur || "À affecter";
      const key = `${portfolio}::${collab}`;
      if (!groups[key]) groups[key] = { id:`auto-${key}`, portfolio, collaborator:collab, clientsCount:0 };
      groups[key].clientsCount += 1;
    });
    return Object.values(groups).sort((a,b)=>a.portfolio.localeCompare(b.portfolio, "fr") || b.clientsCount-a.clientsCount)
      .map(g => ({...g, share:Math.round(g.clientsCount/total*1000)/10}));
  }, [clients]);
  const workloadRows = useMemo(() => {
    const members = team.filter(m => m && !["inactif","inactive"].includes(String(m.statut || "").toLowerCase()));
    const byMember = Object.fromEntries((store.workloads || []).map(w => [String(w.memberId || w.collaborator), w]));
    return members.map(m => ({id:byMember[String(m.id)]?.id || `team-${m.id}`, memberId:m.id, collaborator:m.nom || m.email || "Utilisateur", weeklyHours:Number(byMember[String(m.id)]?.weeklyHours ?? m.weeklyHours ?? 35), assignedHours:Number(byMember[String(m.id)]?.assignedHours ?? 0)}));
  }, [team, store.workloads]);
  const bilanBillingRows = bilanRows.filter(r => r.billingStatus === "À facturer");
  const bilanStats = { total:bilanRows.length, termines:bilanRows.filter(r=>r.avancement>=100).length, retards:bilanRows.filter(r=>r.statut==="En retard").length, ht:bilanRows.reduce((a,r)=>a+r.honorairesHT,0), ttc:bilanRows.reduce((a,r)=>a+r.honorairesTTC,0), paye:bilanRows.reduce((a,r)=>a+r.paye,0), reste:bilanRows.reduce((a,r)=>a+r.reste,0), aFacturer:bilanBillingRows.reduce((a,r)=>a+r.montantEcheance,0) };
  const updateInvoice = (id, patch) => { setStore(s => ({ ...s, invoices: s.invoices.map(i => i.id === id ? { ...i, ...patch } : i) })); auditProductAction("administration", "invoice_updated", { entityType:"invoice", entityId:id, metadata:patch }); };
  const addReminder = (invoice) => setStore(s => ({ ...s, reminders: [{ id: uid("rem"), invoiceId: invoice.id, client: invoice.client, invoice: invoice.invoice, level: Math.min(4, invoice.status === "en_retard" ? (daysLate(invoice.due) >= 45 ? 4 : daysLate(invoice.due) >= 30 ? 3 : daysLate(invoice.due) >= 15 ? 2 : 1) : 0), nextDate: new Date().toISOString().slice(0,10), done:false }, ...s.reminders] }));
  const logReminder = (r) => { auditProductAction("administration", "reminder_completed", { entityType:"reminder", entityId:r.id, metadata:{invoice:r.invoice,level:r.level} }); return setStore(s => ({ ...s, history: [{ id:uid("hist"), reminderId:r.id, date:new Date().toISOString(), channel:"Email", comment:"Relance effectuée", author:"Moi" }, ...s.history], reminders:s.reminders.map(x => x.id===r.id ? {...x,done:true}:x) })); };

  const rentability = clients.map((c, i) => {
    const honoraires = Number(c.honorairesAnnuels ?? c.honoraires?.montant ?? c.caHonoraires ?? 0);
    const hours = Number(c.rentabilite?.tempsReel || c.tempsPasse || (20 + (i % 7) * 8));
    const cost = hours * 55;
    return { id:c.id, client:c.nom, honoraires, hours, cost, margin:honoraires-cost, marginPct:honoraires ? ((honoraires-cost)/honoraires)*100 : 0 };
  }).sort((a,b)=>b.margin-a.margin);

  const changeMonth = (delta) => {
    const base = new Date(`${activeMonth}-01T12:00:00`);
    base.setMonth(base.getMonth() + delta);
    const target = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}`;
    const nextRecords = { ...monthRecordsRef.current, [activeMonth]: { ...(monthRecordsRef.current[activeMonth] || {}), data: store } };
    const targetRecord = nextRecords[target];
    monthRecordsRef.current = nextRecords;
    setMonthRecords(nextRecords);
    setActiveMonth(target);
    setArchiveEditMode(false);
    setStoreState({ ...DEFAULT(clients), ...(targetRecord?.data || {}) });
    setTab("pilotage");
  };
  const closeMonth = () => {
    const record = monthRecordsRef.current[activeMonth] || {};
    const next = { ...monthRecordsRef.current, [activeMonth]: { ...record, data: store, status:"cloture", closedAt:new Date().toISOString(), closedBy:"Admin" } };
    monthRecordsRef.current = next; setMonthRecords(next); setArchiveEditMode(false);
    auditProductAction("administration", "month_closed", { entityType:"administration_month", entityId:activeMonth, metadata:{ month:activeMonth } });
  };
  const reopenArchivedMonth = () => {
    const record = monthRecordsRef.current[activeMonth] || {};
    const next = { ...monthRecordsRef.current, [activeMonth]: { ...record, status:"ouvert", reopenedAt:new Date().toISOString(), reopenedBy:"Admin" } };
    monthRecordsRef.current = next; setMonthRecords(next); setArchiveEditMode(true);
    auditProductAction("administration", "month_reopened", { entityType:"administration_month", entityId:activeMonth, metadata:{ month:activeMonth } });
  };

  return <div className="space-y-5">
    <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async e=>{await importCatalog(e.target.files?.[0], ioTarget); e.target.value="";}}/>
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-accent-deep"/><h1 className="text-xl font-extrabold text-ink m-0">Administration & Direction</h1><Pill tone="green">V2</Pill></div><p className="text-[11.5px] text-inkmuted mt-1">Le cockpit « zéro oubli » du cabinet : coûts, clients, facturation, outils et sorties.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={()=>onNavigate?.("dashboard")} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-line bg-app text-[10.5px] font-extrabold text-ink hover:border-accent hover:bg-accent-soft" title="Revenir à la vue comptable">
          <Briefcase size={14}/> Vue comptable
        </button>
        <div className="flex items-center gap-1 rounded-xl border border-line bg-app p-1">
          <button onClick={()=>changeMonth(-1)} className="p-2 rounded-lg hover:bg-accent-soft" title="Mois précédent"><ArrowDownRight size={13} className="rotate-45"/></button>
          <div className="min-w-[150px] text-center"><div className="text-[9px] uppercase tracking-[.12em] text-inkmuted font-bold">Mois de travail</div><div className="text-[12px] font-extrabold capitalize">{monthLabel(activeMonth)}</div></div>
          <button onClick={()=>changeMonth(1)} className="p-2 rounded-lg hover:bg-accent-soft" title="Mois suivant"><ArrowDownRight size={13} className="rotate-[225deg]"/></button>
        </div>
        {monthStatus === "cloture" ? <><Pill tone="green">Mois clôturé · archivé</Pill><button onClick={reopenArchivedMonth} className="px-3 py-2 rounded-xl border border-line text-[10.5px] font-bold hover:border-accent">Modifier l’archive</button></> : <button onClick={closeMonth} className="px-3 py-2 rounded-xl bg-ink text-white text-[10.5px] font-bold">Clôturer le mois</button>}
        <select value={period} onChange={e=>setPeriod(e.target.value)} className="border border-line bg-app rounded-xl px-3 py-2 text-[10.5px]"><option value="mois">Ce mois</option><option value="trimestre">Ce trimestre</option><option value="annee">Cette année</option></select><button onClick={() => exportAdministrationExcel({
          data: { clients, invoices: store.invoices, tools: store.tools, rejects: store.rejects, alerts, history: store.history, rentability },
          cabinetName: "NOVACAB", period
        })} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-700 text-white text-[10.5px] font-bold" title="Exporter tout le pilotage au format Excel">
          <FileText size={14}/> Export Excel
        </button>
        <button onClick={()=>setStore(DEFAULT(clients))} disabled={!canEdit} className="p-2 rounded-xl border border-line text-inkmuted hover:text-ink" title="Réinitialiser les données V2"><RefreshCw size={15}/></button></div>
    </div>
    {monthStatus === "cloture" && <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 flex flex-wrap items-center gap-3"><History size={16} className="text-emerald-700"/><div className="flex-1"><div className="text-[11px] font-extrabold text-emerald-800 capitalize">{monthLabel(activeMonth)} est archivé</div><div className="text-[10.5px] text-emerald-700">Les données restent consultables. Pour corriger une opération, utilisez « Modifier l’archive » : le mois repasse alors en édition contrôlée.</div></div></div>}
    <Card className="p-5">
      <SectionTitle icon={ClipboardList} title="Centre de demandes à l’administration" subtitle="Les événements métier qui nécessitent une intervention de la direction." action={<div className="flex gap-2"><Pill tone={requestCounts.urgent ? "red" : "green"}>{requestCounts.urgent} urgente{requestCounts.urgent > 1 ? "s" : ""}</Pill><Pill>{requestCounts.total} ouverte{requestCounts.total > 1 ? "s" : ""}</Pill></div>} />
      {openAdministrationRequests.length ? <div className="space-y-2">{openAdministrationRequests.slice(0, 10).map((r) => (
        <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-line bg-app p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap"><span className="text-[11px] font-extrabold text-ink">{r.title || administrationRequestLabel(r.type)}</span><Pill tone={r.priority === "urgente" ? "red" : r.priority === "haute" ? "amber" : "neutral"}>{r.priority === "urgente" ? "Urgente" : r.priority === "haute" ? "Haute" : "Normale"}</Pill><Pill tone={r.status === "en_cours" ? "amber" : "neutral"}>{r.status === "en_cours" ? "En cours" : r.status === "en_attente" ? "En attente" : "À traiter"}</Pill></div>
            <div className="text-[10px] text-inkmuted mt-1">{r.client_id ? (clients.find(c => String(c.id) === String(r.client_id))?.nom || "Dossier") : "Cabinet"} · {administrationRequestLabel(r.type)} · {new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
            {r.description && <div className="text-[10.5px] text-inkmuted mt-1 line-clamp-2">{r.description}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {r.client_id && <button type="button" onClick={() => onOpenClient?.(r.client_id)} className="px-2.5 py-1.5 rounded-lg border border-line text-[10px] font-bold hover:border-accent">Dossier</button>}
            {onUpdateAdministrationRequest && r.status === "a_traiter" && <button type="button" onClick={() => onUpdateAdministrationRequest(r.id, { status: "en_cours" })} className="px-2.5 py-1.5 rounded-lg bg-accent text-white text-[10px] font-bold">Prendre en charge</button>}
            {onUpdateAdministrationRequest && r.status !== "termine" && r.status !== "a_traiter" && <button type="button" onClick={() => onUpdateAdministrationRequest(r.id, { status: "termine" })} className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white text-[10px] font-bold">Terminer</button>}
          </div>
        </div>
      ))}</div> : <div className="rounded-xl border border-dashed border-line p-7 text-center text-[11px] text-inkmuted"><CheckCircle2 size={18} className="mx-auto mb-2 text-emerald-700"/>Aucune demande administrative ouverte.</div>}
      {openAdministrationRequests.length > 10 && <div className="text-[10px] text-inkmuted mt-3">{openAdministrationRequests.length - 10} autre{openAdministrationRequests.length - 10 > 1 ? "s" : ""} demande{openAdministrationRequests.length - 10 > 1 ? "s" : ""} à traiter.</div>}
    </Card>
    <div className="min-w-0">



    {tab==="bilans-admin" && <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        <Kpi label="Bilans" value={bilanStats.total} icon={FileSpreadsheet}/>
        <Kpi label="Terminés" value={bilanStats.termines} icon={CheckCircle2} tone="green"/>
        <Kpi label="En retard" value={bilanStats.retards} icon={AlertTriangle} tone="red"/>
        <Kpi label="Honoraires HT" value={money(bilanStats.ht)} icon={Wallet}/>
        <Kpi label="Payé" value={money(bilanStats.paye)} icon={CheckCircle2} tone="green"/>
        <Kpi label="Reste à payer" value={money(bilanStats.reste)} icon={CircleDollarSign} tone={bilanStats.reste ? "amber" : "green"}/>
      </div>
      <Card className="p-5"><SectionTitle icon={FileSpreadsheet} title="Tableau des bilans" subtitle="Suivi de production et honoraires par dossier" action={<button onClick={() => exportAdministrationExcel({data:{clients,invoices:store.invoices,tools:store.tools,rejects:store.rejects,alerts,history:store.history,rentability,bilans:bilanRows},cabinetName:"NOVACAB",period,activeMonth, monthLabel:monthLabel(activeMonth)})} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-700 text-white text-[10.5px] font-bold"><FileSpreadsheet size={14}/> Exporter le tableau Excel</button>}/>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Client","Clôture","CDM","Collaborateur","Type","Avancement","Honoraires HT","Payé","Reste","Statut","Facturation"].map(h => (
                  <th key={h} className="px-3 py-2 text-[9px] uppercase tracking-[.08em] text-inkmuted font-bold border-b border-line whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bilanRows.length ? bilanRows.map(r => {
                const c = clients.find(x => x.id === r.id);
                return (
                  <tr key={r.id} onClick={() => { if (c) onOpenClient?.(c.id); }} className="border-b border-line last:border-0 hover:bg-app cursor-pointer">
                    <td className="px-3 py-2.5 text-[11px] font-bold whitespace-nowrap">{r.client}</td>
                    <td className="px-3 py-2.5 text-[10.5px]">{fmtDate(r.dateCloture)}</td>
                    <td className="px-3 py-2.5 text-[10.5px]">{r.cdm || "—"}</td>
                    <td className="px-3 py-2.5 text-[10.5px]">{r.collabFR || "—"}</td>
                    <td className="px-3 py-2.5 text-[10.5px]">{r.mensualise}</td>
                    <td className="px-3 py-2.5 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, r.avancement)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold">{r.avancement}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[10.5px] font-bold">{money(r.honorairesHT)}</td>
                    <td className="px-3 py-2.5 text-[10.5px]">{money(r.paye)}</td>
                    <td className="px-3 py-2.5 text-[10.5px] font-bold">{money(r.reste)}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={r.billingStatus === "Payé" ? "green" : r.billingStatus === "À facturer" ? "red" : r.statut === "En retard" ? "red" : r.statut === "Terminé" ? "green" : "amber"}>
                        {r.billingStatus === "À facturer" ? "À facturer" : r.billingStatus === "Payé" ? "Payé" : r.statut}
                      </Pill>
                    </td>
                    <td className="px-3 py-2.5">
                      {r.billingStatus === "À facturer" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c && onUpdateClient) {
                              const h = c.honoraires || {};
                              onUpdateClient(c.id, {
                                honoraires: {
                                  ...h,
                                  bilanPaiements: { ...(h.bilanPaiements || {}), [r.billingKey]: true },
                                  bilanPaye: Number(h.bilanPaye || c.bilanPaye || 0) + Number(r.montantEcheance || 0)
                                }
                              });
                            }
                          }}
                          className="text-[10px] font-bold text-emerald-700"
                        >
                          Marquer payé
                        </button>
                      ) : <span className="text-inkmuted">—</span>}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="11" className="px-3 py-10 text-center text-[11px] text-inkmuted">Aucun dossier de bilan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>}

    {tab==="pilotage" && <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <Kpi label="Clients actifs" value={activeClients.length} icon={Users} detail={`${newClients.length} nouveau(x) · ${outgoing.length} sortant(s)`} onClick={() => onNavigate?.("clients")} />
        <Kpi label="À encaisser" value={money(toCollect)} icon={Wallet} tone={toCollect ? "amber":"green"} detail={`${lateInvoices.length} facture(s) en retard`} onClick={() => setTab("relances")} />
        <Kpi label="Missions exceptionnelles" value={activeExceptionalMissions.length} icon={Briefcase} tone={activeExceptionalMissions.length ? "amber":"green"} detail="À préparer / suivre" onClick={() => setTab("missions-exceptionnelles-admin")} />
        <Kpi label="Résiliations" value={activeResiliations.length} icon={ArrowUpRight} tone={activeResiliations.length ? "red":"green"} detail="Dossiers à sécuriser" onClick={() => setTab("resiliations-admin")} />
        <Kpi label="Tâches ouvertes" value={openTasks.length} icon={ClipboardList} tone={openTasks.length ? "amber":"green"} detail="Production comptable suivie dans l’espace métier" onClick={() => setTab("planning-admin")} />
      </div>

      <Card className="p-5">
        <SectionTitle icon={TrendingUp} title="Tableau de bord Direction" subtitle="Les indicateurs clés du cabinet, mis à jour depuis les dossiers et les tâches." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-app p-4">
            <div className="text-[9px] uppercase tracking-[.1em] font-extrabold text-inkmuted mb-3">Production des bilans</div>
            <MiniBarChart onItemClick={() => setTab("bilans-admin")} data={[
              {label:"Terminés", value:bilanStats.termines},
              {label:"En cours", value:bilanRows.filter(r=>r.statut==="En cours").length},
              {label:"À traiter", value:bilanRows.filter(r=>r.statut==="À traiter").length},
            ]}/>
          </div>
          <div className="rounded-xl border border-line bg-app p-4">
            <div className="text-[9px] uppercase tracking-[.1em] font-extrabold text-inkmuted mb-3">Encaissement</div>
            <MiniBarChart onItemClick={() => setTab("facturation")} formatter={money} data={[
              {label:"Encaissé", value:bilanStats.paye},
              {label:"Reste à encaisser", value:bilanStats.reste},
              {label:"À réclamer", value:bilanStats.aFacturer},
            ]}/>
          </div>
          <div className="rounded-xl border border-line bg-app p-4">
            <div className="text-[9px] uppercase tracking-[.1em] font-extrabold text-inkmuted mb-3">Charge équipe</div>
            {teamLoad.length ? <MiniBarChart onItemClick={() => setTab("charge-admin")} data={teamLoad}/> : <div className="py-6 text-center text-[10.5px] text-inkmuted">Aucune tâche nominative ouverte.</div>}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Zap} title="Flux métier ↔ administration" subtitle="Les événements saisis par les collaborateurs deviennent immédiatement des actions de direction." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Bilans terminés", bilanRows.filter(r=>r.statut==="Terminé").length, "bilans-admin", FileSpreadsheet],
            ["Missions à préparer", activeExceptionalMissions.length, "missions-exceptionnelles-admin", Briefcase],
            ["Résiliations à traiter", activeResiliations.length, "resiliations-admin", ArrowUpRight],
            ["Tâches ouvertes", openTasks.length, "planning-admin", ClipboardList],
          ].map(([label,value,target,Icon])=><button type="button" key={label} onClick={()=>setTab(target)} className="p-3 rounded-xl border border-line bg-app text-left hover:border-accent">
            <div className="flex items-center justify-between"><span className="text-[10px] text-inkmuted">{label}</span><Icon size={14} className="text-accent-deep"/></div>
            <div className="mt-1 text-xl font-extrabold">{value}</div>
            <div className="mt-1 text-[10px] text-inkmuted">Source : dossiers / tâches</div>
          </button>)}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5"><SectionTitle icon={CircleDollarSign} title="Facturation" subtitle="État des encaissements"/><div className="space-y-2"><div className="flex justify-between text-[11px]"><span>Factures émises</span><b>{store.invoices.length}</b></div><div className="flex justify-between text-[11px]"><span>Factures payées</span><b className="text-emerald-700">{store.invoices.filter(i=>i.status==="payee").length}</b></div><div className="flex justify-between text-[11px]"><span>Factures en retard</span><b className="text-red-700">{lateInvoices.length}</b></div><div className="flex justify-between text-[11px]"><span>Montants à encaisser</span><b>{money(toCollect)}</b></div></div></Card>
        <Card className="p-5"><SectionTitle icon={AlertTriangle} title="Alertes prioritaires" subtitle="Le principe zéro oubli"/>{alerts.slice(0,6).map((a,i)=>{const Icon=a.icon;return <button type="button" key={i} onClick={()=>{setTab(a.tab); if(a.clientId) onOpenClient?.(a.clientId);}} className="w-full flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-left"><Icon size={15} className={a.tone==="red"?"text-red-600":"text-amber-600"}/><div className="flex-1"><div className="text-[11px] font-bold">{a.title}</div><div className="text-[10px] text-inkmuted">{a.detail}</div></div><ChevronRight size={13} className="text-inkmuted"/></button>})}{!alerts.length&&<div className="text-[11px] text-emerald-700 flex gap-2 items-center"><CheckCircle2 size={14}/>Aucune alerte prioritaire.</div>}</Card>
      </div>
    </div>}

    {tab==="missions-exceptionnelles-admin" && <Card className="p-5"><SectionTitle icon={Briefcase} title="Missions exceptionnelles à préparer" subtitle="Demandes créées depuis les dossiers collaborateurs. Préparez la lettre de mission et le suivi associé."/><Table columns={[
      {key:"client",label:"Client"},{key:"type",label:"Mission"},{key:"collaborateur",label:"Collaborateur"},{key:"dateDemande",label:"Demande",render:r=>fmtDate(r.dateDemande)},{key:"dateLivraisonPrevue",label:"Livraison",render:r=>fmtDate(r.dateLivraisonPrevue)},{key:"honoraires",label:"Honoraires",render:r=>r.honoraires||"—"},{key:"lettreSignee",label:"Lettre",render:r=><Pill tone={r.lettreSignee?"green":"amber"}>{r.lettreSignee?"Signée":"À préparer"}</Pill>},{key:"action",label:"",render:r=><button type="button" onClick={()=>onOpenClient?.(r.clientId)} className="text-[10px] font-bold text-accent-deep">Ouvrir le dossier</button>}
    ]} rows={activeExceptionalMissions}/></Card>}

    {tab==="resiliations-admin" && <Card className="p-5"><SectionTitle icon={ArrowUpRight} title="Résiliations à traiter" subtitle="Chaque résiliation doit déclencher la préparation de la sortie, des courriers et des contrôles."/><Table columns={[
      {key:"client",label:"Client"},{key:"date",label:"Date",render:r=>fmtDate(r.resiliation?.date)},{key:"initiateur",label:"Initiateur",render:r=>r.resiliation?.initiateur||"—"},{key:"motif",label:"Motif",render:r=>r.resiliation?.motifAutre||r.resiliation?.motif||"—"},{key:"lettre",label:"Lettre",render:r=><Pill tone={r.resiliation?.lettreEnvoyee?"green":"amber"}>{r.resiliation?.lettreEnvoyee?"Envoyée":"À préparer"}</Pill>},{key:"preavis",label:"Préavis",render:r=><Pill tone={r.resiliation?.preavisRespecte?"green":"amber"}>{r.resiliation?.preavisRespecte?"OK":"À contrôler"}</Pill>},{key:"action",label:"",render:r=><button type="button" onClick={()=>onOpenClient?.(r.id)} className="text-[10px] font-bold text-accent-deep">Ouvrir le dossier</button>}
    ]} rows={activeResiliations}/></Card>}

    {tab==="facturation" && (
      <div className="space-y-4">
        {bilanBillingRows.length > 0 && (
          <Card className="p-5">
            <SectionTitle
              icon={FileSpreadsheet}
              title="Bilans terminés à facturer"
              subtitle="Déclenché automatiquement lorsqu'un collaborateur termine le bilan"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Kpi label="Dossiers" value={bilanBillingRows.length} icon={FileSpreadsheet} tone="amber" />
              <Kpi
                label="À réclamer"
                value={money(bilanBillingRows.reduce((a, r) => a + r.montantEcheance, 0))}
                icon={CircleDollarSign}
                tone="red"
              />
              <Kpi label="Périodicité" value="Selon dossier" icon={CalendarDays} />
            </div>
            <Table
              columns={[
                { key: "client", label: "Client" },
                {
                  key: "periodicite",
                  label: "Paiement",
                  render: r =>
                    ({
                      mensuel: "Mensuel",
                      trimestriel: "Trimestriel",
                      semestriel: "Semestriel",
                      annuel: "Annuel",
                    }[r.periodicite] || r.periodicite),
                },
                {
                  key: "date",
                  label: "Date",
                  render: r => fmtDate(r.prochaineFacturation),
                },
                {
                  key: "amount",
                  label: "Montant à réclamer",
                  render: r => money(r.montantEcheance),
                },
                {
                  key: "action",
                  label: "",
                  render: r => {
                    const c = clients.find(x => x.id === r.id);
                    if (!c || !onUpdateClient) return null;
                    return (
                      <button
                        onClick={() => {
                          const h = c.honoraires || {};
                          onUpdateClient(c.id, {
                            honoraires: {
                              ...h,
                              bilanPaiements: {
                                ...(h.bilanPaiements || {}),
                                [r.billingKey]: true,
                              },
                              bilanPaye:
                                Number(h.bilanPaye || c.bilanPaye || 0) +
                                Number(r.montantEcheance || 0),
                            },
                          });
                        }}
                        className="text-[10px] font-bold text-emerald-700"
                      >
                        Marquer payé
                      </button>
                    );
                  },
                },
              ]}
              rows={bilanBillingRows}
            />
          </Card>
        )}

        <Card>
          <Table
            columns={[
              { key: "client", label: "Client" },
              { key: "invoice", label: "Facture" },
              {
                key: "amount",
                label: "Montant",
                render: r => <input className={inputClass} type="number" value={r.amount || 0} onChange={e=>updateInvoice(r.id,{amount:Number(e.target.value||0)})}/>,
              },
              {
                key: "due",
                label: "Échéance",
                render: r => <input className={inputClass} type="date" value={(r.due||"").slice(0,10)} onChange={e=>updateInvoice(r.id,{due:e.target.value})}/>,
              },
              {
                key: "status",
                label: "Statut",
                render: r => {
                  const overdue = new Date(r.due) < new Date();
                  return (
                    <Pill tone={r.status === "payee" ? "green" : overdue ? "red" : "amber"}>
                      {r.status === "payee"
                        ? "Payée"
                        : overdue
                          ? "En retard"
                          : "À venir"}
                    </Pill>
                  );
                },
              },
              {
                key: "action",
                label: "Action",
                render: r =>
                  r.status !== "payee" ? (
                    <button
                      onClick={() =>
                        updateInvoice(r.id, {
                          status: "payee",
                          paidAt: new Date().toISOString(),
                        })
                      }
                      className="text-[10px] font-bold text-emerald-700"
                    >
                      Marquer payée
                    </button>
                  ) : (
                    <span className="text-inkmuted">—</span>
                  ),
              },
            ]}
            rows={store.invoices}
          />
        </Card>
      </div>
    )}

    {tab==="relances" && <div className="space-y-4">
      <Card className="p-5"><SectionTitle icon={Mail} title="Relances facturation" subtitle="Niveaux automatiques selon le retard"/><Table columns={[
        {key:"client",label:"Client"},{key:"invoice",label:"Facture"},{key:"amount",label:"Montant",render:r=>money(r.amount)},{key:"due",label:"Échéance",render:r=>fmtDate(r.due)},
        {key:"level",label:"Niveau",render:r=>{const d=daysLate(r.due);const l=d<7?0:d<15?1:d<30?2:d<45?3:4;return <Pill tone={l>=3?"red":l>=1?"amber":"green"}>Niveau {l}</Pill>}},
        {key:"retard",label:"Retard",render:r=>r.status==="payee"?"—":`${daysLate(r.due)} j`},
        {key:"action",label:"Action",render:r=>r.status!=="payee"?<div className="flex gap-2"><button onClick={()=>addReminder(r)} className="text-[10px] font-bold text-accent-deep">Programmer</button><button onClick={()=>{addReminder(r);}} className="text-[10px] font-bold text-inkmuted">Email</button></div>:<span>—</span>}
      ]} rows={lateInvoices}/></Card>
      <Card className="p-5"><SectionTitle icon={Clock3} title="Rappels programmés" subtitle={`${reminderDue.length} action(s) à effectuer`}/><Table columns={[
        {key:"client",label:"Client"},{key:"invoice",label:"Facture"},{key:"level",label:"Niveau",render:r=><Pill tone={r.level>=3?"red":r.level>=1?"amber":"green"}>Niveau {r.level}</Pill>},{key:"nextDate",label:"Date",render:r=>fmtDate(r.nextDate)},
        {key:"action",label:"Action",render:r=>r.done?<Pill tone="green">Effectuée</Pill>:<button onClick={()=>logReminder(r)} className="text-[10px] font-bold text-accent-deep">Journaliser la relance</button>}
      ]} rows={store.reminders}/></Card>
      <Card className="p-5"><SectionTitle icon={FileText} title="Historique des relances"/><Table columns={[{key:"date",label:"Date",render:r=>fmtDate(r.date)},{key:"channel",label:"Canal"},{key:"comment",label:"Commentaire"},{key:"author",label:"Effectuée par"}]} rows={store.history}/></Card>
    </div>}

    {tab==="entrees" && <div><SectionTitle icon={ArrowDownRight} title="Entrée en mission" subtitle="Checklist administrative, paramétrages et production"/><ChecklistPanel clients={clients} type="entry" store={store} setStore={setStore}/></div>}
    {tab==="sorties" && <div><SectionTitle icon={ArrowUpRight} title="Sortie de mission" subtitle="Aucune sortie ne doit rester non clôturée"/><ChecklistPanel clients={clients} type="exit" store={store} setStore={setStore}/></div>}

    {tab==="ebics" && <Card><div className="p-5"><SectionTitle icon={Landmark} title="Gestion EBICS" subtitle="Statut, dates et coûts administrables par la Direction"/><Table columns={[
      {key:"client",label:"Dossier",render:r=><button type="button" onClick={()=>onOpenClient?.(r.clientId)} className="font-bold text-left text-accent-deep">{r.client}</button>},{key:"ebics",label:"Statut",render:r=><select className={inputClass} value={r.ebics||"a_installer"} onChange={e=>updateTool(r.clientId,{ebics:e.target.value})}><option value="a_installer">À installer</option><option value="en_cours">En cours</option><option value="installe">Installé</option><option value="supprime">Supprimé</option></select>},{key:"date",label:"Date",render:r=><input className={inputClass} type="date" value={r.ebicsDate||""} onChange={e=>updateTool(r.clientId,{ebicsDate:e.target.value})}/>},{key:"cost",label:"Coût / mois",render:r=><input className={inputClass} type="number" value={r.ebicsCost||0} onChange={e=>updateTool(r.clientId,{ebicsCost:Number(e.target.value||0)})}/>}
    ]} rows={toolRows}/></div></Card>}
    {tab==="box" && <Card><div className="p-5"><SectionTitle icon={Box} title="Gestion des Box" subtitle="Statut, dates et coûts administrables par la Direction"/><Table columns={[
      {key:"client",label:"Dossier",render:r=><button type="button" onClick={()=>onOpenClient?.(r.clientId)} className="font-bold text-left text-accent-deep">{r.client}</button>},{key:"box",label:"Statut",render:r=><select className={inputClass} value={r.box||"active"} onChange={e=>updateTool(r.clientId,{box:e.target.value})}><option value="active">Active</option><option value="a_resilier">À résilier</option><option value="resiliee">Résiliée</option></select>},{key:"created",label:"Créée",render:r=><input className={inputClass} type="date" value={r.boxCreated||""} onChange={e=>updateTool(r.clientId,{boxCreated:e.target.value})}/>},{key:"cancelled",label:"Résiliée",render:r=><input className={inputClass} type="date" value={r.boxCancelled||""} onChange={e=>updateTool(r.clientId,{boxCancelled:e.target.value})}/>},{key:"cost",label:"Coût / mois",render:r=><input className={inputClass} type="number" value={r.boxCost||0} onChange={e=>updateTool(r.clientId,{boxCost:Number(e.target.value||0)})}/>}
    ]} rows={toolRows}/></div></Card>}

    {tab==="budgets-admin" && <Card className="p-5"><SectionTitle icon={Wallet} title="Budgets & échéances de paiement" subtitle="Budget actuel, révisions et dates de paiement par dossier."/><Table columns={[{key:"client",label:"Dossier",render:r=><button type="button" onClick={()=>onOpenClient?.(r.id)} className="font-bold text-left text-accent-deep">{r.client}</button>},{key:"budget",label:"Budget",render:r=>{const c=clients.find(x=>x.id===r.id);const b=Number(c?.finance?.budget||c?.budget||0);return <input className={inputClass} type="number" value={b} onChange={e=>onUpdateClient?.(c.id,{finance:{...(c.finance||{}),budget:Number(e.target.value||0)}})}/>;}},{key:"revision",label:"Révision",render:r=>{const c=clients.find(x=>x.id===r.id);const h=c?.finance?.budgetHistory||[];return <div className="flex gap-1"><select id={`bt-${r.id}`} className={inputClass}><option value="augmentation">+</option><option value="diminution">−</option></select><input id={`ba-${r.id}`} className={inputClass} type="number" placeholder="Montant"/><button type="button" className="px-2 rounded-lg bg-accent text-white text-[10px] font-bold" onClick={()=>{const amount=Number(document.getElementById(`ba-${r.id}`)?.value||0);if(!amount)return;const type=document.getElementById(`bt-${r.id}`)?.value||"augmentation";const old=Number(c?.finance?.budget||c?.budget||0);onUpdateClient?.(c.id,{finance:{...(c.finance||{}),budget:Math.max(0,old+(type==="augmentation"?amount:-amount)),budgetHistory:[...h,{date:new Date().toISOString(),type,amount,ancien:old}]}});}}>OK</button></div>;}},{key:"echeance",label:"Échéance paiement",render:r=>{const c=clients.find(x=>x.id===r.id);const date=c?.finance?.echeancePaiement||"";const late=date&&new Date(date)<new Date();return <div className="flex items-center gap-2"><input className={inputClass} type="date" value={date} onChange={e=>onUpdateClient?.(c.id,{finance:{...(c.finance||{}),echeancePaiement:e.target.value}})}/>{date&&<Pill tone={late?"red":"green"}>{late?`En retard · ${daysLate(date)} j`:"À jour"}</Pill>}</div>;}},{key:"history",label:"Révisions",render:r=>{const c=clients.find(x=>x.id===r.id);const h=c?.finance?.budgetHistory||[];return h.length?<div className="text-[10px] text-inkmuted">{h.slice(-2).map((x,i)=><div key={i}>{x.type==="augmentation"?"+":"−"}{money(x.amount)} · {fmtDate(x.date)}</div>)}</div>:<span className="text-[10px] text-inkmuted">Aucune</span>;}}]} rows={clients.map(c=>({id:c.id,client:c.nom}))}/></Card>}

    {tab==="rentabilite" && <Card><div className="p-5"><SectionTitle icon={TrendingUp} title="Honoraires & rentabilité" subtitle="Honoraires et temps passé modifiables par l’administration."/><Table columns={[{key:"client",label:"Client",render:r=><button type="button" onClick={()=>onOpenClient?.(r.id)} className="font-bold text-left text-accent-deep">{r.client}</button>},{key:"honoraires",label:"Honoraires annuels",render:r=>{const c=clients.find(x=>x.id===r.id);return <input className={inputClass} type="number" value={r.honoraires} onChange={e=>onUpdateClient?.(c.id,{honoraires:{...(c.honoraires&&typeof c.honoraires==="object"?c.honoraires:{}),montant:Number(e.target.value||0)},honorairesAnnuels:Number(e.target.value||0)})}/>;}},{key:"hours",label:"Temps passé",render:r=>{const c=clients.find(x=>x.id===r.id);return <input className={inputClass} type="number" value={r.hours} onChange={e=>onUpdateClient?.(c.id,{rentabilite:{...(c.rentabilite||{}),tempsReel:Number(e.target.value||0)}})}/>;}},{key:"cost",label:"Coût interne",render:r=>money(r.cost)},{key:"margin",label:"Marge",render:r=><span className={r.margin<0?"text-red-700 font-bold":"font-bold"}>{money(r.margin)}</span>},{key:"marginPct",label:"Marge %",render:r=><Pill tone={r.marginPct<20?"red":r.marginPct<40?"amber":"green"}>{Math.round(r.marginPct)}%</Pill>}] } rows={rentability}/></div></Card>}

    {tab==="alertes" && <Card><div className="p-5"><SectionTitle icon={Bell} title="Centre des alertes" subtitle="Une seule vue des actions qui ne doivent pas être oubliées"/>{alerts.length ? alerts.map((a,i)=>{const Icon=a.icon;return <button key={i} onClick={()=>setTab(a.tab)} className="w-full flex items-center gap-3 p-3 border-b border-line text-left hover:bg-app"><Icon size={16} className={a.tone==="red"?"text-red-600":"text-amber-600"}/><div className="flex-1"><div className="font-bold text-[11px]">{a.title}</div><div className="text-[10px] text-inkmuted">{a.detail}</div></div><ChevronRight size={14}/></button>}) : <div className="py-8 text-center text-[11px] text-emerald-700">Tout est sous contrôle.</div>}</div></Card>}

    {tab==="echeancier" && <Card><div className="p-5"><SectionTitle icon={CalendarDays} title="Échéancier cabinet" subtitle="Renouvellements, contrats, facturation et relances"/><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[
      ...store.invoices.filter(i=>i.status!=="payee").map(i=>({d:i.due,title:`Facturation — ${i.client}`,detail:`${money(i.amount)} · ${i.invoice}`,tone:new Date(i.due)<new Date()?"red":"amber"})),
      ...store.tools.filter(x=>x.ebics==="a_installer").map(x=>({d:new Date().toISOString(),title:`EBICS — ${x.client}`,detail:"Installation à planifier",tone:"amber"})),
      ...store.tools.filter(x=>x.box==="a_resilier").map(x=>({d:new Date().toISOString(),title:`Box — ${x.client}`,detail:"Résiliation à effectuer",tone:"amber"})),
    ].sort((a,b)=>new Date(a.d)-new Date(b.d)).map((e,i)=><div key={i} className="p-4 rounded-xl border border-line bg-app"><div className="flex justify-between gap-2"><Pill tone={e.tone}>{fmtDate(e.d)}</Pill><CalendarDays size={14} className="text-inkmuted"/></div><div className="mt-2 font-bold text-[11px]">{e.title}</div><div className="text-[10px] text-inkmuted mt-1">{e.detail}</div></div>)}</div></div></Card>}

    
    {tab==="equipe-admin" && <Card className="p-5"><SectionTitle icon={Users} title="Équipe" subtitle="Utilisateurs réels, futurs utilisateurs et responsabilités" action={<button type="button" onClick={()=>setNewTeamUser(true)} className="btn-primary"><Plus size={13}/> Ajouter un utilisateur</button>}/><Table columns={[
      {key:"nom",label:"Utilisateur"},{key:"role",label:"Rôle"},{key:"portefeuille",label:"Portefeuille"},{key:"statut",label:"Statut",render:r=><Pill tone={r.statut==="Actif"?"green":"amber"}>{r.statut}</Pill>}
    ]} rows={team.map((m,i)=>({id:m.id||i,nom:m.nom||`Utilisateur ${i+1}`,role:m.role||"Collaborateur",portefeuille:m.portefeuille||m.portefeuille_id||"À affecter",statut:m.statut==="en_attente"?"En attente":m.statut||"Actif"}))}/></Card>}

    {tab==="charge-admin" && <Card className="p-5"><SectionTitle icon={TrendingUp} title="Charge de travail" subtitle="Utilisateurs réels du cabinet : capacités et charges modifiables."/><Table columns={[{key:"collaborator",label:"Utilisateur"},{key:"weeklyHours",label:"Capacité / sem.",render:r=><input className={inputClass} type="number" min="0" value={r.weeklyHours} onChange={e=>setStore(s=>({...s,workloads:[...(s.workloads||[]).filter(w=>String(w.memberId)!==String(r.memberId)),{id:r.id,memberId:r.memberId,collaborator:r.collaborator,weeklyHours:Number(e.target.value||0),assignedHours:r.assignedHours}]}))}/>},{key:"assignedHours",label:"Charge affectée",render:r=><input className={inputClass} type="number" min="0" value={r.assignedHours} onChange={e=>setStore(s=>({...s,workloads:[...(s.workloads||[]).filter(w=>String(w.memberId)!==String(r.memberId)),{id:r.id,memberId:r.memberId,collaborator:r.collaborator,weeklyHours:r.weeklyHours,assignedHours:Number(e.target.value||0)}]}))}/>},{key:"status",label:"État",render:r=><Pill tone={r.assignedHours>r.weeklyHours?"red":r.assignedHours>r.weeklyHours*.85?"amber":"green"}>{r.assignedHours>r.weeklyHours?"Surchargée":r.assignedHours>r.weeklyHours*.85?"À surveiller":"Équilibrée"}</Pill>}] } rows={workloadRows}/></Card>}

    {tab==="repartition-admin" && <Card className="p-5"><SectionTitle icon={Briefcase} title="Répartition des dossiers" subtitle="Répartition par portefeuille et collaborateur à partir des affectations réelles."/><Table columns={[{key:"portfolio",label:"Portefeuille"},{key:"collaborator",label:"Collaborateur"},{key:"clientsCount",label:"Dossiers"},{key:"share",label:"Part du cabinet",render:r=><Pill>{r.share}%</Pill>},{key:"action",label:"",render:r=><button type="button" onClick={()=>{setDashboardFilter?.(null);setCollabQuickFilter?.(r.collaborator);onNavigate?.("clients");}} className="text-[10px] font-bold text-accent-deep">Voir les dossiers</button>}]} rows={portfolioDistribution}/></Card>}

    {tab==="couts" && <div className="space-y-4"><Card className="p-5"><SectionTitle icon={Wallet} title="Coûts & abonnements" subtitle="Pilotez les dépenses récurrentes du cabinet" action={<div className="flex gap-2"><button onClick={()=>exportCatalog("costs","Couts_abonnements")} className="btn-secondary"><Download size={13}/> Exporter</button><button onClick={()=>openImport("costs")} className="btn-secondary"><Upload size={13}/> Importer</button><button onClick={()=>setNewCatalogItem("costs")} className="btn-primary"><Plus size={13}/> Ajouter</button></div>}/><div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      <Kpi label="Coût mensuel" value={money(costs.reduce((a,x)=>a+Number(x.monthly||0),0) + store.tools.reduce((a,x)=>a+Number(x.boxCost||0),0))} icon={Wallet} tone="amber"/>
      <Kpi label="Coût annuel" value={money((costs.reduce((a,x)=>a+Number(x.monthly||0),0) + store.tools.reduce((a,x)=>a+Number(x.boxCost||0),0))*12)} icon={TrendingUp} tone="red"/>
      <Kpi label="Abonnements" value={costs.length} icon={Settings2}/>
      <Kpi label="Box" value={activeBoxes} icon={Box}/>
    </div><Table columns={[
      {key:"name",label:"Outil",render:r=><input className={inputClass} value={r.name||""} onChange={e=>updateCatalogItem("costs",r.id,{name:e.target.value})}/>},{key:"provider",label:"Fournisseur",render:r=><input className={inputClass} value={r.provider||""} onChange={e=>updateCatalogItem("costs",r.id,{provider:e.target.value})}/>},{key:"monthly",label:"Coût / mois",render:r=><input className={inputClass} type="number" value={r.monthly||0} onChange={e=>updateCatalogItem("costs",r.id,{monthly:Number(e.target.value||0)})}/>},{key:"annual",label:"Coût / an",render:r=>money(Number(r.monthly||0)*12)},{key:"status",label:"Statut",render:r=><select className={inputClass} value={r.status||"active"} onChange={e=>updateCatalogItem("costs",r.id,{status:e.target.value})}><option value="active">Actif</option><option value="a_revoir">À revoir</option></select>},{key:"action",label:"",render:r=><button onClick={()=>removeCatalogItem("costs",r.id)} className="text-[10px] font-bold text-red-700">Supprimer</button>}
    ]} rows={costs}/></Card></div>}

    {tab==="contrats" && <Card className="p-5"><SectionTitle icon={FileCheck2} title="Fournisseurs & contrats" subtitle="Renouvellements, préavis et engagements" action={<div className="flex gap-2"><button onClick={()=>exportCatalog("contracts","Fournisseurs_contrats")} className="btn-secondary"><Download size={13}/> Exporter</button><button onClick={()=>openImport("contracts")} className="btn-secondary"><Upload size={13}/> Importer</button><button onClick={()=>setNewCatalogItem("contracts")} className="btn-primary"><Plus size={13}/> Ajouter</button></div>}/><Table columns={[
      {key:"provider",label:"Fournisseur",render:r=><input className={inputClass} value={r.provider||""} onChange={e=>updateCatalogItem("contracts",r.id,{provider:e.target.value})}/>},{key:"contract",label:"Contrat",render:r=><input className={inputClass} value={r.contract||""} onChange={e=>updateCatalogItem("contracts",r.id,{contract:e.target.value})}/>},{key:"end",label:"Fin",render:r=><input className={inputClass} type="date" value={r.end||""} onChange={e=>updateCatalogItem("contracts",r.id,{end:e.target.value})}/>},{key:"notice",label:"Préavis",render:r=><input className={inputClass} value={r.notice||""} onChange={e=>updateCatalogItem("contracts",r.id,{notice:e.target.value})}/>},{key:"monthly",label:"Coût / mois",render:r=><input className={inputClass} type="number" value={r.monthly||0} onChange={e=>updateCatalogItem("contracts",r.id,{monthly:Number(e.target.value||0)})}/>},{key:"status",label:"Statut",render:r=><select className={inputClass} value={r.status||"active"} onChange={e=>updateCatalogItem("contracts",r.id,{status:e.target.value})}><option value="active">Actif</option><option value="a_revoir">À revoir</option><option value="termine">Terminé</option></select>},{key:"action",label:"",render:r=><button onClick={()=>removeCatalogItem("contracts",r.id)} className="text-[10px] font-bold text-red-700">Supprimer</button>}
    ]} rows={contracts}/></Card>}

    {tab==="licences" && <Card className="p-5"><SectionTitle icon={Users} title="Licences utilisateurs" subtitle="Détectez les licences payées mais inutilisées" action={<div className="flex gap-2"><button onClick={()=>exportCatalog("licenses","Licences")} className="btn-secondary"><Download size={13}/> Exporter</button><button onClick={()=>openImport("licenses")} className="btn-secondary"><Upload size={13}/> Importer</button><button onClick={()=>setNewCatalogItem("licenses")} className="btn-primary"><Plus size={13}/> Ajouter</button></div>}/><Table columns={[
      {key:"tool",label:"Outil",render:r=><input className={inputClass} value={r.tool||""} onChange={e=>updateCatalogItem("licenses",r.id,{tool:e.target.value})}/>},{key:"provider",label:"Fournisseur",render:r=><input className={inputClass} value={r.provider||""} onChange={e=>updateCatalogItem("licenses",r.id,{provider:e.target.value})}/>},{key:"total",label:"Licences",render:r=><input className={inputClass} type="number" value={r.total||0} onChange={e=>updateCatalogItem("licenses",r.id,{total:Number(e.target.value||0)})}/>},{key:"used",label:"Utilisées",render:r=><input className={inputClass} type="number" value={r.used||0} onChange={e=>updateCatalogItem("licenses",r.id,{used:Number(e.target.value||0)})}/>},{key:"unused",label:"Inutilisées",render:r=><span className={Number(r.total)-Number(r.used)>0?"text-red-700 font-bold":"text-emerald-700"}>{Math.max(0,Number(r.total)-Number(r.used))}</span>},{key:"unit",label:"Coût unitaire",render:r=>money(r.unit)},{key:"saving",label:"Économie potentielle / an",render:r=>money(Math.max(0,Number(r.total)-Number(r.used))*Number(r.unit||0)*12)},{key:"action",label:"",render:r=><button onClick={()=>removeCatalogItem("licenses",r.id)} className="text-[10px] font-bold text-red-700">Supprimer</button>}
    ]} rows={licenses}/></Card>}

    {tab==="controle" && <Card><div className="p-5"><SectionTitle icon={ShieldCheck} title="Contrôle interne" subtitle="Anomalies administratives détectées automatiquement"/>{alerts.length ? <Table columns={[
      {key:"tone",label:"Niveau",render:r=><Pill tone={r.tone==="red"?"red":"amber"}>{r.tone==="red"?"Critique":"Attention"}</Pill>},
      {key:"title",label:"Anomalie"},{key:"detail",label:"Détail"}
    ]} rows={alerts}/> : <div className="py-10 text-center text-emerald-700 text-[11px]"><CheckCircle2 className="inline mr-2" size={15}/>Aucune anomalie.</div>}</div></Card>}

    {tab==="journal" && <Card><div className="p-5"><SectionTitle icon={History} title="Journal des actions" subtitle="Traçabilité des opérations administratives"/><Table columns={[
      {key:"date",label:"Date",render:r=>fmtDate(r.date)},{key:"channel",label:"Action / canal"},{key:"comment",label:"Commentaire"},{key:"author",label:"Utilisateur"}
    ]} rows={store.history}/></div></Card>}

    {tab==="archives-demandes" && <Card className="p-5"><SectionTitle icon={History} title="Archives des demandes" subtitle="Toutes les demandes terminées restent conservées et consultables."/><Table columns={[
      {key:"date",label:"Clôture",render:r=>fmtDate(r.updated_at || r.completed_at || r.created_at)},{key:"title",label:"Demande",render:r=><span className="font-bold">{r.title || administrationRequestLabel(r.type)}</span>},{key:"client",label:"Dossier",render:r=>clients.find(c=>String(c.id)===String(r.client_id))?.nom || "Cabinet"},{key:"priority",label:"Priorité",render:r=><Pill tone={r.priority==="urgente"?"red":r.priority==="haute"?"amber":"neutral"}>{r.priority||"normal"}</Pill>},{key:"status",label:"Statut",render:r=><Pill tone="green">Terminée</Pill>},{key:"action",label:"",render:r=><button type="button" onClick={()=>onUpdateAdministrationRequest?.(r.id,{status:"en_cours"})} className="text-[10px] font-bold text-accent-deep">Rouvrir</button>}
    ]} rows={archivedAdministrationRequests}/></Card>}

    {tab==="reporting" && <div className="space-y-4"><div className="grid grid-cols-2 xl:grid-cols-4 gap-3"><Kpi label="CA facturé" value={money(store.invoices.reduce((a,i)=>a+Number(i.amount||0),0))} icon={CircleDollarSign}/><Kpi label="CA encaissé" value={money(store.invoices.filter(i=>i.status==="payee").reduce((a,i)=>a+Number(i.amount||0),0))} icon={CheckCircle2} tone="green"/><Kpi label="Impayés" value={money(toCollect)} icon={AlertTriangle} tone="red"/><Kpi label="Marge moyenne" value={`${Math.round(rentability.reduce((a,r)=>a+r.marginPct,0)/(rentability.length||1))}%`} icon={TrendingUp} tone="green"/></div><Card className="p-5"><SectionTitle icon={TrendingUp} title="Indicateurs direction" subtitle="Base de pilotage V2"/><div className="space-y-3">{[
      ["Taux d'encaissement", store.invoices.length ? Math.round(store.invoices.filter(i=>i.status==="payee").length/store.invoices.length*100):0],
      ["EBICS installés", store.tools.length ? Math.round(installedEbics/store.tools.length*100):0],
      ["Box actives", store.tools.length ? Math.round(activeBoxes/store.tools.length*100):0],
      ["Entrées complètes", clients.length ? Math.round((clients.length-incompleteEntries.length)/clients.length*100):0],
    ].map(([l,v])=><div key={l}><div className="flex justify-between text-[10.5px] font-bold mb-1"><span>{l}</span><span>{v}%</span></div><div className="h-2 rounded-full bg-line overflow-hidden"><div className="h-full rounded-full bg-accent" style={{width:`${Math.min(100,v)}%`}}/></div></div>)}</div></Card></div>}
    </div>
    {newTeamUser && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={()=>setNewTeamUser(false)}><div className="w-full max-w-md rounded-2xl bg-app border border-line shadow-xl p-5" onClick={e=>e.stopPropagation()}><div className="text-[14px] font-extrabold text-ink">Ajouter un utilisateur</div><div className="text-[10.5px] text-inkmuted mt-1 mb-4">Création d'une fiche en attente. Le futur compte pourra ensuite être rattaché à cette fiche.</div><form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await insertTeamMemberRemote({id:uid("team"),nom:String(f.get("nom")||""),email:String(f.get("email")||""),role:String(f.get("role")||"collaborateur"),statut:"en_attente",portefeuille_id:String(f.get("portefeuille")||"")||null});setNewTeamNotice("Fiche utilisateur créée. Elle apparaîtra après actualisation.");setTimeout(()=>setNewTeamUser(false),900);}catch(err){setNewTeamNotice(err?.message||"Impossible de créer la fiche.");}}} className="grid gap-3"><input className={inputClass} name="nom" required placeholder="Nom et prénom"/><input className={inputClass} name="email" type="email" required placeholder="Email"/><select className={inputClass} name="role"><option value="collaborateur">Collaborateur</option><option value="chef_mission">Chef de mission</option><option value="gestionnaire_paie">Gestionnaire paie</option><option value="expert">Expert-comptable</option></select><input className={inputClass} name="portefeuille" placeholder="ID portefeuille (facultatif)"/>{newTeamNotice&&<div className="text-[10.5px] font-semibold text-inkmuted">{newTeamNotice}</div>}<div className="flex justify-end gap-2"><button type="button" onClick={()=>setNewTeamUser(false)} className="btn-secondary">Annuler</button><button type="submit" className="btn-primary">Créer la fiche</button></div></form></div></div>}
    {newCatalogItem && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={()=>setNewCatalogItem(null)}><div className="w-full max-w-lg rounded-2xl bg-app border border-line shadow-xl p-5" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-4"><div><div className="text-[14px] font-extrabold text-ink">Ajouter un élément</div><div className="text-[10.5px] text-inkmuted">{newCatalogItem === "costs" ? "Coût / abonnement" : newCatalogItem === "contracts" ? "Fournisseur / contrat" : "Licence"}</div></div><button type="button" onClick={()=>setNewCatalogItem(null)} className="p-2 rounded-lg hover:bg-paper"><XCircle size={16}/></button></div><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(newCatalogItem==="costs") addCatalogItem("costs",{name:String(f.get("name")||""),provider:String(f.get("provider")||""),monthly:Number(f.get("monthly")||0),status:"active"});else if(newCatalogItem==="contracts") addCatalogItem("contracts",{provider:String(f.get("provider")||""),contract:String(f.get("contract")||""),end:String(f.get("end")||""),notice:String(f.get("notice")||""),monthly:Number(f.get("monthly")||0),status:"active"});else addCatalogItem("licenses",{tool:String(f.get("tool")||""),provider:String(f.get("provider")||""),total:Number(f.get("total")||0),used:Number(f.get("used")||0),unit:Number(f.get("unit")||0)});}} className="grid gap-3"><input className={inputClass} name="name" placeholder="Nom" autoFocus/><input className={inputClass} name="tool" placeholder="Outil"/><input className={inputClass} name="provider" placeholder="Fournisseur"/><input className={inputClass} name="contract" placeholder="Contrat"/><input className={inputClass} name="end" type="date"/><input className={inputClass} name="notice" placeholder="Préavis (ex. 90 jours)"/><div className="grid grid-cols-3 gap-2"><input className={inputClass} name="monthly" type="number" placeholder="€/mois"/><input className={inputClass} name="total" type="number" placeholder="Licences"/><input className={inputClass} name="used" type="number" placeholder="Utilisées"/></div><input className={inputClass} name="unit" type="number" placeholder="Coût unitaire"/><div className="flex justify-end gap-2 mt-2"><button type="button" onClick={()=>setNewCatalogItem(null)} className="btn-secondary">Annuler</button><button type="submit" className="btn-primary"><Plus size={13}/> Ajouter</button></div></form></div></div>}
  </div>;
}

export { AdministrationView };