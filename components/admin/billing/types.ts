/**
 * Re-export des types du backend billing
 * Source de vérité : lib/db/queries/billing-stats.ts et actions/admin/billing-stats.ts
 */

export type {
  BillingOverview,
  PlanDistribution,
  RevenueMonth,
  RecentPayment,
  ExpiringTrial,
  FailedPayment,
  QuotaAlert,
} from "@/lib/db/queries/billing-stats";

export type { BillingDashboardData } from "@/actions/admin/billing-stats";
