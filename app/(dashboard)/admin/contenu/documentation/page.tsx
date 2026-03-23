"use client";

/**
 * Page de gestion des catégories de documentation
 * Liste toutes les catégories avec leurs articles
 */

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Button,
  Skeleton,
  AlertDialog,
} from "@radix-ui/themes";
import {
  Plus,
  BookOpenText,
  FileText,
  Eye,
  EyeSlash,
  Archive,
  Trash,
  PencilSimple,
  DotsThreeVertical,
  ArrowRight,
  DotsSixVertical,
  FolderOpen,
  CheckCircle,
  PencilLine,
  Article,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/composed";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getDocCategories,
  deleteDocCategory,
  updateDocCategoryStatus,
} from "@/actions/admin/documentation";
import {
  contentStatusLabels,
  contentStatusColors,
  type ContentStatus,
} from "@/schemas/content.schema";

interface DocCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  ordre: number;
  status: ContentStatus;
  articleCount: number;
  publishedArticleCount: number;
  created_at: string;
}

export default function DocumentationPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getDocCategories();
      setCategories(data as DocCategory[]);
    } catch (error) {
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocCategory(deleteId);
      if (result.success) {
        toast.success("Catégorie supprimée");
        loadCategories();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    try {
      const result = await updateDocCategoryStatus(id, status);
      if (result.success) {
        toast.success(`Statut mis à jour: ${contentStatusLabels[status]}`);
        loadCategories();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const stats = {
    total: categories.length,
    published: categories.filter((c) => c.status === "PUBLISHED").length,
    draft: categories.filter((c) => c.status === "DRAFT").length,
    articles: categories.reduce((acc, c) => acc + c.articleCount, 0),
  };

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex align="center" justify="between" mb="6">
          <Flex align="center" gap="3">
            <Box
              p="3"
              style={{
                background: "var(--blue-9)",
                borderRadius: 12,
              }}
            >
              <BookOpenText size={24} weight="duotone" style={{ color: "white" }} />
            </Box>
            <Box>
              <Heading size="5">Documentation</Heading>
              <Text size="2" color="gray">
                Gérez les catégories et articles du centre d'aide
              </Text>
            </Box>
          </Flex>

          <Link href="/admin/contenu/documentation/nouveau">
            <Button
              size="3"
              style={{
                background: "var(--blue-9)",
                cursor: "pointer",
              }}
            >
              <Plus size={18} weight="bold" />
              Nouvelle catégorie
            </Button>
          </Link>
        </Flex>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
          <StatCard
            title="Catégories"
            value={isLoading ? "..." : stats.total.toString()}
            icon={FolderOpen}
            color="blue"
          />
          <StatCard
            title="Publiées"
            value={isLoading ? "..." : stats.published.toString()}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Brouillons"
            value={isLoading ? "..." : stats.draft.toString()}
            icon={PencilLine}
          />
          <StatCard
            title="Articles total"
            value={isLoading ? "..." : stats.articles.toString()}
            icon={Article}
            color="violet"
          />
        </Grid>
      </motion.div>

      {/* Categories List */}
      {isLoading ? (
        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={{ height: 200, borderRadius: 16 }} />
          ))}
        </Grid>
      ) : categories.length === 0 ? (
        <Box
          p="8"
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
            textAlign: "center",
          }}
        >
          <BookOpenText size={48} weight="duotone" style={{ color: "var(--gray-8)", marginBottom: 16 }} />
          <Heading size="4" mb="2" color="gray">
            Aucune catégorie
          </Heading>
          <Text size="2" color="gray" mb="4" style={{ display: "block" }}>
            Créez votre première catégorie de documentation
          </Text>
          <Link href="/admin/contenu/documentation/nouveau">
            <Button size="2">
              <Plus size={16} weight="bold" />
              Créer une catégorie
            </Button>
          </Link>
        </Box>
      ) : (
        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          {categories.map((category, index) => {
            const Icon =
              (LucideIcons as unknown as Record<string, LucideIcon>)[category.icon] || BookOpenText;
            const statusColor = contentStatusColors[category.status];

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Box
                  style={{
                    background: "var(--color-background)",
                    borderRadius: 12,
                    border: "1px solid var(--gray-a4)",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <Box
                    p="4"
                    style={{
                      background: `var(--${category.color}-a2)`,
                      borderBottom: `1px solid var(--${category.color}-a4)`,
                    }}
                  >
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="3">
                        <Box
                          p="3"
                          style={{
                            background: `var(--${category.color}-9)`,
                            borderRadius: 10,
                          }}
                        >
                          <Icon size={20} style={{ color: "white" }} />
                        </Box>
                        <Box>
                          <Heading size="3">{category.title}</Heading>
                          <Text size="1" color="gray">
                            /{category.slug}
                          </Text>
                        </Box>
                      </Flex>

                      <Badge
                        color={statusColor as "green" | "gray" | "violet"}
                        variant="soft"
                        size="1"
                      >
                        {contentStatusLabels[category.status]}
                      </Badge>
                    </Flex>
                  </Box>

                  {/* Content */}
                  <Box p="4">
                    {category.description ? (
                      <Text
                        size="2"
                        color="gray"
                        mb="3"
                        style={{
                          display: "block",
                          lineHeight: 1.5,
                        }}
                      >
                        {category.description}
                      </Text>
                    ) : null}

                    <Flex align="center" gap="4" mb="4">
                      <Flex align="center" gap="1">
                        <FileText size={14} weight="duotone" style={{ color: "var(--gray-9)" }} />
                        <Text size="2" color="gray">
                          {category.articleCount} article{category.articleCount !== 1 ? "s" : ""}
                        </Text>
                      </Flex>
                      <Text size="2" color="gray">
                        •
                      </Text>
                      <Flex align="center" gap="1">
                        <Eye size={14} weight="duotone" style={{ color: "var(--green-9)" }} />
                        <Text size="2" color="gray">
                          {category.publishedArticleCount} publié
                          {category.publishedArticleCount !== 1 ? "s" : ""}
                        </Text>
                      </Flex>
                    </Flex>

                    {/* Actions */}
                    <Flex gap="2">
                      <Link
                        href={`/admin/contenu/documentation/${category.id}`}
                        style={{ flex: 1, textDecoration: "none" }}
                      >
                        <Button
                          variant="soft"
                          color={category.color as "blue" | "violet" | "green"}
                          style={{ width: "100%", cursor: "pointer" }}
                        >
                          <Eye size={14} weight="bold" />
                          Voir les articles
                        </Button>
                      </Link>

                      {/* Quick Status Actions */}
                      {category.status === "DRAFT" ? (
                        <Button
                          variant="soft"
                          color="green"
                          onClick={() => handleStatusChange(category.id, "PUBLISHED")}
                          style={{ cursor: "pointer" }}
                        >
                          <Eye size={14} weight="bold" />
                        </Button>
                      ) : category.status === "PUBLISHED" ? (
                        <Button
                          variant="soft"
                          color="gray"
                          onClick={() => handleStatusChange(category.id, "DRAFT")}
                          style={{ cursor: "pointer" }}
                        >
                          <EyeSlash size={14} weight="bold" />
                        </Button>
                      ) : null}

                      <Button
                        variant="soft"
                        color="red"
                        onClick={() => setDeleteId(category.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <Trash size={14} weight="bold" />
                      </Button>
                    </Flex>
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Supprimer la catégorie ?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Cette action est irréversible. Tous les articles de cette catégorie seront également
            supprimés.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="solid"
              color="red"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                await handleDelete();
              }}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
