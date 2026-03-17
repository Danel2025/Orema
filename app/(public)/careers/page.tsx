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
  Rocket,
  Heart,
  TrendingUp,
  Globe,
  Code,
  Megaphone,
  HeadphonesIcon,
  Palette,
  Server,
  MapPin,
  Clock,
  Laptop,
  GraduationCap,
  Users,
  Wifi,
  ChevronRight,
  Briefcase,
  Check,
} from "lucide-react";
import Link from "next/link";

const cultureValues = [
  {
    icon: Rocket,
    title: "Innovation",
    description:
      "Nous construisons des solutions qui n'existent pas encore sur le marché africain. Chaque jour est une opportunité d'innover.",
    color: "violet",
  },
  {
    icon: Heart,
    title: "Impact",
    description:
      "Notre travail transforme concrètement le quotidien de milliers de commerçants. Chaque fonctionnalité compte.",
    color: "red",
  },
  {
    icon: TrendingUp,
    title: "Croissance",
    description:
      "Nous investissons dans le développement de chaque membre de l'équipe. Votre progression est notre priorité.",
    color: "green",
  },
  {
    icon: Globe,
    title: "Diversité",
    description:
      "Une équipe multiculturelle qui reflète la richesse du continent africain. Toutes les perspectives sont valorisées.",
    color: "blue",
  },
];

const benefits = [
  {
    icon: Wifi,
    label: "Remote-friendly",
    description: "Travaillez d'où vous voulez, avec des réunions en présentiel mensuelles",
  },
  {
    icon: Laptop,
    label: "Matériel fourni",
    description: "MacBook Pro ou PC de votre choix, écran et accessoires inclus",
  },
  {
    icon: GraduationCap,
    label: "Formation continue",
    description: "Budget formation annuel et accès à des plateformes d'apprentissage",
  },
  {
    icon: Users,
    label: "Équipe soudée",
    description: "Team buildings réguliers, afterworks et événements d'équipe",
  },
  {
    icon: Clock,
    label: "Horaires flexibles",
    description: "Organisez votre journée comme vous le souhaitez, résultats avant présentiel",
  },
  {
    icon: TrendingUp,
    label: "Évolution rapide",
    description: "Startup en croissance avec de réelles opportunités de progression",
  },
];

const openPositions = [
  {
    title: "Développeur Full-Stack Senior",
    department: "Ingénierie",
    location: "Libreville / Remote",
    type: "CDI",
    icon: Code,
    color: "violet",
    description:
      "Rejoignez notre équipe technique pour développer les fonctionnalités clés de notre plateforme POS. Stack : Next.js, React, TypeScript, Supabase.",
    requirements: [
      "3+ ans d'expérience en développement web",
      "Maîtrise de React/Next.js et TypeScript",
      "Expérience avec PostgreSQL ou Supabase",
      "Autonomie et esprit d'initiative",
    ],
  },
  {
    title: "Commercial Terrain",
    department: "Ventes",
    location: "Libreville",
    type: "CDI",
    icon: Megaphone,
    color: "amber",
    description:
      "Développez notre portefeuille clients auprès des restaurants, commerces et établissements de Libreville et du Gabon.",
    requirements: [
      "2+ ans d'expérience en vente B2B",
      "Connaissance du tissu commercial gabonais",
      "Excellent relationnel et sens de la négociation",
      "Permis de conduire",
    ],
  },
  {
    title: "Chargé(e) de Support Client",
    department: "Support",
    location: "Libreville / Remote",
    type: "CDI",
    icon: HeadphonesIcon,
    color: "green",
    description:
      "Accompagnez nos utilisateurs au quotidien : onboarding, formation, résolution de problèmes et suivi de satisfaction.",
    requirements: [
      "Expérience en support client ou relation client",
      "Patience, écoute et excellente communication",
      "À l'aise avec les outils numériques",
      "Français courant, anglais apprécié",
    ],
  },
  {
    title: "Designer UX/UI",
    department: "Design",
    location: "Remote",
    type: "CDI",
    icon: Palette,
    color: "purple",
    description:
      "Concevez des interfaces intuitives et accessibles pour notre solution POS, en tenant compte des réalités du terrain africain.",
    requirements: [
      "Portfolio démontrant des compétences UX/UI",
      "Maîtrise de Figma",
      "Sensibilité aux problématiques d'accessibilité",
      "Expérience avec les design systems",
    ],
  },
  {
    title: "Ingénieur DevOps / SRE",
    department: "Infrastructure",
    location: "Remote",
    type: "CDI",
    icon: Server,
    color: "cyan",
    description:
      "Assurez la fiabilité, la performance et la sécurité de notre infrastructure cloud. Automatisez les déploiements et le monitoring.",
    requirements: [
      "Expérience avec Vercel, Supabase ou AWS",
      "Connaissance de Docker et CI/CD",
      "Compétences en monitoring et observabilité",
      "Sensibilité à la sécurité",
    ],
  },
];

const stats = [
  { value: "15+", label: "Collaborateurs" },
  { value: "4", label: "Nationalités" },
  { value: "60%", label: "En remote" },
  { value: "5", label: "Postes ouverts" },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader
        title="Rejoignez l'aventure"
        subtitle="Participez à la transformation digitale du commerce en Afrique. Nous recrutons des talents passionnés."
        badge="Carrières"
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
              background:
                "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Voir les postes ouverts
            <ChevronRight size={16} />
          </Link>
        </Flex>
      </PageHeader>

      <Container size="4" py="9">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="9">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    textAlign: "center",
                  }}
                >
                  <Text
                    size="8"
                    weight="bold"
                    style={{
                      display: "block",
                      background:
                        "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text size="2" color="gray">
                    {stat.label}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        {/* Culture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Notre culture
            </Heading>
            <Text size="4" color="gray">
              Ce qui fait d&apos;Oréma N+ un endroit unique où travailler
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {cultureValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              >
                <Box
                  p="5"
                  style={{
                    background: `var(--${value.color}-a2)`,
                    borderRadius: 16,
                    border: `1px solid var(--${value.color}-a4)`,
                    height: "100%",
                  }}
                >
                  <Box
                    mb="4"
                    p="3"
                    style={{
                      background: `var(--${value.color}-a3)`,
                      borderRadius: 12,
                      width: "fit-content",
                    }}
                  >
                    <value.icon
                      size={24}
                      style={{ color: `var(--${value.color}-9)` }}
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

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Avantages
            </Heading>
            <Text size="4" color="gray">
              Nous prenons soin de notre équipe
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4" mb="9">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.08, duration: 0.5 }}
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
                      background: "var(--violet-a3)",
                      borderRadius: 12,
                      flexShrink: 0,
                    }}
                  >
                    <benefit.icon
                      size={20}
                      style={{ color: "var(--violet-9)" }}
                    />
                  </Box>
                  <Box>
                    <Text size="3" weight="bold" style={{ display: "block" }}>
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
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Postes ouverts
            </Heading>
            <Text size="4" color="gray">
              Trouvez le rôle qui vous correspond
            </Text>
          </Box>

          <Flex direction="column" gap="4" mb="9">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.08, duration: 0.5 }}
              >
                <Box
                  p="6"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 20,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Grid
                    columns={{ initial: "1", md: "3" }}
                    gap="6"
                  >
                    <Box style={{ gridColumn: "span 2" }}>
                      <Flex align="center" gap="3" mb="3">
                        <Box
                          p="3"
                          style={{
                            background: `var(--${position.color}-a3)`,
                            borderRadius: 12,
                          }}
                        >
                          <position.icon
                            size={22}
                            style={{ color: `var(--${position.color}-9)` }}
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
                        Profil recherché
                      </Text>
                      <Flex direction="column" gap="2">
                        {position.requirements.map((req, i) => (
                          <Flex key={i} align="start" gap="2">
                            <Check
                              size={14}
                              style={{
                                color: `var(--${position.color}-9)`,
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
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <Box
            p="8"
            style={{
              background:
                "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              borderRadius: 24,
              textAlign: "center",
            }}
          >
            <Briefcase
              size={48}
              style={{ color: "white", marginBottom: 16, opacity: 0.9 }}
            />
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
              Envoyez-nous une candidature spontanée. Nous sommes toujours à la
              recherche de talents motivés pour rejoindre notre aventure.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="mailto:careers@orema-nplus.ga?subject=Candidature spontanée"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  color: "var(--violet-9)",
                  padding: "14px 28px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Postuler
                <ChevronRight size={16} />
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
