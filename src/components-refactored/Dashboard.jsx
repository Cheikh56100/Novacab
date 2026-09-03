import { Users, Receipt, FileWarning, Landmark, Building2, ClipboardCheck, ArrowUpRight, CalendarDays, CalendarRange, Wallet, Clock3, Plus } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
import { BUCKET_LABELS as DEADLINE_BUCKET_LABELS } from "../services/deadlines";
const { SECTEURS_ACTIVITE, buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_FULL, DASHBOARD_CHART_COLORS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { DonutDistribution } from "./DonutDistribution.jsx";
import { HorizontalBarDistribution } from "./HorizontalBarDistribution.jsx";
import { BilanAnnualOverview } from "./BilanAnnualOverview.jsx";
import { KpiCard } from "./KpiCard.jsx";
import { MobileKpiSummary } from "./MobileKpiSummary.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { WelcomeHero } from "./WelcomeHero.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState, useMemo } = React;



function Dashboard({
  myClients,
  tasks,
  me,
  meRole,
  onOpenClient,
  setView,
  team,
  cabinetName,
  onNewClient,
  onSuperviseClick,
  onDashboardFilter
}) {
    const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const counts = computeCounts(myClients);
  const [taskFilter, setTaskFilter] = useState("Toutes");
  const buckets = ["retard", "aujourdhui", "demain", "semaine", "mois", "trimestre"];
  const filteredTasks = taskFilter === "Toutes" ? tasks.filter(t => buckets.includes(t.bucket)) : tasks.filter((t) => t.bucket === taskFilter);
  const sortedTasks = [...filteredTasks].sort((a, b) => a.date - b.date);

  const roleCounts = {
    Collaborateur: myClients.filter((c) => c.collab === me).length,
    Expert: myClients.filter((c) => c.expert === me).length,
    "Chef de mission": myClients.filter((c) => c.chefMission === me).length,
  };
  const maxRole = Math.max(1, ...Object.values(roleCounts));

  const prevKey = previousMonthKey();
  const nonRapprochesM1 = myClients.filter((c) => {
    const v = (c.revision?.banqueMois?.[prevKey] || "").toUpperCase();
    return v !== "FAIT" && v !== "NA";
  });

  // Widget Chef de mission : uniquement les dossiers où "me" est chef de mission, groupés par collaborateur.
  const superviseClients = myClients.filter((c) => c.chefMission === me);
  const byCollab = {};
  superviseClients.forEach((c) => {
    const key = c.collab || "Non assigné";
    if (!byCollab[key]) byCollab[key] = { total: 0, bilanRetard: 0, tvaAlert: 0 };
    byCollab[key].total += 1;
    if (isBilanLate(c)) byCollab[key].bilanRetard += 1;
    if (isTvaLate(c)) byCollab[key].tvaAlert += 1;
  });

  const sectorItems = useMemo(
  () =>
    buildDistribution(
      myClients,
      (c) =>
        c.secteur ||
        classifyActivite(c.activite),
      (key) =>
        SECTEURS_ACTIVITE.find(
          (s) => s.id === key
        )?.label || "Non classé",
      (key) =>
        SECTEURS_ACTIVITE.find(
          (s) => s.id === key
        )?.color
    ),
  [myClients]
);

const legalItems = useMemo(
  () =>
    buildDistribution(
      myClients,
      inferLegalForm,
      (key) => key
    ),
  [myClients]
);

const fiscalCategoryItems = useMemo(
  () => buildDistribution(myClients, inferCategorieFiscale, (key) => key),
  [myClients]
);

// Répartition métier demandée pour la Vue d'ensemble.
const tvaRegimeItems = useMemo(
  () =>
    buildDistribution(
      myClients,
      (c) => c.tvaRegime || "non_renseigne",
      (key) =>
        ({
          CA3: "CA3",
          CA12: "CA12",
          FRANCHISE: "Franchise en base",
          FEB: "Franchise en base",
          TRIM: "CA3 trimestrielle",
          non_renseigne: "Non renseigné",
        }[key] || key)
    ),
  [myClients]
);

const statusItems = useMemo(
  () =>
    buildDistribution(
      myClients,
      (c) =>
        c.statutDossier || "actif",
      (key) =>
        ({
          actif: "Actifs",
          transfert: "En transfert",
          inactif: "Inactifs",
        }[key] || key),
      (key) =>
        ({
          actif: T.green,
          transfert: T.amber,
          inactif: T.inkMuted,
        }[key])
    ),
  [myClients]
);

const tvaItems = useMemo(() => {
  const key = currentMonthKey();

  const relevant = myClients.filter(
    (c) =>
      c.tvaRegime &&
      c.tvaRegime !== "FRANCHISE"
  );

  const counts = {
    OK: 0,
    FAIT: 0,
    CONTROLE: 0,
    NON_VALIDE: 0,
    RETARD: 0,
    ATTENTE: 0,
    NA: 0,
  };

  relevant.forEach((c) => {
    const status =
      effectiveTvaStatus(c, key);

    if (status === "OK") counts.OK++;
    else if (status === "FAIT") counts.FAIT++;
    else if (status === "CONTROLE") counts.CONTROLE++;
    else if (status === "NON_VALIDE") counts.NON_VALIDE++;
    else if (status === "RETARD") counts.RETARD++;
    else if (status === "NA") counts.NA++;
    else counts.ATTENTE++;
  });

  return [
    {
      key: "OK",
      label: "Déclarées",
      value: counts.OK,
      color: T.green,
    },
    {
      key: "FAIT",
      label: "Préparées",
      value: counts.FAIT,
      color: T.amber,
    },
    {
      key: "CONTROLE",
      label: "Contrôlées — à déclarer",
      value: counts.CONTROLE,
      color: "#17345F",
    },
    {
      key: "NON_VALIDE",
      label: "À corriger",
      value: counts.NON_VALIDE,
      color: "#6D28D9",
    },
    {
      key: "RETARD",
      label: "En retard",
      value: counts.RETARD,
      color: T.red,
    },
    {
      key: "ATTENTE",
      label: "En attente",
      value: counts.ATTENTE,
      color: T.navy,
    },
    {
      key: "NA",
      label: "N/A",
      value: counts.NA,
      color: T.inkMuted,
    },
  ];
}, [myClients]);

const collaboratorItems = useMemo(
  () =>
    buildDistribution(
      myClients,
      (c) =>
        c.collab || "Non assigné",
      (key) => key,
      (_key, i) =>
        DASHBOARD_CHART_COLORS[
          i % DASHBOARD_CHART_COLORS.length
        ]
    ),
  [myClients]
);

  // Échéances à venir : regroupe les tâches par horizon, avec l'intitulé de la plus proche
  const upcomingGroups = [
    { key: "demain", label: "Demain" },
    { key: "semaine", label: "Cette semaine" },
    { key: "mois", label: "Ce mois-ci" },
    { key: "trimestre", label: "Ce trimestre" },
  ].map((g) => {
    const items = tasks.filter((t) => t.bucket === g.key).sort((a, b) => a.date - b.date);
    return { ...g, count: items.length, next: items[0] };
  });

  const taskToneStyle = (bucket) =>
    bucket === "retard" ? { color: T.red, bg: T.redSoft }
    : bucket === "aujourdhui" ? { color: T.amber, bg: T.amberSoft }
    : bucket === "demain" ? { color: T.navy, bg: T.navySoft }
    : { color: T.inkMuted, bg: T.paperDeep };
  const taskCategoryIcon = (category) =>
    category === "TVA" ? Receipt
    : category === "IS" ? Wallet
    : category === "CFE" ? Landmark
    : category === "Bilan" || category === "Clôture" ? FileWarning
    : category === "AGO" ? Building2
    : category === "DP" ? ClipboardCheck
    : CalendarDays;

  return (
    <div>
      <WelcomeHero
        me={me}
        cabinetName={cabinetName}
        activeClients={myClients.filter(c => c.statutDossier !== "inactif").length}
        urgentCount={tasks.filter(t => t.bucket === "retard" || t.bucket === "aujourdhui").length}
        onViewTasks={() => setView("mes-taches")}
        onViewClients={() => setView("clients")}
        onNewClient={onNewClient || (() => setView("clients"))}
      />

      <MobileKpiSummary
        title="Vue d'ensemble"
        items={[
          { label: "Dossiers actifs", value: myClients.filter(c => c.statutDossier !== "inactif").length, tone: "neutral", onClick: () => setView("clients") },
          { label: "TVA à préparer", value: myClients.filter(c => ["FAIT", "ATTENTE", "NON_VALIDE", "RETARD"].includes(effectiveTvaStatus(c, currentMonthKey()))).length, tone: "amber", onClick: () => setView("tva") },
          { label: "Échéances à venir", value: tasks.filter(t => ["aujourdhui", "demain", "semaine"].includes(t.bucket)).length, tone: "neutral", onClick: () => setView("mes-taches") },
          { label: "Tâches en retard", value: tasks.filter(t => t.bucket === "retard").length, tone: tasks.some(t => t.bucket === "retard") ? "red" : "green", onClick: () => setView("mes-taches") },
        ]}
      />
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" style={{ marginBottom: 24 }}>
        <KpiCard index={0} label="Dossiers actifs" value={myClients.filter(c => c.statutDossier !== "inactif").length} icon={Users} onClick={() => setView("clients")} linkLabel="Voir le portefeuille" />
        <KpiCard index={1} label="TVA à préparer" value={myClients.filter(c => ["FAIT", "ATTENTE", "NON_VALIDE", "RETARD"].includes(effectiveTvaStatus(c, currentMonthKey()))).length} icon={Receipt} tone="amber" onClick={() => setView("tva")} linkLabel="Voir la TVA" />
        <KpiCard index={2} label="Échéances à venir" value={tasks.filter(t => ["aujourdhui", "demain", "semaine"].includes(t.bucket)).length} icon={CalendarDays} onClick={() => setView("mes-taches")} linkLabel="Voir les échéances" />
        <KpiCard index={3} label="Tâches en retard" value={tasks.filter(t => t.bucket === "retard").length} icon={Clock3} tone={tasks.some(t => t.bucket === "retard") ? "red" : "green"} onClick={() => setView("mes-taches")} linkLabel="Voir les tâches" />
      </div>
      <Reveal index={1}><div className="novacab-focus" style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 16, border: `1px solid ${T.line}`, background: `linear-gradient(135deg, ${T.card}, ${T.navySoft})`, display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}><div><div style={{ fontWeight: 800, color: T.ink, fontSize: 13 }}>Votre cockpit du jour</div><div style={{ color: T.inkMuted, fontSize: 11, marginTop: 3 }}>Commencez par les urgences, puis poursuivez avec les échéances et le suivi de votre portefeuille.</div></div><button onClick={() => setView("mes-taches")} style={{ whiteSpace: "nowrap", border: "none", borderRadius: 9, padding: "8px 11px", background: T.navy, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Voir mes tâches</button></div></Reveal>
      <div style={{ marginBottom: 18 }}><BilanAnnualOverview clients={myClients} onViewBilans={() => setView("bilans")} /></div>
      <Reveal index={4}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
          <HorizontalBarDistribution title="Répartition par secteur" items={sectorItems} onItemClick={(item) => onDashboardFilter?.({ type: "secteur", value: item.key, label: `Secteur : ${item.label}` })} />
          <DonutDistribution title="Avancement TVA du mois" items={tvaItems.filter((item) => item.value > 0)} onItemClick={() => setView("tva")} />
        </div>
      </Reveal>

      <Reveal index={5}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
          <DonutDistribution
            title="Formes juridiques"
            items={legalItems}
            onItemClick={(item) =>
              onDashboardFilter?.({
                type: "formeJuridique",
                value: item.key,
                label: `Forme juridique : ${item.label}`,
              })
            }
          />
          <HorizontalBarDistribution
            title="Régimes TVA"
            items={tvaRegimeItems}
            onItemClick={(item) =>
              onDashboardFilter?.({
                type: "tvaRegime",
                value: item.key,
                label: `Régime TVA : ${item.label}`,
              })
            }
          />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginBottom: 18 }}>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 md:gap-[18px]">
        <Panel index={4} title="Tâches prioritaires" right={<Stamped tone="neutral" small>{sortedTasks.length}</Stamped>}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 13 }}>
            {["Toutes", "retard", "aujourdhui", "demain", "semaine", "mois", "trimestre"].map((b) => (
              <button key={b} onClick={() => setTaskFilter(b)} style={{
                padding: "3.5px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 600,
                border: `1px solid ${taskFilter === b ? T.navy : T.line}`, background: taskFilter === b ? T.navySoft : T.card,
                color: taskFilter === b ? T.navy : T.inkSoft, cursor: "pointer",
              }}>{b === "Toutes" ? "Toutes" : DEADLINE_BUCKET_LABELS[b] || b}</button>
            ))}
          </div>
          {sortedTasks.length === 0 ? <EmptyNote text="Rien à signaler sur cette période. Le registre est à jour." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sortedTasks.slice(0, 5).map((t, i) => {
                const Icon = taskCategoryIcon(t.category);
                const { color, bg } = taskToneStyle(t.bucket);
                return (
                  <Reveal key={t.id} index={i} delay={0.1}>
                    <div className="hoverRow clickable" onClick={() => onOpenClient(t.client.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: T.radiusSm, border: `1px solid ${T.line}`, background: T.paper }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
                        <Icon size={12} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 11.5, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.category} — {t.client.nom}</div>
                        <div style={{ fontSize: 10.5, color: T.inkMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                      </div>
                      <Stamped tone={t.tone} small>{(DEADLINE_BUCKET_LABELS[t.bucket] || t.bucket || "À venir")}</Stamped>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
          {sortedTasks.length > 5 && (
            <button onClick={() => setView("mes-taches")} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", color: T.navy, fontWeight: 600, fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}>
              Voir toutes les tâches <ArrowUpRight size={12} />
            </button>
          )}
        </Panel>

        <Panel index={5} title="Dossiers non rapprochés" right={<Stamped tone={nonRapprochesM1.length ? "amber" : "green"} small>{nonRapprochesM1.length}</Stamped>}>
          {nonRapprochesM1.length === 0 ? <EmptyNote text="Tous les dossiers sont rapprochés sur le mois précédent." /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: T.inkMuted, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <th style={{ padding: "0 6px 6px", fontWeight: 600, whiteSpace: "nowrap" }}>Dossier</th>
                    <th style={{ padding: "0 6px 6px", fontWeight: 600, whiteSpace: "nowrap" }}>Collab.</th>
                    <th style={{ padding: "0 6px 6px", fontWeight: 600, whiteSpace: "nowrap" }}>Période</th>
                    <th style={{ padding: "0 6px 6px", fontWeight: 600, whiteSpace: "nowrap" }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {nonRapprochesM1.slice(0, 6).map((c) => (
                    <tr key={c.id} className="hoverRow clickable" onClick={() => onOpenClient(c.id)} style={{ borderTop: `1px solid ${T.line}` }}>
                      <td style={{ padding: "6px 6px", fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{c.nom}</td>
                      <td style={{ padding: "6px 6px", color: T.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>{c.collab || "—"}</td>
                      <td style={{ padding: "6px 6px", color: T.inkSoft, whiteSpace: "nowrap" }}>{MOIS_FULL[prevKey] || prevKey}</td>
                      <td style={{ padding: "6px 6px", whiteSpace: "nowrap" }}><Stamped tone="amber" small>À rapprocher</Stamped></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {nonRapprochesM1.length > 6 && (
            <button onClick={() => setView("revision")} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", color: T.navy, fontWeight: 600, fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}>
              Voir les {nonRapprochesM1.length} dossiers <ArrowUpRight size={12} />
            </button>
          )}
        </Panel>
      </div>

      {(meRole === "chef_mission" || meRole === "admin") && superviseClients.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Panel index={8} title="Supervision d'équipe">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(byCollab).map(([collab, s]) => (
                <div key={collab} className="hoverRow clickable" onClick={() => onSuperviseClick && onSuperviseClick(collab)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: T.radiusSm, border: `1px solid ${T.line}`, background: T.paper }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: T.ink }}>{collab}</div>
                    <div style={{ fontSize: 11, color: T.inkMuted }}>{s.total} dossier{s.total > 1 ? "s" : ""} sous supervision</div>
                  </div>
                  {s.bilanRetard > 0 && <Stamped tone="red" small>{s.bilanRetard} bilan{s.bilanRetard > 1 ? "s" : ""} retard</Stamped>}
                  {s.tvaAlert > 0 && <Stamped tone="amber" small>{s.tvaAlert} TVA</Stamped>}
                  {s.bilanRetard === 0 && s.tvaAlert === 0 && <Stamped tone="green" small>À jour</Stamped>}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

export { Dashboard };
