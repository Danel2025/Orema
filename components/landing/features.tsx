"use client";

import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import {
  Monitor,
  GridFour,
  Wallet,
  WifiSlash,
  ChartBar,
  Printer,
  ArrowRight,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

interface Feature {
  icon: PhosphorIcon;
  title: string;
  description: string;
  accent: string;
  span?: "wide" | "tall";
}

const features: Feature[] = [
  {
    icon: Monitor,
    title: "Caisse tactile intuitive",
    description:
      "Prise en main en 15 minutes. Interface optimisée pour écrans tactiles, pensée pour la rapidité aux heures de pointe. Vos serveurs n'ont pas besoin de formation.",
    accent: "var(--orange-9)",
    span: "wide",
  },
  {
    icon: GridFour,
    title: "Plan de salle interactif",
    description:
      "Gérez vos tables en temps réel. Transferts, additions séparées et suivi des commandes par zone.",
    accent: "var(--blue-9)",
  },
  {
    icon: Wallet,
    title: "Tous les paiements",
    description:
      "Espèces, cartes, Airtel Money, Moov Money. Paiements mixtes et suivi des références en un clic.",
    accent: "var(--green-9)",
  },
  {
    icon: WifiSlash,
    title: "Fonctionne hors-ligne",
    description:
      "Pas de coupure d'activité en cas de panne internet. Synchronisation automatique au retour du réseau.",
    accent: "var(--violet-9)",
  },
  {
    icon: ChartBar,
    title: "Rapports détaillés",
    description:
      "Ventes par heure, produits les plus vendus, marges. Les données dont vous avez besoin pour décider.",
    accent: "var(--amber-9)",
  },
  {
    icon: Printer,
    title: "Impression automatique",
    description:
      "Tickets de caisse et bons de cuisine. Routage automatique vers la bonne imprimante par catégorie de produit.",
    accent: "var(--crimson-9)",
    span: "wide",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Box
      className="group relative h-full overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--gray-a4)",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--gray-a6)";
        e.currentTarget.style.boxShadow =
          "0 12px 40px -10px rgba(0,0,0,0.08), 0 0 0 1px var(--gray-a3)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--gray-a4)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Subtle gradient accent on hover */}
      <Box
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, color-mix(in srgb, ${feature.accent} 6%, transparent), transparent 70%)`,
        }}
      />

      <Flex
        direction="column"
        gap="4"
        p="6"
        className="relative z-10"
        style={{ height: "100%" }}
      >
        {/* Icon with accent background */}
        <Flex
          align="center"
          justify="center"
          className="rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: `color-mix(in srgb, ${feature.accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${feature.accent} 15%, transparent)`,
            transition: "transform 0.3s ease",
          }}
        >
          <Icon
            size={24}
            weight="duotone"
            style={{ color: feature.accent }}
          />
        </Flex>

        {/* Content */}
        <Flex direction="column" gap="2" style={{ flex: 1 }}>
          <Heading size="4" weight="bold" style={{ letterSpacing: "-0.01em" }}>
            {feature.title}
          </Heading>
          <Text size="2" style={{ color: "var(--gray-10)", lineHeight: 1.7 }}>
            {feature.description}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}

export function Features() {
  return (
    <Box
      id="features"
      py="9"
      style={{
        background: "var(--gray-a2)",
      }}
    >
      <Container size="4">
        {/* Section header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="8">
            <Text
              size="2"
              weight="bold"
              style={{
                color: "var(--accent-11)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Fonctionnalités
            </Text>

            <Heading
              size="8"
              align="center"
              weight="bold"
              style={{ letterSpacing: "-0.03em", maxWidth: 500 }}
            >
              Ce qui compte pour votre commerce
            </Heading>

            <Text
              size="3"
              align="center"
              style={{
                color: "var(--gray-10)",
                lineHeight: 1.65,
                maxWidth: 460,
              }}
            >
              Chaque fonctionnalité répond à un besoin réel du terrain. Pas de
              gadgets, que de l&apos;essentiel.
            </Text>
          </Flex>
        </FadeIn>

        {/* Bento grid */}
        <StaggerContainer staggerDelay={0.08}>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {/* Row 1: wide + normal */}
            <StaggerItem
              className="md:col-span-2"
              style={{ gridColumn: "span 1" }}
            >
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <FeatureCard feature={features[0]} />
                </div>
              </div>
            </StaggerItem>

            {/* Row 2: 2 normal cards */}
            {features.slice(1, 3).map((feature, index) => (
              <StaggerItem key={index + 1}>
                <FeatureCard feature={feature} />
              </StaggerItem>
            ))}

            {/* Row 3: 2 normal cards */}
            {features.slice(3, 5).map((feature, index) => (
              <StaggerItem key={index + 3}>
                <FeatureCard feature={feature} />
              </StaggerItem>
            ))}

            {/* Row 4: wide card */}
            <StaggerItem
              className="md:col-span-2"
              style={{ gridColumn: "span 1" }}
            >
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <FeatureCard feature={features[5]} />
                </div>
              </div>
            </StaggerItem>
          </div>
        </StaggerContainer>

        {/* CTA Banner */}
        <FadeIn delay={0.2}>
          <Box
            mt="8"
            p="6"
            className="overflow-hidden rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-a3) 0%, var(--accent-a2) 100%)",
              border: "1px solid var(--accent-a4)",
              position: "relative",
            }}
          >
            {/* Decorative accent */}
            <Box
              className="pointer-events-none absolute"
              aria-hidden="true"
              style={{
                width: 200,
                height: 200,
                top: "-50%",
                right: "10%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, var(--accent-a3), transparent 70%)",
                filter: "blur(40px)",
              }}
            />

            <Flex
              direction={{ initial: "column", md: "row" }}
              justify="between"
              align={{ initial: "start", md: "center" }}
              gap="4"
              className="relative z-10"
            >
              <Flex direction="column" gap="1">
                <Text size="3" weight="bold">
                  Besoin d&apos;une fonctionnalité spécifique ?
                </Text>
                <Text size="2" style={{ color: "var(--gray-10)" }}>
                  Notre équipe peut adapter Oréma N+ à vos processus métier.
                </Text>
              </Flex>
              <a
                href="#contact"
                className="flex items-center gap-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
                style={{
                  background: "var(--accent-9)",
                  flexShrink: 0,
                  padding: "12px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px var(--accent-a4)",
                }}
              >
                Nous contacter
                <ArrowRight size={16} weight="bold" />
              </a>
            </Flex>
          </Box>
        </FadeIn>
      </Container>
    </Box>
  );
}
