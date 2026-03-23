"use client";

/**
 * Composant de statistiques d'un employe
 * Affiche les performances de vente
 */

import { useState, useEffect } from "react";
import { Dialog, Button, Flex, Text, Box, Grid, Skeleton, Badge } from "@radix-ui/themes";
import { ChartBar, ShoppingCart, TrendUp, CalendarBlank, Wallet } from "@phosphor-icons/react";

import { getEmployeStats } from "@/actions/employes";
import { formatCurrency } from "@/lib/design-system/currency";
import { ROLE_LABELS, ROLE_COLORS, type RoleType } from "@/schemas/employe";

interface EmployeeStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    nom: string;
    prenom: string;
    role: string;
  };
}

interface StatsData {
  totalVentes: number;
  chiffreAffaires: number;
  panierMoyen: number;
  ventesAujourdhui: number;
  caAujourdhui: number;
}

export function EmployeeStats({ open, onOpenChange, employee }: EmployeeStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadStats();
    }
  }, [open, employee.id]);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getEmployeStats(employee.id);
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || "Erreur lors du chargement des statistiques");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <ChartBar size={20} />
            Statistiques
          </Flex>
        </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          <Flex as="span" align="center" gap="2">
            <Text as="span">
              Performance de{" "}
              <Text as="span" weight="bold">
                {employee.prenom} {employee.nom}
              </Text>
            </Text>
            <Badge color={ROLE_COLORS[employee.role as RoleType]} variant="soft">
              {ROLE_LABELS[employee.role as RoleType]}
            </Badge>
          </Flex>
        </Dialog.Description>

        {error ? (
          <Flex align="center" justify="center" py="6" direction="column" gap="3">
            <Text color="red">{error}</Text>
            <Button variant="soft" onClick={loadStats}>
              Reessayer
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" gap="4">
            {/* Stats du jour */}
            <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
              <Flex align="center" gap="2" mb="3">
                <CalendarBlank size={16} style={{ color: "var(--accent-9)" }} />
                <Text size="2" weight="bold">
                  Aujourd'hui
                </Text>
              </Flex>

              <Grid columns="2" gap="4">
                <StatItem
                  icon={<ShoppingCart size={18} />}
                  label="Ventes"
                  value={isLoading ? null : stats?.ventesAujourdhui.toString() || "0"}
                  color="blue"
                />
                <StatItem
                  icon={<Wallet size={18} />}
                  label="Chiffre d'affaires"
                  value={isLoading ? null : formatCurrency(stats?.caAujourdhui || 0)}
                  color="green"
                />
              </Grid>
            </Box>

            {/* Stats globales */}
            <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
              <Flex align="center" gap="2" mb="3">
                <TrendUp size={16} style={{ color: "var(--accent-9)" }} />
                <Text size="2" weight="bold">
                  Historique global
                </Text>
              </Flex>

              <Grid columns="3" gap="4">
                <StatItem
                  icon={<ShoppingCart size={18} />}
                  label="Total ventes"
                  value={isLoading ? null : stats?.totalVentes.toString() || "0"}
                  color="blue"
                />
                <StatItem
                  icon={<Wallet size={18} />}
                  label="CA total"
                  value={isLoading ? null : formatCurrency(stats?.chiffreAffaires || 0)}
                  color="green"
                />
                <StatItem
                  icon={<TrendUp size={18} />}
                  label="Panier moyen"
                  value={isLoading ? null : formatCurrency(stats?.panierMoyen || 0)}
                  color="violet"
                />
              </Grid>
            </Box>

            {/* Indicateur de performance */}
            {stats && stats.totalVentes > 0 ? (
              <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
                <Text size="2" weight="bold" mb="2">
                  Indicateur de performance
                </Text>
                <PerformanceIndicator stats={stats} />
              </Box>
            ) : null}
          </Flex>
        )}

        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  color: "blue" | "green" | "violet" | "purple";
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  const colorMap = {
    blue: "var(--blue-9)",
    green: "var(--green-9)",
    violet: "var(--violet-9)",
    purple: "var(--purple-9)",
  };

  const bgColorMap = {
    blue: "var(--blue-a3)",
    green: "var(--green-a3)",
    violet: "var(--violet-a3)",
    purple: "var(--purple-a3)",
  };

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: bgColorMap[color],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colorMap[color],
          }}
        >
          {icon}
        </div>
        <Text size="1" color="gray">
          {label}
        </Text>
      </Flex>
      {value === null ? (
        <Skeleton height="28px" width="80px" />
      ) : (
        <Text
          size="5"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), monospace",
          }}
        >
          {value}
        </Text>
      )}
    </Flex>
  );
}

function PerformanceIndicator({ stats }: { stats: StatsData }) {
  // Calcul d'un score de performance simple
  // Base sur le nombre de ventes et le panier moyen
  const getPerformanceLevel = (): {
    label: string;
    color: "green" | "amber" | "red";
    description: string;
  } => {
    if (stats.totalVentes >= 100 && stats.panierMoyen >= 10000) {
      return {
        label: "Excellent",
        color: "green",
        description: "Performance remarquable avec un volume eleve et un bon panier moyen",
      };
    }
    if (stats.totalVentes >= 50 || stats.panierMoyen >= 5000) {
      return {
        label: "Bon",
        color: "amber",
        description: "Bonne performance generale",
      };
    }
    return {
      label: "En progression",
      color: "red",
      description: "Continuez vos efforts pour ameliorer vos performances",
    };
  };

  const performance = getPerformanceLevel();

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Badge color={performance.color} size="2">
          {performance.label}
        </Badge>
      </Flex>
      <Text size="1" color="gray">
        {performance.description}
      </Text>
    </Flex>
  );
}

/**
 * Composant compact pour afficher les stats dans une liste
 */
export function EmployeeStatsCompact({ employeeId }: { employeeId: string }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [employeeId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const result = await getEmployeStats(employeeId);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Flex gap="3">
        <Skeleton width="60px" height="16px" />
        <Skeleton width="80px" height="16px" />
      </Flex>
    );
  }

  if (!stats) return null;

  return (
    <Flex gap="3" align="center">
      <Text size="1" color="gray">
        <Text weight="medium">{stats.totalVentes}</Text> ventes
      </Text>
      <Text size="1" color="gray">
        CA: <Text weight="medium">{formatCurrency(stats.chiffreAffaires)}</Text>
      </Text>
    </Flex>
  );
}
