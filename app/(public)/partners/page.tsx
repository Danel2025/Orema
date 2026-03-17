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
  Handshake,
  Building2,
  Truck,
  Wrench,
  CreditCard,
  GraduationCap,
  Globe,
  TrendingUp,
  Award,
  Users,
  Shield,
  Zap,
  ChevronRight,
  Check,
  Star,
} from "lucide-react";
import Link from "next/link";

const partnerTypes = [
  {
    icon: Building2,
    title: "Intégrateurs & Revendeurs",
    description:
      "Devenez revendeur agréé et proposez Oréma N+ à vos clients. Bénéficiez de marges attractives et d'un support dédié.",
    benefits: [
      "Marges commerciales attractives",
      "Formation technique complète",
      "Support prioritaire",
      "Co-marketing",
    ],
    color: "violet",
  },
  {
    icon: Truck,
    title: "Fournisseurs de matériel",
    description:
      "Proposez vos équipements POS (imprimantes, terminaux, tiroirs-caisse) compatibles avec notre solution.",
    benefits: [
      "Certification officielle",
      "Visibilité sur notre plateforme",
      "Tests de compatibilité gratuits",
      "Documentation technique",
    ],
    color: "blue",
  },
  {
    icon: Wrench,
    title: "Intégrateurs techniques",
    description:
      "Intégrez Oréma N+ avec vos solutions (comptabilité, RH, livraison) via notre API ouverte.",
    benefits: [
      "API REST documentée",
      "Sandbox de développement",
      "Support technique dédié",
      "Listing dans notre marketplace",
    ],
    color: "green",
  },
  {
    icon: CreditCard,
    title: "Solutions de paiement",
    description:
      "Intégrez vos solutions de paiement (Mobile Money, cartes bancaires) dans notre écosystème.",
    benefits: [
      "Intégration simplifiée",
      "Volume de transactions croissant",
      "Accès au marché CHR",
      "Support technique",
    ],
    color: "purple",
  },
  {
    icon: GraduationCap,
    title: "Organismes de formation",
    description:
      "Formez vos étudiants et professionnels sur notre solution et préparez-les au marché du travail.",
    benefits: [
      "Licences éducatives gratuites",
      "Supports pédagogiques",
      "Certification partenaire",
      "Stages et emplois",
    ],
    color: "amber",
  },
  {
    icon: Globe,
    title: "Chambres de commerce",
    description:
      "Accompagnez la digitalisation de vos membres avec notre solution adaptée au marché africain.",
    benefits: [
      "Tarifs préférentiels membres",
      "Accompagnement personnalisé",
      "Événements co-organisés",
      "Statistiques sectorielles",
    ],
    color: "cyan",
  },
];

const stats = [
  { value: "6", label: "Types de partenariats" },
  { value: "API", label: "Intégration ouverte" },
  { value: "Gabon", label: "Marché prioritaire" },
  { value: "100%", label: "Support inclus" },
];

const testimonials: { quote: string; author: string; role: string; rating: number }[] = [];

const steps = [
  {
    number: "01",
    title: "Contactez-nous",
    description:
      "Remplissez le formulaire de contact partenaire avec vos informations et votre projet.",
  },
  {
    number: "02",
    title: "Évaluation",
    description:
      "Notre équipe partenariats évalue votre profil et vous recontacte sous 48h.",
  },
  {
    number: "03",
    title: "Onboarding",
    description:
      "Formation, documentation et accès aux outils partenaires pour démarrer rapidement.",
  },
  {
    number: "04",
    title: "Lancement",
    description:
      "Démarrez votre activité avec notre support continu et des revues régulières.",
  },
];

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        title="Devenez Partenaire"
        subtitle="Rejoignez l'écosystème Oréma N+ et développez votre activité avec nous."
        badge="Partenariats"
      >
        <Flex gap="3" justify="center" mt="6">
          <Link
            href="#contact"
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
            Devenir partenaire
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

        {/* Why partner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Box
            mb="9"
            p="8"
            style={{
              background:
                "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
              borderRadius: 24,
              border: "1px solid var(--violet-a4)",
            }}
          >
            <Grid columns={{ initial: "1", md: "2" }} gap="8" align="center">
              <Box>
                <Flex align="center" gap="3" mb="4">
                  <Box
                    p="3"
                    style={{
                      background: "var(--violet-a4)",
                      borderRadius: 12,
                    }}
                  >
                    <Handshake size={28} style={{ color: "var(--violet-9)" }} />
                  </Box>
                  <Heading size="6">Pourquoi nous rejoindre ?</Heading>
                </Flex>
                <Text
                  size="4"
                  style={{ color: "var(--gray-11)", lineHeight: 1.8 }}
                >
                  Le marché africain du commerce digital est en pleine explosion. En
                  devenant partenaire Oréma N+, vous accédez à un écosystème en forte
                  croissance et bénéficiez d&apos;un accompagnement personnalisé pour
                  développer votre activité.
                </Text>
              </Box>
              <Grid columns="2" gap="4">
                {[
                  { icon: TrendingUp, label: "Marché en croissance" },
                  { icon: Award, label: "Programme certifié" },
                  { icon: Users, label: "Support dédié" },
                  { icon: Shield, label: "Partenariat sécurisé" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  >
                    <Box
                      p="4"
                      style={{
                        background: "var(--color-background)",
                        borderRadius: 12,
                        textAlign: "center",
                      }}
                    >
                      <item.icon
                        size={24}
                        style={{
                          color: "var(--violet-9)",
                          marginBottom: 8,
                        }}
                      />
                      <Text size="2" weight="medium" style={{ display: "block" }}>
                        {item.label}
                      </Text>
                    </Box>
                  </motion.div>
                ))}
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Partner types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Types de partenariats
            </Heading>
            <Text size="4" color="gray">
              Choisissez le programme qui correspond à votre activité
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4" mb="9">
            {partnerTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.08, duration: 0.5 }}
              >
                <Box
                  p="6"
                  style={{
                    background: `var(--${type.color}-a2)`,
                    borderRadius: 20,
                    border: `1px solid var(--${type.color}-a4)`,
                    height: "100%",
                  }}
                >
                  <Box
                    mb="4"
                    p="3"
                    style={{
                      background: `var(--${type.color}-a3)`,
                      borderRadius: 12,
                      width: "fit-content",
                    }}
                  >
                    <type.icon
                      size={24}
                      style={{ color: `var(--${type.color}-9)` }}
                    />
                  </Box>
                  <Heading size="4" mb="2">
                    {type.title}
                  </Heading>
                  <Text
                    size="2"
                    color="gray"
                    mb="4"
                    style={{ display: "block" }}
                  >
                    {type.description}
                  </Text>
                  <Flex direction="column" gap="2">
                    {type.benefits.map((benefit, i) => (
                      <Flex key={i} align="center" gap="2">
                        <Check
                          size={14}
                          style={{ color: `var(--${type.color}-9)` }}
                        />
                        <Text size="2">{benefit}</Text>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Comment ça marche ?
            </Heading>
            <Text size="4" color="gray">
              Un processus simple en 4 étapes
            </Text>
          </Box>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <Text
                    size="8"
                    weight="bold"
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      color: "var(--violet-a4)",
                      fontSize: 64,
                      lineHeight: 1,
                    }}
                  >
                    {step.number}
                  </Text>
                  <Box position="relative">
                    <Heading size="4" mb="2">
                      {step.title}
                    </Heading>
                    <Text size="2" color="gray">
                      {step.description}
                    </Text>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Testimonials - section masquée en attendant de vrais témoignages */}
        {testimonials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Ce que disent nos partenaires
            </Heading>
          </Box>

          <Grid columns={{ initial: "1", md: "2" }} gap="4" mb="9">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
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
                  <Flex gap="1" mb="4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill="var(--purple-9)"
                        style={{ color: "var(--purple-9)" }}
                      />
                    ))}
                  </Flex>
                  <Text
                    size="3"
                    style={{
                      color: "var(--gray-11)",
                      fontStyle: "italic",
                      lineHeight: 1.7,
                      display: "block",
                    }}
                    mb="4"
                  >
                    &quot;{testimonial.quote}&quot;
                  </Text>
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {testimonial.author.charAt(0)}
                    </Box>
                    <Box>
                      <Text size="2" weight="bold" style={{ display: "block" }}>
                        {testimonial.author}
                      </Text>
                      <Text size="1" color="gray">
                        {testimonial.role}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>
        )}

        {/* CTA */}
        <motion.div
          id="contact"
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
            <Zap
              size={48}
              style={{ color: "white", marginBottom: 16, opacity: 0.9 }}
            />
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Prêt à devenir partenaire ?
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
              Contactez notre équipe partenariats pour discuter de votre projet et
              découvrir comment nous pouvons collaborer.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="mailto:partners@orema-nplus.ga?subject=Demande de partenariat"
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
                Contactez-nous
                <ChevronRight size={16} />
              </Link>
              <Link
                href="/docs"
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
                Documentation API
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
