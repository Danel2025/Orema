-- Migration: Créer la table factures pour la facturation des abonnements
CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  abonnement_id UUID REFERENCES public.abonnements(id),
  numero TEXT NOT NULL UNIQUE,
  montant DECIMAL(10,0) NOT NULL,
  devise TEXT NOT NULL DEFAULT 'XAF',
  statut TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'annulee')),
  date_emission TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_echeance TIMESTAMPTZ,
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_factures_etablissement ON public.factures(etablissement_id);
CREATE INDEX idx_factures_abonnement ON public.factures(abonnement_id);
CREATE INDEX idx_factures_statut ON public.factures(statut);
CREATE INDEX idx_factures_numero ON public.factures(numero);
CREATE INDEX idx_factures_date_emission ON public.factures(date_emission DESC);

-- Activer RLS
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SUPER_ADMIN : accès total
CREATE POLICY factures_select_super_admin
  ON public.factures FOR SELECT
  USING (is_super_admin());

CREATE POLICY factures_insert_super_admin
  ON public.factures FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY factures_update_super_admin
  ON public.factures FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY factures_delete_super_admin
  ON public.factures FOR DELETE
  USING (is_super_admin());

-- ADMIN peut lire les factures de son établissement
CREATE POLICY factures_select_admin
  ON public.factures FOR SELECT
  USING (is_admin() AND etablissement_id = get_user_etablissement_id());

-- Commentaires
COMMENT ON TABLE public.factures IS 'Factures liées aux abonnements des établissements';
COMMENT ON COLUMN public.factures.numero IS 'Numéro de facture unique (ex: FAC-2026-00001)';
COMMENT ON COLUMN public.factures.devise IS 'Devise de la facture (défaut XAF/FCFA)';
