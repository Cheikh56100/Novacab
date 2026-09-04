import { ExternalLink, Landmark, BarChart3, ArrowUpRight } from "lucide-react";
import React from "react";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T, supabase } = Shared;

const OFX_BRIDGE_URL = "https://ofx-bridge.netlify.app/";
// Le second logiciel sera branché sans modifier l'interface :
// définir VITE_FINANCIAL_ANALYSIS_URL dans l'environnement Netlify/Vite.
const FINANCIAL_ANALYSIS_URL = import.meta.env.VITE_FINANCIAL_ANALYSIS_URL || "https://novacabfi.netlify.app/";

function AppCard({ icon: Icon, title, description, url, available = true, tone = "navy", onOpen }) {
  const open = () => {
    if (!url) return;
    if (onOpen) return onOpen();
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: 16, background: T.card, display: "flex", flexDirection: "column", gap: 12, minHeight: 180 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: tone === "navy" ? T.navySoft : T.paperDeep, color: tone === "navy" ? T.navy : T.inkSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={19} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{title}</div>
          <div style={{ fontSize: 10.5, color: T.inkMuted, marginTop: 2 }}>{available ? "Application externe" : "Lien à configurer"}</div>
        </div>
      </div>
      <div style={{ flex: 1, fontSize: 11.5, color: T.inkMuted, lineHeight: 1.55 }}>{description}</div>
      <button
        type="button"
        disabled={!available}
        onClick={open}
        style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, border: available ? "none" : `1px solid ${T.line}`, borderRadius: 9, padding: "8px 11px", background: available ? T.navy : T.paper, color: available ? "#fff" : T.inkMuted, cursor: available ? "pointer" : "not-allowed", fontSize: 11.5, fontWeight: 700 }}
      >
        {available ? <><ArrowUpRight size={14} /> Ouvrir l'application</> : <>URL à renseigner</>}
      </button>
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
      const { data, error } = await supabase.functions.invoke("nfi-sso-handoff", {
        body: { action: "create" },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (error) throw error;
      if (!data?.code) throw new Error("Impossible de préparer la connexion sécurisée.");
      const url = new URL(FINANCIAL_ANALYSIS_URL);
      if (activeClient?.id) url.searchParams.set("client", activeClient.id);
      if (activeClient?.siren) url.searchParams.set("siren", String(activeClient.siren).replace(/\D/g, "").slice(0,9));
      url.searchParams.set("nfi_handoff", data.code);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch (e) { setNfiError(e?.message || "Impossible d'ouvrir NFI."); }
    finally { setOpeningNfi(false); }
  };
  return (
    <div className="max-w-6xl mx-auto">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800, color: T.navy }}>Cabinet & outils</div>
        <h1 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 800, color: T.ink, margin: "4px 0 5px" }}>Applications</h1>
        <p style={{ fontSize: 11.5, color: T.inkMuted, margin: 0, lineHeight: 1.55 }}>
          Accédez directement aux applications spécialisées utilisées par le cabinet, sans mélanger leurs interfaces avec NOVACAB.
        </p>
      </div>

      <Panel title="Applications connectées">
        <div className="grid md:grid-cols-2 gap-4">
          <AppCard
            icon={Landmark}
            title="OFX Bridge — Banking conversion"
            description="Conversion et préparation des fichiers bancaires avant leur exploitation dans vos outils comptables."
            url={OFX_BRIDGE_URL}
          />
          <AppCard
            icon={BarChart3}
            title="Analyse financière"
            description="Logiciel dédié à l'analyse financière. NOVACAB sert de point d'accès et l'analyse détaillée est réalisée dans cette application spécialisée."
            url={FINANCIAL_ANALYSIS_URL}
            available={!!FINANCIAL_ANALYSIS_URL}
            tone="paper"
            onOpen={openNfi}
          />
        </div>
        {nfiError && <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: "#FFF7ED", color: "#9A3412", fontSize: 10.5 }}>{nfiError}</div>}
        {!FINANCIAL_ANALYSIS_URL && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: T.paper, color: T.inkMuted, fontSize: 10.5, lineHeight: 1.5 }}>
            Le module est déjà prêt. Il suffit de renseigner <b style={{ color: T.ink }}>VITE_FINANCIAL_ANALYSIS_URL</b> avec l'URL du logiciel d'analyse financière pour activer le bouton.
          </div>
        )}
      </Panel>

      <div style={{ marginTop: 12, fontSize: 10.5, color: T.inkMuted, display: "flex", alignItems: "center", gap: 6 }}>
        <ExternalLink size={13} /> Les applications s'ouvrent dans un nouvel onglet et restent indépendantes de NOVACAB.
      </div>
    </div>
  );
}

export { ApplicationsView };
