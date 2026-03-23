-- Migration: Étendre audit_logs pour le super admin
-- Ajouter de nouvelles valeurs à l'enum ActionAudit pour supporter les actions admin
ALTER TYPE public."ActionAudit" ADD VALUE IF NOT EXISTS 'SUSPENSION';
ALTER TYPE public."ActionAudit" ADD VALUE IF NOT EXISTS 'REACTIVATION';
ALTER TYPE public."ActionAudit" ADD VALUE IF NOT EXISTS 'IMPERSONATION';
ALTER TYPE public."ActionAudit" ADD VALUE IF NOT EXISTS 'EXPORT';

-- Ajouter une colonne details JSONB pour stocker des métadonnées enrichies
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- RLS Policy : le SUPER_ADMIN peut lire TOUS les audit_logs (cross-établissement)
CREATE POLICY audit_logs_select_super_admin
  ON public.audit_logs
  FOR SELECT
  USING (is_super_admin());

-- RLS Policy : le SUPER_ADMIN peut insérer des audit_logs pour n'importe quel établissement
CREATE POLICY audit_logs_insert_super_admin
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (is_super_admin());

-- Index sur la colonne details pour les requêtes JSONB (GIN)
CREATE INDEX idx_audit_logs_details ON public.audit_logs USING GIN (details);

-- Commentaires
COMMENT ON COLUMN public.audit_logs.details IS 'Métadonnées enrichies au format JSONB (IP, user agent, données avant/après, etc.)';
