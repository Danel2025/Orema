"use client";

/**
 * Page de gestion des articles du blog
 * Liste tous les posts avec filtres
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
  TextField,
  Select,
  Card,
  Table,
  Avatar,
} from "@radix-ui/themes";
import {
  Plus,
  Newspaper,
  MagnifyingGlass,
  Eye,
  EyeSlash,
  Trash,
  PencilSimple,
  Star,
  StarHalf,
  Funnel,
  CalendarBlank,
  User,
  Tag,
  Article,
  CheckCircle,
  PencilLine,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/composed";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getBlogPosts,
  getBlogCategories,
  getBlogAuthors,
  deleteBlogPost,
  updateBlogPostStatus,
  toggleBlogPostFeatured,
} from "@/actions/admin/blog";
import {
  contentStatusLabels,
  contentStatusColors,
  type ContentStatus,
} from "@/schemas/content.schema";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  icon: string;
  color: string;
  status: ContentStatus;
  featured: boolean;
  created_at: string;
  published_at: string | null;
  category: { id: string; name: string; color: string } | null;
  author: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
}

interface BlogCategory {
  id: string;
  name: string;
  color: string;
  postCount: number;
}

interface BlogAuthor {
  id: string;
  name: string;
  postCount: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [postsData, categoriesData, authorsData] = await Promise.all([
        getBlogPosts({
          status: statusFilter !== "all" ? (statusFilter as ContentStatus) : undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
          search: searchQuery || undefined,
        }),
        getBlogCategories(),
        getBlogAuthors(),
      ]);

      setPosts(postsData as BlogPost[]);
      setCategories(categoriesData as BlogCategory[]);
      setAuthors(authorsData as BlogAuthor[]);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteBlogPost(deleteId);
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
      const result = await updateBlogPostStatus(id, status);
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

  const handleToggleFeatured = async (id: string) => {
    try {
      const result = await toggleBlogPostFeatured(id);
      if (result.success) {
        toast.success(result.data?.featured ? "Article mis en avant" : "Article retiré de la une");
        loadData();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    draft: posts.filter((p) => p.status === "DRAFT").length,
    featured: posts.filter((p) => p.featured).length,
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
                background: "var(--violet-9)",
                borderRadius: 12,
              }}
            >
              <Newspaper size={24} weight="duotone" style={{ color: "white" }} />
            </Box>
            <Box>
              <Heading size="5">Blog</Heading>
              <Text size="2" color="gray">
                Gérez les articles, catégories et auteurs
              </Text>
            </Box>
          </Flex>

          <Flex gap="2">
            <Button
              variant="soft"
              size="2"
              onClick={() => setShowFilters(!showFilters)}
              style={{ cursor: "pointer" }}
            >
              <Funnel size={16} weight="bold" />
              Filtres
            </Button>
            <Link href="/admin/contenu/blog/nouveau">
              <Button
                size="3"
                style={{
                  background: "var(--violet-9)",
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

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
          <StatCard
            title="Total"
            value={isLoading ? "..." : stats.total.toString()}
            icon={Article}
            color="violet"
          />
          <StatCard
            title="Publiés"
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
            title="En vedette"
            value={isLoading ? "..." : stats.featured.toString()}
            icon={Star}
            color="amber"
          />
        </Grid>
      </motion.div>

      {/* Filters */}
      {showFilters ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card size="2" mb="4">
            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: 1, minWidth: 200 }}>
                <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
                  Rechercher
                </Text>
                <TextField.Root
                  size="2"
                  placeholder="Titre, contenu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                >
                  <TextField.Slot>
                    <MagnifyingGlass size={14} weight="bold" />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              <Box style={{ minWidth: 150 }}>
                <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
                  Statut
                </Text>
                <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content position="popper">
                    <Select.Item value="all">Tous</Select.Item>
                    <Select.Item value="PUBLISHED">Publiés</Select.Item>
                    <Select.Item value="DRAFT">Brouillons</Select.Item>
                    <Select.Item value="ARCHIVED">Archivés</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box style={{ minWidth: 150 }}>
                <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
                  Catégorie
                </Text>
                <Select.Root value={categoryFilter} onValueChange={setCategoryFilter}>
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content position="popper">
                    <Select.Item value="all">Toutes</Select.Item>
                    {categories.map((cat) => (
                      <Select.Item key={cat.id} value={cat.id}>
                        {cat.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>
          </Card>
        </motion.div>
      ) : null}

      {/* Posts Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {isLoading ? (
          <Skeleton style={{ height: 400, borderRadius: 16 }} />
        ) : posts.length === 0 ? (
          <Card size="4">
            <Flex direction="column" align="center" justify="center" py="8">
              <Newspaper size={48} weight="duotone" style={{ color: "var(--gray-8)", marginBottom: 16 }} />
              <Heading size="4" mb="2" color="gray">
                Aucun article
              </Heading>
              <Text size="2" color="gray" mb="4">
                Créez votre premier article de blog
              </Text>
              <Link href="/admin/contenu/blog/nouveau">
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
                  <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Auteur</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {posts.map((post, index) => {
                  const PostIcon =
                    (LucideIcons as unknown as Record<string, LucideIcon>)[post.icon] || Newspaper;
                  const statusColor = contentStatusColors[post.status];

                  return (
                    <Table.Row
                      key={post.id}
                      style={{
                        background: index % 2 === 0 ? "transparent" : "var(--gray-a2)",
                      }}
                    >
                      <Table.Cell>
                        <Flex align="center" gap="3">
                          <Box
                            p="2"
                            style={{
                              background: `var(--${post.color}-a3)`,
                              borderRadius: 8,
                            }}
                          >
                            <PostIcon size={16} style={{ color: `var(--${post.color}-9)` }} />
                          </Box>
                          <Box>
                            <Flex align="center" gap="2">
                              <Text size="2" weight="medium">
                                {post.title}
                              </Text>
                              {post.featured ? (
                                <Star
                                  size={14}
                                  weight="fill"
                                  style={{ color: "var(--purple-9)" }}
                                />
                              ) : null}
                            </Flex>
                            <Text size="1" color="gray">
                              /{post.slug}
                            </Text>
                          </Box>
                        </Flex>
                      </Table.Cell>

                      <Table.Cell>
                        {post.category ? (
                          <Badge
                            color={post.category.color as "blue" | "violet" | "green"}
                            variant="soft"
                            size="1"
                          >
                            {post.category.name}
                          </Badge>
                        ) : (
                          <Text size="1" color="gray">
                            -
                          </Text>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        {post.author ? (
                          <Flex align="center" gap="2">
                            <User size={12} weight="duotone" style={{ color: "var(--gray-9)" }} />
                            <Text size="1">{post.author.name}</Text>
                          </Flex>
                        ) : (
                          <Text size="1" color="gray">
                            -
                          </Text>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        <Badge
                          color={statusColor as "green" | "gray" | "violet"}
                          variant="soft"
                          size="1"
                        >
                          {contentStatusLabels[post.status]}
                        </Badge>
                      </Table.Cell>

                      <Table.Cell>
                        <Flex align="center" gap="1">
                          <CalendarBlank size={12} weight="duotone" style={{ color: "var(--gray-9)" }} />
                          <Text size="1" color="gray">
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString("fr-FR")
                              : new Date(post.created_at).toLocaleDateString("fr-FR")}
                          </Text>
                        </Flex>
                      </Table.Cell>

                      <Table.Cell align="right">
                        <Flex gap="1" justify="end">
                          <Link href={`/admin/contenu/blog/${post.id}`}>
                            <Button variant="ghost" size="1" style={{ cursor: "pointer" }}>
                              <PencilSimple size={14} weight="bold" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="1"
                            color={post.featured ? "amber" : "gray"}
                            onClick={() => handleToggleFeatured(post.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {post.featured ? <Star size={14} weight="fill" /> : <StarHalf size={14} weight="bold" />}
                          </Button>

                          {post.status === "DRAFT" ? (
                            <Button
                              variant="ghost"
                              size="1"
                              color="green"
                              onClick={() => handleStatusChange(post.id, "PUBLISHED")}
                              style={{ cursor: "pointer" }}
                            >
                              <Eye size={14} weight="bold" />
                            </Button>
                          ) : post.status === "PUBLISHED" ? (
                            <Button
                              variant="ghost"
                              size="1"
                              color="gray"
                              onClick={() => handleStatusChange(post.id, "DRAFT")}
                              style={{ cursor: "pointer" }}
                            >
                              <EyeSlash size={14} weight="bold" />
                            </Button>
                          ) : null}

                          <Button
                            variant="ghost"
                            size="1"
                            color="red"
                            onClick={() => setDeleteId(post.id)}
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

      {/* Quick Stats - Categories & Authors */}
      {!isLoading && (categories.length > 0 || authors.length > 0) && (
        <Grid columns={{ initial: "1", md: "2" }} gap="4" mt="5">
          {/* Catégories */}
          {categories.length > 0 && (
            <Card size="2">
              <Flex align="center" gap="2" mb="3">
                <Tag size={14} weight="duotone" style={{ color: "var(--violet-9)" }} />
                <Text size="2" weight="medium">
                  Catégories
                </Text>
                <Badge variant="soft" size="1" color="gray" ml="auto">
                  {categories.length}
                </Badge>
              </Flex>
              <Flex direction="column" gap="2">
                {categories.map((cat) => (
                  <Flex
                    key={cat.id}
                    align="center"
                    justify="between"
                    p="2"
                    style={{
                      background: `var(--${cat.color}-a2)`,
                      borderRadius: 6,
                      borderLeft: `3px solid var(--${cat.color}-9)`,
                    }}
                  >
                    <Text size="2">{cat.name}</Text>
                    <Badge color={cat.color as "blue" | "violet" | "green"} variant="soft" size="1">
                      {cat.postCount} article{cat.postCount > 1 ? "s" : ""}
                    </Badge>
                  </Flex>
                ))}
              </Flex>
            </Card>
          )}

          {/* Auteurs */}
          {authors.length > 0 && (
            <Card size="2">
              <Flex align="center" gap="2" mb="3">
                <User size={14} weight="duotone" style={{ color: "var(--violet-9)" }} />
                <Text size="2" weight="medium">
                  Auteurs
                </Text>
                <Badge variant="soft" size="1" color="gray" ml="auto">
                  {authors.length}
                </Badge>
              </Flex>
              <Flex direction="column" gap="2">
                {authors.map((author) => (
                  <Flex
                    key={author.id}
                    align="center"
                    justify="between"
                    p="2"
                    style={{
                      background: "var(--gray-a2)",
                      borderRadius: 6,
                    }}
                  >
                    <Flex align="center" gap="2">
                      <Avatar
                        size="1"
                        fallback={author.name.charAt(0)}
                        radius="full"
                        color="violet"
                      />
                      <Text size="2">{author.name}</Text>
                    </Flex>
                    <Badge variant="soft" size="1" color="gray">
                      {author.postCount} article{author.postCount > 1 ? "s" : ""}
                    </Badge>
                  </Flex>
                ))}
              </Flex>
            </Card>
          )}
        </Grid>
      )}

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
