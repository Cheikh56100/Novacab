-- NOVACAB V20 — résiliation/suppression sécurisée des cabinets + contrats
ALTER TABLE public.portefeuilles ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'actif';
ALTER TABLE public.portefeuilles ADD COLUMN IF NOT EXISTS resilie_at timestamptz;
ALTER TABLE public.portefeuilles ADD COLUMN IF NOT EXISTS resiliation_motif text;
ALTER TABLE public.portefeuilles ADD COLUMN IF NOT EXISTS resilie_by text;

CREATE TABLE IF NOT EXISTS public.cabinet_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text,
  auth_user_id uuid,
  portefeuille_id text,
  cabinet_nom text NOT NULL,
  email text,
  contract_version text NOT NULL DEFAULT 'NOVACAB-2026-08',
  statut text NOT NULL DEFAULT 'accepte',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  accepted_ip text,
  terms_summary text NOT NULL DEFAULT 'Contrat d''utilisation NOVACAB',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cabinet_contracts_team ON public.cabinet_contracts(team_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_contracts_auth ON public.cabinet_contracts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_contracts_portefeuille ON public.cabinet_contracts(portefeuille_id);

ALTER TABLE public.cabinet_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cabinet_contracts_super_admin ON public.cabinet_contracts;
CREATE POLICY cabinet_contracts_super_admin ON public.cabinet_contracts FOR ALL TO authenticated
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS cabinet_contracts_own_select ON public.cabinet_contracts;
CREATE POLICY cabinet_contracts_own_select ON public.cabinet_contracts FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_contract_for_new_team()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.cabinet_contracts(team_id,auth_user_id,portefeuille_id,cabinet_nom,email,contract_version,statut,accepted_at)
  SELECT NEW.id, NEW.auth_user_id, NEW.portefeuille_id, COALESCE(NULLIF(trim(NEW.cabinet_nom),''),NEW.nom,'Cabinet NOVACAB'), NEW.email,
         COALESCE(NULLIF(u.raw_user_meta_data->>'contract_version',''),'NOVACAB-2026-08'),
         CASE WHEN COALESCE((u.raw_user_meta_data->>'contract_accepted')::boolean,false) THEN 'accepte' ELSE 'a_regulariser' END,
         COALESCE(NULLIF(u.raw_user_meta_data->>'contract_accepted_at','')::timestamptz,now())
  FROM auth.users u WHERE u.id=NEW.auth_user_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_team_create_contract ON public.team;
CREATE TRIGGER trg_team_create_contract AFTER INSERT ON public.team FOR EACH ROW EXECUTE FUNCTION public.create_contract_for_new_team();

CREATE OR REPLACE FUNCTION public.sync_contract_portefeuille()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.cabinet_contracts SET portefeuille_id=NEW.portefeuille_id, cabinet_nom=COALESCE(NULLIF(NEW.cabinet_nom,''),cabinet_nom), updated_at=now() WHERE team_id=NEW.id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_team_sync_contract ON public.team;
CREATE TRIGGER trg_team_sync_contract AFTER UPDATE OF portefeuille_id,cabinet_nom ON public.team FOR EACH ROW EXECUTE FUNCTION public.sync_contract_portefeuille();

CREATE OR REPLACE FUNCTION public.delete_empty_portefeuille(target_portefeuille_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Action réservée au Super Admin'; END IF;
  IF EXISTS (SELECT 1 FROM public.team WHERE portefeuille_id=target_portefeuille_id) THEN RAISE EXCEPTION 'Impossible : des membres sont encore rattachés à ce cabinet'; END IF;
  IF EXISTS (SELECT 1 FROM public.clients WHERE portefeuille_id=target_portefeuille_id) THEN RAISE EXCEPTION 'Impossible : des clients sont encore rattachés à ce cabinet'; END IF;
  DELETE FROM public.portefeuilles WHERE id=target_portefeuille_id;
END; $$;
REVOKE ALL ON FUNCTION public.delete_empty_portefeuille(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_empty_portefeuille(text) TO authenticated;
