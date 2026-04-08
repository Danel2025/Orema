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
  Question,
  MagnifyingGlass,
  CaretDown,
  CreditCard,
  GearSix,
  ShieldCheck,
  DeviceMobile,
  Printer,
  Lightning,
  ChatCircle,
  Users,
  ChartBar,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

const categories = [
  { id: "all", label: "Toutes", icon: Question },
  { id: "getting-started", label: "Démarrage", icon: Lightning },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "configuration", label: "Configuration", icon: GearSix },
  { id: "printing", label: "Impression", icon: Printer },
  { id: "security", label: "Sécurité", icon: ShieldCheck },
  { id: "mobile", label: "Mobile", icon: DeviceMobile },
];

const faqs = [
  {
    category: "getting-started",
    question: "Combien de temps faut-il pour configurer Orema N+ ?",
    answer:
      "La configuration initiale prend environ 30 minutes. Cela inclut la creation de votre compte, l'ajout de vos premiers produits et la configuration de votre imprimante. Vous pouvez ensuite ajouter d'autres produits et affiner vos parametres progressivement.",
  },
  {
    category: "getting-started",
    question: "Y a-t-il une periode d'essai gratuite ?",
    answer:
      "Oui. 14 jours d'essai gratuit avec acces complet a toutes les fonctionnalites. Aucune carte bancaire requise. A la fin de l'essai, choisissez le plan qui correspond a votre activite.",
  },
  {
    category: "getting-started",
    question: "Puis-je importer mes produits existants ?",
    answer:
      "Oui, via un fichier CSV. Nous fournissons un modele de fichier avec des instructions detaillees. Notre equipe support peut egalement vous accompagner gratuitement pour votre premiere importation.",
  },
  {
    category: "payments",
    question: "Quels moyens de paiement sont supportes ?",
    answer:
      "Especes, cartes bancaires (via terminal externe), Airtel Money, Moov Money, cheques, virements bancaires et compte client (credit). Le paiement mixte est egalement supporte : partie cash, partie Mobile Money par exemple.",
  },
  {
    category: "payments",
    question: "Comment configurer Airtel Money et Moov Money ?",
    answer:
      "Dans Paramètres > Paiements, activez les options Mobile Money et renseignez vos numéros marchands respectifs. Les transactions sont ensuite enregistrées avec leur référence pour faciliter le rapprochement.",
  },
  {
    category: "payments",
    question: "Puis-je offrir du credit a mes clients ?",
    answer:
      "Oui. Activez l'option Compte client pour certains clients. Definissez une limite de credit par client et suivez les soldes dus. Des rappels peuvent etre envoyes automatiquement.",
  },
  {
    category: "configuration",
    question: "Comment configurer les taxes (TVA) ?",
    answer:
      "Par défaut, la TVA gabonaise standard de 18% est configurée. Vous pouvez définir des taux différents (10% réduit, 0% exonéré) par produit dans Paramètres > Fiscalité. La TVA est calculée automatiquement sur chaque ticket.",
  },
  {
    category: "configuration",
    question: "Puis-je avoir plusieurs etablissements ?",
    answer:
      "Oui, avec le plan Business. Chaque etablissement a ses propres produits, stocks et rapports, mais vous disposez d'une vue consolidee de toute votre activite.",
  },
  {
    category: "configuration",
    question: "Comment personnaliser mes tickets de caisse ?",
    answer:
      "Dans Paramètres > Impression > Format ticket. Ajoutez votre logo, personnalisez l'en-tête et le pied de page, choisissez les informations à afficher (NIF, RCCM, message promotionnel, etc.).",
  },
  {
    category: "printing",
    question: "Quelles imprimantes sont compatibles ?",
    answer:
      "Toutes les imprimantes thermiques utilisant le protocole ESC/POS. Les marques courantes (Epson, Star, Bixolon) fonctionnent parfaitement. Connexions supportees : USB, reseau (Ethernet/WiFi) et Bluetooth.",
  },
  {
    category: "printing",
    question:
      "Puis-je avoir une imprimante pour la cuisine et une pour les tickets ?",
    answer:
      "Oui. Configurez plusieurs imprimantes avec des roles differents : tickets clients, bons de commande cuisine, bons de commande bar. Assignez ensuite chaque categorie de produits a l'imprimante correspondante.",
  },
  {
    category: "printing",
    question: "Que faire si mon imprimante ne fonctionne pas ?",
    answer:
      "Vérifiez d'abord la connexion (câble USB, réseau). Dans Paramètres > Impression, cliquez sur 'Tester'. Si le problème persiste, consultez notre guide de dépannage ou contactez le support technique.",
  },
  {
    category: "security",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Toutes les données sont chiffrées en transit (SSL/TLS) et au repos. Sauvegardes quotidiennes. Serveurs hébergés chez Vercel/Supabase avec certifications de sécurité internationales.",
  },
  {
    category: "security",
    question: "Comment gérer les accès de mon équipe ?",
    answer:
      "Créez des comptes utilisateurs avec différents rôles : Admin, Manager, Caissier, Serveur. Chaque rôle a des permissions spécifiques. Les caissiers peuvent se connecter rapidement via un code PIN à 4 chiffres.",
  },
  {
    category: "security",
    question: "Orema N+ fonctionne-t-il hors connexion ?",
    answer:
      "Oui. Le mode hors-ligne permet de continuer à encaisser sans Internet. Les transactions sont stockées localement et synchronisées automatiquement dès que la connexion est rétablie.",
  },
  {
    category: "mobile",
    question: "Puis-je utiliser Orema N+ sur une tablette ?",
    answer:
      "Oui, l'interface est optimisee pour les tablettes (iPad, Android) de 10 pouces et plus. C'est la configuration ideale pour un restaurant ou un food truck.",
  },
  {
    category: "mobile",
    question: "Y a-t-il une application mobile ?",
    answer:
      "L'application mobile est en cours de developpement pour les managers et proprietaires (consultation des statistiques, suivi en temps reel). En attendant, Orema N+ est accessible depuis le navigateur de tout smartphone.",
  },
  {
    category: "mobile",
    question: "Comment prendre les commandes a table avec un smartphone ?",
    answer:
      "Via le navigateur de tout smartphone. Vos serveurs prennent les commandes directement a table. La commande est envoyee instantanement a la cuisine et associee a la table.",
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
        title="Questions frequentes"
        subtitle="Trouvez rapidement les reponses a vos questions sur Orema N+."
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
              <MagnifyingGlass
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
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Flex
            gap="2"
            wrap="wrap"
            justify="center"
            mb="8"
            role="group"
            aria-label="Filtrer par categorie"
          >
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
                      ? "var(--accent-9)"
                      : "var(--gray-a3)",
                  color:
                    activeCategory === category.id
                      ? "white"
                      : "var(--gray-11)",
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
          transition={{ delay: 0.4, duration: 0.5 }}
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
              <MagnifyingGlass
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
                {searchQuery ? (
                  <>votre recherche &quot;{searchQuery}&quot;</>
                ) : (
                  <>cette categorie</>
                )}
              </Text>
              <Flex gap="2" justify="center" wrap="wrap">
                {searchQuery ? (
                  <button
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
                    }}
                  >
                    Effacer la recherche
                  </button>
                ) : null}
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
                  transition={{
                    delay: 0.5 + index * 0.03,
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
                      <Text
                        size="3"
                        weight="medium"
                        style={{ color: "var(--gray-12)" }}
                      >
                        {faq.question}
                      </Text>
                      <motion.div
                        animate={{
                          rotate: openIndex === index ? 180 : 0,
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
                      {openIndex === index && (
                        <motion.div
                          id={`faq-answer-${index}`}
                          role="region"
                          aria-labelledby={`faq-question-${index}`}
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
          )}
        </motion.div>

        {/* Support stats */}
        <Grid columns={{ initial: "1", sm: "3" }} gap="4" mt="9" mb="9">
          {[
            { icon: Users, value: "6j/7", label: "Support disponible" },
            { icon: ChatCircle, value: "< 24h", label: "Delai de reponse" },
            { icon: ChartBar, value: "Dedie", label: "Accompagnement" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
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
                  weight="duotone"
                  style={{
                    color: "var(--accent-9)",
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

        {/* Contact CTA */}
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
            <Heading size="5" mb="3" style={{ color: "white" }}>
              Vous ne trouvez pas votre reponse ?
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
              Notre equipe support est disponible du lundi au samedi, de 8h a
              18h (heure de Libreville).
            </Text>
            <Flex gap="3" justify="center" wrap="wrap">
              <Link
                href="mailto:support@orema-nplus.ga"
                style={{
                  textDecoration: "none",
                  background: "white",
                  color: "var(--accent-9)",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Contacter le support
              </Link>
              <Link
                href="/guide"
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
                Guide de demarrage
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
