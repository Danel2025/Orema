"use client";

import { Box, Flex, Grid, Text, Heading, Badge, Button } from "@radix-ui/themes";
import {
  Star,
  Rocket,
  Crown,
  Sparkle,
  Users,
  Package,
  ShoppingCart,
  Storefront,
  ArrowClockwise,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib/utils";
import {
  PLANS,
  getPlanMonthlyPrice,
  type PlanSlug,
  type BillingCycle,
} from "@/lib/config/plans";

// ── Types ──────────────────────────────────────────────────────────────

interface QuotaUsage {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

interface CurrentPlanCardProps {
  plan: PlanSlug;
  cycle: BillingCycle;
  statut: "actif" | "essai" | "expire" | "annule";
  dateDebut: string;
  dateFin?: string;
  quotas: QuotaUsage[];
}

// ── Plan Icons ─────────────────────────────────────────────────────────

const PLAN_ICONS = {
  essentiel: Star,
  pro: Rocket,
  business: Crown,
  enterprise: Sparkle,
} as const;

const PLAN_COLORS = {
  essentiel: "gray",
  pro: "blue",
  business: "orange",
  enterprise: "violet",
} as const;

// ── Quota Progress ─────────────────────────────────────────────────────

function QuotaProgress({ quota }: { quota: QuotaUsage }) {
  const percentage = quota.max > 0 ? Math.min((quota.current / quota.max) * 100, 100) : 0;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 95;

  const barColor = isDanger
    ? "var(--red-9)"
    : isWarning
      ? "var(--amber-9)"
      : "var(--accent-9)";

  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="medium">
          {quota.label}
        </Text>
        <Text
          size="2"
          style={{
            fontFamily: "var(--font-google-sans-code), monospace",
            color: isDanger ? "var(--red-11)" : "var(--gray-11)",
          }}
        >
          {quota.current.toLocaleString("fr-FR")} / {quota.max.toLocaleString("fr-FR")}
          {quota.unit ? ` ${quota.unit}` : ""}
        </Text>
      </Flex>
      <Box
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={quota.label}
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--gray-a4)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: 3,
            background: barColor,
          }}
        />
      </Box>
      {isDanger ? <Text size="1" color="red" mt="1" style={{ display: "block" }}>
          Quota presque atteint !
        </Text> : null}
    </Box>
  );
}

// ── Statut Badge ───────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: CurrentPlanCardProps["statut"] }) {
  const config = {
    actif: { color: "green" as const, label: "Actif" },
    essai: { color: "blue" as const, label: "Essai gratuit" },
    expire: { color: "red" as const, label: "Expiré" },
    annule: { color: "gray" as const, label: "Annulé" },
  };

  const { color, label } = config[statut];

  return (
    <Badge color={color} variant="soft" size="1">
      {label}
    </Badge>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function CurrentPlanCard({
  plan,
  cycle,
  statut,
  dateDebut,
  dateFin,
  quotas,
}: CurrentPlanCardProps) {
  const planConfig = PLANS[plan];
  const Icon = PLAN_ICONS[plan];
  const color = PLAN_COLORS[plan];
  const monthlyPrice = getPlanMonthlyPrice(plan, cycle);

  // Déterminer si le bouton "Renouveler" doit être affiché
  const showRenewButton = (() => {
    if (statut === "expire") return true;
    if (!dateFin) return false;
    const daysLeft = Math.ceil(
      (new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 7;
  })();

  return (
    <Flex direction="column" gap="5">
      {/* Plan info card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Box
          p="5"
          style={{
            background: `linear-gradient(135deg, var(--${color}-a2), var(--${color}-a3))`,
            borderRadius: 14,
            border: `1px solid var(--${color}-a5)`,
          }}
        >
          <Flex align="center" justify="between" wrap="wrap" gap="4">
            <Flex align="center" gap="4">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `var(--${color}-a4)`,
                }}
              >
                <Icon
                  size={24}
                  weight="duotone"
                  style={{ color: `var(--${color}-9)` }}
                />
              </Flex>
              <Box>
                <Flex align="center" gap="2">
                  <Heading size="4" weight="bold">
                    Plan {planConfig.nom}
                  </Heading>
                  <StatutBadge statut={statut} />
                </Flex>
                <Flex align="center" gap="3" mt="1">
                  <Text size="2" color="gray">
                    Depuis le{" "}
                    {new Date(dateDebut).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  {dateFin ? <>
                      <Text size="2" color="gray">
                        —
                      </Text>
                      <Text size="2" color="gray">
                        {statut === "essai" ? "Fin de l'essai" : "Renouvellement"} le{" "}
                        {new Date(dateFin).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                    </> : null}
                </Flex>
              </Box>
            </Flex>

            <Flex direction="column" align="end" gap="2">
              <Text
                size="6"
                weight="bold"
                style={{
                  fontFamily: "var(--font-google-sans-code), monospace",
                  display: "block",
                }}
              >
                {planConfig.pricing.sur_devis
                  ? "Sur devis"
                  : monthlyPrice === 0
                    ? "Gratuit"
                    : formatCurrency(monthlyPrice)}
              </Text>
              {monthlyPrice > 0 && (
                <Text size="1" color="gray">
                  par mois ({cycle === "annuel" ? "facturation annuelle" : "facturation mensuelle"})
                </Text>
              )}
              {showRenewButton && (
                <Button asChild variant="solid" size="2">
                  <Link href="/parametres/abonnement#plans">
                    <ArrowClockwise size={16} weight="bold" />
                    Renouveler
                  </Link>
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      </motion.div>

      {/* Quotas */}
      {quotas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <Box
            p="5"
            style={{
              background: "var(--color-background)",
              borderRadius: 14,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Heading size="3" weight="bold" mb="4">
              Utilisation des quotas
            </Heading>
            <Grid columns={{ initial: "1", md: "2" }} gap="5">
              {quotas.map((quota) => (
                <QuotaProgress key={quota.label} quota={quota} />
              ))}
            </Grid>
          </Box>
        </motion.div>
      )}
    </Flex>
  );
}
