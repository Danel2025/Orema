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
  Target,
  Eye,
  Users,
  Zap,
  Shield,
  Sparkles,
  Award,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Heart,
    title: "Proximité",
    description:
      "Nous sommes ancrés dans le tissu économique gabonais et africain. Nous comprenons vos défis quotidiens.",
    color: "red",
  },
  {
    icon: Zap,
    title: "Innovation",
    description:
      "Nous développons des solutions modernes adaptées aux réalités locales, avec les dernières technologies.",
    color: "amber",
  },
  {
    icon: Shield,
    title: "Fiabilité",
    description:
      "Notre système fonctionne même hors connexion. Vos données sont sécurisées et sauvegardées.",
    color: "green",
  },
  {
    icon: Users,
    title: "Accessibilité",
    description:
      "Des tarifs justes et transparents, pensés pour les commerçants de toutes tailles.",
    color: "blue",
  },
];

const stats = [
  { value: "500+", label: "Commerces équipés" },
  { value: "10M+", label: "Transactions traitées" },
  { value: "9", label: "Villes couvertes" },
  { value: "24/7", label: "Mode hors-ligne" },
];

const timeline = [
  {
    year: "2024",
    title: "Naissance d'Oréma N+",
    description:
      "Création de la société avec la vision de moderniser le commerce en Afrique.",
  },
  {
    year: "2025",
    title: "Lancement commercial",
    description:
      "Déploiement de la première version auprès de restaurants et commerces pilotes à Libreville.",
  },
  {
    year: "2026",
    title: "Expansion",
    description:
      "Extension vers d'autres villes du Gabon et préparation de l'expansion régionale.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="À propos d'Oréma N+"
        subtitle="Le cœur de votre commerce. Une solution de caisse moderne née au Gabon, pour l'Afrique."
        badge="Notre histoire"
      />

      {/* Mission & Vision */}
      <Container size="4" py="9">
        <Grid columns={{ initial: "1", md: "2" }} gap="6" mb="9">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Box
              p="6"
              style={{
                background:
                  "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
                borderRadius: 20,
                border: "1px solid var(--violet-a4)",
                height: "100%",
              }}
            >
              <Flex align="center" gap="3" mb="4">
                <Box
                  p="3"
                  style={{
                    background: "var(--violet-a4)",
                    borderRadius: 12,
                  }}
                >
                  <Target size={24} style={{ color: "var(--violet-9)" }} />
                </Box>
                <Heading size="5">Notre Mission</Heading>
              </Flex>
              <Text size="4" style={{ color: "var(--gray-11)", lineHeight: 1.8 }}>
                Démocratiser l&apos;accès à des outils de gestion modernes pour tous les
                commerçants africains, des petits maquis aux grandes enseignes, en proposant
                une solution <strong>simple</strong>, <strong>fiable</strong> et{" "}
                <strong>abordable</strong>.
              </Text>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Box
              p="6"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 20,
                border: "1px solid var(--gray-a4)",
                height: "100%",
              }}
            >
              <Flex align="center" gap="3" mb="4">
                <Box
                  p="3"
                  style={{
                    background: "var(--blue-a3)",
                    borderRadius: 12,
                  }}
                >
                  <Eye size={24} style={{ color: "var(--blue-9)" }} />
                </Box>
                <Heading size="5">Notre Vision</Heading>
              </Flex>
              <Text size="4" style={{ color: "var(--gray-11)", lineHeight: 1.8 }}>
                Devenir la référence des solutions de caisse en Afrique francophone,
                en accompagnant la transformation digitale du commerce africain avec
                des outils pensés <strong>par</strong> et <strong>pour</strong> les
                Africains.
              </Text>
            </Box>
          </motion.div>
        </Grid>

        {/* Origin story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Box
            mb="9"
            p="8"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 24,
              border: "1px solid var(--gray-a4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative gradient */}
            <Box
              position="absolute"
              style={{
                width: 300,
                height: 300,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, var(--violet-a3) 0%, transparent 70%)",
                top: -100,
                right: -100,
                pointerEvents: "none",
              }}
            />

            <Grid columns={{ initial: "1", md: "5" }} gap="6" position="relative">
              <Box style={{ gridColumn: "span 3" }}>
                <Flex align="center" gap="3" mb="4">
                  <Box
                    p="3"
                    style={{
                      background: "var(--violet-a3)",
                      borderRadius: 12,
                    }}
                  >
                    <Sparkles size={24} style={{ color: "var(--violet-9)" }} />
                  </Box>
                  <Heading size="5">Pourquoi &quot;Oréma&quot; ?</Heading>
                </Flex>
                <Text
                  size="4"
                  style={{ color: "var(--gray-11)", lineHeight: 1.9 }}
                >
                  <strong>&quot;Oréma&quot;</strong> signifie <strong>&quot;le cœur&quot;</strong> dans
                  notre langue locale. Ce nom incarne notre philosophie : être au
                  cœur de votre activité commerciale, comme un partenaire fiable et
                  indispensable.
                </Text>
                <Text
                  size="4"
                  mt="4"
                  style={{ color: "var(--gray-11)", lineHeight: 1.9, display: "block" }}
                >
                  Le <strong>&quot;N+&quot;</strong> représente notre engagement vers
                  l&apos;amélioration continue - toujours une version meilleure, toujours
                  plus de fonctionnalités, toujours plus proche de vos besoins.
                </Text>
              </Box>

              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="4"
                style={{ gridColumn: "span 2" }}
              >
                <Box
                  style={{
                    width: 120,
                    height: 120,
                    background:
                      "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 20px 40px -10px var(--violet-a6)",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 36,
                      fontWeight: 800,
                    }}
                  >
                    O+
                  </Text>
                </Box>
                <Flex align="center" gap="2">
                  <MapPin size={16} style={{ color: "var(--violet-9)" }} />
                  <Text size="2" weight="medium" style={{ color: "var(--violet-11)" }}>
                    Made in Gabon
                  </Text>
                </Flex>
              </Flex>
            </Grid>
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="9">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
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

        <Separator size="4" my="9" />

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Nos valeurs
            </Heading>
            <Text size="4" color="gray">
              Ce qui guide chacune de nos décisions
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
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

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Notre parcours
            </Heading>
            <Text size="4" color="gray">
              Les étapes clés de notre aventure
            </Text>
          </Box>

          <Flex direction="column" gap="4" mb="9">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.15, duration: 0.5 }}
              >
                <Flex gap="4" align="start">
                  <Box
                    px="4"
                    py="2"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
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
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Notre équipe
            </Heading>
            <Text size="4" color="gray">
              Des experts passionnés par le commerce africain
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {[
              {
                initials: "JN",
                role: "Fondateur & CEO",
                description: "Entrepreneur gabonais avec 10+ ans d'expérience dans le commerce et la tech.",
                color: "violet",
              },
              {
                initials: "AM",
                role: "Directrice Technique",
                description: "Ingénieure logiciel spécialisée en architectures distribuées et systèmes temps réel.",
                color: "blue",
              },
              {
                initials: "PO",
                role: "Responsable Commercial",
                description: "Expert du marché CHR gabonais, ancien responsable grands comptes dans la distribution.",
                color: "amber",
              },
              {
                initials: "SN",
                role: "Responsable Support",
                description: "Spécialiste de la relation client, passionnée par l'accompagnement des commerçants.",
                color: "green",
              },
            ].map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
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
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, var(--${member.color}-9) 0%, var(--${member.color}-11) 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: 700, fontSize: 20 }}>
                      {member.initials}
                    </Text>
                  </Box>
                  <Text size="3" weight="bold" style={{ display: "block" }}>
                    {member.role}
                  </Text>
                  <Text size="2" color="gray" mt="2" style={{ display: "block" }}>
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
            <Award
              size={48}
              style={{ color: "white", marginBottom: 16, opacity: 0.9 }}
            />
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Modernisez votre commerce avec Oréma N+
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
              Que vous soyez restaurateur, commerçant ou partenaire potentiel,
              découvrez comment Oréma N+ peut transformer votre activité.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="/register"
                style={{
                  textDecoration: "none",
                  background: "white",
                  color: "var(--violet-9)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "transform 0.2s",
                }}
              >
                Essayer gratuitement
              </Link>
              <Link
                href="#contact"
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
