"use client";

/**
 * Gestionnaire d'abonnement - Interface de gestion des plans
 * Cards des 4 plans, comparatif, changement de plan avec confirmation
 * Toggle mensuel/annuel, methode de paiement, historique paiements
 */

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
  Skeleton,
  SegmentedControl,
} from "@radix-ui/themes";
import {
  Crown,
  Rocket,
  Star,
  Sparkle,
  CheckCircle,
  ArrowRight,
  Warning,
  ArrowClockwise,
  Users,
  Package,
  ShoppingCart,
  Infinity as InfinityIcon,
  CreditCard,
  CurrencyCircleDollar,
  Clock,
  Receipt,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { PlanType, QuotaInfo, BillingCycle, PaymentInfo } from "../shared/types";
import {
  PLANS,
  getOrderedPlans,
  getPlanPrice as getConfigPlanPrice,
  getAnnualSavings as getConfigAnnualSavings,
  isPlanFree,
  type PlanSlug,
  type PlanConfig as CentralPlanConfig,
} from "@/lib/config/plans";

// ── Types ───────────────────────────────────────────────────────────────

export interface Abonnement {
  plan: PlanType;
  cycle: BillingCycle;
  dateDebut: string | Date;
  dateFin?: string | Date;
  statut: "actif" | "expire" | "annule";
  prixMensuel: number;
}

interface AbonnementManagerProps {
  etablissementId: string;
  currentPlan: Abonnement;
  quotas: QuotaInfo[];
  recentPayments?: PaymentInfo[];
  onChangePlan?: (newPlan: PlanType, cycle: BillingCycle) => Promise<void>;
  isLoading?: boolean;
}

// ── Plan UI Config (derives de lib/config/plans.ts) ─────────────────────

interface PlanUIConfig {
  name: string;
  description: string;
  icon: typeof Star;
  color: string;
  features: string[];
  recommended?: boolean;
  contactSales?: boolean;
}

/** Mapping UI par plan : icones, couleurs, features lisibles */
const planUIConfig: Record<PlanType, PlanUIConfig> = {
  essentiel: {
    name: PLANS.essentiel.nom,
    description: PLANS.essentiel.metadata.description,
    icon: Star,
    color: "gray",
    features: [
      "Caisse de base",
      "Rapport Z",
      "Gestion produits simple",
      "1 imprimante",
      "Support par email",
    ],
  },
  pro: {
    name: PLANS.pro.nom,
    description: PLANS.pro.metadata.description,
    icon: Rocket,
    color: "blue",
    recommended: !!PLANS.pro.metadata.badge,
    features: [
      "Toutes les fonctions Essentiel",
      "Gestion des tables",
      "Multi-imprimantes",
      "Gestion du stock",
      "Mode hors-ligne complet",
      "Rapports complets",
      "Mobile Money",
      "Support prioritaire",
    ],
  },
  business: {
    name: PLANS.business.nom,
    description: PLANS.business.metadata.description,
    icon: Crown,
    color: "orange",
    features: [
      "Toutes les fonctions Pro",
      "Rapports export (PDF, Excel)",
      `Jusqu'à ${PLANS.business.quotas.max_etablissements} établissements`,
      "API access",
      "Support telephonique",
    ],
  },
  enterprise: {
    name: PLANS.enterprise.nom,
    description: PLANS.enterprise.metadata.description,
    icon: Sparkle,
    color: "violet",
    contactSales: PLANS.enterprise.pricing.sur_devis,
    features: [
      "Toutes les fonctions Business",
      "Utilisateurs illimités",
      "Produits illimités",
      "Support dédié 24/7",
      "Formation sur site",
      "Personnalisation avancée",
      "SLA garanti",
    ],
  },
};

/** Construit les quotas UI a partir de la config centralisee */
function getPlanQuotasUI(slug: PlanType) {
  const plan = PLANS[slug];
  const isEnterprise = plan.pricing.sur_devis;
  return {
    utilisateurs: isEnterprise ? ("Illimite" as const) : plan.quotas.max_utilisateurs,
    produits: isEnterprise ? ("Illimite" as const) : plan.quotas.max_produits,
    ventesMois: isEnterprise ? ("Illimite" as const) : plan.quotas.max_ventes_mois,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getPlanPrice(slug: PlanType, cycle: BillingCycle): number {
  const plan = PLANS[slug];
  if (plan.pricing.sur_devis) return -1;
  return getConfigPlanPrice(slug, cycle);
}

function formatPlanPrice(slug: PlanType, cycle: BillingCycle): string {
  const plan = PLANS[slug];
  if (plan.pricing.sur_devis) return "Sur devis";
  const price = getPlanPrice(slug, cycle);
  if (price === 0) return "Gratuit";
  return formatCurrency(price);
}

function getAnnualSavingsPercent(slug: PlanType): number {
  const plan = PLANS[slug];
  if (plan.pricing.sur_devis || plan.pricing.mensuel === 0) return 0;
  const fullYear = plan.pricing.mensuel * 12;
  return Math.round(((fullYear - plan.pricing.annuel) / fullYear) * 100);
}

function formatPaymentMethodLabel(methode: string): string {
  switch (methode) {
    case "monetbil":
      return "Airtel Money";
    case "stripe":
      return "Carte bancaire";
    case "manuel":
      return "Manuel";
    default:
      return methode;
  }
}

function formatPaymentStatus(
  statut: string
): { label: string; color: "green" | "blue" | "red" | "gray" } {
  switch (statut) {
    case "complete":
      return { label: "Complété", color: "green" };
    case "en_attente":
      return { label: "En attente", color: "blue" };
    case "echoue":
      return { label: "Échoué", color: "red" };
    case "rembourse":
      return { label: "Remboursé", color: "gray" };
    default:
      return { label: statut, color: "gray" };
  }
}

// ── Quota Progress ──────────────────────────────────────────────────────

function QuotaProgressItem({ quota }: { quota: QuotaInfo }) {
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

// ── Plan Card ───────────────────────────────────────────────────────────

function PlanCard({
  plan,
  config,
  cycle,
  isCurrent,
  onSelect,
  isChanging,
}: {
  plan: PlanType;
  config: PlanUIConfig;
  cycle: BillingCycle;
  isCurrent: boolean;
  onSelect: (plan: PlanType) => void;
  isChanging: boolean;
}) {
  const Icon = config.icon;
  const savings = getAnnualSavingsPercent(plan);
  const quotas = getPlanQuotasUI(plan);

  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 14,
        border: isCurrent
          ? `2px solid var(--${config.color}-9)`
          : config.recommended
            ? `2px solid var(--${config.color}-7)`
            : "1px solid var(--gray-a4)",
        position: "relative",
        transition: "all 0.2s ease",
        boxShadow: config.recommended
          ? `0 4px 16px var(--${config.color}-a4)`
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Badge recommande */}
      {config.recommended && !isCurrent ? <Box
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Badge color={config.color as "orange"} variant="solid" size="1">
            Recommandé
          </Badge>
        </Box> : null}

      {/* Badge plan actuel */}
      {isCurrent ? <Box
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Badge color={config.color as "orange"} variant="solid" size="1">
            Plan actuel
          </Badge>
        </Box> : null}

      {/* Icone et nom */}
      <Flex direction="column" align="center" gap="3" mb="4" mt="1">
        <Flex
          align="center"
          justify="center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `var(--${config.color}-a3)`,
          }}
        >
          <Icon
            size={26}
            weight="duotone"
            style={{ color: `var(--${config.color}-9)` }}
          />
        </Flex>
        <Box style={{ textAlign: "center" }}>
          <Heading size="4" weight="bold">
            {config.name}
          </Heading>
          <Text size="2" color="gray">
            {config.description}
          </Text>
        </Box>
      </Flex>

      {/* Prix */}
      <Flex direction="column" align="center" gap="1" mb="4">
        <Flex align="baseline" justify="center" gap="1">
          <Text
            size="8"
            weight="bold"
            style={{
              fontFamily: "var(--font-google-sans-code), monospace",
              color: `var(--${config.color}-11)`,
            }}
          >
            {config.contactSales
              ? "Sur devis"
              : getPlanPrice(plan, cycle) === 0
                ? "0"
                : formatCurrency(getPlanPrice(plan, cycle)).replace(" FCFA", "")}
          </Text>
          {!config.contactSales && getPlanPrice(plan, cycle) > 0 && (
            <Text size="2" color="gray">
              FCFA/{cycle === "annuel" ? "an" : "mois"}
            </Text>
          )}
        </Flex>
        {cycle === "annuel" && savings > 0 && (
          <Badge color="green" variant="soft" size="1">
            -{savings}% vs mensuel
          </Badge>
        )}
      </Flex>

      <Separator size="4" mb="4" />

      {/* Quotas */}
      <Flex direction="column" gap="2" mb="4">
        <Flex align="center" gap="2">
          <Users size={14} weight="duotone" style={{ color: "var(--gray-9)" }} />
          <Text size="2">
            {quotas.utilisateurs === "Illimite" ? (
              <Flex align="center" gap="1" style={{ display: "inline-flex" }}>
                <InfinityIcon size={14} weight="bold" />
                Utilisateurs illimités
              </Flex>
            ) : (
              `${quotas.utilisateurs} utilisateurs`
            )}
          </Text>
        </Flex>
        <Flex align="center" gap="2">
          <Package size={14} weight="duotone" style={{ color: "var(--gray-9)" }} />
          <Text size="2">
            {quotas.produits === "Illimite" ? (
              <Flex align="center" gap="1" style={{ display: "inline-flex" }}>
                <InfinityIcon size={14} weight="bold" />
                Produits illimités
              </Flex>
            ) : (
              `${(quotas.produits as number).toLocaleString("fr-FR")} produits`
            )}
          </Text>
        </Flex>
        <Flex align="center" gap="2">
          <ShoppingCart size={14} weight="duotone" style={{ color: "var(--gray-9)" }} />
          <Text size="2">
            {quotas.ventesMois === "Illimite" ? (
              <Flex align="center" gap="1" style={{ display: "inline-flex" }}>
                <InfinityIcon size={14} weight="bold" />
                Ventes illimitées
              </Flex>
            ) : (
              `${(quotas.ventesMois as number).toLocaleString("fr-FR")} ventes/mois`
            )}
          </Text>
        </Flex>
      </Flex>

      <Separator size="4" mb="4" />

      {/* Features */}
      <Flex direction="column" gap="2" mb="5">
        {config.features.map((feature) => (
          <Flex key={feature} align="center" gap="2">
            <CheckCircle
              size={16}
              weight="fill"
              style={{ color: `var(--${config.color}-9)`, flexShrink: 0 }}
            />
            <Text size="2">{feature}</Text>
          </Flex>
        ))}
      </Flex>

      {/* Bouton */}
      {config.contactSales ? (
        <Button
          size="3"
          variant="outline"
          color="violet"
          style={{ width: "100%", cursor: "pointer" }}
          disabled={isCurrent}
        >
          {isCurrent ? "Plan actuel" : "Contacter les ventes"}
        </Button>
      ) : (
        <Button
          size="3"
          variant={isCurrent ? "soft" : config.recommended ? "solid" : "outline"}
          color={config.color as "orange" | "blue" | "gray" | "violet"}
          disabled={isCurrent || isChanging}
          onClick={() => onSelect(plan)}
          style={{
            width: "100%",
            cursor: isCurrent ? "default" : "pointer",
          }}
        >
          {isCurrent ? (
            "Plan actuel"
          ) : isChanging ? (
            <>
              <ArrowClockwise size={16} weight="bold" className="animate-spin" />
              Changement...
            </>
          ) : (
            <>
              Changer pour ce plan
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </Button>
      )}
    </Box>
  );
}

// ── Payment Method Section ──────────────────────────────────────────────

function PaymentMethodSection() {
  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 14,
        border: "1px solid var(--gray-a4)",
      }}
    >
      <Heading size="3" weight="bold" mb="4">
        Méthode de paiement
      </Heading>
      <Grid columns={{ initial: "1", sm: "2" }} gap="3">
        {/* Airtel Money */}
        <Box
          p="4"
          style={{
            borderRadius: 10,
            border: "1px solid var(--orange-a5)",
            background: "var(--orange-a2)",
          }}
        >
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--orange-a4)",
              }}
            >
              <CurrencyCircleDollar
                size={20}
                weight="duotone"
                style={{ color: "var(--orange-9)" }}
              />
            </Flex>
            <Box>
              <Text size="2" weight="bold" style={{ display: "block" }}>
                Airtel Money
              </Text>
              <Text size="1" color="gray">
                Paiement mobile via Monetbil
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Carte bancaire */}
        <Box
          p="4"
          style={{
            borderRadius: 10,
            border: "1px solid var(--blue-a5)",
            background: "var(--blue-a2)",
          }}
        >
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--blue-a4)",
              }}
            >
              <CreditCard
                size={20}
                weight="duotone"
                style={{ color: "var(--blue-9)" }}
              />
            </Flex>
            <Box>
              <Text size="2" weight="bold" style={{ display: "block" }}>
                Carte bancaire
              </Text>
              <Text size="1" color="gray">
                Visa, Mastercard via Stripe
              </Text>
            </Box>
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}

// ── Recent Payments Section ─────────────────────────────────────────────

function RecentPaymentsSection({ payments }: { payments: PaymentInfo[] }) {
  if (payments.length === 0) return null;

  return (
    <Box
      p="5"
      style={{
        background: "var(--color-background)",
        borderRadius: 14,
        border: "1px solid var(--gray-a4)",
      }}
    >
      <Flex align="center" justify="between" mb="4">
        <Heading size="3" weight="bold">
          Paiements récents
        </Heading>
        <Badge color="gray" variant="soft" size="1">
          {payments.length} dernier{payments.length > 1 ? "s" : ""}
        </Badge>
      </Flex>

      <Flex direction="column" gap="2">
        {payments.slice(0, 5).map((payment) => {
          const status = formatPaymentStatus(payment.statut);
          return (
            <Flex
              key={payment.id}
              align="center"
              justify="between"
              p="3"
              style={{
                borderRadius: 8,
                background: "var(--gray-a2)",
              }}
            >
              <Flex align="center" gap="3">
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background:
                      payment.methode === "monetbil"
                        ? "var(--orange-a3)"
                        : payment.methode === "stripe"
                          ? "var(--blue-a3)"
                          : "var(--gray-a3)",
                  }}
                >
                  {payment.methode === "monetbil" ? (
                    <CurrencyCircleDollar
                      size={16}
                      weight="duotone"
                      style={{ color: "var(--orange-9)" }}
                    />
                  ) : payment.methode === "stripe" ? (
                    <CreditCard
                      size={16}
                      weight="duotone"
                      style={{ color: "var(--blue-9)" }}
                    />
                  ) : (
                    <Receipt
                      size={16}
                      weight="duotone"
                      style={{ color: "var(--gray-9)" }}
                    />
                  )}
                </Flex>
                <Box>
                  <Text size="2" weight="medium" style={{ display: "block" }}>
                    {formatPaymentMethodLabel(payment.methode)}
                  </Text>
                  <Flex align="center" gap="2">
                    <Clock size={11} weight="bold" style={{ color: "var(--gray-8)" }} />
                    <Text size="1" color="gray">
                      {new Date(payment.dateCreation).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </Flex>
                </Box>
              </Flex>

              <Flex align="center" gap="3">
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), monospace",
                  }}
                >
                  {formatCurrency(payment.montant)}
                </Text>
                <Badge color={status.color} variant="soft" size="1">
                  {status.label}
                </Badge>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function AbonnementManager({
  etablissementId,
  currentPlan,
  quotas,
  recentPayments = [],
  onChangePlan,
  isLoading = false,
}: AbonnementManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    currentPlan.cycle || "mensuel"
  );

  const handleSelectPlan = (plan: PlanType) => {
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan || !onChangePlan) return;

    setIsChanging(true);
    try {
      await onChangePlan(selectedPlan, billingCycle);
      toast.success(
        `Plan changé vers ${planUIConfig[selectedPlan].name} avec succès`
      );
      setConfirmDialogOpen(false);
    } catch {
      toast.error("Erreur lors du changement de plan");
    } finally {
      setIsChanging(false);
    }
  };

  const currentConfig = planUIConfig[currentPlan.plan];
  const selectedConfig = selectedPlan ? planUIConfig[selectedPlan] : null;

  if (isLoading) {
    return (
      <Flex direction="column" gap="5">
        <Skeleton style={{ height: 80, borderRadius: 12 }} />
        <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 440, borderRadius: 14 }} />
          ))}
        </Grid>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="6">
      {/* Card plan actuel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Box
          p="5"
          style={{
            background: `linear-gradient(135deg, var(--${currentConfig.color}-a2), var(--${currentConfig.color}-a3))`,
            borderRadius: 14,
            border: `1px solid var(--${currentConfig.color}-a5)`,
          }}
        >
          <Flex
            align="center"
            justify="between"
            wrap="wrap"
            gap="4"
          >
            <Flex align="center" gap="4">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `var(--${currentConfig.color}-a4)`,
                }}
              >
                <currentConfig.icon
                  size={24}
                  weight="duotone"
                  style={{ color: `var(--${currentConfig.color}-9)` }}
                />
              </Flex>
              <Box>
                <Flex align="center" gap="2">
                  <Heading size="4" weight="bold">
                    Plan {currentConfig.name}
                  </Heading>
                  <Badge
                    color={
                      currentPlan.statut === "actif"
                        ? "green"
                        : currentPlan.statut === "expire"
                          ? "red"
                          : "gray"
                    }
                    variant="soft"
                    size="1"
                  >
                    {currentPlan.statut === "actif"
                      ? "Actif"
                      : currentPlan.statut === "expire"
                        ? "Expiré"
                        : "Annulé"}
                  </Badge>
                  <Badge color="gray" variant="outline" size="1">
                    {currentPlan.cycle === "annuel" ? "Annuel" : "Mensuel"}
                  </Badge>
                </Flex>
                <Flex align="center" gap="3" mt="1">
                  <Text size="2" color="gray">
                    Depuis le{" "}
                    {new Date(currentPlan.dateDebut).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                  {currentPlan.dateFin ? <>
                      <Text size="2" color="gray">
                        —
                      </Text>
                      <Text size="2" color="gray">
                        Expire le{" "}
                        {new Date(currentPlan.dateFin).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </Text>
                    </> : null}
                </Flex>
              </Box>
            </Flex>

            <Box style={{ textAlign: "right" }}>
              <Text
                size="6"
                weight="bold"
                style={{
                  fontFamily: "var(--font-google-sans-code), monospace",
                  display: "block",
                }}
              >
                {currentConfig.contactSales
                  ? "Sur devis"
                  : formatCurrency(currentPlan.prixMensuel)}
              </Text>
              <Text size="1" color="gray">
                {currentConfig.contactSales
                  ? ""
                  : currentPlan.cycle === "annuel"
                    ? "par an"
                    : "par mois"}
              </Text>
            </Box>
          </Flex>
        </Box>
      </motion.div>

      {/* Quotas en temps reel */}
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
            <Grid columns={{ initial: "1", md: "3" }} gap="5">
              {quotas.map((quota) => (
                <QuotaProgressItem key={quota.label} quota={quota} />
              ))}
            </Grid>
          </Box>
        </motion.div>
      )}

      {/* Méthodes de paiement */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        <PaymentMethodSection />
      </motion.div>

      {/* Historique des paiements recents */}
      {recentPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
        >
          <RecentPaymentsSection payments={recentPayments} />
        </motion.div>
      )}

      {/* Toggle mensuel/annuel + Grille des plans */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Flex align="center" justify="between" mb="4" wrap="wrap" gap="3">
          <Heading size="4" weight="bold">
            Plans disponibles
          </Heading>
          <SegmentedControl.Root
            value={billingCycle}
            onValueChange={(val) => setBillingCycle(val as BillingCycle)}
            size="2"
          >
            <SegmentedControl.Item value="mensuel">Mensuel</SegmentedControl.Item>
            <SegmentedControl.Item value="annuel">
              Annuel
              <Badge color="green" variant="soft" size="1" ml="2">
                -17%
              </Badge>
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>

        <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
          {(Object.entries(planUIConfig) as [PlanType, PlanUIConfig][]).map(
            ([plan, config], index) => (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.24 + index * 0.08 }}
              >
                <PlanCard
                  plan={plan}
                  config={config}
                  cycle={billingCycle}
                  isCurrent={currentPlan.plan === plan}
                  onSelect={handleSelectPlan}
                  isChanging={isChanging}
                />
              </motion.div>
            )
          )}
        </Grid>
      </motion.div>

      {/* Dialog de confirmation */}
      <Dialog.Root
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!isChanging) setConfirmDialogOpen(open);
        }}
      >
        <Dialog.Content maxWidth="480px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Warning
                size={20}
                weight="fill"
                style={{ color: "var(--amber-9)" }}
              />
              Confirmer le changement de plan
            </Flex>
          </Dialog.Title>

          <Dialog.Description size="2" mb="4">
            Vous êtes sur le point de changer le plan de cet établissement.
          </Dialog.Description>

          {selectedConfig ? <Box
              p="4"
              mb="4"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 10,
              }}
            >
              {/* Ancien plan */}
              <Flex align="center" justify="between" mb="3">
                <Flex align="center" gap="2">
                  <currentConfig.icon
                    size={18}
                    weight="duotone"
                    style={{ color: `var(--${currentConfig.color}-9)` }}
                  />
                  <Text size="2" weight="medium">
                    {currentConfig.name}
                  </Text>
                </Flex>
                <Text
                  size="2"
                  style={{
                    fontFamily: "var(--font-google-sans-code), monospace",
                  }}
                >
                  {formatPlanPrice(currentPlan.plan, billingCycle)}
                  {!currentConfig.contactSales && getPlanPrice(currentPlan.plan, billingCycle) > 0
                    ? `/${billingCycle === "annuel" ? "an" : "mois"}`
                    : ""}
                </Text>
              </Flex>

              <Flex justify="center" my="2">
                <ArrowRight
                  size={20}
                  weight="bold"
                  style={{
                    color: "var(--gray-8)",
                    transform: "rotate(90deg)",
                  }}
                />
              </Flex>

              {/* Nouveau plan */}
              <Flex align="center" justify="between">
                <Flex align="center" gap="2">
                  <selectedConfig.icon
                    size={18}
                    weight="duotone"
                    style={{ color: `var(--${selectedConfig.color}-9)` }}
                  />
                  <Text size="2" weight="bold">
                    {selectedConfig.name}
                  </Text>
                </Flex>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily: "var(--font-google-sans-code), monospace",
                    color: `var(--${selectedConfig.color}-11)`,
                  }}
                >
                  {formatPlanPrice(selectedPlan!, billingCycle)}
                  {!selectedConfig.contactSales && getPlanPrice(selectedPlan!, billingCycle) > 0
                    ? `/${billingCycle === "annuel" ? "an" : "mois"}`
                    : ""}
                </Text>
              </Flex>

              {/* Différence de prix */}
              {!selectedConfig.contactSales &&
                !currentConfig.contactSales &&
                selectedPlan &&
                getPlanPrice(selectedPlan, billingCycle) !==
                  getPlanPrice(currentPlan.plan, billingCycle) ? <>
                    <Separator size="4" my="3" />
                    <Flex align="center" justify="between">
                      <Text size="2" color="gray">
                        Différence {billingCycle === "annuel" ? "annuelle" : "mensuelle"}
                      </Text>
                      <Text
                        size="2"
                        weight="bold"
                        color={
                          getPlanPrice(selectedPlan, billingCycle) >
                          getPlanPrice(currentPlan.plan, billingCycle)
                            ? "red"
                            : "green"
                        }
                        style={{
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {getPlanPrice(selectedPlan, billingCycle) >
                        getPlanPrice(currentPlan.plan, billingCycle)
                          ? "+"
                          : "-"}
                        {formatCurrency(
                          Math.abs(
                            getPlanPrice(selectedPlan, billingCycle) -
                              getPlanPrice(currentPlan.plan, billingCycle)
                          )
                        )}
                      </Text>
                    </Flex>
                  </> : null}
            </Box> : null}

          <Callout.Root color="amber" variant="surface" mb="4">
            <Callout.Icon>
              <Warning size={16} weight="fill" />
            </Callout.Icon>
            <Callout.Text size="2">
              Le changement sera effectif immédiatement. Les quotas seront
              ajustés selon le nouveau plan.
            </Callout.Text>
          </Callout.Root>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button
                variant="soft"
                color="gray"
                disabled={isChanging}
              >
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              color="orange"
              onClick={handleConfirmChange}
              disabled={isChanging}
            >
              {isChanging ? (
                <>
                  <ArrowClockwise
                    size={14}
                    weight="bold"
                    className="animate-spin"
                  />
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
