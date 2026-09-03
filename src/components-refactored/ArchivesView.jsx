import { X, Eye, RotateCcw } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { ArchiveSummary } from "./ArchiveSummary.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, CURRENT_YEAR, getAnnualSnapshot, listAnnualYears } = Shared;
const { useState, useMemo } = React;



function ArchivesView({clients,tasks,isAdmin,onUnarchive,onOpenClient}){
 const [year,setYear]=useState(CURRENT_YEAR()-1); const [cid,setCid]=useState(null);
 const archivedClients=useMemo(()=> (clients||[]).filter(c=>c.statutDossier==="inactif"),[clients]);
 const years=useMemo(()=>{const y=new Set([CURRENT_YEAR()]);(clients||[]).forEach(c=>listAnnualYears(c).forEach(v=>y.add(v)));return [...y].sort((a,b)=>b-a)},[clients]);
 const rows=(clients||[]).filter(c=>getAnnualSnapshot(c,year)); const selected=rows.find(c=>c.id===cid); const snap=selected&&getAnnualSnapshot(selected,year);
 const oldTasks=(tasks||[]).filter(t=>Number(String(t.date_echeance||t.created_at||'').slice(0,4))===Number(year)&&['termine','archive'].includes(String(t.statut||'').toLowerCase()));
 return <div>
   <Reveal><h1 style={{fontFamily:T.serif,fontSize:20,fontWeight:800}}>Archives / exercices</h1><div style={{fontSize:12,color:T.inkMuted,marginBottom:18}}>Retrouvez les dossiers archivés et consultez les exercices précédents.</div></Reveal>
   <Panel title={`Dossiers archivés (${archivedClients.length})`}>
     {!archivedClients.length ? <EmptyNote text="Aucun dossier actuellement archivé."/> : <div>{archivedClients.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 4px',borderBottom:`1px solid ${T.line}`,opacity:.98}}><div style={{flex:1,minWidth:0}}><b style={{fontSize:12.5}}>{c.nom}</b><div style={{fontSize:10.5,color:T.inkMuted}}>Archivé le {c.archiveDossier?.date ? new Date(c.archiveDossier.date).toLocaleDateString('fr-FR') : '—'}{c.archiveDossier?.par ? ` · par utilisateur` : ''}</div></div><Stamped tone="neutral" small>Archivé</Stamped><button className="btn-secondary !py-1.5" onClick={()=>onOpenClient?.(c.id)}><Eye size={12}/> Consulter</button>{isAdmin&&<button className="btn-primary !py-1.5" onClick={()=>{if(confirm(`Désarchiver « ${c.nom} » ?`))onUnarchive?.(c.id)}}><RotateCcw size={12}/> Désarchiver</button>}</div>)}</div>}
   </Panel>
   <div style={{height:14}}/>
   <Panel title="Exercice" right={<select value={year} onChange={e=>{setYear(Number(e.target.value));setCid(null)}}>{years.map(y=><option key={y} value={y}>{y}{y===CURRENT_YEAR()?' — actif':' — archivé'}</option>)}</select>}><div className="grid md:grid-cols-3 gap-3"><div><b>{rows.length}</b><div style={{fontSize:10,color:T.inkMuted}}>dossiers avec archive annuelle</div></div><div><b>{oldTasks.length}</b><div style={{fontSize:10,color:T.inkMuted}}>tâches terminées / archivées</div></div><div><b>{rows.filter(c=>Object.keys(getAnnualSnapshot(c,year)?.tvaMois||{}).length).length}</b><div style={{fontSize:10,color:T.inkMuted}}>suivis TVA conservés</div></div></div></Panel>
   <div style={{height:14}}/>
   <Panel title={`Dossiers — ${year}`}>{!rows.length?<EmptyNote text="Aucune archive pour cet exercice."/>:<div>{rows.map(c=><div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 4px',borderBottom:`1px solid ${T.line}`}}><div style={{flex:1}}><b style={{fontSize:12.5}}>{c.nom}</b><div style={{fontSize:10.5,color:T.inkMuted}}>Clôture : {c.dateCloture||'—'}</div></div><Stamped tone="neutral" small>TVA {Object.keys(getAnnualSnapshot(c,year)?.tvaMois||{}).length?'conservée':'—'}</Stamped><Stamped tone="neutral" small>DA {Object.keys(getAnnualSnapshot(c,year)?.dossierAnnuelChecklist||{}).length?'conservé':'—'}</Stamped><button className="btn-secondary !py-1.5" onClick={()=>setCid(c.id)}><Eye size={12}/> Consulter</button></div>)}</div>}</Panel>
   <div style={{height:14}}/>
   <Panel title={`Tâches — ${year}`}>{!oldTasks.length?<EmptyNote text="Aucune tâche archivée."/>:<div>{oldTasks.map(t=><div key={t.id} style={{padding:'8px 4px',borderBottom:`1px solid ${T.line}`,fontSize:11.5}}><b>{t.nom}</b> · {t.date_echeance||'—'} · {t.statut}</div>)}</div>}</Panel>
   {selected&&snap&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:T.card,borderRadius:16,maxWidth:900,width:'100%',maxHeight:'90vh',overflow:'auto',padding:20}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><h3 style={{margin:0}}>{selected.nom} — archive {year}</h3><button className="btn-secondary" onClick={()=>setCid(null)}><X size={14}/> Fermer</button></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:14}}>
<div style={{padding:14,borderRadius:14,background:T.navySoft,border:`1px solid ${T.line}`}}><div style={{fontSize:10,fontWeight:800,color:T.inkMuted,textTransform:'uppercase'}}>TVA conservée</div><div style={{fontSize:22,fontWeight:800,color:T.ink,marginTop:5}}>{Object.keys(snap.tvaMois||{}).length} mois</div></div>
<div style={{padding:14,borderRadius:14,background:T.greenSoft,border:`1px solid ${T.line}`}}><div style={{fontSize:10,fontWeight:800,color:T.inkMuted,textTransform:'uppercase'}}>Checklist annuelle</div><div style={{fontSize:22,fontWeight:800,color:T.ink,marginTop:5}}>{Object.keys(snap.dossierAnnuelChecklist||{}).length} éléments</div></div>
<div style={{padding:14,borderRadius:14,background:T.amberSoft,border:`1px solid ${T.line}`}}><div style={{fontSize:10,fontWeight:800,color:T.inkMuted,textTransform:'uppercase'}}>Bilan</div><div style={{fontSize:13,fontWeight:800,color:T.ink,marginTop:8}}>{snap.bilan?.transmis?'Transmis':'À consulter'}</div></div>
</div><div className="grid md:grid-cols-2 gap-3"><Panel title="TVA"><ArchiveSummary data={snap.tvaMois||{}} empty="Aucun suivi TVA conservé."/></Panel><Panel title="Dossier annuel"><ArchiveSummary data={snap.dossierAnnuelChecklist||{}} empty="Aucune checklist conservée."/></Panel><Panel title="Bilan"><ArchiveSummary data={snap.bilan||{}} empty="Aucune donnée bilan."/></Panel><Panel title="Autres suivis"><ArchiveSummary data={{IS:snap.is,CFE:snap.cfe,Social:snap.social,Révision:snap.revision}} empty="Aucun autre suivi."/></Panel></div></div></div>}
 </div>
}

export { ArchivesView };
