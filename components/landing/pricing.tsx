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
import { Check, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const plans = [
  {
    name: "Essentiel",
    description: "Gratuit pour démarrer",
    price: "Gratuit",
    period: "",
    features: [
      "1 utilisateur",
      "Ventes et encaissements",
      "Rapport journalier (Z)",
      "Mode hors-ligne",
      "Support par email",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    description: "Pour restaurants et bars",
    price: "9 900",
    period: "/mois",
    features: [
      "5 utilisateurs",
      "Gestion des tables",
      "Multi-imprimantes",
      "Stocks & inventaire",
      "Rapports avancés",
      "Mobile Money",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
  {
    name: "Business",
    description: "Pour chaînes et franchises",
    price: "19 900",
    period: "/mois",
    features: [
      "Multi-établissements",
      "Utilisateurs illimités",
      "Rapports avancés",
      "Formation incluse",
      "Support dédié",
    ],
    cta: "Nous contacter",
    popular: false,
  },
];

export function Pricing() {
  return (
    <Box id="pricing" py="9" style={{ background: "var(--gray-a2)" }}>
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="8">
            <Box
              style={{
                background: "var(--green-a3)",
                border: "1px solid var(--green-a5)",
                padding: "8px 18px",
                borderRadius: 20,
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--green-11)" }}
              >
                Tarifs transparents
              </Text>
            </Box>

            <Heading size="8" align="center">
              Un prix adapté à chaque commerce
            </Heading>

            <Text size="3" align="center" color="gray" style={{ maxWidth: 500 }}>
              Pas de frais cachés. Pas d&apos;engagement. Changez ou annulez à tout moment.
            </Text>
          </Flex>
        </FadeIn>

        {/* Pricing Cards */}
        <StaggerContainer staggerDelay={0.15}>
          <Grid columns={{ initial: "1", md: "3" }} gap="5" style={{ paddingTop: 16 }}>
            {plans.map((plan, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: "100%", position: "relative" }}
                >
                  {/* Popular badge - outside card */}
                  {plan.popular ? <div
                      style={{
                        position: "absolute",
                        top: -14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                        background: "var(--violet-9)",
                        color: "white",
                        padding: "8px 20px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      <Zap size={12} fill="white" />
                      Plus populaire
                    </div> : null}
                  <Card
                    size="3"
                    style={{
                      height: "100%",
                      border: plan.popular ? "2px solid var(--violet-8)" : undefined,
                      boxShadow: plan.popular ? "0 20px 40px -10px rgba(139, 92, 246, 0.2)" : undefined,
                    }}
                  >

                    <Flex direction="column" gap="5" style={{ height: "100%" }}>
                      {/* Plan header */}
                      <Flex direction="column" gap="1">
                        <Heading size="5">{plan.name}</Heading>
                        <Text size="2" color="gray">
                          {plan.description}
                        </Text>
                      </Flex>

                      {/* Price */}
                      <Flex align="baseline" gap="2">
                        <Text
                          size="8"
                          weight="bold"
                          style={
                            plan.popular
                              ? { color: "var(--violet-9)" }
                              : { color: "var(--gray-12)" }
                          }
                        >
                          {plan.price}
                        </Text>
                        {plan.period ? <Text size="2" color="gray">
                            FCFA{plan.period}
                          </Text> : null}
                      </Flex>

                      {/* Features */}
                      <Flex direction="column" gap="3" style={{ flex: 1 }}>
                        {plan.features.map((feature, i) => (
                          <Flex key={i} align="center" gap="3">
                            <Box
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: plan.popular ? "var(--violet-a4)" : "var(--green-a4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Check
                                size={12}
                                style={{
                                  color: plan.popular ? "var(--violet-9)" : "var(--green-9)",
                                }}
                              />
                            </Box>
                            <Text size="2">{feature}</Text>
                          </Flex>
                        ))}
                      </Flex>

                      {/* CTA */}
                      <Link
                        href={plan.name === "Business" ? "#contact" : "/register"}
                        target={plan.name === "Business" ? undefined : "_blank"}
                        style={{ textDecoration: "none" }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: "100%",
                            padding: "14px 20px",
                            borderRadius: 8,
                            textAlign: "center",
                            fontWeight: 500,
                            fontSize: 14,
                            cursor: "pointer",
                            background: plan.popular
                              ? "var(--violet-9)"
                              : "transparent",
                            color: plan.popular ? "white" : "var(--violet-9)",
                            border: plan.popular ? "none" : "1px solid var(--violet-8)",
                          }}
                        >
                          {plan.cta}
                        </motion.div>
                      </Link>
                    </Flex>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>

        {/* Note */}
        <FadeIn delay={0.4}>
          <Text
            size="2"
            color="gray"
            align="center"
            style={{ display: "block", marginTop: 32 }}
          >
            Tous les prix sont en FCFA HT.
          </Text>
        </FadeIn>
      </Container>
    </Box>
  );
}
