"use server";

/**
 * Server Action pour le dashboard billing admin (SUPER_ADMIN)
 *
 * Agrege toutes les queries de billing-stats en un seul appel.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import {
  getBillingOverview,
  getPlanDistribution,
  getRevenueHistory,
  getRecentPayments,
  getExpiringTrials,
  getFailedPayments,
  getQuotaAlerts,
  type BillingOverview,
  type PlanDistribution,
  type RevenueMonth,
  type RecentPayment,
  type ExpiringTrial,
  type FailedPayment,
  type QuotaAlert,
} from "@/lib/db/queries/billing-stats";
import type { ActionResult } from "@/lib/action-types";

export interface BillingDashboardData {
  overview: BillingOverview;
  distribution: PlanDistribution[];
  revenue: RevenueMonth[];
  payments: RecentPayment[];
  trials: ExpiringTrial[];
  failed: FailedPayment[];
  quotas: QuotaAlert[];
}

/**
 * Recupere toutes les donnees du dashboard billing en un seul appel
 */
export async function getBillingDashboardData(): Promise<
  ActionResult<BillingDashboardData>
> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    const [overview, distribution, revenue, payments, trials, failed, quotas] =
      await Promise.all([
        getBillingOverview(supabase),
        getPlanDistribution(supabase),
        getRevenueHistory(supabase, 12),
        getRecentPayments(supabase, 20),
        getExpiringTrials(supabase, 7),
        getFailedPayments(supabase, 10),
        getQuotaAlerts(supabase, 80),
      ]);

    return {
      success: true,
      data: { overview, distribution, revenue, payments, trials, failed, quotas },
    };
  } catch (error) {
    console.error("[getBillingDashboardData] Erreur:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des données billing",
    };
  }
}
