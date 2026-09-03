from pathlib import Path
# Dashboard import CalendarRange
p=Path('/mnt/data/novacab_update/src/components-refactored/Dashboard.jsx')
s=p.read_text().replace('ArrowUpRight, CalendarDays, Wallet,', 'ArrowUpRight, CalendarDays, CalendarRange, Wallet,')
p.write_text(s)

# CabinetApp: remove anomaly detection / surveillance from active app
p=Path('/mnt/data/novacab_update/src/components-refactored/CabinetApp.jsx')
s=p.read_text()
s=s.replace('import { SurveillanceView } from "./SurveillanceView.jsx";\n','')
s=s.replace(', detectAllAnomalies, filterEditablePatch', ', filterEditablePatch')
s=s.replace('counts={{ ...computeCounts(myClients), anomalies: detectAllAnomalies(myClients).length, tachesActives:', 'counts={{ ...computeCounts(myClients), tachesActives:')
s=s.replace('{view === "surveillance" && <SurveillanceView clients={myClients} search={search} me={me} onOpenClient={openClientTab} />}\n','')
p.write_text(s)

# Pilotage: replace anomaly block with operational priorities based on tasks
p=Path('/mnt/data/novacab_update/src/components-refactored/PilotageView.jsx')
s=p.read_text()
s=s.replace('import { Users, Check, Mail, ShieldAlert, Clock3 } from "lucide-react";', 'import { Users, Check, Mail, Clock3, CalendarDays } from "lucide-react";')
s=s.replace('const { T, detectAllAnomalies } = Shared;', 'const { T } = Shared;')
s=s.replace('  const anomalies = useMemo(() => detectAllAnomalies(active), [active]);\n', '')
s=s.replace('  const critical = anomalies.filter((a) => a.gravite === "haute");', '  const lateTasks = (tasks || []).filter((t) => t.bucket === "retard" || t.statut === "en_retard");')
s=s.replace('{ label: "Priorités", value: critical.length, tone: critical.length ? "red" : "green", onClick: () => onView("surveillance") },', '{ label: "Tâches en retard", value: lateTasks.length, tone: lateTasks.length ? "red" : "green", onClick: () => onView("mes-taches") },')
s=s.replace('<KpiCard label="Priorités" value={critical.length} icon={ShieldAlert} tone={critical.length ? "red" : "green"} onClick={() => onView("surveillance")} />', '<KpiCard label="Tâches en retard" value={lateTasks.length} icon={CalendarDays} tone={lateTasks.length ? "red" : "green"} onClick={() => onView("mes-taches")} />')
s=s.replace('<Panel title="Actions prioritaires" right={<Stamped tone={critical.length ? "red" : "green"} small>{critical.length}</Stamped>}>\n        {critical.slice(0,7).map(a => <div key={a.id} className="hoverRow clickable" onClick={() => onOpenClient(a.clientId)} style={{display:"flex",gap:9,alignItems:"center",padding:"9px 5px",borderBottom:`1px solid ${T.line}`}}><span style={{width:7,height:7,borderRadius:9,background:T.red}}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{a.clientNom}</div><div style={{fontSize:10.5,color:T.inkMuted}}>{a.message}</div></div><Stamped tone="red" small>Prioritaire</Stamped></div>)}\n        {!critical.length && <EmptyNote text="Aucune priorité critique." />}\n      </Panel>', '<Panel title="Tâches en retard" right={<Stamped tone={lateTasks.length ? "red" : "green"} small>{lateTasks.length}</Stamped>}>\n        {lateTasks.slice(0,7).map(t => <div key={t.id} className="hoverRow clickable" onClick={() => onOpenClient(t.client_id || t.client?.id)} style={{display:"flex",gap:9,alignItems:"center",padding:"9px 5px",borderBottom:`1px solid ${T.line}`}}><Clock3 size={13} color={T.red}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:11.5}}>{t.nom || t.label || "Tâche"}</div><div style={{fontSize:10.5,color:T.inkMuted}}>{t.client?.nom || "Dossier"}{t.date_echeance ? ` · échéance ${t.date_echeance}` : ""}</div></div><Stamped tone="red" small>En retard</Stamped></div>)}\n        {!lateTasks.length && <EmptyNote text="Aucune tâche en retard." />}\n      </Panel>')
p.write_text(s)
