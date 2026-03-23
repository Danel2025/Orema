"use client";

import { Box, Container, Heading, Text, Flex, Grid, Separator, Skeleton } from "@radix-ui/themes";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  BookOpen,
  Share2,
  Printer,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Utensils,
  Package,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  HardDrive,
  Book,
  FileText,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getPublishedDocArticleBySlugs } from "@/actions/admin/documentation";
import { useState, useEffect } from "react";

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

interface ArticleData {
  article: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    content: string;
    read_time: string;
  };
  category: {
    id: string;
    slug: string;
    title: string;
    color: string;
    icon: string;
  };
  relatedArticles: {
    id: string;
    slug: string;
    title: string;
    ordre: number;
  }[];
}

export default function DocsArticlePage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const articleSlug = params.slug as string;

  const [data, setData] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPublishedDocArticleBySlugs(categorySlug, articleSlug);
        if (!result) {
          setData(null);
        } else {
          setData(result as ArticleData);
        }
      } catch (error) {
        console.error("Erreur chargement article:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [categorySlug, articleSlug]);

  if (isLoading) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Container size="3" py="9" style={{ paddingTop: 120 }}>
          <Skeleton style={{ height: 24, width: 200, marginBottom: 24 }} />
          <Skeleton style={{ height: 48, width: "70%", marginBottom: 16 }} />
          <Skeleton style={{ height: 24, width: "50%", marginBottom: 32 }} />
          <Skeleton style={{ height: 400, borderRadius: 20 }} />
        </Container>
      </Box>
    );
  }

  if (!data) {
    notFound();
  }

  const { article, category, relatedArticles } = data;
  const CategoryIcon = iconMap[category.icon] || Book;

  // Get adjacent articles for navigation
  const currentIndex = relatedArticles.findIndex((a) => a.slug === articleSlug);
  const prevArticle = currentIndex > 0 ? relatedArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex < relatedArticles.length - 1 ? relatedArticles[currentIndex + 1] : null;

  return (
    <Box style={{ background: "var(--gray-1)" }}>
      <Container size="3" py="9" style={{ paddingTop: 120 }}>
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <nav aria-label="Fil d'Ariane">
            <Flex align="center" gap="2" mb="6" wrap="wrap">
              <Link
                href="/docs"
                style={{
                  textDecoration: "none",
                  color: "var(--gray-11)",
                  fontSize: 14,
                }}
              >
                Documentation
              </Link>
              <ChevronRight size={14} style={{ color: "var(--gray-8)" }} aria-hidden="true" />
              <Link
                href={`/docs/${categorySlug}`}
                style={{
                  textDecoration: "none",
                  color: "var(--gray-11)",
                  fontSize: 14,
                }}
              >
                {category.title}
              </Link>
              <ChevronRight size={14} style={{ color: "var(--gray-8)" }} aria-hidden="true" />
              <Text size="2" style={{ color: `var(--${category.color}-9)` }} aria-current="page">
                {article.title}
              </Text>
            </Flex>
          </nav>
        </motion.div>

        {/* Article header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Flex align="center" gap="3" mb="4">
            <Box
              p="3"
              style={{
                background: `var(--${category.color}-a3)`,
                borderRadius: 12,
              }}
            >
              <CategoryIcon size={24} style={{ color: `var(--${category.color}-9)` }} />
            </Box>
            <Box>
              <Text size="1" color="gray">
                {category.title}
              </Text>
              <Flex align="center" gap="2">
                <Clock size={12} style={{ color: "var(--gray-10)" }} />
                <Text size="1" color="gray">
                  {article.read_time} de lecture
                </Text>
              </Flex>
            </Box>
          </Flex>

          <Heading size="8" mb="3">
            {article.title}
          </Heading>
          <Text size="4" color="gray" mb="6" style={{ display: "block" }}>
            {article.description}
          </Text>

          {/* Actions */}
          <Flex gap="2" mb="8" role="group" aria-label="Actions sur l'article">
            <button
              aria-label="Imprimer cet article"
              onClick={() => window.print()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--gray-a5)",
                background: "transparent",
                color: "var(--gray-11)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Printer size={14} aria-hidden="true" />
              Imprimer
            </button>
            <button
              aria-label="Copier le lien de l'article"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--gray-a5)",
                background: "transparent",
                color: "var(--gray-11)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Share2 size={14} aria-hidden="true" />
              Partager
            </button>
          </Flex>
        </motion.div>

        {/* Article content */}
        <article aria-label={article.title}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Box
              p={{ initial: "5", sm: "8" }}
              style={{
                background: "var(--color-background)",
                borderRadius: 20,
                border: "1px solid var(--gray-a4)",
              }}
            >
              <MarkdownRenderer content={article.content} accentColor={category.color} />
            </Box>
          </motion.div>
        </article>

        {/* Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Box
            mt="8"
            p="6"
            style={{
              background: "var(--gray-a2)",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <Text size="3" weight="medium" mb="4" style={{ display: "block" }}>
              Cet article vous a-t-il été utile ?
            </Text>
            <Flex
              gap="3"
              justify="center"
              role="group"
              aria-label="Cet article vous a-t-il été utile ?"
            >
              <button
                aria-label="Oui, cet article m'a été utile"
                aria-pressed={feedbackGiven === "up"}
                onClick={() => setFeedbackGiven("up")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "none",
                  background: feedbackGiven === "up" ? "var(--green-9)" : "var(--gray-a3)",
                  color: feedbackGiven === "up" ? "white" : "var(--gray-11)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ThumbsUp size={16} aria-hidden="true" />
                Oui
              </button>
              <button
                aria-label="Non, cet article ne m'a pas été utile"
                aria-pressed={feedbackGiven === "down"}
                onClick={() => setFeedbackGiven("down")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "none",
                  background: feedbackGiven === "down" ? "var(--red-9)" : "var(--gray-a3)",
                  color: feedbackGiven === "down" ? "white" : "var(--gray-11)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ThumbsDown size={16} aria-hidden="true" />
                Non
              </button>
            </Flex>
            {feedbackGiven ? (
              <Text size="2" color="gray" mt="3" style={{ display: "block" }}>
                Merci pour votre retour !
              </Text>
            ) : null}
          </Box>
        </motion.div>

        <Separator size="4" my="8" />

        {/* Article navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Grid columns={{ initial: "1", sm: "2" }} gap="4">
            {prevArticle ? (
              <Link
                href={`/docs/${categorySlug}/${prevArticle.slug}`}
                style={{ textDecoration: "none" }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--${category.color}-a6)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                  }}
                >
                  <Flex align="center" gap="3">
                    <ChevronLeft size={20} style={{ color: "var(--gray-10)" }} />
                    <Box>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        Article précédent
                      </Text>
                      <Text size="3" weight="medium">
                        {prevArticle.title}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Link>
            ) : null}
            {nextArticle ? (
              <Link
                href={`/docs/${categorySlug}/${nextArticle.slug}`}
                style={{
                  textDecoration: "none",
                  gridColumn: prevArticle ? "auto" : "2",
                }}
              >
                <Box
                  p="5"
                  style={{
                    background: "var(--gray-a2)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--${category.color}-a6)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                  }}
                >
                  <Flex align="center" justify="end" gap="3">
                    <Box style={{ textAlign: "right" }}>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        Article suivant
                      </Text>
                      <Text size="3" weight="medium">
                        {nextArticle.title}
                      </Text>
                    </Box>
                    <ChevronRight size={20} style={{ color: "var(--gray-10)" }} />
                  </Flex>
                </Box>
              </Link>
            ) : null}
          </Grid>
        </motion.div>

        {/* Back to category */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Flex justify="center" mt="8">
            <Link
              href={`/docs/${categorySlug}`}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 9999,
                background: "var(--gray-a3)",
                color: "var(--gray-11)",
                fontSize: 14,
                fontWeight: 500,
                transition: "background 0.2s",
              }}
            >
              <BookOpen size={16} />
              Tous les articles de {category.title}
            </Link>
          </Flex>
        </motion.div>
      </Container>
    </Box>
  );
}
