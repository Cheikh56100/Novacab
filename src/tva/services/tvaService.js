import { supabase } from "../../supabaseClient";
export async function saveTvaDeclaration(payload){ return supabase.from("tva_declarations").upsert(payload,{onConflict:"client_id,period"}).select().single(); }
export async function saveTvaTransactions(rows){ return rows.length ? supabase.from("tva_transactions").insert(rows) : {data:[],error:null}; }
export async function saveTvaRule(rule){ return supabase.from("tva_rules").upsert(rule,{onConflict:"client_id,account_number"}).select().single(); }
export async function fetchTvaRules(clientId){ const {data,error}=await supabase.from("tva_rules").select("*").eq("client_id",clientId); return {data:data||[],error}; }
export async function fetchTvaDeclaration(clientId, period){ return supabase.from("tva_declarations").select("*").eq("client_id",clientId).eq("period",period).maybeSingle(); }
export async function fetchPreviousValidatedTva(clientId, period){ return supabase.from("tva_declarations").select("*").eq("client_id",clientId).eq("status","validated").lt("period",period).order("period",{ascending:false}).limit(1).maybeSingle(); }
export async function fetchTvaKeywordRules(clientId){ const {data,error}=await supabase.from('tva_keyword_rules').select('*').eq('client_id',clientId).eq('enabled',true).order('priority',{ascending:false}); return {data:data||[],error}; }
export async function saveTvaKeywordRule(rule){
  // account_number is nullable, so a plain ON CONFLICT(client_id,keyword)
  // cannot safely support both global and account-specific rules. Resolve
  // the existing row explicitly, then update/insert it.
  let q=supabase.from('tva_keyword_rules').select('*').eq('client_id',rule.client_id).eq('keyword',rule.keyword);
  q = rule.account_number ? q.eq('account_number',rule.account_number) : q.is('account_number',null);
  const existing=await q.maybeSingle();
  if(existing.error) return existing;
  if(existing.data?.id){
    return supabase.from('tva_keyword_rules').update(rule).eq('id',existing.data.id).select().single();
  }
  return supabase.from('tva_keyword_rules').insert(rule).select().single();
}
export async function deleteTvaKeywordRule(id){ return supabase.from('tva_keyword_rules').delete().eq('id',id); }
export async function saveTvaSource(source){ return supabase.from('tva_sources').insert(source).select().single(); }
