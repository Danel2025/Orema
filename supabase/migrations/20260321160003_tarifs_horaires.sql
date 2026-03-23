-- ============================================================================
-- Migration: Creer la table tarifs_horaires
-- Date: 2026-03-21
-- Description: Tarifs horaires (Happy Hour, tarifs de nuit, etc.).
--              Permet d'appliquer des ajustements de prix automatiques
--              selon l'heure et le jour de la semaine.
-- ============================================================================

CREATE TABLE public.tarifs_horaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  jours_semaine INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  type_ajustement TEXT NOT NULL
    CHECK (type_ajustement IN ('pourcentage', 'montant_fixe')),
  valeur_ajustement DECIMAL(10,2) NOT NULL,
  categorie_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  actif BOOLEAN NOT NULL DEFAULT true,
  priorite INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requetes courantes
CREATE INDEX idx_tarifs_horaires_etablissement_actif
  ON public.tarifs_horaires(etablissement_id, actif);

-- Activer RLS
ALTER TABLE public.tarifs_horaires ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT : tous les utilisateurs authentifies de l'etablissement peuvent lire
CREATE POLICY tarifs_horaires_select_own
  ON public.tarifs_horaires
  FOR SELECT
  USING (etablissement_id = get_user_etablissement_id());

-- SELECT : le SUPER_ADMIN peut tout lire
CREATE POLICY tarifs_horaires_select_super_admin
  ON public.tarifs_horaires
  FOR SELECT
  USING (is_super_admin());

-- INSERT : ADMIN+ uniquement
CREATE POLICY tarifs_horaires_insert_admin
  ON public.tarifs_horaires
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- UPDATE : ADMIN+ uniquement
CREATE POLICY tarifs_horaires_update_admin
  ON public.tarifs_horaires
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
CREATE POLICY tarifs_horaires_delete_admin
  ON public.tarifs_horaires
  FOR DELETE
  USING (
    is_admin()
    AND etablissement_id = get_user_etablissement_id()
  );

-- Trigger updated_at
CREATE TRIGGER set_tarifs_horaires_updated_at
  BEFORE UPDATE ON public.tarifs_horaires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.tarifs_horaires IS 'Tarifs horaires (Happy Hour, tarif nuit, etc.) avec ajustement automatique des prix';
COMMENT ON COLUMN public.tarifs_horaires.jours_semaine IS 'Jours d''application : 1=lundi, 7=dimanche';
COMMENT ON COLUMN public.tarifs_horaires.type_ajustement IS 'Type d''ajustement : pourcentage ou montant_fixe';
COMMENT ON COLUMN public.tarifs_horaires.valeur_ajustement IS 'Valeur de l''ajustement (negatif pour reduction, positif pour majoration)';
COMMENT ON COLUMN public.tarifs_horaires.categorie_id IS 'Categorie ciblee (NULL = toutes les categories)';
COMMENT ON COLUMN public.tarifs_horaires.priorite IS 'Priorite en cas de chevauchement horaire (plus eleve = prioritaire)';
