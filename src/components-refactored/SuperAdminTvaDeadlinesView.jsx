import React from "react";
import { Download, Upload, ShieldCheck, RefreshCw } from "lucide-react";
import * as Core from "./core.js";
import { Shared } from "./shared.js";
const { T, MOIS_ORDER, MOIS_FULL, QUARTER_END_MONTHS, effectiveTvaStatus, tvaStatusLabel, exportTvaDeadlinesToExcel, importTvaDeadlinesFromExcel } = { ...Core, ...Shared };

const STATUS_OPTIONS = [
  ["", "À préparer"], ["FAIT", "Fait"], ["OK", "Validé"], ["RETARD", "Retard"], ["CONTROLE", "Contrôlé"], ["NON_VALIDE", "Non validé"], ["NA", "N/A"],
];

function buildRows(clients, year) {
  const rows = [];
  clients.forEach((client) => {
    if (!client?.tvaRegime || client.tvaRegime === "FRANCHISE") return;
    if (client.tvaRegime === "CA12") {
      const periodKey = "Mai";
      const d = client.tvaDetails?.[periodKey] || {};
      const due = new Date(year, 4, Number(client.tvaExig) || 3);
      rows.push({ id: `${client.id}|${year}|CA12`, client, periodKey, period: `Exercice ${year - 1}`, due, detail: d, status: effectiveTvaStatus(client, periodKey) });
      return;
    }
    const months = client.tvaPeriodicite === "trimestrielle" ? QUARTER_END_MONTHS : MOIS_ORDER;
    months.forEach((declaredMonth) => {
      const idx = MOIS_ORDER.indexOf(declaredMonth);
      const due = new Date(year, idx + 1, Number(client.tvaExig) || 20);
      if (due.getFullYear() !== year) return;
      const d = client.tvaDetails?.[declaredMonth] || {};
      rows.push({ id: `${client.id}|${year}|${declaredMonth}`, client, periodKey: declaredMonth, period: MOIS_FULL[declaredMonth], due, detail: d, status: effectiveTvaStatus(client, declaredMonth) });
    });
  });
  return rows.sort((a,b) => a.due - b.due || String(a.client.nom).localeCompare(String(b.client.nom), "fr"));
}

function SuperAdminTvaDeadlinesView({ clients = [], onUpdate }) {
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const rows = React.useMemo(() => buildRows(clients, year), [clients, year]);

  const updateStatus = (row, value) => {
    onUpdate?.(row.client.id, { tvaMois: { ...(row.client.tvaMois || {}), [row.periodKey]: value } });
  };

  const exportExcel = async () => {
    setBusy(true); setMessage("");
    try { await exportTvaDeadlinesToExcel(clients, year); setMessage("Export Excel généré."); }
    catch (e) { setMessage(`Export impossible : ${e.message}`); }
    finally { setBusy(false); }
  };

  const importExcel = async (file) => {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const updates = await importTvaDeadlinesFromExcel(file);
      let count = 0;
      updates.forEach((u) => {
        const c = clients.find((x) => String(x.id) === String(u.clientId) || (u.siren && String(x.siren) === String(u.siren)) || String(x.nom || "").trim().toLowerCase() === String(u.client || "").trim().toLowerCase());
        if (!c || !u.periodKey) return;
        const patch = { tvaMois: { ...(c.tvaMois || {}), [u.periodKey]: u.status } };
        if (u.detail) patch.tvaDetails = { ...(c.tvaDetails || {}), [u.periodKey]: { ...(c.tvaDetails?.[u.periodKey] || {}), ...u.detail } };
        onUpdate?.(c.id, patch); count++;
      });
      setMessage(`${count} échéance(s) mise(s) à jour depuis Excel.`);
    } catch (e) { setMessage(`Import impossible : ${e.message}`); }
    finally { setBusy(false); }
  };

  const formatDate = (d) => d.toLocaleDateString("fr-FR");
  const money = (v) => v === "" || v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return <div>
    <div className="card" style={{ padding: 18, marginBottom: 14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:7, color:T.navy, fontSize:10.5, fontWeight:800, textTransform:"uppercase", letterSpacing:.7 }}><ShieldCheck size={15}/> Administration TVA</div>
          <h1 style={{ margin:"5px 0 4px", fontFamily:T.serif, fontSize:20, color:T.ink }}>Échéances TVA</h1>
          <div style={{ color:T.inkMuted, fontSize:11.5 }}>Vue de pilotage réservée au Super Admin. Modifiez les statuts ici ou préparez le fichier Excel puis réimportez-le.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          <select value={year} onChange={e=>setYear(Number(e.target.value))} style={{ padding:"8px 10px", borderRadius:9, border:`1px solid ${T.line}`, background:T.card, color:T.ink, fontWeight:700 }}>
            {[year-1, year, year+1].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={exportExcel} disabled={busy}><Download size={14}/> Exporter Excel</button>
          <label className="btn btn-primary" style={{ cursor:busy?"not-allowed":"pointer", opacity:busy?.65:1 }}><Upload size={14}/> Importer les statuts<input type="file" accept=".xlsx,.xls,.csv" hidden disabled={busy} onChange={e=>{ importExcel(e.target.files?.[0]); e.target.value=""; }}/></label>
        </div>
      </div>
      {message && <div style={{ marginTop:12, padding:"8px 10px", borderRadius:8, background:T.navySoft, color:T.navy, fontSize:11.5, fontWeight:700 }}>{message}</div>}
    </div>

    <div className="card" style={{ overflow:"hidden" }}>
      <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.line}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <b style={{ fontSize:12.5 }}>Échéances {year}</b>
        <span style={{ color:T.inkMuted, fontSize:11 }}>{rows.length} échéance{rows.length>1?"s":""}</span>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table className="table" style={{ minWidth:1000 }}>
          <thead><tr><th>Client</th><th>Régime</th><th>Période</th><th>Échéance</th><th>TVA collectée</th><th>TVA déductible</th><th>TVA sous-traitant</th><th>TVA à payer</th><th>Statut</th></tr></thead>
          <tbody>{rows.map(r=><tr key={r.id}>
            <td><b>{r.client.nom}</b><div style={{fontSize:10,color:T.inkMuted}}>{r.client.siren || "—"}</div></td>
            <td>{r.client.tvaRegime}{r.client.tvaPeriodicite === "trimestrielle" ? " · trim." : ""}</td>
            <td>{r.period}</td><td style={{fontFamily:T.mono}}>{formatDate(r.due)}</td>
            <td>{money(r.detail?.tvaCollectee)}</td><td>{money(r.detail?.tvaDeductible)}</td><td>{money(r.detail?.tvaSousTraitant)}</td><td><b>{money(r.detail?.montantAPayer)}</b></td>
            <td><select value={r.status || ""} onChange={e=>updateStatus(r,e.target.value)} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${T.line}`,background:T.card,color:T.ink,fontSize:11,fontWeight:700}}>{STATUS_OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td>
          </tr>)}</tbody>
        </table>
        {!rows.length && <div style={{padding:30,textAlign:"center",color:T.inkMuted,fontSize:12}}>Aucune échéance TVA à afficher pour {year}.</div>}
      </div>
    </div>
  </div>;
}

export { SuperAdminTvaDeadlinesView };
