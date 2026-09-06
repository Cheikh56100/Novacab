import { ExternalLink, Landmark, BarChart3, Car, Calculator, ArrowUpRight, FileSpreadsheet, CreditCard, ReceiptText } from "lucide-react";
import React from "react";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T, supabase } = Shared;

const OFX_BRIDGE_URL = "https://ofx-bridge.netlify.app/";
const FINANCIAL_ANALYSIS_URL = import.meta.env.VITE_FINANCIAL_ANALYSIS_URL || import.meta.env.VITE_INSIGHT_URL || "http://localhost:5176/";
const TAX_URL = import.meta.env.VITE_TAX_URL || "http://localhost:5174/";
const MOBILITE_URL = import.meta.env.VITE_MOBILITE_URL || "http://localhost:5175/";
const MYUNISOFT_URL = import.meta.env.VITE_MYUNISOFT_URL || "";
const QUADRA_URL = import.meta.env.VITE_QUADRA_URL || "";

function AppCard({ icon: Icon, title, description, url, available = true, onOpen, activeClient }) {
  const open = () => {
    if (!url) return;
    if (onOpen) return onOpen();
    const target = new URL(url, window.location.href);
    if (activeClient?.id) target.searchParams.set("client", activeClient.id);
    if (activeClient?.siren) target.searchParams.set("siren", String(activeClient.siren).replace(/\D/g, "").slice(0, 9));
    window.open(target.toString(), "_blank", "noopener,noreferrer");
  };
  return (
    <div className="rounded-xl border border-line bg-app p-3 flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-accent-soft text-accent-deep flex items-center justify-center"><Icon size={17} /></div>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-extrabold text-ink truncate">{title}</div>
        <div className="text-[9.5px] text-inkmuted mt-0.5 line-clamp-2 leading-relaxed">{description}</div>
      </div>
      <button type="button" disabled={!available} onClick={open} className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[9.5px] font-bold ${available ? "bg-ink text-white hover:bg-accent" : "border border-line text-inkmuted cursor-not-allowed"}`}>
        <ArrowUpRight size={13} /> {available ? "Ouvrir" : "À configurer"}
      </button>
    </div>
  );
}

function AppGroup({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-line bg-app/60 p-3">
      <div className="flex items-center gap-2 mb-2.5 text-[9px] uppercase tracking-[.1em] font-extrabold text-inkmuted"><Icon size={13} /> {title}</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function ApplicationsView({ session, activeClient }) {
  const [openingNfi, setOpeningNfi] = React.useState(false);
  const [nfiError, setNfiError] = React.useState("");
  const openNfi = async () => {
    if (!FINANCIAL_ANALYSIS_URL || openingNfi) return;
    setOpeningNfi(true); setNfiError("");
    try {
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Session NOVACAB introuvable.");
      const { data, error } = await supabase.functions.invoke("nfi-sso-handoff", { body: { action: "create" }, headers: { Authorization: `Bearer ${accessToken}` } });
      if (error) throw error;
      if (!data?.code) throw new Error("Impossible de préparer la connexion sécurisée.");
      const url = new URL(FINANCIAL_ANALYSIS_URL);
      if (activeClient?.id) url.searchParams.set("client", activeClient.id);
      if (activeClient?.siren) url.searchParams.set("siren", String(activeClient.siren).replace(/\D/g, "").slice(0, 9));
      url.searchParams.set("nfi_handoff", data.code);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch (e) { setNfiError(e?.message || "Impossible d'ouvrir NFI."); }
    finally { setOpeningNfi(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <div className="text-[9px] uppercase tracking-[.1em] font-extrabold text-accent-deep">Cabinet & outils</div>
        <div className="flex items-center justify-between gap-3 mt-1">
          <div><h1 className="text-lg font-extrabold text-ink m-0">Applications</h1><p className="text-[10.5px] text-inkmuted mt-1 m-0">Les logiciels du cabinet, classés par fonctionnalité. NOVACAB reste le point d'accès central.</p></div>
        </div>
      </div>

      <Panel title="Applications du cabinet">
        <div className="space-y-2.5">
          <AppGroup title="Comptabilité" icon={FileSpreadsheet}>
            <AppCard icon={FileSpreadsheet} title="MyUnisoft" description="Logiciel comptable principal du cabinet." url={MYUNISOFT_URL} available={!!MYUNISOFT_URL} activeClient={activeClient} />
            <AppCard icon={FileSpreadsheet} title="Quadra" description="Solution comptable utilisée pour les dossiers concernés." url={QUADRA_URL} available={!!QUADRA_URL} activeClient={activeClient} />
          </AppGroup>

          <AppGroup title="Banque & fichiers" icon={CreditCard}>
            <AppCard icon={Landmark} title="OFX Bridge" description="Conversion et préparation des fichiers bancaires." url={OFX_BRIDGE_URL} activeClient={activeClient} />
          </AppGroup>

          <AppGroup title="Analyse & pilotage" icon={BarChart3}>
            <AppCard icon={BarChart3} title="Import FEC / Balance & KPI" description="Contrôle FEC, balances, KPI financiers et analyse client." url={FINANCIAL_ANALYSIS_URL} available={!!FINANCIAL_ANALYSIS_URL} onOpen={openNfi} activeClient={activeClient} />
          </AppGroup>

          <AppGroup title="Fiscalité & mobilité" icon={Calculator}>
            <AppCard icon={Calculator} title="NOVACAB Tax" description="Simulations fiscales et arbitrages de rémunération." url={TAX_URL} available={!!TAX_URL} activeClient={activeClient} />
            <AppCard icon={Car} title="NOVACAB Mobilité" description="Indemnités kilométriques, trajets et remboursements." url={MOBILITE_URL} available={!!MOBILITE_URL} activeClient={activeClient} />
          </AppGroup>
        </div>
        {nfiError && <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 text-amber-800 text-[10px]">{nfiError}</div>}
        <div className="mt-3 flex items-center gap-1.5 text-[9.5px] text-inkmuted"><ExternalLink size={12} /> Les applications externes s'ouvrent dans un nouvel onglet avec le contexte du dossier sélectionné.</div>
      </Panel>
    </div>
  );
}

export { ApplicationsView };
