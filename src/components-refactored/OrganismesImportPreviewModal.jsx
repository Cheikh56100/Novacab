import { X, Download } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Stamped } from "./Stamped.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;



function OrganismesImportPreviewModal({ preview, importing, onClose, onConfirm }) {
  if (!preview) return null;
  const instructionsOnly = preview.mode === "instructions";
  const valid = preview.valid || [];
  const invalid = (preview.rows || []).filter(r => r.errors?.length);
  const warnings = (preview.rows || []).filter(r => r.warnings?.length);
  return <div style={{position:"fixed",inset:0,zIndex:90,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div onClick={()=>!importing && onClose()} style={{position:"absolute",inset:0,background:"rgba(15,23,42,.42)"}}/>
    <div className="scrollbar" style={{position:"relative",width:"min(980px,94vw)",maxHeight:"90vh",overflowY:"auto",background:T.paper,borderRadius:16,boxShadow:T.shadowLg,padding:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}><div><h3 style={{margin:0,fontFamily:T.serif,fontSize:16,fontWeight:800,color:T.ink}}>{instructionsOnly ? "Format attendu — Accès organismes sociaux" : "Import des accès organismes — prévisualisation"}</h3><p style={{margin:"5px 0 0",fontSize:11.5,color:T.inkMuted}}>{instructionsOnly ? "Préparez le fichier avant de lancer l'import. Aucun fichier n'est envoyé depuis cet écran." : `Fichier : ${preview.fileName}. Aucun accès ne sera créé avant confirmation.`}</p></div><button className="topIconBtn" onClick={onClose} disabled={importing}><X size={16}/></button></div>
      <div style={{marginTop:12,padding:13,border:`1px solid ${T.line}`,borderRadius:12,background:T.card,fontSize:11.5,color:T.inkSoft,lineHeight:1.7}}>
        <b style={{color:T.ink}}>Colonnes attendues</b><br/>
        <span style={{color:T.green,fontWeight:700}}>Obligatoires :</span> <b>Organisme</b> + <b>Client/Dossier</b> ou <b>SIREN/SIRET</b>.<br/>
        <span style={{color:T.navy,fontWeight:700}}>Optionnelles :</span> Client, SIREN, SIRET, Libellé, Identifiant, Mot de passe, URL, Note.<br/>
        <span style={{color:T.inkMuted}}>Rapprochement : nom exact du dossier → SIREN → SIRET. Les lignes non reconnues restent bloquées jusqu'à correction.</span>
      </div>
      {instructionsOnly ? <div style={{marginTop:14}}>
        <div style={{fontWeight:800,color:T.ink,fontSize:12.5,marginBottom:8}}>Exemple d'une ligne</div>
        <div style={{overflowX:"auto",border:`1px solid ${T.line}`,borderRadius:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10.5}}><thead><tr>{["Client","SIREN","SIRET","Organisme","Libellé","Identifiant","Mot de passe","URL","Note"].map(h=><th key={h} style={{textAlign:"left",padding:"8px",background:T.navySoft,color:T.ink,borderBottom:`1px solid ${T.line}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody><tr>{["Nom société","799300223","98297797700015","URSSAF","Compte principal","2PYJ","","https://www.urssaf.fr",""] .map((v,i)=><td key={i} style={{padding:"8px",borderBottom:`1px solid ${T.line}`,color:T.inkSoft,whiteSpace:"nowrap"}}>{v || "—"}</td>)}</tr></tbody></table></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><Stamped tone="green" small>Prévisualisation avant import</Stamped><Stamped tone="blue" small>Les erreurs ne bloquent pas les lignes valides</Stamped><Stamped tone="amber" small>Une confirmation est obligatoire</Stamped></div>
        <div style={{marginTop:14,padding:12,border:`1px solid ${T.line}`,borderRadius:10,background:T.navySoft,fontSize:11,color:T.inkSoft,lineHeight:1.6}}><b>Conseil :</b> utilisez le bouton <b>« Télécharger le modèle Excel »</b> pour obtenir directement les deux feuilles <b>Accès organismes</b> et <b>Instructions</b>.</div>
      </div> : <>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><Stamped tone="green" small>{valid.length} ligne(s) prête(s)</Stamped><Stamped tone={invalid.length?"red":"green"} small>{invalid.length} erreur(s) bloquante(s)</Stamped><Stamped tone={warnings.length?"amber":"green"} small>{warnings.length} avertissement(s)</Stamped><span style={{fontSize:10.5,color:T.inkMuted,alignSelf:"center"}}>{preview.total || preview.rows?.length || 0} ligne(s) analysée(s)</span></div>
        {preview.missingHeaders?.length > 0 && <div style={{marginTop:10,padding:10,borderRadius:10,background:T.redSoft,color:T.red,fontSize:11,fontWeight:700}}>En-têtes à ajouter ou corriger : {preview.missingHeaders.join(" · ")}</div>}
        <div style={{marginTop:10,padding:10,borderRadius:10,background:T.card,border:`1px solid ${T.line}`,fontSize:10.5,color:T.inkMuted}}>En-têtes détectées : {preview.headers?.join(" · ") || "aucune"}</div>
        <div className="scrollbar" style={{marginTop:10,maxHeight:360,overflowY:"auto",border:`1px solid ${T.line}`,borderRadius:10,background:T.card}}>{(preview.rows || []).slice(0,80).map(r=><div key={r.line} style={{display:"grid",gridTemplateColumns:"44px 1.1fr 130px 1.8fr",gap:8,padding:"8px 9px",borderBottom:`1px solid ${T.line}`,fontSize:10.5,alignItems:"start"}}><span style={{color:T.inkMuted}}>L{r.line}</span><b>{r.client?.nom || "—"}</b><span>{r.organisme || "—"}</span><div style={{color:r.errors.length?T.red:r.warnings?.length?T.amber:T.green}}>{r.errors.length ? `❌ ${r.errors.join(" · ")}` : r.warnings?.length ? `⚠ ${r.warnings.join(" · ")}` : "✓ Ligne prête"}</div></div>)}</div>
        {(preview.rows || []).length > 80 && <div style={{fontSize:10.5,color:T.inkMuted,marginTop:7}}>Aperçu limité aux 80 premières lignes. Le compteur concerne tout le fichier.</div>}
      </>}
      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:16,flexWrap:"wrap"}}><button className="btn-secondary" onClick={downloadOrganismesTemplate} disabled={importing}><Download size={13}/> Télécharger le modèle Excel</button><div style={{display:"flex",gap:8}}><button className="btn-secondary" onClick={onClose} disabled={importing}>Fermer</button>{!instructionsOnly && <button className="btn-primary" onClick={onConfirm} disabled={importing || !valid.length || preview.missingHeaders?.length}>{importing?"Import en cours…":`Importer ${valid.length} ligne(s) valides`}</button>}</div></div>
    </div>
  </div>;
}

export { OrganismesImportPreviewModal };
