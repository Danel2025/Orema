-- ============================================================================
-- Migration: Creer la table regles_tarification
-- Date: 2026-03-21
-- Description: Regles de tarification par role et par etablissement.
--              Definit les permissions de remise, modification de prix,
--              et seuils d'approbation pour chaque role.
-- ============================================================================

CREATE TABLE public.regles_tarification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CAISSIER', 'SERVEUR')),
  remise_max_pourcent DECIMAL(5,2) NOT NULL DEFAULT 0,
  peut_modifier_prix BOOLEAN NOT NULL DEFAULT false,
  peut_appliquer_remise BOOLEAN NOT NULL DEFAULT false,
  plafond_remise_transaction INTEGER NOT NULL DEFAULT 0,
  necessite_approbation_au_dela DECIMAL(5,2) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT regles_tarification_etablissement_role_unique
    UNIQUE (etablissement_id, role)
);

-- Index
CREATE INDEX idx_regles_tarification_etablissement
  ON public.regles_tarification(etablissement_id);

-- Activer RLS
ALTER TABLE public.regles_tarification ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT : tous les utilisateurs authentifies de l'etablissement peuvent lire
CREATE POLICY regles_tarification_select_own
  ON public.regles_tarification
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

-- SELECT : le SUPER_ADMIN peut tout lire
CREATE POLICY regles_tarification_select_super_admin
  ON public.regles_tarification
  FOR SELECT
  USING (is_super_admin());

-- INSERT : ADMIN+ uniquement
CREATE POLICY regles_tarification_insert_admin
  ON public.regles_tarification
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- UPDATE : ADMIN+ uniquement
CREATE POLICY regles_tarification_update_admin
  ON public.regles_tarification
  FOR UPDATE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  )
  WITH CHECK (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- DELETE : ADMIN+ uniquement
CREATE POLICY regles_tarification_delete_admin
  ON public.regles_tarification
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- Trigger updated_at
CREATE TRIGGER set_regles_tarification_updated_at
  BEFORE UPDATE ON public.regles_tarification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.regles_tarification IS 'Regles de tarification par role pour chaque etablissement (remises, modifications de prix, seuils d''approbation)';
COMMENT ON COLUMN public.regles_tarification.remise_max_pourcent IS 'Pourcentage maximum de remise autorise pour ce role';
COMMENT ON COLUMN public.regles_tarification.plafond_remise_transaction IS 'Montant max de remise en FCFA par transaction (0 = illimite)';
COMMENT ON COLUMN public.regles_tarification.necessite_approbation_au_dela IS 'Pourcentage au-dela duquel une approbation manager est requise (NULL = pas d''approbation)';
