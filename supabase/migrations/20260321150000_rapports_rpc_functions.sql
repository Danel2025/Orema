-- ============================================================================
-- Migration: RPCs pour les rapports et statistiques
-- Date: 2026-03-21
-- Description: Fonctions SQL pour deplacer les agregations cote serveur
--   au lieu de les faire en JavaScript. Toutes les fonctions sont
--   SECURITY DEFINER avec search_path = public.
-- ============================================================================

-- ============================================================================
-- 1. get_kpi_stats
-- Retourne le CA total, le nombre de ventes et le panier moyen
-- pour un etablissement sur une periode donnee.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_kpi_stats(
  p_etablissement_id UUID,
  p_date_debut TIMESTAMPTZ,
  p_date_fin TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_ca', COALESCE(SUM(total_final), 0),
    'nombre_ventes', COUNT(*),
    'panier_moyen', COALESCE(AVG(total_final), 0)
  )
  FROM ventes
  WHERE etablissement_id = p_etablissement_id
    AND statut = 'PAYEE'
    AND created_at >= p_date_debut
    AND created_at < p_date_fin;
$$;

COMMENT ON FUNCTION get_kpi_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
'Retourne les KPIs principaux (CA total, nombre de ventes, panier moyen) pour un etablissement sur une periode.';

-- ============================================================================
-- 2. get_ca_by_period
-- Retourne le CA groupe par jour, semaine ou mois.
-- Le parametre group_by accepte: ''day'', ''week'', ''month''.
-- Les dates sont converties en timezone Africa/Libreville (UTC+1).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ca_by_period(
  p_etablissement_id UUID,
  p_date_debut TIMESTAMPTZ,
  p_date_fin TIMESTAMPTZ,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'date', to_char(periode, 'YYYY-MM-DD'),
        'total_ca', total_ca,
        'nombre_ventes', nombre_ventes
      )
      ORDER BY periode
    ),
    '[]'::JSON
  )
  FROM (
    SELECT
      date_trunc(p_group_by, created_at AT TIME ZONE 'Africa/Libreville') AS periode,
      COALESCE(SUM(total_final), 0) AS total_ca,
      COUNT(*) AS nombre_ventes
    FROM ventes
    WHERE etablissement_id = p_etablissement_id
      AND statut = 'PAYEE'
      AND created_at >= p_date_debut
      AND created_at < p_date_fin
    GROUP BY periode
  ) sub;
$$;

COMMENT ON FUNCTION get_ca_by_period(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) IS
'Retourne le CA groupe par periode (day, week, month) en timezone Africa/Libreville.';

-- ============================================================================
-- 3. get_top_produits
-- Retourne les produits les plus vendus avec quantite et montant total.
-- JOIN lignes_vente -> ventes (filtre par etablissement, statut, date)
-- JOIN produits (pour le nom)
-- JOIN categories (pour le nom de categorie)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_produits(
  p_etablissement_id UUID,
  p_date_debut TIMESTAMPTZ,
  p_date_fin TIMESTAMPTZ,
  p_limit_count INT DEFAULT 10
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'produit_id', produit_id,
        'nom', nom,
        'categorie', categorie,
        'total_quantite', total_quantite,
        'total_montant', total_montant
      )
      ORDER BY total_quantite DESC
    ),
    '[]'::JSON
  )
  FROM (
    SELECT
      p.id AS produit_id,
      p.nom AS nom,
      COALESCE(c.nom, 'Sans categorie') AS categorie,
      SUM(lv.quantite) AS total_quantite,
      COALESCE(SUM(lv.total), 0) AS total_montant
    FROM lignes_vente lv
    INNER JOIN ventes v ON v.id = lv.vente_id
    INNER JOIN produits p ON p.id = lv.produit_id
    LEFT JOIN categories c ON c.id = p.categorie_id
    WHERE v.etablissement_id = p_etablissement_id
      AND v.statut = 'PAYEE'
      AND v.created_at >= p_date_debut
      AND v.created_at < p_date_fin
    GROUP BY p.id, p.nom, c.nom
    ORDER BY total_quantite DESC
    LIMIT p_limit_count
  ) sub;
$$;

COMMENT ON FUNCTION get_top_produits(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) IS
'Retourne les top N produits vendus (par quantite) sur une periode donnee.';

-- ============================================================================
-- 4. get_paiements_stats_by_mode
-- Retourne les statistiques de paiements groupees par mode de paiement.
-- JOIN paiements -> ventes pour filtrer par etablissement, statut et date.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_paiements_stats_by_mode(
  p_etablissement_id UUID,
  p_date_debut TIMESTAMPTZ,
  p_date_fin TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'mode_paiement', mode_paiement,
        'total_montant', total_montant,
        'nombre', nombre
      )
      ORDER BY total_montant DESC
    ),
    '[]'::JSON
  )
  FROM (
    SELECT
      pa.mode_paiement::TEXT AS mode_paiement,
      COALESCE(SUM(pa.montant), 0) AS total_montant,
      COUNT(*) AS nombre
    FROM paiements pa
    INNER JOIN ventes v ON v.id = pa.vente_id
    WHERE v.etablissement_id = p_etablissement_id
      AND v.statut = 'PAYEE'
      AND v.created_at >= p_date_debut
      AND v.created_at < p_date_fin
    GROUP BY pa.mode_paiement
  ) sub;
$$;

COMMENT ON FUNCTION get_paiements_stats_by_mode(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
'Retourne les totaux de paiements groupes par mode (ESPECES, CARTE_BANCAIRE, etc.) sur une periode.';

-- ============================================================================
-- 5. get_peak_hours
-- Retourne le nombre de ventes et le CA par heure de la journee.
-- Utilise EXTRACT(HOUR FROM ...) en timezone Africa/Libreville.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_peak_hours(
  p_etablissement_id UUID,
  p_date_debut TIMESTAMPTZ,
  p_date_fin TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'heure', heure,
        'nombre_ventes', nombre_ventes,
        'total_ca', total_ca
      )
      ORDER BY heure
    ),
    '[]'::JSON
  )
  FROM (
    SELECT
      EXTRACT(HOUR FROM created_at AT TIME ZONE 'Africa/Libreville')::INT AS heure,
      COUNT(*) AS nombre_ventes,
      COALESCE(SUM(total_final), 0) AS total_ca
    FROM ventes
    WHERE etablissement_id = p_etablissement_id
      AND statut = 'PAYEE'
      AND created_at >= p_date_debut
      AND created_at < p_date_fin
    GROUP BY heure
  ) sub;
$$;

COMMENT ON FUNCTION get_peak_hours(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
'Retourne le nombre de ventes et CA par heure locale (Africa/Libreville) sur une periode.';

-- ============================================================================
-- 6. reset_data_transactional
-- Supprime selectivement les donnees metier dans le bon ordre (FK).
-- Accepte un tableau de categories a supprimer.
-- Toute l''operation est atomique (une seule transaction).
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_data_transactional(
  p_etablissement_id UUID,
  p_categories TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted JSONB := '{}'::JSONB;
  v_count BIGINT;
BEGIN
  -- Verifier que l'etablissement existe
  IF NOT EXISTS (SELECT 1 FROM etablissements WHERE id = p_etablissement_id) THEN
    RAISE EXCEPTION 'Etablissement % non trouve', p_etablissement_id;
  END IF;

  -- ======================================================================
  -- VENTES : paiements -> lignes_vente_supplements -> lignes_vente -> ventes
  -- ======================================================================
  IF 'ventes' = ANY(p_categories) THEN
    -- Supprimer les paiements lies aux ventes de cet etablissement
    DELETE FROM paiements
    WHERE vente_id IN (SELECT id FROM ventes WHERE etablissement_id = p_etablissement_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('paiements', v_count);

    -- Supprimer les supplements des lignes de vente
    DELETE FROM lignes_vente_supplements
    WHERE ligne_vente_id IN (
      SELECT lv.id FROM lignes_vente lv
      INNER JOIN ventes v ON v.id = lv.vente_id
      WHERE v.etablissement_id = p_etablissement_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('lignes_vente_supplements', v_count);

    -- Supprimer les lignes de vente
    DELETE FROM lignes_vente
    WHERE vente_id IN (SELECT id FROM ventes WHERE etablissement_id = p_etablissement_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('lignes_vente', v_count);

    -- Supprimer les livraisons liees aux ventes
    DELETE FROM livraisons
    WHERE vente_id IN (SELECT id FROM ventes WHERE etablissement_id = p_etablissement_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('livraisons', v_count);

    -- Supprimer les paiements mobiles lies aux ventes
    DELETE FROM paiements_mobile
    WHERE vente_id IN (SELECT id FROM ventes WHERE etablissement_id = p_etablissement_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('paiements_mobile', v_count);

    -- Supprimer les rapports Z
    DELETE FROM rapports_z
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('rapports_z', v_count);

    -- Supprimer les sync_keys
    DELETE FROM sync_keys
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('sync_keys', v_count);

    -- Supprimer les ventes
    DELETE FROM ventes
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('ventes', v_count);

    -- Supprimer les sessions de caisse
    DELETE FROM sessions_caisse
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('sessions_caisse', v_count);
  END IF;

  -- ======================================================================
  -- MOUVEMENTS DE STOCK
  -- ======================================================================
  IF 'stocks' = ANY(p_categories) THEN
    DELETE FROM mouvements_stock
    WHERE produit_id IN (SELECT id FROM produits WHERE etablissement_id = p_etablissement_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('mouvements_stock', v_count);
  END IF;

  -- ======================================================================
  -- CLIENTS (apres ventes car FK client_id sur ventes)
  -- ======================================================================
  IF 'clients' = ANY(p_categories) THEN
    DELETE FROM clients
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('clients', v_count);
  END IF;

  -- ======================================================================
  -- PRODUITS : supplements_produits -> produits
  -- ======================================================================
  IF 'produits' = ANY(p_categories) THEN
    -- Supprimer les supplements des produits
    DELETE FROM supplements_produits
    WHERE produit_id IN (SELECT id FROM produits WHERE etablissement_id = p_etablissement_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('supplements_produits', v_count);

    -- Supprimer les produits
    DELETE FROM produits
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('produits', v_count);
  END IF;

  -- ======================================================================
  -- CATEGORIES (apres produits car FK categorie_id sur produits)
  -- ======================================================================
  IF 'categories' = ANY(p_categories) THEN
    DELETE FROM categories
    WHERE etablissement_id = p_etablissement_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('categories', v_count);
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'deleted', v_deleted,
    'timestamp', NOW()
  )::JSON;
END;
$$;

COMMENT ON FUNCTION reset_data_transactional(UUID, TEXT[]) IS
'Supprime selectivement les donnees metier dans une transaction atomique.
Categories supportees: ventes, stocks, clients, produits, categories.
Respecte l''ordre des FK pour eviter les violations de contraintes.';

-- ============================================================================
-- PERMISSIONS : Accorder l'execution aux utilisateurs authentifies
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_kpi_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ca_by_period(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_produits(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_paiements_stats_by_mode(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_peak_hours(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_data_transactional(UUID, TEXT[]) TO authenticated;
