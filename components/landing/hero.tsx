"use client";

import { Box, Flex, Heading, Text, Container } from "@radix-ui/themes";
import {
  ArrowRight,
  Play,
  Heart,
  Lightning,
  ShieldCheck,
  WifiSlash,
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { FadeIn } from "./motion-wrapper";

const trustPoints = [
  { icon: WifiSlash, label: "Mode hors-ligne" },
  { icon: ShieldCheck, label: "Données sécurisées" },
  { icon: Lightning, label: "Mobile Money intégré" },
];

const floatingMetrics = [
  {
    value: "+30%",
    label: "de rapidité",
    position: { top: "18%", left: "-6%" },
    delay: 0,
  },
  {
    value: "0 FCFA",
    label: "pour démarrer",
    position: { top: "55%", right: "-5%" },
    delay: 1.5,
  },
  {
    value: "99,9%",
    label: "disponibilité",
    position: { bottom: "8%", left: "5%" },
    delay: 3,
  },
];

export function Hero() {
  return (
    <Box
      className="relative overflow-hidden"
      style={{ background: "var(--color-background)" }}
    >
      {/* African geometric pattern overlay */}
      <Box
        className="landing-african-pattern pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          color: "var(--gray-11)",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 35%, black 10%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 35%, black 10%, transparent 70%)",
        }}
      />

      {/* Primary gradient orb — warm orange, breathing */}
      <motion.div
        className="pointer-events-none absolute"
        aria-hidden="true"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 900,
          height: 900,
          top: "-35%",
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--accent-a4) 0%, var(--accent-a2) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Secondary glow — bottom right */}
      <Box
        className="pointer-events-none absolute"
        aria-hidden="true"
        style={{
          width: 600,
          height: 600,
          bottom: "5%",
          right: "-15%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--accent-a3) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Subtle grid lines */}
      <Box
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--gray-a2) 1px, transparent 1px), linear-gradient(90deg, var(--gray-a2) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 60% 40% at 50% 50%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 40% at 50% 50%, black 20%, transparent 70%)",
        }}
      />

      {/* Hero Content */}
      <Container size="4" className="relative z-10">
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="7"
          style={{ minHeight: "100vh", paddingTop: 130, paddingBottom: 80 }}
        >
          {/* Heartbeat badge */}
          <FadeIn delay={0.1}>
            <Box
              className="animate-landing-glow rounded-full"
              style={{
                background: "var(--accent-a3)",
                border: "1px solid var(--accent-a5)",
                padding: "10px 22px",
              }}
            >
              <Flex align="center" gap="2">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ display: "flex" }}
                >
                  <Heart
                    size={15}
                    weight="fill"
                    style={{ color: "var(--accent-9)" }}
                  />
                </motion.span>
                <Text
                  size="2"
                  weight="medium"
                  style={{ color: "var(--accent-11)" }}
                >
                  Système de caisse pour le marché africain
                </Text>
              </Flex>
            </Box>
          </FadeIn>

          {/* Main headline */}
          <FadeIn delay={0.2} className="max-w-4xl">
            <Heading
              size="9"
              align="center"
              weight="bold"
              style={{
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                fontSize: "clamp(44px, 6.5vw, 76px)",
              }}
            >
              Le{" "}
              <span
                className="animate-landing-gradient-x"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-9), var(--orange-11), var(--accent-9))",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                cœur
              </span>{" "}
              de votre
              <br className="hidden sm:block" />
              commerce bat ici.
            </Heading>
          </FadeIn>

          {/* Subheadline */}
          <FadeIn delay={0.35} className="max-w-xl">
            <Text
              size="4"
              align="center"
              style={{ color: "var(--gray-10)", lineHeight: 1.75 }}
            >
              Encaissez, gérez vos stocks et suivez vos ventes en temps réel.
              Conçu pour les restaurants, bars et maquis au Gabon — même sans
              internet.
            </Text>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.45}>
            <Flex gap="4" align="center" wrap="wrap" justify="center">
              <Link
                href="/register"
                className="group"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 28px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "white",
                  background:
                    "linear-gradient(135deg, var(--accent-9), var(--accent-10))",
                  textDecoration: "none",
                  boxShadow:
                    "0 4px 15px var(--accent-a5), 0 1px 3px rgba(0,0,0,0.1)",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px var(--accent-a6), 0 2px 6px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px var(--accent-a5), 0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                Démarrer gratuitement
                <ArrowRight size={18} weight="bold" />
              </Link>

              <Link
                href="#demo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 24px",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 15,
                  color: "var(--gray-11)",
                  background: "transparent",
                  border: "1px solid var(--gray-a5)",
                  textDecoration: "none",
                  transition:
                    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--gray-a3)";
                  e.currentTarget.style.borderColor = "var(--gray-a7)";
                  e.currentTarget.style.color = "var(--gray-12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "var(--gray-a5)";
                  e.currentTarget.style.color = "var(--gray-11)";
                }}
              >
                <Play size={17} weight="fill" />
                Voir la démo
              </Link>
            </Flex>
          </FadeIn>

          {/* Trust indicators */}
          <FadeIn delay={0.55}>
            <Flex gap="6" align="center" wrap="wrap" justify="center">
              {trustPoints.map((point, i) => {
                const Icon = point.icon;
                return (
                  <Flex key={i} align="center" gap="2">
                    <Icon
                      size={15}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                    <Text size="2" style={{ color: "var(--gray-9)" }}>
                      {point.label}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </FadeIn>

          {/* Dashboard screenshot with floating metrics */}
          <FadeIn delay={0.6} className="relative mt-6 w-full max-w-4xl">
            <div className="relative">
              {/* Floating metric cards */}
              {floatingMetrics.map((metric, i) => (
                <motion.div
                  key={i}
                  className="absolute hidden lg:block"
                  style={{
                    ...metric.position,
                    zIndex: 20,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.2 + i * 0.2,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 5,
                      delay: metric.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-background) 90%, transparent)",
                      backdropFilter: "blur(16px) saturate(180%)",
                      WebkitBackdropFilter: "blur(16px) saturate(180%)",
                      border: "1px solid var(--gray-a4)",
                      borderRadius: 14,
                      padding: "14px 20px",
                      boxShadow:
                        "0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px var(--gray-a2)",
                    }}
                  >
                    <Text
                      size="4"
                      weight="bold"
                      style={{
                        display: "block",
                        color: "var(--accent-9)",
                        fontFamily:
                          "var(--font-google-sans-code), monospace",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                      }}
                    >
                      {metric.value}
                    </Text>
                    <Text
                      size="1"
                      style={{ color: "var(--gray-9)", marginTop: 2, display: "block" }}
                    >
                      {metric.label}
                    </Text>
                  </motion.div>
                </motion.div>
              ))}

              {/* Screenshot frame */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.9,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative overflow-hidden rounded-2xl"
                style={{
                  zIndex: 10,
                  background: "var(--color-background)",
                  border: "1px solid var(--gray-a4)",
                  boxShadow:
                    "0 30px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--gray-a3), 0 0 80px -20px var(--accent-a3)",
                }}
              >
                {/* macOS window bar */}
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
                      Oréma N+ — Tableau de bord
                    </Text>
                  </Flex>
                </Flex>

                {/* Screenshot image */}
                <Box className="relative">
                  <Image
                    src="/images/demo/04-tableau-de-bord.png"
                    alt="Tableau de bord Oréma N+ — Système de point de vente moderne pour le Gabon"
                    width={1920}
                    height={1080}
                    className="h-auto w-full"
                    priority
                  />
                  {/* Bottom fade */}
                  <Box
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                    style={{
                      background:
                        "linear-gradient(to top, var(--color-background), transparent)",
                    }}
                  />
                </Box>
              </motion.div>
            </div>
          </FadeIn>
        </Flex>
      </Container>
    </Box>
  );
}
