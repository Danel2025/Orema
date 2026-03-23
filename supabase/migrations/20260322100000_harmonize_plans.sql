-- Migration: Harmoniser les plans tarifaires
-- Date: 2026-03-22
-- Auteur: @db-migration (config-schema)
--
-- Changements:
--   1. Ajouter colonnes plan/billing/quotas sur etablissements
--   2. Mettre a jour la table abonnements (nouveaux plans, nouvelles colonnes)
--   3. Creer table paiements_abonnement
--   4. Creer table factures_abonnement
--   5. RLS + Index

-- ============================================================================
-- 1. COLONNES SUR ETABLISSEMENTS
-- ============================================================================

-- Plan actuel de l'etablissement
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'essentiel'
    CHECK (plan IN ('essentiel', 'pro', 'business', 'enterprise'));

-- Cycle de facturation
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'mensuel'
    CHECK (billing_cycle IN ('mensuel', 'annuel'));

-- Quotas (overridables par super admin)
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS max_utilisateurs INT NOT NULL DEFAULT 2;

ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS max_produits INT NOT NULL DEFAULT 50;

ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS max_ventes_mois INT NOT NULL DEFAULT 500;

ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS max_etablissements INT NOT NULL DEFAULT 1;

-- Cles externes paiement
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS monetbil_service_key TEXT;

-- Index sur plan
CREATE INDEX IF NOT EXISTS idx_etablissements_plan
  ON public.etablissements(plan);

-- Commentaires
COMMENT ON COLUMN public.etablissements.plan IS 'Plan tarifaire actuel: essentiel, pro, business, enterprise';
COMMENT ON COLUMN public.etablissements.billing_cycle IS 'Cycle de facturation: mensuel ou annuel';
COMMENT ON COLUMN public.etablissements.max_utilisateurs IS 'Quota max utilisateurs (overridable)';
COMMENT ON COLUMN public.etablissements.max_produits IS 'Quota max produits (overridable)';
COMMENT ON COLUMN public.etablissements.max_ventes_mois IS 'Quota max ventes par mois (overridable)';
COMMENT ON COLUMN public.etablissements.max_etablissements IS 'Quota max etablissements autorises';
COMMENT ON COLUMN public.etablissements.stripe_customer_id IS 'ID client Stripe pour paiements CB';
COMMENT ON COLUMN public.etablissements.monetbil_service_key IS 'Cle service Monetbil pour Mobile Money';

-- ============================================================================
-- 2. MISE A JOUR TABLE ABONNEMENTS
-- ============================================================================

-- Mettre a jour la contrainte CHECK sur plan
ALTER TABLE public.abonnements DROP CONSTRAINT IF EXISTS abonnements_plan_check;
ALTER TABLE public.abonnements
  ADD CONSTRAINT abonnements_plan_check
    CHECK (plan IN ('essentiel', 'pro', 'business', 'enterprise'));

-- Migrer les donnees existantes (anciens plans vers nouveaux)
UPDATE public.abonnements SET plan = 'essentiel' WHERE plan = 'gratuit';
UPDATE public.abonnements SET plan = 'pro' WHERE plan = 'starter';

-- Mettre a jour le defaut
ALTER TABLE public.abonnements ALTER COLUMN plan SET DEFAULT 'essentiel';

-- Ajouter nouvelles colonnes a abonnements
ALTER TABLE public.abonnements
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'mensuel'
    CHECK (billing_cycle IN ('mensuel', 'annuel'));

ALTER TABLE public.abonnements
  ADD COLUMN IF NOT EXISTS date_essai_fin TIMESTAMPTZ;

ALTER TABLE public.abonnements
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.abonnements
  ADD COLUMN IF NOT EXISTS monetbil_payment_id TEXT;

-- Renommer quota_ventes_jour en quota_ventes_mois (plus coherent)
ALTER TABLE public.abonnements
  ADD COLUMN IF NOT EXISTS quota_ventes_mois INT NOT NULL DEFAULT 500;

-- Ajouter quota etablissements
ALTER TABLE public.abonnements
  ADD COLUMN IF NOT EXISTS quota_etablissements INT NOT NULL DEFAULT 1;

-- Mettre a jour le statut CHECK pour inclure les nouveaux statuts
ALTER TABLE public.abonnements DROP CONSTRAINT IF EXISTS abonnements_statut_check;
ALTER TABLE public.abonnements
  ADD CONSTRAINT abonnements_statut_check
    CHECK (statut IN ('actif', 'en_essai', 'expire', 'annule', 'suspendu'));

-- Commentaires
COMMENT ON COLUMN public.abonnements.billing_cycle IS 'Cycle: mensuel ou annuel';
COMMENT ON COLUMN public.abonnements.date_essai_fin IS 'Date fin de la periode d''essai gratuit';
COMMENT ON COLUMN public.abonnements.stripe_subscription_id IS 'ID abonnement Stripe';
COMMENT ON COLUMN public.abonnements.monetbil_payment_id IS 'ID paiement Monetbil';
COMMENT ON COLUMN public.abonnements.quota_ventes_mois IS 'Quota max ventes par mois';
COMMENT ON COLUMN public.abonnements.quota_etablissements IS 'Quota max etablissements';

-- ============================================================================
-- 3. TABLE PAIEMENTS_ABONNEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.paiements_abonnement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  montant DECIMAL(10,0) NOT NULL,
  devise TEXT NOT NULL DEFAULT 'XAF',
  methode TEXT NOT NULL
    CHECK (methode IN ('stripe', 'monetbil_airtel', 'monetbil_moov', 'virement', 'especes', 'gratuit')),
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'reussi', 'echoue', 'rembourse')),
  reference_externe TEXT,
  provider_payload JSONB,
  periode_debut TIMESTAMPTZ NOT NULL,
  periode_fin TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_paiements_abo_etablissement
  ON public.paiements_abonnement(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_paiements_abo_statut
  ON public.paiements_abonnement(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_abo_methode
  ON public.paiements_abonnement(methode);
CREATE INDEX IF NOT EXISTS idx_paiements_abo_created
  ON public.paiements_abonnement(created_at DESC);

-- RLS
ALTER TABLE public.paiements_abonnement ENABLE ROW LEVEL SECURITY;

CREATE POLICY paiements_abo_select_super_admin
  ON public.paiements_abonnement FOR SELECT
  USING (is_super_admin());

CREATE POLICY paiements_abo_insert_super_admin
  ON public.paiements_abonnement FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY paiements_abo_update_super_admin
  ON public.paiements_abonnement FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY paiements_abo_select_admin
  ON public.paiements_abonnement FOR SELECT
  USING (is_admin() AND etablissement_id = get_user_etablissement_id());

-- Commentaires
COMMENT ON TABLE public.paiements_abonnement IS 'Paiements lies aux abonnements des etablissements';
COMMENT ON COLUMN public.paiements_abonnement.reference_externe IS 'Reference du paiement chez le provider (Stripe charge ID, Monetbil payment ID)';
COMMENT ON COLUMN public.paiements_abonnement.provider_payload IS 'Payload brut retourne par le provider de paiement';

-- ============================================================================
-- 4. TABLE FACTURES_ABONNEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.factures_abonnement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  periode_debut TIMESTAMPTZ NOT NULL,
  periode_fin TIMESTAMPTZ NOT NULL,
  montant_ht DECIMAL(10,0) NOT NULL,
  tva DECIMAL(10,0) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(10,0) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'emise', 'payee', 'en_retard', 'annulee')),
  pdf_url TEXT,
  date_echeance TIMESTAMPTZ NOT NULL,
  date_paiement TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicite du numero de facture
CREATE UNIQUE INDEX IF NOT EXISTS idx_factures_abo_numero
  ON public.factures_abonnement(numero);

-- Index
CREATE INDEX IF NOT EXISTS idx_factures_abo_etablissement
  ON public.factures_abonnement(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_factures_abo_statut
  ON public.factures_abonnement(statut);
CREATE INDEX IF NOT EXISTS idx_factures_abo_echeance
  ON public.factures_abonnement(date_echeance);
CREATE INDEX IF NOT EXISTS idx_factures_abo_created
  ON public.factures_abonnement(created_at DESC);

-- RLS
ALTER TABLE public.factures_abonnement ENABLE ROW LEVEL SECURITY;

CREATE POLICY factures_abo_select_super_admin
  ON public.factures_abonnement FOR SELECT
  USING (is_super_admin());

CREATE POLICY factures_abo_insert_super_admin
  ON public.factures_abonnement FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY factures_abo_update_super_admin
  ON public.factures_abonnement FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY factures_abo_delete_super_admin
  ON public.factures_abonnement FOR DELETE
  USING (is_super_admin());

CREATE POLICY factures_abo_select_admin
  ON public.factures_abonnement FOR SELECT
  USING (is_admin() AND etablissement_id = get_user_etablissement_id());

-- Commentaires
COMMENT ON TABLE public.factures_abonnement IS 'Factures generees pour les abonnements';
COMMENT ON COLUMN public.factures_abonnement.numero IS 'Numero unique de facture (ex: FAC-2026-00001)';
COMMENT ON COLUMN public.factures_abonnement.montant_ht IS 'Montant hors taxes en FCFA';
COMMENT ON COLUMN public.factures_abonnement.tva IS 'Montant TVA en FCFA';
COMMENT ON COLUMN public.factures_abonnement.montant_ttc IS 'Montant TTC en FCFA';
