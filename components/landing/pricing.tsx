"use client";

import { useState } from "react";
import { Box, Container, Flex, Grid, Heading, Text, Card } from "@radix-ui/themes";
import { Check, Minus, Star, Crown, Rocket, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";
import {
  PLANS,
  getOrderedPlans,
  getPlanMonthlyPrice,
  hasTrial,
  isPlanFree,
  type PlanConfig,
  type BillingCycle,
} from "@/lib/config/plans";
import { BillingToggle } from "@/components/parametres/abonnement/billing-toggle";

// ── Plan Icons ──────────────────────────────────────────────────────────

const PLAN_ICONS = {
  essentiel: Star,
  pro: Rocket,
  business: Crown,
  enterprise: Sparkle,
} as const;

// ── Price Display ───────────────────────────────────────────────────────

function PriceDisplay({ plan, cycle }: { plan: PlanConfig; cycle: BillingCycle }) {
  if (plan.pricing.sur_devis) {
    return (
      <Flex align="baseline" gap="2">
        <Text
          size="7"
          weight="bold"
          style={{
            color: "var(--gray-12)",
            fontFamily: "var(--font-google-sans-code), monospace",
            letterSpacing: "-0.02em",
          }}
        >
          Sur devis
        </Text>
      </Flex>
    );
  }

  if (isPlanFree(plan.slug)) {
    return (
      <Flex align="baseline" gap="2">
        <Text
          size="8"
          weight="bold"
          style={{
            color: "var(--gray-12)",
            fontFamily: "var(--font-google-sans-code), monospace",
            letterSpacing: "-0.02em",
          }}
        >
          Gratuit
        </Text>
      </Flex>
    );
  }

  const monthlyPrice = getPlanMonthlyPrice(plan.slug, cycle);
  const formattedPrice = new Intl.NumberFormat("fr-GA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monthlyPrice);

  return (
    <Flex align="baseline" gap="2">
      <AnimatePresence mode="wait">
        <motion.span
          key={`${plan.slug}-${cycle}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: "var(--font-size-8)",
            fontWeight: 700,
            color: "var(--gray-12)",
            fontFamily: "var(--font-google-sans-code), monospace",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {formattedPrice}
        </motion.span>
      </AnimatePresence>
      <Text size="2" style={{ color: "var(--gray-9)" }}>
        FCFA/mois
      </Text>
    </Flex>
  );
}

// ── Pricing Card ────────────────────────────────────────────────────────

function PricingCard({ plan, cycle }: { plan: PlanConfig; cycle: BillingCycle }) {
  const Icon = PLAN_ICONS[plan.slug];
  const isRecommended = !!plan.metadata.badge;

  // Build feature list for landing display
  const landingFeatures = getLandingFeatures(plan);

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <Card
        size="3"
        style={{
          height: "100%",
          border: isRecommended
            ? "2px solid var(--accent-7)"
            : "1px solid var(--gray-a4)",
          position: "relative",
        }}
      >
        <Flex direction="column" gap="5" style={{ height: "100%" }}>
          {/* Plan header */}
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Icon
                size={20}
                weight="duotone"
                style={{ color: `var(--${plan.slug === "essentiel" ? "gray" : plan.slug === "pro" ? "blue" : plan.slug === "business" ? "orange" : "violet"}-9)` }}
              />
              <Heading size="5">{plan.nom}</Heading>
              {isRecommended ? <Text
                  size="1"
                  weight="medium"
                  style={{
                    color: "var(--accent-11)",
                    backgroundColor: "var(--accent-a3)",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    letterSpacing: "0.02em",
                  }}
                >
                  Recommandé
                </Text> : null}
            </Flex>
            <Text size="2" style={{ color: "var(--gray-10)" }}>
              {plan.metadata.description}
            </Text>
          </Flex>

          {/* Price */}
          <PriceDisplay plan={plan} cycle={cycle} />

          {/* Trial badge */}
          {hasTrial(plan.slug) && (
            <Text
              size="1"
              style={{
                color: "var(--green-11)",
                backgroundColor: "var(--green-a3)",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                display: "inline-block",
                width: "fit-content",
              }}
            >
              Essai gratuit {plan.metadata.essai_gratuit_jours} jours
            </Text>
          )}

          {/* Divider */}
          <Box style={{ height: 1, background: "var(--gray-a4)" }} />

          {/* Features */}
          <Flex direction="column" gap="3" style={{ flex: 1 }}>
            {landingFeatures.map((feature, i) => (
              <Flex key={i} align="center" gap="3">
                {feature.included ? (
                  <Check
                    size={14}
                    weight="bold"
                    style={{ color: "var(--accent-9)", flexShrink: 0 }}
                  />
                ) : (
                  <Minus
                    size={14}
                    style={{ color: "var(--gray-7)", flexShrink: 0 }}
                  />
                )}
                <Text
                  size="2"
                  style={{
                    color: feature.included ? "var(--gray-12)" : "var(--gray-8)",
                  }}
                >
                  {feature.label}
                </Text>
              </Flex>
            ))}
          </Flex>

          {/* CTA */}
          <Link
            href={plan.pricing.sur_devis ? "mailto:contact@orema.ga" : plan.slug === "essentiel" ? "/register" : `/register?plan=${plan.slug}`}
            style={{
              textDecoration: "none",
              display: "block",
              width: "100%",
              padding: "12px 20px",
              borderRadius: 8,
              textAlign: "center",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              background: isRecommended ? "var(--accent-9)" : "transparent",
              color: isRecommended ? "white" : "var(--gray-12)",
              border: isRecommended ? "none" : "1px solid var(--gray-a6)",
              transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-9)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseEnter={(e) => {
              if (isRecommended) {
                e.currentTarget.style.backgroundColor = "var(--accent-10)";
              } else {
                e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                e.currentTarget.style.borderColor = "var(--gray-a8)";
              }
            }}
            onMouseLeave={(e) => {
              if (isRecommended) {
                e.currentTarget.style.backgroundColor = "var(--accent-9)";
              } else {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "var(--gray-a6)";
              }
            }}
          >
            {plan.pricing.sur_devis
              ? "Nous contacter"
              : hasTrial(plan.slug)
                ? `Essai gratuit ${plan.metadata.essai_gratuit_jours} jours`
                : "Commencer gratuitement"}
          </Link>
        </Flex>
      </Card>
    </div>
  );
}

// ── Landing Features Builder ────────────────────────────────────────────

function getLandingFeatures(plan: PlanConfig): { label: string; included: boolean }[] {
  const { features, quotas } = plan;

  if (plan.slug === "essentiel") {
    return [
      { label: `${quotas.max_utilisateurs} utilisateurs`, included: true },
      { label: `${quotas.max_produits} produits`, included: true },
      { label: "Caisse de base", included: true },
      { label: "Rapport journalier (Z)", included: true },
      { label: "Support par email", included: true },
      { label: "Gestion des tables", included: false },
      { label: "Multi-imprimantes", included: false },
      { label: "Stocks et inventaire", included: false },
      { label: "Mode hors-ligne complet", included: false },
    ];
  }

  if (plan.slug === "pro") {
    return [
      { label: `${quotas.max_utilisateurs} utilisateurs`, included: true },
      { label: `${quotas.max_produits} produits`, included: true },
      { label: "Gestion des tables", included: features.tables_salle },
      { label: "Multi-imprimantes", included: features.multi_imprimantes },
      { label: "Stocks et inventaire", included: features.stocks_avances },
      { label: "Mode hors-ligne complet", included: features.mode_hors_ligne === "complet" },
      { label: "Rapports complets", included: true },
      { label: "Mobile Money", included: features.mobile_money },
      { label: "Support prioritaire", included: true },
    ];
  }

  if (plan.slug === "business") {
    return [
      { label: `${quotas.max_utilisateurs} utilisateurs`, included: true },
      { label: `${quotas.max_produits.toLocaleString("fr-FR")} produits`, included: true },
      { label: `${quotas.max_etablissements} établissements`, included: true },
      { label: "Toutes les fonctionnalités Pro", included: true },
      { label: "Rapports export (PDF, Excel, CSV)", included: true },
      { label: "Support téléphonique", included: true },
    ];
  }

  // enterprise
  return [
    { label: "Utilisateurs illimités", included: true },
    { label: "Produits illimités", included: true },
    { label: "Établissements illimités", included: true },
    { label: "Toutes les fonctionnalités Business", included: true },
    { label: "Formation sur site", included: true },
    { label: "Support dédié 24/7", included: true },
    { label: "SLA garanti", included: true },
    { label: "Personnalisation avancée", included: true },
  ];
}

// ── Main Component ──────────────────────────────────────────────────────

export function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>("mensuel");
  const plans = getOrderedPlans();

  return (
    <Box id="pricing" py="9" style={{ background: "var(--gray-a2)" }}>
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="6">
            <Text
              size="2"
              weight="medium"
              style={{
                color: "var(--accent-11)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Tarifs
            </Text>

            <Heading size="8" align="center">
              Un prix adapté à chaque commerce
            </Heading>

            <Text
              size="3"
              align="center"
              style={{ color: "var(--gray-10)", maxWidth: 480 }}
            >
              Sans engagement. Changez ou annulez à tout moment. Tous les prix
              sont en FCFA hors taxes.
            </Text>
          </Flex>
        </FadeIn>

        {/* Billing Toggle */}
        <FadeIn delay={0.1}>
          <Flex mb="7" justify="center">
            <BillingToggle cycle={cycle} onChange={setCycle} />
          </Flex>
        </FadeIn>

        {/* Pricing Cards */}
        <StaggerContainer staggerDelay={0.12}>
          <Grid
            columns={{ initial: "1", sm: "2", lg: "4" }}
            gap="5"
            style={{ alignItems: "stretch" }}
          >
            {plans.map((plan) => (
              <StaggerItem key={plan.slug} style={{ height: "100%" }}>
                <PricingCard plan={plan} cycle={cycle} />
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>

        {/* Note */}
        <FadeIn delay={0.3}>
          <Text
            size="2"
            align="center"
            style={{
              display: "block",
              marginTop: 32,
              color: "var(--gray-9)",
            }}
          >
            Essai gratuit de 14 jours sur les plans Pro et Business. Aucune carte requise.
          </Text>
        </FadeIn>
      </Container>
    </Box>
  );
}
