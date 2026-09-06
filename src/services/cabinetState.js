import { supabase } from "../supabaseClient";

const CACHE_PREFIX = "novacab-product-state:";
const cacheKey = (moduleKey, cabinetId) => `${CACHE_PREFIX}${String(cabinetId)}:${moduleKey}`;

export async function resolveCabinetId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc("current_portefeuille_id");
  if (error) return null;
  return data || null;
}

export function loadCachedState(moduleKey, cabinetId, fallback) {
  if (!cabinetId) return fallback;
  try { return JSON.parse(localStorage.getItem(cacheKey(moduleKey, cabinetId)) || "null") ?? fallback; } catch { return fallback; }
}
export function cacheState(moduleKey, cabinetId, state) {
  if (!cabinetId) return;
  try { localStorage.setItem(cacheKey(moduleKey, cabinetId), JSON.stringify(state)); } catch {}
}

export async function loadCabinetState(moduleKey, fallback) {
  const cabinetId = await resolveCabinetId();
  if (!cabinetId) return { state: fallback, cabinetId: null, remote: false };
  const { data, error } = await supabase.from("cabinet_product_states").select("state,updated_at,version").eq("portefeuille_id", cabinetId).eq("module_key", moduleKey).maybeSingle();
  if (error || !data) return { state: loadCachedState(moduleKey, cabinetId, fallback), cabinetId, remote: false };
  cacheState(moduleKey, cabinetId, data.state);
  return { state: data.state, cabinetId, remote: true, version: data.version ?? null, updatedAt: data.updated_at };
}

export async function saveCabinetState(moduleKey, state, expectedVersion = null) {
  const cabinetId = await resolveCabinetId();
  if (!cabinetId) return { remote: false };
  cacheState(moduleKey, cabinetId, state);
  const { data, error } = await supabase.rpc("save_cabinet_product_state", {
    p_module_key: moduleKey,
    p_state: state,
    p_expected_version: expectedVersion,
  });
  const row = Array.isArray(data) ? data[0] : data;
  return { remote: !error, error, version: row?.version ?? null, updatedAt: row?.updated_at ?? null };
}

export function subscribeCabinetState(moduleKey, onState) {
  let channel = null;
  let cancelled = false;
  let ready = false;
  const topicFor = (cabinetId) => `cabinet-state:${cabinetId}:${moduleKey}`;

  resolveCabinetId().then((cabinetId) => {
    if (!cabinetId || cancelled) return;
    const topic = topicFor(cabinetId);
    // Supabase peut conserver un ancien channel pendant un re-render / HMR.
    // On le retire avant d'en créer un nouveau afin de ne jamais ajouter un
    // callback sur un channel déjà souscrit.
    const existing = supabase.getChannels?.().find((item) => item.topic === `realtime:${topic}` || item.topic === topic);
    if (existing) supabase.removeChannel(existing);
    if (cancelled) return;

    channel = supabase.channel(topic);
    channel.on("postgres_changes", {
      event: "*", schema: "public", table: "cabinet_product_states",
      filter: `portefeuille_id=eq.${cabinetId}`
    }, (payload) => {
      if (!cancelled && payload.new?.module_key === moduleKey && payload.new?.state) onState(payload.new.state);
    });
    if (cancelled) { supabase.removeChannel(channel); channel = null; return; }
    ready = true;
    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") ready = false;
    });
  });

  return () => {
    cancelled = true;
    if (channel && ready) supabase.removeChannel(channel);
    channel = null;
  };
}

export async function auditProductAction(moduleKey, action, { entityType=null, entityId=null, metadata={} }={}) {
  const cabinetId = await resolveCabinetId();
  if (!cabinetId) return;
  const { error } = await supabase.rpc("audit_product_event", { p_module_key: moduleKey, p_action: action, p_entity_type: entityType, p_entity_id: entityId == null ? null : String(entityId), p_metadata: metadata });
  if (error) await supabase.from("product_audit_log").insert({ portefeuille_id: cabinetId, module_key: moduleKey, action, entity_type: entityType, entity_id: entityId, metadata });
}

export async function scheduleFollowups(entityType, entityId, anchorDate, payload={}) {
  const cabinetId = await resolveCabinetId();
  if (!cabinetId || !anchorDate) return;
  await supabase.rpc("schedule_followups", { p_portefeuille_id: cabinetId, p_entity_type: entityType, p_entity_id: String(entityId), p_anchor_date: anchorDate, p_payload: payload });
}
