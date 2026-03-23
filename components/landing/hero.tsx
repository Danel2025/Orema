"use client";

import { Box, Flex, Heading, Text, Button, Container } from "@radix-ui/themes";
import { ArrowRight, Play } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { FadeIn } from "./motion-wrapper";

export function Hero() {
  return (
    <Box
      className="relative overflow-hidden"
      style={{
        background: "var(--color-background)",
      }}
    >
      {/* Grid background */}
      <Box
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--gray-a3) 1px, transparent 1px), linear-gradient(90deg, var(--gray-a3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 70%)",
        }}
      />

      {/* Accent glow */}
      <Box
        className="pointer-events-none absolute"
        aria-hidden="true"
        style={{
          width: 800,
          height: 800,
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--accent-a3) 0%, var(--accent-a2) 30%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Secondary glow */}
      <Box
        className="pointer-events-none absolute"
        aria-hidden="true"
        style={{
          width: 500,
          height: 500,
          bottom: "10%",
          right: "-10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--accent-a2) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Hero Content */}
      <Container size="4" className="relative z-10">
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="6"
          style={{ minHeight: "100vh", paddingTop: 120, paddingBottom: 80 }}
        >
          {/* Badge */}
          <FadeIn delay={0.1}>
            <Box
              className="rounded-full"
              style={{
                background: "var(--gray-a2)",
                border: "1px solid var(--gray-a5)",
                padding: "8px 16px",
              }}
            >
              <Text size="2" color="gray" weight="medium">
                Systeme de caisse pour le marche africain
              </Text>
            </Box>
          </FadeIn>

          {/* Titre principal */}
          <FadeIn delay={0.2} className="max-w-3xl">
            <Heading
              size="9"
              align="center"
              weight="bold"
              style={{ lineHeight: 1.08, letterSpacing: "-0.03em" }}
            >
              Votre caisse.{" "}
              <br className="hidden sm:block" />
              Vos donnees.{" "}
              <Text
                style={{
                  color: "var(--accent-9)",
                }}
                asChild
              >
                <span>Votre controle.</span>
              </Text>
            </Heading>
          </FadeIn>

          {/* Sous-titre */}
          <FadeIn delay={0.3} className="max-w-xl">
            <Text
              size="4"
              align="center"
              color="gray"
              style={{ lineHeight: 1.7 }}
            >
              Encaissez, gerez vos stocks et suivez vos ventes en temps reel.
              Concu pour les restaurants, bars et commerces au Gabon — meme sans
              internet.
            </Text>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.4}>
            <Flex gap="4" align="center" wrap="wrap" justify="center">
              <Button
                size="4"
                style={{
                  background: "var(--accent-9)",
                  cursor: "pointer",
                }}
                asChild
              >
                <Link href="/register" target="_blank">
                  Demarrer gratuitement
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button size="4" variant="outline" asChild>
                <Link href="#demo" style={{ cursor: "pointer" }}>
                  <Play size={18} weight="fill" />
                  Voir la demo
                </Link>
              </Button>
            </Flex>
          </FadeIn>

          {/* Trust indicators - clean, no hover animations */}
          <FadeIn delay={0.5}>
            <Flex gap="6" align="center" wrap="wrap" justify="center" mt="2">
              {[
                "Mode hors-ligne",
                "Donnees securisees",
                "Mobile Money integre",
              ].map((label, i) => (
                <Flex key={i} align="center" gap="2">
                  <Box
                    className="rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: "var(--accent-9)",
                      flexShrink: 0,
                    }}
                  />
                  <Text size="2" color="gray">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </FadeIn>

          {/* Screenshot */}
          <FadeIn delay={0.6} className="relative mt-8 w-full max-w-4xl">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.8,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden rounded-xl"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--gray-a4)",
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--gray-a3)",
              }}
            >
              {/* Window controls */}
              <Flex
                gap="2"
                align="center"
                px="4"
                py="3"
                style={{
                  background: "var(--gray-a2)",
                  borderBottom: "1px solid var(--gray-a4)",
                }}
              >
                <Box
                  className="h-3 w-3 rounded-full"
                  style={{ background: "#ff5f57" }}
                />
                <Box
                  className="h-3 w-3 rounded-full"
                  style={{ background: "#febc2e" }}
                />
                <Box
                  className="h-3 w-3 rounded-full"
                  style={{ background: "#28c840" }}
                />
                <Flex
                  align="center"
                  gap="2"
                  className="ml-4 flex-1 rounded-md"
                  px="3"
                  py="1"
                  style={{ background: "var(--gray-a3)" }}
                >
                  <Box
                    className="h-2 w-2 rounded-full"
                    style={{ background: "#28c840" }}
                  />
                  <Text size="1" color="gray">
                    Orema N+ — Caisse
                  </Text>
                </Flex>
              </Flex>

              {/* Screenshot */}
              <Box className="relative">
                <Image
                  src="/images/capture d'écran de la caisse.png"
                  alt="Interface de caisse Orema N+ - Systeme de point de vente moderne"
                  width={1920}
                  height={1080}
                  className="h-auto w-full"
                  priority
                />
              </Box>
            </motion.div>
          </FadeIn>
        </Flex>
      </Container>
    </Box>
  );
}
