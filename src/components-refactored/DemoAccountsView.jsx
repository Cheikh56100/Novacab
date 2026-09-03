import { Loader2, X, Plus, Trash2, ShieldCheck, Eye, Copy, RotateCcw } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T } = Shared;
const { useState } = React;



/* ============================================================
   ÉQUIPE — rôles, portefeuilles (cabinets), demandes en attente.
   L'affectation d'un portefeuille / rôle est réservée aux comptes
   Expert, Chef de mission (sur leur propre portefeuille) et Admin
   (partout) — appliqué à la fois ici (UI) et côté base (RLS).
   ============================================================ */

function DemoAccountsView({ team, onCreate, onReset, onDisable, onDelete, showNotice }) {
  const [open, setOpen] = useState(false);
  const [cabinet, setCabinet] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expires, setExpires] = useState("30");
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const demos = team.filter((t) => t.is_demo);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await onCreate({ cabinetName: cabinet, email, password, expiresInDays: expires === "never" ? null : Number(expires) });
      setCredentials({ email: result.email, password: result.password, cabinetName: result.cabinetName, expiresAt: result.expiresAt });
      setCabinet(""); setEmail(""); setPassword(""); setOpen(false);
      showNotice?.("Compte démo créé avec ses 5 dossiers fictifs.", "success");
    } catch (err) {
      showNotice?.(err?.message || "Création du compte démo impossible.", "error");
    } finally { setBusy(false); }
  };

  const copy = async () => {
    if (!credentials) return;
    await navigator.clipboard?.writeText(`NOVACAB — Compte démo\nCabinet : ${credentials.cabinetName}\nEmail : ${credentials.email}\nMot de passe : ${credentials.password}`);
    showNotice?.("Identifiants copiés.", "success");
  };

  return (
    <div>
      <Reveal>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:18 }}>
          <div>
            <h1 style={{ fontFamily:T.serif, fontSize:24, fontWeight:800, color:T.ink, margin:"0 0 6px" }}>Comptes démo</h1>
            <p style={{ color:T.inkMuted, fontSize:12.5, margin:0 }}>Créez un accès isolé pour présenter NOVACAB à vos prospects.</p>
          </div>
          <button onClick={()=>setOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, border:"none", borderRadius:11, padding:"10px 14px", background:T.navy, color:"#fff", fontWeight:750, cursor:"pointer" }}>
            <Plus size={15}/> Créer un compte démo
          </button>
        </div>
      </Reveal>

      {credentials && (
        <Panel title="Compte créé — à transmettre au prospect">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:10 }}>
            {[["Cabinet",credentials.cabinetName],["Email",credentials.email],["Mot de passe",credentials.password]].map(([l,v])=>(
              <div key={l} style={{ background:T.paper, border:`1px solid ${T.line}`, borderRadius:12, padding:"11px 13px" }}>
                <div style={{ fontSize:10.5, color:T.inkMuted, marginBottom:4 }}>{l}</div>
                <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700 }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={copy} style={{ marginTop:12, display:"flex", alignItems:"center", gap:7, border:`1px solid ${T.line}`, background:T.card, borderRadius:10, padding:"9px 12px", cursor:"pointer", fontWeight:700, color:T.ink }}>
            <Copy size={14}/> Copier les identifiants
          </button>
        </Panel>
      )}

      <div style={{ height:14 }}/>
      <Panel title={`Accès démo actifs (${demos.length})`}>
        {demos.length === 0 ? (
          <div style={{ padding:"25px 10px", textAlign:"center", color:T.inkMuted, fontSize:12.5 }}>Aucun compte démo. Créez-en un pour votre prochain prospect.</div>
        ) : demos.map((d)=>(
          <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 2px", borderBottom:`1px solid ${T.line}` }}>
            <div style={{ width:36,height:36,borderRadius:11,display:"grid",placeItems:"center",background:T.navySoft,color:T.navy }}><Eye size={16}/></div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:750, fontSize:12.5 }}>{d.cabinet_nom || d.nom}</div>
              <div style={{ color:T.inkMuted, fontSize:10.5 }}>{d.email || "—"} · 5 dossiers de démonstration</div>
            </div>
            <span style={{ fontSize:10.5, fontWeight:700, padding:"5px 8px", borderRadius:999, background:d.statut==="actif"?T.greenSoft:T.redSoft, color:d.statut==="actif"?T.green:T.red }}>{d.statut==="actif"?"Actif":"Désactivé"}</span>
            <button title="Réinitialiser les 5 dossiers" onClick={async()=>{try{await onReset(d.id);showNotice?.("Démonstration réinitialisée.", "success")}catch(e){showNotice?.(e?.message||"Réinitialisation impossible.","error")}}} style={{ border:"none",background:"transparent",cursor:"pointer",color:T.inkMuted }}><RotateCcw size={15}/></button>
            <button title={d.statut==="actif"?"Désactiver":"Réactiver"} onClick={async()=>{try{await onDisable(d.id);showNotice?.("Statut du compte mis à jour.","success")}catch(e){showNotice?.(e?.message||"Action impossible.","error")}}} style={{ border:"none",background:"transparent",cursor:"pointer",color:T.inkMuted }}><ShieldCheck size={15}/></button>
            <button title="Supprimer" onClick={async()=>{if(!confirm(`Supprimer le compte démo ${d.email||d.nom} ?`))return;try{await onDelete(d.id);showNotice?.("Compte démo supprimé.","success")}catch(e){showNotice?.(e?.message||"Suppression impossible.","error")}}} style={{ border:"none",background:"transparent",cursor:"pointer",color:T.red }}><Trash2 size={15}/></button>
          </div>
        ))}
      </Panel>

      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(15,23,42,.42)", display:"grid", placeItems:"center", padding:20 }}>
          <div style={{ width:500, maxWidth:"96vw", background:T.card, borderRadius:18, boxShadow:T.shadowLg, border:`1px solid ${T.line}`, padding:24 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <div><div style={{fontFamily:T.serif,fontWeight:800,fontSize:17}}>Nouveau compte démo</div><div style={{fontSize:11.5,color:T.inkMuted,marginTop:3}}>Un environnement isolé avec 5 dossiers fictifs sera créé automatiquement.</div></div>
              <button onClick={()=>setOpen(false)} style={{border:"none",background:"transparent",cursor:"pointer",color:T.inkMuted}}><X size={18}/></button>
            </div>
            <form onSubmit={submit} style={{display:"grid",gap:13}}>
              <div><label style={authLabelStyle}>Nom du cabinet / prospect</label><input required value={cabinet} onChange={e=>setCabinet(e.target.value)} placeholder="Cabinet Dupont" style={authInputStyle}/></div>
              <div><label style={authLabelStyle}>Email de connexion</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prospect@cabinet.fr" style={authInputStyle}/></div>
              <div><label style={authLabelStyle}>Mot de passe temporaire</label><input required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Au moins 8 caractères" style={authInputStyle}/></div>
              <div><label style={authLabelStyle}>Durée d'accès</label><select value={expires} onChange={e=>setExpires(e.target.value)} style={authInputStyle}><option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option><option value="never">Sans expiration</option></select></div>
              <div style={{background:T.navySoft,borderRadius:11,padding:"10px 12px",fontSize:11.5,color:T.inkMuted}}>Les dossiers seront entièrement fictifs et séparés des portefeuilles réels. Le prospect se connectera depuis la page NOVACAB habituelle.</div>
              <button disabled={busy} type="submit" style={{border:"none",borderRadius:11,padding:"11px 14px",background:T.navy,color:"#fff",fontWeight:750,cursor:busy?"wait":"pointer",display:"flex",justifyContent:"center",gap:8}}>{busy&&<Loader2 size={15} className="spin"/>}Créer la démonstration</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { DemoAccountsView };
