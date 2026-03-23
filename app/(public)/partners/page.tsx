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
  Buildings,
  Truck,
  Wrench,
  CreditCard,
  GraduationCap,
  Globe,
  TrendUp,
  Medal,
  Users,
  ShieldCheck,
  Lightning,
  CaretRight,
  Check,
} from "@phosphor-icons/react";
import Link from "next/link";

const partnerTypes = [
  {
    icon: Buildings,
    title: "Integrateurs & Revendeurs",
    description:
      "Proposez Orema N+ a vos clients. Marges attractives et support dedie pour developper votre activite.",
    benefits: [
      "Marges commerciales attractives",
      "Formation technique complete",
      "Support prioritaire",
      "Co-marketing",
    ],
  },
  {
    icon: Truck,
    title: "Fournisseurs de materiel",
    description:
      "Proposez vos equipements POS (imprimantes, terminaux, tiroirs-caisse) compatibles avec notre solution.",
    benefits: [
      "Certification officielle",
      "Visibilite sur notre plateforme",
      "Tests de compatibilite gratuits",
      "Documentation technique",
    ],
  },
  {
    icon: Wrench,
    title: "Integrateurs techniques",
    description:
      "Integrez Orema N+ avec vos solutions (comptabilite, RH, livraison) via notre API ouverte.",
    benefits: [
      "API REST documentee",
      "Sandbox de developpement",
      "Support technique dedie",
      "Listing dans notre marketplace",
    ],
  },
  {
    icon: CreditCard,
    title: "Solutions de paiement",
    description:
      "Integrez vos solutions de paiement (Mobile Money, cartes bancaires) dans notre ecosysteme.",
    benefits: [
      "Integration simplifiee",
      "Volume de transactions croissant",
      "Acces au marche CHR",
      "Support technique",
    ],
  },
  {
    icon: GraduationCap,
    title: "Organismes de formation",
    description:
      "Formez vos etudiants et professionnels sur notre solution. Preparez-les au marche du travail.",
    benefits: [
      "Licences educatives gratuites",
      "Supports pedagogiques",
      "Certification partenaire",
      "Stages et emplois",
    ],
  },
  {
    icon: Globe,
    title: "Chambres de commerce",
    description:
      "Accompagnez la digitalisation de vos membres avec une solution adaptee au marche africain.",
    benefits: [
      "Tarifs preferentiels membres",
      "Accompagnement personnalise",
      "Evenements co-organises",
      "Statistiques sectorielles",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Contactez-nous",
    description:
      "Remplissez le formulaire de contact partenaire avec vos informations et votre projet.",
  },
  {
    number: "02",
    title: "Evaluation",
    description:
      "Notre equipe partenariats evalue votre profil et vous recontacte sous 48h.",
  },
  {
    number: "03",
    title: "Onboarding",
    description:
      "Formation, documentation et acces aux outils partenaires pour demarrer rapidement.",
  },
  {
    number: "04",
    title: "Lancement",
    description:
      "Demarrez votre activite avec notre support continu et des revues regulieres.",
  },
];

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        title="Devenez partenaire"
        subtitle="Rejoignez l'ecosysteme Orema N+ et developpez votre activite avec nous."
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
              background: "var(--accent-9)",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Devenir partenaire
            <CaretRight size={16} weight="bold" />
          </Link>
        </Flex>
      </PageHeader>

      <Container size="4" py="9">
        {/* Why partner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Box
            mb="9"
            p="8"
            style={{
              background: "var(--accent-a2)",
              borderRadius: 16,
              border: "1px solid var(--accent-a4)",
            }}
          >
            <Grid
              columns={{ initial: "1", md: "2" }}
              gap="8"
              align="center"
            >
              <Box>
                <Flex align="center" gap="3" mb="4">
                  <Box
                    p="3"
                    style={{
                      background: "var(--accent-a3)",
                      borderRadius: 12,
                    }}
                  >
                    <Handshake
                      size={28}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
                    />
                  </Box>
                  <Heading size="6">Pourquoi nous rejoindre ?</Heading>
                </Flex>
                <Text
                  size="4"
                  style={{ color: "var(--gray-11)", lineHeight: 1.8 }}
                >
                  Le marche africain du commerce digital est en forte
                  croissance. En devenant partenaire Orema N+, vous accedez a
                  un ecosysteme porteur et beneficiez d&apos;un accompagnement
                  personnalise pour developper votre activite.
                </Text>
              </Box>
              <Grid columns="2" gap="4">
                {[
                  { icon: TrendUp, label: "Marche en croissance" },
                  { icon: Medal, label: "Programme certifie" },
                  { icon: Users, label: "Support dedie" },
                  { icon: ShieldCheck, label: "Partenariat securise" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
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
                        weight="duotone"
                        style={{
                          color: "var(--accent-9)",
                          marginBottom: 8,
                        }}
                      />
                      <Text
                        size="2"
                        weight="medium"
                        style={{ display: "block" }}
                      >
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
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Types de partenariats
            </Heading>
            <Text size="4" color="gray">
              Choisissez le programme qui correspond a votre activite
            </Text>
          </Box>

          <Grid
            columns={{ initial: "1", sm: "2", lg: "3" }}
            gap="4"
            mb="9"
          >
            {partnerTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.08, duration: 0.4 }}
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
                  <Box
                    mb="4"
                    p="3"
                    style={{
                      background: "var(--accent-a3)",
                      borderRadius: 12,
                      width: "fit-content",
                    }}
                  >
                    <type.icon
                      size={24}
                      weight="duotone"
                      style={{ color: "var(--accent-9)" }}
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
                          weight="bold"
                          style={{ color: "var(--accent-9)" }}
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
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Comment devenir partenaire
            </Heading>
            <Text size="4" color="gray">
              Un processus simple en 4 etapes
            </Text>
          </Box>

          <Grid
            columns={{ initial: "1", sm: "2", lg: "4" }}
            gap="4"
            mb="9"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
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
                      color: "var(--accent-a3)",
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

        {/* CTA */}
        <motion.div
          id="contact"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
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
              Pret a devenir partenaire ?
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
              Contactez notre equipe partenariats pour discuter de votre projet
              et decouvrir comment nous pouvons collaborer.
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
                  color: "var(--accent-9)",
                  padding: "14px 28px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Contactez-nous
                <CaretRight size={16} weight="bold" />
              </Link>
              <Link
                href="/guide"
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
                Documentation
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
