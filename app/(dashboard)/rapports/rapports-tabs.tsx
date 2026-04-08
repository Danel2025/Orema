"use client";

import { Suspense } from "react";
import { Box, Flex, Tabs, Skeleton, Grid } from "@radix-ui/themes";
import { ChartBar, TrendUp, Users, FileText, Receipt } from "@phosphor-icons/react";
import {
  CAChart,
  TopProducts,
  PeakHoursChart,
  PaymentModesChart,
  SalesByType,
  SalesByEmployee,
  RapportZDisplay,
  HistoriqueFactures,
} from "@/components/rapports";

function ChartLoading() {
  return <Skeleton height="400px" style={{ borderRadius: 12 }} />;
}

export function RapportsTabs() {
  return (
    <Tabs.Root defaultValue="dashboard">
      <Tabs.List mb="4">
        <Tabs.Trigger value="dashboard">
          <Flex align="center" gap="2">
            <ChartBar size={16} />
            Dashboard
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="factures">
          <Flex align="center" gap="2">
            <Receipt size={16} />
            Factures
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="ventes">
          <Flex align="center" gap="2">
            <TrendUp size={16} />
            Ventes
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="produits">
          <Flex align="center" gap="2">
            <ChartBar size={16} />
            Produits
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="employes">
          <Flex align="center" gap="2">
            <Users size={16} />
            Employes
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="rapports-z">
          <Flex align="center" gap="2">
            <FileText size={16} />
            Rapports Z
          </Flex>
        </Tabs.Trigger>
      </Tabs.List>

      {/* Dashboard */}
      <Tabs.Content value="dashboard">
        <Grid columns={{ initial: "1", lg: "2" }} gap="4">
          <Box style={{ gridColumn: "1 / -1" }}>
            <Suspense fallback={<ChartLoading />}>
              <CAChart />
            </Suspense>
          </Box>
          <Suspense fallback={<ChartLoading />}>
            <PeakHoursChart />
          </Suspense>
          <Suspense fallback={<ChartLoading />}>
            <PaymentModesChart />
          </Suspense>
        </Grid>
      </Tabs.Content>

      {/* Factures */}
      <Tabs.Content value="factures">
        <HistoriqueFactures />
      </Tabs.Content>

      {/* Ventes */}
      <Tabs.Content value="ventes">
        <Grid columns={{ initial: "1", lg: "2" }} gap="4">
          <Suspense fallback={<ChartLoading />}>
            <SalesByType />
          </Suspense>
          <Suspense fallback={<ChartLoading />}>
            <PaymentModesChart />
          </Suspense>
          <Box style={{ gridColumn: "1 / -1" }}>
            <Suspense fallback={<ChartLoading />}>
              <CAChart />
            </Suspense>
          </Box>
        </Grid>
      </Tabs.Content>

      {/* Produits */}
      <Tabs.Content value="produits">
        <Grid columns={{ initial: "1", lg: "2" }} gap="4">
          <Suspense fallback={<ChartLoading />}>
            <TopProducts />
          </Suspense>
          <Suspense fallback={<ChartLoading />}>
            <PeakHoursChart />
          </Suspense>
        </Grid>
      </Tabs.Content>

      {/* Employés */}
      <Tabs.Content value="employes">
        <Grid columns={{ initial: "1" }} gap="4">
          <Suspense fallback={<ChartLoading />}>
            <SalesByEmployee />
          </Suspense>
        </Grid>
      </Tabs.Content>

      {/* Rapports Z */}
      <Tabs.Content value="rapports-z">
        <Grid columns={{ initial: "1" }} gap="4">
          <Suspense fallback={<ChartLoading />}>
            <RapportZDisplay />
          </Suspense>
        </Grid>
      </Tabs.Content>
    </Tabs.Root>
  );
}
