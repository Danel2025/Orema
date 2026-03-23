"use client";

/**
 * Page d'accueil Admin - Vue d'ensemble
 * Statistiques et accès rapide à la gestion de contenu
 */

import { useEffect, useState } from "react";
import { Box, Flex, Grid, Heading, Text, Skeleton } from "@radix-ui/themes";
import {
  BookOpenText,
  FileText,
  Newspaper,
  Users,
  Tag,
  TrendUp,
  Eye,
  EyeSlash,
  Star,
  ArrowRight,
} from "@phosphor-icons/react";
import Image from "next/image";
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
        const [docStats, blogStats] = await Promise.all([getDocStats(), getBlogStats()]);
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
      icon: BookOpenText,
    },
    {
      href: "/admin/contenu/blog/nouveau",
      label: "Nouvel article blog",
      icon: Newspaper,
    },
  ];

  const statCards = [
    {
      title: "Documentation",
      icon: BookOpenText,
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
          accent: true,
        },
        {
          label: "Brouillons",
          value: stats?.doc.articles.draft || 0,
          icon: EyeSlash,
          muted: true,
        },
      ],
    },
    {
      title: "Blog",
      icon: Newspaper,
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
          accent: true,
        },
        {
          label: "Mis en avant",
          value: stats?.blog.posts.featured || 0,
          icon: Star,
          accent: true,
        },
        {
          label: "Brouillons",
          value: stats?.blog.posts.draft || 0,
          icon: EyeSlash,
          muted: true,
        },
      ],
    },
  ];

  const blogMeta = [
    {
      label: "Catégories",
      value: stats?.blog.categories || 0,
      icon: FileText,
    },
    {
      label: "Auteurs",
      value: stats?.blog.authors || 0,
      icon: Users,
    },
    {
      label: "Tags",
      value: stats?.blog.tags || 0,
      icon: Tag,
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
            style={{
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              width: 44,
              height: 44,
            }}
          >
            <Image
              src="/images/logos/ic-lg.webp"
              alt="Oréma N+"
              width={44}
              height={44}
              style={{ display: "block" }}
            />
          </Box>
          <Box>
            <Heading size="6" weight="bold">
              Panneau d&apos;administration
            </Heading>
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
                <Link key={action.href} href={action.href} style={{ textDecoration: "none" }}>
                  <Flex
                    align="center"
                    gap="2"
                    px="4"
                    py="2"
                    style={{
                      background: "var(--accent-a2)",
                      border: "1px solid var(--accent-a4)",
                      borderRadius: 9999,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-a3)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--accent-a2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={16} weight="bold" style={{ color: "var(--accent-9)" }} />
                    <Text size="2" weight="medium" style={{ color: "var(--accent-11)" }}>
                      {action.label}
                    </Text>
                  </Flex>
                </Link>
              );
            })}
          </Flex>
        </Box>
      </motion.div>

      {/* Stat Cards */}
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
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-a6)";
                    e.currentTarget.style.boxShadow = "0 4px 16px var(--accent-a3)";
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
                          background: "var(--accent-a3)",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CardIcon size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
                      </Box>
                      <Heading size="4">{card.title}</Heading>
                    </Flex>
                    <ArrowRight size={18} weight="bold" style={{ color: "var(--gray-8)" }} />
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
                                  weight="bold"
                                  style={{
                                    color: stat.accent
                                      ? "var(--accent-9)"
                                      : stat.muted
                                        ? "var(--gray-8)"
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
                                  color: stat.accent
                                    ? "var(--accent-11)"
                                    : stat.muted
                                      ? "var(--gray-11)"
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
        <Box mb="6">
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
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-a5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--gray-a4)";
                  }}
                >
                  <Flex align="center" gap="3">
                    <Box
                      p="2"
                      style={{
                        background: "var(--accent-a3)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MetaIcon size={16} weight="duotone" style={{ color: "var(--accent-9)" }} />
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

      {/* Conseils */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Box
          p="5"
          style={{
            background: "var(--accent-a2)",
            borderRadius: 12,
            border: "1px solid var(--accent-a4)",
          }}
        >
          <Flex align="center" gap="2" mb="3">
            <TrendUp size={20} weight="bold" style={{ color: "var(--accent-9)" }} />
            <Heading size="3">Conseils</Heading>
          </Flex>
          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 4 }}>
                Documentation
              </Text>
              <Text size="2" color="gray">
                Organisez votre documentation en catégories claires. Utilisez des slugs descriptifs
                pour améliorer le SEO.
              </Text>
            </Box>
            <Box>
              <Text size="2" weight="medium" style={{ display: "block", marginBottom: 4 }}>
                Blog
              </Text>
              <Text size="2" color="gray">
                Mettez un article en avant pour l&apos;afficher en tête de page. Utilisez les tags
                pour faciliter la navigation.
              </Text>
            </Box>
          </Grid>
        </Box>
      </motion.div>
    </Box>
  );
}
