import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function ArchiveSummary({data,empty}) { const entries=Object.entries(data||{}).filter(([,v])=>v!==undefined&&v!==null&&v!==''&&(!(typeof v==='object')||Object.keys(v).length)); if(!entries.length)return <EmptyNote text={empty}/>; return <div style={{display:'flex',flexDirection:'column',gap:7}}>{entries.slice(0,10).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'8px 10px',borderRadius:9,background:T.paper,border:`1px solid ${T.line}`,fontSize:11}}><span style={{fontWeight:700,color:T.ink}}>{String(k).replace(/_/g,' ')}</span><span style={{color:T.inkMuted,textAlign:'right'}}>{typeof v==='object' ? `${Object.keys(v).length} donnée(s)` : String(v)}</span></div>)}</div>}

export { ArchiveSummary };
