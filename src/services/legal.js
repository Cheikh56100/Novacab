import { supabase } from "../supabaseClient";
const TABLE="legal_requests";

export async function fetchLegalRequests({portefeuilleId}={}){
  let q=supabase.from(TABLE).select("*").order("created_at",{ascending:false});
  if(portefeuilleId) q=q.eq("portefeuille_id",portefeuilleId);
  const {data,error}=await q;
  if(error){ console.error("Erreur chargement demandes juridiques :", error.message); return []; }
  return data||[];
}

export async function createLegalRequest(r){
  const row={id:r.id||crypto.randomUUID(),...r,created_at:r.created_at||new Date().toISOString()};
  const {data,error}=await supabase.from(TABLE).insert(row).select().single();
  if(error){ console.error("Erreur création demande juridique :", error.message); return null; }
  return data;
}

export async function updateLegalRequest(id,patch){
  const {data,error}=await supabase.from(TABLE).update(patch).eq("id",id).select().single();
  if(error){ console.error("Erreur mise à jour demande juridique :", error.message); return null; }
  return data;
}

export async function deleteLegalRequest(id){
  const {error}=await supabase.from(TABLE).delete().eq("id",id);
  if(error){ console.error("Erreur suppression demande juridique :", error.message); return false; }
  return true;
}

export async function migrateLocalLegalRequests(){
  // Migration historique désactivée volontairement : les données métier
  // ne doivent plus être réintroduites depuis un stockage local après un
  // refus RLS ou une erreur réseau.
  return {migrated:0,remaining:0};
}
