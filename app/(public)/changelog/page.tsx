"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Separator,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Tag,
  Check,
  RocketLaunch,
  Bug,
  ShieldCheck,
  Sparkle,
  ArrowUp,
  CaretRight,
} from "@phosphor-icons/react";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "Lancement" | "Beta" | "A venir";
  typeColor: string;
  typeBg: string;
  changes: {
    icon: typeof Check;
    text: string;
  }[];
}

const releases: ChangelogEntry[] = [
  {
    version: "v1.0.0",
    date: "18 mars 2026",
    type: "Lancement",
    typeColor: "var(--green-11)",
    typeBg: "var(--green-a3)",
    changes: [
      {
        icon: RocketLaunch,
        text: "Système de caisse complet (vente directe, table, livraison, emporter)",
      },
      {
        icon: Check,
        text: "Gestion des produits avec stock et categories",
      },
      {
        icon: Check,
        text: "Plan de salle interactif avec drag & drop",
      },
      {
        icon: Check,
        text: "Paiements multiples (especes, carte, Mobile Money)",
      },
      {
        icon: Check,
        text: "Rapports et statistiques detailles",
      },
      {
        icon: Check,
        text: "Impression thermique ESC/POS",
      },
      {
        icon: Check,
        text: "Gestion des clients et fidelite",
      },
      {
        icon: Check,
        text: "Mode hors-ligne avec synchronisation",
      },
    ],
  },
  {
    version: "v0.9.0",
    date: "1er mars 2026",
    type: "Beta",
    typeColor: "var(--blue-11)",
    typeBg: "var(--blue-a3)",
    changes: [
      {
        icon: ShieldCheck,
        text: "Tests E2E complets sur l'ensemble des parcours utilisateurs",
      },
      {
        icon: ShieldCheck,
        text: "Sécurité renforcée (Row-Level Security, validation des entrées)",
      },
      {
        icon: Bug,
        text: "Corrections de performance et optimisations du rendu",
      },
      {
        icon: ArrowUp,
        text: "Amélioration de l'expérience utilisateur sur les formulaires",
      },
    ],
  },
];

const roadmap = [
  {
    icon: Sparkle,
    text: "Application mobile (React Native)",
  },
  {
    icon: Sparkle,
    text: "Integration comptable",
  },
  {
    icon: Sparkle,
    text: "Programme de fidelite avance",
  },
  {
    icon: Sparkle,
    text: "Multi-etablissements",
  },
];

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        title="Journal des mises a jour"
        subtitle="Suivez l'evolution de la plateforme Orema N+"
        badge="Changelog"
      />

      <Container size="3" py="9">
        {/* Released versions */}
        <Flex direction="column" gap="8">
          {releases.map((release, releaseIndex) => (
            <motion.div
              key={release.version}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + releaseIndex * 0.15,
                duration: 0.4,
              }}
            >
              <Box
                p="6"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 16,
                  border: "1px solid var(--gray-a4)",
                }}
              >
                {/* Version header */}
                <Flex
                  align="center"
                  gap="3"
                  mb="5"
                  wrap="wrap"
                >
                  <Flex align="center" gap="2">
                    <Box
                      p="2"
                      style={{
                        background: "var(--accent-a3)",
                        borderRadius: 10,
                      }}
                    >
                      <Tag
                        size={20}
                        weight="duotone"
                        style={{ color: "var(--accent-9)" }}
                      />
                    </Box>
                    <Heading size="5">{release.version}</Heading>
                  </Flex>

                  <Box
                    px="3"
                    py="1"
                    style={{
                      background: release.typeBg,
                      borderRadius: 9999,
                    }}
                  >
                    <Text
                      size="1"
                      weight="bold"
                      style={{ color: release.typeColor }}
                    >
                      {release.type}
                    </Text>
                  </Box>

                  <Text size="2" color="gray">
                    {release.date}
                  </Text>
                </Flex>

                {/* Changes list */}
                <Flex direction="column" gap="3">
                  {release.changes.map((change, changeIndex) => (
                    <motion.div
                      key={changeIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay:
                          0.4 +
                          releaseIndex * 0.15 +
                          changeIndex * 0.05,
                        duration: 0.3,
                      }}
                    >
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            flexShrink: 0,
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: "var(--accent-a3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <change.icon
                            size={16}
                            weight="bold"
                            style={{ color: "var(--accent-9)" }}
                          />
                        </Box>
                        <Text size="3" style={{ color: "var(--gray-11)" }}>
                          {change.text}
                        </Text>
                      </Flex>
                    </motion.div>
                  ))}
                </Flex>
              </Box>
            </motion.div>
          ))}
        </Flex>

        <Separator size="4" my="9" />

        {/* Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Box
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3" mb="5" wrap="wrap">
              <Flex align="center" gap="2">
                <Box
                  p="2"
                  style={{
                    background: "var(--gray-a3)",
                    borderRadius: 10,
                  }}
                >
                  <RocketLaunch
                    size={20}
                    weight="duotone"
                    style={{ color: "var(--gray-11)" }}
                  />
                </Box>
                <Heading size="5">Prochainement</Heading>
              </Flex>

              <Box
                px="3"
                py="1"
                style={{
                  background: "var(--gray-a3)",
                  borderRadius: 9999,
                }}
              >
                <Text
                  size="1"
                  weight="bold"
                  style={{ color: "var(--gray-11)" }}
                >
                  A venir
                </Text>
              </Box>
            </Flex>

            <Flex direction="column" gap="3">
              {roadmap.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.7 + index * 0.05,
                    duration: 0.3,
                  }}
                >
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "var(--gray-a3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <item.icon
                        size={16}
                        weight="bold"
                        style={{ color: "var(--gray-11)" }}
                      />
                    </Box>
                    <Text size="3" style={{ color: "var(--gray-11)" }}>
                      {item.text}
                    </Text>
                  </Flex>
                </motion.div>
              ))}
            </Flex>
          </Box>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Box
            mt="9"
            p="6"
            style={{
              background: "var(--accent-a2)",
              borderRadius: 16,
              border: "1px solid var(--accent-a4)",
              textAlign: "center",
            }}
          >
            <Heading size="5" mb="2">
              Restez informe des nouveautes
            </Heading>
            <Text
              size="3"
              color="gray"
              mb="4"
              style={{ display: "block" }}
            >
              Consultez regulierement cette page pour suivre les evolutions
              de la plateforme.
            </Text>
            <a
              href="/guide"
              style={{
                textDecoration: "none",
                background: "var(--accent-9)",
                color: "white",
                padding: "10px 24px",
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Decouvrir le guide
              <CaretRight size={16} weight="bold" />
            </a>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
