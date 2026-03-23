"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Separator,
  Flex,
  Grid,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  ShieldCheck,
  Lock,
  Eye,
  HardDrives,
  Users,
  Clock,
  EnvelopeSimple,
  Trash,
  Calendar,
} from "@phosphor-icons/react";

const dataTypes = [
  {
    icon: Users,
    title: "Donnees d'identification",
    items: [
      "Nom et prenom",
      "Adresse e-mail",
      "Numero de telephone",
      "Nom de l'etablissement",
    ],
  },
  {
    icon: HardDrives,
    title: "Donnees techniques",
    items: [
      "Adresse IP",
      "Type de navigateur",
      "Donnees de connexion",
      "Logs d'utilisation",
    ],
  },
  {
    icon: Lock,
    title: "Donnees commerciales",
    items: [
      "Transactions de vente",
      "Historique des commandes",
      "Donnees de facturation",
      "Statistiques d'activite",
    ],
  },
];

const rights = [
  {
    icon: Eye,
    title: "Droit d'acces",
    description:
      "Vous pouvez demander une copie de toutes les donnees que nous detenons a votre sujet.",
  },
  {
    icon: Trash,
    title: "Droit de suppression",
    description:
      "Vous pouvez demander la suppression de vos donnees personnelles de nos systemes.",
  },
  {
    icon: Lock,
    title: "Droit de rectification",
    description:
      "Vous pouvez modifier ou corriger vos informations personnelles a tout moment.",
  },
  {
    icon: Clock,
    title: "Droit de portabilite",
    description:
      "Vous pouvez recuperer vos donnees dans un format structure et lisible.",
  },
];

const sections = [
  {
    id: "collecte",
    number: "1",
    title: "Collecte des donnees",
    content: `Nous collectons vos donnees personnelles lorsque vous :

- Creez un compte sur notre plateforme
- Utilisez notre systeme de caisse
- Contactez notre service client
- Souscrivez a un abonnement

Ces donnees sont collectees de maniere loyale et transparente, avec votre consentement explicite.`,
  },
  {
    id: "utilisation",
    number: "2",
    title: "Utilisation des donnees",
    content: `Vos donnees sont utilisees pour :

- Fournir et ameliorer nos services
- Traiter vos transactions et paiements
- Vous envoyer des informations importantes sur votre compte
- Assurer le support technique
- Generer des rapports et statistiques anonymisees
- Respecter nos obligations legales

Nous ne vendons jamais vos donnees a des tiers.`,
  },
  {
    id: "conservation",
    number: "3",
    title: "Conservation des donnees",
    content: `Vos donnees sont conservees pendant la duree necessaire aux finalites pour lesquelles elles ont ete collectees :

- Donnees de compte : duree de la relation commerciale + 3 ans
- Donnees de transaction : 10 ans (obligations comptables)
- Logs techniques : 12 mois

A l'expiration de ces delais, vos donnees sont supprimees ou anonymisees.`,
  },
  {
    id: "securite",
    number: "4",
    title: "Securite des donnees",
    content: `Nous mettons en oeuvre des mesures de securite robustes pour proteger vos donnees :

- Chiffrement SSL/TLS pour toutes les transmissions
- Stockage securise sur des serveurs proteges
- Acces restreint aux donnees (principe du moindre privilege)
- Authentification forte et codes PIN haches
- Sauvegardes regulieres et plan de reprise d'activite
- Audits de securite reguliers`,
  },
  {
    id: "partage",
    number: "5",
    title: "Partage des donnees",
    content: `Vos donnees peuvent etre partagees avec :

- Nos sous-traitants techniques (hebergement, paiement) sous contrat strict
- Les autorites competentes en cas d'obligation legale
- Votre etablissement si vous etes employe

Tout transfert de donnees hors du Gabon est encadre par des garanties appropriees.`,
  },
  {
    id: "cookies",
    number: "6",
    title: "Cookies et traceurs",
    content: `Nous utilisons des cookies pour :

- Assurer le bon fonctionnement du site (cookies essentiels)
- Memoriser vos preferences (cookies fonctionnels)
- Analyser l'utilisation du service (cookies analytiques)

Vous pouvez gerer vos preferences de cookies via les parametres de votre navigateur.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Politique de confidentialite"
        subtitle="Comment nous protegetons et utilisons vos donnees personnelles."
        badge="Vie privee"
      />

      <Container size="3" py="9">
        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
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
                Derniere mise a jour : Mars 2026
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <ShieldCheck
                size={18}
                weight="fill"
                style={{ color: "var(--green-10)" }}
              />
              <Text size="2" color="gray">
                Conforme a la Loi n 001/2011 (protection des donnees
                personnelles)
              </Text>
            </Flex>
          </Flex>
        </motion.div>

        {/* Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Box
            mb="9"
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
                <ShieldCheck
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="4">Notre engagement</Heading>
            </Flex>
            <Text
              size="3"
              style={{ color: "var(--gray-11)", lineHeight: 1.8 }}
            >
              Chez Orema N+, la protection de vos donnees personnelles est une
              priorite. Nous traitons vos informations avec le plus grand soin
              et en toute transparence, conformement a la reglementation en
              vigueur au Gabon et aux standards internationaux de protection
              des donnees.
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
            Donnees que nous collectons
          </Heading>
          <Grid columns={{ initial: "1", md: "3" }} gap="4" mb="9">
            {dataTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
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
                        background: "var(--accent-a3)",
                        borderRadius: 8,
                      }}
                    >
                      <type.icon
                        size={20}
                        weight="duotone"
                        style={{ color: "var(--accent-9)" }}
                      />
                    </Box>
                    <Text size="3" weight="bold">
                      {type.title}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    {type.items.map((item, i) => (
                      <Text key={i} size="2" color="gray">
                        - {item}
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
            transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
          >
            <Box mb="8">
              <Heading size="5" mb="4" style={{ color: "var(--gray-12)" }}>
                {section.number}. {section.title}
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
              {index < sections.length - 1 && (
                <Separator size="4" my="6" />
              )}
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
                    <right.icon
                      size={20}
                      weight="duotone"
                      style={{ color: "var(--green-9)" }}
                    />
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

        {/* Contact DPO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
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
              <EnvelopeSimple
                size={20}
                weight="duotone"
                style={{ color: "var(--accent-9)" }}
              />
              <Heading size="4">
                Delegue a la Protection des Donnees
              </Heading>
            </Flex>
            <Text
              size="3"
              color="gray"
              mb="4"
              style={{ display: "block" }}
            >
              Pour exercer vos droits ou pour toute question relative a la
              protection de vos donnees personnelles, contactez notre DPO :
            </Text>
            <Flex direction="column" gap="2">
              <Text size="3">
                Email :{" "}
                <a
                  href="mailto:dpo@orema-nplus.ga"
                  style={{
                    color: "var(--accent-9)",
                    textDecoration: "none",
                  }}
                >
                  dpo@orema-nplus.ga
                </a>
              </Text>
              <Text size="3">
                Adresse : Boulevard Triomphal Omar Bongo, Immeuble Les
                Arcades, 3e etage, Libreville, Gabon
              </Text>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
