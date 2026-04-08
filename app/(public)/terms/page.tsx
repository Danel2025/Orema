"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Separator,
  Flex,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  FileText,
  Calendar,
  ShieldCheck,
} from "@phosphor-icons/react";

const sections = [
  {
    id: "objet",
    number: "1",
    title: "Objet",
    content: `Les presentes Conditions Generales d'Utilisation (CGU) definissent les modalites et conditions d'utilisation des services proposes par Orema N+ (ci-apres denomme "le Service"), ainsi que les droits et obligations des parties.

Le Service est une solution de caisse enregistreuse (POS) destinee aux commerces, restaurants et etablissements du Gabon et d'Afrique.`,
  },
  {
    id: "acceptation",
    number: "2",
    title: "Acceptation des CGU",
    content: `L'utilisation du Service implique l'acceptation pleine et entiere des presentes CGU. En creant un compte ou en utilisant le Service, vous reconnaissez avoir pris connaissance des presentes CGU et les accepter sans reserve.

Orema N+ se reserve le droit de modifier a tout moment les presentes CGU. Les utilisateurs seront informes de ces modifications par tout moyen utile.`,
  },
  {
    id: "acces",
    number: "3",
    title: "Accès au Service",
    content: `Le Service est accessible 24h/24 et 7j/7, sauf cas de force majeure ou maintenance programmee. Orema N+ met en oeuvre tous les moyens raisonnables pour assurer un acces continu au Service.

L'utilisateur est responsable de la compatibilite de son equipement informatique avec le Service et de son acces a Internet. Orema N+ ne saurait etre tenu responsable en cas d'impossibilite d'acces au Service liee a des problemes techniques exterieurs.`,
  },
  {
    id: "compte",
    number: "4",
    title: "Creation de compte",
    content: `Pour acceder au Service, l'utilisateur doit creer un compte en fournissant des informations exactes et completes. L'utilisateur s'engage a maintenir ces informations a jour.

L'utilisateur est seul responsable de la confidentialite de ses identifiants de connexion. Toute utilisation du Service effectuee a partir de son compte est reputee etre effectuee par l'utilisateur lui-meme.

En cas de suspicion d'utilisation frauduleuse, l'utilisateur doit en informer immediatement Orema N+.`,
  },
  {
    id: "utilisation",
    number: "5",
    title: "Utilisation du Service",
    content: `L'utilisateur s'engage a utiliser le Service conformement a sa destination et aux presentes CGU. Il s'interdit notamment :

- D'utiliser le Service a des fins illegales ou non autorisees
- De tenter de porter atteinte au bon fonctionnement du Service
- De collecter des informations personnelles d'autres utilisateurs
- De reproduire, copier ou revendre tout ou partie du Service
- D'introduire des virus ou codes malveillants`,
  },
  {
    id: "donnees",
    number: "6",
    title: "Données et propriété intellectuelle",
    content: `L'utilisateur conserve la propriété de toutes les données qu'il saisit dans le Service. Il accorde a Orema N+ une licence limitee d'utilisation de ces donnees aux seules fins de fourniture du Service.

Tous les elements du Service (marques, logos, textes, graphiques, logiciels) sont la propriete exclusive d'Orema N+ et sont proteges par l'Accord de Bangui (OAPI) et les conventions internationales relatives a la propriete intellectuelle.`,
  },
  {
    id: "tarification",
    number: "7",
    title: "Tarification et paiement",
    content: `Les tarifs applicables sont ceux en vigueur au moment de la souscription. Les prix sont indiques en Francs CFA (XAF) et incluent toutes les taxes applicables au Gabon.

Le paiement s'effectue selon les modalites choisies lors de la souscription (mensuel ou annuel). En cas de non-paiement, Orema N+ se reserve le droit de suspendre l'acces au Service.`,
  },
  {
    id: "responsabilite",
    number: "8",
    title: "Limitation de responsabilite",
    content: `Orema N+ s'engage a fournir le Service avec diligence et dans les regles de l'art. Toutefois, sa responsabilite est limitee aux dommages directs et previsibles resultant d'un manquement prouve a ses obligations.

Orema N+ ne saurait etre tenu responsable des dommages indirects, pertes de donnees, manque a gagner ou prejudice commercial.

La responsabilite totale d'Orema N+ est limitee au montant des sommes effectivement versees par l'utilisateur au cours des 12 derniers mois.`,
  },
  {
    id: "resiliation",
    number: "9",
    title: "Resiliation",
    content: `L'utilisateur peut resilier son abonnement a tout moment depuis son espace personnel. La resiliation prend effet a la fin de la periode d'abonnement en cours.

Orema N+ peut resilier l'acces d'un utilisateur en cas de violation des presentes CGU, apres mise en demeure restee sans effet pendant 15 jours.`,
  },
  {
    id: "droit",
    number: "10",
    title: "Droit applicable",
    content: `Les presentes CGU sont soumises au droit gabonais et aux dispositions de l'Acte Uniforme OHADA applicables. Tout litige relatif a l'interpretation ou l'execution des presentes sera soumis aux tribunaux competents de Libreville, Gabon.

Prealablement a toute action judiciaire, les parties s'engagent a rechercher une solution amiable.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Conditions Generales d'Utilisation"
        subtitle="Veuillez lire attentivement ces conditions avant d'utiliser notre service."
        badge="CGU"
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
              <FileText size={18} style={{ color: "var(--gray-10)" }} />
              <Text size="2" color="gray">
                Version 1.0
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <ShieldCheck size={18} style={{ color: "var(--gray-10)" }} />
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
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <nav aria-label="Sommaire des CGU">
            <Box
              mb="8"
              p="5"
              style={{
                background: "var(--accent-a2)",
                borderRadius: 12,
                border: "1px solid var(--accent-a4)",
              }}
            >
              <Text
                size="3"
                weight="bold"
                mb="3"
                style={{ display: "block" }}
              >
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
                      e.currentTarget.style.color = "var(--accent-9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--gray-11)";
                    }}
                  >
                    {section.number}. {section.title}
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
            transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
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

        {/* Contact */}
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
            <Heading size="4" mb="3">
              Questions ?
            </Heading>
            <Text size="3" color="gray">
              Pour toute question concernant ces CGU, contactez-nous a{" "}
              <a
                href="mailto:legal@orema-nplus.ga"
                style={{
                  color: "var(--accent-9)",
                  textDecoration: "none",
                }}
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
