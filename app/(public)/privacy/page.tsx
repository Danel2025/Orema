"use client";

import { Box, Container, Heading, Text, Separator, Flex, Grid } from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Shield,
  Lock,
  Eye,
  Server,
  Users,
  Clock,
  Mail,
  Trash2,
  Calendar,
} from "lucide-react";

const dataTypes = [
  {
    icon: Users,
    title: "Données d'identification",
    items: [
      "Nom et prénom",
      "Adresse e-mail",
      "Numéro de téléphone",
      "Nom de l'établissement",
    ],
  },
  {
    icon: Server,
    title: "Données techniques",
    items: [
      "Adresse IP",
      "Type de navigateur",
      "Données de connexion",
      "Logs d'utilisation",
    ],
  },
  {
    icon: Lock,
    title: "Données commerciales",
    items: [
      "Transactions de vente",
      "Historique des commandes",
      "Données de facturation",
      "Statistiques d'activité",
    ],
  },
];

const rights = [
  {
    icon: Eye,
    title: "Droit d'accès",
    description: "Vous pouvez demander une copie de toutes les données que nous détenons à votre sujet.",
  },
  {
    icon: Trash2,
    title: "Droit de suppression",
    description: "Vous pouvez demander la suppression de vos données personnelles de nos systèmes.",
  },
  {
    icon: Lock,
    title: "Droit de rectification",
    description: "Vous pouvez modifier ou corriger vos informations personnelles à tout moment.",
  },
  {
    icon: Clock,
    title: "Droit de portabilité",
    description: "Vous pouvez récupérer vos données dans un format structuré et lisible.",
  },
];

const sections = [
  {
    id: "collecte",
    title: "1. Collecte des données",
    content: `Nous collectons vos données personnelles lorsque vous :

• Créez un compte sur notre plateforme
• Utilisez notre système de caisse
• Contactez notre service client
• Souscrivez à un abonnement

Ces données sont collectées de manière loyale et transparente, avec votre consentement explicite.`,
  },
  {
    id: "utilisation",
    title: "2. Utilisation des données",
    content: `Vos données sont utilisées pour :

• Fournir et améliorer nos services
• Traiter vos transactions et paiements
• Vous envoyer des informations importantes sur votre compte
• Assurer le support technique
• Générer des rapports et statistiques anonymisées
• Respecter nos obligations légales

Nous ne vendons jamais vos données à des tiers.`,
  },
  {
    id: "conservation",
    title: "3. Conservation des données",
    content: `Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :

• Données de compte : durée de la relation commerciale + 3 ans
• Données de transaction : 10 ans (obligations comptables)
• Logs techniques : 12 mois

À l'expiration de ces délais, vos données sont supprimées ou anonymisées.`,
  },
  {
    id: "securite",
    title: "4. Sécurité des données",
    content: `Nous mettons en œuvre des mesures de sécurité robustes pour protéger vos données :

• Chiffrement SSL/TLS pour toutes les transmissions
• Stockage sécurisé sur des serveurs protégés
• Accès restreint aux données (principe du moindre privilège)
• Authentification forte et codes PIN hachés
• Sauvegardes régulières et plan de reprise d'activité
• Audits de sécurité réguliers`,
  },
  {
    id: "partage",
    title: "5. Partage des données",
    content: `Vos données peuvent être partagées avec :

• Nos sous-traitants techniques (hébergement, paiement) sous contrat strict
• Les autorités compétentes en cas d'obligation légale
• Votre établissement si vous êtes employé

Tout transfert de données hors du Gabon est encadré par des garanties appropriées.`,
  },
  {
    id: "cookies",
    title: "6. Cookies et traceurs",
    content: `Nous utilisons des cookies pour :

• Assurer le bon fonctionnement du site (cookies essentiels)
• Mémoriser vos préférences (cookies fonctionnels)
• Analyser l'utilisation du service (cookies analytiques)

Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Politique de Confidentialité"
        subtitle="Découvrez comment nous protégeons et utilisons vos données personnelles."
        badge="Vie privée"
      />

      <Container size="3" py="9">
        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Flex
            gap="6"
            wrap="wrap"
            mb="8"
            p="5"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="2">
              <Calendar size={18} style={{ color: "var(--gray-10)" }} />
              <Text size="2" color="gray">
                Dernière mise à jour : Janvier 2026
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Shield size={18} style={{ color: "var(--green-10)" }} />
              <Text size="2" color="gray">
                Conforme à la Loi n°001/2011 (protection des données personnelles)
              </Text>
            </Flex>
          </Flex>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Box
            mb="9"
            p="6"
            style={{
              background:
                "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
              borderRadius: 16,
              border: "1px solid var(--violet-a4)",
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
                <Shield size={24} style={{ color: "var(--violet-9)" }} />
              </Box>
              <Heading size="4">Notre engagement</Heading>
            </Flex>
            <Text size="3" style={{ color: "var(--gray-11)", lineHeight: 1.8 }}>
              Chez Oréma N+, la protection de vos données personnelles est une priorité absolue.
              Nous nous engageons à traiter vos informations avec le plus grand soin et en toute
              transparence, conformément à la réglementation en vigueur au Gabon et aux standards
              internationaux de protection des données.
            </Text>
          </Box>
        </motion.div>

        {/* Data types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Heading size="5" mb="5">
            Données que nous collectons
          </Heading>
          <Grid columns={{ initial: "1", md: "3" }} gap="4" mb="9">
            {dataTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                    height: "100%",
                  }}
                >
                  <Flex align="center" gap="3" mb="4">
                    <Box
                      p="2"
                      style={{
                        background: "var(--violet-a3)",
                        borderRadius: 8,
                      }}
                    >
                      <type.icon size={20} style={{ color: "var(--violet-9)" }} />
                    </Box>
                    <Text size="3" weight="bold">
                      {type.title}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    {type.items.map((item, i) => (
                      <Text key={i} size="2" color="gray">
                        • {item}
                      </Text>
                    ))}
                  </Flex>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        {/* Content sections */}
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
          >
            <Box mb="8">
              <Heading size="5" mb="4" style={{ color: "var(--gray-12)" }}>
                {section.title}
              </Heading>
              <Text
                size="3"
                style={{
                  color: "var(--gray-11)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                }}
              >
                {section.content}
              </Text>
              {index < sections.length - 1 && <Separator size="4" my="6" />}
            </Box>
          </motion.div>
        ))}

        {/* Your rights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Separator size="4" my="8" />
          <Heading size="5" mb="5">
            Vos droits
          </Heading>
          <Grid columns={{ initial: "1", sm: "2" }} gap="4" mb="9">
            {rights.map((right, index) => (
              <motion.div
                key={right.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--green-a2)",
                    borderRadius: 12,
                    border: "1px solid var(--green-a4)",
                  }}
                >
                  <Flex align="center" gap="3" mb="3">
                    <right.icon size={20} style={{ color: "var(--green-9)" }} />
                    <Text size="3" weight="bold">
                      {right.title}
                    </Text>
                  </Flex>
                  <Text size="2" color="gray">
                    {right.description}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Box
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3" mb="3">
              <Mail size={20} style={{ color: "var(--violet-9)" }} />
              <Heading size="4">Délégué à la Protection des Données</Heading>
            </Flex>
            <Text size="3" color="gray" mb="4" style={{ display: "block" }}>
              Pour exercer vos droits ou pour toute question relative à la protection de vos données
              personnelles, contactez notre DPO :
            </Text>
            <Flex direction="column" gap="2">
              <Text size="3">
                Email :{" "}
                <a
                  href="mailto:dpo@orema-nplus.ga"
                  style={{ color: "var(--violet-9)", textDecoration: "none" }}
                >
                  dpo@orema-nplus.ga
                </a>
              </Text>
              <Text size="3">Adresse : Boulevard Triomphal Omar Bongo, Immeuble Les Arcades, 3e étage, Libreville, Gabon</Text>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
