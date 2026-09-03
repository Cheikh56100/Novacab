-- NOVACAB V23 — Validation fiable des nouveaux comptes
-- Le Super Admin valide via une fonction SECURITY DEFINER afin que
-- les comptes en_attente sans portefeuille puissent être activés.

CREATE OR REPLACE FUNCTION public.approve_team_account(
  p_team_id text,
  p_portefeuille_id text,
  p_role text DEFAULT 'collaborateur'
)
RETURNS public.team
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.team;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Seul le Super Admin NOVACAB peut valider un nouveau compte';
  END IF;

  IF p_portefeuille_id IS NULL OR btrim(p_portefeuille_id) = '' THEN
    RAISE EXCEPTION 'Un cabinet doit être attribué avant validation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.portefeuilles WHERE id = p_portefeuille_id
  ) THEN
    RAISE EXCEPTION 'Cabinet introuvable';
  END IF;

  UPDATE public.team
  SET
    portefeuille_id = p_portefeuille_id,
    role = COALESCE(NULLIF(btrim(p_role), ''), 'collaborateur'),
    statut = 'actif'
  WHERE id = p_team_id
    AND statut = 'en_attente'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Compte en attente introuvable ou déjà traité';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_team_account(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_team_account(text, text, text) TO authenticated;
