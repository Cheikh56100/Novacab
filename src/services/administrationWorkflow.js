// NOVACAB — Centre de demandes Administration
import { supabase } from "../supabaseClient";

export const ADMIN_REQUEST_TYPES = Object.freeze({
  EXCEPTIONAL_MISSION: "mission_exceptionnelle",
  RESILIATION: "resiliation",
  MISSION_ENTRY: "entree_mission",
  MISSION_EXIT: "sortie_mission",
  MISSING_DOCUMENT: "document_manquant",
  ADMIN_BLOCKER: "blocage_administratif",
  LETTER_REQUEST: "demande_lettre",
  OTHER: "autre",
});

export const ADMIN_REQUEST_STATUS = Object.freeze({
  TODO: "a_traiter",
  IN_PROGRESS: "en_cours",
  WAITING: "en_attente",
  DONE: "termine",
});

export const ADMIN_REQUEST_LABELS = Object.freeze({
  mission_exceptionnelle: "Mission exceptionnelle",
  resiliation: "Résiliation",
  entree_mission: "Entrée de mission",
  sortie_mission: "Sortie de mission",
  document_manquant: "Document manquant",
  blocage_administratif: "Blocage administratif",
  demande_lettre: "Demande de lettre",
  autre: "Autre demande",
});

export const ADMIN_REQUEST_PRIORITIES = Object.freeze({ NORMAL: "normal", HIGH: "haute", URGENT: "urgente" });

export async function fetchAdministrationRequests({ portefeuilleId, management = false } = {}) {
  let query = supabase.from("administration_requests").select("*").order("created_at", { ascending: false });
  if (portefeuilleId) query = query.eq("portefeuille_id", portefeuilleId);
  if (management) query = query.limit(500);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAdministrationRequest(input = {}) {
  const payload = {
    portefeuille_id: input.portefeuilleId || input.portefeuille_id,
    client_id: input.clientId || input.client_id || null,
    type: input.type || ADMIN_REQUEST_TYPES.ADMIN_BLOCKER,
    title: input.title || ADMIN_REQUEST_LABELS[input.type] || "Demande administrative",
    description: input.description || "",
    priority: input.priority || ADMIN_REQUEST_PRIORITIES.NORMAL,
    status: input.status || ADMIN_REQUEST_STATUS.TODO,
    assigned_to: input.assignedTo || input.assigned_to || null,
    metadata: input.metadata || {},
    dedupe_key: input.dedupeKey || input.dedupe_key || null,
  };
  const { data, error } = await supabase.from("administration_requests").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateAdministrationRequest(id, patch = {}) {
  const payload = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.assignedTo !== undefined) payload.assigned_to = patch.assignedTo;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.metadata !== undefined) payload.metadata = patch.metadata;
  if (patch.status === ADMIN_REQUEST_STATUS.DONE) payload.completed_at = new Date().toISOString();
  const { data, error } = await supabase.from("administration_requests").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export function subscribeAdministrationRequests(portefeuilleId, onChange) {
  if (!portefeuilleId) return () => {};
  const channel = supabase.channel(`administration-requests-${portefeuilleId}-${Math.random().toString(36).slice(2, 7)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "administration_requests", filter: `portefeuille_id=eq.${portefeuilleId}` }, onChange)
    .subscribe();
  return () => { try { supabase.removeChannel(channel); } catch {} };
}

export function isOpenAdministrationRequest(item) {
  return item && item.status !== ADMIN_REQUEST_STATUS.DONE;
}

export function administrationRequestLabel(type) {
  return ADMIN_REQUEST_LABELS[type] || "Demande administrative";
}
