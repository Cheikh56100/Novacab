import { Loader2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Reveal } from "./Reveal.jsx";
import { Shared } from "./shared.js";
const { T, S } = Shared;
const { useState } = React;



/* ============================================================
   SIGNATURE DU CONTRAT — présentée uniquement après validation NOVACAB.
   ============================================================ */
function ContractSignatureScreen({ row, onAccepted, onLogout }) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!accepted || busy) return;
    setBusy(true); setError("");
    try { await onAccepted(); } catch (e) { setError(e?.message || "Impossible d'enregistrer votre signature."); } finally { setBusy(false); }
  };
  return <div style={{ ...S.appShell, alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, background:`radial-gradient(circle at 20% 15%, ${T.navySoft} 0%, ${T.paper} 45%), radial-gradient(circle at 85% 85%, #F1F5F9 0%, ${T.paper} 40%)`, padding:20 }}>
    <GlobalStyle />
    <Reveal style={{ width:620, maxWidth:"96vw", padding:34, background:T.card, borderRadius:T.radiusLg, boxShadow:T.shadowLg, border:`1px solid ${T.line}` }}>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:T.navy,textTransform:"uppercase"}}>Étape finale</div>
      <h1 style={{fontFamily:T.serif,fontWeight:800,fontSize:24,margin:"6px 0 8px",color:T.ink}}>Votre accès est validé 🎉</h1>
      <p style={{color:T.inkMuted,fontSize:12.5,lineHeight:1.65}}>Bienvenue {row?.nom || ""}. Avant d'ouvrir votre espace NOVACAB, veuillez lire et accepter le contrat d'utilisation applicable à votre cabinet <strong style={{color:T.navy}}>{row?.cabinet_nom || ""}</strong>.</p>
      <div style={{margin:"18px 0",padding:18,border:`1px solid ${T.line}`,borderRadius:14,background:T.paper,fontSize:11.5,color:T.inkSoft,lineHeight:1.7,maxHeight:270,overflowY:"auto"}}>
        <div style={{fontWeight:800,color:T.ink,fontSize:14,marginBottom:8}}>Contrat d'utilisation NOVACAB — version NOVACAB-2026-08</div>
        <p><b>1. Objet.</b> NOVACAB fournit au cabinet un accès à la plateforme selon les fonctionnalités et conditions applicables.</p>
        <p><b>2. Accès et responsabilités.</b> Le cabinet garantit l'exactitude des informations fournies et la protection des accès de ses utilisateurs.</p>
        <p><b>3. Données.</b> Chaque cabinet reste responsable de ses données métier. NOVACAB organise l'accès technique selon les droits configurés.</p>
        <p><b>4. Durée et résiliation.</b> La relation peut prendre fin conformément aux conditions commerciales applicables. Le cabinet peut alors être désactivé ou archivé avant suppression définitive.</p>
        <p><b>5. Preuve.</b> Votre acceptation est horodatée et conservée dans le suivi contractuel NOVACAB.</p>
      </div>
      <label style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:12,color:T.inkSoft,cursor:"pointer",padding:"10px 0"}}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} style={{marginTop:2}}/><span>J'ai lu et j'accepte le contrat d'utilisation NOVACAB au nom du cabinet concerné.</span></label>
      {error && <div style={{fontSize:12,color:T.red,background:T.redSoft,padding:"10px 12px",borderRadius:10,marginTop:8}}>{error}</div>}
      <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:18}}><button onClick={onLogout} disabled={busy} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.line}`,background:"none",cursor:"pointer",color:T.inkMuted}}>Se déconnecter</button><button onClick={submit} disabled={!accepted||busy} style={{padding:"10px 18px",borderRadius:10,border:"none",background:accepted?T.navy:T.inkMuted,color:"#fff",fontWeight:800,cursor:accepted&&!busy?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:8}}>{busy&&<Loader2 size={15} className="spin"/>}{busy?"Enregistrement…":"Signer et accéder à NOVACAB"}</button></div>
    </Reveal>
  </div>;
}

export { ContractSignatureScreen };
