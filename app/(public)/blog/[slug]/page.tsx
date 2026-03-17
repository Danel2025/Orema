"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Grid,
  Separator,
  Badge,
  Skeleton,
} from "@radix-ui/themes";
import { MarkdownRenderer } from "@/components/public/markdown-renderer";
import { motion } from "motion/react";
import type {
  LucideIcon} from "lucide-react";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Tag,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Globe,
  Lightbulb,
  Zap,
  Store,
  Shield,
  ChefHat,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getPublishedBlogPostBySlug, getRelatedBlogPosts, getPublishedBlogPosts } from "@/actions/admin/blog";
import { useState, useEffect } from "react";

// Map des icônes par nom
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
  content: string;
  icon: string | null;
  color: string | null;
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
    bio?: string | null;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  color: string | null;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [allPosts, setAllPosts] = useState<{ id: string; slug: string; title: string; color: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [postData, postsData] = await Promise.all([
          getPublishedBlogPostBySlug(slug),
          getPublishedBlogPosts(),
        ]);

        if (!postData) {
          setPost(null);
        } else {
          setPost(postData as BlogPost);
          // Load related posts
          if (postData.category?.id) {
            const related = await getRelatedBlogPosts(postData.id, postData.category.id, 3);
            setRelatedPosts(related as RelatedPost[]);
          }
        }
        setAllPosts(postsData.map((p: BlogPost) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          color: p.color
        })));
      } catch (error) {
        console.error("Erreur chargement post:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Box
          style={{
            background: "var(--violet-a2)",
            paddingTop: 120,
            paddingBottom: 40,
          }}
        >
          <Container size="3">
            <Skeleton style={{ height: 24, width: 150, marginBottom: 16 }} />
            <Skeleton style={{ height: 48, width: "70%", marginBottom: 16 }} />
            <Skeleton style={{ height: 24, width: 300, marginBottom: 24 }} />
          </Container>
        </Box>
        <Container size="3" py="9">
          <Skeleton style={{ height: 500, borderRadius: 20 }} />
        </Container>
      </Box>
    );
  }

  if (!post) {
    notFound();
  }

  const PostIcon = iconMap[post.icon || ""] || Globe;

  // Get adjacent posts for navigation
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    datePublished: post.published_at || undefined,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Oréma N+",
      url: "https://orema-nplus.ga",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://orema-nplus.ga/blog/${slug}`,
    },
    keywords: post.tags.map((tag) => tag.name).join(", "),
    inLanguage: "fr",
  };

  return (
    <Box style={{ background: "var(--gray-1)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Hero */}
      <Box
        style={{
          background: `linear-gradient(180deg, var(--${post.color || "violet"}-a2) 0%, var(--gray-1) 100%)`,
          paddingTop: 120,
          paddingBottom: 40,
        }}
      >
        <Container size="3">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <nav aria-label="Fil d'Ariane">
              <Flex align="center" gap="2" mb="6">
                <Link
                  href="/blog"
                  style={{
                    textDecoration: "none",
                    color: "var(--gray-11)",
                    fontSize: 14,
                  }}
                >
                  Blog
                </Link>
                <ChevronRight size={14} style={{ color: "var(--gray-8)" }} aria-hidden="true" />
                <Text size="2" style={{ color: `var(--${post.color || "violet"}-9)` }} aria-current="page">
                  {post.title.length > 30 ? `${post.title.slice(0, 30)}...` : post.title}
                </Text>
              </Flex>
            </nav>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Tags */}
            <Flex gap="2" mb="4" wrap="wrap">
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="surface" size="2">
                  <Tag size={12} />
                  {tag.name}
                </Badge>
              ))}
            </Flex>

            {/* Title */}
            <Heading size="8" mb="4" style={{ maxWidth: 700 }}>
              {post.title}
            </Heading>

            {/* Meta */}
            <Flex align="center" gap="6" wrap="wrap" mb="6">
              <Flex align="center" gap="2">
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `var(--${post.color || "violet"}-a4)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={16} style={{ color: `var(--${post.color || "violet"}-9)` }} />
                </Box>
                <Box>
                  <Text size="2" weight="medium" style={{ display: "block" }}>
                    {post.author?.name}
                  </Text>
                  <Text size="1" color="gray">
                    {post.author?.role}
                  </Text>
                </Box>
              </Flex>
              <Flex align="center" gap="2">
                <Calendar size={14} style={{ color: "var(--gray-10)" }} />
                <Text size="2" color="gray">
                  {formatDate(post.published_at)}
                </Text>
              </Flex>
            </Flex>

            {/* Share buttons */}
            <Flex gap="2" role="group" aria-label="Partager cet article">
              <button
                aria-label="Partager sur Twitter"
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      window.location.href
                    )}&text=${encodeURIComponent(post.title)}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a5)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <Twitter size={16} style={{ color: "var(--gray-11)" }} aria-hidden="true" />
              </button>
              <button
                aria-label="Partager sur Facebook"
                onClick={() => {
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      window.location.href
                    )}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a5)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <Facebook size={16} style={{ color: "var(--gray-11)" }} aria-hidden="true" />
              </button>
              <button
                aria-label="Partager sur LinkedIn"
                onClick={() => {
                  window.open(
                    `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                      window.location.href
                    )}&title=${encodeURIComponent(post.title)}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a5)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <Linkedin size={16} style={{ color: "var(--gray-11)" }} aria-hidden="true" />
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
                  padding: "0 12px",
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a5)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--gray-11)",
                }}
              >
                <Share2 size={14} aria-hidden="true" />
                Copier le lien
              </button>
            </Flex>
          </motion.div>
        </Container>
      </Box>

      <Container size="3" py="9">
        {/* Article content */}
        <article aria-label={post.title}>
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
            <MarkdownRenderer content={post.content} accentColor={post.color || "violet"} />
          </Box>
        </motion.div>

        {/* Author box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Box
            mt="8"
            p="6"
            style={{
              background: `var(--${post.color || "violet"}-a2)`,
              borderRadius: 16,
              border: `1px solid var(--${post.color || "violet"}-a4)`,
            }}
          >
            <Flex gap="4" align="center">
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: `var(--${post.color || "violet"}-a4)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: `var(--${post.color || "violet"}-9)`,
                }}
              >
                {post.author?.name.charAt(0)}
              </Box>
              <Box>
                <Text size="4" weight="bold" style={{ display: "block" }}>
                  {post.author?.name}
                </Text>
                <Text size="2" color="gray" style={{ display: "block" }}>
                  {post.author?.role}
                </Text>
                <Text size="2" color="gray" mt="1">
                  {post.author?.bio || "Passionné par la transformation digitale du commerce africain."}
                </Text>
              </Box>
            </Flex>
          </Box>
        </motion.div>

        </article>

        <Separator size="4" my="8" />

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Heading size="5" mb="5">
              Articles similaires
            </Heading>
            <Grid columns={{ initial: "1", sm: "3" }} gap="4" mb="8">
              {relatedPosts.map((relatedPost) => {
                const RelatedIcon = iconMap[relatedPost.icon || ""] || BookOpen;
                return (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Box
                      p="5"
                      style={{
                        background: "var(--gray-a2)",
                        borderRadius: 16,
                        border: "1px solid var(--gray-a4)",
                        height: "100%",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `var(--${relatedPost.color || "gray"}-a6)`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--gray-a4)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <Flex align="center" gap="2" mb="3">
                        <RelatedIcon
                          size={16}
                          style={{ color: `var(--${relatedPost.color || "gray"}-9)` }}
                        />
                      </Flex>
                      <Text size="3" weight="medium" style={{ display: "block" }}>
                        {relatedPost.title}
                      </Text>
                    </Box>
                  </Link>
                );
              })}
            </Grid>
          </motion.div>
        )}

        {/* Post navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Grid columns={{ initial: "1", sm: "2" }} gap="4">
            {prevPost ? <Link
                href={`/blog/${prevPost.slug}`}
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
                    e.currentTarget.style.borderColor = `var(--${prevPost.color || "gray"}-a6)`;
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
                        {prevPost.title.length > 40 ? `${prevPost.title.slice(0, 40)}...` : prevPost.title}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Link> : null}
            {nextPost ? <Link
                href={`/blog/${nextPost.slug}`}
                style={{
                  textDecoration: "none",
                  gridColumn: prevPost ? "auto" : "2",
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
                    e.currentTarget.style.borderColor = `var(--${nextPost.color || "gray"}-a6)`;
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
                        {nextPost.title.length > 40 ? `${nextPost.title.slice(0, 40)}...` : nextPost.title}
                      </Text>
                    </Box>
                    <ChevronRight size={20} style={{ color: "var(--gray-10)" }} />
                  </Flex>
                </Box>
              </Link> : null}
          </Grid>
        </motion.div>

        {/* Back to blog */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Flex justify="center" mt="8">
            <Link
              href="/blog"
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
              }}
            >
              <ChevronLeft size={16} />
              Retour au blog
            </Link>
          </Flex>
        </motion.div>
      </Container>
    </Box>
  );
}
