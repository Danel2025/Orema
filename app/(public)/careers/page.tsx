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
  Code,
  Megaphone,
  Headphones,
  PaintBrush,
  HardDrives,
  MapPin,
  Clock,
  Laptop,
  GraduationCap,
  Users,
  WifiHigh,
  TrendUp,
  Briefcase,
  Check,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";

const benefits = [
  {
    icon: WifiHigh,
    label: "Travail flexible",
    description:
      "Travaillez en presentiel ou a distance, avec des reunions d'equipe regulieres.",
  },
  {
    icon: Laptop,
    label: "Materiel fourni",
    description: "Equipement de travail complet fourni des votre arrivee.",
  },
  {
    icon: GraduationCap,
    label: "Formation continue",
    description:
      "Budget formation annuel et acces a des plateformes d'apprentissage.",
  },
  {
    icon: Users,
    label: "Equipe soudee",
    description: "Evenements d'equipe reguliers et environnement collaboratif.",
  },
  {
    icon: Clock,
    label: "Horaires flexibles",
    description:
      "Organisation autonome, avec une culture orientee resultats.",
  },
  {
    icon: TrendUp,
    label: "Evolution",
    description:
      "Entreprise en croissance avec des opportunites de progression reelles.",
  },
];

const openPositions = [
  {
    title: "Developpeur Full-Stack Senior",
    department: "Ingenierie",
    location: "Libreville / Remote",
    type: "CDI",
    icon: Code,
    description:
      "Developpez les fonctionnalites cles de notre plateforme POS. Stack : Next.js, React, TypeScript, Supabase.",
    requirements: [
      "3+ ans d'experience en developpement web",
      "Maitrise de React/Next.js et TypeScript",
      "Experience avec PostgreSQL ou Supabase",
      "Autonomie et esprit d'initiative",
    ],
  },
  {
    title: "Commercial Terrain",
    department: "Ventes",
    location: "Libreville",
    type: "CDI",
    icon: Megaphone,
    description:
      "Developpez notre portefeuille clients aupres des restaurants, commerces et etablissements du Gabon.",
    requirements: [
      "2+ ans d'experience en vente B2B",
      "Connaissance du tissu commercial gabonais",
      "Excellent relationnel et sens de la negociation",
      "Permis de conduire",
    ],
  },
  {
    title: "Charge(e) de Support Client",
    department: "Support",
    location: "Libreville / Remote",
    type: "CDI",
    icon: Headphones,
    description:
      "Accompagnez nos utilisateurs au quotidien : onboarding, formation, resolution de problemes.",
    requirements: [
      "Experience en support client ou relation client",
      "Patience, ecoute et communication claire",
      "A l'aise avec les outils numeriques",
      "Francais courant, anglais apprecie",
    ],
  },
  {
    title: "Designer UX/UI",
    department: "Design",
    location: "Remote",
    type: "CDI",
    icon: PaintBrush,
    description:
      "Concevez des interfaces intuitives et accessibles pour notre solution POS, adaptees au terrain africain.",
    requirements: [
      "Portfolio demontrant des competences UX/UI",
      "Maitrise de Figma",
      "Sensibilite aux problematiques d'accessibilite",
      "Experience avec les design systems",
    ],
  },
  {
    title: "Ingenieur DevOps / SRE",
    department: "Infrastructure",
    location: "Remote",
    type: "CDI",
    icon: HardDrives,
    description:
      "Assurez la fiabilite, la performance et la securite de notre infrastructure cloud.",
    requirements: [
      "Experience avec Vercel, Supabase ou AWS",
      "Connaissance de Docker et CI/CD",
      "Competences en monitoring et observabilite",
      "Sensibilite a la securite",
    ],
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader
        title="Carrieres"
        subtitle="Participez a la transformation digitale du commerce en Afrique. Nous recrutons des professionnels motives."
        badge="Recrutement"
      >
        <Flex gap="3" justify="center" mt="6">
          <Link
            href="#postes"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 9999,
              background: "var(--accent-9)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Voir les postes ouverts
            <CaretRight size={16} weight="bold" />
          </Link>
        </Flex>
      </PageHeader>

      <Container size="4" py="9">
        {/* Why join us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Pourquoi nous rejoindre
            </Heading>
            <Text size="4" color="gray">
              Ce que nous offrons a nos collaborateurs
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4" mb="9">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
              >
                <Flex
                  gap="4"
                  p="5"
                  align="start"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    height: "100%",
                  }}
                >
                  <Box
                    p="3"
                    style={{
                      background: "var(--accent-a3)",
                      borderRadius: 12,
                      flexShrink: 0,
                    }}
                  >
                    <benefit.icon
                      size={20}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Box>
                    <Text
                      size="3"
                      weight="bold"
                      style={{ display: "block" }}
                    >
                      {benefit.label}
                    </Text>
                    <Text size="2" color="gray">
                      {benefit.description}
                    </Text>
                  </Box>
                </Flex>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Open Positions */}
        <motion.div
          id="postes"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Postes ouverts
            </Heading>
            <Text size="4" color="gray">
              {openPositions.length} postes a pourvoir actuellement
            </Text>
          </Box>

          <Flex direction="column" gap="4" mb="9">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.08, duration: 0.4 }}
              >
                <Box
                  p="6"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Grid columns={{ initial: "1", md: "3" }} gap="6">
                    <Box style={{ gridColumn: "span 2" }}>
                      <Flex align="center" gap="3" mb="3">
                        <Box
                          p="3"
                          style={{
                            background: "var(--accent-a3)",
                            borderRadius: 12,
                          }}
                        >
                          <position.icon
                            size={22}
                            weight="duotone"
                            style={{ color: "var(--accent-9)" }}
                          />
                        </Box>
                        <Box>
                          <Heading size="4">{position.title}</Heading>
                          <Flex gap="3" mt="1">
                            <Flex align="center" gap="1">
                              <Briefcase
                                size={13}
                                style={{ color: "var(--gray-9)" }}
                              />
                              <Text size="1" color="gray">
                                {position.department}
                              </Text>
                            </Flex>
                            <Flex align="center" gap="1">
                              <MapPin
                                size={13}
                                style={{ color: "var(--gray-9)" }}
                              />
                              <Text size="1" color="gray">
                                {position.location}
                              </Text>
                            </Flex>
                            <Box
                              px="2"
                              py="1"
                              style={{
                                background: "var(--green-a3)",
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                size="1"
                                weight="medium"
                                style={{ color: "var(--green-11)" }}
                              >
                                {position.type}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                      </Flex>
                      <Text
                        size="3"
                        style={{
                          color: "var(--gray-11)",
                          lineHeight: 1.7,
                          display: "block",
                        }}
                      >
                        {position.description}
                      </Text>
                    </Box>

                    <Box>
                      <Text
                        size="2"
                        weight="bold"
                        mb="3"
                        style={{ display: "block" }}
                      >
                        Profil recherche
                      </Text>
                      <Flex direction="column" gap="2">
                        {position.requirements.map((req, i) => (
                          <Flex key={i} align="start" gap="2">
                            <Check
                              size={14}
                              weight="bold"
                              style={{
                                color: "var(--accent-9)",
                                flexShrink: 0,
                                marginTop: 3,
                              }}
                            />
                            <Text size="2" color="gray">
                              {req}
                            </Text>
                          </Flex>
                        ))}
                      </Flex>
                    </Box>
                  </Grid>
                </Box>
              </motion.div>
            ))}
          </Flex>
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
              Vous ne trouvez pas votre poste ?
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
              Envoyez-nous une candidature spontanee. Nous sommes toujours a la
              recherche de professionnels motives.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="mailto:careers@orema-nplus.ga?subject=Candidature spontanee"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "14px 28px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Postuler
                <CaretRight size={16} weight="bold" />
              </Link>
              <Link
                href="/about"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "14px 28px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                En savoir plus sur nous
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
