"use client";

/**
 * Client Component orchestrateur pour le dashboard billing
 * Reçoit les données du serveur et les distribue aux composants enfants
 */

import { Box, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { motion } from "motion/react";
import { KpiCards } from "@/components/admin/billing/kpi-cards";
import { RevenueChart } from "@/components/admin/billing/revenue-chart";
import { PlanDistributionChart } from "@/components/admin/billing/plan-distribution-chart";
import { RecentPaymentsTable } from "@/components/admin/billing/recent-payments-table";
import { AlertsSection } from "@/components/admin/billing/alerts-section";
import type { BillingDashboardData } from "@/components/admin/billing/types";

interface BillingDashboardClientProps {
  data: BillingDashboardData;
}

export function BillingDashboardClient({ data }: BillingDashboardClientProps) {
  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box mb="6">
          <Heading size="7" weight="bold" mb="1">
            Facturation & Abonnements
          </Heading>
          <Text size="2" color="gray">
            Vue d&apos;ensemble des revenus, abonnements et alertes de la plateforme
          </Text>
        </Box>
      </motion.div>

      <Flex direction="column" gap="6">
        {/* KPI Cards */}
        <KpiCards overview={data.overview} />

        {/* Charts : Revenue + Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Grid columns={{ initial: "1", lg: "3fr 2fr" }} gap="5">
            <RevenueChart data={data.revenue} />
            <PlanDistributionChart data={data.distribution} />
          </Grid>
        </motion.div>

        {/* Recent Payments Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <RecentPaymentsTable payments={data.payments} />
        </motion.div>

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <AlertsSection
            trials={data.trials}
            failed={data.failed}
            quotas={data.quotas}
          />
        </motion.div>
      </Flex>
    </Box>
  );
}
