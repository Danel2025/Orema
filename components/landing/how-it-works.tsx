"use client";

import { Box, Container, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import {
  DownloadSimple,
  GearSix,
  ShoppingCart,
  TrendUp,
} from "@phosphor-icons/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const steps = [
  {
    number: "01",
    icon: DownloadSimple,
    title: "Inscrivez-vous",
    description:
      "Creez votre compte en 2 minutes. Aucune carte bancaire requise.",
  },
  {
    number: "02",
    icon: GearSix,
    title: "Configurez",
    description:
      "Ajoutez vos produits, categories et connectez votre imprimante.",
  },
  {
    number: "03",
    icon: ShoppingCart,
    title: "Vendez",
    description:
      "Commencez a encaisser. Interface intuitive, formation minimale.",
  },
  {
    number: "04",
    icon: TrendUp,
    title: "Analysez",
    description:
      "Suivez vos ventes et prenez les bonnes decisions avec des donnees fiables.",
  },
];

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
          <Flex direction="column" align="center" gap="3" mb="9">
            <Text
              size="2"
              weight="medium"
              style={{
                color: "var(--accent-11)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Comment ca marche
            </Text>

            <Heading
              size="8"
              align="center"
              weight="bold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Operationnel en 15 minutes
            </Heading>

            <Text
              size="3"
              align="center"
              color="gray"
              className="max-w-md"
              style={{ lineHeight: 1.6 }}
            >
              De l&apos;inscription a votre premiere vente. Pas besoin
              d&apos;etre un expert.
            </Text>
          </Flex>
        </FadeIn>

        {/* Steps */}
        <StaggerContainer staggerDelay={0.12}>
          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="6">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <StaggerItem key={index}>
                  <Flex direction="column" align="center" gap="4">
                    {/* Step number + icon */}
                    <Box className="relative">
                      <Flex
                        align="center"
                        justify="center"
                        className="rounded-2xl"
                        style={{
                          width: 72,
                          height: 72,
                          background: "var(--accent-a3)",
                          border: "1px solid var(--accent-a4)",
                        }}
                      >
                        <Icon
                          size={30}
                          weight="duotone"
                          style={{ color: "var(--accent-9)" }}
                        />
                      </Flex>

                      {/* Number badge */}
                      <Flex
                        align="center"
                        justify="center"
                        className="absolute -top-2 -right-2 rounded-full"
                        style={{
                          width: 28,
                          height: 28,
                          background: "var(--accent-9)",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 700,
                          fontFamily: "var(--font-google-sans-code)",
                        }}
                      >
                        {step.number}
                      </Flex>
                    </Box>

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
                        style={{ lineHeight: 1.6, maxWidth: 220 }}
                      >
                        {step.description}
                      </Text>
                    </Flex>

                    {/* Connector line (desktop) */}
                    {index < steps.length - 1 && (
                      <Box
                        className="absolute top-9 hidden h-px lg:block"
                        style={{
                          left: "calc(50% + 48px)",
                          right: "calc(-50% + 48px)",
                          background: "var(--gray-a5)",
                        }}
                      />
                    )}
                  </Flex>
                </StaggerItem>
              );
            })}
          </Grid>
        </StaggerContainer>

        {/* Time indicator */}
        <FadeIn delay={0.3}>
          <Flex justify="center" mt="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--gray-a3)",
                border: "1px solid var(--gray-a4)",
                padding: "10px 20px",
              }}
            >
              <Text size="2" color="gray">
                Temps moyen de mise en place :{" "}
                <Text
                  weight="bold"
                  style={{
                    color: "var(--accent-11)",
                    fontFamily: "var(--font-google-sans-code)",
                  }}
                >
                  15 min
                </Text>
              </Text>
            </Box>
          </Flex>
        </FadeIn>
      </Container>
    </Box>
  );
}
