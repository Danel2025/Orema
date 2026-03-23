"use client";

import { Box, Container, Flex, Grid, Heading, Text, Separator } from "@radix-ui/themes";
import { FadeIn, StaggerContainer, StaggerItem, CountUp } from "./motion-wrapper";

const stats = [
  {
    value: 500,
    suffix: "+",
    label: "Transactions/jour",
    detail: "Capacité par terminal",
  },
  {
    value: 99.9,
    suffix: "%",
    label: "Disponibilité",
    detail: "Mode hors-ligne inclus",
  },
  {
    value: 15,
    suffix: " min",
    label: "Mise en place",
    detail: "De l'inscription à la première vente",
  },
  {
    value: 0,
    suffix: " FCFA",
    label: "Pour démarrer",
    detail: "Essai gratuit, sans engagement",
  },
];

const advantages = [
  {
    title: "100% adapté au Gabon",
    description: "FCFA natif, TVA gabonaise, Mobile Money intégré. Pas une adaptation, une solution pensée pour vous.",
  },
  {
    title: "Fonctionne sans internet",
    description: "Les coupures réseau ne stoppent plus votre activité. Synchronisation automatique au retour.",
  },
  {
    title: "Multi-établissements",
    description: "Gérez plusieurs points de vente depuis un seul compte. Rapports consolidés en temps réel.",
  },
];

export function Stats() {
  return (
    <Box py="9" style={{ background: "var(--color-background)" }}>
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="8">
            <Text
              size="2"
              weight="medium"
              style={{
                color: "var(--accent-11)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Pourquoi Orema N+
            </Text>

            <Heading
              size="8"
              align="center"
              weight="bold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Conçu pour le commerce africain
            </Heading>

            <Text
              size="3"
              align="center"
              color="gray"
              className="max-w-md"
              style={{ lineHeight: 1.6 }}
            >
              Une solution de caisse pensée dès le départ pour les réalités du
              marché gabonais.
            </Text>
          </Flex>
        </FadeIn>

        {/* Stats row */}
        <FadeIn delay={0.15}>
          <Box
            className="rounded-xl"
            p="6"
            style={{
              background: "var(--gray-a2)",
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Grid columns={{ initial: "2", md: "4" }} gap="6">
              {stats.map((stat, index) => (
                <Flex
                  key={index}
                  direction="column"
                  align="center"
                  gap="1"
                  className="text-center"
                >
                  <Text
                    size="8"
                    weight="bold"
                    style={{
                      fontFamily: "var(--font-google-sans-code)",
                      color: "var(--accent-9)",
                      lineHeight: 1.1,
                    }}
                  >
                    {stat.value > 0 ? (
                      <CountUp
                        value={stat.value}
                        suffix={stat.suffix}
                        decimals={stat.suffix === "%" ? 1 : 0}
                      />
                    ) : (
                      <>0{stat.suffix}</>
                    )}
                  </Text>
                  <Text size="2" weight="bold" mt="1">
                    {stat.label}
                  </Text>
                  <Text size="1" color="gray">
                    {stat.detail}
                  </Text>
                </Flex>
              ))}
            </Grid>
          </Box>
        </FadeIn>

        {/* Advantages */}
        <StaggerContainer staggerDelay={0.1}>
          <Grid columns={{ initial: "1", md: "3" }} gap="6" mt="8">
            {advantages.map((advantage, index) => (
              <StaggerItem key={index}>
                <Flex direction="column" gap="2">
                  <Heading size="3" weight="bold">
                    {advantage.title}
                  </Heading>
                  <Text size="2" color="gray" style={{ lineHeight: 1.6 }}>
                    {advantage.description}
                  </Text>
                </Flex>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>
      </Container>
    </Box>
  );
}
