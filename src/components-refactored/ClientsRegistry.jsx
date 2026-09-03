import { Loader2, ClipboardCheck, ChevronRight, X, Plus, ChevronDown, ArrowUpRight, Settings2, ExternalLink, Eye, Download, Contact } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS } = Core;
import { ContactsImportPreviewModal } from "./ContactsImportPreviewModal.jsx";
import { Reveal } from "./Reveal.jsx";
import { Stamped } from "./Stamped.jsx";
import { FilterBar } from "./FilterBar.jsx";
import { EmptyNote } from "./EmptyNote.jsx";
import { Shared } from "./shared.js";
const { T, exportClientsToExcel, downloadClientsGeneralTemplate, exportClientContactsToExcel, exportChecklistsDaDpToExcel, parseClientsExcelFile, downloadContactsTemplate, parseContactsExcelFile } = Shared;
const { useState, useEffect, useMemo, useRef } = React;



/* ============================================================
   CLIENTS REGISTRY
   ============================================================ */
function ClientsRegistry({
  clients,
  allClients,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  regimeFilter,
  setRegimeFilter,
  me,
  isAdmin,
  collabQuickFilter,
  setCollabQuickFilter,
  dashboardFilter,
  setDashboardFilter,
  selected,
  setSelected,
  onAdd,
  onUpdate,
  onImport,
  onAddClient,
}) {
  const [statutFilter, setStatutFilter] = useState("actif");
  const baseFiltered = useMemo(() => filterClients(clients, search, roleFilter, me, regimeFilter, dashboardFilter ? "tous" : statutFilter), [clients, search, roleFilter, me, regimeFilter, statutFilter, dashboardFilter]);

  const dashboardFiltered = useMemo(() => {
    if (!dashboardFilter) return baseFiltered;
    const { type, value } = dashboardFilter;
    return baseFiltered.filter((c) => {
      switch (type) {
        case "secteur":
          return (c.secteur || classifyActivite(c.activite)) === value;
        case "formeJuridique":
          return inferLegalForm(c) === value;
        case "categorieFiscale":
          return inferCategorieFiscale(c) === value;
        case "statut":
          return (c.statutDossier || "actif") === value;
        case "tva": {
          if (!c.tvaRegime || c.tvaRegime === "FRANCHISE") return false;
          return effectiveTvaStatus(c, currentMonthKey()) === value;
        }
        case "tvaRegime":
          return (c.tvaRegime || "non_renseigne") === value;
        case "collaborateur":
          return value === "Non assigné" ? !c.collab : c.collab === value;
        case "missionIncomplete": {
          const m = missionCompletion(c);
          return !!m && m.pct < 100;
        }
        default:
          return true;
      }
    });
  }, [baseFiltered, dashboardFilter]);

  const filtered = useMemo(() => {
    if (dashboardFilter) return dashboardFiltered;
    if (!collabQuickFilter) return baseFiltered;
    return baseFiltered.filter((c) => c.chefMission === me && (collabQuickFilter === "Non assigné" ? !c.collab : c.collab === collabQuickFilter));
  }, [baseFiltered, dashboardFiltered, dashboardFilter, collabQuickFilter, me]);
  const grouped = useMemo(() => {
    const g = {};
    [...filtered].sort((a, b) => a.nom.localeCompare(b.nom)).forEach((c) => {
      const letter = c.nom[0].toUpperCase(); g[letter] = g[letter] || []; g[letter].push(c);
    });
    return g;
  }, [filtered]);
    const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [contactImporting, setContactImporting] = useState(false);
  const [contactImportPreview, setContactImportPreview] = useState(null);
  const [contactImportError, setContactImportError] = useState("");
  const contactFileInputRef = useRef(null);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef(null);
  useEffect(() => {
    if (!toolsMenuOpen) return;
    const onDocClick = (e) => { if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) setToolsMenuOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [toolsMenuOpen]);

    const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de réimporter le même fichier
    if (!file) return;
    setImportBusy(true);
    setImportMsg(null);
    try {
      const rows = await parseClientsExcelFile(file);
      if (!rows.length) {
        setImportMsg({ tone: "amber", text: "Aucune ligne exploitable trouvée dans le fichier." });
      } else {
        const { created, updated } = onImport(rows);
        setImportMsg({ tone: "green", text: `${created} dossier(s) créé(s), ${updated} mis à jour.` });
      }
    } catch (err) {
      setImportMsg({ tone: "red", text: "Échec de l'import : " + err.message });
        } finally {
      setImportBusy(false);
      setTimeout(() => setImportMsg(null), 5000);
    }
  };

  const handleContactsFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setContactImporting(true);
    setContactImportError("");
    try {
      const preview = await parseContactsExcelFile(file, allClients || clients);
      setContactImportPreview(preview);
    } catch (err) {
      setContactImportError(err?.message || "Impossible de lire le fichier Excel.");
    } finally {
      setContactImporting(false);
    }
  };
  const confirmContactsImport = () => {
    const valid = contactImportPreview?.valid || [];
    if (!valid.length || !onUpdate) return;
    setContactImporting(true);
    valid.forEach((r) => {
      onUpdate(r.client.id, {
        contact: {
          ...(r.client.contact || {}),
          ...(r.contactNom ? { contactNom: r.contactNom } : {}),
          ...(r.contactFonction ? { contactFonction: r.contactFonction } : {}),
          ...(r.telephone ? { telephone: r.telephone } : {}),
          ...(r.email ? { email: r.email } : {}),
        },
      });
    });
    setContactImporting(false);
    setContactImportPreview(null);
    setImportMsg({ tone: "green", text: `${valid.length} fiche(s) contact mise(s) à jour.` });
    setTimeout(() => setImportMsg(null), 5000);
  };

  let rowIndex = -1;
  return (
    <div>
      <Reveal>
        <div className="flex items-baseline justify-between mb-1.5 flex-wrap gap-2.5">
          <h1 className="text-base md:text-lg font-bold text-ink m-0">Registre clients</h1><div className="hidden md:flex items-center gap-2 text-[10px] text-inkmuted"><span className="px-2 py-1 rounded-full border border-line bg-card">{clients.filter(c=>c.statutDossier!=="inactif").length} actifs</span><span className="px-2 py-1 rounded-full border border-line bg-card">{clients.length} au total</span></div>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            <input ref={contactFileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleContactsFile} className="hidden" />
            <div className="relative" ref={toolsMenuRef}>
              <button
                type="button"
                onClick={() => setToolsMenuOpen((v) => !v)}
                disabled={importBusy || contactImporting}
                aria-expanded={toolsMenuOpen}
                aria-haspopup="menu"
                className="btn-secondary !py-2"
              >
                {(importBusy || contactImporting) ? <Loader2 size={14} className="spin" /> : <Settings2 size={14} />}
                <span>Outils</span>
                <ChevronDown size={13} className={`transition-transform ${toolsMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: .16 }}
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[260px] overflow-hidden rounded-2xl border border-line bg-card shadow-2xl p-2"
                >
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setToolsMenuOpen(false); fileInputRef.current?.click(); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><ArrowUpRight size={15} className="-rotate-90" /></span>
                    <span className="text-[11.5px] font-bold text-ink">Importer les informations générales</span>
                  </button>
                  <button role="menuitem" type="button" onClick={() => { setToolsMenuOpen(false); downloadClientsGeneralTemplate(); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer">
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><Download size={15} /></span>
                    <span className="text-[11.5px] font-bold text-ink">Télécharger le modèle — infos générales</span>
                  </button>
                  <button role="menuitem" type="button" onClick={() => { setToolsMenuOpen(false); exportClientsToExcel(filtered, "informations-generales-novacab.xlsx"); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer">
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><ArrowUpRight size={15} className="rotate-90" /></span>
                    <span className="text-[11.5px] font-bold text-ink">Exporter les informations générales</span>
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setToolsMenuOpen(false); contactFileInputRef.current?.click(); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><Contact size={15} /></span>
                    <span className="text-[11.5px] font-bold text-ink">Importer les fiches contact</span>
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setToolsMenuOpen(false); downloadContactsTemplate(); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><Download size={15} /></span>
                    <span className="text-[11.5px] font-bold text-ink">Modèle fiches contact</span>
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setToolsMenuOpen(false); exportClientContactsToExcel(filtered); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><Contact size={15} /></span>
                    <span className="text-[11.5px] font-bold text-ink">Exporter les fiches contact</span>
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setToolsMenuOpen(false); exportChecklistsDaDpToExcel(filtered); }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-app transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-lg border border-line bg-app flex items-center justify-center text-inkmuted shrink-0"><ClipboardCheck size={15} /></span>
                    <span className="text-[11.5px] font-bold text-ink">Exporter Checklist DA / DP</span>
                  </button>
                </motion.div>
              )}
            </div>
            <button onClick={onAdd} className="btn-primary !py-2">
              <Plus size={15} /> <span className="hidden sm:inline">Nouveau client</span>
            </button>
          </div>
        </div>
        {contactImportError && (
          <div style={{ whiteSpace: "pre-line" }} className="mt-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-block max-w-full bg-badge-red-bg text-badge-red-text">{contactImportError}</div>
        )}
        {collabQuickFilter && (
          <div className="flex items-center gap-2 mb-2">
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: T.navy, background: T.navySoft, padding: "4px 10px 4px 12px", borderRadius: 999 }}>
              Dossiers de {collabQuickFilter}
              <button onClick={() => setCollabQuickFilter && setCollabQuickFilter(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.navy, display: "flex", alignItems: "center", padding: 0 }}>
                <X size={13} />
              </button>
            </span>
          </div>
        )}
        {dashboardFilter && (
          <div className="flex items-center gap-2 mb-2">
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: T.navy, background: T.navySoft, padding: "4px 10px 4px 12px", borderRadius: 999 }}>
              Filtre dashboard : {dashboardFilter.label}
              <button onClick={() => setDashboardFilter && setDashboardFilter(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.navy, display: "flex", alignItems: "center", padding: 0 }}>
                <X size={13} />
              </button>
            </span>
          </div>
        )}
      </Reveal>
      {importMsg && (
          <div style={{ whiteSpace: "pre-line" }} className={`mt-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-block max-w-full ${importMsg.tone === "green" ? "bg-badge-green-bg text-badge-green-text" : importMsg.tone === "red" ? "bg-badge-red-bg text-badge-red-text" : "bg-badge-amber-bg text-badge-amber-text"}`}>{importMsg.text}</div>
        )}
      <p className="text-inkmuted text-xs mt-1.5 mb-5">Cliquez un dossier pour ouvrir sa fiche complète.</p>
      <FilterBar roleFilter={roleFilter} setRoleFilter={setRoleFilter} count={filtered.length} regimeFilter={regimeFilter} setRegimeFilter={setRegimeFilter}
        statutFilter={statutFilter} setStatutFilter={setStatutFilter} search={search} setSearch={setSearch} />

      {/* En-tête colonnes : visible à partir de md, masqué sur mobile (les dossiers s'affichent en cartes empilées) */}
      <div className="hidden md:grid gap-0" style={{ gridTemplateColumns: "1.8fr 0.9fr 1fr 0.9fr 0.7fr 0.8fr 1.2fr 92px", padding: "0 18px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: T.inkMuted, fontWeight: 600, marginBottom: 10 }}>
        <div>Dossier</div>
<div>SIREN</div>
<div>Rôles</div>
<div>Clôture</div>
<div>Régime</div>
<div>Logiciel</div>
<div>Statuts</div>
<div>Actions</div>
      </div>
      <div className="flex flex-col gap-2">
        {Object.keys(grouped).sort().map((letter) => (
          <div key={letter}>
            <div className="px-1.5 py-1 font-mono text-[10.5px] font-bold text-accent-deep tracking-widest">{letter}</div>
            <div className="flex flex-col gap-2">
              {grouped[letter].map((c) => {
                rowIndex += 1;
                const isInactif = c.statutDossier === "inactif";
                const isTransfert = c.statutDossier === "transfert";
                const alertBadge = isBilanLate(c) ? <Stamped tone="red" small>Bilan retard</Stamped>
                  : isTvaLate(c) ? <Stamped tone="amber" small>TVA</Stamped>
                  : null;
                const statutBadge = isInactif ? <Stamped tone="neutral" small>Inactif</Stamped>
                  : isTransfert ? <Stamped tone="amber" small>En transfert</Stamped>
                  : <Stamped tone="green" small>Actif</Stamped>;
                const roles = [c.collab === me && "Collaborateur", c.expert === me && "Expert", c.chefMission === me && "Chef de mission"].filter(Boolean);
                return (
                  <Reveal key={c.id} index={rowIndex}>
                    {/* Ligne tableau (md et +) */}
                    <div onClick={() => setSelected(c.id)}
                      className={`hoverRow clickable hidden md:grid items-center rounded-xl border px-4 py-3.5 text-xs ${selected === c.id ? "border-accent-deep bg-accent-soft" : "border-line bg-card shadow-xs"} ${isInactif ? "opacity-55" : ""}`}
                      style={{ gridTemplateColumns: "1.8fr 0.9fr 1fr 0.9fr 0.7fr 0.8fr 1.2fr 92px" }}>
                      <div className="font-semibold text-ink flex items-center gap-2">
                        {c.nom}
                      </div>
                      <div className="font-mono text-xs text-inkmuted">{c.siren}</div>
                      <div className="flex flex-col gap-0.5 text-[10.5px] text-inkmuted">
                        {roles.map((r) => <span key={r}>{r}</span>)}
                      </div>
                      <div className="font-mono text-[11.5px] text-inkmuted">
                        <input type="date" defaultValue={c.dateCloture || ""} onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdate(c.id, { dateCloture: e.target.value })}
                          className="border-none bg-transparent font-mono text-[11.5px] text-inkmuted w-[118px]" />
                      </div>
                      <div className="text-xs text-inksoft font-mono">{c.tvaRegime || "—"}</div>
                      <div className="text-xs text-inksoft font-mono">{c.logiciel || "—"}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {statutBadge}
                        {alertBadge}
                        {c.lienSharepoint && (
                          <a href={c.lienSharepoint} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            title="Ouvrir dans SharePoint" style={{ color: T.navy, display: "flex", alignItems: "center" }}>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                     <div
  className="flex items-center justify-end gap-1.5"
  onClick={(e) => e.stopPropagation()}
>
  <button
    title="Ouvrir"
    onClick={() => setSelected(c.id)}
    className="w-7 h-7 rounded-lg border border-line bg-card text-inkmuted hover:text-accent hover:border-accent inline-flex items-center justify-center"
  >
    <Eye size={13} />
  </button>

</div>
                    </div>
                    {/* Carte empilée (mobile) */}
                    <div onClick={() => setSelected(c.id)}
                      className={`hoverRow clickable md:hidden rounded-xl border p-3.5 flex flex-col gap-2 ${selected === c.id ? "border-accent-deep bg-accent-soft" : "border-line bg-card shadow-xs"} ${isInactif ? "opacity-55" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink text-sm">{c.nom}</span>
                        <ChevronRight size={15} className="text-inkmuted shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-inkmuted">
                        <span className="font-mono">{c.siren || "—"}</span>
                        {roles.length > 0 && <span>· {roles.join(", ")}</span>}
                        {c.tvaRegime && <span className="font-mono">· {c.tvaRegime}</span>}
                        {c.logiciel && <span className="font-mono">· {c.logiciel}</span>}
                        {c.lienSharepoint && (
                          <a href={c.lienSharepoint} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: T.navy, display: "flex", alignItems: "center" }}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">

  <div className="flex items-center gap-1.5 flex-wrap">
    {statutBadge}
    {alertBadge}
  </div>

</div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
                {filtered.length === 0 && <EmptyNote text="Aucun dossier ne correspond à cette recherche." />}
      </div>
      <ContactsImportPreviewModal preview={contactImportPreview} importing={contactImporting} onClose={() => setContactImportPreview(null)} onConfirm={confirmContactsImport} />
    </div>
  );
}

export { ClientsRegistry };
