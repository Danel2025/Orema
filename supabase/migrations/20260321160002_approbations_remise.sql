-- ============================================================================
-- Migration: Creer la table approbations_remise
-- Date: 2026-03-21
-- Description: Gestion des demandes d'approbation de remise.
--              Un caissier/serveur peut demander une remise au-dela de son seuil,
--              un manager/admin peut approuver ou refuser.
-- ============================================================================

CREATE TABLE public.approbations_remise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  demandeur_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  approbateur_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
  vente_id UUID REFERENCES public.ventes(id) ON DELETE SET NULL,
  montant_remise INTEGER NOT NULL,
  pourcentage_remise DECIMAL(5,2) NOT NULL,
  montant_vente INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'approuvee', 'refusee', 'expiree')),
  commentaire TEXT,
  commentaire_reponse TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requetes courantes
CREATE INDEX idx_approbations_remise_etablissement_statut
  ON public.approbations_remise(etablissement_id, statut);

CREATE INDEX idx_approbations_remise_demandeur
  ON public.approbations_remise(demandeur_id);

-- Activer RLS
ALTER TABLE public.approbations_remise ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT : tous les utilisateurs authentifies de l'etablissement peuvent lire
CREATE POLICY approbations_remise_select_own
  ON public.approbations_remise
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

-- SELECT : le SUPER_ADMIN peut tout lire
CREATE POLICY approbations_remise_select_super_admin
  ON public.approbations_remise
  FOR SELECT
  USING (is_super_admin());

-- INSERT : tous les utilisateurs authentifies de l'etablissement
CREATE POLICY approbations_remise_insert_authenticated
  ON public.approbations_remise
  FOR INSERT
  WITH CHECK (etablissement_id = get_user_etablissement_id());

-- UPDATE : MANAGER+ uniquement (pour approuver/refuser)
CREATE POLICY approbations_remise_update_manager
  ON public.approbations_remise
  FOR UPDATE
  USING (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  )
  WITH CHECK (
    is_manager_or_above()
    AND etablissement_id = get_user_etablissement_id()
  );

-- Trigger updated_at
CREATE TRIGGER set_approbations_remise_updated_at
  BEFORE UPDATE ON public.approbations_remise
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.approbations_remise IS 'Demandes d''approbation de remise depassant les seuils autorises';
COMMENT ON COLUMN public.approbations_remise.montant_remise IS 'Montant de la remise demandee en FCFA';
COMMENT ON COLUMN public.approbations_remise.pourcentage_remise IS 'Pourcentage de remise demande';
COMMENT ON COLUMN public.approbations_remise.montant_vente IS 'Montant total de la vente avant remise en FCFA';
COMMENT ON COLUMN public.approbations_remise.statut IS 'Statut de la demande : en_attente, approuvee, refusee, expiree';
COMMENT ON COLUMN public.approbations_remise.vente_id IS 'Vente associee (NULL si la vente n''a pas encore ete creee)';
