/* NOVACAB — moteur léger d'événements métier.
 * Aucun nouvel écran : un changement important déclenche seulement les
 * conséquences utiles (notification, tâche, journal). Les vues existantes
 * restent la surface de pilotage.
 */
import { supabase } from "../supabaseClient";
import { createTask } from "./tasks";
import { insertProductNotification } from "./notifications";
import { logActivity } from "./activity";

const iso = () => new Date().toISOString();
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function transitionEvents(previous = {}, next = {}) {
  const events = [];
  if (!previous.mission_exceptionnelle && next.mission_exceptionnelle) {
    events.push({
      type: "mission_exceptionnelle",
      title: "Mission exceptionnelle à préparer",
      task: "Préparer la lettre de mission exceptionnelle",
      dueInDays: 5,
      message: "Une mission exceptionnelle vient d'être enregistrée sur le dossier."
    });
  }
  const oldRes = previous.resiliation || null;
  const newRes = next.resiliation || null;
  if (!oldRes && newRes) {
    events.push({
      type: "resiliation",
      title: "Résiliation à traiter",
      task: "Préparer la résiliation et vérifier le préavis",
      dueInDays: 3,
      message: "Une résiliation vient d'être enregistrée sur le dossier."
    });
  }
  const oldEntry = previous.dateEntreeMission || previous.date_entree_mission;
  const newEntry = next.dateEntreeMission || next.date_entree_mission;
  if (!oldEntry && newEntry) {
    events.push({
      type: "entree_mission",
      title: "Entrée de mission à préparer",
      task: "Préparer l'entrée de mission",
      dueInDays: 5,
      message: "La date d'entrée de mission vient d'être renseignée."
    });
  }
  if (!previous.sortieMission && next.sortieMission) {
    events.push({
      type: "sortie_mission",
      title: "Sortie de mission à préparer",
      task: "Préparer la sortie de mission",
      dueInDays: 5,
      message: "Une sortie de mission vient d'être enregistrée."
    });
  }
  if (!same(previous.statutDossier, next.statutDossier) && next.statutDossier) {
    events.push({
      type: "statut_dossier",
      title: "Statut du dossier modifié",
      task: null,
      message: `Le dossier passe de « ${previous.statutDossier || "non défini"} » à « ${next.statutDossier} ».`
    });
  }
  return events;
}

async function cabinetManagers(portefeuilleId) {
  if (!portefeuilleId) return [];
  const { data } = await supabase.from("team")
    .select("id,auth_user_id,role,statut,portefeuille_id")
    .eq("portefeuille_id", portefeuilleId)
    .in("role", ["admin", "expert"]);
  return (data || []).filter(x => x.statut !== "inactif");
}

export async function dispatchClientEvents({ previous, next, portefeuilleId, auteurId = null }) {
  if (!previous || !next || !next.id) return [];
  const events = transitionEvents(previous, next);
  if (!events.length) return [];

  const managers = await cabinetManagers(portefeuilleId);
  const results = [];
  const clientName = next.nom || next.raisonSociale || "Dossier";

  for (const event of events) {
    const dedupe = `workflow:${next.id}:${event.type}:${next._version || iso()}`;
    if (event.task) {
      const { data: existing } = await supabase.from("tasks")
        .select("id")
        .eq("client_id", next.id)
        .ilike("nom", event.task)
        .neq("statut", "archive")
        .limit(1);
      if (!existing?.length) {
        await createTask({
          client_id: next.id,
          portefeuille_id: portefeuilleId || null,
          nom: event.task,
          commentaire: event.message,
          priorite: "haute",
          statut: "a_faire",
          date_echeance: addDays(event.dueInDays || 5),
          created_by: auteurId || null,
          source: "workflow_event"
        });
      }
    }

    for (const manager of managers) {
      if (!manager.auth_user_id) continue;
      await insertProductNotification({
        portefeuille_id: portefeuilleId,
        user_id: manager.auth_user_id,
        allow_other_user: true,
        type: "workflow",
        title: event.title,
        message: `${clientName} — ${event.message}`,
        client_id: next.id,
        dedupe_key: `${dedupe}:${manager.auth_user_id}`
      });
    }

    await logActivity({
      clientId: next.id,
      portefeuilleId,
      type: "workflow",
      message: event.message,
      auteurId,
      metadata: { event: event.type, automated: true }
    });
    results.push(event.type);
  }
  return results;
}
