"use client";

import { Box, Container, Heading, Text, Separator, Flex } from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import { FileText, Calendar, Shield } from "lucide-react";

const sections = [
  {
    id: "objet",
    title: "1. Objet",
    content: `Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation des services proposés par Oréma N+ (ci-après dénommé "le Service"), ainsi que de définir les droits et obligations des parties dans ce cadre.

Le Service est une solution de caisse enregistreuse (POS) destinée aux commerces, restaurants et établissements du Gabon et d'Afrique.`,
  },
  {
    id: "acceptation",
    title: "2. Acceptation des CGU",
    content: `L'utilisation du Service implique l'acceptation pleine et entière des présentes CGU. En créant un compte ou en utilisant le Service, vous reconnaissez avoir pris connaissance des présentes CGU et les accepter sans réserve.

Oréma N+ se réserve le droit de modifier à tout moment les présentes CGU. Les utilisateurs seront informés de ces modifications par tout moyen utile.`,
  },
  {
    id: "acces",
    title: "3. Accès au Service",
    content: `Le Service est accessible 24h/24 et 7j/7, sauf cas de force majeure ou maintenance programmée. Oréma N+ met en œuvre tous les moyens raisonnables pour assurer un accès continu au Service.

L'utilisateur est responsable de la compatibilité de son équipement informatique avec le Service et de son accès à Internet. Oréma N+ ne saurait être tenu responsable en cas d'impossibilité d'accès au Service liée à des problèmes techniques extérieurs.`,
  },
  {
    id: "compte",
    title: "4. Création de compte",
    content: `Pour accéder au Service, l'utilisateur doit créer un compte en fournissant des informations exactes et complètes. L'utilisateur s'engage à maintenir ces informations à jour.

L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Toute utilisation du Service effectuée à partir de son compte est réputée être effectuée par l'utilisateur lui-même.

En cas de suspicion d'utilisation frauduleuse, l'utilisateur doit en informer immédiatement Oréma N+.`,
  },
  {
    id: "utilisation",
    title: "5. Utilisation du Service",
    content: `L'utilisateur s'engage à utiliser le Service conformément à sa destination et aux présentes CGU. Il s'interdit notamment :

• D'utiliser le Service à des fins illégales ou non autorisées
• De tenter de porter atteinte au bon fonctionnement du Service
• De collecter des informations personnelles d'autres utilisateurs
• De reproduire, copier ou revendre tout ou partie du Service
• D'introduire des virus ou codes malveillants`,
  },
  {
    id: "donnees",
    title: "6. Données et propriété intellectuelle",
    content: `L'utilisateur conserve la propriété de toutes les données qu'il saisit dans le Service. Il accorde à Oréma N+ une licence limitée d'utilisation de ces données aux seules fins de fourniture du Service.

Tous les éléments du Service (marques, logos, textes, graphiques, logiciels) sont la propriété exclusive d'Oréma N+ et sont protégés par l'Accord de Bangui (OAPI) et les conventions internationales relatives à la propriété intellectuelle.`,
  },
  {
    id: "tarification",
    title: "7. Tarification et paiement",
    content: `Les tarifs applicables sont ceux en vigueur au moment de la souscription. Les prix sont indiqués en Francs CFA (XAF) et incluent toutes les taxes applicables au Gabon.

Le paiement s'effectue selon les modalités choisies lors de la souscription (mensuel ou annuel). En cas de non-paiement, Oréma N+ se réserve le droit de suspendre l'accès au Service.`,
  },
  {
    id: "responsabilite",
    title: "8. Limitation de responsabilité",
    content: `Oréma N+ s'engage à fournir le Service avec diligence et dans les règles de l'art. Toutefois, sa responsabilité est limitée aux dommages directs et prévisibles résultant d'un manquement prouvé à ses obligations.

Oréma N+ ne saurait être tenu responsable des dommages indirects, pertes de données, manque à gagner ou préjudice commercial.

La responsabilité totale d'Oréma N+ est limitée au montant des sommes effectivement versées par l'utilisateur au cours des 12 derniers mois.`,
  },
  {
    id: "resiliation",
    title: "9. Résiliation",
    content: `L'utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prend effet à la fin de la période d'abonnement en cours.

Oréma N+ peut résilier l'accès d'un utilisateur en cas de violation des présentes CGU, après mise en demeure restée sans effet pendant 15 jours.`,
  },
  {
    id: "droit",
    title: "10. Droit applicable",
    content: `Les présentes CGU sont soumises au droit gabonais et aux dispositions de l'Acte Uniforme OHADA applicables. Tout litige relatif à l'interprétation ou l'exécution des présentes sera soumis aux tribunaux compétents de Libreville, Gabon.

Préalablement à toute action judiciaire, les parties s'engagent à rechercher une solution amiable.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Conditions Générales d'Utilisation"
        subtitle="Veuillez lire attentivement ces conditions avant d'utiliser notre service."
        badge="CGU"
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
              <FileText size={18} style={{ color: "var(--gray-10)" }} />
              <Text size="2" color="gray">
                Version 1.0
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Shield size={18} style={{ color: "var(--gray-10)" }} />
              <Text size="2" color="gray">
                Conforme au droit gabonais
              </Text>
            </Flex>
          </Flex>
        </motion.div>

        {/* Table of contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <nav aria-label="Sommaire des CGU">
            <Box
              mb="8"
              p="5"
              style={{
                background: "var(--violet-a2)",
                borderRadius: 12,
                border: "1px solid var(--violet-a4)",
              }}
            >
              <Text size="3" weight="bold" mb="3" style={{ display: "block" }}>
                Sommaire
              </Text>
              <Flex direction="column" gap="2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    style={{
                      textDecoration: "none",
                      color: "var(--gray-11)",
                      fontSize: 14,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--violet-9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--gray-11)";
                    }}
                  >
                    {section.title}
                  </a>
                ))}
              </Flex>
            </Box>
          </nav>
        </motion.div>

        {/* Content sections */}
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
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

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
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
            <Heading size="4" mb="3">
              Questions ?
            </Heading>
            <Text size="3" color="gray">
              Pour toute question concernant ces CGU, contactez-nous à{" "}
              <a
                href="mailto:legal@orema-nplus.ga"
                style={{ color: "var(--violet-9)", textDecoration: "none" }}
              >
                legal@orema-nplus.ga
              </a>
            </Text>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
