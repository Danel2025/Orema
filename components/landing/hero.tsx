"use client";

import { Box, Flex, Heading, Text, Button, Container } from "@radix-ui/themes";
import { ArrowRight, Play, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

export function Hero() {
  return (
    <Box
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "var(--color-background)",
      }}
    >
      {/* Gradient overlay animé */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-4), transparent)",
        }}
      />

      {/* Cercles décoratifs animés */}
      <motion.div
        className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ duration: 2, ease: "easeOut" }}
        style={{
          background: "var(--accent-6)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -left-32 bottom-20 h-80 w-80 rounded-full blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
        style={{
          background: "var(--accent-6)",
        }}
      />

      {/* Motif géométrique africain */}
      <Box
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236e56cf' fill-opacity='1'%3E%3Cpath d='M40 40L20 20h40L40 40zm0 0L20 60h40L40 40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Hero Content */}
      <Container size="4" className="relative z-10">
        <Flex
          direction="column"
          align="center"
          justify="center"
          pt="9"
          pb="9"
          gap="6"
          style={{ minHeight: "100vh", paddingTop: 120 }}
        >
          {/* Badge */}
          <FadeIn delay={0.1}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="cursor-default"
            >
              <Box
                className="rounded-full"
                style={{
                  background: "var(--accent-a3)",
                  border: "1px solid var(--accent-a6)",
                  padding: "10px 20px",
                }}
              >
                <Flex align="center" gap="2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: "var(--green-9)", flexShrink: 0 }}
                  />
                  <Text
                    size="2"
                    weight="medium"
                    style={{ color: "var(--accent-11)" }}
                  >
                    Nouveau : Support Mobile Money Airtel & Moov
                  </Text>
                </Flex>
              </Box>
            </motion.div>
          </FadeIn>

          {/* Titre principal */}
          <FadeIn delay={0.2} className="max-w-3xl">
            <Heading
              size="9"
              align="center"
              style={{ lineHeight: 1.1 }}
            >
              Le{" "}
              <motion.span
                style={{
                  color: "var(--accent-9)",
                  display: "inline-block",
                }}
              >
                cœur
              </motion.span>{" "}
              de votre commerce
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
              Système de caisse moderne conçu pour les restaurants, bars et
              commerces africains. Simple, rapide, fiable — même sans internet.
            </Text>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.4}>
            <Flex gap="4" align="center" wrap="wrap" justify="center">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="4"
                  style={{
                    background: "var(--accent-9)",
                    boxShadow: "0 10px 30px var(--accent-a5)",
                  }}
                  asChild
                >
                  <Link href="/register" target="_blank">
                    Démarrer gratuitement
                    <ArrowRight size={18} />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="4" variant="outline" asChild>
                  <Link href="#demo">
                    <Play size={18} />
                    Voir la démo
                  </Link>
                </Button>
              </motion.div>
            </Flex>
          </FadeIn>

          {/* Trust badges avec stagger */}
          <StaggerContainer staggerDelay={0.1} className="mt-4">
            <Flex gap="6" align="center" wrap="wrap" justify="center">
              {[
                { label: "Mode hors-ligne", color: "var(--green-9)" },
                { label: "Support 24/7", color: "var(--blue-9)" },
                { label: "Données sécurisées", color: "var(--amber-9)" },
              ].map((badge, i) => (
                <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 rounded-full"
                    style={{
                      background: "var(--gray-a2)",
                      border: "1px solid var(--gray-a4)",
                      padding: "8px 14px",
                    }}
                  >
                    <CheckCircle size={14} weight="fill" style={{ color: badge.color, flexShrink: 0 }} />
                    <Text size="2" color="gray">
                      {badge.label}
                    </Text>
                  </motion.div>
                </StaggerItem>
              ))}
            </Flex>
          </StaggerContainer>

          {/* Screenshot de l'interface de caisse dans un cadre de fenêtre */}
          <FadeIn delay={0.6} className="relative mt-8 w-full max-w-4xl">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--gray-a5)",
                boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.15), 0 30px 60px -30px rgba(0, 0, 0, 0.2)",
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
                    Oréma N+ — Caisse
                  </Text>
                </Flex>
              </Flex>

              {/* Screenshot de l'interface */}
              <Box className="relative">
                <Image
                  src="/images/capture d'écran de la caisse.png"
                  alt="Interface de caisse Oréma N+ - Système de point de vente moderne"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </Box>
            </motion.div>

            {/* Glow effect */}
            <Box
              className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, var(--accent-6), transparent 70%)",
              }}
            />
          </FadeIn>
        </Flex>
      </Container>
    </Box>
  );
}
