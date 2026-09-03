import { X, ArrowUpRight } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, CURRENT_YEAR, getAnnualSnapshot, getExerciseYear, todayISO, getBilanEcheance } = Shared;
const { useState } = React;



function BilanAnnualOverview({ clients, onViewBilans }) {
  const active = clients.filter((c) => (c.statutDossier || "actif") === "actif");
  const currentYear = CURRENT_YEAR();
  const years = [currentYear - 1, currentYear];
  const [selectedYear, setSelectedYear] = useState(null);

  const stats = years.map((year) => {
    const rows = active.map((client) => ({
      client,
      snapshot: getAnnualSnapshot(client, year),
      activeYear: Number(client.annualActiveYear || getExerciseYear(client.dateCloture, null)),
    }));

    // Une année ne démarre que lorsqu'au moins un bilan de cette année a
    // réellement été marqué Terminé/Transmis. Le passage d'un dossier en
    // 2026 après la clôture de son bilan 2025 ne compte donc jamais comme
    // un bilan 2026 terminé.
    const yearStarted = rows.some(({ client, snapshot, activeYear }) =>
      !!snapshot?.bilan?.transmis || (activeYear === year && !!client.bilan?.transmis)
    );

    let expected = [];
    if (yearStarted) {
      expected = year === currentYear
        ? rows.filter(({ snapshot, activeYear }) => !!snapshot || activeYear === year)
        : rows.filter(({ client, snapshot, activeYear }) =>
            !!snapshot || activeYear === year || getExerciseYear(client.dateCloture, null) === year
          );
    }

    const transmitted = expected.filter(({ client, snapshot, activeYear }) =>
      !!snapshot?.bilan?.transmis || (activeYear === year && !!client.bilan?.transmis)
    ).length;

    const unfinished = expected.filter(({ client, snapshot, activeYear }) =>
      !snapshot?.bilan?.transmis && !(activeYear === year && !!client.bilan?.transmis)
    );

    const late = unfinished.filter(({ client, snapshot }) => {
      const bilan = snapshot?.bilan || {};
      const closure = snapshot?.dateCloture || (getExerciseYear(client.dateCloture, null) === year ? client.dateCloture : null);
      const d = getBilanEcheance(closure);
      return !bilan.transmis && d && todayISO() > d;
    }).length;

    const future = unfinished.filter(({ client, snapshot }) => {
      const bilan = snapshot?.bilan || {};
      const closure = snapshot?.dateCloture || (getExerciseYear(client.dateCloture, null) === year ? client.dateCloture : null);
      const d = getBilanEcheance(closure);
      return !bilan.transmis && d && todayISO() <= d;
    }).length;

    return { year, yearStarted, transmitted, unfinished, remaining: unfinished.length, total: expected.length, late, future, rows: expected };
  });

  const selected = stats.find((s) => s.year === selectedYear) || null;

  return <>
    <Panel title="Suivi des bilans annuels" right={<button className="btn-secondary !py-1.5" onClick={()=>onViewBilans?.()}>Voir les bilans <ArrowUpRight size={12}/></button>}>
      <div className="grid md:grid-cols-2 gap-3">
        {stats.map((s)=>{
          const pct=s.total?Math.round(s.transmitted/s.total*100):0;
          return <button key={s.year} type="button" onClick={()=>setSelectedYear(s.year)} style={{border:`1px solid ${T.line}`,borderRadius:12,padding:13,background:T.paper,textAlign:"left",cursor:"pointer",width:"100%"}} title={`Voir les bilans ${s.year}`}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><div style={{fontWeight:800,fontSize:13}}>{s.year}</div><Stamped tone={s.late?"red":s.remaining?"amber":s.yearStarted?"green":"neutral"} small>{s.yearStarted?`${s.remaining}/${s.total} restant${s.total>1?"s":""}`:"Non démarré"}</Stamped></div>
            <div style={{height:10,borderRadius:5,background:T.paperDeep,overflow:"hidden",marginBottom:8}}><div style={{height:"100%",width:`${pct}%`,background:T.green}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:T.inkMuted}}><span>{s.yearStarted?`${s.transmitted}/${s.total} transmis · ${pct}%`:"Aucun bilan terminé"}</span><span>{s.late?`${s.late} en retard`:s.future?`${s.future} dans les délais`:s.yearStarted?"Aucun bilan restant":"En attente du premier bilan terminé"}</span></div>
            <div style={{marginTop:8,fontSize:10.5,color:T.inkMuted}}>Cliquer pour voir les bilans terminés et non terminés.</div>
          </button>;
        })}
      </div>
    </Panel>

    {selected && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setSelectedYear(null)}>
      <div style={{background:T.card,borderRadius:16,maxWidth:900,width:"100%",maxHeight:"90vh",overflow:"auto",padding:20}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><h3 style={{margin:0}}>Bilans {selected.year}</h3><div style={{fontSize:11,color:T.inkMuted,marginTop:4}}>{selected.yearStarted?`${selected.transmitted} terminé${selected.transmitted>1?"s":""} · ${selected.unfinished.length} non terminé${selected.unfinished.length>1?"s":""}`:"Exercice non démarré"}</div></div><button className="btn-secondary" onClick={()=>setSelectedYear(null)}><X size={14}/> Fermer</button></div>
        {!selected.yearStarted ? <EmptyNote text={`Aucun bilan ${selected.year} n'a encore été marqué Terminé. Le suivi commencera automatiquement au premier bilan ${selected.year} terminé.`}/> : <>
          <Panel title={`Bilans terminés (${selected.transmitted})`}>{selected.transmitted===0?<EmptyNote text="Aucun bilan terminé pour cet exercice."/>:selected.rows.filter(({snapshot,client,activeYear})=>!!snapshot?.bilan?.transmis||(activeYear===selected.year&&client.bilan?.transmis)).map(({client,snapshot})=><div key={client.id} className="hoverRow" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 4px",borderBottom:`1px solid ${T.line}`}}><div style={{flex:1,fontWeight:700,fontSize:12}}>{client.nom}</div><Stamped tone="green" small>Terminé</Stamped><span style={{fontSize:10.5,color:T.inkMuted}}>{snapshot?.bilan?.transmisDate||client.bilan?.transmisDate||"—"}</span></div>)}</Panel>
          <div style={{height:12}}/>
          <Panel title={`Bilans non terminés (${selected.unfinished.length})`}>{selected.unfinished.length===0?<EmptyNote text="Aucun bilan non terminé pour cet exercice."/>:selected.unfinished.map(({client,snapshot})=><div key={client.id} className="hoverRow" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 4px",borderBottom:`1px solid ${T.line}`}}><div style={{flex:1,fontWeight:700,fontSize:12}}>{client.nom}</div><Stamped tone="amber" small>Non terminé</Stamped><span style={{fontSize:10.5,color:T.inkMuted}}>Clôture : {snapshot?.dateCloture||client.dateCloture||"—"}</span></div>)}</Panel>
        </>}
      </div>
    </div>}
  </>;
}

export { BilanAnnualOverview };
