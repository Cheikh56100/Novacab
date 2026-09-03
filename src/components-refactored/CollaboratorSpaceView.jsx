import { TrendingUp, Plus, Trash2, Briefcase, Clock3, CheckCircle2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, COLLAB_SECTIONS } = Core;
import { Reveal } from "./Reveal.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, ROLE_LABELS } = Shared;
const { useState, useEffect } = React;


function CollaboratorSpaceView({ me, meRole, cabinetName, profile, onSave }) {
  const [section, setSection] = useState("overview");
  const [draft, setDraft] = useState(profile || {});
  useEffect(() => setDraft(profile || {}), [profile]);
  const update = (patch) => { const next = { ...draft, ...patch }; setDraft(next); onSave(patch); };
  const list = (key) => Array.isArray(draft?.[key]) ? draft[key] : [];
  const addList = (key, value) => {
    const entry = { id: uid(), ...value };
    const labels = { formations: "Formation ajoutée", competences: "Compétence ajoutée", objectifs: "Objectif ajouté", realisations: "Réalisation ajoutée", entretiens: "Entretien ajouté", documents: "Document ajouté" };
    const detail = value.titre || value.nom || value.type || "Nouvelle entrée";
    const historyEntry = { id: uid(), titre: labels[key] || "Mise à jour du parcours", date: new Date().toISOString().slice(0, 10), detail };
    update({ [key]: [...list(key), entry], historique: [...list("historique"), historyEntry] });
  };
  const removeList = (key, id) => update({ [key]: list(key).filter((x) => x.id !== id) });
  const initials = (me || "U").split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  const stats = {
    formations: list("formations").filter((x) => x.statut === "terminee").length,
    heures: list("formations").reduce((n, x) => n + (Number(x.duree) || 0), 0),
    objectifs: list("objectifs").filter((x) => x.statut === "fait").length,
    competences: list("competences").filter((x) => ["autonome", "expert"].includes(x.niveau)).length,
  };
  const SectionButton = ({ id, label, Icon }) => <button type="button" onClick={() => setSection(id)} className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${section === id ? "bg-accent-soft text-accent" : "text-inksoft hover:bg-app"}`}><Icon size={14}/>{label}</button>;
  const Input = ({ value, onChange, placeholder, type="text" }) => <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field !py-2 text-xs w-full" />;
  const Select = ({ value, onChange, options }) => <select value={value || options[0]?.value || ""} onChange={(e) => onChange(e.target.value)} className="input-field !py-2 text-xs w-full">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  const ListEditor = ({ title, keyName, fields, addLabel }) => {
    const items = list(keyName);
    const [form, setForm] = useState({});
    const [formError, setFormError] = useState("");
    const add = () => {
      const missing = fields.find((f) => !f.optional && !String(form[f.key] || "").trim());
      if (missing) { setFormError(`Renseignez « ${missing.placeholder || missing.key} » avant d'ajouter.`); return; }
      setFormError(""); addList(keyName, form); setForm({});
    };
    return <div className="card p-4">
      <div className="flex items-center justify-between gap-3 mb-3"><div><h3 className="text-sm font-extrabold text-ink">{title}</h3><p className="text-[10.5px] text-inkmuted">{items.length} élément(s)</p></div></div>
      <div className="space-y-2.5 mb-4">{items.map((item) => <div key={item.id} className="rounded-xl border border-line bg-app p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0">{fields.map((f) => item[f.key] ? <div key={f.key} className={f.key === fields[0].key ? "text-xs font-bold text-ink" : "text-[10.5px] text-inkmuted mt-0.5"}>{f.prefix || ""}{item[f.key]}</div> : null)}</div><button type="button" onClick={() => removeList(keyName, item.id)} className="text-red-500 hover:text-red-700" title="Supprimer"><Trash2 size={14}/></button></div></div>)}</div>
      <div className="grid md:grid-cols-2 gap-2.5">{fields.map((f) => f.type === "select" ? <Select key={f.key} value={form[f.key]} onChange={(v) => setForm((x) => ({...x,[f.key]:v}))} options={f.options}/> : <Input key={f.key} value={form[f.key]} onChange={(v) => setForm((x) => ({...x,[f.key]:v}))} placeholder={f.placeholder} type={f.inputType || "text"}/>)}
      </div>
      {formError && <div className="text-[10.5px] text-red-600 mt-2">{formError}</div>}
      <div className="flex justify-end mt-2.5"><button type="button" onClick={add} className="btn-primary"><Plus size={13}/> {addLabel || "Ajouter"}</button></div>
    </div>;
  };
  const content = {
    overview: <div className="space-y-4"><div className="grid md:grid-cols-4 gap-3">{[["Formations terminées", stats.formations, Briefcase],["Heures de formation", `${stats.heures} h`, Clock3],["Objectifs atteints", stats.objectifs, CheckCircle2],["Compétences avancées", stats.competences, TrendingUp]].map(([label,value,Icon]) => <div key={label} className="card p-4"><Icon size={15} className="text-accent mb-2"/><div className="text-lg font-extrabold text-ink">{value}</div><div className="text-[10.5px] text-inkmuted">{label}</div></div>)}</div><div className="card p-4"><h3 className="text-sm font-extrabold text-ink mb-1">Mon parcours professionnel</h3><p className="text-xs text-inkmuted leading-relaxed">Centralisez vos formations, compétences, objectifs, réalisations et entretiens dans un seul espace. Les informations restent rattachées à votre compte et peuvent être consultées selon les droits du cabinet.</p></div></div>,
    formations: <ListEditor title="Formations" keyName="formations" addLabel="Ajouter la formation" fields={[{key:"titre",placeholder:"Intitulé de la formation"},{key:"organisme",placeholder:"Organisme"},{key:"date",placeholder:"Date",inputType:"date"},{key:"duree",placeholder:"Durée (heures)",inputType:"number"},{key:"statut",type:"select",options:[{value:"prevue",label:"Prévue"},{value:"en_cours",label:"En cours"},{value:"terminee",label:"Terminée"}]}]} />,
    competences: <ListEditor title="Compétences" keyName="competences" addLabel="Ajouter la compétence" fields={[{key:"nom",placeholder:"Ex. Révision comptable"},{key:"niveau",type:"select",options:[{value:"debutant",label:"Débutant"},{value:"intermediaire",label:"Intermédiaire"},{value:"autonome",label:"Autonome"},{value:"expert",label:"Expert"}]}]} />,
    objectifs: <ListEditor title="Objectifs" keyName="objectifs" addLabel="Ajouter l'objectif" fields={[{key:"titre",placeholder:"Objectif"},{key:"echeance",placeholder:"Échéance",inputType:"date"},{key:"statut",type:"select",options:[{value:"a_faire",label:"À faire"},{value:"en_cours",label:"En cours"},{value:"fait",label:"Fait"}]}]} />,
    realisations: <ListEditor title="Réalisations & contributions" keyName="realisations" addLabel="Ajouter la réalisation" fields={[{key:"titre",placeholder:"Réalisation"},{key:"date",placeholder:"Date",inputType:"date"},{key:"description",placeholder:"Description",optional:true}]} />,
    entretiens: <ListEditor title="Entretiens professionnels" keyName="entretiens" addLabel="Ajouter l'entretien" fields={[{key:"date",placeholder:"Date",inputType:"date"},{key:"type",type:"select",options:[{value:"annuel",label:"Entretien annuel"},{value:"professionnel",label:"Entretien professionnel"},{value:"intermediaire",label:"Point intermédiaire"}]},{key:"responsable",placeholder:"Responsable"},{key:"commentaire",placeholder:"Résumé / objectifs",optional:true}]} />,
    documents: <ListEditor title="Documents professionnels" keyName="documents" addLabel="Ajouter le document" fields={[{key:"nom",placeholder:"Nom du document"},{key:"type",placeholder:"Type (attestation, certificat…)"},{key:"date",placeholder:"Date",inputType:"date"},{key:"lien",placeholder:"Lien / référence",optional:true}]} />,
    historique: <div className="card p-4"><h3 className="text-sm font-extrabold text-ink mb-3">Historique du parcours</h3>{list("historique").length ? <div className="space-y-2">{list("historique").map((x) => <div key={x.id} className="rounded-lg border border-line bg-app p-3"><div className="text-xs font-bold text-ink">{x.titre}</div><div className="text-[10.5px] text-inkmuted mt-0.5">{x.date || ""} {x.detail ? `· ${x.detail}` : ""}</div></div>)}</div> : <EmptyNote text="Aucun événement de parcours enregistré pour le moment." />}</div>,
  }[section];
  return <div className="max-w-6xl mx-auto"><Reveal><div className="flex flex-wrap items-start justify-between gap-4 mb-5"><div><div className="text-[10px] uppercase tracking-wider font-bold text-accent">Espace personnel</div><h1 className="text-xl font-extrabold text-ink mt-1">Mon espace collaborateur</h1><p className="text-xs text-inkmuted mt-1">{me} · {ROLE_LABELS[meRole] || meRole} · {cabinetName}</p></div><div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2"><span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{background:T.navy}}>{initials}</span><div><div className="text-xs font-bold text-ink">{me}</div><div className="text-[10px] text-inkmuted">Parcours professionnel</div></div></div></div></Reveal><div className="grid lg:grid-cols-[220px_1fr] gap-4 items-start"><div className="card p-2">{COLLAB_SECTIONS.map(([id,label,Icon])=><SectionButton key={id} id={id} label={label} Icon={Icon}/>)}</div><div>{content}</div></div></div>;
}

export { CollaboratorSpaceView };
