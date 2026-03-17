"use client";

/**
 * Page d'édition d'un article de documentation
 */

import { useState, useEffect, use } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  TextField,
  TextArea,
  Button,
  Card,
  Skeleton,
  Badge,
} from "@radix-ui/themes";
import {
  ArrowLeft,
  FileText,
  Save,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  docArticleSchema,
  type DocArticleFormData,
  generateSlug,
  estimateReadTime,
  contentStatusLabels,
  contentStatusColors,
} from "@/schemas/content.schema";
import {
  updateDocArticle,
  getDocArticleById,
  getDocCategoryById,
} from "@/actions/admin/documentation";
import { MarkdownEditor, StatusSelect } from "@/components/admin/content";

interface DocCategory {
  id: string;
  slug: string;
  title: string;
  color: string;
}

interface DocArticle {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  read_time: string;
  ordre: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ categoryId: string; articleId: string }>;
}) {
  const { categoryId, articleId } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [article, setArticle] = useState<DocArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<DocArticleFormData>({
    resolver: zodResolver(docArticleSchema) as never,
    defaultValues: {
      categoryId,
      slug: "",
      title: "",
      description: "",
      content: "",
      readTime: "5 min",
      ordre: 0,
      status: "DRAFT",
      metaTitle: "",
      metaDescription: "",
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    async function loadData() {
      try {
        const [categoryData, articleData] = await Promise.all([
          getDocCategoryById(categoryId),
          getDocArticleById(articleId),
        ]);

        if (!categoryData || !articleData) {
          toast.error("Article ou catégorie non trouvé");
          router.push("/admin/contenu/documentation");
          return;
        }

        setCategory(categoryData as DocCategory);
        setArticle(articleData as DocArticle);

        // Reset form with article data
        reset({
          categoryId: articleData.category_id,
          slug: articleData.slug,
          title: articleData.title,
          description: articleData.description || "",
          content: articleData.content,
          readTime: articleData.read_time || "5 min",
          ordre: articleData.ordre,
          status: articleData.status,
          metaTitle: articleData.meta_title || "",
          metaDescription: articleData.meta_description || "",
        });
      } catch {
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [categoryId, articleId, router, reset]);

  // Auto-calculate read time when content changes
  const handleContentChange = (content: string) => {
    setValue("content", content, { shouldDirty: true });
    setValue("readTime", estimateReadTime(content));
  };

  const onSubmit = async (data: DocArticleFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateDocArticle(articleId, data);
      if (result.success) {
        toast.success("Article mis à jour avec succès");
        // Refresh data
        const updatedArticle = await getDocArticleById(articleId);
        if (updatedArticle) {
          setArticle(updatedArticle as DocArticle);
          reset(data);
        }
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton style={{ height: 60, marginBottom: 24 }} />
        <Skeleton style={{ height: 600, borderRadius: 16 }} />
      </Box>
    );
  }

  if (!category || !article) {
    return null;
  }

  const statusColor = contentStatusColors[watchedValues.status];

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
            <Link href={`/admin/contenu/documentation/${categoryId}`}>
              <Button variant="ghost" size="2" style={{ cursor: "pointer" }}>
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <Box
              p="2"
              style={{
                background: `var(--${category.color}-a3)`,
                borderRadius: 8,
              }}
            >
              <FileText size={20} style={{ color: `var(--${category.color}-9)` }} />
            </Box>
            <Box>
              <Flex align="center" gap="2">
                <Heading size="5">Modifier l'article</Heading>
                <Badge
                  color={statusColor as "green" | "gray" | "violet"}
                  variant="soft"
                  size="1"
                >
                  {contentStatusLabels[watchedValues.status]}
                </Badge>
                {isDirty ? <Badge color="violet" variant="soft" size="1">
                    Non enregistré
                  </Badge> : null}
              </Flex>
              <Text size="2" color="gray">
                {category.title}
              </Text>
            </Box>
          </Flex>

          {article.status === "PUBLISHED" && (
            <Link
              href={`/docs/${category.slug}/${article.slug}`}
              target="_blank"
            >
              <Button variant="soft" size="2" style={{ cursor: "pointer" }}>
                <ExternalLink size={16} />
                Voir sur le site
              </Button>
            </Link>
          )}
        </Flex>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit as never)}>
        <Flex gap="6" direction={{ initial: "column", lg: "row" }}>
          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ flex: 2 }}
          >
            <Flex direction="column" gap="5">
              {/* Title & Slug */}
              <Card size="3">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Titre <Text color="red">*</Text>
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="Ex: Comment créer une commande"
                      {...register("title")}
                    />
                    {errors.title ? <Text size="1" color="red" mt="1">
                        {errors.title.message}
                      </Text> : null}
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Slug (URL) <Text color="red">*</Text>
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="comment-creer-commande"
                      {...register("slug")}
                    >
                      <TextField.Slot side="left">
                        <Text size="1" color="gray">/docs/{category.slug}/</Text>
                      </TextField.Slot>
                    </TextField.Root>
                    {errors.slug ? <Text size="1" color="red" mt="1">
                        {errors.slug.message}
                      </Text> : null}
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Description courte
                    </Text>
                    <TextArea
                      size="3"
                      placeholder="Résumé de l'article pour les aperçus..."
                      rows={2}
                      {...register("description")}
                    />
                  </Box>
                </Flex>
              </Card>

              {/* Content */}
              <Card size="3">
                <MarkdownEditor
                  value={watchedValues.content}
                  onChange={handleContentChange}
                  label="Contenu"
                  required
                  placeholder="Rédigez votre article en markdown..."
                  minHeight={500}
                  error={errors.content?.message}
                />
              </Card>

              {/* SEO */}
              <Card size="3">
                <Heading size="3" mb="4">
                  SEO (optionnel)
                </Heading>
                <Flex direction="column" gap="4">
                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Meta titre
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="Titre pour les moteurs de recherche"
                      {...register("metaTitle")}
                    />
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Meta description
                    </Text>
                    <TextArea
                      size="3"
                      placeholder="Description pour les moteurs de recherche"
                      rows={2}
                      {...register("metaDescription")}
                    />
                  </Box>
                </Flex>
              </Card>
            </Flex>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <Flex direction="column" gap="4" style={{ position: "sticky", top: 100 }}>
              {/* Status & Meta */}
              <Card size="3">
                <Flex direction="column" gap="4">
                  <StatusSelect
                    value={watchedValues.status}
                    onChange={(val) => setValue("status", val, { shouldDirty: true })}
                    label="Statut de publication"
                    error={errors.status?.message}
                  />

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Temps de lecture
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="5 min"
                      {...register("readTime")}
                    />
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Ordre d'affichage
                    </Text>
                    <TextField.Root
                      size="3"
                      type="number"
                      min={0}
                      placeholder="0"
                      {...register("ordre")}
                    />
                  </Box>
                </Flex>
              </Card>

              {/* Actions */}
              <Card size="3">
                <Flex direction="column" gap="3">
                  <Button
                    type="submit"
                    size="3"
                    disabled={isSubmitting || !isDirty}
                    style={{
                      width: "100%",
                      background: `linear-gradient(135deg, var(--${category.color}-9) 0%, var(--${category.color}-10) 100%)`,
                      cursor: isSubmitting ? "wait" : "pointer",
                      opacity: !isDirty ? 0.5 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>Enregistrement...</>
                    ) : (
                      <>
                        <Save size={18} />
                        Enregistrer
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/admin/contenu/documentation/${categoryId}`}
                    style={{ width: "100%" }}
                  >
                    <Button
                      type="button"
                      variant="soft"
                      color="gray"
                      size="3"
                      style={{ width: "100%", cursor: "pointer" }}
                    >
                      Retour à la liste
                    </Button>
                  </Link>
                </Flex>
              </Card>

              {/* Info */}
              <Card size="2">
                <Text size="1" color="gray">
                  Créé le {new Date(article.created_at).toLocaleDateString("fr-FR")}
                </Text>
                <br />
                <Text size="1" color="gray">
                  Modifié le {new Date(article.updated_at).toLocaleDateString("fr-FR")}
                </Text>
              </Card>
            </Flex>
          </motion.div>
        </Flex>
      </form>
    </Box>
  );
}
