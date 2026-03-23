-- Migration: Créer la table abonnements pour la gestion des plans par établissement
CREATE TABLE public.abonnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'gratuit'
    CHECK (plan IN ('gratuit', 'starter', 'pro', 'enterprise')),
  date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_fin TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'actif'
    CHECK (statut IN ('actif', 'expire', 'annule')),
  quota_utilisateurs INT NOT NULL DEFAULT 3,
  quota_produits INT NOT NULL DEFAULT 50,
  quota_ventes_jour INT NOT NULL DEFAULT 100,
  prix_mensuel DECIMAL(10,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un seul abonnement actif par établissement
CREATE UNIQUE INDEX idx_abonnement_actif
  ON public.abonnements(etablissement_id)
  WHERE statut = 'actif';

-- Index pour les requêtes courantes
CREATE INDEX idx_abonnements_etablissement ON public.abonnements(etablissement_id);
CREATE INDEX idx_abonnements_statut ON public.abonnements(statut);
CREATE INDEX idx_abonnements_plan ON public.abonnements(plan);
CREATE INDEX idx_abonnements_date_fin ON public.abonnements(date_fin);

-- Activer RLS
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY abonnements_select_super_admin
  ON public.abonnements FOR SELECT
  USING (is_super_admin());

CREATE POLICY abonnements_insert_super_admin
  ON public.abonnements FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY abonnements_update_super_admin
  ON public.abonnements FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY abonnements_delete_super_admin
  ON public.abonnements FOR DELETE
  USING (is_super_admin());

-- ADMIN peut lire l'abonnement de son propre établissement
CREATE POLICY abonnements_select_admin
  ON public.abonnements FOR SELECT
  USING (is_admin() AND etablissement_id = get_user_etablissement_id());

-- Trigger updated_at
CREATE TRIGGER set_abonnements_updated_at
  BEFORE UPDATE ON public.abonnements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.abonnements IS 'Abonnements et plans tarifaires par établissement';
COMMENT ON COLUMN public.abonnements.quota_utilisateurs IS 'Nombre max d''utilisateurs autorisés';
COMMENT ON COLUMN public.abonnements.quota_produits IS 'Nombre max de produits autorisés';
COMMENT ON COLUMN public.abonnements.quota_ventes_jour IS 'Nombre max de ventes par jour';
