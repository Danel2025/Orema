"use client";

import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import {
  DownloadSimple,
  GearSix,
  ShoppingCart,
  TrendUp,
  ArrowRight,
  Lightning,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const steps = [
  {
    number: "01",
    icon: DownloadSimple,
    title: "Inscrivez-vous",
    description:
      "Créez votre compte en 2 minutes. Aucune carte bancaire requise pour l'essai gratuit.",
    color: "accent",
  },
  {
    number: "02",
    icon: GearSix,
    title: "Configurez",
    description:
      "Ajoutez vos produits, configurez vos catégories et connectez votre imprimante.",
    color: "blue",
  },
  {
    number: "03",
    icon: ShoppingCart,
    title: "Vendez",
    description:
      "Commencez à encaisser vos clients. Interface intuitive, même pour les débutants.",
    color: "green",
  },
  {
    number: "04",
    icon: TrendUp,
    title: "Analysez",
    description:
      "Suivez vos ventes en temps réel et prenez les meilleures décisions.",
    color: "amber",
  },
];

const colorStyles = {
  accent: {
    bg: "var(--accent-9)",
    glow: "var(--accent-a5)",
    light: "var(--accent-a3)",
  },
  blue: {
    bg: "var(--blue-9)",
    glow: "rgba(59, 130, 246, 0.3)",
    light: "var(--blue-a3)",
  },
  green: {
    bg: "var(--green-9)",
    glow: "rgba(34, 197, 94, 0.3)",
    light: "var(--green-a3)",
  },
  amber: {
    bg: "var(--amber-9)",
    glow: "rgba(245, 158, 11, 0.3)",
    light: "var(--amber-a3)",
  },
};

export function HowItWorks() {
  return (
    <Box
      id="how-it-works"
      py="9"
      style={{
        background: "var(--color-background)",
      }}
    >
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="9">
            <Box
              className="rounded-full"
              style={{
                background: "var(--blue-a3)",
                border: "1px solid var(--blue-a5)",
                padding: "8px 18px",
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--blue-11)" }}
              >
                Comment ça marche
              </Text>
            </Box>

            <Heading size="8" align="center">
              Démarrez en 4 étapes simples
            </Heading>

            <Text
              size="3"
              align="center"
              color="gray"
              className="max-w-lg"
            >
              De l&apos;inscription à votre première vente en quelques minutes.
              Pas besoin d&apos;être un expert en technologie.
            </Text>
          </Flex>
        </FadeIn>

        {/* Steps */}
        <StaggerContainer staggerDelay={0.15}>
          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="6">
            {steps.map((step, index) => {
              const colors = colorStyles[step.color as keyof typeof colorStyles];
              const Icon = step.icon;

              return (
                <StaggerItem key={index}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="relative h-full"
                  >
                    {/* Connecting line (desktop only) */}
                    {index < steps.length - 1 && (
                      <Box
                        className="absolute right-0 top-12 hidden h-0.5 w-6 translate-x-full lg:block"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--gray-a6), transparent)",
                        }}
                      >
                        <ArrowRight
                          size={12}
                          className="absolute -right-1 -top-1.5"
                          style={{ color: "var(--gray-8)" }}
                        />
                      </Box>
                    )}

                    <Flex direction="column" align="center" gap="4">
                      {/* Icon container */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                      >
                        {/* Glow effect */}
                        <Box
                          className="absolute -inset-2 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                          style={{ background: colors.glow }}
                        />

                        {/* Icon box */}
                        <Flex
                          align="center"
                          justify="center"
                          className="relative rounded-2xl"
                          style={{
                            width: 80,
                            height: 80,
                            background: colors.bg,
                            boxShadow: `0 10px 30px ${colors.glow}`,
                          }}
                        >
                          <Icon size={32} color="white" weight="bold" />
                        </Flex>

                        {/* Number badge */}
                        <Flex
                          align="center"
                          justify="center"
                          className="absolute -right-2 -top-2 rounded-full text-xs font-bold"
                          style={{
                            width: 32,
                            height: 32,
                            background: "var(--color-background)",
                            border: "2px solid var(--gray-a6)",
                            color: "var(--gray-11)",
                          }}
                        >
                          {step.number}
                        </Flex>
                      </motion.div>

                      {/* Content */}
                      <Flex
                        direction="column"
                        align="center"
                        gap="2"
                        className="text-center"
                      >
                        <Heading size="4" weight="bold">
                          {step.title}
                        </Heading>
                        <Text
                          size="2"
                          color="gray"
                          style={{ lineHeight: 1.6 }}
                        >
                          {step.description}
                        </Text>
                      </Flex>
                    </Flex>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </Grid>
        </StaggerContainer>

        {/* Time indicator */}
        <FadeIn delay={0.4}>
          <Flex justify="center" mt="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--green-a3)",
                border: "1px solid var(--green-a5)",
                padding: "14px 24px",
              }}
            >
              <Flex align="center" gap="3">
                <Flex
                  align="center"
                  justify="center"
                  className="rounded-full"
                  style={{ width: 36, height: 36, background: "var(--green-9)" }}
                >
                  <Lightning size={20} color="white" weight="fill" />
                </Flex>
                <Text size="2" weight="medium" style={{ color: "var(--green-11)" }}>
                  Temps moyen de configuration : 15 minutes
                </Text>
              </Flex>
            </Box>
          </Flex>
        </FadeIn>
      </Container>
    </Box>
  );
}
