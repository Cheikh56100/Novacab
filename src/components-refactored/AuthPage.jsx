import { Loader2, Mail, Lock, UserRound, Phone, Briefcase } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { ContractModal } from "./ContractModal.jsx";
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Shared } from "./shared.js";
const { T, S, supabase } = Shared;
const { useState } = React;
const EASE = [0.22, 1, 0.36, 1];



/* ============================================================
   AUTH PAGE — connexion / inscription (style Kabineo)
   ============================================================ */
function AuthPage() {
  const [mode, setMode] = useState("login"); // login | signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [cabinetNom, setCabinetNom] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      if (mode === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (err) throw err;
        setInfo("Un email vous a été envoyé avec un lien pour réinitialiser votre mot de passe.");
      } else if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName, telephone, cabinet_nom: cabinetNom, contract_version: "NOVACAB-2026-08", contract_accepted: false, requires_contract_after_validation: true } },
        });
        if (err) throw err;
        if (!data.session) {
          setInfo("Compte créé — vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.");
        }
      }
    } catch (err) {
      const msg = err?.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : (err?.message || "Une erreur est survenue.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(circle at 12% 8%, ${T.navySoft} 0%, ${T.paper} 42%), radial-gradient(circle at 90% 92%, #EEF2FF 0%, ${T.paper} 40%)`,
      fontFamily: T.sans, padding: 20,
    }}>
      <GlobalStyle />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        style={{ width: 420, maxWidth: "94vw", background: T.card, borderRadius: T.radiusLg, boxShadow: T.shadowLg, border: `1px solid ${T.line}`, padding: "38px 34px" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <img src="/novacab-mark.png" alt="NOVACAB" style={{ width: 76, height: 58, objectFit: "contain", marginBottom: 5 }} />
          <div style={{ fontFamily: T.serif, fontWeight: 800, fontSize: 22, letterSpacing: "0.03em", color: T.ink }}>NOVA<span style={{ color: "#1D9BF0" }}>CAB</span></div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.inkMuted, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 4, textAlign: "center" }}>TOUT VOTRE CABINET. UN SEUL PILOTE. ⭐</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
          style={{ display: "flex", background: T.paper, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
          {[["login", "Se connecter"], ["signup", "S'inscrire"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setMode(id); setError(""); setInfo(""); }} style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
              background: mode === id ? T.card : "transparent", color: mode === id ? T.navy : T.inkMuted,
              boxShadow: mode === id ? T.shadowSm : "none", transition: "all .18s ease",
            }}>{label}</button>
          ))}
        </motion.div>

        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {mode === "signup" && (
            <div>
              <label style={authLabelStyle}>Nom et prénom</label>
              <div style={{ position: "relative" }}>
                <UserRound size={15} style={authIconStyle} />
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ex. Louis Dupont" style={authInputStyle} />
              </div>
            </div>
          )}
          <div>
            <label style={authLabelStyle}>Adresse email</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={authIconStyle} />
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@cabinet.fr" style={authInputStyle} />
            </div>
          </div>
          {mode === "signup" && (
            <div>
              <label style={authLabelStyle}>Téléphone</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={authIconStyle} />
                <input required type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" style={authInputStyle} />
              </div>
            </div>
          )}
          {mode === "signup" && (
            <div>
              <label style={authLabelStyle}>Nom du cabinet</label>
              <div style={{ position: "relative" }}>
                <Briefcase size={15} style={authIconStyle} />
                <input required value={cabinetNom} onChange={(e) => setCabinetNom(e.target.value)} placeholder="ex. Cabinet Dupont & Associés" style={authInputStyle} />
              </div>
              <div style={{ fontSize: 10.5, color: T.inkMuted, marginTop: 5, lineHeight: 1.5 }}>
                Si votre cabinet dispose déjà d’un accès configuré, votre compte pourra être rattaché automatiquement.
                Sinon, cette information nous sert à vous recontacter pour activer votre accès.
                Après validation de votre accès par NOVACAB, le contrat vous sera présenté pour signature avant l'ouverture de votre espace.
              </div>
            </div>
          )}
         {mode !== "reset" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ ...authLabelStyle, marginBottom: 0 }}>Mot de passe</label>
                {mode === "login" && (
                  <button type="button" onClick={() => { setMode("reset"); setError(""); setInfo(""); }} style={{ ...authLinkStyle, fontSize: 11 }}>
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={authIconStyle} />
                <input required type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={authInputStyle} />
              </div>
            </div>
          )}

          {error && <div style={{ fontSize: 12.5, color: T.red, background: T.redSoft, padding: "10px 12px", borderRadius: 10 }}>{error}</div>}
          {info && <div style={{ fontSize: 12.5, color: T.green, background: T.greenSoft, padding: "10px 12px", borderRadius: 10 }}>{info}</div>}

          <button type="submit" disabled={loading} style={{
            marginTop: 4, padding: "13px 0", borderRadius: 12, border: "none", background: T.navy, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.75 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 10px 24px -8px rgba(79,70,229,0.5)",
          }}>
            {loading && <Loader2 size={15} className="spin" />}
            {mode === "login" ? "Se connecter" : mode === "reset" ? "Envoyer le lien" : "Créer mon compte"}
          </button>
        </motion.form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: T.inkMuted }}>
          {mode === "login" && (
            <>Pas encore de compte ? <button type="button" onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={authLinkStyle}>Inscrivez-vous</button></>
          )}
          {mode === "signup" && (
            <>Déjà un compte ? <button type="button" onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={authLinkStyle}>Connectez-vous</button></>
          )}
          {mode === "reset" && (
            <>Vous vous souvenez de votre mot de passe ? <button type="button" onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={authLinkStyle}>Connectez-vous</button></>
          )}
        </div>
      </motion.div>
      {showContract && <ContractModal onClose={() => setShowContract(false)} />}
      <style>{`.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export { AuthPage };
