"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Badge,
  Button,
  Dialog,
  Separator,
  Callout,
} from "@radix-ui/themes";
import {
  Star,
  Rocket,
  Crown,
  Sparkle,
  CheckCircle,
  ArrowRight,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  PLANS,
  getOrderedPlans,
  getPlanMonthlyPrice,
  canUpgrade,
  canDowngrade,
  hasTrial,
  isPlanFree,
  type PlanSlug,
  type BillingCycle,
  type PlanConfig,
} from "@/lib/config/plans";
import { BillingToggle } from "./billing-toggle";

// ── Types ──────────────────────────────────────────────────────────────

interface PlanSelectorProps {
  currentPlan: PlanSlug;
  currentCycle: BillingCycle;
  onChangePlan?: (plan: PlanSlug, cycle: BillingCycle) => Promise<void>;
}

// ── Icons & Colors ─────────────────────────────────────────────────────

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

// ── Plan Card ──────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cycle,
  isCurrent,
  onSelect,
  isChanging,
}: {
  plan: PlanConfig;
  cycle: BillingCycle;
  isCurrent: boolean;
  onSelect: (slug: PlanSlug) => void;
  isChanging: boolean;
}) {
  const Icon = PLAN_ICONS[plan.slug];
  const color = PLAN_COLORS[plan.slug];
  const isRecommended = !!plan.metadata.badge && !isCurrent;
  const monthlyPrice = getPlanMonthlyPrice(plan.slug, cycle);

  // Build feature labels for this plan
  const featureLabels = getFeatureLabels(plan);

  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 14,
        border: isCurrent
          ? `2px solid var(--${color}-9)`
          : isRecommended
            ? `2px solid var(--${color}-7)`
            : "1px solid var(--gray-a4)",
        position: "relative",
        transition: "all 0.2s ease",
        boxShadow: isRecommended
          ? `0 4px 16px var(--${color}-a4)`
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Badge */}
      {(isRecommended || isCurrent) ? <Box
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Badge color={color as "orange"} variant="solid" size="1">
            {isCurrent ? "Plan actuel" : "Recommandé"}
          </Badge>
        </Box> : null}

      {/* Icon & name */}
      <Flex direction="column" align="center" gap="3" mb="4" mt="1">
        <Flex
          align="center"
          justify="center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `var(--${color}-a3)`,
          }}
        >
          <Icon
            size={26}
            weight="duotone"
            style={{ color: `var(--${color}-9)` }}
          />
        </Flex>
        <Box style={{ textAlign: "center" }}>
          <Heading size="4" weight="bold">
            {plan.nom}
          </Heading>
          <Text size="2" color="gray">
            {plan.metadata.description}
          </Text>
        </Box>
      </Flex>

      {/* Price */}
      <Flex align="baseline" justify="center" gap="1" mb="4">
        <Text
          size="8"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), monospace",
            color: `var(--${color}-11)`,
          }}
        >
          {plan.pricing.sur_devis
            ? "Devis"
            : monthlyPrice === 0
              ? "0"
              : new Intl.NumberFormat("fr-GA").format(monthlyPrice)}
        </Text>
        <Text size="2" color="gray">
          {plan.pricing.sur_devis ? "" : monthlyPrice === 0 ? "" : "FCFA/mois"}
        </Text>
      </Flex>

      {/* Trial badge */}
      {hasTrial(plan.slug) && !isCurrent && (
        <Flex justify="center" mb="3">
          <Text
            size="1"
            style={{
              color: "var(--green-11)",
              backgroundColor: "var(--green-a3)",
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Essai gratuit {plan.metadata.essai_gratuit_jours}j
          </Text>
        </Flex>
      )}

      <Separator size="4" mb="4" />

      {/* Features */}
      <Flex direction="column" gap="2" mb="5">
        {featureLabels.map((feature) => (
          <Flex key={feature} align="center" gap="2">
            <CheckCircle
              size={16}
              weight="fill"
              style={{ color: `var(--${color}-9)`, flexShrink: 0 }}
            />
            <Text size="2">{feature}</Text>
          </Flex>
        ))}
      </Flex>

      {/* Button */}
      <Button
        size="3"
        variant={isCurrent ? "soft" : isRecommended ? "solid" : "outline"}
        color={color as "orange" | "blue" | "gray" | "violet"}
        disabled={isCurrent || isChanging}
        onClick={() => {
          if (plan.pricing.sur_devis) {
            window.location.href = "mailto:contact@orema.ga";
          } else {
            onSelect(plan.slug);
          }
        }}
        style={{
          width: "100%",
          cursor: isCurrent ? "default" : "pointer",
        }}
      >
        {isCurrent ? (
          "Plan actuel"
        ) : plan.pricing.sur_devis ? (
          "Nous contacter"
        ) : isChanging ? (
          <>
            <ArrowClockwise size={16} weight="bold" className="animate-spin" />
            Changement...
          </>
        ) : (
          <>
            Choisir ce plan
            <ArrowRight size={16} weight="bold" />
          </>
        )}
      </Button>
    </Box>
  );
}

// ── Feature Labels ─────────────────────────────────────────────────────

function getFeatureLabels(plan: PlanConfig): string[] {
  const { features, quotas } = plan;

  const labels: string[] = [];

  // Quotas
  if (quotas.max_utilisateurs >= 1000) {
    labels.push("Utilisateurs illimités");
  } else {
    labels.push(`${quotas.max_utilisateurs} utilisateurs`);
  }

  if (quotas.max_produits >= 100000) {
    labels.push("Produits illimités");
  } else {
    labels.push(`${quotas.max_produits.toLocaleString("fr-FR")} produits`);
  }

  if (quotas.max_etablissements >= 999) {
    labels.push("Établissements illimités");
  } else if (quotas.max_etablissements > 1) {
    labels.push(`${quotas.max_etablissements} établissements`);
  }

  // Features
  if (features.tables_salle) labels.push("Gestion des tables");
  if (features.multi_imprimantes) labels.push("Multi-imprimantes");
  if (features.stocks_avances) labels.push("Stocks avancés");
  if (features.mode_hors_ligne === "complet") labels.push("Mode hors-ligne complet");
  if (features.mobile_money) labels.push("Mobile Money");

  // Support
  const supportLabels: Record<string, string> = {
    email: "Support par email",
    prioritaire: "Support prioritaire",
    telephone: "Support téléphonique",
    dedie_24_7: "Support dédié 24/7",
  };
  labels.push(supportLabels[features.support]);

  // Rapports
  if (features.rapports === "complets_export") labels.push("Rapports export");
  if (features.rapports === "personnalises") labels.push("Rapports personnalisés");

  return labels;
}

// ── Main Component ─────────────────────────────────────────────────────

export function PlanSelector({
  currentPlan,
  currentCycle,
  onChangePlan,
}: PlanSelectorProps) {
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle);
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const plans = getOrderedPlans();

  const handleSelectPlan = (slug: PlanSlug) => {
    setSelectedPlan(slug);
    setConfirmDialogOpen(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan || !onChangePlan) return;

    setIsChanging(true);
    try {
      await onChangePlan(selectedPlan, cycle);
      toast.success(`Plan changé vers ${PLANS[selectedPlan].nom} avec succès`);
      setConfirmDialogOpen(false);
    } catch {
      toast.error("Erreur lors du changement de plan");
    } finally {
      setIsChanging(false);
    }
  };

  const currentConfig = PLANS[currentPlan];
  const selectedConfig = selectedPlan ? PLANS[selectedPlan] : null;
  const currentMonthly = getPlanMonthlyPrice(currentPlan, currentCycle);
  const selectedMonthly = selectedPlan ? getPlanMonthlyPrice(selectedPlan, cycle) : 0;

  return (
    <Flex direction="column" gap="5">
      {/* Header with toggle */}
      <Flex align="center" justify="between" wrap="wrap" gap="3">
        <Heading size="4" weight="bold">
          Plans disponibles
        </Heading>
        <BillingToggle cycle={cycle} onChange={setCycle} />
      </Flex>

      {/* Plans grid */}
      <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
          >
            <PlanCard
              plan={plan}
              cycle={cycle}
              isCurrent={currentPlan === plan.slug}
              onSelect={handleSelectPlan}
              isChanging={isChanging}
            />
          </motion.div>
        ))}
      </Grid>

      {/* Confirmation dialog */}
      <Dialog.Root
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!isChanging) setConfirmDialogOpen(open);
        }}
      >
        <Dialog.Content maxWidth="480px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Warning size={20} weight="fill" style={{ color: "var(--amber-9)" }} />
              Confirmer le changement de plan
            </Flex>
          </Dialog.Title>

          <Dialog.Description size="2" mb="4">
            Vous êtes sur le point de changer votre abonnement.
          </Dialog.Description>

          {selectedConfig ? <Box
              p="4"
              mb="4"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 10,
              }}
            >
              {/* Current plan */}
              <Flex align="center" justify="between" mb="3">
                <Flex align="center" gap="2">
                  {(() => {
                    const CIcon = PLAN_ICONS[currentPlan];
                    return (
                      <CIcon
                        size={18}
                        weight="duotone"
                        style={{ color: `var(--${PLAN_COLORS[currentPlan]}-9)` }}
                      />
                    );
                  })()}
                  <Text size="2" weight="medium">
                    {currentConfig.nom}
                  </Text>
                </Flex>
                <Text
                  size="2"
                  style={{
                    fontFamily: "var(--font-google-sans-code), monospace",
                  }}
                >
                  {currentMonthly === 0 ? "Gratuit" : `${formatCurrency(currentMonthly)}/mois`}
                </Text>
              </Flex>

              <Flex justify="center" my="2">
                <ArrowRight
                  size={20}
                  weight="bold"
                  style={{ color: "var(--gray-8)", transform: "rotate(90deg)" }}
                />
              </Flex>

              {/* New plan */}
              <Flex align="center" justify="between">
                <Flex align="center" gap="2">
                  {selectedPlan ? (() => {
                    const SIcon = PLAN_ICONS[selectedPlan];
                    return (
                      <SIcon
                        size={18}
                        weight="duotone"
                        style={{ color: `var(--${PLAN_COLORS[selectedPlan]}-9)` }}
                      />
                    );
                  })() : null}
                  <Text size="2" weight="bold">
                    {selectedConfig.nom}
                  </Text>
                </Flex>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), monospace",
                    color: selectedPlan ? `var(--${PLAN_COLORS[selectedPlan]}-11)` : undefined,
                  }}
                >
                  {selectedMonthly === 0 ? "Gratuit" : `${formatCurrency(selectedMonthly)}/mois`}
                </Text>
              </Flex>

              {/* Diff */}
              {selectedMonthly !== currentMonthly && (
                <>
                  <Separator size="4" my="3" />
                  <Flex align="center" justify="between">
                    <Text size="2" color="gray">
                      Différence mensuelle
                    </Text>
                    <Text
                      size="2"
                      weight="bold"
                      color={selectedMonthly > currentMonthly ? "red" : "green"}
                      style={{
                        fontFamily: "var(--font-google-sans-code), monospace",
                      }}
                    >
                      {selectedMonthly > currentMonthly ? "+" : "-"}
                      {formatCurrency(Math.abs(selectedMonthly - currentMonthly))}
                    </Text>
                  </Flex>
                </>
              )}
            </Box> : null}

          <Callout.Root color="amber" variant="surface" mb="4">
            <Callout.Icon>
              <Warning size={16} weight="fill" />
            </Callout.Icon>
            <Callout.Text size="2">
              {selectedPlan && canUpgrade(currentPlan, selectedPlan)
                ? "L'upgrade sera effectif immédiatement. Vous serez facturé au prorata."
                : "Le downgrade prendra effet à la fin de votre cycle de facturation actuel."}
            </Callout.Text>
          </Callout.Root>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isChanging}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button color="orange" onClick={handleConfirmChange} disabled={isChanging}>
              {isChanging ? (
                <>
                  <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                  Changement en cours...
                </>
              ) : (
                <>
                  <CheckCircle size={14} weight="fill" />
                  Confirmer le changement
                </>
              )}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
