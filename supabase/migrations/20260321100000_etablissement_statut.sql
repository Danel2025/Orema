-- Migration: Ajouter les colonnes de statut et suspension aux établissements
-- Permet au SUPER_ADMIN de suspendre/réactiver un établissement

-- Ajouter la colonne statut avec contrainte CHECK
ALTER TABLE public.etablissements
  ADD COLUMN statut TEXT NOT NULL DEFAULT 'actif'
    CHECK (statut IN ('actif', 'suspendu', 'en_essai'));

-- Ajouter les colonnes de suspension
ALTER TABLE public.etablissements
  ADD COLUMN date_suspension TIMESTAMPTZ,
  ADD COLUMN motif_suspension TEXT,
  ADD COLUMN suspendu_par UUID REFERENCES auth.users(id);

-- Index sur le statut pour filtrage rapide
CREATE INDEX idx_etablissements_statut ON public.etablissements(statut);

-- Commentaires
COMMENT ON COLUMN public.etablissements.statut IS 'Statut de l''établissement : actif, suspendu, en_essai';
COMMENT ON COLUMN public.etablissements.date_suspension IS 'Date de la dernière suspension';
COMMENT ON COLUMN public.etablissements.motif_suspension IS 'Motif de la suspension';
COMMENT ON COLUMN public.etablissements.suspendu_par IS 'UUID auth.users du super admin ayant suspendu';
