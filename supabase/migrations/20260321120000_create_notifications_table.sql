-- ============================================================================
-- Migration: Table notifications
-- Date: 2026-03-21
-- Description: Cree la table notifications pour le centre de notifications
--              in-app avec support Realtime, et les policies RLS.
-- ============================================================================

-- ============================================================================
-- ENUM: TypeNotification
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "TypeNotification" AS ENUM (
    'COMMANDE',
    'STOCK',
    'TABLE',
    'PAIEMENT',
    'SYSTEME',
    'LIVRAISON',
    'CAISSE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLE: notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type "TypeNotification" NOT NULL DEFAULT 'SYSTEME',
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lue BOOLEAN NOT NULL DEFAULT FALSE,
  donnees JSONB DEFAULT '{}',
  lien TEXT,
  utilisateur_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur_lue
  ON public.notifications (utilisateur_id, lue, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_etablissement
  ON public.notifications (etablissement_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON public.notifications (type, created_at DESC);

-- ============================================================================
-- TRIGGER: updated_at automatique
-- ============================================================================

DO $$ BEGIN
  CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- RLS: Activer Row Level Security
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (
    utilisateur_id = auth.uid()
    OR utilisateur_id::text = COALESCE(current_setting('app.user_id', true), '')
  );

-- Policy: Les utilisateurs peuvent mettre a jour leurs propres notifications (marquer lue)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (
    utilisateur_id = auth.uid()
    OR utilisateur_id::text = COALESCE(current_setting('app.user_id', true), '')
  )
  WITH CHECK (
    utilisateur_id = auth.uid()
    OR utilisateur_id::text = COALESCE(current_setting('app.user_id', true), '')
  );

-- Policy: Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE
  USING (
    utilisateur_id = auth.uid()
    OR utilisateur_id::text = COALESCE(current_setting('app.user_id', true), '')
  );

-- Policy: Insertion via service role ou utilisateurs authentifies du meme etablissement
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT
  WITH CHECK (
    etablissement_id IN (
      SELECT e.id FROM public.etablissements e
      JOIN public.utilisateurs u ON u.etablissement_id = e.id
      WHERE u.id = auth.uid()
         OR u.id::text = COALESCE(current_setting('app.user_id', true), '')
    )
  );

-- ============================================================================
-- REALTIME: Activer la publication pour la table notifications
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON TABLE public.notifications IS
'Centre de notifications in-app. Chaque notification est liee a un utilisateur
et un etablissement. Types: COMMANDE, STOCK, TABLE, PAIEMENT, SYSTEME, LIVRAISON, CAISSE.';
