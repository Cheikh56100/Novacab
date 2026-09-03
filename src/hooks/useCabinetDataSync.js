import { useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  loadClientsFromSupabase,
  loadTeamFromSupabase,
  loadPortefeuillesFromSupabase,
  loadSecteurContentFromSupabase,
  ensureCurrentUserTeamRemote,
  migrateClients,
  updateClientRemote,
} from "../components-refactored/core.js";
import { RAW_SEED_CLIENTS } from "../data/seedClients";

/** Synchronises the cabinet's core datasets and owns Realtime echo guards. */
export function useCabinetDataSync({
  session,
  clients,
  setClients,
  setTeam,
  setPortefeuilles,
  setSecteurContent,
  setLoading,
  seedSecteurContent,
}) {
  const pendingLocalIds = useRef(new Set());
  const clientsRef = useRef([]);
  const clientSaveQueues = useRef(new Map());
  const pendingLocalTeamIds = useRef(new Set());
  const pendingLocalPortefeuilleIds = useRef(new Set());

  useEffect(() => { clientsRef.current = clients; }, [clients]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let [storedClients, storedTeam, storedPortefeuilles, storedSecteurContent] = await Promise.all([
        loadClientsFromSupabase(),
        loadTeamFromSupabase(),
        loadPortefeuillesFromSupabase(),
        loadSecteurContentFromSupabase(),
      ]);

      const currentAuthId = session?.user?.id;
      const hasCurrentTeamRow = !!currentAuthId && (storedTeam || []).some((row) => row.auth_user_id === currentAuthId);
      if (currentAuthId && !hasCurrentTeamRow) {
        const ensured = await ensureCurrentUserTeamRemote();
        if (ensured) storedTeam = await loadTeamFromSupabase();
      }

      if (cancelled) return;

      if (storedClients?.length) {
        const migrated = migrateClients(storedClients);
        setClients(migrated);
        const pendingMigrations = migrated.filter((c) => c.__annualMigrationPending);
        pendingMigrations.forEach(async (c) => {
          pendingLocalIds.current.add(c.id);
          try {
            const result = await updateClientRemote(c.id, c, c._version);
            if (result?.ok && result.version) {
              setClients((all) => all.map((row) => row.id === c.id ? { ...row, _version: result.version } : row));
            } else {
              const freshRows = await loadClientsFromSupabase();
              const fresh = freshRows?.find((row) => row.id === c.id);
              if (fresh) setClients((all) => all.map((row) => row.id === c.id ? migrateClients([fresh])[0] : row));
            }
          } finally {
            pendingLocalIds.current.delete(c.id);
          }
        });
      } else {
        setClients(migrateClients(RAW_SEED_CLIENTS));
      }

      setTeam(storedTeam || []);
      setPortefeuilles(storedPortefeuilles || []);
      setSecteurContent({ ...seedSecteurContent, ...(storedSecteurContent || {}) });
      setLoading(false);
    })().catch((error) => {
      console.error("Erreur synchronisation cabinet", error);
      if (!cancelled) setLoading(false);
    });

    const channel = supabase
      .channel("cabinet-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
        const id = payload.new?.id ?? payload.old?.id;
        if (id && pendingLocalIds.current.has(id)) return;
        if (payload.eventType === "INSERT") {
          const incoming = { id: payload.new.id, portefeuilleId: payload.new.portefeuille_id, ...(payload.new.data || {}) };
          setClients((prev) => prev?.some((c) => c.id === incoming.id) ? prev : [...(prev || []), incoming]);
        } else if (payload.eventType === "UPDATE") {
          const incoming = { id: payload.new.id, portefeuilleId: payload.new.portefeuille_id, ...(payload.new.data || {}) };
          setClients((prev) => (prev || []).map((c) => c.id === incoming.id ? incoming : c));
        } else if (payload.eventType === "DELETE") {
          setClients((prev) => (prev || []).filter((c) => c.id !== payload.old.id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "team" }, (payload) => {
        const id = payload.new?.id ?? payload.old?.id;
        if (id && pendingLocalTeamIds.current.has(id)) {
          pendingLocalTeamIds.current.delete(id);
          return;
        }
        if (payload.eventType === "INSERT") setTeam((prev) => (prev || []).some((t) => t.id === payload.new.id) ? prev : [...(prev || []), payload.new]);
        else if (payload.eventType === "UPDATE") setTeam((prev) => (prev || []).map((t) => t.id === payload.new.id ? payload.new : t));
        else if (payload.eventType === "DELETE") setTeam((prev) => (prev || []).filter((t) => t.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "portefeuilles" }, (payload) => {
        const id = payload.new?.id ?? payload.old?.id;
        if (id && pendingLocalPortefeuilleIds.current.has(id)) {
          pendingLocalPortefeuilleIds.current.delete(id);
          return;
        }
        if (payload.eventType === "INSERT") setPortefeuilles((prev) => (prev || []).some((p) => p.id === payload.new.id) ? prev : [...(prev || []), payload.new]);
        else if (payload.eventType === "UPDATE") setPortefeuilles((prev) => (prev || []).map((p) => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === "DELETE") setPortefeuilles((prev) => (prev || []).filter((p) => p.id !== payload.old.id));
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          Promise.all([loadClientsFromSupabase(), loadTeamFromSupabase(), loadPortefeuillesFromSupabase()])
            .then(([c, t, p]) => {
              if (c) setClients(migrateClients(c));
              if (t) setTeam(t);
              if (p) setPortefeuilles(p);
            })
            .catch((error) => console.error("Erreur resynchronisation Realtime", error));
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, setClients, setTeam, setPortefeuilles, setSecteurContent, setLoading, seedSecteurContent]);

  return { pendingLocalIds, clientsRef, clientSaveQueues, pendingLocalTeamIds, pendingLocalPortefeuilleIds };
}
