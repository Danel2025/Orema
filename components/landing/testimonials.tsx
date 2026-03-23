"use client";

import { Box, Container, Flex, Grid, Heading, Text, Card } from "@radix-ui/themes";
import { Quotes, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const testimonials = [
  {
    quote:
      "Depuis qu'on utilise Oréma N+, on traite 30% de clients en plus aux heures de pointe. Le système de tables nous fait gagner un temps précieux.",
    name: "Marcel Obiang",
    role: "Gérant",
    business: "Le Tropicana, Libreville",
    metric: "+30% de clients",
  },
  {
    quote:
      "Le mode hors-ligne m'a sauvé plusieurs fois. Quand la connexion coupe, mes ventes continuent normalement. C'est essentiel ici à Libreville.",
    name: "Fatou Ndong",
    role: "Propriétaire",
    business: "Épicerie Ndong, Owendo",
    metric: "0 vente perdue",
  },
  {
    quote:
      "Avant, on perdait 45 minutes chaque soir à faire la clôture de caisse. Maintenant c'est automatique en 2 minutes. Le rapport Z est impeccable.",
    name: "Jean-Pierre Moussavou",
    role: "Restaurateur",
    business: "Chez JP, Port-Gentil",
    metric: "45 min gagnées/jour",
  },
  {
    quote:
      "Le paiement par Airtel Money et Moov Money a changé la donne. On refuse moins de clients et le suivi des encaissements est transparent.",
    name: "Aristide Mba",
    role: "Gérant de bar",
    business: "Le Balcon, Libreville",
    metric: "+25% d'encaissements",
  },
  {
    quote:
      "On gère 3 restaurants depuis un seul tableau de bord. Les rapports consolidés nous permettent de comparer les performances de chaque site.",
    name: "Claire Nguema",
    role: "Directrice",
    business: "Groupe Saveurs du Gabon",
    metric: "3 sites gérés",
  },
  {
    quote:
      "La gestion des stocks m'alerte automatiquement quand un produit est en rupture. Fini les surprises en plein service.",
    name: "Patrick Essono",
    role: "Chef cuisinier",
    business: "La Terrasse, Franceville",
    metric: "-60% de ruptures",
  },
];

export function Testimonials() {
  return (
    <Box id="testimonials" py="9" style={{ background: "var(--color-background)" }}>
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="8">
            <Text
              size="2"
              weight="medium"
              style={{
                color: "var(--accent-11)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Témoignages
            </Text>

            <Heading size="8" align="center">
              Ils nous font confiance
            </Heading>

            <Text
              size="3"
              align="center"
              style={{ color: "var(--gray-10)", maxWidth: 480 }}
            >
              Des commerces gabonais qui utilisent Oréma N+ au quotidien
              partagent leur expérience.
            </Text>
          </Flex>
        </FadeIn>

        {/* Testimonials Grid */}
        <StaggerContainer staggerDelay={0.08}>
          <Grid
            columns={{ initial: "1", sm: "2", lg: "3" }}
            gap="5"
          >
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index}>
                <Card
                  size="3"
                  style={{
                    height: "100%",
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Flex direction="column" gap="4" style={{ height: "100%" }}>
                    {/* Metric badge */}
                    <Text
                      size="1"
                      weight="bold"
                      className="price-fcfa"
                      style={{
                        color: "var(--accent-11)",
                        backgroundColor: "var(--accent-a3)",
                        padding: "4px 10px",
                        borderRadius: 4,
                        alignSelf: "flex-start",
                        fontFamily:
                          "'JetBrains Mono', 'Google Sans Code', monospace",
                        fontSize: 11,
                      }}
                    >
                      {testimonial.metric}
                    </Text>

                    {/* Quote */}
                    <Flex gap="2" style={{ flex: 1 }}>
                      <Quotes
                        size={18}
                        weight="fill"
                        style={{
                          color: "var(--gray-6)",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                        aria-hidden="true"
                      />
                      <Text
                        size="2"
                        style={{
                          color: "var(--gray-11)",
                          lineHeight: 1.7,
                          fontStyle: "italic",
                        }}
                      >
                        {testimonial.quote}
                      </Text>
                    </Flex>

                    {/* Author */}
                    <Box
                      style={{
                        borderTop: "1px solid var(--gray-a3)",
                        paddingTop: 12,
                      }}
                    >
                      <Text
                        size="2"
                        weight="bold"
                        style={{
                          color: "var(--gray-12)",
                          display: "block",
                        }}
                      >
                        {testimonial.name}
                      </Text>
                      <Text
                        size="1"
                        style={{ color: "var(--gray-9)" }}
                      >
                        {testimonial.role} &middot; {testimonial.business}
                      </Text>
                    </Box>
                  </Flex>
                </Card>
              </StaggerItem>
            ))}
          </Grid>
        </StaggerContainer>

        {/* CTA Section */}
        <FadeIn delay={0.3}>
          <Flex
            direction="column"
            align="center"
            gap="5"
            mt="9"
            py="8"
            px="6"
            style={{
              borderRadius: 16,
              background: "var(--accent-9)",
              textAlign: "center",
            }}
          >
            <Heading size="6" style={{ color: "white" }}>
              Prêt à moderniser votre commerce ?
            </Heading>
            <Text
              size="3"
              style={{
                color: "rgba(255,255,255,0.85)",
                maxWidth: 440,
              }}
            >
              Oréma N+ est conçu pour les commerces gabonais. Simple, fiable et
              adapté à vos besoins.
            </Text>

            <Flex gap="3" wrap="wrap" justify="center">
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Essayer gratuitement
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.4)";
                }}
              >
                Nous contacter
              </Link>
            </Flex>
          </Flex>
        </FadeIn>
      </Container>
    </Box>
  );
}
