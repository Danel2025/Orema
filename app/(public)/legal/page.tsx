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
  Buildings,
  FileText,
  Globe,
  HardDrives,
  Scales,
  MapPin,
  Phone,
  EnvelopeSimple,
  User,
  Calendar,
} from "@phosphor-icons/react";

const legalInfo = [
  {
    icon: Buildings,
    title: "Raison sociale",
    value: "Orema N+ SARL",
  },
  {
    icon: FileText,
    title: "RCCM",
    value: "GA-LBV-2024-B-08742",
  },
  {
    icon: Scales,
    title: "NIF",
    value: "20240087421R",
  },
  {
    icon: MapPin,
    title: "Siege social",
    value:
      "Boulevard Triomphal Omar Bongo, Immeuble Les Arcades, 3e étage, Libreville, Gabon",
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: "+241 77 12 34 56",
  },
  {
    icon: EnvelopeSimple,
    title: "Email",
    value: "contact@orema-nplus.ga",
  },
];

const hosting = [
  {
    icon: HardDrives,
    title: "Hébergeur",
    value: "Vercel Inc.",
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "340 S Lemon Ave #4133, Walnut, CA 91789, USA",
  },
  {
    icon: Globe,
    title: "Site web",
    value: "vercel.com",
  },
];

const sections = [
  {
    id: "editeur",
    number: "1",
    title: "Éditeur du site",
    content: `Le site Orema N+ est édité par la société Orema N+ SARL, société a responsabilite limitee de droit gabonais, immatriculee au Registre du Commerce et du Credit Mobilier de Libreville.

Capital social : 10 000 000 FCFA
Siege social : Libreville, Gabon`,
  },
  {
    id: "directeur",
    number: "2",
    title: "Directeur de la publication",
    content: `Le directeur de la publication est M. Jean-Baptiste Ndong, Gérant et représentant légal de la société Orema N+ SARL (obligation OHADA - Acte Uniforme relatif au Droit des Societes Commerciales).

Pour toute question relative au contenu du site : publication@orema-nplus.ga`,
  },
  {
    id: "propriete",
    number: "3",
    title: "Propriété intellectuelle",
    content: `L'ensemble des éléments constituant le site (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, etc.) ainsi que le site lui-même, sont la propriété exclusive d'Orema N+ ou de ses partenaires.

Ces éléments sont protégés par l'Accord de Bangui (OAPI) et les conventions internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, utilisation, adaptation, modification, incorporation, traduction, commercialisation, partielle ou intégrale des éléments du site, par quelque procédé et sur quelque support que ce soit, sans l'autorisation écrite préalable d'Orema N+, est strictement interdite.`,
  },
  {
    id: "responsabilite",
    number: "4",
    title: "Limitation de responsabilite",
    content: `Orema N+ s'efforce de fournir des informations aussi précises que possible sur le site. Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise a jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.

Toutes les informations indiquees sur le site sont donnees a titre indicatif, et sont susceptibles d'evoluer. Par ailleurs, les renseignements figurant sur le site ne sont pas exhaustifs.

Orema N+ ne pourra être tenu responsable des dommages directs ou indirects causes au materiel de l'utilisateur lors de l'acces au site.`,
  },
  {
    id: "liens",
    number: "5",
    title: "Liens hypertextes",
    content: `Le site peut contenir des liens hypertextes vers d'autres sites présents sur le réseau Internet. Ces liens vers d'autres sites ne constituent en aucun cas une approbation ou un partenariat avec ces sites.

Orema N+ n'exerce aucun controle sur le contenu de ces sites et decline toute responsabilite quant a leur contenu ou quant a l'utilisation qui peut en être faite.`,
  },
  {
    id: "cookies",
    number: "6",
    title: "Gestion des cookies",
    content: `Le site utilise des cookies pour améliorer l'expérience utilisateur et analyser le trafic. Pour plus d'informations sur l'utilisation des cookies, veuillez consulter notre Politique de Confidentialite.

Conformément à la réglementation, vous disposez d'un droit d'opposition et de parametrage de ces cookies via les options de votre navigateur.`,
  },
  {
    id: "droit",
    number: "7",
    title: "Droit applicable",
    content: `Les présentes mentions légales sont régies par le droit gabonais. Tout litige relatif a l'utilisation du site sera soumis a la competence exclusive des tribunaux de Libreville.

En cas de traduction des présentes mentions légales dans une ou plusieurs langues, la version francaise prevaudra en cas de litige.`,
  },
];

export default function LegalPage() {
  return (
    <>
      <PageHeader
        title="Mentions légales"
        subtitle="Informations légales relatives a l'utilisation du site Orema N+."
        badge="Legal"
      />

      <Container size="3" py="9">
        {/* Last update */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Flex
            align="center"
            gap="2"
            mb="8"
            p="4"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
              width: "fit-content",
            }}
          >
            <Calendar size={16} style={{ color: "var(--gray-10)" }} />
            <Text size="2" color="gray">
              Dernière mise à jour : Mars 2026
            </Text>
          </Flex>
        </motion.div>

        {/* Company info */}
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
            <Flex align="center" gap="3" mb="5">
              <Box
                p="3"
                style={{
                  background: "var(--accent-a3)",
                  borderRadius: 12,
                }}
              >
                <Buildings
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="4">
                Informations de l&apos;entreprise
              </Heading>
            </Flex>
            <Grid
              columns={{ initial: "1", sm: "2", md: "3" }}
              gap="4"
            >
              {legalInfo.map((info) => (
                <Flex key={info.title} align="start" gap="3">
                  <Box
                    p="2"
                    style={{
                      background: "var(--gray-a3)",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    <info.icon
                      size={16}
                      style={{ color: "var(--gray-11)" }}
                    />
                  </Box>
                  <Box>
                    <Text
                      size="1"
                      color="gray"
                      style={{ display: "block" }}
                    >
                      {info.title}
                    </Text>
                    <Text size="2" weight="medium">
                      {info.value}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Hosting info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Box
            mb="9"
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3" mb="5">
              <Box
                p="3"
                style={{
                  background: "var(--blue-a3)",
                  borderRadius: 12,
                }}
              >
                <HardDrives
                  size={24}
                  weight="duotone"
                  style={{ color: "var(--blue-9)" }}
                />
              </Box>
              <Heading size="4">Hébergement</Heading>
            </Flex>
            <Grid columns={{ initial: "1", md: "3" }} gap="4">
              {hosting.map((info) => (
                <Flex key={info.title} align="start" gap="3">
                  <Box
                    p="2"
                    style={{
                      background: "var(--blue-a3)",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    <info.icon
                      size={16}
                      style={{ color: "var(--blue-9)" }}
                    />
                  </Box>
                  <Box>
                    <Text
                      size="1"
                      color="gray"
                      style={{ display: "block" }}
                    >
                      {info.title}
                    </Text>
                    <Text size="2" weight="medium">
                      {info.value}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Content sections */}
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
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

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <Box
            mt="8"
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Heading size="4" mb="4">
              Credits
            </Heading>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="3">
                <User size={18} style={{ color: "var(--gray-10)" }} />
                <Text size="3" color="gray">
                  Design & Développement : Équipe Orema N+
                </Text>
              </Flex>
              <Flex align="center" gap="3">
                <Globe size={18} style={{ color: "var(--gray-10)" }} />
                <Text size="3" color="gray">
                  Icones : Phosphor Icons (phosphoricons.com)
                </Text>
              </Flex>
              <Flex align="center" gap="3">
                <FileText size={18} style={{ color: "var(--gray-10)" }} />
                <Text size="3" color="gray">
                  Composants UI : Radix UI (radix-ui.com)
                </Text>
              </Flex>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
