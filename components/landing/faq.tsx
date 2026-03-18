"use client";

import { useState } from "react";
import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { CaretDown, Question } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "./motion-wrapper";

const faqs = [
  {
    question: "Oréma N+ fonctionne-t-il sans connexion internet ?",
    answer:
      "Oui ! Notre mode hors-ligne vous permet de continuer à vendre même sans internet. Toutes vos transactions sont sauvegardées localement et synchronisées automatiquement dès que la connexion revient. Vous ne perdez jamais de données.",
  },
  {
    question: "Quels modes de paiement sont supportés ?",
    answer:
      "Oréma N+ supporte les espèces, cartes bancaires, Airtel Money, Moov Money, comptes clients avec crédit, chèques et virements bancaires. Vous pouvez même accepter plusieurs modes de paiement pour une seule transaction.",
  },
  {
    question: "Puis-je utiliser ma propre imprimante ?",
    answer:
      "Oréma N+ est compatible avec la plupart des imprimantes thermiques ESC/POS via USB, réseau local ou Bluetooth. Nous recommandons les modèles Epson TM-T20 ou Star TSP100 pour une performance optimale.",
  },
  {
    question: "Combien de temps prend la mise en place ?",
    answer:
      "La configuration de base prend environ 15 minutes. Notre équipe peut vous accompagner pour l'import de vos produits, la configuration des imprimantes et la formation de votre personnel si nécessaire.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Vos données sont chiffrées en transit et au repos. Nous utilisons Supabase pour l'hébergement avec des sauvegardes automatiques quotidiennes. Vos données restent votre propriété.",
  },
  {
    question: "Puis-je changer de forfait à tout moment ?",
    answer:
      "Oui, vous pouvez upgrader ou downgrader votre forfait à tout moment. Les changements prennent effet immédiatement et sont proratisés pour le mois en cours.",
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
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
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
          style={{ color: isOpen ? "var(--accent-11)" : "var(--gray-12)" }}
        >
          {question}
        </Text>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginLeft: 16, flexShrink: 0 }}
        >
          <CaretDown
            size={20}
            weight="bold"
            style={{ color: isOpen ? "var(--accent-9)" : "var(--gray-10)" }}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen ? <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: 20 }}>
              <Text size="2" color="gray" style={{ lineHeight: 1.8 }}>
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
    <Box
      id="faq"
      py="9"
      style={{ background: "var(--color-background)" }}
    >
      <Container size="3">
        {/* Header */}
        <FadeIn>
          <Flex direction="column" align="center" gap="4" mb="8">
            <Box
              className="rounded-full"
              style={{
                background: "var(--cyan-a3)",
                border: "1px solid var(--cyan-a5)",
                padding: "8px 18px",
              }}
            >
              <Flex align="center" gap="2">
                <Question
                  size={14}
                  weight="bold"
                  style={{ color: "var(--cyan-9)", flexShrink: 0 }}
                />
                <Text
                  size="2"
                  weight="medium"
                  style={{ color: "var(--cyan-11)" }}
                >
                  FAQ
                </Text>
              </Flex>
            </Box>

            <Heading size="8" align="center">
              Questions fréquentes
            </Heading>

            <Text
              size="3"
              align="center"
              color="gray"
              className="max-w-lg"
            >
              Tout ce que vous devez savoir sur Oréma N+. Vous ne trouvez pas
              votre réponse ? Contactez notre équipe.
            </Text>
          </Flex>
        </FadeIn>

        {/* FAQ List */}
        <StaggerContainer staggerDelay={0.1}>
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
        <FadeIn delay={0.3}>
          <Box
            style={{
              marginTop: 48,
              padding: 32,
              borderRadius: 16,
              textAlign: "center",
              background:
                "linear-gradient(135deg, var(--gray-a2) 0%, var(--gray-a3) 100%)",
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex direction="column" align="center" gap="3">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--accent-a3)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Question
                  size={24}
                  weight="bold"
                  style={{ color: "var(--accent-9)" }}
                />
              </Box>
              <Heading size="4">Vous avez d&apos;autres questions ?</Heading>
              <Text size="2" color="gray">
                Notre équipe est disponible pour vous aider du lundi au samedi,
                de 8h à 20h.
              </Text>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-2 inline-flex items-center gap-2 rounded-lg font-medium text-white"
                style={{
                  background:
                    "var(--accent-9)",
                  padding: "14px 24px",
                }}
              >
                Nous contacter
              </motion.a>
            </Flex>
          </Box>
        </FadeIn>
      </Container>
    </Box>
  );
}
