import { supabase } from "../supabaseClient";

const logError = (action, error) => {
  if (error) console.error(`Erreur ${action} accès organisme social :`, error.message);
};

export async function loadOrganismesSociaux(portefeuilleId, clientId = null) {
  if (!portefeuilleId) return [];
  const { data, error } = await supabase.rpc("list_acces_organismes_sociaux", {
    p_portefeuille_id: portefeuilleId,
    p_client_id: clientId,
  });
  if (error) {
    logError("chargement", error);
    return [];
  }
  return data || [];
}

export async function insertOrganismeSocial(row) {
  const { data, error } = await supabase.rpc("create_acces_organisme_social", {
    p_portefeuille_id: row.portefeuille_id,
    p_client_id: row.client_id,
    p_organisme: row.organisme ?? "Autre",
    p_libelle: row.libelle ?? "",
    p_identifiant: row.identifiant ?? "",
    p_secret: row.secret ?? "",
    p_siret: row.siret ?? "",
    p_note: row.note ?? "",
    p_created_by: row.created_by ?? null,
  });
  if (error) {
    logError("création", error);
    return null;
  }
  return data?.[0] ?? data ?? null;
}

export async function updateOrganismeSocial(id, patch) {
  const { data, error } = await supabase.rpc("update_acces_organisme_social", {
    p_id: id,
    p_organisme: patch.organisme,
    p_libelle: patch.libelle,
    p_identifiant: patch.identifiant,
    p_secret: patch.secret,
    p_siret: patch.siret,
    p_note: patch.note,
    p_updated_by: patch.updated_by ?? null,
  });
  if (error) {
    logError("mise à jour", error);
    return null;
  }
  return data?.[0] ?? data ?? null;
}

export async function deleteOrganismeSocial(id) {
  const { data, error } = await supabase.rpc("delete_acces_organisme_social", { p_id: id });
  if (error) {
    logError("suppression", error);
    return false;
  }
  return data === true || data?.[0]?.deleted === true;
}
