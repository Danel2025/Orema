"use client";

/**
 * Page de création d'un nouvel article de documentation
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
} from "@radix-ui/themes";
import { ArrowLeft, FileText, Sparkle } from "@phosphor-icons/react";
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
} from "@/schemas/content.schema";
import { createDocArticle, getDocCategoryById } from "@/actions/admin/documentation";
import { MarkdownEditor, StatusSelect } from "@/components/admin/content";

interface DocCategory {
  id: string;
  slug: string;
  title: string;
  color: string;
}

export default function NouvelArticlePage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  const router = useRouter();
  const [category, setCategory] = useState<DocCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
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

  const [slug, content, status] = watch(["slug", "content", "status"]);
  const watchedValues = { slug, content, status };

  useEffect(() => {
    async function loadCategory() {
      try {
        const data = await getDocCategoryById(categoryId);
        if (!data) {
          toast.error("Catégorie non trouvée");
          router.push("/admin/contenu/documentation");
          return;
        }
        setCategory(data as DocCategory);
      } catch {
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    }
    loadCategory();
  }, [categoryId, router]);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    if (!watchedValues.slug || watchedValues.slug === generateSlug(watch("title"))) {
      setValue("slug", generateSlug(title));
    }
  };

  // Auto-calculate read time
  const handleContentChange = (content: string) => {
    setValue("content", content);
    setValue("readTime", estimateReadTime(content));
  };

  const onSubmit = async (data: DocArticleFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createDocArticle(data);
      if (result.success) {
        toast.success("Article créé avec succès");
        router.push(`/admin/contenu/documentation/${categoryId}`);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
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

  if (!category) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex align="center" gap="4" mb="6">
          <Link href={`/admin/contenu/documentation/${categoryId}`}>
            <Button variant="ghost" size="2" style={{ cursor: "pointer" }}>
              <ArrowLeft size={18} weight="bold" />
            </Button>
          </Link>
          <Box
            p="2"
            style={{
              background: `var(--${category.color}-a3)`,
              borderRadius: 8,
            }}
          >
            <FileText size={20} weight="duotone" style={{ color: `var(--${category.color}-9)` }} />
          </Box>
          <Box>
            <Heading size="5">Nouvel article</Heading>
            <Text size="2" color="gray">
              Catégorie: {category.title}
            </Text>
          </Box>
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
                      onChange={handleTitleChange}
                    />
                    {errors.title ? (
                      <Text size="1" color="red" mt="1">
                        {errors.title.message}
                      </Text>
                    ) : null}
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
                        <Text size="1" color="gray">
                          /docs/{category.slug}/
                        </Text>
                      </TextField.Slot>
                    </TextField.Root>
                    {errors.slug ? (
                      <Text size="1" color="red" mt="1">
                        {errors.slug.message}
                      </Text>
                    ) : null}
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
                    <Text size="1" color="gray" mt="1">
                      Laissez vide pour utiliser le titre de l'article
                    </Text>
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
                    onChange={(val) => setValue("status", val)}
                    label="Statut de publication"
                    error={errors.status?.message}
                  />

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Temps de lecture
                    </Text>
                    <TextField.Root size="3" placeholder="5 min" {...register("readTime")} />
                    <Text size="1" color="gray" mt="1">
                      Calculé automatiquement
                    </Text>
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
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      background: `var(--${category.color}-9)`,
                      cursor: isSubmitting ? "wait" : "pointer",
                    }}
                  >
                    {isSubmitting ? (
                      <>Création...</>
                    ) : (
                      <>
                        <Sparkle size={18} weight="bold" />
                        Créer l'article
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
                      Annuler
                    </Button>
                  </Link>
                </Flex>
              </Card>

              {/* Preview Info */}
              <Card size="2">
                <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  URL finale
                </Text>
                <Box
                  p="2"
                  style={{
                    background: "var(--gray-a3)",
                    borderRadius: 6,
                    wordBreak: "break-all",
                  }}
                >
                  <Text size="1" style={{ fontFamily: "monospace" }}>
                    /docs/{category.slug}/{watchedValues.slug || "..."}
                  </Text>
                </Box>
              </Card>
            </Flex>
          </motion.div>
        </Flex>
      </form>
    </Box>
  );
}
