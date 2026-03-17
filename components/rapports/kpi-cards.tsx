"use client";

/**
 * KPICards - Cartes d'indicateurs cles de performance
 * Affiche les KPIs principaux du dashboard rapports
 */

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Percent,
} from "lucide-react";
import { Flex, Grid, Text, Skeleton } from "@radix-ui/themes";
import { formatCurrency } from "@/lib/utils";
import type { KPIs } from "@/actions/rapports";

interface KPICardsProps {
  kpis: KPIs | null;
  isLoading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number | null;
  trendLabel?: string;
  color: "violet" | "blue" | "green" | "purple" | "amber" | "cyan";
  isLoading?: boolean;
}

function KPICard({
  title,
  value,
  icon,
  trend,
  trendLabel = "vs. periode prec.",
  color,
  isLoading,
}: KPICardProps) {
  const colorMap = {
    violet: "var(--accent-9)",
    blue: "var(--blue-9)",
    green: "var(--green-9)",
    purple: "var(--purple-9)",
    amber: "var(--purple-9)",
    cyan: "var(--cyan-9)",
  };

  const bgColorMap = {
    violet: "var(--accent-a3)",
    blue: "var(--blue-a3)",
    green: "var(--green-a3)",
    purple: "var(--purple-a3)",
    amber: "var(--purple-a3)",
    cyan: "var(--cyan-a3)",
  };

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 12,
          padding: 20,
          border: "1px solid var(--gray-a6)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Flex justify="between" align="start" mb="4">
          <Skeleton width="100px" height="16px" />
          <Skeleton width="48px" height="48px" style={{ borderRadius: 12 }} />
        </Flex>
        <Skeleton width="120px" height="32px" mb="3" />
        <Skeleton width="80px" height="14px" />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-solid)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid var(--gray-a6)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <Flex justify="between" align="start" mb="4">
        <Text size="2" weight="medium" color="gray">
          {title}
        </Text>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: bgColorMap[color],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colorMap[color],
          }}
        >
          {icon}
        </div>
      </Flex>

      <Text
        size="8"
        weight="bold"
        style={{
          display: "block",
          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
          marginBottom: trend !== null && trend !== undefined ? 12 : 0,
        }}
      >
        {value}
      </Text>

      {trend !== null && trend !== undefined && (
        <Flex align="center" gap="2">
          <Flex
            align="center"
            gap="1"
            style={{
              color: trend >= 0 ? "var(--green-9)" : "var(--red-9)",
            }}
          >
            {trend >= 0 ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <Text size="2" weight="medium">
              {trend >= 0 ? "+" : ""}
              {trend}%
            </Text>
          </Flex>
          <Text size="2" color="gray">
            {trendLabel}
          </Text>
        </Flex>
      )}
    </div>
  );
}

export function KPICards({ kpis, isLoading }: KPICardsProps) {
  if (isLoading || !kpis) {
    return (
      <Grid columns={{ initial: "1", sm: "2", lg: "3", xl: "6" }} gap="4">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICard
            key={i}
            title=""
            value=""
            icon={null}
            color="violet"
            isLoading
          />
        ))}
      </Grid>
    );
  }

  return (
    <Grid columns={{ initial: "1", sm: "2", lg: "3", xl: "6" }} gap="4">
      <KPICard
        title="CA du jour"
        value={formatCurrency(kpis.caJour)}
        icon={<DollarSign size={24} />}
        trend={kpis.comparaisonJour}
        trendLabel="vs. hier"
        color="violet"
      />

      <KPICard
        title="CA de la semaine"
        value={formatCurrency(kpis.caSemaine)}
        icon={<DollarSign size={24} />}
        trend={kpis.comparaisonSemaine}
        trendLabel="vs. sem. prec."
        color="blue"
      />

      <KPICard
        title="CA du mois"
        value={formatCurrency(kpis.caMois)}
        icon={<DollarSign size={24} />}
        trend={kpis.comparaisonMois}
        trendLabel="vs. mois prec."
        color="green"
      />

      <KPICard
        title="Ventes du jour"
        value={kpis.nombreVentes.toString()}
        icon={<Receipt size={24} />}
        color="purple"
      />

      <KPICard
        title="Panier moyen"
        value={formatCurrency(kpis.panierMoyen)}
        icon={<ShoppingCart size={24} />}
        color="amber"
      />

      <KPICard
        title="Marge brute"
        value={kpis.margeBrute !== null ? `${kpis.margeBrute}%` : "N/A"}
        icon={<Percent size={24} />}
        color="cyan"
      />
    </Grid>
  );
}
