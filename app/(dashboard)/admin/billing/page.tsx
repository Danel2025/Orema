/**
 * Page Billing Admin - Dashboard facturation & abonnements
 * Server Component avec Suspense pour le chargement des données
 */

import { Suspense } from "react";
import { Box, Flex, Skeleton } from "@radix-ui/themes";
import { BillingDashboardClient } from "./client";
import { getBillingDashboardData } from "@/actions/admin/billing-stats";

// ── Skeleton Loading ────────────────────────────────────────────────────

function BillingSkeleton() {
  return (
    <Flex direction="column" gap="6">
      {/* Header skeleton */}
      <Box>
        <Skeleton style={{ width: 320, height: 36, marginBottom: 8 }} />
        <Skeleton style={{ width: 400, height: 20 }} />
      </Box>

      {/* KPI skeleton */}
      <Flex gap="4" wrap="wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} style={{ flex: "1 1 200px" }}>
            <Skeleton style={{ height: 110, borderRadius: 12 }} />
          </Box>
        ))}
      </Flex>

      {/* Charts skeleton */}
      <Flex gap="5" direction={{ initial: "column", lg: "row" }}>
        <Box style={{ flex: 3 }}>
          <Skeleton style={{ height: 380, borderRadius: 12 }} />
        </Box>
        <Box style={{ flex: 2 }}>
          <Skeleton style={{ height: 380, borderRadius: 12 }} />
        </Box>
      </Flex>

      {/* Table skeleton */}
      <Skeleton style={{ height: 300, borderRadius: 12 }} />

      {/* Alerts skeleton */}
      <Skeleton style={{ height: 200, borderRadius: 12 }} />
    </Flex>
  );
}

// ── Error State ─────────────────────────────────────────────────────────

function BillingErrorState({ message }: { message?: string }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py="9"
      gap="3"
    >
      <Box
        p="5"
        role="alert"
        style={{
          background: "var(--red-a2)",
          borderRadius: 12,
          border: "1px solid var(--red-a4)",
          textAlign: "center",
        }}
      >
        <Box style={{ color: "var(--red-11)", fontSize: 14 }}>
          {message ?? "Impossible de charger les données de facturation"}
        </Box>
      </Box>
    </Flex>
  );
}

// ── Data Loader (Server Component) ──────────────────────────────────────

async function BillingDashboardLoader() {
  const result = await getBillingDashboardData();

  if (!result.success || !result.data) {
    return <BillingErrorState message={result.error} />;
  }

  return <BillingDashboardClient data={result.data} />;
}

// ── Page Component (Server Component) ───────────────────────────────────

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingDashboardLoader />
    </Suspense>
  );
}
