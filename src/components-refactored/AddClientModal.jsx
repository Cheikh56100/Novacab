import React from "react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T } = Shared;

const inputStyle = {
  fontFamily: T.sans,
  fontSize: 12,
  padding: "8px 10px",
  borderRadius: 9,
  border: `1px solid ${T.line}`,
  background: T.card,
  color: T.ink,
  outline: "none",
};

const { useState } = React;
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;



/* ============================================================
   ADD CLIENT MODAL
   ============================================================ */
function AddClientModal({ team, me, portefeuilleId, onClose, onCreate }) {
  const [nom, setNom] = useState("");
  const [siren, setSiren] = useState("");
  const [logiciel, setLogiciel] = useState("MYUNISOFT");
  const [dateCreation, setDateCreation] = useState("");
  const [typePremierExercice, setTypePremierExercice] = useState("court_31_12");
  const [dateCloture, setDateCloture] = useState(`${new Date().getFullYear()}-12-31`);
  const [collab, setCollab] = useState(me);
  const [expert, setExpert] = useState("");
  const [chefMission, setChefMission] = useState("");
  const teamNames = team.map((t) => t.nom);

  const submit = () => {
    if (!nom.trim() || !dateCreation || !dateCloture) return;
    onCreate({
      id: `c-${Date.now()}`, portefeuilleId, statutDossier: "actif", nom: nom.trim(), siren: siren.trim(), logiciel, dateCreation, typePremierExercice, dateCloture,
      collab, expert, chefMission, formeJuridique: "", capital: "", activite: "",
      tvaRegime: "", tvaExig: "", tvaMois: {}, regimeHistory: [], ageAgoHistory: {}, formeJuridiqueHistory: {},
      facturationElectronique: { mandatAutoriseCabinet: null, plateformeChoisiePar: "", plateforme: "", inscritAnnuaire: null, annuaireDetails: "", acces: { url: "", identifiant: "", motDePasse: "", notes: "" } },
      mission: { "KBIS": false, "Statuts": false, "CNI dirigeants": false, "CNI associés": false, "Notes entrée mission / Devizen": false, "Acceptation mission": false, "LM à jour": false, "LAB / Kanta / Devizen à jour": false, "Bouclage": false, "Fiche client": false },
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(28,37,65,0.4)" }} />
      <div className="scrollbar" style={{ position: "relative", background: T.paper, borderRadius: 14, padding: 26, width: 420, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <h3 style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 600, color: T.navy, margin: "0 0 16px" }}>Nouveau dossier</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <input autoFocus placeholder="Nom du client" value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} />
          <input placeholder="SIREN" value={siren} onChange={(e) => setSiren(e.target.value)} style={inputStyle} />
          <select value={logiciel} onChange={(e) => setLogiciel(e.target.value)} style={inputStyle}>
            <option value="MYUNISOFT">MYUNISOFT</option><option value="QUADRA">QUADRA</option>
          </select>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Date de création de la société <span style={{color:T.red}}>*</span></div>
            <input type="date" required value={dateCreation} onChange={(e) => { const v=e.target.value; setDateCreation(v); if(v && typePremierExercice === "court_31_12") setDateCloture(`${v.slice(0,4)}-12-31`); }} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Premier exercice comptable</div>
            <select value={typePremierExercice} onChange={(e) => { const v=e.target.value; setTypePremierExercice(v); if(v === "court_31_12" && dateCreation) setDateCloture(`${dateCreation.slice(0,4)}-12-31`); }} style={{ ...inputStyle, width: "100%" }}>
              <option value="court_31_12">Jusqu'au 31/12 de l'année de création</option>
              <option value="long_personnalise">Exercice long — choisir la date de clôture</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Date de clôture du premier exercice <span style={{color:T.red}}>*</span></div>
            <input type="date" required value={dateCloture} min={dateCreation || undefined} disabled={typePremierExercice === "court_31_12"} onChange={(e) => setDateCloture(e.target.value)} style={{ ...inputStyle, width: "100%", opacity: typePremierExercice === "court_31_12" ? .7 : 1 }} />
            <div style={{fontSize:10,color:T.inkMuted,marginTop:4}}>Cette date détermine l'exercice du premier bilan.</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Collaborateur</div>
            <select value={collab} onChange={(e) => setCollab(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">—</option>{teamNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Expert</div>
            <select value={expert} onChange={(e) => setExpert(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">—</option>{teamNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4 }}>Chef de mission</div>
            <select value={chefMission} onChange={(e) => setChefMission(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">—</option>{teamNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.line}`, background: "none", cursor: "pointer", fontSize: 12 }}>Annuler</button>
          <button onClick={submit} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: T.navy, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Créer le dossier</button>
        </div>
      </div>
    </div>
  );
}

export { AddClientModal };
