import { supabase } from "../supabaseClient";
import { resolveCabinetId } from "./cabinetState";

function toUiNotification(row) {
  return {
    ...row,
    // Compatibilité UI V2 : le stockage canonique utilise read_at.
    lu: Boolean(row.read_at),
    message: row.message || row.title || "Notification",
  };
}

async function currentAuthUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function fetchProductNotifications({ unreadOnly = false, limit = 100 } = {}) {
  const [cabinetId, user] = await Promise.all([resolveCabinetId(), currentAuthUser()]);
  if (!cabinetId || !user) return [];
  let q = supabase.from("notifications")
    .select("*")
    .eq("portefeuille_id", cabinetId)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (unreadOnly) q = q.is("read_at", null);
  const { data, error } = await q;
  if (error) {
    console.error("Notifications:", error.message);
    return [];
  }
  return (data || []).map(toUiNotification);
}

export async function insertProductNotification(input) {
  const cabinetId = input.portefeuille_id || await resolveCabinetId();
  if (!cabinetId) return null;
  const user = await currentAuthUser();
  let recipientUserId = input.user_id || null;
  const requestedByManager = input.allow_other_user === true;
  if (recipientUserId && user && recipientUserId !== user.id && !requestedByManager) {
    const { data: roleRow } = await supabase.rpc("current_team_role");
    if (!['admin','expert','chef_mission'].includes(roleRow)) recipientUserId = user.id;
  }

  // Les anciens appelants fournissent encore recipient_team_id = team.id.
  if (!recipientUserId && input.recipient_team_id) {
    const { data } = await supabase.from("team").select("auth_user_id,portefeuille_id").eq("id", input.recipient_team_id).maybeSingle();
    if (data?.portefeuille_id && String(data.portefeuille_id) !== String(cabinetId)) return null;
    recipientUserId = data?.auth_user_id || null;
  }

  const row = {
    portefeuille_id: cabinetId,
    user_id: recipientUserId,
    type: input.type || "info",
    title: input.title || input.type || "Notification",
    message: input.message || "",
    action: input.action || (input.client_id ? { client_id: String(input.client_id) } : {}),
    dedupe_key: input.dedupe_key || null,
  };
  const { data, error } = await supabase.from("notifications").insert(row).select().maybeSingle();
  if (error) {
    console.error("Erreur création notification :", error.message);
    return null;
  }
  return data ? toUiNotification(data) : null;
}

export async function markProductNotificationRead(id) {
  const cabinetId = await resolveCabinetId();
  const user = await currentAuthUser();
  if (!cabinetId || !user || !id) return null;
  const { data, error } = await supabase.from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("portefeuille_id", cabinetId)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();
  if (error) return null;
  return data ? toUiNotification(data) : null;
}

export function subscribeProductNotifications(onChange) {
  let channel;
  let cancelled = false;
  Promise.all([resolveCabinetId(), currentAuthUser()]).then(([cabinetId, user]) => {
    if (cancelled || !cabinetId || !user) return;
    channel = supabase.channel(`product-notifications:${cabinetId}:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `portefeuille_id=eq.${cabinetId}` }, onChange)
      .subscribe();
  });
  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
