-- ============================================================================
-- Migration: create_ecrans_affichage
-- Description: Table pour les écrans d'affichage cuisine/bar + colonne destination_preparation
-- Date: 2026-03-22
-- ============================================================================

-- 1. Table ecrans_affichage
CREATE TABLE IF NOT EXISTS ecrans_affichage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CUISINE', 'BAR', 'PERSONNALISE')),
  token TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL,
  categories UUID[] DEFAULT NULL,
  son_actif BOOLEAN DEFAULT true,
  delai_urgence_minutes INTEGER DEFAULT 15,
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index sur etablissement_id pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_ecrans_affichage_etablissement_id
  ON ecrans_affichage(etablissement_id);

-- Index sur token pour la validation rapide
CREATE INDEX IF NOT EXISTS idx_ecrans_affichage_token
  ON ecrans_affichage(token);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_ecrans_affichage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ecrans_affichage_updated_at
  BEFORE UPDATE ON ecrans_affichage
  FOR EACH ROW
  EXECUTE FUNCTION update_ecrans_affichage_updated_at();

-- 2. RLS Policies
ALTER TABLE ecrans_affichage ENABLE ROW LEVEL SECURITY;

-- SELECT: utilisateurs de l'établissement
CREATE POLICY "ecrans_affichage_select_policy"
  ON ecrans_affichage
  FOR SELECT
  USING (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs
      WHERE id = (current_setting('app.user_id', true))::uuid
    )
  );

-- INSERT: utilisateurs de l'établissement (ADMIN+)
CREATE POLICY "ecrans_affichage_insert_policy"
  ON ecrans_affichage
  FOR INSERT
  WITH CHECK (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs
      WHERE id = (current_setting('app.user_id', true))::uuid
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );

-- UPDATE: utilisateurs de l'établissement (ADMIN+)
CREATE POLICY "ecrans_affichage_update_policy"
  ON ecrans_affichage
  FOR UPDATE
  USING (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs
      WHERE id = (current_setting('app.user_id', true))::uuid
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );

-- DELETE: utilisateurs de l'établissement (ADMIN+)
CREATE POLICY "ecrans_affichage_delete_policy"
  ON ecrans_affichage
  FOR DELETE
  USING (
    etablissement_id IN (
      SELECT etablissement_id FROM utilisateurs
      WHERE id = (current_setting('app.user_id', true))::uuid
        AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );

-- 3. Colonne destination_preparation sur categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'destination_preparation'
  ) THEN
    ALTER TABLE categories ADD COLUMN destination_preparation TEXT DEFAULT 'AUTO';
    ALTER TABLE categories ADD CONSTRAINT chk_destination_preparation
      CHECK (destination_preparation IN ('CUISINE', 'BAR', 'AUCUNE', 'AUTO'));
  END IF;
END $$;

-- 4. Fonction RPC validate_display_token
CREATE OR REPLACE FUNCTION validate_display_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ecran RECORD;
BEGIN
  SELECT id, nom, type, categories, etablissement_id, son_actif, delai_urgence_minutes, token_expires_at, actif
  INTO v_ecran
  FROM ecrans_affichage
  WHERE token = p_token;

  -- Token introuvable
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Token invalide'
    );
  END IF;

  -- Écran inactif
  IF NOT v_ecran.actif THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Écran désactivé'
    );
  END IF;

  -- Token expiré
  IF v_ecran.token_expires_at < now() THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Token expiré'
    );
  END IF;

  -- Token valide
  RETURN json_build_object(
    'valid', true,
    'id', v_ecran.id,
    'nom', v_ecran.nom,
    'type', v_ecran.type,
    'categories', v_ecran.categories,
    'etablissement_id', v_ecran.etablissement_id,
    'son_actif', v_ecran.son_actif,
    'delai_urgence_minutes', v_ecran.delai_urgence_minutes
  );
END;
$$;
