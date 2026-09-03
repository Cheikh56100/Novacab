import { Loader2, Lock } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Shared } from "./shared.js";
const { T, supabase } = Shared;
const { useState } = React;



function NewPasswordPage({ onDone }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message || "Une erreur est survenue."); return; }
    onDone();
  };
  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: T.paper, fontFamily: T.sans, padding: 20 }}>
      <GlobalStyle />
      <div style={{ width: 380, maxWidth: "94vw", background: T.card, borderRadius: T.radiusLg, boxShadow: T.shadowLg, border: `1px solid ${T.line}`, padding: "32px 30px" }}>
        <div style={{ fontFamily: T.serif, fontWeight: 800, fontSize: 17, color: T.ink, marginBottom: 6 }}>Nouveau mot de passe</div>
        <p style={{ fontSize: 12.5, color: T.inkMuted, marginTop: 0, marginBottom: 20 }}>Choisissez un nouveau mot de passe pour votre compte.</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <Lock size={15} style={authIconStyle} />
            <input required type="password" minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={authInputStyle} />
          </div>
          {error && <div style={{ fontSize: 12.5, color: T.red, background: T.redSoft, padding: "10px 12px", borderRadius: 10 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ padding: "12px 0", borderRadius: 12, border: "none", background: T.navy, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading && <Loader2 size={15} className="spin" />} Valider
          </button>
        </form>
      </div>
    </div>
  );
}

export { NewPasswordPage };
