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
  Rocket,
  UserPlus,
  Buildings,
  Package,
  Printer,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  Lightbulb,
  Check,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Créez votre compte",
    duration: "2 min",
    description:
      "Inscrivez-vous gratuitement avec votre adresse email. Aucune carte bancaire requise.",
    tasks: [
      "Accédez à la page d'inscription",
      "Renseignez vos informations",
      "Validez votre email",
      "Choisissez un mot de passe sécurisé",
    ],
    tip: "Utilisez une adresse email professionnelle pour faciliter la communication avec votre équipe.",
  },
  {
    number: 2,
    icon: Buildings,
    title: "Configurez votre établissement",
    duration: "5 min",
    description:
      "Créez votre établissement avec les informations légales et fiscales nécessaires.",
    tasks: [
      "Renseignez le nom et l'adresse",
      "Ajoutez votre NIF et RCCM",
      "Configurez le fuseau horaire (Africa/Libreville)",
      "Uploadez votre logo (optionnel)",
    ],
    tip: "Ces informations apparaîtront sur vos tickets de caisse. Assurez-vous qu'elles sont correctes.",
  },
  {
    number: 3,
    icon: Package,
    title: "Ajoutez vos produits",
    duration: "10-30 min",
    description:
      "Créez vos catégories et ajoutez vos produits avec prix, descriptions et options de stock.",
    tasks: [
      "Créez des catégories (Boissons, Plats, Desserts...)",
      "Ajoutez vos produits ou importez un fichier CSV",
      "Définissez les prix en FCFA",
      "Configurez la TVA (18% standard au Gabon)",
    ],
    tip: "Commencez par vos 20 produits les plus vendus. Vous pourrez ajouter les autres progressivement.",
  },
  {
    number: 4,
    icon: Printer,
    title: "Configurez l'impression",
    duration: "5 min",
    description:
      "Connectez votre imprimante thermique pour les tickets et bons de commande.",
    tasks: [
      "Connectez votre imprimante (USB, réseau ou Bluetooth)",
      "Effectuez un test d'impression",
      "Personnalisez le format du ticket",
      "Configurez les imprimantes secondaires (cuisine, bar)",
    ],
    tip: "Compatible avec la plupart des imprimantes thermiques ESC/POS 80mm.",
  },
  {
    number: 5,
    icon: CreditCard,
    title: "Activez les paiements",
    duration: "5 min",
    description:
      "Configurez les moyens de paiement acceptés : espèces, cartes, Mobile Money.",
    tasks: [
      "Activez les moyens de paiement souhaités",
      "Configurez Airtel Money et Moov Money",
      "Définissez le fond de caisse initial",
      "Testez une transaction fictive",
    ],
    tip: "Le paiement mixte est supporté : vos clients peuvent payer en partie cash et en partie Mobile Money.",
  },
  {
    number: 6,
    icon: CheckCircle,
    title: "Effectuez votre première vente",
    duration: "1 min",
    description:
      "Tout est prêt. Faites votre première vente test pour valider la configuration.",
    tasks: [
      "Ouvrez l'interface de caisse",
      "Sélectionnez des produits",
      "Encaissez le paiement",
      "Imprimez le ticket",
    ],
    tip: "Vous êtes maintenant prêt à utiliser Oréma N+ au quotidien.",
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="Guide de démarrage"
        subtitle="Configurez Orema N+ en 30 minutes et commencez à encaisser dès aujourd'hui."
        badge="Premiers pas"
      >
        <Flex gap="3" justify="center" wrap="wrap" mt="6">
          <Flex
            align="center"
            gap="2"
            px="4"
            py="2"
            style={{
              background: "var(--green-a3)",
              borderRadius: 9999,
              border: "1px solid var(--green-a5)",
            }}
          >
            <Clock
              size={14}
              weight="bold"
              style={{ color: "var(--green-9)" }}
            />
            <Text size="2" style={{ color: "var(--green-11)" }}>
              ~30 minutes
            </Text>
          </Flex>
          <Flex
            align="center"
            gap="2"
            px="4"
            py="2"
            style={{
              background: "var(--blue-a3)",
              borderRadius: 9999,
              border: "1px solid var(--blue-a5)",
            }}
          >
            <CheckCircle
              size={14}
              weight="bold"
              style={{ color: "var(--blue-9)" }}
            />
            <Text size="2" style={{ color: "var(--blue-11)" }}>
              6 étapes simples
            </Text>
          </Flex>
        </Flex>
      </PageHeader>

      <Container size="3" py="9">
        {/* CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
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
            <Flex
              align="center"
              justify="between"
              wrap="wrap"
              gap="4"
            >
              <Flex align="center" gap="4">
                <Box
                  p="4"
                  style={{
                    background: "var(--accent-a3)",
                    borderRadius: 16,
                  }}
                >
                  <Rocket
                    size={32}
                    weight="duotone"
                    style={{ color: "var(--accent-9)" }}
                  />
                </Box>
                <Box>
                  <Heading size="5" mb="1">
                    Prêt à commencer ?
                  </Heading>
                  <Text size="3" color="gray">
                    Suivez ces 6 étapes pour configurer votre système
                  </Text>
                </Box>
              </Flex>
              <Link
                href="/register"
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
                Créer mon compte
                <ArrowRight size={16} weight="bold" />
              </Link>
            </Flex>
          </Box>
        </motion.div>

        {/* Steps */}
        <Flex direction="column" gap="6" mb="9">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            >
              <Box
                p="6"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 16,
                  border: "1px solid var(--gray-a4)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Step number watermark */}
                <Text
                  style={{
                    position: "absolute",
                    top: -20,
                    right: 20,
                    fontSize: 120,
                    fontWeight: 900,
                    color: "var(--accent-a3)",
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {step.number}
                </Text>

                <Grid
                  columns={{ initial: "1", md: "3" }}
                  gap="6"
                  position="relative"
                >
                  <Box style={{ gridColumn: "span 2" }}>
                    <Flex align="center" gap="4" mb="4">
                      <Box
                        p="3"
                        style={{
                          background: "var(--accent-9)",
                          borderRadius: 12,
                        }}
                      >
                        <step.icon
                          size={24}
                          weight="fill"
                          style={{ color: "white" }}
                        />
                      </Box>
                      <Box>
                        <Flex align="center" gap="3" mb="1">
                          <Heading size="4">{step.title}</Heading>
                          <Flex
                            align="center"
                            gap="1"
                            px="2"
                            py="1"
                            style={{
                              background: "var(--gray-a3)",
                              borderRadius: 6,
                            }}
                          >
                            <Clock
                              size={12}
                              style={{ color: "var(--gray-10)" }}
                            />
                            <Text size="1" color="gray">
                              {step.duration}
                            </Text>
                          </Flex>
                        </Flex>
                        <Text size="3" color="gray">
                          {step.description}
                        </Text>
                      </Box>
                    </Flex>

                    <Box
                      mt="4"
                      p="4"
                      style={{
                        background: "var(--color-background)",
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        size="2"
                        weight="bold"
                        mb="3"
                        style={{ display: "block" }}
                      >
                        À faire :
                      </Text>
                      <Grid columns={{ initial: "1", sm: "2" }} gap="2">
                        {step.tasks.map((task, i) => (
                          <Flex key={i} align="center" gap="2">
                            <Check
                              size={14}
                              weight="bold"
                              style={{
                                color: "var(--green-9)",
                                flexShrink: 0,
                              }}
                            />
                            <Text size="2">{task}</Text>
                          </Flex>
                        ))}
                      </Grid>
                    </Box>
                  </Box>

                  <Box>
                    <Box
                      p="4"
                      style={{
                        background: "var(--accent-a2)",
                        borderRadius: 12,
                        border: "1px solid var(--accent-a4)",
                        height: "100%",
                      }}
                    >
                      <Flex align="center" gap="2" mb="2">
                        <Lightbulb
                          size={16}
                          weight="duotone"
                          style={{ color: "var(--accent-9)" }}
                        />
                        <Text
                          size="2"
                          weight="bold"
                          style={{ color: "var(--accent-11)" }}
                        >
                          Conseil
                        </Text>
                      </Flex>
                      <Text
                        size="2"
                        style={{ color: "var(--accent-11)" }}
                      >
                        {step.tip}
                      </Text>
                    </Box>
                  </Box>
                </Grid>
              </Box>
            </motion.div>
          ))}
        </Flex>

        <Separator size="4" my="9" />

        {/* Quick FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <Heading size="5" mb="5">
            Questions courantes
          </Heading>

          <Flex direction="column" gap="3" mb="6">
            {[
              {
                question: "Puis-je essayer gratuitement ?",
                answer:
                  "Oui. 14 jours d'essai gratuit sans engagement, avec accès à toutes les fonctionnalités.",
              },
              {
                question: "Quel matériel me faut-il ?",
                answer:
                  "Un ordinateur ou tablette avec navigateur web, et une imprimante thermique ESC/POS pour les tickets.",
              },
              {
                question: "Mes données sont-elles sécurisées ?",
                answer:
                  "Oui. Données chiffrées et sauvegardées quotidiennement sur des serveurs sécurisés.",
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Text
                    size="3"
                    weight="bold"
                    mb="2"
                    style={{ display: "block" }}
                  >
                    {faq.question}
                  </Text>
                  <Text size="2" color="gray">
                    {faq.answer}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Flex>

          <Flex justify="center">
            <Link
              href="/faq"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "var(--accent-9)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Voir toutes les questions
              <CaretRight size={16} weight="bold" />
            </Link>
          </Flex>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Box
            mt="9"
            p="8"
            style={{
              background: "var(--accent-9)",
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Prêt à démarrer ?
            </Heading>
            <Text
              size="4"
              mb="6"
              style={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 450,
                margin: "0 auto",
                display: "block",
              }}
            >
              Rejoignez les commerçants qui font confiance à Oréma N+ pour
              gérer leur activité au quotidien.
            </Text>
            <Link
              href="/register"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "white",
                color: "var(--accent-9)",
                padding: "14px 32px",
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Commencer gratuitement
              <ArrowRight size={18} weight="bold" />
            </Link>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
