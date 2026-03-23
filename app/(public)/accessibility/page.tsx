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
  Wheelchair,
  Eye,
  Keyboard,
  HandPointing,
  Ear,
  Monitor,
  DeviceMobile,
  Envelope,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";

const features = [
  {
    icon: Keyboard,
    title: "Navigation au clavier",
    description:
      "Toutes les fonctionnalites sont accessibles via le clavier. Les raccourcis clavier facilitent la navigation pour les utilisateurs ne pouvant pas utiliser de souris.",
  },
  {
    icon: Monitor,
    title: "Lecteurs d'ecran",
    description:
      "L'interface est structuree avec des roles ARIA et des labels semantiques pour une compatibilite optimale avec les technologies d'assistance.",
  },
  {
    icon: Eye,
    title: "Contrastes suffisants",
    description:
      "Les rapports de contraste respectent un minimum de 4.5:1 pour le texte standard et 3:1 pour les elements graphiques, conformement aux recommandations WCAG.",
  },
  {
    icon: HandPointing,
    title: "Cibles tactiles 44x44px",
    description:
      "Tous les elements interactifs (boutons, liens, champs) ont une zone de toucher minimale de 44x44 pixels pour une utilisation confortable sur ecran tactile.",
  },
  {
    icon: Ear,
    title: "Skip links",
    description:
      "Des liens d'evitement sont disponibles en haut de chaque page pour permettre aux utilisateurs de naviguer directement vers le contenu principal.",
  },
  {
    icon: DeviceMobile,
    title: "Labels ARIA",
    description:
      "Chaque element interactif possede un label descriptif (aria-label, aria-describedby) pour guider les utilisateurs de technologies d'assistance.",
  },
];

const technologies = [
  {
    name: "NVDA",
    description: "Lecteur d'ecran gratuit pour Windows",
    type: "Desktop",
  },
  {
    name: "JAWS",
    description: "Lecteur d'ecran professionnel pour Windows",
    type: "Desktop",
  },
  {
    name: "VoiceOver",
    description: "Lecteur d'ecran integre a macOS et iOS",
    type: "Desktop & Mobile",
  },
  {
    name: "TalkBack",
    description: "Lecteur d'ecran integre a Android",
    type: "Mobile",
  },
  {
    name: "Navigation clavier",
    description: "Tab, Shift+Tab, Entree, Espace, fleches directionnelles",
    type: "Universel",
  },
];

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader
        badge="Accessibilite"
        title="Declaration d'accessibilite"
        subtitle="Notre engagement pour une plateforme accessible a tous."
      />

      <Container size="4" py="9">
        {/* Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Box
            mb="8"
            p="6"
            style={{
              background: "var(--accent-a2)",
              borderRadius: 16,
              border: "1px solid var(--accent-a4)",
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
                <Wheelchair
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="5">Notre engagement</Heading>
            </Flex>
            <Text
              size="3"
              style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
            >
              Orema N+ s&apos;engage a rendre sa plateforme accessible au plus
              grand nombre, y compris les personnes en situation de handicap. Nous
              nous efforcons de respecter les criteres de conformite du{" "}
              <strong>WCAG 2.1 niveau AA</strong> (Web Content Accessibility
              Guidelines) pour l&apos;ensemble de nos interfaces.
            </Text>
            <Text
              size="3"
              mt="4"
              style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
            >
              L&apos;accessibilite n&apos;est pas une option mais un principe
              fondamental de notre conception. Chaque fonctionnalite est pensee et
              testee pour etre utilisable par tous, quel que soit le mode
              d&apos;interaction.
            </Text>
          </Box>
        </motion.div>

        {/* Accessibility Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Fonctionnalites d&apos;accessibilite
            </Heading>
            <Text size="4" color="gray">
              Les mesures mises en place pour garantir l&apos;accessibilite
            </Text>
          </Box>

          <Grid
            columns={{ initial: "1", sm: "2", lg: "3" }}
            gap="4"
            mb="9"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.08, duration: 0.4 }}
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
                    <feature.icon
                      size={24}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Heading size="4" mb="2">
                    {feature.title}
                  </Heading>
                  <Text size="2" color="gray">
                    {feature.description}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Supported Technologies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Technologies supportees
            </Heading>
            <Text size="4" color="gray">
              Compatibilite testee avec les principales technologies d&apos;assistance
            </Text>
          </Box>

          <Flex direction="column" gap="3" mb="9">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.08, duration: 0.4 }}
              >
                <Flex
                  align="center"
                  gap="4"
                  p="4"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Box
                    p="2"
                    style={{
                      background: "var(--accent-a3)",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    <Monitor
                      size={20}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text size="3" weight="bold" style={{ display: "block" }}>
                      {tech.name}
                    </Text>
                    <Text size="2" color="gray">
                      {tech.description}
                    </Text>
                  </Box>
                  <Box
                    px="3"
                    py="1"
                    style={{
                      background: "var(--gray-a3)",
                      borderRadius: 9999,
                      flexShrink: 0,
                    }}
                  >
                    <Text size="1" weight="medium" color="gray">
                      {tech.type}
                    </Text>
                  </Box>
                </Flex>
              </motion.div>
            ))}
          </Flex>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Continuous Improvement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Grid columns={{ initial: "1", md: "2" }} gap="6" mb="9">
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
                    background: "var(--accent-a3)",
                    borderRadius: 12,
                  }}
                >
                  <Eye
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Heading size="5">Audit regulier</Heading>
              </Flex>
              <Text
                size="3"
                style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
              >
                Nous realisons des audits d&apos;accessibilite reguliers a l&apos;aide
                d&apos;outils automatises (axe, Lighthouse) et de tests manuels avec
                des lecteurs d&apos;ecran. Chaque nouvelle fonctionnalite est evaluee
                avant sa mise en production.
              </Text>
            </Box>

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
                    background: "var(--accent-a3)",
                    borderRadius: 12,
                  }}
                >
                  <Wheelchair
                    size={24}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Heading size="5">Formation de l&apos;equipe</Heading>
              </Flex>
              <Text
                size="3"
                style={{ color: "var(--gray-11)", lineHeight: 1.8, display: "block" }}
              >
                Nos developpeurs et designers sont formes aux bonnes pratiques
                d&apos;accessibilite web. L&apos;accessibilite est integree des la phase de
                conception de chaque interface, et non ajoutee apres coup.
              </Text>
            </Box>
          </Grid>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Box
            p="8"
            style={{
              background: "var(--accent-9)",
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <Flex justify="center" mb="4">
              <Box
                p="3"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 12,
                }}
              >
                <Envelope size={28} weight="duotone" style={{ color: "white" }} />
              </Box>
            </Flex>
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Signaler un probleme d&apos;accessibilite
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
              Si vous rencontrez des difficultes d&apos;accessibilite sur notre
              plateforme, nous vous invitons a nous contacter. Chaque signalement
              nous aide a ameliorer l&apos;experience pour tous.
            </Text>
            <Link
              href="mailto:accessibility@orema-nplus.ga"
              style={{
                textDecoration: "none",
                background: "white",
                color: "var(--accent-9)",
                padding: "12px 24px",
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              accessibility@orema-nplus.ga
              <CaretRight size={16} weight="bold" />
            </Link>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
