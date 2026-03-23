-- ============================================================================
-- Migration: Ajouter colonnes tarification a la table etablissements
-- Date: 2026-03-21
-- Description: Ajoute les colonnes de configuration du systeme de tarification
--              sur la table etablissements (protection marge, approbation remise,
--              tarifs horaires).
-- ============================================================================

-- Protection de marge
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS protection_marge_active BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS marge_minimum_globale DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Approbation de remise
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS approbation_remise_active BOOLEAN NOT NULL DEFAULT false;

-- Tarifs horaires
ALTER TABLE public.etablissements
  ADD COLUMN IF NOT EXISTS tarifs_horaires_actifs BOOLEAN NOT NULL DEFAULT false;

-- Commentaires
COMMENT ON COLUMN public.etablissements.protection_marge_active IS 'Active le controle de marge minimum sur les ventes';
COMMENT ON COLUMN public.etablissements.marge_minimum_globale IS 'Pourcentage de marge minimum globale a respecter';
COMMENT ON COLUMN public.etablissements.approbation_remise_active IS 'Active le systeme d''approbation de remise par un manager';
COMMENT ON COLUMN public.etablissements.tarifs_horaires_actifs IS 'Active le systeme de tarifs horaires (Happy Hour, etc.)';
