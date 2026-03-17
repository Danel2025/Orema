"use client";

/**
 * Page d'accueil Admin - Vue d'ensemble
 * Statistiques et accès rapide à la gestion de contenu
 */

import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Skeleton,
} from "@radix-ui/themes";
import {
  BookOpen,
  FileText,
  Newspaper,
  Users,
  Tag,
  TrendingUp,
  Eye,
  EyeOff,
  Archive,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { getDocStats } from "@/actions/admin/documentation";
import { getBlogStats } from "@/actions/admin/blog";

interface Stats {
  doc: {
    categories: { total: number; published: number; draft: number; archived: number };
    articles: { total: number; published: number; draft: number; archived: number };
  };
  blog: {
    posts: { total: number; published: number; draft: number; archived: number; featured: number };
    categories: number;
    authors: number;
    tags: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [docStats, blogStats] = await Promise.all([
          getDocStats(),
          getBlogStats(),
        ]);
        setStats({
          doc: docStats,
          blog: blogStats,
        });
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const quickActions = [
    {
      href: "/admin/contenu/documentation/nouveau",
      label: "Nouvelle catégorie doc",
      icon: BookOpen,
      color: "blue",
    },
    {
      href: "/admin/contenu/blog/nouveau",
      label: "Nouvel article blog",
      icon: Newspaper,
      color: "violet",
    },
  ];

  const statCards = [
    {
      title: "Documentation",
      icon: BookOpen,
      color: "blue",
      href: "/admin/contenu/documentation",
      stats: [
        {
          label: "Catégories",
          value: stats?.doc.categories.total || 0,
          icon: FileText,
        },
        {
          label: "Articles",
          value: stats?.doc.articles.total || 0,
          icon: FileText,
        },
        {
          label: "Publiés",
          value: stats?.doc.articles.published || 0,
          icon: Eye,
          color: "green",
        },
        {
          label: "Brouillons",
          value: stats?.doc.articles.draft || 0,
          icon: EyeOff,
          color: "gray",
        },
      ],
    },
    {
      title: "Blog",
      icon: Newspaper,
      color: "violet",
      href: "/admin/contenu/blog",
      stats: [
        {
          label: "Articles",
          value: stats?.blog.posts.total || 0,
          icon: FileText,
        },
        {
          label: "Publiés",
          value: stats?.blog.posts.published || 0,
          icon: Eye,
          color: "green",
        },
        {
          label: "Mis en avant",
          value: stats?.blog.posts.featured || 0,
          icon: Star,
          color: "amber",
        },
        {
          label: "Brouillons",
          value: stats?.blog.posts.draft || 0,
          icon: EyeOff,
          color: "gray",
        },
      ],
    },
  ];

  const blogMeta = [
    {
      label: "Catégories",
      value: stats?.blog.categories || 0,
      icon: FileText,
      color: "purple",
    },
    {
      label: "Auteurs",
      value: stats?.blog.authors || 0,
      icon: Users,
      color: "cyan",
    },
    {
      label: "Tags",
      value: stats?.blog.tags || 0,
      icon: Tag,
      color: "pink",
    },
  ];

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Flex align="center" gap="3" mb="2">
          <Box
            p="3"
            style={{
              background: "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
              borderRadius: 12,
              boxShadow: "0 4px 16px var(--violet-a4)",
            }}
          >
            <Sparkles size={24} style={{ color: "white" }} />
          </Box>
          <Box>
            <Heading size="6">Panneau d'administration</Heading>
            <Text size="2" color="gray">
              Gérez le contenu public de votre plateforme
            </Text>
          </Box>
        </Flex>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Box my="6">
          <Flex gap="3" wrap="wrap">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{ textDecoration: "none" }}
                >
                  <Flex
                    align="center"
                    gap="2"
                    px="4"
                    py="3"
                    style={{
                      background: `var(--${action.color}-a2)`,
                      border: `1px solid var(--${action.color}-a4)`,
                      borderRadius: 9999,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `var(--${action.color}-a3)`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `var(--${action.color}-a2)`;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={16} style={{ color: `var(--${action.color}-9)` }} />
                    <Text size="2" weight="medium" style={{ color: `var(--${action.color}-11)` }}>
                      {action.label}
                    </Text>
                  </Flex>
                </Link>
              );
            })}
          </Flex>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid columns={{ initial: "1", md: "2" }} gap="5" mb="6">
        {statCards.map((card, index) => {
          const CardIcon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            >
              <Link href={card.href} style={{ textDecoration: "none" }}>
                <Box
                  p="5"
                  style={{
                    background: "var(--color-background)",
                    borderRadius: 16,
                    border: "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--${card.color}-a6)`;
                    e.currentTarget.style.boxShadow = `0 8px 24px var(--${card.color}-a3)`;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Flex align="center" justify="between" mb="4">
                    <Flex align="center" gap="3">
                      <Box
                        p="3"
                        style={{
                          background: `var(--${card.color}-a3)`,
                          borderRadius: 10,
                        }}
                      >
                        <CardIcon size={20} style={{ color: `var(--${card.color}-9)` }} />
                      </Box>
                      <Heading size="4">{card.title}</Heading>
                    </Flex>
                    <ArrowRight size={18} style={{ color: "var(--gray-8)" }} />
                  </Flex>

                  <Grid columns="4" gap="3">
                    {card.stats.map((stat) => {
                      const StatIcon = stat.icon;
                      return (
                        <Box key={stat.label}>
                          {isLoading ? (
                            <Skeleton style={{ height: 40 }} />
                          ) : (
                            <>
                              <Flex align="center" gap="1" mb="1">
                                <StatIcon
                                  size={12}
                                  style={{
                                    color: stat.color
                                      ? `var(--${stat.color}-9)`
                                      : "var(--gray-9)",
                                  }}
                                />
                                <Text size="1" color="gray">
                                  {stat.label}
                                </Text>
                              </Flex>
                              <Text
                                size="5"
                                weight="bold"
                                style={{
                                  color: stat.color
                                    ? `var(--${stat.color}-11)`
                                    : "var(--gray-12)",
                                }}
                              >
                                {stat.value}
                              </Text>
                            </>
                          )}
                        </Box>
                      );
                    })}
                  </Grid>
                </Box>
              </Link>
            </motion.div>
          );
        })}
      </Grid>

      {/* Blog Meta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Box mb="4">
          <Heading size="3" mb="3">
            Métadonnées Blog
          </Heading>
          <Grid columns={{ initial: "1", sm: "3" }} gap="4">
            {blogMeta.map((meta) => {
              const MetaIcon = meta.icon;
              return (
                <Box
                  key={meta.label}
                  p="4"
                  style={{
                    background: "var(--color-background)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                  }}
                >
                  <Flex align="center" gap="3">
                    <Box
                      p="2"
                      style={{
                        background: `var(--${meta.color}-a3)`,
                        borderRadius: 8,
                      }}
                    >
                      <MetaIcon size={16} style={{ color: `var(--${meta.color}-9)` }} />
                    </Box>
                    <Box>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        {meta.label}
                      </Text>
                      {isLoading ? (
                        <Skeleton style={{ width: 40, height: 24 }} />
                      ) : (
                        <Text size="4" weight="bold">
                          {meta.value}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </Box>
              );
            })}
          </Grid>
        </Box>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Box
          p="5"
          style={{
            background: "linear-gradient(135deg, var(--violet-a2) 0%, var(--purple-a2) 100%)",
            borderRadius: 16,
            border: "1px solid var(--violet-a4)",
          }}
        >
          <Flex align="center" gap="3" mb="3">
            <TrendingUp size={20} style={{ color: "var(--violet-9)" }} />
            <Heading size="3">Conseils</Heading>
          </Flex>
          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 4 }}>
                Documentation
              </Text>
              <Text size="2" color="gray">
                Organisez votre documentation en catégories claires. Utilisez des slugs
                descriptifs pour améliorer le SEO.
              </Text>
            </Box>
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 4 }}>
                Blog
              </Text>
              <Text size="2" color="gray">
                Mettez un article en avant pour l'afficher en tête de page. Utilisez les
                tags pour faciliter la navigation.
              </Text>
            </Box>
          </Grid>
        </Box>
      </motion.div>
    </Box>
  );
}
