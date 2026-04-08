"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Separator,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Heart,
  Crosshair,
  Eye,
  Lightning,
  ShieldCheck,
  Users,
  MapPin,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";

const values = [
  {
    icon: ShieldCheck,
    title: "Fiabilite",
    description:
      "Un systeme qui fonctionne en permanence, meme hors connexion. Vos données sont sécurisées et sauvegardees automatiquement.",
  },
  {
    icon: Lightning,
    title: "Simplicite",
    description:
      "Une interface intuitive qui ne necessite aucune formation complexe. Prise en main en moins de 30 minutes.",
  },
  {
    icon: Heart,
    title: "Proximite",
    description:
      "Bases a Libreville, nous comprenons les realites du commerce gabonais et africain. Support local et reactif.",
  },
  {
    icon: Crosshair,
    title: "Innovation",
    description:
      "Des solutions technologiques modernes adaptees aux specificites locales : Mobile Money, mode hors-ligne, impression thermique.",
  },
];

const timeline = [
  {
    year: "2024",
    title: "Creation",
    description:
      "Fondation d'Orema N+ SARL a Libreville avec l'objectif de moderniser les outils de gestion commerciale en Afrique.",
  },
  {
    year: "2025",
    title: "Lancement",
    description:
      "Deploiement de la plateforme aupres de restaurants et commerces pilotes a Libreville. Premiers retours clients integres.",
  },
  {
    year: "2026",
    title: "Expansion",
    description:
      "Extension vers d'autres villes du Gabon. Preparation de l'expansion regionale en Afrique centrale.",
  },
];

const team = [
  {
    initials: "JN",
    role: "Fondateur & Gerant",
    description:
      "Entrepreneur gabonais, 10+ ans d'experience dans le commerce et la technologie.",
  },
  {
    initials: "AM",
    role: "Directrice Technique",
    description:
      "Ingenieure logiciel, specialisee en architectures distribuees et systemes temps reel.",
  },
  {
    initials: "PO",
    role: "Responsable Commercial",
    description:
      "Expert du marche CHR gabonais, ancien responsable grands comptes en distribution.",
  },
  {
    initials: "SN",
    role: "Responsable Support",
    description:
      "Specialiste relation client, dediee a l'accompagnement des commercants au quotidien.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="A propos d'Orema N+"
        subtitle="Solution de caisse moderne concue au Gabon, pour le commerce africain."
        badge="Notre entreprise"
      />

      <Container size="4" py="9">
        {/* Mission & Vision */}
        <Grid columns={{ initial: "1", md: "2" }} gap="6" mb="9">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Box
              p="6"
              style={{
                background: "var(--accent-a2)",
                borderRadius: 16,
                border: "1px solid var(--accent-a4)",
                height: "100%",
              }}
            >
              <Flex align="center" gap="3" mb="4">
                <Box
                  p="3"
                  style={{
                    background: "var(--accent-a3)",
                    borderRadius: 12,
                  }}
                >
                  <Crosshair
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Heading size="5">Notre mission</Heading>
              </Flex>
              <Text
                size="4"
                style={{ color: "var(--gray-11)", lineHeight: 1.8 }}
              >
                Fournir aux commercants africains des outils de gestion
                modernes, fiables et abordables, adaptes a leurs realites
                quotidiennes.
              </Text>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Box
              p="6"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 16,
                border: "1px solid var(--gray-a4)",
                height: "100%",
              }}
            >
              <Flex align="center" gap="3" mb="4">
                <Box
                  p="3"
                  style={{
                    background: "var(--gray-a3)",
                    borderRadius: 12,
                  }}
                >
                  <Eye
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--gray-11)" }}
                  />
                </Box>
                <Heading size="5">Notre vision</Heading>
              </Flex>
              <Text
                size="4"
                style={{ color: "var(--gray-11)", lineHeight: 1.8 }}
              >
                Devenir la reference des solutions de caisse en Afrique
                francophone, en accompagnant la transformation digitale du
                commerce avec des outils concus pour le terrain.
              </Text>
            </Box>
          </motion.div>
        </Grid>

        {/* Origin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Box
            mb="9"
            p="8"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Grid
              columns={{ initial: "1", md: "3" }}
              gap="6"
            >
              <Box style={{ gridColumn: "span 2" }}>
                <Heading size="5" mb="4">
                  Pourquoi &quot;Orema&quot; ?
                </Heading>
                <Text
                  size="4"
                  style={{
                    color: "var(--gray-11)",
                    lineHeight: 1.9,
                    display: "block",
                  }}
                >
                  <strong>&quot;Orema&quot;</strong> signifie{" "}
                  <strong>&quot;le coeur&quot;</strong> dans notre langue locale.
                  Ce nom reflete notre vocation : etre au coeur de l&apos;activite
                  commerciale de nos clients, comme un partenaire fiable au
                  quotidien.
                </Text>
                <Text
                  size="4"
                  mt="4"
                  style={{
                    color: "var(--gray-11)",
                    lineHeight: 1.9,
                    display: "block",
                  }}
                >
                  Le <strong>&quot;N+&quot;</strong> represente notre engagement
                  vers l&apos;amelioration continue : chaque mise a jour apporte
                  des fonctionnalites demandees par nos utilisateurs.
                </Text>
              </Box>

              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="3"
              >
                <Box
                  style={{
                    width: 100,
                    height: 100,
                    background: "var(--accent-9)",
                    borderRadius: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 32,
                      fontWeight: 800,
                    }}
                  >
                    O+
                  </Text>
                </Box>
                <Flex align="center" gap="2">
                  <MapPin
                    size={16}
                    weight="fill"
                    style={{ color: "var(--accent-9)" }}
                  />
                  <Text
                    size="2"
                    weight="medium"
                    style={{ color: "var(--accent-11)" }}
                  >
                    Concu au Gabon
                  </Text>
                </Flex>
              </Flex>
            </Grid>
          </Box>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Nos valeurs
            </Heading>
            <Text size="4" color="gray">
              Les principes qui guident notre travail au quotidien
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    height: "100%",
                  }}
                >
                  <Box
                    mb="4"
                    p="3"
                    style={{
                      background: "var(--accent-a3)",
                      borderRadius: 12,
                      width: "fit-content",
                    }}
                  >
                    <value.icon
                      size={24}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Heading size="4" mb="2">
                    {value.title}
                  </Heading>
                  <Text size="2" color="gray">
                    {value.description}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Notre parcours
            </Heading>
            <Text size="4" color="gray">
              Les etapes cles de notre developpement
            </Text>
          </Box>

          <Flex direction="column" gap="4" mb="9">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              >
                <Flex gap="4" align="start">
                  <Box
                    px="4"
                    py="2"
                    style={{
                      background: "var(--accent-9)",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      size="2"
                      weight="bold"
                      style={{ color: "white" }}
                    >
                      {item.year}
                    </Text>
                  </Box>
                  <Box
                    p="5"
                    style={{
                      background: "var(--gray-a2)",
                      borderRadius: 12,
                      border: "1px solid var(--gray-a4)",
                      flex: 1,
                    }}
                  >
                    <Heading size="4" mb="2">
                      {item.title}
                    </Heading>
                    <Text size="3" color="gray">
                      {item.description}
                    </Text>
                  </Box>
                </Flex>
              </motion.div>
            ))}
          </Flex>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Notre equipe
            </Heading>
            <Text size="4" color="gray">
              Des professionnels dedies au commerce africain
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {team.map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    textAlign: "center",
                    height: "100%",
                  }}
                >
                  <Box
                    mx="auto"
                    mb="4"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "var(--accent-9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ color: "white", fontWeight: 700, fontSize: 18 }}
                    >
                      {member.initials}
                    </Text>
                  </Box>
                  <Text
                    size="3"
                    weight="bold"
                    style={{ display: "block" }}
                  >
                    {member.role}
                  </Text>
                  <Text
                    size="2"
                    color="gray"
                    mt="2"
                    style={{ display: "block" }}
                  >
                    {member.description}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Box
            p="8"
            style={{
              background: "var(--accent-9)",
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Modernisez votre commerce avec Orema N+
            </Heading>
            <Text
              size="4"
              mb="6"
              style={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 500,
                margin: "0 auto",
                display: "block",
              }}
            >
              Decouvrez comment notre solution peut simplifier la gestion de
              votre activite au quotidien.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="/register"
                style={{
                  textDecoration: "none",
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Essayer gratuitement
              </Link>
              <Link
                href="mailto:contact@orema-nplus.ga"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                Nous contacter
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
