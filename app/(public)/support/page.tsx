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
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  Rocket,
  CurrencyCircleDollar,
  Wrench,
  UserCircle,
  DeviceMobile,
  ShieldCheck,
  Headphones,
  Question,
  CaretRight,
  CaretDown,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

const helpCategories = [
  {
    icon: Rocket,
    title: "Démarrage",
    description: "Premiers pas avec Orema N+",
    topics: [
      "Créer votre compte",
      "Configurer votre établissement",
      "Ajouter vos premiers produits",
      "Connecter une imprimante thermique",
    ],
  },
  {
    icon: CurrencyCircleDollar,
    title: "Facturation",
    description: "Paiements et comptabilité",
    topics: [
      "Configurer les moyens de paiement",
      "Gérer la TVA et les taxes",
      "Exporter les rapports comptables",
      "Comprendre le rapport Z",
    ],
  },
  {
    icon: Wrench,
    title: "Technique",
    description: "Configuration et dépannage",
    topics: [
      "Problèmes d'impression",
      "Mode hors-ligne",
      "Mise à jour du système",
      "Performance et optimisation",
    ],
  },
  {
    icon: UserCircle,
    title: "Gestion de compte",
    description: "Utilisateurs et permissions",
    topics: [
      "Ajouter des employés",
      "Configurer les rôles (Admin, Caissier, Serveur)",
      "Gérer les codes PIN",
      "Réinitialiser un mot de passe",
    ],
  },
  {
    icon: DeviceMobile,
    title: "Mobile",
    description: "Utilisation sur tablette et smartphone",
    topics: [
      "Installer sur tablette",
      "Prise de commande à table",
      "Optimiser pour écran tactile",
      "Fonctionnalités mobiles",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Sécurité",
    description: "Protection des données",
    topics: [
      "Sauvegardes automatiques",
      "Confidentialité des données",
      "Gestion des sessions",
      "Journaux d'audit",
    ],
  },
];

const quickFaq = [
  {
    question: "Comment réinitialiser mon mot de passe ?",
    answer:
      "Sur la page de connexion, cliquez sur \"Mot de passe oublié\". Un email de réinitialisation sera envoyé à l'adresse associée à votre compte. Suivez le lien pour définir un nouveau mot de passe.",
  },
  {
    question: "Mon imprimante ne fonctionne plus, que faire ?",
    answer:
      "Vérifiez d'abord la connexion (câble USB ou réseau). Rendez-vous dans Paramètres > Impression et cliquez sur \"Tester la connexion\". Si le problème persiste, redémarrez l'imprimante et relancez le test. Contactez le support si le problème continue.",
  },
  {
    question: "Comment fonctionne le mode hors-ligne ?",
    answer:
      "Lorsque la connexion Internet est interrompue, Oréma N+ bascule automatiquement en mode hors-ligne. Les ventes sont enregistrées localement et synchronisées dès que la connexion est rétablie. Aucune donnée n'est perdue.",
  },
  {
    question: "Puis-je exporter mes données ?",
    answer:
      "Oui. Dans la section Rapports, vous pouvez exporter vos données au format PDF, Excel (XLSX) ou CSV. Les exports incluent les ventes, les produits, les clients et les mouvements de stock.",
  },
  {
    question: "Comment configurer le Mobile Money (Airtel/Moov) ?",
    answer:
      "Allez dans Paramètres > Paiements, activez les options Airtel Money et/ou Moov Money, puis renseignez vos numéros marchands respectifs. Les transactions seront enregistrées avec leur référence pour faciliter le rapprochement bancaire.",
  },
];

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        title="Centre d'aide"
        subtitle="Trouvez rapidement les réponses à vos questions et les guides dont vous avez besoin."
        badge="Support"
      />

      <Container size="4" py="9">
        {/* Help Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Box mb="6" style={{ textAlign: "center" }}>
            <Heading size="7" mb="3">
              Comment pouvons-nous vous aider ?
            </Heading>
            <Text size="4" color="gray">
              Sélectionnez une catégorie pour trouver des guides et solutions
            </Text>
          </Box>

          <Grid
            columns={{ initial: "1", sm: "2", lg: "3" }}
            gap="4"
            mb="9"
          >
            {helpCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
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
                  <Flex align="center" gap="3" mb="4">
                    <Box
                      p="3"
                      style={{
                        background: "var(--accent-a3)",
                        borderRadius: 12,
                      }}
                    >
                      <category.icon
                        size={24}
                        weight="duotone"
                        style={{ color: "var(--accent-9)" }}
                      />
                    </Box>
                    <Box>
                      <Heading size="4">{category.title}</Heading>
                      <Text size="2" color="gray">
                        {category.description}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex direction="column" gap="2">
                    {category.topics.map((topic) => (
                      <Flex
                        key={topic}
                        align="center"
                        gap="2"
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "var(--gray-a2)",
                          cursor: "default",
                        }}
                      >
                        <CaretRight
                          size={14}
                          weight="bold"
                          style={{
                            color: "var(--accent-9)",
                            flexShrink: 0,
                          }}
                        />
                        <Text size="2" style={{ color: "var(--gray-11)" }}>
                          {topic}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Quick FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Flex align="center" gap="3" mb="6" justify="center">
            <Box
              p="3"
              style={{
                background: "var(--accent-a3)",
                borderRadius: 12,
              }}
            >
              <Question
                size={24}
                weight="duotone"
                style={{ color: "var(--accent-9)" }}
              />
            </Box>
            <Box>
              <Heading size="6">Questions fréquentes</Heading>
              <Text size="3" color="gray">
                Les réponses aux questions les plus courantes
              </Text>
            </Box>
          </Flex>

          <Flex direction="column" gap="3" mb="9">
            {quickFaq.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.7 + index * 0.05,
                  duration: 0.4,
                }}
              >
                <Box
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    overflow: "hidden",
                  }}
                >
                  <button
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`support-faq-${index}`}
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      textAlign: "left",
                    }}
                  >
                    <Text
                      size="3"
                      weight="medium"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {faq.question}
                    </Text>
                    <motion.div
                      animate={{
                        rotate: openFaqIndex === index ? 180 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ flexShrink: 0 }}
                    >
                      <CaretDown
                        size={20}
                        style={{ color: "var(--gray-10)" }}
                        aria-hidden="true"
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        id={`support-faq-${index}`}
                        role="region"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeInOut",
                        }}
                      >
                        <Box
                          px="6"
                          pb="5"
                          style={{
                            borderTop: "1px solid var(--gray-a4)",
                          }}
                        >
                          <Text
                            size="3"
                            style={{
                              color: "var(--gray-11)",
                              lineHeight: 1.7,
                              display: "block",
                              paddingTop: 16,
                            }}
                          >
                            {faq.answer}
                          </Text>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </motion.div>
            ))}
          </Flex>

          <Flex justify="center" mb="9">
            <Link
              href="/faq"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 9999,
                border: "1px solid var(--gray-a6)",
                color: "var(--gray-12)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Voir toutes les questions
              <CaretRight size={16} weight="bold" />
            </Link>
          </Flex>
        </motion.div>

        <Separator size="4" my="9" />

        {/* Need More Help CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Box
            p="8"
            style={{
              background: "var(--accent-9)",
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <Headphones
              size={40}
              weight="duotone"
              style={{ color: "white", marginBottom: 16 }}
            />
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Besoin d&apos;aide supplémentaire ?
            </Heading>
            <Text
              size="3"
              mb="6"
              style={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 500,
                margin: "0 auto",
                display: "block",
              }}
            >
              Notre équipe de support est à votre disposition pour vous
              accompagner. Contactez-nous par email ou consultez notre
              documentation complète.
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="/contact"
                style={{
                  textDecoration: "none",
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Nous contacter
                <CaretRight size={16} weight="bold" />
              </Link>
              <a
                href="mailto:support@orema-nplus.ga"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                support@orema-nplus.ga
              </a>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
