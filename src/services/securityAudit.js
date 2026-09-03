import { supabase } from "../supabaseClient";

export async function fetchSecurityAudit({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from("security_audit")
    .select("id, created_at, action, severity, actor_name, actor_email, target_type, target_id, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("Erreur chargement audit sécurité :", error.message); return []; }
  return data || [];
}

export async function logSecurityEvent({ action, severity = "info", actorName = null, actorEmail = null, targetType = null, targetId = null, metadata = {} }) {
  const { data, error } = await supabase.rpc("record_security_event", {
    p_action: action, p_severity: severity, p_actor_name: actorName, p_actor_email: actorEmail,
    p_target_type: targetType, p_target_id: targetId, p_metadata: metadata || {},
  });
  if (error) { console.warn("Journalisation sécurité indisponible :", error.message); return null; }
  return data;
}
