"use client";

/**
 * Page de détail d'une catégorie - Liste des articles
 */

import { useEffect, useState, useCallback, use } from "react";
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
  Card,
  Table,
} from "@radix-ui/themes";
import {
  Plus,
  ArrowLeft,
  FileText,
  Eye,
  EyeSlash,
  Trash,
  PencilSimple,
  Clock,
  CalendarBlank,
  BookOpenText,
  DotsThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getDocCategoryById,
  getDocArticles,
  deleteDocArticle,
  updateDocArticleStatus,
} from "@/actions/admin/documentation";
import {
  contentStatusLabels,
  contentStatusColors,
  type ContentStatus,
} from "@/schemas/content.schema";

interface DocArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  read_time: string;
  ordre: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

interface DocCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  status: ContentStatus;
}

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [articles, setArticles] = useState<DocArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [categoryData, articlesData] = await Promise.all([
        getDocCategoryById(categoryId),
        getDocArticles(categoryId),
      ]);

      if (!categoryData) {
        toast.error("Catégorie non trouvée");
        router.push("/admin/contenu/documentation");
        return;
      }

      setCategory(categoryData as DocCategory);
      setArticles(articlesData as DocArticle[]);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocArticle(deleteId);
      if (result.success) {
        toast.success("Article supprimé");
        loadData();
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
      const result = await updateDocArticleStatus(id, status);
      if (result.success) {
        toast.success(`Statut mis à jour: ${contentStatusLabels[status]}`);
        loadData();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton style={{ height: 60, marginBottom: 24 }} />
        <Skeleton style={{ height: 400, borderRadius: 16 }} />
      </Box>
    );
  }

  if (!category) {
    return null;
  }

  const CategoryIcon =
    (LucideIcons as unknown as Record<string, LucideIcon>)[category.icon] || BookOpenText;
  const statusColor = contentStatusColors[category.status];

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex align="center" justify="between" mb="6">
          <Flex align="center" gap="4">
            <Link href="/admin/contenu/documentation">
              <Button variant="ghost" size="2" style={{ cursor: "pointer" }}>
                <ArrowLeft size={18} weight="bold" />
              </Button>
            </Link>

            <Box
              p="3"
              style={{
                background: `var(--${category.color}-9)`,
                borderRadius: 12,
              }}
            >
              <CategoryIcon size={24} style={{ color: "white" }} />
            </Box>

            <Box>
              <Flex align="center" gap="2">
                <Heading size="5">{category.title}</Heading>
                <Badge color={statusColor as "green" | "gray" | "violet"} variant="soft" size="1">
                  {contentStatusLabels[category.status]}
                </Badge>
              </Flex>
              <Text size="2" color="gray">
                {articles.length} article{articles.length !== 1 ? "s" : ""} • /docs/{category.slug}
              </Text>
            </Box>
          </Flex>

          <Flex gap="2">
            <Link href={`/admin/contenu/documentation/${categoryId}/articles/nouveau`}>
              <Button
                size="3"
                style={{
                  background: `var(--${category.color}-9)`,
                  cursor: "pointer",
                }}
              >
                <Plus size={18} weight="bold" />
                Nouvel article
              </Button>
            </Link>
          </Flex>
        </Flex>
      </motion.div>

      {/* Category Info Card */}
      {category.description ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card size="2" mb="6">
            <Text size="2" color="gray">
              {category.description}
            </Text>
          </Card>
        </motion.div>
      ) : null}

      {/* Articles List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {articles.length === 0 ? (
          <Card size="4">
            <Flex direction="column" align="center" justify="center" py="8">
              <FileText size={48} weight="duotone" style={{ color: "var(--gray-8)", marginBottom: 16 }} />
              <Heading size="4" mb="2" color="gray">
                Aucun article
              </Heading>
              <Text size="2" color="gray" mb="4">
                Créez votre premier article dans cette catégorie
              </Text>
              <Link href={`/admin/contenu/documentation/${categoryId}/articles/nouveau`}>
                <Button size="2">
                  <Plus size={16} weight="bold" />
                  Créer un article
                </Button>
              </Link>
            </Flex>
          </Card>
        ) : (
          <Card size="1" style={{ padding: 0, overflow: "hidden" }}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Temps</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Modifié</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {articles.map((article, index) => {
                  const articleStatusColor = contentStatusColors[article.status];

                  return (
                    <Table.Row
                      key={article.id}
                      style={{
                        background: index % 2 === 0 ? "transparent" : "var(--gray-a2)",
                      }}
                    >
                      <Table.Cell>
                        <Box>
                          <Text size="2" weight="medium" style={{ display: "block" }}>
                            {article.title}
                          </Text>
                          <Text size="1" color="gray">
                            /{category.slug}/{article.slug}
                          </Text>
                        </Box>
                      </Table.Cell>

                      <Table.Cell>
                        <Badge
                          color={articleStatusColor as "green" | "gray" | "violet"}
                          variant="soft"
                          size="1"
                        >
                          {contentStatusLabels[article.status]}
                        </Badge>
                      </Table.Cell>

                      <Table.Cell>
                        <Flex align="center" gap="1">
                          <Clock size={12} weight="duotone" style={{ color: "var(--gray-9)" }} />
                          <Text size="1" color="gray">
                            {article.read_time}
                          </Text>
                        </Flex>
                      </Table.Cell>

                      <Table.Cell>
                        <Flex align="center" gap="1">
                          <CalendarBlank size={12} weight="duotone" style={{ color: "var(--gray-9)" }} />
                          <Text size="1" color="gray">
                            {new Date(article.updated_at).toLocaleDateString("fr-FR")}
                          </Text>
                        </Flex>
                      </Table.Cell>

                      <Table.Cell align="right">
                        <Flex gap="1" justify="end">
                          <Link
                            href={`/admin/contenu/documentation/${categoryId}/articles/${article.id}`}
                          >
                            <Button variant="ghost" size="1" style={{ cursor: "pointer" }}>
                              <PencilSimple size={14} weight="bold" />
                            </Button>
                          </Link>

                          {article.status === "DRAFT" ? (
                            <Button
                              variant="ghost"
                              size="1"
                              color="green"
                              onClick={() => handleStatusChange(article.id, "PUBLISHED")}
                              style={{ cursor: "pointer" }}
                            >
                              <Eye size={14} weight="bold" />
                            </Button>
                          ) : article.status === "PUBLISHED" ? (
                            <Button
                              variant="ghost"
                              size="1"
                              color="gray"
                              onClick={() => handleStatusChange(article.id, "DRAFT")}
                              style={{ cursor: "pointer" }}
                            >
                              <EyeSlash size={14} weight="bold" />
                            </Button>
                          ) : null}

                          <Button
                            variant="ghost"
                            size="1"
                            color="red"
                            onClick={() => setDeleteId(article.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <Trash size={14} weight="bold" />
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Card>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Supprimer l'article ?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Cette action est irréversible. L'article sera définitivement supprimé.
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
