"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Badge,
  Skeleton,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import { PageHeader, Newsletter } from "@/components/public";
import type {
  LucideIcon} from "lucide-react";
import {
  BookOpen,
  Calendar,
  User,
  ArrowRight,
  Tag,
  Globe,
  Lightbulb,
  Zap,
  Store,
  Shield,
  ChefHat,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  getPublishedBlogPosts,
  getFeaturedBlogPost,
  getPublishedBlogCategories,
} from "@/actions/admin/blog";

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Lightbulb,
  Zap,
  Store,
  Shield,
  ChefHat,
  TrendingUp,
  BookOpen,
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  icon: string | null;
  color: string | null;
  featured: boolean;
  published_at: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    color: string;
  } | null;
  author: {
    id: string;
    name: string;
    role: string | null;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  color: string;
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [postsData, featured, cats] = await Promise.all([
        getPublishedBlogPosts(),
        getFeaturedBlogPost(),
        getPublishedBlogCategories(),
      ]);
      setPosts(postsData as BlogPost[]);
      setFeaturedPost(featured as BlogPost | null);
      setCategories(cats as BlogCategory[]);
    } catch (_err) {
      setError(
        "Impossible de charger les articles. Veuillez verifier votre connexion et reessayer."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allCategories = [
    { id: "all", slug: "all", name: "Tous les articles", color: "gray" },
    ...categories,
  ];

  const filteredPosts = posts.filter((post) => {
    if (activeCategory === "all") return !post.featured;
    return post.category?.id === activeCategory && !post.featured;
  });

  const displayedPosts = filteredPosts.slice(0, visiblePosts);
  const hasMorePosts = filteredPosts.length > visiblePosts;

  const loadMorePosts = () => {
    setVisiblePosts((prev) => prev + 6);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <PageHeader
        title="Blog Oréma N+"
        subtitle="Actualités, conseils et bonnes pratiques pour optimiser votre commerce."
        badge="Blog"
      />

      <Container size="4" py="9">
        {/* Featured post */}
        {featuredPost && !isLoading ? <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href={`/blog/${featuredPost.slug}`} style={{ textDecoration: "none" }}>
              <Box
                mb="9"
                style={{
                  background:
                    "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
                  borderRadius: 24,
                  border: "1px solid var(--violet-a4)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px -12px var(--violet-a5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Grid columns={{ initial: "1", md: "5" }}>
                  <Box
                    style={{
                      gridColumn: "span 2",
                      minHeight: 200,
                      background: `var(--${featuredPost.color || "violet"}-a3)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(() => {
                      const FeaturedIcon = iconMap[featuredPost.icon || ""] || Globe;
                      return (
                        <FeaturedIcon
                          size={64}
                          style={{ color: `var(--${featuredPost.color || "violet"}-9)`, opacity: 0.5 }}
                        />
                      );
                    })()}
                  </Box>
                  <Box p="8" style={{ gridColumn: "span 3" }}>
                    <Flex gap="2" mb="4" wrap="wrap">
                      <Badge color="violet" size="2">
                        Article vedette
                      </Badge>
                      {featuredPost.tags.map((tag) => (
                        <Badge key={tag.id} variant="surface" size="1">
                          {tag.name}
                        </Badge>
                      ))}
                    </Flex>
                    <Heading size="6" mb="3" style={{ color: "var(--gray-12)" }}>
                      {featuredPost.title}
                    </Heading>
                    <Text
                      size="3"
                      mb="5"
                      style={{
                        color: "var(--gray-11)",
                        lineHeight: 1.7,
                        display: "block",
                      }}
                    >
                      {featuredPost.excerpt}
                    </Text>
                    <Flex
                      align="center"
                      justify="between"
                      wrap="wrap"
                      gap="4"
                    >
                      <Flex align="center" gap="4">
                        <Flex align="center" gap="2">
                          <User size={14} style={{ color: "var(--gray-10)" }} />
                          <Text size="2" color="gray">
                            {featuredPost.author?.name}
                          </Text>
                        </Flex>
                        <Flex align="center" gap="2">
                          <Calendar
                            size={14}
                            style={{ color: "var(--gray-10)" }}
                          />
                          <Text size="2" color="gray">
                            {formatDate(featuredPost.published_at)}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex
                        align="center"
                        gap="2"
                        style={{ color: "var(--violet-9)" }}
                      >
                        <Text size="2" weight="bold">
                          Lire l&apos;article
                        </Text>
                        <ArrowRight size={16} />
                      </Flex>
                    </Flex>
                  </Box>
                </Grid>
              </Box>
            </Link>
          </motion.div> : null}

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Flex gap="2" wrap="wrap" mb="8" role="group" aria-label="Filtrer par categorie">
            {allCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                aria-pressed={activeCategory === category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setVisiblePosts(6);
                }}
                style={{
                  padding: "10px 20px",
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
                {category.name}
              </motion.button>
            ))}
          </Flex>
        </motion.div>

        {/* Error state */}
        {error && !isLoading ? <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
              <AlertTriangle
                size={48}
                style={{ color: "var(--red-9)", marginBottom: 16 }}
              />
              <Heading size="4" mb="2" style={{ color: "var(--red-11)" }}>
                Erreur de chargement
              </Heading>
              <Text
                size="3"
                mb="5"
                style={{ color: "var(--red-11)", display: "block" }}
              >
                {error}
              </Text>
              <button
                onClick={loadData}
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
          </motion.div> : null}

        {/* Loading state */}
        {isLoading ? (
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="5">
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                <Skeleton
                  style={{
                    height: 100,
                    width: "100%",
                    borderRadius: 0,
                  }}
                />
                <Box p="5">
                  <Flex gap="2" mb="3">
                    <Skeleton style={{ height: 16, width: 60 }} />
                    <Skeleton style={{ height: 16, width: 80 }} />
                  </Flex>
                  <Skeleton style={{ height: 24, width: "90%", marginBottom: 8 }} />
                  <Skeleton style={{ height: 16, width: "100%", marginBottom: 4 }} />
                  <Skeleton style={{ height: 16, width: "70%", marginBottom: 16 }} />
                  <Flex justify="between" align="center">
                    <Skeleton style={{ height: 14, width: 100 }} />
                    <Skeleton style={{ height: 16, width: 16, borderRadius: "50%" }} />
                  </Flex>
                </Box>
              </Box>
            ))}
          </Grid>
        ) : !error ? (
          <>
            {/* Empty state - no posts at all */}
            {posts.length === 0 && !featuredPost && (
              <Box
                p="9"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 20,
                  textAlign: "center",
                }}
              >
                <PenLine
                  size={56}
                  style={{ color: "var(--gray-8)", marginBottom: 20 }}
                />
                <Heading size="5" mb="3" color="gray">
                  Aucun article publie
                </Heading>
                <Text
                  size="3"
                  color="gray"
                  style={{ maxWidth: 400, margin: "0 auto", display: "block" }}
                >
                  Les articles du blog apparaitront ici une fois publies. Revenez bientot pour decouvrir nos contenus.
                </Text>
              </Box>
            )}

            {/* Posts grid */}
            {(posts.length > 0 || featuredPost) ? <>
            <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="5">
              {displayedPosts.map((post, index) => {
                const PostIcon = iconMap[post.icon || ""] || BookOpen;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.08, duration: 0.5 }}
                  >
                    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                      <Box
                        style={{
                          background: "var(--gray-a2)",
                          borderRadius: 20,
                          border: "1px solid var(--gray-a4)",
                          overflow: "hidden",
                          height: "100%",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 24px -8px var(--gray-a5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Icon header */}
                        <Box
                          style={{
                            height: 100,
                            background: `var(--${post.color || "gray"}-a2)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            p="4"
                            style={{
                              background: `var(--${post.color || "gray"}-a3)`,
                              borderRadius: 16,
                            }}
                          >
                            <PostIcon
                              size={32}
                              style={{ color: `var(--${post.color || "gray"}-9)` }}
                            />
                          </Box>
                        </Box>

                        <Box p="5">
                          <Flex gap="2" mb="3" wrap="wrap">
                            {post.tags.slice(0, 2).map((tag) => (
                              <Flex key={tag.id} align="center" gap="1">
                                <Tag
                                  size={10}
                                  style={{ color: "var(--gray-10)" }}
                                />
                                <Text size="1" color="gray">
                                  {tag.name}
                                </Text>
                              </Flex>
                            ))}
                          </Flex>

                          <Heading
                            size="4"
                            mb="2"
                            style={{ color: "var(--gray-12)" }}
                          >
                            {post.title}
                          </Heading>

                          <Text
                            size="2"
                            mb="4"
                            style={{
                              color: "var(--gray-11)",
                              lineHeight: 1.6,
                              display: "block",
                            }}
                          >
                            {(post.excerpt || "").slice(0, 100)}...
                          </Text>

                          <Flex align="center" justify="between">
                            <Flex align="center" gap="3">
                              <Text size="1" color="gray">
                                {formatDate(post.published_at)}
                              </Text>
                            </Flex>
                            <ArrowRight
                              size={16}
                              style={{ color: `var(--${post.color || "gray"}-9)` }}
                            />
                          </Flex>
                        </Box>
                      </Box>
                    </Link>
                  </motion.div>
                );
              })}
            </Grid>

            {/* Load more */}
            {hasMorePosts ? <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <Flex justify="center" mt="9">
                  <button
                    onClick={loadMorePosts}
                    style={{
                      padding: "14px 32px",
                      borderRadius: 9999,
                      border: "1px solid var(--gray-a6)",
                      background: "transparent",
                      color: "var(--gray-11)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--gray-a3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Charger plus d&apos;articles
                  </button>
                </Flex>
              </motion.div> : null}

            {/* No results for current filter */}
            {displayedPosts.length === 0 && (
              <Box
                p="8"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 16,
                  textAlign: "center",
                }}
              >
                <BookOpen
                  size={48}
                  style={{ color: "var(--gray-8)", marginBottom: 16 }}
                />
                <Heading size="4" mb="2" color="gray">
                  Aucun article
                </Heading>
                <Text
                  size="3"
                  color="gray"
                  style={{ display: "block", marginBottom: 16 }}
                >
                  Aucun article dans cette categorie pour le moment.
                </Text>
                {activeCategory !== "all" && (
                  <button
                    onClick={() => {
                      setActiveCategory("all");
                      setVisiblePosts(6);
                    }}
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
                    Voir tous les articles
                  </button>
                )}
              </Box>
            )}
            </> : null}
          </>
        ) : null}

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Box mt="9">
            <Newsletter
              title="Restez informé"
              description="Recevez nos derniers articles et conseils directement dans votre boîte mail."
            />
          </Box>
        </motion.div>
      </Container>
    </>
  );
}
