import React, {useEffect,useState} from "react";
import { supabase } from "./services/supabaseClient";
import { loadNfiState, saveCompany, deleteCompany, getCurrentNovacabUser } from "./services/nfiRepository";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Companies from "./components/Companies";
import Benchmark from "./components/Benchmark";
import SectorExplorer from "./components/SectorExplorer";
import Import from "./components/Import";
import "./styles.css";

export default function NfiEmbedded({ session, activeClient, onExit }) {
  const [page,setPage]=useState(activeClient ? "analysis" : "dashboard");
  const [novacabUser,setNovacabUser]=useState(null);
  const [companies,setCompanies]=useState([]);
  const [company,setCompany]=useState(null);
  const [year,setYear]=useState(null);
  const [pendingCompany,setPendingCompany]=useState(null);
  const [error,setError]=useState("");
  const [ready,setReady]=useState(false);

  const matchClient = (list) => {
    if (!activeClient) return list[0] || null;
    const id=String(activeClient.id||"");
    const siren=String(activeClient.siren||"").replace(/\D/g,"").slice(0,9);
    return list.find(c=>String(c.novacabClientId||c.id)===id || (siren && String(c.siren||"")===siren)) || list[0] || null;
  };

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try {
        const u=await getCurrentNovacabUser();
        const state=await loadNfiState();
        if (!alive) return;
        setNovacabUser(u);
        const list=state?.companies || [];
        setCompanies(list);
        const found=matchClient(list);
        setCompany(found);
        setYear(found ? Number(Object.keys(found.years||{}).sort().at(-1)) : null);
        setReady(true);
      } catch(e) { if(alive){setError(e?.message||"Impossible de charger les données NFI.");setReady(true);} }
    })();
    return()=>{alive=false};
  },[activeClient?.id,activeClient?.siren]);

  useEffect(()=>{ if(activeClient && companies.length){ const found=matchClient(companies); if(found){setCompany(found);setPage("analysis");setYear(Number(Object.keys(found.years||{}).sort().at(-1))||null);} } },[activeClient?.id,activeClient?.siren,companies.length]);

  const openCompany=c=>{setCompany(c);setYear(Number(Object.keys(c.years||{}).sort().at(-1))||null);setPage("analysis")};
  const addCompany=async c=>{try{const saved=await saveCompany(c,session?.user?.id);setCompanies(prev=>[...prev.filter(x=>x.id!==c.id&&x.siren!==c.siren),saved]);openCompany(saved)}catch(e){setError(e.message)}};
  const removeCompany=async c=>{if(!c)return;if(!window.confirm(`Retirer les données financières NFI de « ${c.name} » ? Le dossier NOVACAB sera conservé.`))return;try{await deleteCompany(c.id);setCompanies(prev=>prev.filter(x=>x.id!==c.id));setCompany(null);setPage("companies")}catch(e){setError(e.message)}};

  if(!ready) return <div className="nfiEmbeddedLoading"><div className="loadingMark">NFI</div><p>Chargement des dossiers NOVACAB…</p></div>;
  return <div className="nfiEmbeddedApp">
    <Sidebar page={page} setPage={setPage}/>
    <div className="main">
      {error && <div className="notice warningNotice topNotice">{error}</div>}
      <Topbar
        novacabUser={novacabUser}
        authUser={session?.user}
        page={page}
        companies={companies}
        onOpenCompany={openCompany}
        onSignOut={onExit}
        exitMode
      />
      {page==="dashboard" && <main className="content homePage"><header className="homeHero"><div><div className="eyebrow">NFI · FINANCIAL INTELLIGENCE</div><h1>L'analyse financière, simplement.</h1><p>Analysez les dossiers déjà présents dans NOVACAB avec les données financières NFI.</p></div></header><section className="homeCards"><article className="homeCard"><span className="homeCardNumber">01</span><h2>Analyser une société</h2><p>Ouvrez un dossier NOVACAB et consultez ses exercices financiers.</p><button onClick={()=>setPage("companies")}>Choisir une société →</button></article><article className="homeCard"><span className="homeCardNumber">02</span><h2>Explorer un secteur</h2><p>Comparez les dossiers selon leur code NAF et leur secteur.</p><button onClick={()=>setPage("sector")}>Explorer les secteurs →</button></article><article className="homeCard"><span className="homeCardNumber">03</span><h2>Comparer</h2><p>Comparez une société à son secteur ou plusieurs dossiers.</p><button onClick={()=>setPage("benchmark")}>Lancer une comparaison →</button></article></section></main>}
      {page==="companies" && <Companies companies={companies} setCompany={openCompany} onAdd={()=>{setPendingCompany(null);setPage("import")}} onImportCompany={c=>{setPendingCompany(c);setPage("import")}} onDeleteCompany={removeCompany}/>}
      {page==="analysis" && <Dashboard company={company||companies[0]} year={year} setYear={setYear} setPage={setPage}/>}
      {page==="sector" && <SectorExplorer companies={companies} onOpenCompany={openCompany}/>}
      {page==="benchmark" && <Benchmark company={company||companies[0]} allCompanies={companies} setCompany={openCompany}/>}
      {page==="import" && <Import companies={companies} onImported={addCompany} pendingCompany={pendingCompany} standalone={false}/>}
    </div>
  </div>;
}
