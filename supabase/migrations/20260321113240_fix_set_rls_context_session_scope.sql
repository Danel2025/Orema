-- ============================================================================
-- Migration: Correction de set_rls_context - scope session au lieu de transaction
-- Date: 2026-03-21
-- Description: Corrige l'erreur "new row violates row-level security policy
--              for table 'zones'" causee par la perte du contexte RLS entre
--              les appels HTTP Supabase.
--
-- Cause racine: set_rls_context utilisait set_config(..., true) ce qui lie
-- les variables a la transaction courante. Le client Supabase JS execute
-- chaque requete comme une requete HTTP distincte (via PostgREST), donc
-- chaque appel est une transaction separee et le contexte RLS est perdu
-- avant que l'INSERT/UPDATE/DELETE ne s'execute.
--
-- Correction: Passer le 3eme parametre de set_config a false pour que
-- les variables persistent au niveau de la session (connexion).
--
-- Impact: Affecte toutes les tables avec RLS (zones, tables, categories,
-- produits, ventes, clients, etc.) - pas seulement zones.
--
-- Rollback: Remettre set_config(..., true) dans set_rls_context
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
  -- false = session-level (persiste pour toute la connexion)
  -- true  = transaction-level (perdu apres chaque requete HTTP via PostgREST)
  PERFORM set_config('app.user_id', p_user_id, false);
  PERFORM set_config('app.etablissement_id', p_etablissement_id, false);
  PERFORM set_config('app.user_role', p_role, false);
END;
$$;

COMMENT ON FUNCTION public.set_rls_context(TEXT, TEXT, TEXT) IS
'Definit le contexte RLS (user_id, etablissement_id, role) dans les variables de session PostgreSQL.
Utilise set_config(..., false) pour persister au niveau session, car le client Supabase JS
execute chaque requete dans une transaction separee via PostgREST.';
