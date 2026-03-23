"use client";

import { Box, Container, Flex, Grid, Heading, Text, Card } from "@radix-ui/themes";
import {
  Monitor,
  GridFour,
  Wallet,
  WifiSlash,
  ChartBar,
  Printer,
  ArrowRight,
} from "@phosphor-icons/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const features = [
  {
    icon: Monitor,
    title: "Caisse tactile",
    description:
      "Prise en main en 15 minutes. Interface optimisee pour ecrans tactiles, pensee pour la rapidite aux heures de pointe.",
  },
  {
    icon: GridFour,
    title: "Plan de salle",
    description:
      "Gerez vos tables en temps reel. Transferts, additions separees et suivi des commandes par zone.",
  },
  {
    icon: Wallet,
    title: "Tous les paiements",
    description:
      "Especes, cartes, Airtel Money, Moov Money. Paiements mixtes et suivi des references en un clic.",
  },
  {
    icon: WifiSlash,
    title: "Fonctionne hors-ligne",
    description:
      "Pas de coupure d'activite en cas de panne internet. Synchronisation automatique au retour du reseau.",
  },
  {
    icon: ChartBar,
    title: "Rapports detailles",
    description:
      "Ventes par heure, produits les plus vendus, marges. Les donnees dont vous avez besoin pour decider.",
  },
  {
    icon: Printer,
    title: "Impression automatique",
    description:
      "Tickets de caisse et bons de cuisine. Routage automatique vers la bonne imprimante par categorie.",
  },
];

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
              Fonctionnalites
            </Text>

            <Heading
              size="8"
              align="center"
              weight="bold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Ce qui compte pour votre commerce
            </Heading>

            <Text
              size="3"
              align="center"
              color="gray"
              className="max-w-md"
              style={{ lineHeight: 1.6 }}
            >
              Chaque fonctionnalite repond a un besoin reel du terrain. Pas de
              gadgets, que de l'essentiel.
            </Text>
          </Flex>
        </FadeIn>

        {/* Features Grid */}
        <StaggerContainer staggerDelay={0.08}>
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <StaggerItem key={index}>
                  <Card
                    size="3"
                    className="h-full transition-colors duration-200"
                    style={{
                      cursor: "default",
                    }}
                  >
                    <Flex direction="column" gap="4">
                      {/* Icon */}
                      <Flex
                        align="center"
                        justify="center"
                        className="rounded-lg"
                        style={{
                          width: 44,
                          height: 44,
                          background: "var(--accent-a3)",
                        }}
                      >
                        <Icon
                          size={22}
                          weight="duotone"
                          style={{ color: "var(--accent-9)" }}
                        />
                      </Flex>

                      {/* Content */}
                      <Flex direction="column" gap="2">
                        <Heading size="3" weight="bold">
                          {feature.title}
                        </Heading>
                        <Text
                          size="2"
                          color="gray"
                          style={{ lineHeight: 1.6 }}
                        >
                          {feature.description}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                </StaggerItem>
              );
            })}
          </Grid>
        </StaggerContainer>

        {/* CTA Banner */}
        <FadeIn delay={0.2}>
          <Box
            mt="8"
            p="6"
            className="rounded-xl"
            style={{
              background: "var(--gray-a3)",
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex
              direction={{ initial: "column", md: "row" }}
              justify="between"
              align={{ initial: "start", md: "center" }}
              gap="4"
            >
              <Flex direction="column" gap="1">
                <Text size="3" weight="bold">
                  Besoin d&apos;une fonctionnalite specifique ?
                </Text>
                <Text size="2" color="gray">
                  Notre equipe peut adapter Orema N+ a vos processus metier.
                </Text>
              </Flex>
              <a
                href="#contact"
                className="flex items-center gap-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                style={{
                  background: "var(--accent-9)",
                  flexShrink: 0,
                  padding: "10px 18px",
                  fontSize: "14px",
                }}
              >
                Nous contacter
                <ArrowRight size={16} />
              </a>
            </Flex>
          </Box>
        </FadeIn>
      </Container>
    </Box>
  );
}
