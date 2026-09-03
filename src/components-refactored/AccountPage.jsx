import { Loader2, Settings2, LogOut, Lock, UserRound, ShieldAlert, Bell, Moon, Laptop2, CircleHelp, Info } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { Reveal } from "./Reveal.jsx";
import { AdminSecurityAudit } from "./AdminSecurityAudit.jsx";
import { AccountProfileContent } from "./AccountProfileContent.jsx";
import { PasswordStrength } from "./PasswordStrength.jsx";
import { PreferenceSelect } from "./PreferenceSelect.jsx";
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T, supabase, logSecurityEvent, ROLE_LABELS } = Shared;
const { useState, useEffect } = React;



function AccountPage({ section, myRow, myPortefeuille, session, me, meRole, cabinetName, onUpdateMember, onLogout, onSectionChange }) {
  const [profile, setProfile] = useState(() => {
    const full = session?.user?.user_metadata?.full_name || me || "";
    const parts = String(full).trim().split(/\s+/);
    return { firstName: parts.shift() || "", lastName: parts.join(" ") || "", telephone: myRow?.telephone || "" };
  });
  const [notice, setNotice] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordNotice, setPasswordNotice] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("novacab-theme");
    return ["light", "dark", "system"].includes(saved) ? saved : "light";
  });
  const [density, setDensity] = useState(() => localStorage.getItem("novacab-density") || "normal");
  const [lang, setLang] = useState(() => localStorage.getItem("novacab-language") || "fr");
  const [notifPrefs, setNotifPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem("novacab-notif-prefs") || '{"email":true,"app":true,"tasks":true,"relances":true}'); } catch { return { email:true, app:true, tasks:true, relances:true }; } });
  useEffect(() => {
    const apply = (value) => document.documentElement.classList.toggle("dark", value === "dark");
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const onChange = (e) => apply(e.matches ? "dark" : "light");
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
    apply(theme);
  }, [theme]);

  const saveProfile = async () => {
    const firstName = profile.firstName.trim(); const lastName = profile.lastName.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName, first_name: firstName, last_name: lastName } });
    if (error) { setNotice(`Impossible d'enregistrer : ${error.message}`); return; }
    if (myRow?.id) onUpdateMember(myRow.id, { telephone: profile.telephone.trim() });
    setNotice("Vos informations personnelles ont été enregistrées.");
    setTimeout(() => setNotice(""), 2200);
  };
  const updatePassword = async (e) => {
    e.preventDefault(); setPasswordNotice("");
    if (passwords.next.length < 8) { setPasswordNotice("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (passwords.next !== passwords.confirm) { setPasswordNotice("Les deux nouveaux mots de passe ne correspondent pas."); return; }
    setSavingPassword(true);
    if (!passwords.current) { setSavingPassword(false); setPasswordNotice("Saisissez votre mot de passe actuel."); return; }
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: session?.user?.email || "", password: passwords.current });
    if (verifyError) { setSavingPassword(false); setPasswordNotice("Le mot de passe actuel est incorrect."); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setSavingPassword(false);
    if (error) { setPasswordNotice(error.message || "Impossible de mettre à jour le mot de passe."); return; }
    await logSecurityEvent({ action: "password_changed", severity: "info", actorName: me, actorEmail: session?.user?.email, targetType: "user", targetId: session?.user?.id });
    setPasswords({ current: "", next: "", confirm: "" }); setPasswordNotice("Mot de passe mis à jour avec succès.");
  };
  const savePref = (key, value) => {
    if (key === "theme") { setTheme(value); localStorage.setItem("novacab-theme", value); }
    if (key === "density") { setDensity(value); localStorage.setItem("novacab-density", value); }
    if (key === "lang") { setLang(value); localStorage.setItem("novacab-language", value); }
    if (key === "notif") { setNotifPrefs(value); localStorage.setItem("novacab-notif-prefs", JSON.stringify(value)); }
  };
  const initials = (me || "U").split(/\s+/).map((x) => x[0]).join("").slice(0,2).toUpperCase();
  const role = ROLE_LABELS[meRole] || meRole || "Utilisateur";
  const sections = [
    ["profile", "Mon profil", UserRound], ["security", "Sécurité", Lock], ...(meRole === "admin" ? [["audit", "Journal d’audit", ShieldAlert]] : []), ["preferences", "Préférences", Settings2], ["notifications", "Notifications", Bell], ["appearance", "Apparence", Moon], ["sessions", "Sessions actives", Laptop2], ["help", "Aide & support", CircleHelp], ["about", "À propos", Info],
  ];
  const renderContent = () => {
    if (section === "profile") return <AccountProfileContent profile={profile} setProfile={setProfile} myRow={myRow} myPortefeuille={myPortefeuille} role={role} notice={notice} onSave={saveProfile} />;
    if (section === "security") return <div className="space-y-3"><Panel title="Changer mon mot de passe"><form onSubmit={updatePassword} className="grid gap-3 max-w-xl"><input type="password" value={passwords.current} onChange={e=>setPasswords({...passwords,current:e.target.value})} placeholder="Mot de passe actuel" className="input-field" autoComplete="current-password"/><input required minLength={8} type="password" value={passwords.next} onChange={e=>setPasswords({...passwords,next:e.target.value})} placeholder="Nouveau mot de passe" className="input-field" autoComplete="new-password"/><input required minLength={8} type="password" value={passwords.confirm} onChange={e=>setPasswords({...passwords,confirm:e.target.value})} placeholder="Confirmation" className="input-field"/><PasswordStrength value={passwords.next}/>{passwordNotice && <div className={`text-xs rounded-lg p-2.5 ${passwordNotice.includes("succès") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{passwordNotice}</div>}<button className="btn-primary w-fit" disabled={savingPassword}>{savingPassword && <Loader2 size={14} className="spin"/>} Mettre à jour le mot de passe</button></form></Panel><Panel title="Authentification à deux facteurs"><div className="flex items-center justify-between gap-4"><div><div className="text-sm font-bold text-ink">Renforcer la sécurité du compte</div><div className="text-xs text-inkmuted mt-1">La 2FA peut être activée avec votre fournisseur d'identité lorsque la fonctionnalité est configurée.</div></div><Stamped tone="neutral" small>À configurer</Stamped></div></Panel><Panel title="Sessions actives"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-ink">Appareils connectés</div><div className="text-xs text-inkmuted mt-1">Gérez vos sessions et déconnectez les autres appareils.</div></div><button className="btn-secondary" onClick={()=>onSectionChange("sessions")}>Voir les sessions</button></div></Panel></div>;
    if (section === "audit") return <AdminSecurityAudit session={session} me={me} meRole={meRole} />;
    if (section === "preferences") return <Panel title="Préférences générales"><div className="grid md:grid-cols-2 gap-3"><PreferenceSelect label="Langue" value={lang} onChange={v=>savePref("lang",v)} options={[["fr","Français"],["en","English"]]}/><PreferenceSelect label="Thème" value={theme} onChange={v=>savePref("theme",v)} options={[["system","Système"],["light","Clair"],["dark","Sombre"]]}/><PreferenceSelect label="Densité d'affichage" value={density} onChange={v=>savePref("density",v)} options={[["compact","Compact"],["normal","Normal"],["confort","Confort"]]}/><PreferenceSelect label="Page d'accueil par défaut" value="dashboard" onChange={()=>{}} options={[["dashboard","Tableau de bord"]]}/></div></Panel>;
    if (section === "notifications") return <Panel title="Préférences de notifications"><div className="grid gap-1">{[["email","Recevoir les notifications par e-mail"],["app","Recevoir les notifications in-app"],["tasks","Notifications des tâches"],["relances","Notifications des relances"]].map(([k,l])=><label key={k} className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0 cursor-pointer"><span className="text-xs text-inksoft">{l}</span><input type="checkbox" checked={!!notifPrefs[k]} onChange={e=>savePref("notif",{...notifPrefs,[k]:e.target.checked})} className="accent-blue-600 w-4 h-4"/></label>)}</div></Panel>;
    if (section === "appearance") return <Panel title="Apparence"><div className="grid md:grid-cols-3 gap-3">{[["system","Système"],["light","Clair"],["dark","Sombre"]].map(([v,l])=><button key={v} onClick={()=>savePref("theme",v)} className={`rounded-xl border p-4 text-left ${theme===v?"border-accent bg-accent-soft":"border-line bg-card"}`}><div className="text-sm font-bold text-ink">{l}</div><div className="text-[10px] text-inkmuted mt-1">Utiliser le thème {l.toLowerCase()}.</div></button>)}</div></Panel>;
    if (section === "sessions") return <Panel title="Sessions actives"><div className="rounded-xl border border-line p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center"><Laptop2 size={17}/></div><div className="flex-1"><div className="text-xs font-bold text-ink">Session actuelle</div><div className="text-[10px] text-inkmuted mt-0.5">{session?.user?.email || "Compte connecté"} · navigateur actuel</div></div><Stamped tone="green" small>Active</Stamped></div><button className="btn-secondary mt-3" onClick={onLogout}><LogOut size={14}/> Se déconnecter</button></Panel>;
    if (section === "help") return <Panel title="Aide & support"><div className="text-sm font-bold text-ink">Centre d'aide NOVACAB</div><p className="text-xs text-inkmuted leading-relaxed">Pour toute question sur votre compte, vos accès ou votre cabinet, contactez l'administrateur de votre espace NOVACAB.</p></Panel>;
    return <Panel title="À propos"><div className="text-lg font-extrabold text-ink">NOVACAB</div><div className="text-xs text-inkmuted mt-1">TOUT VOTRE CABINET. UN SEUL PILOTE.</div><div className="text-xs text-inkmuted mt-4">Version 1.4.0</div></Panel>;
  };
  return <div className="max-w-6xl mx-auto"><Reveal><div className="flex flex-wrap items-start justify-between gap-4 mb-5"><div><div className="text-[10px] uppercase tracking-wider font-bold text-accent">Compte utilisateur</div><h1 className="text-xl font-extrabold text-ink mt-1">{section === "profile" ? "Mon profil" : sections.find(s=>s[0]===section)?.[1] || "Compte"}</h1><p className="text-xs text-inkmuted mt-1">Gérez votre compte NOVACAB · {cabinetName || "NOVACAB"}</p></div><div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2"><span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{background:T.navy}}>{initials}</span><div><div className="text-xs font-bold text-ink">{me}</div><div className="text-[10px] text-inkmuted">{role} · <strong>{cabinetName}</strong></div></div></div></div></Reveal><div className="grid lg:grid-cols-[220px_1fr] gap-4 items-start"><div className="card p-2">{sections.map(([id,label,Icon])=><button key={id} onClick={()=>onSectionChange(id)} className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${section===id?"bg-accent-soft text-accent":"text-inksoft hover:bg-app"}`}><Icon size={14}/>{label}</button>)}</div><div>{renderContent()}</div></div></div>;
}

export { AccountPage };
