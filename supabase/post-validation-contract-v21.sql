-- ============================================================
-- NOVACAB V21 — CONTRAT APRES VALIDATION ADMINISTRATEUR
-- ============================================================
-- Flux : inscription -> en_attente -> validation admin -> contrat -> accès.

CREATE OR REPLACE FUNCTION public.accept_my_cabinet_contract(
  p_contract_version text DEFAULT 'NOVACAB-2026-08'
)
RETURNS public.cabinet_contracts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_team public.team%ROWTYPE;
  v_contract public.cabinet_contracts%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  SELECT * INTO v_team
  FROM public.team
  WHERE auth_user_id = v_uid
    AND statut = 'actif'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Votre accès doit être validé avant la signature du contrat';
  END IF;

  UPDATE public.cabinet_contracts
  SET statut = 'accepte',
      accepted_at = now(),
      contract_version = COALESCE(NULLIF(trim(p_contract_version), ''), 'NOVACAB-2026-08'),
      portefeuille_id = v_team.portefeuille_id,
      cabinet_nom = COALESCE(NULLIF(trim(v_team.cabinet_nom), ''), v_team.nom),
      email = v_team.email,
      updated_at = now()
  WHERE auth_user_id = v_uid
    AND team_id = v_team.id
  RETURNING * INTO v_contract;

  IF NOT FOUND THEN
    INSERT INTO public.cabinet_contracts (
      team_id, auth_user_id, portefeuille_id, cabinet_nom, email,
      contract_version, statut, accepted_at, updated_at
    ) VALUES (
      v_team.id, v_uid, v_team.portefeuille_id,
      COALESCE(NULLIF(trim(v_team.cabinet_nom), ''), v_team.nom),
      v_team.email,
      COALESCE(NULLIF(trim(p_contract_version), ''), 'NOVACAB-2026-08'),
      'accepte', now(), now()
    ) RETURNING * INTO v_contract;
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'contract_accepted', true,
      'contract_accepted_at', now()::text,
      'contract_version', v_contract.contract_version,
      'requires_contract_after_validation', false
    )
  WHERE id = v_uid;

  RETURN v_contract;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_my_cabinet_contract(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_my_cabinet_contract(text) TO authenticated;

-- La signature est obligatoire uniquement pour les nouveaux comptes créés
-- avec requires_contract_after_validation=true dans les métadonnées Auth.
