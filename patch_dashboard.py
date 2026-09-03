from pathlib import Path
p=Path('/mnt/data/novacab_update/src/components-refactored/Dashboard.jsx')
s=p.read_text()
s=s.replace('import { Stamped } from "./Stamped.jsx";','import { Stamped } from "./Stamped.jsx";')
s=s.replace('const { T, detectAllAnomalies } = Shared;','const { T } = Shared;')
s=s.replace('  const anomalies = useMemo(() => detectAllAnomalies(myClients), [myClients]);\n  const criticalAnomalies = anomalies.filter((a) => a.gravite === "haute");\n  const importantAnomalies = anomalies.filter((a) => a.gravite !== "haute");\n','')
s=s.replace('        urgentCount={tasks.filter(t => t.bucket === "retard" || t.bucket === "aujourdhui").length + criticalAnomalies.length}','        urgentCount={tasks.filter(t => t.bucket === "retard" || t.bucket === "aujourdhui").length}')
s=s.replace('          { label: "Anomalies détectées", value: anomalies.length, tone: anomalies.length ? "red" : "green", onClick: () => setView("surveillance") },\n          { label: "Tâches en retard", value: tasks.filter(t => t.bucket === "retard").length, tone: tasks.some(t => t.bucket === "retard") ? "red" : "green", onClick: () => setView("mes-taches") },','          { label: "Échéances à venir", value: tasks.filter(t => ["aujourdhui", "demain", "semaine"].includes(t.bucket)).length, tone: "neutral", onClick: () => setView("mes-taches") },\n          { label: "Tâches en retard", value: tasks.filter(t => t.bucket === "retard").length, tone: tasks.some(t => t.bucket === "retard") ? "red" : "green", onClick: () => setView("mes-taches") },')
s=s.replace('        <KpiCard index={2} label="Anomalies détectées" value={anomalies.length} icon={ShieldAlert} tone={anomalies.length ? "red" : "green"} onClick={() => setView("surveillance")} linkLabel="Voir les anomalies" />','        <KpiCard index={2} label="Échéances à venir" value={tasks.filter(t => ["aujourdhui", "demain", "semaine"].includes(t.bucket)).length} icon={CalendarDays} onClick={() => setView("mes-taches")} linkLabel="Voir les échéances" />')
# remove surveillance block between its opening div and before tasks grid
marker='      <div style={{ marginBottom: 18 }}>\n        <Panel index={4} title="À surveiller"'
start=s.find(marker)
if start!=-1:
    end=s.find('      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-[18px]">', start)
    if end!=-1:
        s=s[:start]+s[end:]
# Add compact dashboard section before tasks grid: deadlines and cockpit context.
needle='      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-[18px]">'
insert='''      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginBottom: 18 }}>
        <Panel index={4} title="Échéances à venir" right={<button onClick={() => setView("mes-taches")} style={{ background:"none", border:0, color:T.navy, fontWeight:700, fontSize:11, cursor:"pointer" }}>Voir tout <ArrowUpRight size={12} style={{verticalAlign:"middle"}} /></button>}>
          {upcomingGroups.filter(g => g.count > 0).length === 0 ? <EmptyNote text="Aucune échéance proche." /> : <div style={{display:"flex",flexDirection:"column",gap:7}}>{upcomingGroups.filter(g => g.count > 0).map(g => <div key={g.key} className="hoverRow clickable" onClick={() => setView("mes-taches")} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 9px",border:`1px solid ${T.line}`,borderRadius:9,background:T.paper}}><div style={{width:27,height:27,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:T.navySoft,color:T.navy}}><CalendarDays size={13}/></div><div style={{flex:1}}><div style={{fontSize:11,fontWeight:800,color:T.ink}}>{g.label}</div><div style={{fontSize:10,color:T.inkMuted}}>{g.next?.label || "Échéances à traiter"}</div></div><Stamped tone="neutral" small>{g.count}</Stamped></div>)}</div>}
        </Panel>
        <Panel index={5} title="Portefeuille" right={<button onClick={() => setView("clients")} style={{ background:"none", border:0, color:T.navy, fontWeight:700, fontSize:11, cursor:"pointer" }}>Voir les dossiers <ArrowUpRight size={12} style={{verticalAlign:"middle"}} /></button>}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            <div style={{padding:11,border:`1px solid ${T.line}`,borderRadius:10,background:T.paper}}><div style={{fontSize:10,color:T.inkMuted}}>Dossiers actifs</div><div style={{fontSize:22,fontWeight:800,color:T.navy,marginTop:3}}>{myClients.filter(c=>c.statutDossier!=="inactif").length}</div></div>
            <div style={{padding:11,border:`1px solid ${T.line}`,borderRadius:10,background:T.paper}}><div style={{fontSize:10,color:T.inkMuted}}>Non rapprochés</div><div style={{fontSize:22,fontWeight:800,color:nonRapprochesM1.length?T.amber:T.green,marginTop:3}}>{nonRapprochesM1.length}</div></div>
          </div>
          <div style={{marginTop:10,fontSize:10.5,color:T.inkMuted,lineHeight:1.5}}>Le cockpit privilégie les tâches et échéances opérationnelles du dossier.</div>
        </Panel>
        <Panel index={6} title="Actions rapides">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            <button className="btn-secondary" onClick={onNewClient}><Plus size={13}/> Nouveau client</button>
            <button className="btn-secondary" onClick={() => setView("mes-taches")}><Clock3 size={13}/> Mes tâches</button>
            <button className="btn-secondary" onClick={() => setView("planning")}><CalendarRange size={13}/> Planning</button>
            <button className="btn-secondary" onClick={() => setView("mails-types")}><ArrowUpRight size={13}/> Mails types</button>
          </div>
        </Panel>
      </div>\n\n'''
if needle in s: s=s.replace(needle,insert+needle,1)
p.write_text(s)
