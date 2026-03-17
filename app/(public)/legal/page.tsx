"use client";

import { Box, Container, Heading, Text, Separator, Flex, Grid } from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Building2,
  FileText,
  Globe,
  Server,
  Scale,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";

const legalInfo = [
  {
    icon: Building2,
    title: "Raison sociale",
    value: "Oréma N+ SARL",
  },
  {
    icon: FileText,
    title: "RCCM",
    value: "GA-LBV-2024-B-08742",
  },
  {
    icon: Scale,
    title: "NIF",
    value: "20240087421R",
  },
  {
    icon: MapPin,
    title: "Siège social",
    value: "Boulevard Triomphal Omar Bongo, Immeuble Les Arcades, 3e étage, Libreville, Gabon",
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: "+241 77 12 34 56",
  },
  {
    icon: Mail,
    title: "Email",
    value: "contact@orema-nplus.ga",
  },
];

const hosting = [
  {
    icon: Server,
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
    title: "Éditeur du site",
    content: `Le site Oréma N+ est édité par la société Oréma N+ SARL, société à responsabilité limitée de droit gabonais, immatriculée au Registre du Commerce et du Crédit Mobilier de Libreville.

Capital social : 10 000 000 FCFA
Siège social : Libreville, Gabon`,
  },
  {
    id: "directeur",
    title: "Directeur de la publication",
    content: `Le directeur de la publication est M. Jean-Baptiste Ndong, Gérant et représentant légal de la société Oréma N+ SARL (obligation OHADA - Acte Uniforme relatif au Droit des Sociétés Commerciales).

Pour toute question relative au contenu du site, vous pouvez nous contacter à l'adresse : publication@orema-nplus.ga`,
  },
  {
    id: "propriete",
    title: "Propriété intellectuelle",
    content: `L'ensemble des éléments constituant le site (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données, etc.) ainsi que le site lui-même, sont la propriété exclusive d'Oréma N+ ou de ses partenaires.

Ces éléments sont protégés par l'Accord de Bangui (OAPI) et les conventions internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, utilisation, adaptation, modification, incorporation, traduction, commercialisation, partielle ou intégrale des éléments du site, par quelque procédé et sur quelque support que ce soit, sans l'autorisation écrite préalable d'Oréma N+, est strictement interdite.`,
  },
  {
    id: "responsabilite",
    title: "Limitation de responsabilité",
    content: `Oréma N+ s'efforce de fournir des informations aussi précises que possible sur le site. Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.

Toutes les informations indiquées sur le site sont données à titre indicatif, et sont susceptibles d'évoluer. Par ailleurs, les renseignements figurant sur le site ne sont pas exhaustifs.

Oréma N+ ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site.`,
  },
  {
    id: "liens",
    title: "Liens hypertextes",
    content: `Le site peut contenir des liens hypertextes vers d'autres sites présents sur le réseau Internet. Ces liens vers d'autres sites ne constituent en aucun cas une approbation ou un partenariat avec ces sites.

Oréma N+ n'exerce aucun contrôle sur le contenu de ces sites et décline toute responsabilité quant à leur contenu ou quant à l'utilisation qui peut en être faite.`,
  },
  {
    id: "cookies",
    title: "Gestion des cookies",
    content: `Le site utilise des cookies pour améliorer l'expérience utilisateur et analyser le trafic. Pour plus d'informations sur l'utilisation des cookies, veuillez consulter notre Politique de Confidentialité.

Conformément à la réglementation, vous disposez d'un droit d'opposition et de paramétrage de ces cookies via les options de votre navigateur.`,
  },
  {
    id: "droit",
    title: "Droit applicable",
    content: `Les présentes mentions légales sont régies par le droit gabonais. Tout litige relatif à l'utilisation du site sera soumis à la compétence exclusive des tribunaux de Libreville.

En cas de traduction des présentes mentions légales dans une ou plusieurs langues, la version française prévaudra en cas de litige.`,
  },
];

export default function LegalPage() {
  return (
    <>
      <PageHeader
        title="Mentions Légales"
        subtitle="Informations légales relatives à l'utilisation du site Oréma N+."
        badge="Légal"
      />

      <Container size="3" py="9">
        {/* Company info cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
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
            <Flex align="center" gap="3" mb="5">
              <Box
                p="3"
                style={{
                  background: "var(--violet-a4)",
                  borderRadius: 12,
                }}
              >
                <Building2 size={24} style={{ color: "var(--violet-9)" }} />
              </Box>
              <Heading size="4">Informations de l&apos;entreprise</Heading>
            </Flex>
            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
              {legalInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                >
                  <Flex align="start" gap="3">
                    <Box
                      p="2"
                      style={{
                        background: "var(--gray-a3)",
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      <info.icon size={16} style={{ color: "var(--gray-11)" }} />
                    </Box>
                    <Box>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        {info.title}
                      </Text>
                      <Text size="2" weight="medium">
                        {info.value}
                      </Text>
                    </Box>
                  </Flex>
                </motion.div>
              ))}
            </Grid>
          </Box>
        </motion.div>

        {/* Hosting info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
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
                <Server size={24} style={{ color: "var(--blue-9)" }} />
              </Box>
              <Heading size="4">Hébergement</Heading>
            </Flex>
            <Grid columns={{ initial: "1", md: "3" }} gap="4">
              {hosting.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
                >
                  <Flex align="start" gap="3">
                    <Box
                      p="2"
                      style={{
                        background: "var(--blue-a3)",
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      <info.icon size={16} style={{ color: "var(--blue-9)" }} />
                    </Box>
                    <Box>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        {info.title}
                      </Text>
                      <Text size="2" weight="medium">
                        {info.value}
                      </Text>
                    </Box>
                  </Flex>
                </motion.div>
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
            transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
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

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
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
              Crédits
            </Heading>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="3">
                <User size={18} style={{ color: "var(--gray-10)" }} />
                <Text size="3" color="gray">
                  Design & Développement : Équipe Oréma N+
                </Text>
              </Flex>
              <Flex align="center" gap="3">
                <Globe size={18} style={{ color: "var(--gray-10)" }} />
                <Text size="3" color="gray">
                  Icônes : Lucide Icons (lucide.dev)
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
