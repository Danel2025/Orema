-- Migration: Fonction RPC atomique pour générer des numéros de ticket uniques
-- Résout la race condition lecture-increment-écriture dans generateNumeroTicket

CREATE OR REPLACE FUNCTION public.generate_numero_ticket(p_etablissement_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_date_str TEXT;
  v_last_date DATE;
  v_numero INTEGER;
BEGIN
  v_date_str := to_char(v_today, 'YYYYMMDD');

  -- Verrouiller la ligne de l'établissement pour empêcher les accès concurrents
  SELECT
    date_numero_ticket::date,
    dernier_numero_ticket
  INTO v_last_date, v_numero
  FROM etablissements
  WHERE id = p_etablissement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Etablissement % non trouvé', p_etablissement_id;
  END IF;

  -- Reset si nouveau jour, sinon incrémenter
  IF v_last_date IS NULL OR v_last_date < v_today THEN
    v_numero := 1;
  ELSE
    v_numero := COALESCE(v_numero, 0) + 1;
  END IF;

  -- Mettre à jour l'établissement
  UPDATE etablissements
  SET
    dernier_numero_ticket = v_numero,
    date_numero_ticket = v_today::timestamptz
  WHERE id = p_etablissement_id;

  -- Retourner le numéro formaté YYYYMMDD00001
  RETURN v_date_str || lpad(v_numero::text, 5, '0');
END;
$$;

-- Fonction RPC pour déduire le stock de manière transactionnelle
CREATE OR REPLACE FUNCTION public.deduire_stock_transactionnel(
  p_lignes JSONB, -- [{produit_id, quantite}]
  p_motif TEXT,
  p_reference TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ligne JSONB;
  v_produit RECORD;
  v_stock_avant INTEGER;
  v_stock_apres INTEGER;
BEGIN
  FOR v_ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    -- Verrouiller la ligne produit
    SELECT id, gerer_stock, stock_actuel
    INTO v_produit
    FROM produits
    WHERE id = (v_ligne->>'produit_id')::UUID
    FOR UPDATE;

    IF NOT FOUND OR NOT v_produit.gerer_stock OR v_produit.stock_actuel IS NULL THEN
      CONTINUE;
    END IF;

    v_stock_avant := v_produit.stock_actuel;
    v_stock_apres := v_stock_avant - (v_ligne->>'quantite')::INTEGER;

    -- Mettre à jour le stock
    UPDATE produits
    SET stock_actuel = v_stock_apres
    WHERE id = v_produit.id;

    -- Créer le mouvement de stock
    INSERT INTO mouvements_stock (type, quantite, quantite_avant, quantite_apres, motif, reference, produit_id)
    VALUES ('SORTIE', (v_ligne->>'quantite')::INTEGER, v_stock_avant, v_stock_apres, p_motif || ' - ' || p_reference, p_reference, v_produit.id);
  END LOOP;
END;
$$;
