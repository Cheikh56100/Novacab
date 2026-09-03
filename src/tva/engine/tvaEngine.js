export const TVA_RATES = [20, 10, 5.5, 2.1];
export const OPERATION_TYPES = ['standard','autoliquidation_btp','acquisition_ue','service_ue','importation','exportation','exonere','hors_champ','non_recuperable','immobilisation','avoir','regularisation'];

export const norm = v => String(v ?? '').trim();
export const cleanHeader = v => norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
export const cleanText = v => norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const num = v => {
  if(v===null||v===undefined||v==='') return 0;
  if(typeof v==='number') return Number.isFinite(v)?v:0;
  const s=String(v).replace(/\s/g,'').replace(/€/g,'');
  const n=s.includes(',')&&s.includes('.')?(s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'')):s.replace(',','.');
  const x=Number(n); return Number.isFinite(x)?x:0;
};
export function normalizeRow(row,sourceFile='',meta={}){
  const get=(...keys)=>{for(const key of keys){if(row[key]!==undefined&&row[key]!==null&&row[key]!=='')return row[key];const t=cleanHeader(key);const k=Object.keys(row).find(x=>cleanHeader(x)===t);if(k&&row[k]!==undefined&&row[k]!==null&&row[k]!=='')return row[k];}return ''};
  const account=norm(get('Compte','Compte général','N° compte','N compte','Numéro de compte')).replace(/\s/g,'');
  const rawDate=get('Date','Date écriture','Date de l’écriture','Date de l\'écriture');
  const date=rawDate instanceof Date&&!Number.isNaN(rawDate.getTime())?`${String(rawDate.getDate()).padStart(2,'0')}/${String(rawDate.getMonth()+1).padStart(2,'0')}/${rawDate.getFullYear()}`:norm(rawDate);
  return {sourceFile,journal:norm(meta.journalCode||get('Journal','Code journal','Code du journal')),bankName:norm(meta.bankName||''),date,account,label:norm(get('Intitulé','Libellé écriture','Libellé','Libelle','Libellé compte','label')),piece:norm(get('Pièce','Pièce1','Pièce2','N° pièce','Numéro de pièce','piece')),debit:num(get('Débit','Dèbit','Debit','debit')),credit:num(get('Crédit','Credit','credit')),raw:row};
}
export function filterTvaRows(rows){const kept=[],ignored=[];for(const r of rows){if(/^401/.test(r.account)||/^411/.test(r.account))kept.push({...r,accountType:r.account.startsWith('401')?'401':'411'});else ignored.push(r)}return{kept,ignored};}
export function makeKey(r){return[r.journal,r.date,r.account,r.piece,r.debit,r.credit,r.label].join('|').toLowerCase()}
export function detectDuplicates(rows){const seen=new Map(),dups=[];rows.forEach((r,i)=>{const k=makeKey(r);if(seen.has(k))dups.push({...r,duplicateOf:seen.get(k),rowIndex:i});else seen.set(k,i)});return dups}
export function inferOperation(r,rule={}){
  const text=cleanText(`${r.label} ${r.account}`);
  const match=rule.operationType||'standard';
  let op=match;
  if(!rule.operationType){
    if(/sous.?trait|autoliquid/.test(text))op='autoliquidation_btp';
    else if(/intracom|acquisition (intracommunautaire|communautaire)|acquisition.*ue|fournisseur.*ue|achat.*ue/.test(text))op='acquisition_ue';
    else if(/prestation.*ue|service.*ue|prestations.*intracom|service.*intracom/.test(text))op='service_ue';
    else if(/import/.test(text))op='importation';
  }
  return op;
}
export function inferAmounts(r,rule){
  const gross=Math.abs(r.debit-r.credit);
  const rate=Number(rule?.default_tva_rate??rule?.rate??0);
  const mixed=Boolean(rule?.is_mixed??rule?.mixed);
  const operationType=inferOperation(r,rule);
  const nonTaxable=['exonere','hors_champ','non_recuperable'].includes(operationType);
  if(nonTaxable)return{ht:gross,tva:0,rate:null,needsArbitrage:false,mixed:false,operationType,tvaRecoverable:operationType!=='non_recuperable'};
  if(!rate||mixed)return{ht:gross,tva:0,rate:rate||null,needsArbitrage:true,mixed,operationType,tvaRecoverable:true};
  const ht=gross/(1+rate/100),tva=gross-ht;
  return{ht,tva,rate,needsArbitrage:false,mixed,operationType,tvaRecoverable:true};
}
export function normalizeMatchText(v){
  return cleanText(v)
    .replace(/[’']/g,'')
    .replace(/[^a-z0-9]+/g,'')
    .trim();
}

export function normalizeAccount(v){
  return norm(v).replace(/\s/g,'').replace(/\.0+$/,'').replace(/^0+(?=\d)/,'');
}

export function buildPreparation(rows,rules={},keywordRules=[]){
  const normalizedKeywords=(keywordRules||[])
    .filter(x=>x.enabled!==false && norm(x.keyword))
    .map(x=>({...x,_k:normalizeMatchText(x.keyword),_account:normalizeAccount(x.account_number)}))
    .filter(x=>x._k);

  const findKeyword=(r)=>{
    const text=normalizeMatchText(r.label);
    const account=normalizeAccount(r.account);
    return normalizedKeywords
      .filter(x=>!x._account || x._account===account)
      .filter(x=>{
        const keyword=x._k;
        if(!keyword) return false;
        switch(x.match_type){
          case 'exact':
            return text===keyword;
          case 'starts_with':
            return text===keyword || text.startsWith(keyword);
          case 'contains':
          case 'anywhere':
          case 'includes':
            return text.includes(keyword);
          case 'word':
          default:
            // "Mot entier" : punctuation, accents, slashes, hyphens and
            // repeated spaces are normalized before matching, so e.g.
            // "CARTE-BLEUE", "Carte bleue / VISA" and "carte bleue" all match.
            return text.includes(keyword);
        }
      })
      .sort((a,b)=>{
        const as=a._account?1:0, bs=b._account?1:0;
        const ap=Number(a.priority)||0, bp=Number(b.priority)||0;
        return (bs-as)||(bp-ap)||(b._k.length-a._k.length);
      })[0]||null;
  };

  return rows.map(r=>{
    const accountRule=rules[r.account]||rules[r.account?.replace(/^0+/,'')]||rules[normalizeAccount(r.account)];
    const kw=findKeyword(r);
    // A keyword rule is more specific than a generic account rule.
    // An account rule marked MIXED remains a safe fallback when no keyword matches.
    const dossierRule=rules.__DOSSIER_DEFAULT__||null;
    const rule=kw||accountRule||dossierRule||null;
    const a=inferAmounts(r,rule||{});
    const ruleSource=kw?'mot_cle':accountRule?'compte':dossierRule?'dossier':'arbitrage';
    return {...r,...a,tvaType:r.accountType==='411'?'collectee':'deductible',ruleSource,ruleLabel:kw?`Mot-clé ${kw.keyword}${kw.account_number?` · ${r.account}`:''}`:accountRule?`Compte ${r.account}${accountRule.is_mixed?' · Mixte':''}`:dossierRule?`Dossier · ${dossierRule.default_tva_rate} %`:'Aucune règle'};
  });
}

export function summarize(rows){const o={base_ht_20_enc:0,base_ht_10_enc:0,base_ht_55_enc:0,base_ht_21_enc:0,base_ht_20_dec:0,base_ht_10_dec:0,base_ht_55_dec:0,base_ht_21_dec:0,total_collected:0,total_deductible:0,autoliquidation_tva:0,autoliquidation_collectee:0,autoliquidation_deductible:0,immobilisations:0,non_recoverable:0,arbitrages:0};for(const r of rows){if(r.needsArbitrage)o.arbitrages++;const b=Number(r.ht)||0,t=Number(r.tva)||0;const suffix=r.tvaType==='collectee'?'enc':'dec';const k=r.rate===20?`base_ht_20_${suffix}`:r.rate===10?`base_ht_10_${suffix}`:r.rate===5.5?`base_ht_55_${suffix}`:r.rate===2.1?`base_ht_21_${suffix}`:null;if(k)o[k]+=b;if(r.tvaType==='collectee')o.total_collected+=t;else o.total_deductible+=t;if(r.operationType?.startsWith('autoliquidation')||r.operationType==='acquisition_ue'||r.operationType==='service_ue'||r.operationType==='importation'){o.autoliquidation_tva+=t;o[r.tvaType==='collectee'?'autoliquidation_collectee':'autoliquidation_deductible']+=t}if(r.operationType==='immobilisation')o.immobilisations+=t;if(r.operationType==='non_recuperable')o.non_recoverable+=t}o.net_tva=o.total_collected+o.autoliquidation_collectee-o.total_deductible-o.autoliquidation_deductible;return o;}
export function confidence(rows){if(!rows.length)return 0;const auto=rows.filter(r=>!r.needsArbitrage).length;return Math.round(auto/rows.length*100)}
