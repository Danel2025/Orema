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
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from "./motion-wrapper";
import { MapPin, WifiOff, Banknote, Smartphone } from "lucide-react";

const advantages = [
  {
    icon: MapPin,
    label: "100% Gabonais",
    description: "Concu a Libreville pour les commerces locaux",
    color: "violet",
  },
  {
    icon: WifiOff,
    label: "Mode hors-ligne",
    description: "Fonctionne meme sans internet",
    color: "blue",
  },
  {
    icon: Banknote,
    label: "FCFA natif",
    description: "Pense pour le Franc CFA, pas d'euros",
    color: "green",
  },
  {
    icon: Smartphone,
    label: "Mobile Money",
    description: "Airtel Money & Moov Money integres",
    color: "amber",
  },
];

export function Stats() {
  return (
    <Box py="9" style={{ background: "var(--color-background)" }}>
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--purple-a3)",
                border: "1px solid var(--purple-a5)",
                padding: "8px 18px",
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--purple-11)" }}
              >
                Pourquoi Orema N+ ?
              </Text>
            </Box>

            <Heading size="8" align="center">
              Concu pour le commerce africain
            </Heading>

            <Text size="3" align="center" color="gray" className="max-w-lg">
              Une solution de caisse pensee des le depart pour les realites
              du marche gabonais et africain.
            </Text>
          </Flex>
        </FadeIn>

        {/* Advantages Grid */}
        <StaggerContainer staggerDelay={0.15}>
          <Grid columns={{ initial: "2", md: "4" }} gap="4">
            {advantages.map((advantage, index) => (
              <StaggerItem key={index}>
                <ScaleOnHover scale={1.05}>
                  <Card size="3" className="text-center" style={{ height: "100%" }}>
                    <Flex direction="column" align="center" gap="3">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Flex
                          align="center"
                          justify="center"
                          className="rounded-full"
                          style={{
                            width: 48,
                            height: 48,
                            background: `var(--${advantage.color}-a3)`,
                          }}
                        >
                          <advantage.icon
                            size={22}
                            style={{ color: `var(--${advantage.color}-9)` }}
                          />
                        </Flex>
                      </motion.div>
                      <Text size="3" weight="bold">
                        {advantage.label}
                      </Text>
                      <Text size="1" color="gray">
                        {advantage.description}
                      </Text>
                    </Flex>
                  </Card>
                </ScaleOnHover>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>
      </Container>
    </Box>
  );
}
