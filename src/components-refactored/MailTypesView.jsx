import { Plus, Mail, ExternalLink, Copy } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, NOVACAB_MAIL_TEMPLATES } = Core;
import { Reveal } from "./Reveal.jsx";
import { Panel } from "./Panel.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { ToggleBtn } from "./ToggleBtn.jsx";
import { Shared } from "./shared.js";
import { fetchTvaDeclaration } from "../tva/services/tvaService";
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

const { useState, useEffect } = React;



function MailTypesView({ clients, initialClientId, me, cabinetName }) {
  const safeClients = clients || [];
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || safeClients[0]?.id || "");
  const [templateId, setTemplateId] = useState("tva-synthese");
  const [category, setCategory] = useState("Tous");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [tvaDeclaration, setTvaDeclaration] = useState(null);
  const signatureKey = `novacab-mail-signature-${me || "user"}`;
  const [signatureEnabled, setSignatureEnabled] = useState(() => { try { return localStorage.getItem(`${signatureKey}-enabled`) !== "false"; } catch { return true; } });
  const [signatureText, setSignatureText] = useState(() => { try { return localStorage.getItem(`${signatureKey}-text`) || `${me || "Nom Prénom"}\nCollaborateur comptable\n${cabinetName || "Axe Experts"}\nE-mail professionnel · Téléphone`; } catch { return `${me || "Nom Prénom"}\nCollaborateur comptable\n${cabinetName || "Axe Experts"}`; } });
  const [customTemplates, setCustomTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("novacab-mail-templates") || "[]"); } catch { return []; }
  });
  const selectedClient = safeClients.find((c) => c.id === selectedClientId) || safeClients[0] || null;
  const templates = [...NOVACAB_MAIL_TEMPLATES, ...customTemplates].map((t) => ({
    ...t,
    title: t.title || t.label || "Modèle sans titre",
    description: t.description || t.category || "Modèle de mail",
  }));
  const filtered = category === "Tous" ? templates : templates.filter((t) => t.category === category);

  useEffect(() => {
    if (initialClientId && safeClients.some((c) => c.id === initialClientId)) setSelectedClientId(initialClientId);
  }, [initialClientId, safeClients]);
  useEffect(() => {
    if (!selectedClientId && safeClients[0]) setSelectedClientId(safeClients[0].id);
  }, [safeClients, selectedClientId]);
  useEffect(() => {
    let cancelled = false;
    const loadDeclaration = async () => {
      setTvaDeclaration(null);
      if (!selectedClient?.id) return;
      try {
        const period = currentMonthKey();
        const result = await fetchTvaDeclaration(selectedClient.id, period);
        if (!cancelled) setTvaDeclaration(result?.data?.status === "validated" ? result.data : null);
      } catch {
        if (!cancelled) setTvaDeclaration(null);
      }
    };
    loadDeclaration();
    return () => { cancelled = true; };
  }, [selectedClientId]);

  useEffect(() => {
    const tpl = templates.find((t) => t.id === templateId) || NOVACAB_MAIL_TEMPLATES[0];
    const built = buildNovacabMail(tpl, selectedClient, cabinetName, tvaDeclaration);
    setSubject(built.subject); setBody(signatureEnabled && signatureText.trim() ? `${built.body.replace(/\n+$/, "")}\n\n${signatureText.trim()}` : built.body);
  }, [templateId, selectedClientId, cabinetName, signatureEnabled, signatureText, tvaDeclaration]);
  useEffect(() => { try { localStorage.setItem(`${signatureKey}-enabled`, String(signatureEnabled)); localStorage.setItem(`${signatureKey}-text`, signatureText); } catch {} }, [signatureEnabled, signatureText, signatureKey]);

  const persistCustom = (next) => { setCustomTemplates(next); try { localStorage.setItem("novacab-mail-templates", JSON.stringify(next)); } catch {} };
  const copyMail = async () => {
    try { await navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`); setNotice("Mail copié dans le presse-papiers."); }
    catch { setNotice("Copie impossible sur cet appareil."); }
    setTimeout(() => setNotice(""), 1800);
  };
  const openMail = () => {
    const to = selectedClient?.contact?.email || "";
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const createTemplate = () => {
    const id = `custom-${Date.now()}`;
    const tpl = { id, category: "Personnalisés", title: "Nouveau modèle", description: "Modèle personnalisé", subject: "Objet — {{client}}", body: "Bonjour {{contact}},\n\nVotre message ici…\n\nBien cordialement," };
    persistCustom([...customTemplates, tpl]); setTemplateId(id); setCategory("Tous");
  };
  const updateCustom = (field, value) => {
    if (!templateId.startsWith("custom-")) return;
    const next = customTemplates.map((t) => t.id === templateId ? { ...t, [field]: value } : t);
    persistCustom(next);
  };

  return (
    <div>
      <Reveal><h1 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 5px" }}>Mails types</h1></Reveal>
      <p style={{ color: T.inkMuted, fontSize: 11.5, margin: "0 0 18px", lineHeight: 1.55 }}>Générez rapidement des mails professionnels, adaptez-les au dossier puis copiez-les ou ouvrez directement votre messagerie.</p>
      <div className="novacab-mail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(240px, 0.9fr) minmax(420px, 1.5fr)", gap: 14, alignItems: "start" }}>
        <Panel title="Modèles">
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {["Tous", "Relances", "Budget", "TVA", "Autres", "Personnalisés"].map((c) => <button key={c} onClick={() => setCategory(c)} style={{ border: `1px solid ${category === c ? T.navy : T.line}`, background: category === c ? T.navySoft : T.card, color: category === c ? T.navy : T.inkMuted, borderRadius: 999, padding: "5px 8px", cursor: "pointer", fontSize: 10.5, fontWeight: 700 }}>{c}</button>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {filtered.map((t) => <button key={t.id} onClick={() => setTemplateId(t.id)} style={{ textAlign: "left", border: `1px solid ${templateId === t.id ? T.navy : T.line}`, background: templateId === t.id ? T.navySoft : T.card, borderRadius: 10, padding: "9px 10px", cursor: "pointer" }}><div style={{ fontSize: 11.5, fontWeight: 800, color: T.ink }}>{t.title}</div><div style={{ fontSize: 10, color: T.inkMuted, marginTop: 2 }}>{t.description}</div></button>)}
            {filtered.length === 0 && <EmptyNote text="Aucun modèle dans cette catégorie." />}
          </div>
          <button onClick={createTemplate} style={{ width: "100%", marginTop: 10, padding: "8px 10px", borderRadius: 9, border: `1px dashed ${T.navy}`, background: "transparent", color: T.navy, cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}><Plus size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Nouveau modèle personnalisé</button>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Panel title="Dossier destinataire">
            <div className="novacab-mail-recipient-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div style={{ fontSize: 10.5, color: T.inkMuted, marginBottom: 5 }}>Client</div><select value={selectedClient?.id || ""} onChange={(e) => setSelectedClientId(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{safeClients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
              <div><div style={{ fontSize: 10.5, color: T.inkMuted, marginBottom: 5 }}>E-mail</div><div style={{ ...inputStyle, width: "100%", color: selectedClient?.contact?.email ? T.ink : T.inkMuted }}>{selectedClient?.contact?.email || "E-mail non renseigné"}</div></div>
            </div>
          </Panel>
          <Panel title="Signature mail">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:8}}>
              <div><div style={{fontSize:11.5,fontWeight:800,color:T.ink}}>Insérer automatiquement ma signature</div><div style={{fontSize:10.5,color:T.inkMuted,marginTop:2}}>Elle sera ajoutée en bas des mails générés.</div></div>
              <ToggleBtn on={signatureEnabled} onClick={() => setSignatureEnabled(v => !v)} />
            </div>
            {signatureEnabled && <textarea value={signatureText} onChange={e=>setSignatureText(e.target.value)} rows={5} style={{...inputStyle,width:"100%",resize:"vertical",lineHeight:1.45}} placeholder="Votre signature professionnelle…" />}
          </Panel>
          <Panel title="Éditeur du mail">
            {templateId.startsWith("custom-") && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}><input value={templates.find(t => t.id === templateId)?.title || ""} onChange={(e) => updateCustom("title", e.target.value)} placeholder="Nom du modèle" style={inputStyle} /><input value={templates.find(t => t.id === templateId)?.description || ""} onChange={(e) => updateCustom("description", e.target.value)} placeholder="Description" style={inputStyle} /></div>}
            <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10.5, color: T.inkMuted, marginBottom: 5 }}>Objet</div><input value={subject} onChange={(e) => { setSubject(e.target.value); updateCustom("subject", e.target.value); }} style={{ ...inputStyle, width: "100%" }} /></div>
            <div><div style={{ fontSize: 10.5, color: T.inkMuted, marginBottom: 5 }}>Message</div><textarea value={body} onChange={(e) => { setBody(e.target.value); updateCustom("body", e.target.value); }} rows={16} style={{ ...inputStyle, width: "100%", resize: "vertical", lineHeight: 1.55, fontFamily: T.sans }} /></div>
            <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
              {notice && <span style={{ fontSize: 11, color: T.green, marginRight: "auto" }}>{notice}</span>}
              <button onClick={copyMail} style={{ padding: "8px 11px", borderRadius: 9, border: `1px solid ${T.line}`, background: T.card, color: T.inkSoft, cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}><Copy size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Copier</button>
              <button onClick={openMail} style={{ padding: "8px 12px", borderRadius: 9, border: "none", background: T.navy, color: "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 700 }}><ExternalLink size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Ouvrir dans la messagerie</button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export { MailTypesView };
