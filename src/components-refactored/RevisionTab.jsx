import { ArrowUpRight, Trash2 } from "lucide-react";
import React from "react";
import * as Core from "./core.js";
const { buildGoogleNewsRssUrl, buildProxyUrl, fetchRssFeed, fetchSecteurNews, loadSecteurContentFromSupabase, upsertSecteurContentRemote, getFormeJuridiqueItems, normalizeText, classifyNaf, classifyActivite, currentMonthKey, previousMonthKey, migrateClients, effectiveTvaStatus, tvaTone, tvaStatusLabel, computeFiscalEvents, computeEcheanceAlerts, taskBucket, loadClientsFromSupabase, insertClientRemote, updateClientRemote, deleteClientRemote, invokeDemoFunction, ensureCurrentUserTeamRemote, loadTeamFromSupabase, loadMyContractStatusRemote, acceptMyCabinetContractRemote, insertTeamMemberRemote, updateTeamMemberRemote, deleteTeamMemberRemote, loadPortefeuillesFromSupabase, insertPortefeuilleRemote, archivePortefeuilleRemote, deletePortefeuilleRemote, loadNotificationsFromSupabase, insertNotificationRemote, markNotificationReadRemote, loadOrganismesSociauxRemote, insertOrganismeSocialRemote, updateOrganismeSocialRemote, deleteOrganismeSocialRemote, loadCollaboratorProfileRemote, upsertCollaboratorProfileRemote, formatMailAmount, buildNovacabMail, isTvaLate, seuilEffectifAlert, missionCompletion, isBilanLate, computeCounts, filterByRole, filterClients, buildDistribution, inferLegalForm, inferCategorieFiscale, toneColors, uid, downloadOrganismesTemplate, odCycle, odTone, odLabel, bankCycle, bankTone, bankLabel, isBtpClient, cotisationTypesFor, planningBucket, icsEscape, icsDateTime, icsDateTimePlusMinutes, buildPlanningICS, exportPlanningToICS, MOIS_ORDER } = Core;
import { Stamped } from "./Stamped.jsx";
import { Panel } from "./Panel.jsx";
import { Shared } from "./shared.js";
const { T, supabase, fmtEUR } = Shared;



function RevisionTab({ client, onUpdate, onPersistUpdate, setView }) {
  const rev = client.revision || {};
  const patch = (f) => onUpdate(client.id, { revision: { ...rev, ...f } });
  const cycleMonth = (mois) => {
    const banqueMois = rev.banqueMois || {};
    patch({ banqueMois: { ...banqueMois, [mois]: bankCycle(banqueMois[mois]) } });
  };


  const importFinancialFile = async (file) => {
    if (!file) return;
    try {
      let rows = [];
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      if (isExcel) {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      } else {
        const text = await file.text();
        const firstLine = text.split(/\r?\n/).find(Boolean) || '';
        const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : firstLine.includes('|') ? '|' : ',';
        rows = text.split(/\r?\n/).filter(Boolean).map(line => line.split(delimiter));
      }

      // Conversion sûre des montants : évite de transformer une ligne complète ou une date en montant.
      const toAmount = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        let v = String(value).trim().replace(/\u00a0/g, '').replace(/\s/g, '');
        if (!v) return 0;
        if (v.includes(',') && v.includes('.')) {
          if (v.lastIndexOf(',') > v.lastIndexOf('.')) v = v.replace(/\./g, '').replace(',', '.');
          else v = v.replace(/,/g, '');
        } else if (v.includes(',')) v = v.replace(',', '.');
        const n = Number(v.replace(/[^0-9.+-]/g, ''));
        return Number.isFinite(n) ? n : 0;
      };

      // FEC standard : CompteNum = colonne 5, Débit = 12, Crédit = 13.
      const fecHeader = rows.find(r => String(r[0] || '').replace(/^\uFEFF/, '').trim().toLowerCase() === 'journalcode');
      const isFec = /fec/i.test(file.name) || !!fecHeader || rows.some(r => String(r[4] || '').match(/^\d{3,8}$/) && r.length >= 13);
      const accounts = new Map();
      const monthlyAccounts = new Map();
      const detectedDates = new Set();
      let parsedLines = 0;

      rows.forEach((r) => {
        let account = '', debit = 0, credit = 0, balance = null, entryMonth = '';
        if (isFec) {
          account = String(r[4] || '').trim();
          debit = toAmount(r[11]);
          credit = toAmount(r[12]);
          const rawDate = String(r[3] || '').trim();
          const dm = rawDate.match(/^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
          if (dm) { const iso=`${dm[1]}-${dm[2]}-${dm[3]}`; detectedDates.add(iso); entryMonth=iso.slice(0,7); }
        } else {
          const cells = r.map(v => String(v).trim());
          const idx = cells.findIndex(v => /^\d{3,8}$/.test(v.replace(/\s/g, '')));
          if (idx < 0) return;
          account = cells[idx].replace(/\s/g, '');
          const nums = cells.slice(idx + 1).map(toAmount);
          if (nums.length >= 2) { debit = nums[0] || 0; credit = nums[1] || 0; }
          else if (nums.length === 1) balance = nums[0];
        }
        if (!/^\d{3,8}$/.test(account)) return;
        parsedLines += 1;
        const current = accounts.get(account) || { debit: 0, credit: 0, balance: 0 };
        current.debit += debit;
        current.credit += credit;
        if (balance !== null) current.balance += balance;
        accounts.set(account, current);
        if (entryMonth) {
          const monthMap = monthlyAccounts.get(entryMonth) || new Map();
          const mv = monthMap.get(account) || { debit: 0, credit: 0, balance: 0 };
          mv.debit += debit; mv.credit += credit; if (balance !== null) mv.balance += balance;
          monthMap.set(account, mv); monthlyAccounts.set(entryMonth, monthMap);
        }
      });

      const amountForMap = (map, prefixes, mode = 'creditMinusDebit') => {
        let total = 0;
        map.forEach((v, account) => {
          if (!prefixes.some(prefix => account.startsWith(prefix))) return;
          const net = v.balance || (mode === 'debitMinusCredit' ? v.debit - v.credit : v.credit - v.debit);
          total += net;
        });
        return total;
      };
      const amountFor = (prefixes, mode = 'creditMinusDebit') => amountForMap(accounts, prefixes, mode);
      const buildMonthMetrics = (map) => {
        const mRevenue=amountForMap(map,['70','71','72']);
        const mPurchases=amountForMap(map,['60','61','62'],'debitMinusCredit');
        const mExternal=amountForMap(map,['63'],'debitMinusCredit');
        const mPayroll=amountForMap(map,['64'],'debitMinusCredit');
        const mEbe=mRevenue-mPurchases-mExternal-mPayroll;
        const mRex=mRevenue-amountForMap(map,['60','61','62','63','64','65','68'],'debitMinusCredit')+amountForMap(map,['75','78']);
        const mResult=mRevenue-amountForMap(map,['60','61','62','63','64','65','66','67','68','69'],'debitMinusCredit')+amountForMap(map,['75','76','77','78','79']);
        return {ca:mRevenue,ebe:mEbe,rex:mRex,resultat_net:mResult};
      };
      const amountForLegacy = (prefixes, mode = 'creditMinusDebit') => {
        let total = 0;
        accounts.forEach((v, account) => {
          if (!prefixes.some(prefix => account.startsWith(prefix))) return;
          const net = v.balance || (mode === 'debitMinusCredit' ? v.debit - v.credit : v.credit - v.debit);
          total += net;
        });
        return total;
      };

      const revenue = amountFor(['70','71','72']);
      const purchases = amountFor(['60','61','62'], 'debitMinusCredit');
      const external = amountFor(['63'], 'debitMinusCredit');
      const payroll = amountFor(['64'], 'debitMinusCredit');
      const taxes = amountFor(['63'], 'debitMinusCredit');
      const ebe = revenue - purchases - external - payroll;
      const rex = revenue - amountFor(['60','61','62','63','64','65','68'], 'debitMinusCredit') + amountFor(['75','78']);
      const resultAccount = amountFor(['120','129','12']);
      const resultat_net = Math.abs(resultAccount) > 0.01 ? resultAccount : revenue - amountFor(['60','61','62','63','64','65','66','67','68','69'], 'debitMinusCredit') + amountFor(['75','76','77','78','79']);
      const tresorerie_nette = amountFor(['512','53']) - amountFor(['519'], 'debitMinusCredit');
      const actifsCourtTerme = amountFor(['31','32','33','34','35','37','40','41','42','43','44','46','47','48'], 'debitMinusCredit');
      const passifsCourtTerme = amountFor(['40','41','42','43','44'], 'creditMinusDebit');
      const bfr = actifsCourtTerme - passifsCourtTerme;
      const liquidite_generale = passifsCourtTerme ? actifsCourtTerme / Math.abs(passifsCourtTerme) : 0;
      const yearMatch = file.name.match(/20\d{2}/g);
      const exercice = Number(yearMatch?.[yearMatch.length - 1] || (client.dateCloture ? String(client.dateCloture).slice(0,4) : new Date().getFullYear()));
      const sortedDates = [...detectedDates].sort();
      const monthsSet = new Set(sortedDates.map(d => d.slice(0,7)));
      const period_start = sortedDates[0] || null;
      const period_end = sortedDates[sortedDates.length - 1] || null;
      const months_covered = monthsSet.size;
      const is_partial_year = isFec && months_covered > 0 && months_covered < 12;
      const account_balances = Object.fromEntries([...accounts.entries()].map(([a,v])=>[a, Number(v.balance || (v.credit-v.debit) || 0)]));
      const monthly_metrics = Object.fromEntries([...monthlyAccounts.entries()].map(([month,map])=>[month, buildMonthMetrics(map)]));
      const kpis = {
        source: file.name,
        imported_at: new Date().toISOString(),
        lines: rows.length,
        parsed_lines: parsedLines,
        months_covered,
        period_start,
        period_end,
        is_partial_year,
        accounts_detected: accounts.size,
        ca: revenue,
        valeur_ajoutee: revenue - purchases - external,
        ebe,
        rex,
        resultat_net,
        bfr,
        tresorerie_nette,
        liquidite_generale,
        gearing: 0,
        roe: 0,
        account_balances,
        monthly_metrics
      };

      // Conservation dans la fiche client + enregistrement réel pour l'analyse financière.
      // Un seul import actif par client/exercice : un nouvel import remplace l'ancien
      // au lieu d'empiler des doublons qui réapparaissent après rechargement.
      const { error: previousImportError } = await supabase.from('financial_imports')
        .delete().eq('client_id', client.id).eq('exercice', exercice);
      if (previousImportError) {
        console.error('financial_imports replace error', previousImportError);
        alert(`Impossible de remplacer l'import existant : ${previousImportError.message}`);
        return;
      }
      patch({ financialImport: { ...kpis, exercice } });
      const payload = {
        client_id: client.id,
        portefeuille_id: client.portefeuilleId || client.portefeuille_id || null,
        exercice,
        source_type: isFec ? 'fec' : isExcel ? 'excel' : 'csv',
        file_name: file.name,
        kpis
      };
      const { error } = await supabase.from('financial_imports').insert(payload);
      if (error) {
        console.error('financial_imports insert error', error);
        alert(`Import lu mais non enregistré dans Analyse financière : ${error.message}`);
      } else {
        alert(`Import terminé : ${accounts.size} comptes détectés${months_covered ? ` · ${months_covered} mois détectés${period_end ? ` jusqu'au ${period_end}` : ''}` : ''}. L'exercice ${exercice} est maintenant disponible dans Analyse financière.`);
      }
    } catch (error) {
      console.error('Import financier', error);
      alert(`Impossible de lire ce fichier : ${error.message || 'format non reconnu'}`);
    }
  };
  const deleteCurrentFinancialImport = async () => {
    if (!fi) return;
    if (!window.confirm(`Supprimer le FEC / la balance « ${fi.source || 'sans nom'} » ?`)) return;
    const exercice = fi.exercice;
    let query = supabase.from('financial_imports').delete().eq('client_id', client.id);
    if (exercice) query = query.eq('exercice', exercice);
    const { error } = await query;
    if (error) { console.error('delete financial import', error); alert(`Impossible de supprimer l'import : ${error.message}`); return; }
    patch({ financialImport: null });
    if (onPersistUpdate) onPersistUpdate(client.id, { financialImport: null });
    alert('Import financier supprimé.');
  };
  const fi=rev.financialImport;
  return (
    <div>
      <Panel title="Import FEC / Balance & KPI"><p style={{fontSize:12,color:T.inkMuted,marginTop:0}}>Importez un FEC, CSV ou une balance Excel. Chaque import peut être supprimé puis remplacé.</p><input type="file" accept=".fec,.txt,.csv,.xlsx,.xls" onChange={e=>importFinancialFile(e.target.files?.[0])}/>{fi&&<><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,marginTop:12}}>{[['Source',fi.source],['Exercice',fi.exercice],['Lignes lues',fi.parsed_lines || fi.lines],['Comptes détectés',fi.accounts_detected || 0],['CA détecté',fmtEUR(fi.ca||0)],['EBE',fmtEUR(fi.ebe||0)],['Résultat net',fmtEUR(fi.resultat_net||0)],['Trésorerie',fmtEUR(fi.tresorerie_nette||0)]].map(([l,v])=><div key={l} style={{padding:10,border:`1px solid ${T.line}`,borderRadius:10,minWidth:0}}><div style={{fontSize:9,color:T.inkMuted,textTransform:'uppercase'}}>{l}</div><b style={{fontSize:12,wordBreak:'break-word'}}>{v}</b></div>)}</div><button onClick={deleteCurrentFinancialImport} style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:6,border:`1px solid #fecaca`,background:'#fff5f5',color:'#b91c1c',borderRadius:8,padding:'7px 11px',cursor:'pointer',fontSize:12}}><Trash2 size={14}/> Supprimer ce FEC / cette balance</button></>}</Panel>
      <div style={{ height: 14 }} />
      <Panel title="Rapprochements bancaires">
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {MOIS_ORDER.map((m) => (
            <button key={m} className="clickable" onClick={() => cycleMonth(m)} style={{ background: "none", border: `1px solid ${T.line}`, borderRadius: 8, padding: "6px 4px", minWidth: 50, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.inkMuted, marginBottom: 3 }}>{m}</div>
              <Stamped tone={bankTone(rev.banqueMois?.[m])} small>{bankLabel(rev.banqueMois?.[m])}</Stamped>
            </button>
          ))}
        </div>
      </Panel>

      <div style={{ height: 14 }} />

      <Panel title="OD de salaires">
        <p style={{ fontSize: 12, color: T.inkMuted, margin: "0 0 10px" }}>Le suivi mois par mois se fait depuis Social &amp; paie.</p>
        <button onClick={() => setView && setView("social")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.line}`, borderRadius: 9, padding: "7px 12px", fontSize: 12, color: T.navy, cursor: "pointer" }}>
          <ArrowUpRight size={13} /> Ouvrir le Suivi social (OD salaires)
        </button>
      </Panel>

      <div style={{ height: 14 }} />

      <Panel title="Révision des comptes de cotisations">
        <p style={{ fontSize: 12, color: T.inkMuted, margin: "0 0 10px" }}>
          La révision mensuelle (URSSAF, retraite, prévoyance{isBtpClient(client) ? ", PRO BTP, CIBTP" : ""}) se fait désormais depuis Social &amp; paie, sous forme de grille mensuelle.
        </p>
        <button onClick={() => setView && setView("cotisations")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${T.line}`, borderRadius: 9, padding: "7px 12px", fontSize: 12, color: T.navy, cursor: "pointer" }}>
          <ArrowUpRight size={13} /> Ouvrir les Cotisations sociales
        </button>
      </Panel>


    </div>
  );
}

export { RevisionTab };
