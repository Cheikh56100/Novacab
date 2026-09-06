-- NOVACAB V2.2.1 — Finance & administration visibles dans chaque dossier
-- Les champs sont portés par clients JSONB afin de rester compatibles avec le modèle existant.
-- RLS existante sur clients reste l'autorité : seuls les rôles Administration/Direction doivent
-- pouvoir modifier ces champs via l'application.

-- Cette migration documente/normalise uniquement les structures JSON attendues.
-- Aucun montant de facturation/encaissement fictif n'est introduit.

COMMENT ON TABLE public.clients IS 'Dossiers NOVACAB. Les données administration.finance et administration.tools sont visibles dans le dossier; leur modification est réservée à Administration/Direction côté application et RLS.';
