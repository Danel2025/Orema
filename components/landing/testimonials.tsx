"use client";

import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Quotes, ArrowRight, Star } from "@phosphor-icons/react";
import Link from "next/link";
import { FadeIn } from "./motion-wrapper";

const testimonials = [
  {
    quote:
      "Depuis qu'on utilise Oréma N+, on traite 30% de clients en plus aux heures de pointe. Le système de tables nous fait gagner un temps précieux.",
    name: "Marcel Obiang",
    role: "Gérant",
    business: "Le Tropicana, Libreville",
    metric: "+30% de clients",
    initials: "MO",
  },
  {
    quote:
      "Le mode hors-ligne m'a sauvé plusieurs fois. Quand la connexion coupe, mes ventes continuent normalement. C'est essentiel ici à Libreville.",
    name: "Fatou Ndong",
    role: "Propriétaire",
    business: "Épicerie Ndong, Owendo",
    metric: "0 vente perdue",
    initials: "FN",
  },
  {
    quote:
      "Avant, on perdait 45 minutes chaque soir à faire la clôture de caisse. Maintenant c'est automatique en 2 minutes. Le rapport Z est impeccable.",
    name: "Jean-Pierre Moussavou",
    role: "Restaurateur",
    business: "Chez JP, Port-Gentil",
    metric: "45 min gagnées/jour",
    initials: "JP",
  },
  {
    quote:
      "Le paiement par Airtel Money et Moov Money a changé la donne. On refuse moins de clients et le suivi des encaissements est transparent.",
    name: "Aristide Mba",
    role: "Gérant de bar",
    business: "Le Balcon, Libreville",
    metric: "+25% d'encaissements",
    initials: "AM",
  },
  {
    quote:
      "On gère 3 restaurants depuis un seul tableau de bord. Les rapports consolidés nous permettent de comparer les performances de chaque site.",
    name: "Claire Nguema",
    role: "Directrice",
    business: "Groupe Saveurs du Gabon",
    metric: "3 sites gérés",
    initials: "CN",
  },
  {
    quote:
      "La gestion des stocks m'alerte automatiquement quand un produit est en rupture. Fini les surprises en plein service.",
    name: "Patrick Essono",
    role: "Chef cuisinier",
    business: "La Terrasse, Franceville",
    metric: "-60% de ruptures",
    initials: "PE",
  },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <Box
      className="flex-shrink-0 rounded-2xl"
      style={{
        width: 380,
        padding: "28px",
        background: "var(--color-background)",
        border: "1px solid var(--gray-a4)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--gray-a6)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--gray-a4)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Flex direction="column" gap="4" style={{ height: "100%" }}>
        {/* Top: metric badge + stars */}
        <Flex justify="between" align="center">
          <Text
            size="1"
            weight="bold"
            className="price-fcfa"
            style={{
              color: "var(--accent-11)",
              backgroundColor: "var(--accent-a3)",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 11,
              letterSpacing: "0.01em",
            }}
          >
            {testimonial.metric}
          </Text>
          <Flex gap="1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                weight="fill"
                style={{ color: "var(--amber-9)" }}
              />
            ))}
          </Flex>
        </Flex>

        {/* Quote */}
        <Flex gap="3" style={{ flex: 1 }}>
          <Quotes
            size={20}
            weight="fill"
            style={{
              color: "var(--accent-a6)",
              flexShrink: 0,
              marginTop: 2,
            }}
            aria-hidden="true"
          />
          <Text
            size="2"
            style={{
              color: "var(--gray-11)",
              lineHeight: 1.75,
              fontStyle: "italic",
            }}
          >
            {testimonial.quote}
          </Text>
        </Flex>

        {/* Author */}
        <Flex align="center" gap="3" pt="3" style={{ borderTop: "1px solid var(--gray-a3)" }}>
          {/* Avatar initials */}
          <Flex
            align="center"
            justify="center"
            className="flex-shrink-0 rounded-full"
            style={{
              width: 40,
              height: 40,
              background:
                "linear-gradient(135deg, var(--accent-a4), var(--accent-a3))",
              border: "2px solid var(--accent-a5)",
            }}
          >
            <Text
              size="1"
              weight="bold"
              style={{
                color: "var(--accent-11)",
                fontSize: 12,
                letterSpacing: "0.02em",
              }}
            >
              {testimonial.initials}
            </Text>
          </Flex>

          <Flex direction="column" gap="0">
            <Text size="2" weight="bold" style={{ color: "var(--gray-12)" }}>
              {testimonial.name}
            </Text>
            <Text size="1" style={{ color: "var(--gray-9)" }}>
              {testimonial.role} · {testimonial.business}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

export function Testimonials() {
  // Double les témoignages pour le marquee infini
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <Box
      id="testimonials"
      py="9"
      className="relative overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      <Container size="4">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="8">
            <Text
              size="2"
              weight="bold"
              style={{
                color: "var(--accent-11)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Témoignages
            </Text>

            <Heading
              size="8"
              align="center"
              weight="bold"
              style={{ letterSpacing: "-0.03em" }}
            >
              Ils nous font confiance
            </Heading>

            <Text
              size="3"
              align="center"
              style={{
                color: "var(--gray-10)",
                maxWidth: 480,
                lineHeight: 1.65,
              }}
            >
              Des commerces gabonais qui utilisent Oréma N+ au quotidien
              partagent leur expérience.
            </Text>
          </Flex>
        </FadeIn>
      </Container>

      {/* Auto-scrolling marquee — full width, breaks out of container */}
      <FadeIn delay={0.2}>
        <Box
          className="relative"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          }}
        >
          <Flex
            className="animate-landing-marquee"
            gap="5"
            style={{
              width: "max-content",
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            {marqueeItems.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Flex>
        </Box>
      </FadeIn>

      {/* CTA Section */}
      <Container size="4">
        <FadeIn delay={0.3}>
          <Flex
            direction="column"
            align="center"
            gap="5"
            mt="9"
            py="8"
            px="6"
            className="relative overflow-hidden rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-9), var(--accent-10))",
              textAlign: "center",
            }}
          >
            {/* Decorative elements */}
            <Box
              className="pointer-events-none absolute"
              aria-hidden="true"
              style={{
                width: 300,
                height: 300,
                top: "-30%",
                right: "-5%",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                filter: "blur(40px)",
              }}
            />
            <Box
              className="pointer-events-none absolute"
              aria-hidden="true"
              style={{
                width: 200,
                height: 200,
                bottom: "-20%",
                left: "10%",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                filter: "blur(30px)",
              }}
            />

            <Heading
              size="6"
              className="relative z-10"
              style={{ color: "white" }}
            >
              Prêt à moderniser votre commerce ?
            </Heading>
            <Text
              size="3"
              className="relative z-10"
              style={{
                color: "rgba(255,255,255,0.85)",
                maxWidth: 440,
                lineHeight: 1.65,
              }}
            >
              Oréma N+ est conçu pour les commerces gabonais. Simple, fiable et
              adapté à vos besoins.
            </Text>

            <Flex gap="3" wrap="wrap" justify="center" className="relative z-10">
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "14px 28px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(0,0,0,0.15)";
                }}
              >
                Essayer gratuitement
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                href="#contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: "white",
                  padding: "14px 28px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  border: "1.5px solid rgba(255, 255, 255, 0.4)",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.7)";
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.background = "transparent";
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
