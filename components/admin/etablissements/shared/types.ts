/**
 * Types partagés pour les composants admin établissements
 */

import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { PlanSlug, BillingCycle as ConfigBillingCycle } from "@/lib/config/plans";

// ── Audit Timeline ──────────────────────────────────────────────────────

export type AuditActionType =
  | "creation"
  | "modification"
  | "suppression"
  | "connexion"
  | "deconnexion"
  | "suspension"
  | "reactivation"
  | "paiement"
  | "export"
  | "import"
  | "configuration"
  | "erreur";

export type AuditSeverity = "info" | "warning" | "danger" | "success";

export interface AuditEvent {
  id: string;
  actionType: AuditActionType;
  severity: AuditSeverity;
  description: string;
  utilisateur: {
    nom: string;
    avatar?: string;
  };
  timestamp: string | Date;
  metadata?: Record<string, unknown>;
}

// ── User Management ─────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  actif: boolean;
  derniereConnexion?: string | Date;
  avatar?: string;
}

// ── Subscription / Abonnement ───────────────────────────────────────────

export type PlanType = "essentiel" | "pro" | "business" | "enterprise";

export type BillingCycle = "mensuel" | "annuel";

export type PaymentMethodType = "monetbil" | "stripe" | "manuel";

export interface PaymentInfo {
  id: string;
  methode: PaymentMethodType;
  montant: number;
  devise: string;
  statut: "en_attente" | "complete" | "echoue" | "rembourse";
  reference?: string;
  dateCreation: string | Date;
  datePaiement?: string | Date;
}

// ── Quota ───────────────────────────────────────────────────────────────

export interface QuotaInfo {
  label: string;
  current: number;
  max: number;
  unit?: string;
  icon?: PhosphorIcon;
}

// ── Facture / Invoice ───────────────────────────────────────────────────

export type FactureStatut = "brouillon" | "envoyee" | "payee" | "annulee";

export interface Facture {
  id: string;
  numero: string;
  dateEmission: string | Date;
  dateEcheance: string | Date;
  montant: number;
  statut: FactureStatut;
  etablissementNom?: string;
}

// ── Notification ────────────────────────────────────────────────────────

export type NotificationType =
  | "quota_atteint"
  | "inactivite"
  | "expiration"
  | "erreur"
  | "info"
  | "alerte";

export interface NotificationAdmin {
  id: string;
  type: NotificationType;
  titre: string;
  message: string;
  timestamp: string | Date;
  lu: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ── Bulk Action ─────────────────────────────────────────────────────────

export interface BulkAction {
  label: string;
  icon: PhosphorIcon;
  onClick: () => void;
  color?: "red" | "green" | "blue" | "orange" | "gray";
}

// ── Status Indicator ────────────────────────────────────────────────────

export type EtablissementStatus = "actif" | "suspendu" | "en_essai";

// ── Comparison Chart ────────────────────────────────────────────────────

export interface EtablissementComparison {
  id: string;
  nom: string;
  data: Record<string, number>;
}
