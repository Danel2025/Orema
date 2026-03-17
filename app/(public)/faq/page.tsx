"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  TextField,
} from "@radix-ui/themes";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/public";
import {
  HelpCircle,
  Search,
  ChevronDown,
  CreditCard,
  Settings,
  Shield,
  Smartphone,
  Printer,
  Users,
  BarChart3,
  Zap,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const categories = [
  { id: "all", label: "Toutes", icon: HelpCircle },
  { id: "getting-started", label: "Démarrage", icon: Zap },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "configuration", label: "Configuration", icon: Settings },
  { id: "printing", label: "Impression", icon: Printer },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const faqs = [
  {
    category: "getting-started",
    question: "Combien de temps faut-il pour configurer Oréma N+ ?",
    answer:
      "La configuration initiale prend environ 30 minutes. Cela inclut la création de votre compte, l'ajout de vos premiers produits et la configuration de votre imprimante. Vous pouvez ensuite ajouter d'autres produits et affiner vos paramètres progressivement.",
  },
  {
    category: "getting-started",
    question: "Y a-t-il une période d'essai gratuite ?",
    answer:
      "Oui ! Nous offrons 14 jours d'essai gratuit avec accès complet à toutes les fonctionnalités. Aucune carte bancaire n'est requise pour commencer. À la fin de l'essai, vous pouvez choisir le plan qui vous convient.",
  },
  {
    category: "getting-started",
    question: "Puis-je importer mes produits existants ?",
    answer:
      "Absolument ! Vous pouvez importer vos produits via un fichier CSV. Nous fournissons un modèle de fichier et des instructions détaillées. Notre équipe support peut également vous aider gratuitement pour votre première importation.",
  },
  {
    category: "payments",
    question: "Quels moyens de paiement sont supportés ?",
    answer:
      "Oréma N+ supporte : les espèces, les cartes bancaires (via terminal externe), Airtel Money, Moov Money, les chèques, les virements bancaires et le compte client (crédit). Vous pouvez également accepter des paiements mixtes (partie cash, partie Mobile Money).",
  },
  {
    category: "payments",
    question: "Comment configurer Airtel Money et Moov Money ?",
    answer:
      "Rendez-vous dans Paramètres > Paiements et activez les options Mobile Money. Vous devrez renseigner vos numéros marchands respectifs. Les transactions sont ensuite enregistrées avec leur référence pour faciliter le rapprochement.",
  },
  {
    category: "payments",
    question: "Puis-je offrir du crédit à mes clients ?",
    answer:
      "Oui, vous pouvez activer l'option 'Compte client' pour certains clients de confiance. Définissez une limite de crédit par client et suivez facilement les soldes dus. Des rappels peuvent être envoyés automatiquement.",
  },
  {
    category: "configuration",
    question: "Comment configurer les taxes (TVA) ?",
    answer:
      "Par défaut, Oréma N+ est configuré avec la TVA gabonaise standard de 18%. Vous pouvez définir des taux différents (10% réduit, 0% exonéré) par produit dans Paramètres > Fiscalité. La TVA est calculée automatiquement sur chaque ticket.",
  },
  {
    category: "configuration",
    question: "Puis-je avoir plusieurs établissements ?",
    answer:
      "Oui, notre plan Business permet de gérer plusieurs établissements depuis un seul compte. Chaque établissement a ses propres produits, stocks et rapports, mais vous avez une vue consolidée de toute votre activité.",
  },
  {
    category: "configuration",
    question: "Comment personnaliser mes tickets de caisse ?",
    answer:
      "Dans Paramètres > Impression > Format ticket, vous pouvez ajouter votre logo, personnaliser l'en-tête et le pied de page, et choisir les informations à afficher (NIF, RCCM, message promotionnel, etc.).",
  },
  {
    category: "printing",
    question: "Quelles imprimantes sont compatibles ?",
    answer:
      "Oréma N+ est compatible avec toutes les imprimantes thermiques utilisant le protocole ESC/POS. Les marques les plus courantes (Epson, Star, Bixolon) fonctionnent parfaitement. Nous supportons les connexions USB, réseau (Ethernet/WiFi) et Bluetooth.",
  },
  {
    category: "printing",
    question: "Puis-je avoir une imprimante pour la cuisine et une pour les tickets ?",
    answer:
      "Oui ! Vous pouvez configurer plusieurs imprimantes avec des rôles différents : tickets clients, bons de commande cuisine, bons de commande bar. Assignez ensuite chaque catégorie de produits à l'imprimante correspondante.",
  },
  {
    category: "printing",
    question: "Que faire si mon imprimante ne fonctionne pas ?",
    answer:
      "Vérifiez d'abord la connexion (câble USB, réseau). Ensuite, allez dans Paramètres > Impression et cliquez sur 'Tester'. Si le problème persiste, consultez notre guide de dépannage ou contactez notre support technique.",
  },
  {
    category: "security",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. Toutes les données sont chiffrées en transit (SSL/TLS) et au repos. Nous effectuons des sauvegardes quotidiennes. Nos serveurs sont hébergés chez Vercel/Supabase avec des certifications de sécurité internationales.",
  },
  {
    category: "security",
    question: "Comment gérer les accès de mon équipe ?",
    answer:
      "Créez des comptes utilisateurs avec différents rôles : Admin, Manager, Caissier, Serveur. Chaque rôle a des permissions spécifiques. Les caissiers peuvent se connecter rapidement via un code PIN à 4 chiffres.",
  },
  {
    category: "security",
    question: "Oréma N+ fonctionne-t-il hors connexion ?",
    answer:
      "Oui ! Notre mode hors-ligne vous permet de continuer à encaisser même sans Internet. Les transactions sont stockées localement et synchronisées automatiquement dès que la connexion est rétablie.",
  },
  {
    category: "mobile",
    question: "Puis-je utiliser Oréma N+ sur une tablette ?",
    answer:
      "Oui, Oréma N+ est optimisé pour les tablettes (iPad, Android). L'interface tactile est conçue pour les écrans de 10 pouces et plus. C'est la configuration idéale pour un restaurant ou un food truck.",
  },
  {
    category: "mobile",
    question: "Y a-t-il une application mobile ?",
    answer:
      "L'application mobile est en cours de développement. Elle permettra aux managers et propriétaires de consulter les statistiques et suivre l'activité en temps réel. En attendant, vous pouvez accéder à Oréma N+ depuis le navigateur de votre smartphone ou tablette.",
  },
  {
    category: "mobile",
    question: "Comment prendre les commandes à table avec un smartphone ?",
    answer:
      "Oréma N+ est accessible depuis le navigateur de tout smartphone. Vos serveurs peuvent prendre les commandes directement à table via l'interface web. La commande est envoyée instantanément à la cuisine et associée à la table.",
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Questions fréquentes"
        subtitle="Trouvez rapidement les réponses à vos questions sur Oréma N+."
        badge="FAQ"
      >
        {/* Search bar */}
        <Box mt="6" style={{ maxWidth: 500, margin: "24px auto 0" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Box position="relative">
              <Search
                size={18}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--gray-10)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <TextField.Root
                size="3"
                placeholder="Rechercher une question..."
                aria-label="Rechercher une question"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 44,
                  background: "var(--color-background)",
                  borderRadius: 12,
                }}
              />
            </Box>
          </motion.div>
        </Box>
      </PageHeader>

      <Container size="3" py="9">
        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Flex gap="2" wrap="wrap" justify="center" mb="8" role="group" aria-label="Filtrer par categorie">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                aria-pressed={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 9999,
                  border: "none",
                  background:
                    activeCategory === category.id
                      ? "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)"
                      : "var(--gray-a3)",
                  color:
                    activeCategory === category.id ? "white" : "var(--gray-11)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <category.icon size={16} />
                {category.label}
              </motion.button>
            ))}
          </Flex>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {filteredFaqs.length === 0 ? (
            <Box
              p="8"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 16,
                textAlign: "center",
              }}
            >
              <Search
                size={48}
                style={{ color: "var(--gray-8)", marginBottom: 16 }}
              />
              <Heading size="4" mb="2" color="gray">
                Aucun resultat
              </Heading>
              <Text
                size="3"
                color="gray"
                style={{ display: "block", marginBottom: 16 }}
              >
                Aucune question ne correspond a{" "}
                {searchQuery
                  ? <>votre recherche &quot;{searchQuery}&quot;</>
                  : <>cette categorie</>
                }
              </Text>
              <Flex gap="2" justify="center" wrap="wrap">
                {searchQuery ? <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 9999,
                      border: "1px solid var(--gray-a6)",
                      background: "transparent",
                      color: "var(--gray-11)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Effacer la recherche
                  </button> : null}
                {activeCategory !== "all" && (
                  <button
                    onClick={() => setActiveCategory("all")}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 9999,
                      border: "1px solid var(--gray-a6)",
                      background: "transparent",
                      color: "var(--gray-11)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Toutes les categories
                  </button>
                )}
              </Flex>
            </Box>
          ) : (
            <Flex direction="column" gap="3">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.03, duration: 0.4 }}
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
                      aria-expanded={openIndex === index}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() =>
                        setOpenIndex(openIndex === index ? null : index)
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
                      <Text size="3" weight="medium" style={{ color: "var(--gray-12)" }}>
                        {faq.question}
                      </Text>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ flexShrink: 0 }}
                      >
                        <ChevronDown
                          size={20}
                          style={{ color: "var(--gray-10)" }}
                          aria-hidden="true"
                        />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          id={`faq-answer-${index}`}
                          role="region"
                          aria-labelledby={`faq-question-${index}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
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
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Grid columns={{ initial: "1", sm: "3" }} gap="4" mt="9" mb="9">
            {[
              { icon: Users, value: "6j/7", label: "Support disponible" },
              { icon: MessageCircle, value: "< 24h", label: "Délai de réponse" },
              { icon: BarChart3, value: "Dédié", label: "Accompagnement" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    textAlign: "center",
                  }}
                >
                  <stat.icon
                    size={24}
                    style={{
                      color: "var(--violet-9)",
                      marginBottom: 8,
                    }}
                  />
                  <Text
                    size="6"
                    weight="bold"
                    style={{ display: "block", color: "var(--gray-12)" }}
                  >
                    {stat.value}
                  </Text>
                  <Text size="2" color="gray">
                    {stat.label}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Box
            p="8"
            style={{
              background:
                "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              borderRadius: 24,
              textAlign: "center",
            }}
          >
            <MessageCircle
              size={48}
              style={{ color: "white", marginBottom: 16, opacity: 0.9 }}
            />
            <Heading size="5" mb="3" style={{ color: "white" }}>
              Vous ne trouvez pas votre réponse ?
            </Heading>
            <Text
              size="3"
              mb="6"
              style={{
                color: "rgba(255,255,255,0.9)",
                maxWidth: 450,
                margin: "0 auto",
                display: "block",
              }}
            >
              Notre équipe support est disponible du lundi au samedi, de 8h à 18h
              (heure de Libreville).
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="mailto:support@orema-nplus.ga"
                style={{
                  textDecoration: "none",
                  background: "white",
                  color: "var(--violet-9)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Contacter le support
              </Link>
              <Link
                href="/docs"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                Voir la documentation
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
