"use client";

/**
 * Section alertes du dashboard billing
 * 3 sous-sections : essais expirant, paiements échoués, quotas critiques
 */

import { Box, Flex, Grid, Heading, Text, Callout } from "@radix-ui/themes";
import { Warning, XCircle, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PLAN_LABELS, resolvePlanSlug } from "@/lib/config/plans";
import type { ExpiringTrial, FailedPayment, QuotaAlert } from "./types";

interface AlertsSectionProps {
  trials: ExpiringTrial[];
  failed: FailedPayment[];
  quotas: QuotaAlert[];
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    timeZone: "Africa/Libreville",
  }).format(date);
}

const QUOTA_LABELS: Record<string, string> = {
  utilisateurs: "Utilisateurs",
  produits: "Produits",
  ventes: "Ventes/mois",
};

export function AlertsSection({ trials, failed, quotas }: AlertsSectionProps) {
  const hasAlerts = trials.length > 0 || failed.length > 0 || quotas.length > 0;

  if (!hasAlerts) {
    return (
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Heading size="3" weight="bold" mb="4">
          Alertes
        </Heading>
        <Callout.Root color="green" variant="surface">
          <Callout.Icon>
            <CheckCircle size={16} weight="fill" />
          </Callout.Icon>
          <Callout.Text>
            Tout va bien ! Aucune alerte en cours.
          </Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 12,
        border: "1px solid var(--gray-a4)",
      }}
    >
      <Heading size="3" weight="bold" mb="4">
        Alertes
      </Heading>

      <Grid columns={{ initial: "1", lg: "3" }} gap="4">
        {/* Essais expirant */}
        <Box>
          <Callout.Root
            color="amber"
            variant="surface"
            style={{ height: "100%" }}
          >
            <Callout.Icon>
              <Warning size={16} weight="fill" />
            </Callout.Icon>
            <Callout.Text>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: 8 }}>
                Essais expirant bientôt ({trials.length})
              </Text>
              {trials.length === 0 ? (
                <Text size="2" color="gray">
                  Aucun essai proche de l&apos;expiration
                </Text>
              ) : (
                <Flex direction="column" gap="2">
                  {trials.map((trial) => (
                    <Link
                      key={trial.etablissementId}
                      href={`/admin/etablissements/${trial.etablissementId}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Flex
                        align="center"
                        justify="between"
                        p="2"
                        style={{
                          borderRadius: 6,
                          background: "var(--amber-a3)",
                          transition: "background 0.15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--amber-a4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--amber-a3)";
                        }}
                      >
                        <Box>
                          <Text size="2" weight="medium" style={{ display: "block" }}>
                            {trial.nom}
                          </Text>
                          <Text size="1" color="gray">
                            {PLAN_LABELS[resolvePlanSlug(trial.plan)]}
                          </Text>
                        </Box>
                        <Text
                          size="1"
                          weight="bold"
                          style={{
                            color:
                              trial.joursRestants <= 2
                                ? "var(--red-11)"
                                : "var(--amber-11)",
                          }}
                        >
                          {trial.joursRestants}j
                        </Text>
                      </Flex>
                    </Link>
                  ))}
                </Flex>
              )}
            </Callout.Text>
          </Callout.Root>
        </Box>

        {/* Paiements échoués */}
        <Box>
          <Callout.Root
            color="red"
            variant="surface"
            style={{ height: "100%" }}
          >
            <Callout.Icon>
              <XCircle size={16} weight="fill" />
            </Callout.Icon>
            <Callout.Text>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: 8 }}>
                Paiements échoués ({failed.length})
              </Text>
              {failed.length === 0 ? (
                <Text size="2" color="gray">
                  Aucun paiement échoué
                </Text>
              ) : (
                <Flex direction="column" gap="2">
                  {failed.map((payment) => (
                    <Link
                      key={payment.id}
                      href={`/admin/etablissements/${payment.etablissementId}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Flex
                        align="center"
                        justify="between"
                        p="2"
                        style={{
                          borderRadius: 6,
                          background: "var(--red-a3)",
                          transition: "background 0.15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--red-a4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--red-a3)";
                        }}
                      >
                        <Box>
                          <Text size="2" weight="medium" style={{ display: "block" }}>
                            {payment.etablissementNom}
                          </Text>
                          <Text size="1" color="gray">
                            {formatDateShort(payment.dateEchec)}
                          </Text>
                        </Box>
                        <Text
                          size="1"
                          weight="bold"
                          style={{
                            fontFamily: "var(--font-google-sans-code), monospace",
                            color: "var(--red-11)",
                          }}
                        >
                          {formatCurrency(payment.montant)}
                        </Text>
                      </Flex>
                    </Link>
                  ))}
                </Flex>
              )}
            </Callout.Text>
          </Callout.Root>
        </Box>

        {/* Quotas critiques */}
        <Box>
          <Callout.Root
            color={quotas.some((q) => q.pourcentage >= 95) ? "red" : "amber"}
            variant="surface"
            style={{ height: "100%" }}
          >
            <Callout.Icon>
              <Warning size={16} weight="fill" />
            </Callout.Icon>
            <Callout.Text>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: 8 }}>
                Quotas critiques ({quotas.length})
              </Text>
              {quotas.length === 0 ? (
                <Text size="2" color="gray">
                  Aucun quota critique
                </Text>
              ) : (
                <Flex direction="column" gap="2">
                  {quotas.map((alert) => (
                    <Link
                      key={`${alert.etablissementId}-${alert.quotaType}`}
                      href={`/admin/etablissements/${alert.etablissementId}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Box
                        p="2"
                        style={{
                          borderRadius: 6,
                          background:
                            alert.pourcentage >= 95
                              ? "var(--red-a3)"
                              : "var(--amber-a3)",
                          transition: "background 0.15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            alert.pourcentage >= 95
                              ? "var(--red-a4)"
                              : "var(--amber-a4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            alert.pourcentage >= 95
                              ? "var(--red-a3)"
                              : "var(--amber-a3)";
                        }}
                      >
                        <Flex align="center" justify="between" mb="1">
                          <Text size="2" weight="medium">
                            {alert.nom}
                          </Text>
                          <Text
                            size="1"
                            weight="bold"
                            style={{
                              color:
                                alert.pourcentage >= 95
                                  ? "var(--red-11)"
                                  : "var(--amber-11)",
                            }}
                          >
                            {alert.pourcentage}%
                          </Text>
                        </Flex>
                        <Text size="1" color="gray">
                          {QUOTA_LABELS[alert.quotaType] ?? alert.quotaType}:{" "}
                          {alert.utilisation.toLocaleString("fr-FR")}/
                          {alert.max.toLocaleString("fr-FR")}
                        </Text>
                      </Box>
                    </Link>
                  ))}
                </Flex>
              )}
            </Callout.Text>
          </Callout.Root>
        </Box>
      </Grid>
    </Box>
  );
}
