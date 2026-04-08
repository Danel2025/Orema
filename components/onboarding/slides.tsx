"use client";

import { Box, Flex, Heading, Text, Grid } from "@radix-ui/themes";
import {
  Heart,
  Monitor,
  ShoppingCart,
  CreditCard,
  GridFour,
  Package,
  ChartBar,
  WifiSlash,
  Users,
  Printer,
  CheckCircle,
  Rocket,
} from "@phosphor-icons/react";
import Image from "next/image";
import { motion } from "motion/react";

/* ==========================================================================
   Slide 1 — Bienvenue
   ========================================================================== */

function WelcomeSlide() {
  return (
    <Flex direction="column" align="center" justify="center" gap="6" style={{ textAlign: "center" }}>
      {/* Gradient orb background */}
      <Box
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 40%, var(--accent-a3) 0%, var(--accent-a1) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="/images/logos/ic-lg.webp"
          alt="Oréma N+"
          width={72}
          height={72}
          style={{ borderRadius: 16 }}
        />
      </motion.div>

      {/* Heartbeat icon */}
      <motion.div
        animate={{ scale: [1, 1.15, 1, 1.08, 1] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.14, 0.28, 0.42, 0.7],
        }}
      >
        <Heart size={64} weight="duotone" style={{ color: "var(--accent-9)" }} />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Heading
          size="8"
          weight="bold"
          align="center"
          style={{ letterSpacing: "-0.03em" }}
        >
          Bienvenue sur{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent-9), var(--orange-11))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Oréma N+
          </span>
        </Heading>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        style={{ maxWidth: 420 }}
      >
        <Text size="4" style={{ color: "var(--gray-10)", lineHeight: 1.7 }}>
          Le c&oelig;ur de votre commerce
        </Text>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        style={{ maxWidth: 440 }}
      >
        <Text size="3" style={{ color: "var(--gray-9)", lineHeight: 1.7 }}>
          Système de caisse moderne conçu pour les restaurants, bars et maquis au Gabon.
        </Text>
      </motion.div>
    </Flex>
  );
}

/* ==========================================================================
   Slide 2 — Caisse
   ========================================================================== */

const posFeatures = [
  {
    icon: Monitor,
    text: "Interface tactile intuitive — prise en main en 15 minutes",
    accent: "var(--blue-9)",
  },
  {
    icon: CreditCard,
    text: "Tous les paiements — Espèces, carte, Airtel Money, Moov Money",
    accent: "var(--green-9)",
  },
  {
    icon: Printer,
    text: "Impression automatique — tickets et bons de cuisine",
    accent: "var(--crimson-9)",
  },
];

function POSSlide() {
  return (
    <Flex direction="column" align="center" justify="center" gap="6" style={{ textAlign: "center" }}>
      {/* Animated icons row */}
      <Flex gap="5" align="center" justify="center">
        {[Monitor, ShoppingCart, CreditCard].map((Icon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2 + i * 0.15,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Flex
              align="center"
              justify="center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "var(--accent-a3)",
                border: "1px solid var(--accent-a5)",
              }}
            >
              <Icon size={28} weight="duotone" style={{ color: "var(--accent-9)" }} />
            </Flex>
          </motion.div>
        ))}
      </Flex>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Heading
          size="7"
          weight="bold"
          align="center"
          style={{ letterSpacing: "-0.03em" }}
        >
          Une caisse pensée pour la rapidité
        </Heading>
      </motion.div>

      {/* Bullet points */}
      <Flex direction="column" gap="4" style={{ maxWidth: 460, width: "100%" }}>
        {posFeatures.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.65 + i * 0.12,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Flex
                align="center"
                gap="4"
                p="4"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 12,
                  border: "1px solid var(--gray-a4)",
                  textAlign: "left",
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `color-mix(in srgb, ${feature.accent} 12%, transparent)`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} weight="duotone" style={{ color: feature.accent }} />
                </Flex>

                {/* Accent bar */}
                <Box
                  style={{
                    width: 3,
                    height: 28,
                    borderRadius: 2,
                    background: feature.accent,
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                />

                <Text size="2" style={{ color: "var(--gray-11)", lineHeight: 1.5 }}>
                  {feature.text}
                </Text>
              </Flex>
            </motion.div>
          );
        })}
      </Flex>
    </Flex>
  );
}

/* ==========================================================================
   Slide 3 — Fonctionnalités
   ========================================================================== */

const featureCards = [
  { icon: GridFour, label: "Plan de salle", accent: "var(--blue-9)" },
  { icon: Package, label: "Gestion des stocks", accent: "var(--green-9)" },
  { icon: ChartBar, label: "Rapports détaillés", accent: "var(--amber-9)" },
  { icon: WifiSlash, label: "Mode hors-ligne", accent: "var(--violet-9)" },
  { icon: Users, label: "Multi-employés", accent: "var(--cyan-9)" },
  { icon: Printer, label: "Multi-imprimantes", accent: "var(--crimson-9)" },
];

function FeaturesSlide() {
  return (
    <Flex direction="column" align="center" justify="center" gap="6" style={{ textAlign: "center" }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Heading
          size="7"
          weight="bold"
          align="center"
          style={{ letterSpacing: "-0.03em" }}
        >
          Tout ce dont vous avez besoin
        </Heading>
      </motion.div>

      {/* 2x3 Grid */}
      <Grid
        columns="2"
        gap="3"
        style={{ maxWidth: 400, width: "100%" }}
      >
        {featureCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3 + i * 0.1,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Flex
                direction="column"
                align="center"
                gap="3"
                py="5"
                px="3"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 14,
                  border: "1px solid var(--gray-a4)",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--gray-a6)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--gray-a4)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `color-mix(in srgb, ${card.accent} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${card.accent} 18%, transparent)`,
                  }}
                >
                  <Icon size={24} weight="duotone" style={{ color: card.accent }} />
                </Flex>
                <Text size="2" weight="medium" style={{ color: "var(--gray-11)" }}>
                  {card.label}
                </Text>
              </Flex>
            </motion.div>
          );
        })}
      </Grid>
    </Flex>
  );
}

/* ==========================================================================
   Slide 4 — Prérequis
   ========================================================================== */

const prerequisites = [
  {
    label: "Connexion internet (mode hors-ligne disponible)",
    required: true,
    color: "var(--green-9)",
  },
  {
    label: "Un écran (ordinateur, tablette ou écran tactile)",
    required: true,
    color: "var(--green-9)",
  },
  {
    label: "Imprimante thermique ESC/POS (optionnel)",
    required: false,
    color: "var(--accent-9)",
  },
];

function PrerequisitesSlide() {
  return (
    <Flex direction="column" align="center" justify="center" gap="6" style={{ textAlign: "center" }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Heading
          size="7"
          weight="bold"
          align="center"
          style={{ letterSpacing: "-0.03em" }}
        >
          Ce dont vous avez besoin
        </Heading>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Text size="3" style={{ color: "var(--gray-10)", lineHeight: 1.7 }}>
          Pour tirer le meilleur d&apos;Oréma N+
        </Text>
      </motion.div>

      {/* Checklist */}
      <Flex direction="column" gap="3" style={{ maxWidth: 460, width: "100%" }}>
        {prerequisites.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.45 + i * 0.12,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Flex
              align="center"
              gap="3"
              p="4"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 12,
                border: "1px solid var(--gray-a4)",
                textAlign: "left",
              }}
            >
              <CheckCircle
                size={24}
                weight="fill"
                style={{ color: item.color, flexShrink: 0 }}
              />

              <Flex direction="column" gap="1" style={{ flex: 1 }}>
                <Text size="2" style={{ color: "var(--gray-11)", lineHeight: 1.5 }}>
                  {item.label}
                </Text>
              </Flex>

              <Box
                style={{
                  padding: "2px 10px",
                  borderRadius: 20,
                  background: item.required
                    ? "color-mix(in srgb, var(--green-9) 12%, transparent)"
                    : "color-mix(in srgb, var(--accent-9) 12%, transparent)",
                  border: item.required
                    ? "1px solid color-mix(in srgb, var(--green-9) 20%, transparent)"
                    : "1px solid color-mix(in srgb, var(--accent-9) 20%, transparent)",
                  flexShrink: 0,
                }}
              >
                <Text
                  size="1"
                  weight="medium"
                  style={{
                    color: item.required ? "var(--green-11)" : "var(--accent-11)",
                  }}
                >
                  {item.required ? "Requis" : "Optionnel"}
                </Text>
              </Box>
            </Flex>
          </motion.div>
        ))}
      </Flex>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        style={{ maxWidth: 400 }}
      >
        <Text size="2" style={{ color: "var(--gray-9)", lineHeight: 1.6 }}>
          Pas de matériel spécifique requis — fonctionne sur n&apos;importe quel navigateur.
        </Text>
      </motion.div>
    </Flex>
  );
}

/* ==========================================================================
   Slide 5 — Démarrer
   ========================================================================== */

function StartSlide() {
  return (
    <Flex direction="column" align="center" justify="center" gap="6" style={{ textAlign: "center" }}>
      {/* Gradient orb */}
      <Box
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 60%, var(--accent-a3) 0%, var(--accent-a1) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Rocket animation — liftoff */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "var(--accent-a3)",
              border: "1px solid var(--accent-a5)",
            }}
          >
            <Rocket size={48} weight="duotone" style={{ color: "var(--accent-9)" }} />
          </Flex>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Heading
          size="8"
          weight="bold"
          align="center"
          style={{ letterSpacing: "-0.03em" }}
        >
          Prêt à commencer ?
        </Heading>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        style={{ maxWidth: 400 }}
      >
        <Text size="3" style={{ color: "var(--gray-10)", lineHeight: 1.7 }}>
          Créez votre compte en 2 minutes et commencez à vendre.
        </Text>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Flex
          gap="2"
          align="center"
          justify="center"
          wrap="wrap"
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            background: "var(--accent-a2)",
            border: "1px solid var(--accent-a4)",
          }}
        >
          {["Essai gratuit", "Sans engagement", "Sans carte bancaire"].map(
            (text, i) => (
              <Flex key={i} align="center" gap="2">
                {i > 0 && (
                  <Text size="2" style={{ color: "var(--gray-7)" }}>
                    &bull;
                  </Text>
                )}
                <Text
                  size="2"
                  weight="medium"
                  style={{ color: "var(--accent-11)" }}
                >
                  {text}
                </Text>
              </Flex>
            )
          )}
        </Flex>
      </motion.div>
    </Flex>
  );
}

/* ==========================================================================
   Export — tableau ordonné des slides
   ========================================================================== */

export const onboardingSlides = [
  { id: "welcome", component: WelcomeSlide },
  { id: "pos", component: POSSlide },
  { id: "features", component: FeaturesSlide },
  { id: "prerequisites", component: PrerequisitesSlide },
  { id: "start", component: StartSlide },
] as const;
