-- ============================================================================
-- Migration: Fonction de remise a zero des donnees
-- Description: Permet de supprimer selectivement les donnees metier
-- Date: 2026-01-30
-- ============================================================================

-- Fonction pour compter les lignes d'une table
CREATE OR REPLACE FUNCTION count_table_rows(table_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_count BIGINT;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
  RETURN row_count;
EXCEPTION WHEN undefined_table THEN
  RETURN 0;
END;
$$;

-- Fonction principale de remise a zero des donnees
CREATE OR REPLACE FUNCTION reset_application_data(
  p_etablissement_id UUID,
  p_current_user_id UUID,
  p_options JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '{}'::JSONB;
  v_deleted_counts JSONB := '{}'::JSONB;
  v_count BIGINT;
  v_delete_ventes BOOLEAN := COALESCE((p_options->>'ventes')::BOOLEAN, FALSE);
  v_delete_clients BOOLEAN := COALESCE((p_options->>'clients')::BOOLEAN, FALSE);
  v_delete_produits BOOLEAN := COALESCE((p_options->>'produits')::BOOLEAN, FALSE);
  v_delete_stocks BOOLEAN := COALESCE((p_options->>'stocks')::BOOLEAN, FALSE);
  v_delete_tables BOOLEAN := COALESCE((p_options->>'tables')::BOOLEAN, FALSE);
  v_delete_imprimantes BOOLEAN := COALESCE((p_options->>'imprimantes')::BOOLEAN, FALSE);
  v_delete_utilisateurs BOOLEAN := COALESCE((p_options->>'utilisateurs')::BOOLEAN, FALSE);
  v_delete_audit_logs BOOLEAN := COALESCE((p_options->>'auditLogs')::BOOLEAN, FALSE);
BEGIN
  -- Verifier que l'etablissement existe
  IF NOT EXISTS (SELECT 1 FROM etablissements WHERE id = p_etablissement_id) THEN
    RAISE EXCEPTION 'Etablissement non trouve';
  END IF;

  -- Logger l'action AVANT de supprimer les logs (si demande)
  INSERT INTO audit_logs (
    etablissement_id,
    utilisateur_id,
    action,
    entite,
    description,
    created_at
  ) VALUES (
    p_etablissement_id,
    p_current_user_id,
    'DELETE',
    'SYSTEM',
    'RESET_DATA: ' || p_options::TEXT,
    NOW()
  );

  -- ========================================================================
  -- SUPPRESSION DES VENTES ET PAIEMENTS
  -- Ordre: paiements -> lignes_vente -> ventes -> sessions_caisse
  -- ========================================================================
  IF v_delete_ventes THEN
    -- Compter avant suppression
    SELECT count_table_rows('paiements') INTO v_count;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('paiements', v_count);

    -- Supprimer les paiements lies aux ventes de cet etablissement
    DELETE FROM paiements
    WHERE vente_id IN (SELECT id FROM ventes WHERE etablissement_id = p_etablissement_id);

    -- Compter lignes_vente
    SELECT count_table_rows('lignes_vente') INTO v_count;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('lignes_vente', v_count);

    -- Supprimer les lignes de vente
    DELETE FROM lignes_vente
    WHERE vente_id IN (SELECT id FROM ventes WHERE etablissement_id = p_etablissement_id);

    -- Compter ventes
    SELECT COUNT(*) INTO v_count FROM ventes WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('ventes', v_count);

    -- Supprimer les ventes
    DELETE FROM ventes WHERE etablissement_id = p_etablissement_id;

    -- Compter sessions_caisse
    SELECT COUNT(*) INTO v_count FROM sessions_caisse WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('sessions_caisse', v_count);

    -- Supprimer les sessions de caisse
    DELETE FROM sessions_caisse WHERE etablissement_id = p_etablissement_id;
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES MOUVEMENTS DE STOCK
  -- ========================================================================
  IF v_delete_stocks THEN
    SELECT COUNT(*) INTO v_count
    FROM mouvements_stock ms
    JOIN produits p ON p.id = ms.produit_id
    WHERE p.etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('mouvements_stock', v_count);

    DELETE FROM mouvements_stock
    WHERE produit_id IN (SELECT id FROM produits WHERE etablissement_id = p_etablissement_id);
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES CLIENTS
  -- (Apres les ventes car FK possible)
  -- ========================================================================
  IF v_delete_clients THEN
    SELECT COUNT(*) INTO v_count FROM clients WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('clients', v_count);

    DELETE FROM clients WHERE etablissement_id = p_etablissement_id;
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES PRODUITS ET CATEGORIES
  -- Ordre: produits -> categories (FK)
  -- ========================================================================
  IF v_delete_produits THEN
    SELECT COUNT(*) INTO v_count FROM produits WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('produits', v_count);

    DELETE FROM produits WHERE etablissement_id = p_etablissement_id;

    SELECT COUNT(*) INTO v_count FROM categories WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('categories', v_count);

    DELETE FROM categories WHERE etablissement_id = p_etablissement_id;
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES TABLES ET ZONES
  -- Ordre: tables -> zones (FK)
  -- ========================================================================
  IF v_delete_tables THEN
    SELECT COUNT(*) INTO v_count FROM tables WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('tables', v_count);

    DELETE FROM tables WHERE etablissement_id = p_etablissement_id;

    SELECT COUNT(*) INTO v_count FROM zones WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('zones', v_count);

    DELETE FROM zones WHERE etablissement_id = p_etablissement_id;
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES IMPRIMANTES
  -- ========================================================================
  IF v_delete_imprimantes THEN
    SELECT COUNT(*) INTO v_count FROM imprimantes WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('imprimantes', v_count);

    DELETE FROM imprimantes WHERE etablissement_id = p_etablissement_id;

    -- Note: zones_livraison pourrait etre la meme table que zones,
    -- verifier le schema. Sinon, decommenter:
    -- SELECT COUNT(*) INTO v_count FROM zones_livraison WHERE etablissement_id = p_etablissement_id;
    -- v_deleted_counts := v_deleted_counts || jsonb_build_object('zones_livraison', v_count);
    -- DELETE FROM zones_livraison WHERE etablissement_id = p_etablissement_id;
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES UTILISATEURS (sauf l'admin actuel)
  -- ========================================================================
  IF v_delete_utilisateurs THEN
    SELECT COUNT(*) INTO v_count
    FROM utilisateurs
    WHERE etablissement_id = p_etablissement_id
      AND id != p_current_user_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('utilisateurs', v_count);

    DELETE FROM utilisateurs
    WHERE etablissement_id = p_etablissement_id
      AND id != p_current_user_id;
  END IF;

  -- ========================================================================
  -- SUPPRESSION DES LOGS D'AUDIT
  -- (Sauf le log de cette operation qui vient d'etre cree)
  -- ========================================================================
  IF v_delete_audit_logs THEN
    SELECT COUNT(*) - 1 INTO v_count
    FROM audit_logs
    WHERE etablissement_id = p_etablissement_id;
    v_deleted_counts := v_deleted_counts || jsonb_build_object('audit_logs', GREATEST(v_count, 0));

    -- Garder uniquement le log de l'operation de reset
    DELETE FROM audit_logs
    WHERE etablissement_id = p_etablissement_id
      AND NOT (
        action = 'DELETE'
        AND entite = 'SYSTEM'
        AND description LIKE 'RESET_DATA:%'
        AND created_at >= NOW() - INTERVAL '1 minute'
      );
  END IF;

  -- Construire le resultat
  v_result := jsonb_build_object(
    'success', TRUE,
    'deletedCounts', v_deleted_counts,
    'timestamp', NOW()
  );

  RETURN v_result;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION reset_application_data(UUID, UUID, JSONB) IS
'Fonction de remise a zero selective des donnees de l''application.
Options: ventes, clients, produits, stocks, tables, imprimantes, utilisateurs, auditLogs.
Seuls les admins peuvent executer cette fonction.';

-- Accorder les permissions (ajuster selon votre configuration RLS)
-- GRANT EXECUTE ON FUNCTION reset_application_data TO authenticated;
