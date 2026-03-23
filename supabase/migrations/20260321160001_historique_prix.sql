-- ============================================================================
-- Migration: Creer la table historique_prix
-- Date: 2026-03-21
-- Description: Historique de toutes les modifications de prix des produits.
--              Permet l'audit et la tracabilite des changements tarifaires.
-- ============================================================================

CREATE TABLE public.historique_prix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  ancien_prix INTEGER NOT NULL,
  nouveau_prix INTEGER NOT NULL,
  modifie_par UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  raison TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requetes courantes
CREATE INDEX idx_historique_prix_produit_date
  ON public.historique_prix(produit_id, created_at DESC);

CREATE INDEX idx_historique_prix_etablissement_date
  ON public.historique_prix(etablissement_id, created_at DESC);

-- Activer RLS
ALTER TABLE public.historique_prix ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT : tous les utilisateurs authentifies de l'etablissement peuvent lire
CREATE POLICY historique_prix_select_own
  ON public.historique_prix
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

-- SELECT : le SUPER_ADMIN peut tout lire
CREATE POLICY historique_prix_select_super_admin
  ON public.historique_prix
  FOR SELECT
  USING (is_super_admin());

-- INSERT : tous les utilisateurs authentifies (l'historique est cree automatiquement)
CREATE POLICY historique_prix_insert_authenticated
  ON public.historique_prix
  FOR INSERT
  WITH CHECK (etablissement_id = get_user_etablissement_id());

-- Pas de UPDATE ni DELETE : l'historique est immutable

-- Commentaires
COMMENT ON TABLE public.historique_prix IS 'Historique immutable des modifications de prix des produits';
COMMENT ON COLUMN public.historique_prix.ancien_prix IS 'Prix avant modification en FCFA (sans decimales)';
COMMENT ON COLUMN public.historique_prix.nouveau_prix IS 'Prix apres modification en FCFA (sans decimales)';
COMMENT ON COLUMN public.historique_prix.modifie_par IS 'Utilisateur ayant effectue la modification (NULL si supprime)';
COMMENT ON COLUMN public.historique_prix.raison IS 'Justification optionnelle du changement de prix';
