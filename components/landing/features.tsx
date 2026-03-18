"use client";

import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Card,
} from "@radix-ui/themes";
import {
  Monitor,
  GridFour,
  Wallet,
  WifiSlash,
  ChartBar,
  Printer,
  ArrowRight,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from "./motion-wrapper";

const features = [
  {
    icon: Monitor,
    title: "Caisse tactile intuitive",
    description:
      "Interface optimisée pour écrans tactiles. Vos employés sont opérationnels en quelques minutes.",
    color: "accent" as const,
  },
  {
    icon: GridFour,
    title: "Gestion des tables",
    description:
      "Plan de salle interactif avec statuts en temps réel. Transferts et additions séparées.",
    color: "blue" as const,
  },
  {
    icon: Wallet,
    title: "Multi-paiements",
    description:
      "Espèces, cartes, Airtel Money, Moov Money. Tous les modes de paiement du Gabon.",
    color: "green" as const,
  },
  {
    icon: WifiSlash,
    title: "Mode hors-ligne",
    description:
      "Continuez à vendre sans internet. Synchronisation automatique au retour du réseau.",
    color: "amber" as const,
  },
  {
    icon: ChartBar,
    title: "Rapports temps réel",
    description:
      "Ventes, produits populaires, heures de pointe. Décidez avec les bonnes données.",
    color: "teal" as const,
  },
  {
    icon: Printer,
    title: "Imprimantes thermiques",
    description:
      "Tickets et bons de cuisine. Routage automatique par catégorie de produit.",
    color: "red" as const,
  },
];

const colorStyles = {
  accent: {
    bg: "var(--accent-a3)",
    icon: "var(--accent-9)",
    border: "var(--accent-a5)",
  },
  blue: {
    bg: "var(--blue-a3)",
    icon: "var(--blue-9)",
    border: "var(--blue-a5)",
  },
  green: {
    bg: "var(--green-a3)",
    icon: "var(--green-9)",
    border: "var(--green-a5)",
  },
  amber: {
    bg: "var(--amber-a3)",
    icon: "var(--amber-9)",
    border: "var(--amber-a5)",
  },
  teal: {
    bg: "var(--teal-a3)",
    icon: "var(--teal-9)",
    border: "var(--teal-a5)",
  },
  red: {
    bg: "var(--red-a3)",
    icon: "var(--red-9)",
    border: "var(--red-a5)",
  },
};

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
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--accent-a3)",
                border: "1px solid var(--accent-a5)",
                padding: "8px 18px",
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--accent-11)" }}
              >
                Fonctionnalités
              </Text>
            </Box>

            <Heading size="8" align="center">
              Tout ce dont vous avez besoin
            </Heading>

            <Text size="3" align="center" color="gray" className="max-w-lg">
              Une solution complète pensée pour les réalités du commerce africain.
              Fiable, rapide et adaptée à vos besoins.
            </Text>
          </Flex>
        </FadeIn>

        {/* Features Grid */}
        <StaggerContainer staggerDelay={0.1}>
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            {features.map((feature, index) => {
              const colors = colorStyles[feature.color];
              const Icon = feature.icon;

              return (
                <StaggerItem key={index}>
                  <ScaleOnHover>
                    <Card size="3" className="h-full">
                      <Flex direction="column" gap="4">
                        {/* Icon */}
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <Flex
                            align="center"
                            justify="center"
                            className="rounded-xl"
                            style={{
                              width: 48,
                              height: 48,
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            <Icon size={24} style={{ color: colors.icon }} />
                          </Flex>
                        </motion.div>

                        {/* Content */}
                        <Flex direction="column" gap="2">
                          <Heading size="4" weight="bold">
                            {feature.title}
                          </Heading>
                          <Text size="2" color="gray" style={{ lineHeight: 1.6 }}>
                            {feature.description}
                          </Text>
                        </Flex>
                      </Flex>
                    </Card>
                  </ScaleOnHover>
                </StaggerItem>
              );
            })}
          </Grid>
        </StaggerContainer>

        {/* CTA Banner */}
        <FadeIn delay={0.3}>
          <Card
            size="3"
            mt="8"
            style={{
              background: "var(--accent-a3)",
              border: "1px solid var(--accent-a5)",
            }}
          >
            <Flex
              direction={{ initial: "column", md: "row" }}
              justify="between"
              align={{ initial: "start", md: "center" }}
              gap="4"
            >
              <Flex direction="column" gap="1">
                <Heading size="4">
                  Besoin d&apos;une fonctionnalité spécifique ?
                </Heading>
                <Text size="2" color="gray">
                  Notre équipe peut personnaliser Oréma N+ selon vos besoins
                  métier.
                </Text>
              </Flex>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="flex cursor-pointer items-center gap-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                style={{
                  background: "var(--accent-9)",
                  flexShrink: 0,
                  padding: "12px 20px",
                }}
              >
                Nous contacter
                <ArrowRight size={16} />
              </motion.a>
            </Flex>
          </Card>
        </FadeIn>
      </Container>
    </Box>
  );
}
