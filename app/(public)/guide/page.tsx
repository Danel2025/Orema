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
  Building2,
  Package,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Check,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Créez votre compte",
    duration: "2 min",
    description:
      "Inscrivez-vous gratuitement avec votre adresse email. Aucune carte bancaire requise pour l'essai.",
    tasks: [
      "Accédez à orema-nplus.ga/register",
      "Renseignez vos informations personnelles",
      "Validez votre email",
      "Choisissez un mot de passe sécurisé",
    ],
    tip: "Utilisez une adresse email professionnelle pour faciliter la communication avec votre équipe.",
  },
  {
    number: 2,
    icon: Building2,
    title: "Configurez votre établissement",
    duration: "5 min",
    description:
      "Créez votre premier établissement avec toutes les informations légales et fiscales nécessaires.",
    tasks: [
      "Renseignez le nom et l'adresse",
      "Ajoutez votre NIF et RCCM",
      "Configurez votre fuseau horaire (Africa/Libreville)",
      "Uploadez votre logo (optionnel)",
    ],
    tip: "Ces informations apparaîtront sur vos tickets de caisse, assurez-vous qu'elles soient correctes.",
  },
  {
    number: 3,
    icon: Package,
    title: "Ajoutez vos produits",
    duration: "10-30 min",
    description:
      "Créez vos catégories et ajoutez vos produits avec leurs prix, descriptions et options de stock.",
    tasks: [
      "Créez des catégories (Boissons, Plats, Desserts...)",
      "Ajoutez vos produits un par un ou importez un fichier CSV",
      "Définissez les prix en FCFA",
      "Configurez la TVA (18% standard au Gabon)",
    ],
    tip: "Commencez par vos 20 produits les plus vendus, vous pourrez ajouter les autres progressivement.",
  },
  {
    number: 4,
    icon: Printer,
    title: "Configurez l'impression",
    duration: "5 min",
    description:
      "Connectez votre imprimante thermique pour les tickets de caisse et les bons de commande cuisine.",
    tasks: [
      "Connectez votre imprimante (USB, réseau ou Bluetooth)",
      "Effectuez un test d'impression",
      "Personnalisez le format du ticket",
      "Configurez les imprimantes secondaires (cuisine, bar)",
    ],
    tip: "Oréma N+ est compatible avec la plupart des imprimantes thermiques ESC/POS 80mm.",
  },
  {
    number: 5,
    icon: CreditCard,
    title: "Activez les paiements",
    duration: "5 min",
    description:
      "Configurez les moyens de paiement que vous acceptez : espèces, cartes, Mobile Money.",
    tasks: [
      "Activez les moyens de paiement souhaités",
      "Configurez Airtel Money et Moov Money",
      "Définissez le fond de caisse initial",
      "Testez une transaction fictive",
    ],
    tip: "Le paiement mixte est supporté - vos clients peuvent payer en partie cash et en partie Mobile Money.",
  },
  {
    number: 6,
    icon: CheckCircle2,
    title: "Effectuez votre première vente !",
    duration: "1 min",
    description:
      "Tout est prêt ! Faites votre première vente test pour valider que tout fonctionne correctement.",
    tasks: [
      "Ouvrez l'interface de caisse",
      "Sélectionnez des produits",
      "Encaissez le paiement",
      "Imprimez le ticket",
    ],
    tip: "Félicitations ! Vous êtes maintenant prêt à utiliser Oréma N+ au quotidien.",
  },
];

const videoTutorials = [
  {
    title: "Présentation générale",
    duration: "5:30",
    thumbnail: "var(--violet-a3)",
  },
  {
    title: "Ajouter des produits",
    duration: "8:15",
    thumbnail: "var(--blue-a3)",
  },
  {
    title: "Utiliser la caisse",
    duration: "10:00",
    thumbnail: "var(--green-a3)",
  },
];

const faqs = [
  {
    question: "Puis-je essayer gratuitement ?",
    answer:
      "Oui ! Vous bénéficiez de 14 jours d'essai gratuit sans engagement, avec accès à toutes les fonctionnalités.",
  },
  {
    question: "Quel matériel me faut-il ?",
    answer:
      "Un ordinateur ou tablette avec navigateur web, et une imprimante thermique compatible ESC/POS pour les tickets.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Vos données sont chiffrées et sauvegardées quotidiennement sur des serveurs sécurisés.",
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="Guide de démarrage"
        subtitle="Configurez Oréma N+ en 30 minutes et commencez à encaisser vos clients dès aujourd'hui."
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
            <Clock size={14} style={{ color: "var(--green-9)" }} />
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
            <CheckCircle2 size={14} style={{ color: "var(--blue-9)" }} />
            <Text size="2" style={{ color: "var(--blue-11)" }}>
              6 étapes simples
            </Text>
          </Flex>
        </Flex>
      </PageHeader>

      <Container size="3" py="9">
        {/* Progress overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Box
            mb="9"
            p="6"
            style={{
              background:
                "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
              borderRadius: 20,
              border: "1px solid var(--violet-a4)",
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
                    background: "var(--violet-a4)",
                    borderRadius: 16,
                  }}
                >
                  <Rocket size={32} style={{ color: "var(--violet-9)" }} />
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
                  background:
                    "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Créer mon compte
                <ArrowRight size={16} />
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
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <Box
                p="6"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 20,
                  border: "1px solid var(--gray-a4)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Step number background */}
                <Text
                  style={{
                    position: "absolute",
                    top: -20,
                    right: 20,
                    fontSize: 120,
                    fontWeight: 900,
                    color: "var(--violet-a3)",
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {step.number}
                </Text>

                <Grid columns={{ initial: "1", md: "3" }} gap="6" position="relative">
                  {/* Header */}
                  <Box style={{ gridColumn: "span 2" }}>
                    <Flex align="center" gap="4" mb="4">
                      <Box
                        p="3"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                          borderRadius: 12,
                        }}
                      >
                        <step.icon size={24} style={{ color: "white" }} />
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
                            <Clock size={12} style={{ color: "var(--gray-10)" }} />
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

                    {/* Tasks */}
                    <Box
                      mt="4"
                      p="4"
                      style={{
                        background: "var(--color-background)",
                        borderRadius: 12,
                      }}
                    >
                      <Text size="2" weight="bold" mb="3" style={{ display: "block" }}>
                        À faire :
                      </Text>
                      <Grid columns={{ initial: "1", sm: "2" }} gap="2">
                        {step.tasks.map((task, i) => (
                          <Flex key={i} align="center" gap="2">
                            <Check
                              size={14}
                              style={{ color: "var(--green-9)", flexShrink: 0 }}
                            />
                            <Text size="2">{task}</Text>
                          </Flex>
                        ))}
                      </Grid>
                    </Box>
                  </Box>

                  {/* Tip */}
                  <Box>
                    <Box
                      p="4"
                      style={{
                        background: "var(--purple-a2)",
                        borderRadius: 12,
                        border: "1px solid var(--purple-a4)",
                        height: "100%",
                      }}
                    >
                      <Flex align="center" gap="2" mb="2">
                        <Lightbulb
                          size={16}
                          style={{ color: "var(--purple-9)" }}
                        />
                        <Text size="2" weight="bold" style={{ color: "var(--purple-11)" }}>
                          Conseil
                        </Text>
                      </Flex>
                      <Text size="2" style={{ color: "var(--purple-11)" }}>
                        {step.tip}
                      </Text>
                    </Box>
                  </Box>
                </Grid>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <Box
                    style={{
                      position: "absolute",
                      bottom: -24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      zIndex: 10,
                    }}
                  >
                    <Box
                      p="2"
                      style={{
                        background: "var(--violet-9)",
                        borderRadius: "50%",
                        boxShadow: "0 4px 12px var(--violet-a6)",
                      }}
                    >
                      <ArrowRight
                        size={16}
                        style={{
                          color: "white",
                          transform: "rotate(90deg)",
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </motion.div>
          ))}
        </Flex>

        <Separator size="4" my="9" />

        {/* Video tutorials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Flex align="center" gap="3" mb="5">
            <Play size={24} style={{ color: "var(--violet-9)" }} />
            <Heading size="5">Tutoriels vidéo</Heading>
          </Flex>

          <Grid columns={{ initial: "1", md: "3" }} gap="4" mb="9">
            {videoTutorials.map((video, index) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid var(--gray-a4)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 24px -8px var(--gray-a6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Box
                    style={{
                      height: 120,
                      background: video.thumbnail,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      p="3"
                      style={{
                        background: "white",
                        borderRadius: "50%",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      <Play
                        size={24}
                        fill="var(--violet-9)"
                        style={{ color: "var(--violet-9)" }}
                      />
                    </Box>
                  </Box>
                  <Box p="4">
                    <Text size="3" weight="bold" style={{ display: "block" }}>
                      {video.title}
                    </Text>
                    <Text size="2" color="gray">
                      {video.duration}
                    </Text>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        <Separator size="4" my="9" />

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Flex align="center" gap="3" mb="5">
            <BookOpen size={24} style={{ color: "var(--violet-9)" }} />
            <Heading size="5">Questions fréquentes</Heading>
          </Flex>

          <Flex direction="column" gap="3" mb="9">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Text size="3" weight="bold" mb="2" style={{ display: "block" }}>
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
                color: "var(--violet-9)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Voir toutes les questions
              <ChevronRight size={16} />
            </Link>
          </Flex>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <Box
            mt="9"
            p="8"
            style={{
              background:
                "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              borderRadius: 24,
              textAlign: "center",
            }}
          >
            <CheckCircle2
              size={48}
              style={{ color: "white", marginBottom: 16, opacity: 0.9 }}
            />
            <Heading size="6" mb="3" style={{ color: "white" }}>
              Prêt à transformer votre commerce ?
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
              Rejoignez les centaines de commerçants qui font confiance à Oréma N+
              pour gérer leur activité.
            </Text>
            <Link
              href="/register"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "white",
                color: "var(--violet-9)",
                padding: "14px 32px",
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Commencer gratuitement
              <ArrowRight size={18} />
            </Link>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
