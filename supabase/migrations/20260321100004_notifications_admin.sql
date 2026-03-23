-- Migration: Créer la table notifications_admin pour les alertes super admin
CREATE TABLE public.notifications_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL
    CHECK (type IN ('quota_atteint', 'inactivite', 'expiration', 'erreur', 'info', 'alerte')),
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  etablissement_id UUID REFERENCES public.etablissements(id) ON DELETE CASCADE,
  lu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_notifications_admin_lu ON public.notifications_admin(lu, created_at DESC);
CREATE INDEX idx_notifications_admin_type ON public.notifications_admin(type);
CREATE INDEX idx_notifications_admin_etablissement ON public.notifications_admin(etablissement_id);

-- Activer RLS
ALTER TABLE public.notifications_admin ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Seul le SUPER_ADMIN accède aux notifications admin
CREATE POLICY notifications_admin_select_super_admin
  ON public.notifications_admin FOR SELECT
  USING (is_super_admin());

CREATE POLICY notifications_admin_insert_super_admin
  ON public.notifications_admin FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY notifications_admin_update_super_admin
  ON public.notifications_admin FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY notifications_admin_delete_super_admin
  ON public.notifications_admin FOR DELETE
  USING (is_super_admin());

-- Commentaires
COMMENT ON TABLE public.notifications_admin IS 'Notifications destinées au super admin (quotas, expirations, alertes)';
COMMENT ON COLUMN public.notifications_admin.type IS 'Type de notification : quota_atteint, inactivite, expiration, erreur, info, alerte';
COMMENT ON COLUMN public.notifications_admin.lu IS 'Indique si la notification a été lue';
