import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const uid = () => crypto.randomUUID();

function demoClients(portefeuilleId: string) {
  const commonMission = {
    "KBIS": true, "Statuts": true, "CNI dirigeants": true, "CNI associés": false,
    "Notes entrée mission / Devizen": true, "Acceptation mission": true,
    "LM à jour": true, "LAB / Kanta / Devizen à jour": true, "Bouclage": false, "Fiche client": true
  };
  const base = {
    portefeuilleId,
    statutDossier: "actif",
    _version: 1,
    annualActiveYear: new Date().getFullYear(),
    mission: commonMission,
  };
  return [
    {
      id: `demo-${uid()}`, ...base, nom: "BOULANGERIE MARTIN", siren: "901234567",
      formeJuridique: "SARL", activite: "Boulangerie - restauration", secteur: "Restauration",
      logiciel: "MYUNISOFT", collab: "Utilisateur Démo", tvaRegime: "CA3", tvaExig: 24,
      tvaMois: { Jan:"OK", Fév:"OK", Mar:"OK", Avr:"OK", Mai:"OK", Juin:"OK", Juil:"OK", Août:"EN COURS" },
      chiffreAffaires: 485200, isAssujetti: true, effectif: 7, ville: "Paris",
    },
    {
      id: `demo-${uid()}`, ...base, nom: "BTP CONSTRUCTION PRO", siren: "912345678",
      formeJuridique: "SAS", activite: "Construction et travaux publics", secteur: "BTP",
      logiciel: "QUADRA", collab: "Utilisateur Démo", tvaRegime: "CA3", tvaExig: 24,
      tvaMois: { Jan:"OK", Fév:"OK", Mar:"OK", Avr:"FAIT", Mai:"OK", Juin:"OK", Juil:"OK", Août:"OK" },
      chiffreAffaires: 1280000, isAssujetti: true, effectif: 18, ville: "Boulogne-Billancourt",
    },
    {
      id: `demo-${uid()}`, ...base, nom: "TECH SOLUTIONS", siren: "923456789",
      formeJuridique: "SAS", activite: "Conseil et développement informatique", secteur: "Informatique",
      logiciel: "MYUNISOFT", collab: "Utilisateur Démo", tvaRegime: "CA12",
      tvaMois: { Jan:"NA", Fév:"NA", Mar:"NA", Avr:"NA", Mai:"NA", Juin:"NA", Juil:"NA", Août:"NA" },
      chiffreAffaires: 320000, isAssujetti: true, effectif: 4, ville: "Saint-Denis",
    },
    {
      id: `demo-${uid()}`, ...base, nom: "GARAGE AUTO PLUS", siren: "934567890",
      formeJuridique: "SARL", activite: "Réparation et entretien automobile", secteur: "Automobile",
      logiciel: "QUADRA", collab: "Utilisateur Démo", tvaRegime: "CA3", tvaExig: 19,
      tvaMois: { Jan:"OK", Fév:"OK", Mar:"OK", Avr:"OK", Mai:"OK", Juin:"OK", Juil:"FAIT", Août:"OK" },
      chiffreAffaires: 760000, isAssujetti: true, effectif: 6, ville: "Montreuil",
    },
    {
      id: `demo-${uid()}`, ...base, nom: "STUDIO ÉLÉGANCE", siren: "945678901",
      formeJuridique: "EI", activite: "Coiffure et esthétique", secteur: "Services",
      logiciel: "MYUNISOFT", collab: "Utilisateur Démo", tvaRegime: "FRANCHISE",
      tvaMois: { Jan:"NA", Fév:"NA", Mar:"NA", Avr:"NA", Mai:"NA", Juin:"NA", Juil:"NA", Août:"NA" },
      chiffreAffaires: 92000, isAssujetti: false, effectif: 2, ville: "Noisy-le-Grand",
    },
  ].map((row) => ({ ...row, mission: { ...commonMission } }));
}

async function requireAdmin(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Session absente.");
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Session invalide.");
  const { data: me, error } = await admin.from("team")
    .select("id, role, statut, portefeuille_id")
    .eq("auth_user_id", userData.user.id)
    .eq("statut", "actif")
    .maybeSingle();
  if (error || me?.role !== "admin") throw new Error("Action réservée à l'Admin.");
  return { user: userData.user, me };
}

async function seedDemo(portefeuilleId: string) {
  const rows = demoClients(portefeuilleId);
  const { error } = await admin.from("clients").insert(rows.map(({ portefeuilleId: pf, ...data }) => ({
    id: data.id,
    data,
    portefeuille_id: pf,
  })));
  if (error) throw error;
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user: adminUser } = await requireAdmin(req);
    const body = await req.json();
    const action = body.action;

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const cabinetName = String(body.cabinetName || "Cabinet démo").trim();
      const expiresInDays = body.expiresInDays == null ? null : Number(body.expiresInDays);
      if (!email || password.length < 8) throw new Error("Email et mot de passe (8 caractères minimum) requis.");

      const { data: existing } = await admin.from("team").select("id").eq("email", email).eq("is_demo", true).maybeSingle();
      if (existing) throw new Error("Un compte démo utilise déjà cette adresse email.");

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: cabinetName, cabinet_nom: cabinetName, is_demo: true },
      });
      if (createError || !created.user) throw createError || new Error("Impossible de créer le compte Auth.");

      const userId = created.user.id;
      const portefeuilleId = `demo-${userId}`;
      const teamId = `demo-team-${userId}`;
      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;

      const { error: pfError } = await admin.from("portefeuilles").insert({
        id: portefeuilleId, nom: `${cabinetName} — Démo NOVACAB`, domaine: "Démonstration",
      });
      if (pfError) {
        await admin.auth.admin.deleteUser(userId);
        throw pfError;
      }

      const { error: teamError } = await admin.from("team").insert({
        id: teamId, nom: "Utilisateur Démo", color: "#1D9BF0", email,
        cabinet_nom: cabinetName, role: "expert", statut: "actif",
        portefeuille_id: portefeuilleId, auth_user_id: userId,
        is_demo: true, demo_expires_at: expiresAt,
      });
      if (teamError) {
        await admin.from("portefeuilles").delete().eq("id", portefeuilleId);
        await admin.auth.admin.deleteUser(userId);
        throw teamError;
      }

      await seedDemo(portefeuilleId);
      return new Response(JSON.stringify({ ok:true, email, password, cabinetName, teamId, portefeuilleId, expiresAt }), {
        headers: { ...corsHeaders, "Content-Type":"application/json" },
      });
    }

    const teamId = String(body.teamId || "");
    const { data: demo, error: demoError } = await admin.from("team")
      .select("id, email, auth_user_id, portefeuille_id, is_demo")
      .eq("id", teamId).eq("is_demo", true).maybeSingle();
    if (demoError || !demo) throw new Error("Compte démo introuvable.");

    if (action === "reset") {
      const { error: delError } = await admin.from("clients").delete().eq("portefeuille_id", demo.portefeuille_id);
      if (delError) throw delError;
      await seedDemo(demo.portefeuille_id);
      await admin.from("team").update({ statut:"actif" }).eq("id", teamId);
      await admin.auth.admin.updateUserById(demo.auth_user_id, { ban_duration: "none" });
      return new Response(JSON.stringify({ ok:true }), { headers:{...corsHeaders,"Content-Type":"application/json"} });
    }

    if (action === "disable") {
      const { data: row } = await admin.from("team").select("statut, auth_user_id").eq("id", teamId).single();
      const next = row?.statut === "actif" ? "desactive" : "actif";
      await admin.from("team").update({ statut: next }).eq("id", teamId);
      await admin.auth.admin.updateUserById(row.auth_user_id, { ban_duration: next === "actif" ? "none" : "876000h" });
      return new Response(JSON.stringify({ ok:true, statut:next }), { headers:{...corsHeaders,"Content-Type":"application/json"} });
    }

    if (action === "delete") {
      await admin.from("clients").delete().eq("portefeuille_id", demo.portefeuille_id);
      await admin.from("team").delete().eq("id", teamId);
      await admin.from("portefeuilles").delete().eq("id", demo.portefeuille_id);
      const { error } = await admin.auth.admin.deleteUser(demo.auth_user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok:true }), { headers:{...corsHeaders,"Content-Type":"application/json"} });
    }

    throw new Error("Action inconnue.");
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Erreur serveur." }), {
      status: 400, headers:{...corsHeaders,"Content-Type":"application/json"},
    });
  }
});
