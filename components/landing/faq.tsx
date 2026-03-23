"use client";

import { useState } from "react";
import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { CaretDown } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const faqs = [
  {
    question: "Que comprend le plan Essentiel ?",
    answer:
      "Le plan Essentiel est entièrement gratuit et comprend 1 utilisateur, la gestion des ventes et encaissements, le rapport de clôture journalier (rapport Z), le mode hors-ligne et le support par email. C'est idéal pour démarrer une petite activité commerciale.",
  },
  {
    question: "Oréma N+ fonctionne-t-il sans connexion internet ?",
    answer:
      "Oui. Le mode hors-ligne vous permet de continuer à encaisser même sans internet. Toutes les transactions sont sauvegardées localement et synchronisées automatiquement dès que la connexion revient. Aucune donnée n'est perdue.",
  },
  {
    question: "Quels modes de paiement sont supportés ?",
    answer:
      "Espèces, cartes bancaires, Airtel Money, Moov Money, comptes clients avec crédit, chèques et virements bancaires. Vous pouvez aussi combiner plusieurs modes de paiement sur une même transaction (paiement mixte).",
  },
  {
    question: "Quelles imprimantes sont compatibles ?",
    answer:
      "Oréma N+ est compatible avec la plupart des imprimantes thermiques ESC/POS via USB, réseau local ou Bluetooth. Nous recommandons les modèles Epson TM-T20 ou Star TSP100. Le système gère aussi le routage multi-imprimantes (cuisine, bar, caisse).",
  },
  {
    question: "Combien de temps prend la mise en place ?",
    answer:
      "La configuration de base prend environ 15 minutes : création du compte, ajout des produits et paramétrage de l'imprimante. Notre équipe peut vous accompagner pour l'import de votre catalogue existant et la formation du personnel.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Oui. Vos données sont chiffrées en transit (TLS) et au repos. L'hébergement est assuré par Supabase avec des sauvegardes automatiques quotidiennes. Vos données restent votre propriété et vous pouvez les exporter à tout moment.",
  },
  {
    question: "Puis-je changer de forfait en cours de mois ?",
    answer:
      "Oui, vous pouvez passer d'un plan à un autre à tout moment. Les changements prennent effet immédiatement. En cas d'upgrade, le montant est proratisé pour le mois en cours. En cas de downgrade, le nouveau tarif s'applique au cycle suivant.",
  },
  {
    question: "Proposez-vous une assistance sur site à Libreville ?",
    answer:
      "Oui, pour les plans Pro et Business. Notre équipe technique basée à Libreville peut intervenir pour l'installation, la configuration des imprimantes et la formation de votre équipe. Contactez-nous pour planifier une intervention.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  isLast,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--gray-a4)",
      }}
    >
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 0",
          textAlign: "left",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Text
          size="3"
          weight="medium"
          style={{
            color: isOpen ? "var(--gray-12)" : "var(--gray-11)",
            transition: "color 0.2s ease",
          }}
        >
          {question}
        </Text>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0 }}
        >
          <CaretDown
            size={16}
            weight="bold"
            style={{
              color: isOpen ? "var(--accent-9)" : "var(--gray-8)",
              transition: "color 0.2s ease",
            }}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen ? <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: 20 }}>
              <Text
                size="2"
                style={{
                  color: "var(--gray-10)",
                  lineHeight: 1.8,
                }}
              >
                {answer}
              </Text>
            </div>
          </motion.div> : null}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Box id="faq" py="9" style={{ background: "var(--color-background)" }}>
      <Container size="3">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="3" mb="8">
            <Text
              size="2"
              weight="medium"
              style={{
                color: "var(--accent-11)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              FAQ
            </Text>

            <Heading size="8" align="center">
              Questions fréquentes
            </Heading>

            <Text
              size="3"
              align="center"
              style={{ color: "var(--gray-10)", maxWidth: 460 }}
            >
              Tout ce que vous devez savoir sur Oréma N+.
            </Text>
          </Flex>
        </FadeIn>

        {/* FAQ List */}
        <StaggerContainer staggerDelay={0.06}>
          <div
            style={{
              borderTop: "1px solid var(--gray-a4)",
            }}
          >
            {faqs.map((faq, index) => (
              <StaggerItem key={index}>
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  isLast={index === faqs.length - 1}
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                />
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Contact CTA */}
        <FadeIn delay={0.2}>
          <Flex
            direction="column"
            align="center"
            gap="3"
            mt="8"
            py="6"
            px="6"
            style={{
              borderRadius: 12,
              background: "var(--gray-a2)",
              border: "1px solid var(--gray-a4)",
              textAlign: "center",
            }}
          >
            <Heading size="4">Une autre question ?</Heading>
            <Text size="2" style={{ color: "var(--gray-10)" }}>
              Notre équipe est disponible du lundi au samedi, de 8h à 20h.
            </Text>
            <a
              href="#contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
                padding: "10px 20px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                color: "white",
                background: "var(--accent-9)",
                textDecoration: "none",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent-10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent-9)";
              }}
            >
              Nous contacter
            </a>
          </Flex>
        </FadeIn>
      </Container>
    </Box>
  );
}
