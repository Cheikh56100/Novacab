import { X, Eye, RotateCcw, CalendarDays, FileText, CheckCircle2, ListChecks, History, ChevronRight } from "lucide-react";
import React from "react";
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, CURRENT_YEAR, getAnnualSnapshot, listAnnualYears } = Shared;
const { useMemo, useState } = React;

const fmtDate = (v) => v ? new Date(String(v).includes("T") ? v : `${v}T12:00:00`).toLocaleDateString("fr-FR") : "—";
const countObject = (v) => v && typeof v === "object" ? Object.keys(v).length : 0;

// Les archives peuvent contenir des objets issus de snapshots historiques.
// React ne peut pas rendre directement un objet comme enfant : on normalise
// donc systématiquement les valeurs affichées dans les cartes de consultation.
const displayValue = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (Array.isArray(v)) return v.length ? v.map(displayValue).join(", ") : "—";
  if (v instanceof Date) return fmtDate(v);
  if (typeof v === "object") {
    const entries = Object.entries(v).filter(([, value]) => value !== null && value !== undefined && value !== "");
    if (!entries.length) return "—";
    return entries.map(([key, value]) => `${key} : ${displayValue(value)}`).join(" · ");
  }
  return String(v);
};

const labelStatus = (v) => v === true ? "Oui" : v === false ? "Non" : displayValue(v);

function ArchiveKpi({ label, value, icon: Icon }) {
  return <div style={{padding:"11px 13px",border:`1px solid ${T.line}`,borderRadius:13,background:T.card,display:"flex",alignItems:"center",gap:10}}>
    <div style={{width:30,height:30,borderRadius:9,background:T.navySoft,color:T.navy,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={14}/></div>
    <div><div style={{fontSize:17,fontWeight:850,color:T.ink}}>{value}</div><div style={{fontSize:9.5,color:T.inkMuted}}>{label}</div></div>
  </div>;
}

function ArchiveDetail({ label, value }) {
  return <div style={{padding:"9px 10px",border:`1px solid ${T.line}`,borderRadius:10,background:T.paper}}>
    <div style={{fontSize:9.5,textTransform:"uppercase",letterSpacing:".06em",fontWeight:800,color:T.inkMuted}}>{label}</div>
    <div style={{fontSize:11.5,fontWeight:700,color:T.ink,marginTop:3,wordBreak:"break-word"}}>{displayValue(value)}</div>
  </div>;
}

function ArchivesView({ clients, tasks, isAdmin, onUnarchive, onOpenClient }) {
  const [year, setYear] = useState(CURRENT_YEAR() - 1);
  const [cid, setCid] = useState(null);
  const archivedClients = useMemo(() => (clients || []).filter(c => c.statutDossier === "inactif"), [clients]);
  const years = useMemo(() => {
    const y = new Set([CURRENT_YEAR()]);
    (clients || []).forEach(c => listAnnualYears(c).forEach(v => y.add(v)));
    return [...y].sort((a, b) => b - a);
  }, [clients]);
  const rows = useMemo(() => (clients || []).filter(c => getAnnualSnapshot(c, year)), [clients, year]);
  const selected = rows.find(c => c.id === cid);
  const snap = selected && getAnnualSnapshot(selected, year);
  const oldTasks = useMemo(() => (tasks || []).filter(t => {
    const date = String(t.date_echeance || t.created_at || "");
    return Number(date.slice(0, 4)) === Number(year) && ["termine", "archive"].includes(String(t.statut || "").toLowerCase());
  }), [tasks, year]);
  const dossierAvecTva = rows.filter(c => countObject(getAnnualSnapshot(c, year)?.tvaMois) > 0).length;
  const dossierAvecBilan = rows.filter(c => countObject(getAnnualSnapshot(c, year)?.bilan) > 0).length;

  return <div className="space-y-4">
    <Reveal>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap"}}>
        <div>
          <h1 style={{fontFamily:T.serif,fontSize:20,fontWeight:800,margin:0}}>Archives / exercices</h1>
          <div style={{fontSize:12,color:T.inkMuted,marginTop:4}}>Un exercice à la fois : retrouver, comprendre, puis ouvrir le dossier si besoin.</div>
        </div>
        <select aria-label="Exercice" value={year} onChange={e=>{setYear(Number(e.target.value));setCid(null)}} style={{border:`1px solid ${T.line}`,borderRadius:10,background:T.card,padding:"8px 10px",fontSize:11,fontWeight:700}}>
          {years.map(y=><option key={y} value={y}>{y}{y===CURRENT_YEAR()?" — actif":" — archive"}</option>)}
        </select>
      </div>
    </Reveal>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <ArchiveKpi label={`Dossiers ${year}`} value={rows.length} icon={CalendarDays}/>
      <ArchiveKpi label="Bilans conservés" value={dossierAvecBilan} icon={FileText}/>
      <ArchiveKpi label="Suivis TVA" value={dossierAvecTva} icon={ListChecks}/>
      <ArchiveKpi label="Tâches terminées" value={oldTasks.length} icon={CheckCircle2}/>
    </div>

    <Panel title={`Exercice ${year}`} right={<span style={{fontSize:10,color:T.inkMuted}}>{rows.length} dossier{rows.length > 1 ? "s" : ""} avec historique</span>}>
      {!rows.length ? <EmptyNote text="Aucune archive annuelle disponible pour cet exercice."/> : <div>
        {rows.map(c => {
          const s = getAnnualSnapshot(c, year);
          const tva = countObject(s.tvaMois);
          const checklist = countObject(s.dossierAnnuelChecklist);
          const bilan = s.bilan || {};
          return <div key={c.id} style={{display:"grid",gridTemplateColumns:"minmax(190px,1fr) auto auto auto auto",gap:10,alignItems:"center",padding:"11px 4px",borderBottom:`1px solid ${T.line}`}}>
            <div>
              <b style={{fontSize:12.5}}>{c.nom}</b>
              <div style={{fontSize:10.5,color:T.inkMuted,marginTop:2}}>Clôture : {fmtDate(c.dateCloture || bilan.dateCloture)} · archive annuelle disponible</div>
            </div>
            <Stamped tone="neutral" small>TVA {tva} mois</Stamped>
            <Stamped tone="neutral" small>{checklist} éléments</Stamped>
            <Stamped tone={bilan.transmis ? "green" : "neutral"} small>{bilan.transmis ? "Bilan transmis" : "Bilan conservé"}</Stamped>
            <button className="btn-secondary !py-1.5" onClick={()=>setCid(c.id)}><Eye size={12}/> Consulter</button>
          </div>;
        })}
      </div>}
    </Panel>

    <Panel title="Dossiers actuellement archivés" right={<span style={{fontSize:10,color:T.inkMuted}}>Le statut du dossier peut être réactivé par l’administration</span>}>
      {!archivedClients.length ? <EmptyNote text="Aucun dossier actuellement archivé."/> : <div>
        {archivedClients.map(c => <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 4px",borderBottom:`1px solid ${T.line}`,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:190}}><b style={{fontSize:12.5}}>{c.nom}</b><div style={{fontSize:10.5,color:T.inkMuted}}>Archivé le {fmtDate(c.archiveDossier?.date)}</div></div>
          <Stamped tone="neutral" small>Archivé</Stamped>
          <button className="btn-secondary !py-1.5" onClick={()=>onOpenClient?.(c.id)}><Eye size={12}/> Ouvrir</button>
          {isAdmin && <button className="btn-primary !py-1.5" onClick={()=>{if(confirm(`Désarchiver « ${c.nom} » ?`)) onUnarchive?.(c.id)}}><RotateCcw size={12}/> Désarchiver</button>}
        </div>)}
      </div>}
    </Panel>

    <Panel title={`Tâches terminées — ${year}`} right={<span style={{fontSize:10,color:T.inkMuted}}>Historique de production</span>}>
      {!oldTasks.length ? <EmptyNote text="Aucune tâche terminée ou archivée pour cet exercice."/> : <div>
        {oldTasks.slice(0, 20).map(t => <div key={t.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 4px",borderBottom:`1px solid ${T.line}`,fontSize:11.5}}>
          <CheckCircle2 size={14} className="text-emerald-600"/>
          <div style={{flex:1}}><b>{t.nom}</b><div style={{fontSize:10,color:T.inkMuted}}>{t.date_echeance || "—"}</div></div>
          <Stamped tone="neutral" small>{t.statut}</Stamped>
        </div>)}
      </div>}
    </Panel>

    {selected && snap && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onMouseDown={e=>{if(e.target===e.currentTarget)setCid(null)}}>
      <div role="dialog" aria-modal="true" aria-label={`Archive ${selected.nom} ${year}`} style={{background:T.card,borderRadius:16,maxWidth:980,width:"100%",maxHeight:"92vh",overflow:"auto",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",marginBottom:16}}>
          <div><div style={{fontSize:9.5,textTransform:"uppercase",fontWeight:800,color:T.inkMuted}}>Consultation historique</div><h3 style={{margin:"3px 0 0",fontSize:17}}>{selected.nom}</h3><div style={{fontSize:11,color:T.inkMuted}}>Exercice {year} · lecture seule</div></div>
          <button className="btn-secondary" onClick={()=>setCid(null)}><X size={14}/> Fermer</button>
        </div>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <ArchiveKpi label="TVA conservée" value={`${countObject(snap.tvaMois)} mois`} icon={ListChecks}/>
          <ArchiveKpi label="Checklist annuelle" value={countObject(snap.dossierAnnuelChecklist)} icon={CheckCircle2}/>
          <ArchiveKpi label="Bilan" value={labelStatus(snap.bilan?.transmis)} icon={FileText}/>
          <ArchiveKpi label="Suivis" value={[snap.is,snap.cfe,snap.social,snap.revision].filter(Boolean).length} icon={History}/>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Panel title="Bilan"><div className="grid grid-cols-2 gap-2"><ArchiveDetail label="Montant HT" value={snap.bilan?.montantHT ?? snap.bilan?.montant_ht ?? "—"}/><ArchiveDetail label="Montant TTC" value={snap.bilan?.montantTTC ?? snap.bilan?.montant_ttc ?? "—"}/><ArchiveDetail label="Périodicité" value={snap.bilan?.periodicite ?? "—"}/><ArchiveDetail label="Jour de facturation" value={snap.bilan?.jourFacturation ?? "—"}/><ArchiveDetail label="Dates de facturation" value={Array.isArray(snap.bilan?.datesFacturation) ? snap.bilan.datesFacturation.join(", ") : snap.bilan?.datesFacturation ?? "—"}/><ArchiveDetail label="Transmis" value={labelStatus(snap.bilan?.transmis)}/></div></Panel>
          <Panel title="TVA"><div className="grid grid-cols-2 gap-2"><ArchiveDetail label="Mois conservés" value={countObject(snap.tvaMois)}/><ArchiveDetail label="État" value={countObject(snap.tvaMois) ? "Suivi disponible" : "Non conservé"}/></div></Panel>
          <Panel title="Dossier annuel"><div className="grid grid-cols-2 gap-2"><ArchiveDetail label="Éléments conservés" value={countObject(snap.dossierAnnuelChecklist)}/><ArchiveDetail label="État" value={countObject(snap.dossierAnnuelChecklist) ? "Checklist disponible" : "Aucune checklist"}/></div></Panel>
          <Panel title="Autres suivis"><div className="grid grid-cols-2 gap-2"><ArchiveDetail label="IS" value={countObject(snap.is) ? `${countObject(snap.is)} élément(s)` : labelStatus(snap.is)}/><ArchiveDetail label="CFE" value={countObject(snap.cfe) ? `${countObject(snap.cfe)} élément(s)` : labelStatus(snap.cfe)}/><ArchiveDetail label="Social" value={countObject(snap.social) ? `${countObject(snap.social)} élément(s)` : labelStatus(snap.social)}/><ArchiveDetail label="Révision" value={countObject(snap.revision) ? `${countObject(snap.revision)} élément(s)` : labelStatus(snap.revision)}/></div></Panel>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}><button className="btn-secondary" onClick={()=>onOpenClient?.(selected.id)}><ChevronRight size={13}/> Ouvrir le dossier actuel</button></div>
      </div>
    </div>}
  </div>;
}

export { ArchivesView };
