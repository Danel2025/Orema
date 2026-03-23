-- ============================================================================
-- Migration: Fonctions RLS, triggers updated_at et activation RLS
-- Date: 2026-01-01
-- Description: Cree les fonctions helpers pour Row Level Security,
--              les triggers de mise a jour automatique de updated_at,
--              active RLS sur toutes les tables,
--              et la fonction generate_numero_ticket avec advisory lock.
-- ============================================================================

-- ============================================================================
-- FONCTION: set_rls_context
-- Definit le contexte utilisateur dans les variables de session PostgreSQL
-- pour l'authentification PIN-based et RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_rls_context(
  p_user_id TEXT,
  p_etablissement_id TEXT,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.user_id', p_user_id, true);
  PERFORM set_config('app.etablissement_id', p_etablissement_id, true);
  PERFORM set_config('app.user_role', p_role, true);
END;
$$;

COMMENT ON FUNCTION public.set_rls_context(TEXT, TEXT, TEXT) IS
'Definit le contexte RLS (user_id, etablissement_id, role) dans les variables de session PostgreSQL.
Utilise pour l''authentification PIN-based ou quand le contexte Supabase Auth n''est pas suffisant.';

-- ============================================================================
-- FONCTION: get_user_role
-- Retourne le role de l'utilisateur courant depuis les variables de session
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.user_role', true),
    ''
  );
END;
$$;

-- ============================================================================
-- FONCTION: get_user_id
-- Retourne l'UUID de l'utilisateur courant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := current_setting('app.user_id', true);
  IF v_id IS NULL OR v_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_id::UUID;
END;
$$;

-- ============================================================================
-- FONCTION: get_user_etablissement_id
-- Retourne l'UUID de l'etablissement de l'utilisateur courant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_etablissement_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := current_setting('app.etablissement_id', true);
  IF v_id IS NULL OR v_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_id::UUID;
END;
$$;

-- ============================================================================
-- FONCTION: is_super_admin
-- Verifie si l'utilisateur courant est SUPER_ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_role() = 'SUPER_ADMIN';
END;
$$;

-- ============================================================================
-- FONCTION: is_admin_or_manager
-- Verifie si l'utilisateur courant est SUPER_ADMIN, ADMIN ou MANAGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER');
END;
$$;

-- ============================================================================
-- TRIGGER FUNCTION: update_updated_at_column
-- Met a jour automatiquement la colonne updated_at avant chaque UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGERS: updated_at sur toutes les tables avec cette colonne
-- ============================================================================

-- etablissements
DO $$ BEGIN
  CREATE TRIGGER update_etablissements_updated_at
    BEFORE UPDATE ON public.etablissements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- utilisateurs
DO $$ BEGIN
  CREATE TRIGGER update_utilisateurs_updated_at
    BEFORE UPDATE ON public.utilisateurs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- imprimantes
DO $$ BEGIN
  CREATE TRIGGER update_imprimantes_updated_at
    BEFORE UPDATE ON public.imprimantes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- categories
DO $$ BEGIN
  CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- zones
DO $$ BEGIN
  CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON public.zones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- tables
DO $$ BEGIN
  CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON public.tables
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- produits
DO $$ BEGIN
  CREATE TRIGGER update_produits_updated_at
    BEFORE UPDATE ON public.produits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- clients
DO $$ BEGIN
  CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- sessions_caisse
DO $$ BEGIN
  CREATE TRIGGER update_sessions_caisse_updated_at
    BEFORE UPDATE ON public.sessions_caisse
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ventes
DO $$ BEGIN
  CREATE TRIGGER update_ventes_updated_at
    BEFORE UPDATE ON public.ventes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- lignes_vente
DO $$ BEGIN
  CREATE TRIGGER update_lignes_vente_updated_at
    BEFORE UPDATE ON public.lignes_vente
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- role_permissions
DO $$ BEGIN
  CREATE TRIGGER update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- paiements_mobile
DO $$ BEGIN
  CREATE TRIGGER update_paiements_mobile_updated_at
    BEFORE UPDATE ON public.paiements_mobile
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- livraisons
DO $$ BEGIN
  CREATE TRIGGER update_livraisons_updated_at
    BEFORE UPDATE ON public.livraisons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY sur TOUTES les tables
-- ============================================================================

ALTER TABLE public.etablissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imprimantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplements_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_vente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lignes_vente_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapports_z ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_mobile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livraisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_livraison ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FONCTION: generate_numero_ticket
-- Genere un numero de ticket unique au format YYYYMMDD00001
-- Utilise un advisory lock pour eviter les race conditions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_numero_ticket(p_etablissement_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_today DATE := CURRENT_DATE;
  v_date_prefix TEXT;
  v_current_date DATE;
  v_current_seq INTEGER;
  v_new_seq INTEGER;
  v_lock_key BIGINT;
BEGIN
  -- Calculer une cle de lock unique basee sur l'UUID de l'etablissement
  -- Utilise les 8 premiers octets de l'UUID convertis en bigint
  v_lock_key := ('x' || replace(p_etablissement_id::TEXT, '-', ''))::BIT(64)::BIGINT;

  -- Prendre un advisory lock transactionnel pour eviter les race conditions
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Lire les valeurs actuelles
  SELECT date_numero_ticket, dernier_numero_ticket
  INTO v_current_date, v_current_seq
  FROM public.etablissements
  WHERE id = p_etablissement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Etablissement % non trouve', p_etablissement_id;
  END IF;

  -- Si la date a change, reinitialiser le compteur
  IF v_current_date IS NULL OR v_current_date < v_date_today THEN
    v_new_seq := 1;
  ELSE
    v_new_seq := v_current_seq + 1;
  END IF;

  -- Mettre a jour l'etablissement avec le nouveau numero
  UPDATE public.etablissements
  SET dernier_numero_ticket = v_new_seq,
      date_numero_ticket = v_date_today,
      updated_at = now()
  WHERE id = p_etablissement_id;

  -- Construire le numero de ticket: YYYYMMDD00001
  v_date_prefix := to_char(v_date_today, 'YYYYMMDD');
  RETURN v_date_prefix || lpad(v_new_seq::TEXT, 5, '0');
END;
$$;

COMMENT ON FUNCTION public.generate_numero_ticket(UUID) IS
'Genere un numero de ticket sequentiel unique au format YYYYMMDD00001.
Utilise un advisory lock transactionnel pour garantir l''unicite meme sous forte concurrence.
Le compteur est reinitialise chaque jour.';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
