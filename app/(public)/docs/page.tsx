"use client";

import { Box, Container, Heading, Text, Flex, Grid, TextField, Skeleton } from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader } from "@/components/public";
import type { LucideIcon } from "lucide-react";
import {
  Book,
  Smartphone,
  HelpCircle,
  Search,
  ChevronRight,
  FileText,
  Video,
  Zap,
  ShoppingCart,
  Utensils,
  Package,
  Users,
  Settings,
  BarChart3,
  Printer,
  CreditCard,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { getPublishedDocCategories } from "@/actions/admin/documentation";

// Map des icônes par nom
const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Utensils,
  Package,
  Users,
  Settings,
  BarChart3,
  Printer,
  CreditCard,
  HardDrive,
  Book,
  FileText,
  HelpCircle,
};

interface DocCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  doc_articles: {
    id: string;
    slug: string;
    title: string;
    read_time: string;
  }[];
}

const quickLinks = [
  {
    icon: Video,
    title: "Tutoriels vidéo",
    description: "Apprenez visuellement",
    href: "/guide",
    color: "red",
  },
  {
    icon: FileText,
    title: "Guide de démarrage",
    description: "Configuration rapide",
    href: "/guide",
    color: "blue",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Questions fréquentes",
    href: "/faq",
    color: "violet",
  },
  {
    icon: Zap,
    title: "API Reference",
    description: "Documentation technique",
    href: "/docs/api",
    color: "purple",
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPublishedDocCategories();
      setCategories(data as unknown as DocCategory[]);
    } catch (_err) {
      setError(
        "Impossible de charger la documentation. Veuillez verifier votre connexion et reessayer."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = categories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.doc_articles.some((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <>
      <PageHeader
        title="Documentation"
        subtitle="Tout ce dont vous avez besoin pour maîtriser Oréma N+ et optimiser votre activité."
        badge="Centre d'aide"
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
                placeholder="Rechercher dans la documentation..."
                aria-label="Rechercher dans la documentation"
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

      <Container size="4" py="9">
        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="9">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <Link href={link.href} style={{ textDecoration: "none" }}>
                  <Box
                    p="4"
                    style={{
                      background: `var(--${link.color}-a2)`,
                      borderRadius: 16,
                      border: `1px solid var(--${link.color}-a4)`,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Flex align="center" gap="3">
                      <Box
                        p="2"
                        style={{
                          background: `var(--${link.color}-a3)`,
                          borderRadius: 10,
                        }}
                      >
                        <link.icon size={20} style={{ color: `var(--${link.color}-9)` }} />
                      </Box>
                      <Box>
                        <Text size="2" weight="bold" style={{ display: "block" }}>
                          {link.title}
                        </Text>
                        <Text size="1" color="gray">
                          {link.description}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </Link>
              </motion.div>
            ))}
          </Grid>
        </motion.div>

        {/* Getting started banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Box
            mb="9"
            p="6"
            style={{
              background: "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
              borderRadius: 20,
              border: "1px solid var(--violet-a4)",
            }}
          >
            <Grid columns={{ initial: "1", md: "3" }} gap="6" align="center">
              <Flex gap="4" align="center" style={{ gridColumn: "span 2" }}>
                <Box
                  p="4"
                  style={{
                    background: "var(--violet-a4)",
                    borderRadius: 16,
                  }}
                >
                  <Book size={32} style={{ color: "var(--violet-9)" }} />
                </Box>
                <Box>
                  <Heading size="5" mb="1">
                    Nouveau sur Oréma N+ ?
                  </Heading>
                  <Text size="3" color="gray">
                    Suivez notre guide de démarrage rapide pour configurer votre système de caisse
                    en moins de 30 minutes.
                  </Text>
                </Box>
              </Flex>
              <Flex justify={{ initial: "start", md: "end" }}>
                <Link
                  href="/guide"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 9999,
                    background: "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Commencer
                  <ChevronRight size={16} />
                </Link>
              </Flex>
            </Grid>
          </Box>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Heading size="6" mb="6">
            Parcourir par catégorie
          </Heading>

          {/* Error state */}
          {error && !isLoading ? (
            <Box
              p="8"
              mb="6"
              style={{
                background: "var(--red-a2)",
                borderRadius: 16,
                border: "1px solid var(--red-a5)",
                textAlign: "center",
              }}
            >
              <AlertTriangle size={48} style={{ color: "var(--red-9)", marginBottom: 16 }} />
              <Heading size="4" mb="2" style={{ color: "var(--red-11)" }}>
                Erreur de chargement
              </Heading>
              <Text size="3" mb="5" style={{ color: "var(--red-11)", display: "block" }}>
                {error}
              </Text>
              <button
                onClick={loadCategories}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "1px solid var(--red-a6)",
                  background: "var(--red-a3)",
                  color: "var(--red-11)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <RefreshCw size={16} />
                Reessayer
              </button>
            </Box>
          ) : null}

          {isLoading ? (
            <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="4">
              {[...Array(6)].map((_, i) => (
                <Box
                  key={i}
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Flex align="center" gap="3" mb="4">
                    <Skeleton style={{ width: 44, height: 44, borderRadius: 12 }} />
                    <Box style={{ flex: 1 }}>
                      <Skeleton style={{ height: 20, width: "60%", marginBottom: 4 }} />
                      <Skeleton style={{ height: 14, width: "80%" }} />
                    </Box>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Skeleton style={{ height: 36, borderRadius: 8 }} />
                    <Skeleton style={{ height: 36, borderRadius: 8 }} />
                    <Skeleton style={{ height: 36, borderRadius: 8 }} />
                  </Flex>
                  <Box pt="3" mt="3" style={{ borderTop: "1px solid var(--gray-a4)" }}>
                    <Skeleton style={{ height: 14, width: 140 }} />
                  </Box>
                </Box>
              ))}
            </Grid>
          ) : error ? null : categories.length === 0 ? (
            <Box
              p="9"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 20,
                textAlign: "center",
              }}
            >
              <FolderOpen size={56} style={{ color: "var(--gray-8)", marginBottom: 20 }} />
              <Heading size="5" mb="3" color="gray">
                Documentation en cours de redaction
              </Heading>
              <Text
                size="3"
                color="gray"
                style={{ maxWidth: 400, margin: "0 auto", display: "block" }}
              >
                Les guides et tutoriels apparaitront ici prochainement. Revenez bientot.
              </Text>
            </Box>
          ) : filteredCategories.length === 0 ? (
            <Box
              p="8"
              style={{
                background: "var(--gray-a2)",
                borderRadius: 16,
                textAlign: "center",
              }}
            >
              <Search size={48} style={{ color: "var(--gray-8)", marginBottom: 16 }} />
              <Heading size="4" mb="2" color="gray">
                Aucun resultat
              </Heading>
              <Text size="3" color="gray" style={{ display: "block", marginBottom: 16 }}>
                Aucun article ne correspond a votre recherche &quot;{searchQuery}&quot;
              </Text>
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
                  transition: "all 0.2s ease",
                }}
              >
                Effacer la recherche
              </button>
            </Box>
          ) : (
            <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="4">
              {filteredCategories.map((category, index) => {
                const CategoryIcon = iconMap[category.icon] || Book;
                return (
                  <motion.div
                    key={category.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                  >
                    <Flex
                      direction="column"
                      p="5"
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
                            background: `var(--${category.color}-a3)`,
                            borderRadius: 12,
                          }}
                        >
                          <CategoryIcon size={20} style={{ color: `var(--${category.color}-9)` }} />
                        </Box>
                        <Box>
                          <Heading size="4">{category.title}</Heading>
                          <Text size="1" color="gray">
                            {category.description}
                          </Text>
                        </Box>
                      </Flex>

                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        {category.doc_articles.slice(0, 4).map((article) => (
                          <Link
                            key={article.slug}
                            href={`/docs/${category.slug}/${article.slug}`}
                            style={{
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              borderRadius: 8,
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--gray-a3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Text size="2" style={{ color: "var(--gray-11)" }}>
                              {article.title}
                            </Text>
                            <Text size="1" color="gray">
                              {article.read_time}
                            </Text>
                          </Link>
                        ))}
                      </Flex>

                      <Box pt="3" mt="4" style={{ borderTop: "1px solid var(--gray-a4)" }}>
                        <Link
                          href={`/docs/${category.slug}`}
                          style={{
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 13,
                            fontWeight: 500,
                            color: `var(--${category.color}-9)`,
                          }}
                        >
                          Voir tous les articles
                          <ChevronRight size={14} />
                        </Link>
                      </Box>
                    </Flex>
                  </motion.div>
                );
              })}
            </Grid>
          )}
        </motion.div>

        {/* Mobile app section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Box
            mt="9"
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 20,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Grid columns={{ initial: "1", md: "2" }} gap="6" align="center">
              <Flex gap="4" align="center">
                <Box
                  p="4"
                  style={{
                    background: "var(--blue-a3)",
                    borderRadius: 16,
                  }}
                >
                  <Smartphone size={32} style={{ color: "var(--blue-9)" }} />
                </Box>
                <Box>
                  <Heading size="4" mb="1">
                    Application mobile
                  </Heading>
                  <Text size="2" color="gray">
                    Consultez vos statistiques et gérez votre établissement depuis votre smartphone.
                  </Text>
                </Box>
              </Flex>
              <Flex gap="3" justify={{ initial: "start", md: "end" }}>
                <Box
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 9999,
                    background: "var(--gray-a4)",
                    color: "var(--gray-11)",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Bientôt disponible
                </Box>
              </Flex>
            </Grid>
          </Box>
        </motion.div>

        {/* Contact support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Box
            mt="6"
            p="8"
            style={{
              background: "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              borderRadius: 24,
              textAlign: "center",
            }}
          >
            <HelpCircle size={48} style={{ color: "white", marginBottom: 16, opacity: 0.9 }} />
            <Heading size="5" mb="3" style={{ color: "white" }}>
              Vous ne trouvez pas ce que vous cherchez ?
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
              Notre équipe support est disponible pour vous aider du lundi au samedi de 8h à 18h.
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
                href="/faq"
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
                Voir la FAQ
              </Link>
            </Flex>
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
