"use client";

import { Box, Container, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Heart } from "@phosphor-icons/react";
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
    description:
      "FCFA natif, TVA gabonaise, Mobile Money intégré. Pas une adaptation, une solution pensée pour vous.",
    accent: "var(--orange-9)",
  },
  {
    title: "Fonctionne sans internet",
    description:
      "Les coupures réseau ne stoppent plus votre activité. Synchronisation automatique au retour.",
    accent: "var(--green-9)",
  },
  {
    title: "Multi-établissements",
    description:
      "Gérez plusieurs points de vente depuis un seul compte. Rapports consolidés en temps réel.",
    accent: "var(--blue-9)",
  },
];

export function Stats() {
  return (
    <Box
      py="9"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(165deg, var(--gray-1) 0%, var(--gray-2) 50%, var(--gray-1) 100%)",
      }}
    >
      {/* African pattern overlay */}
      <Box
        className="landing-african-pattern pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          color: "var(--gray-11)",
          opacity: 0.3,
          maskImage:
            "linear-gradient(to bottom, transparent 10%, black 50%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 10%, black 50%, transparent 90%)",
        }}
      />

      {/* Gradient accent */}
      <Box
        className="pointer-events-none absolute"
        aria-hidden="true"
        style={{
          width: 500,
          height: 500,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--accent-a3), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <Container size="4" className="relative z-10">
        {/* Section header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="8">
            <Flex align="center" gap="2">
              <Heart
                size={16}
                weight="fill"
                style={{ color: "var(--accent-9)" }}
              />
              <Text
                size="2"
                weight="bold"
                style={{
                  color: "var(--accent-11)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Pourquoi Oréma N+
              </Text>
            </Flex>

            <Heading
              size="8"
              align="center"
              weight="bold"
              style={{ letterSpacing: "-0.03em" }}
            >
              Conçu pour le commerce africain
            </Heading>

            <Text
              size="3"
              align="center"
              style={{
                color: "var(--gray-10)",
                maxWidth: 420,
                lineHeight: 1.65,
              }}
            >
              Une solution de caisse pensée dès le départ pour les réalités du
              marché gabonais.
            </Text>
          </Flex>
        </FadeIn>

        {/* Stats row */}
        <FadeIn delay={0.15}>
          <Box
            className="rounded-2xl"
            p="7"
            style={{
              background:
                "color-mix(in srgb, var(--color-background) 80%, transparent)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--gray-a4)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
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
                  style={{
                    borderRight:
                      index < stats.length - 1
                        ? "1px solid var(--gray-a3)"
                        : "none",
                    // Remove border for mobile 2-col layout edge cards
                  }}
                >
                  <Text
                    size="8"
                    weight="bold"
                    style={{
                      fontFamily: "var(--font-google-sans-code), monospace",
                      color: "var(--accent-9)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
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
                  <Text size="2" weight="bold" mt="2">
                    {stat.label}
                  </Text>
                  <Text size="1" style={{ color: "var(--gray-9)" }}>
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
                <Box
                  p="6"
                  className="h-full rounded-xl transition-all duration-200"
                  style={{
                    border: "1px solid var(--gray-a3)",
                    background: "var(--color-background)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a5)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.04)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a3)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Flex direction="column" gap="3">
                    {/* Accent line */}
                    <Box
                      className="rounded-full"
                      style={{
                        width: 32,
                        height: 4,
                        background: advantage.accent,
                      }}
                    />
                    <Heading size="4" weight="bold">
                      {advantage.title}
                    </Heading>
                    <Text
                      size="2"
                      style={{ color: "var(--gray-10)", lineHeight: 1.7 }}
                    >
                      {advantage.description}
                    </Text>
                  </Flex>
                </Box>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>
      </Container>
    </Box>
  );
}
