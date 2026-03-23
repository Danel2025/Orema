"use client";

/**
 * Page d'édition d'un article de blog
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
  Select,
  Switch,
  Skeleton,
  Badge,
  ScrollArea,
  Checkbox,
} from "@radix-ui/themes";
import {
  ArrowLeft,
  Newspaper,
  FloppyDisk,
  ArrowSquareOut,
  Plus,
  ImageSquare as ImageIcon,
  Star,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  blogPostSchema,
  type BlogPostFormData,
  contentStatusLabels,
  contentStatusColors,
} from "@/schemas/content.schema";
import {
  updateBlogPost,
  getBlogPostById,
  getBlogCategories,
  getBlogAuthors,
  getBlogTags,
} from "@/actions/admin/blog";
import { MarkdownEditor, IconPicker, ColorPicker, StatusSelect } from "@/components/admin/content";

interface BlogCategory {
  id: string;
  name: string;
  color: string;
}

interface BlogAuthor {
  id: string;
  name: string;
  role: string | null;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category_id: string;
  author_id: string;
  featured_image: string | null;
  icon: string;
  color: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  tags: { id: string; name: string }[];
}

export default function EditBlogPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema) as never,
    defaultValues: {
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      categoryId: "",
      authorId: "",
      featuredImage: "",
      icon: "FileText",
      color: "violet",
      status: "DRAFT",
      featured: false,
      tags: [],
      metaTitle: "",
      metaDescription: "",
    },
  });

  const [content, status, featured, categoryId, authorId, watchedTags, icon, color] = watch([
    "content",
    "status",
    "featured",
    "categoryId",
    "authorId",
    "tags",
    "icon",
    "color",
  ]);
  const watchedValues = { content, status, featured, categoryId, authorId, tags: watchedTags, icon, color };

  useEffect(() => {
    async function loadData() {
      try {
        const [postData, categoriesData, authorsData, tagsData] = await Promise.all([
          getBlogPostById(postId),
          getBlogCategories(),
          getBlogAuthors(),
          getBlogTags(),
        ]);

        if (!postData) {
          toast.error("Article non trouvé");
          router.push("/admin/contenu/blog");
          return;
        }

        setPost(postData as BlogPost);
        setCategories(categoriesData as BlogCategory[]);
        setAuthors(authorsData as BlogAuthor[]);
        setTags(tagsData as BlogTag[]);

        // Reset form with post data
        reset({
          slug: postData.slug,
          title: postData.title,
          excerpt: postData.excerpt || "",
          content: postData.content,
          categoryId: postData.category_id,
          authorId: postData.author_id,
          featuredImage: postData.featured_image || "",
          icon: postData.icon || "FileText",
          color: postData.color || "violet",
          status: postData.status,
          featured: postData.featured,
          tags: postData.tags?.map((t: { id: string }) => t.id) || [],
          metaTitle: postData.meta_title || "",
          metaDescription: postData.meta_description || "",
        });
      } catch {
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [postId, router, reset]);

  const handleContentChange = (content: string) => {
    setValue("content", content, { shouldDirty: true });
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateBlogPost(postId, data);
      if (result.success) {
        toast.success("Article mis à jour avec succès");
        // Refresh data
        const updatedPost = await getBlogPostById(postId);
        if (updatedPost) {
          setPost(updatedPost as BlogPost);
          reset({
            ...data,
            tags: updatedPost.tags?.map((t: { id: string }) => t.id) || [],
          });
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

  if (!post) {
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
            <Link href="/admin/contenu/blog">
              <Button variant="ghost" size="2" style={{ cursor: "pointer" }}>
                <ArrowLeft size={18} weight="bold" />
              </Button>
            </Link>
            <Box
              p="2"
              style={{
                background: `var(--${watchedValues.color}-a3)`,
                borderRadius: 8,
              }}
            >
              <Newspaper size={20} weight="duotone" style={{ color: `var(--${watchedValues.color}-9)` }} />
            </Box>
            <Box>
              <Flex align="center" gap="2">
                <Heading size="5">Modifier l'article</Heading>
                <Badge color={statusColor as "green" | "gray" | "violet"} variant="soft" size="1">
                  {contentStatusLabels[watchedValues.status]}
                </Badge>
                {watchedValues.featured ? (
                  <Badge color="amber" variant="soft" size="1">
                    <Star size={10} weight="fill" style={{ marginRight: 4 }} />
                    Vedette
                  </Badge>
                ) : null}
                {isDirty ? (
                  <Badge color="violet" variant="soft" size="1">
                    Non enregistré
                  </Badge>
                ) : null}
              </Flex>
              <Text size="2" color="gray">
                /blog/{post.slug}
              </Text>
            </Box>
          </Flex>

          {post.status === "PUBLISHED" && (
            <Link href={`/blog/${post.slug}`} target="_blank">
              <Button variant="soft" size="2" style={{ cursor: "pointer" }}>
                <ArrowSquareOut size={16} weight="bold" />
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
                      placeholder="Un titre accrocheur pour votre article"
                      {...register("title")}
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
                      placeholder="mon-article-de-blog"
                      {...register("slug")}
                    >
                      <TextField.Slot side="left">
                        <Text size="1" color="gray">
                          /blog/
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
                      Extrait / Résumé
                    </Text>
                    <TextArea
                      size="3"
                      placeholder="Un court résumé qui apparaîtra dans les aperçus..."
                      rows={3}
                      {...register("excerpt")}
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
              {/* Status & Featured */}
              <Card size="3">
                <Flex direction="column" gap="4">
                  <StatusSelect
                    value={watchedValues.status}
                    onChange={(val) => setValue("status", val, { shouldDirty: true })}
                    label="Statut de publication"
                    error={errors.status?.message}
                  />

                  <Box>
                    <Flex align="center" justify="between">
                      <Text size="2" weight="medium">
                        Article en vedette
                      </Text>
                      <Controller
                        name="featured"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                            }}
                          />
                        )}
                      />
                    </Flex>
                    <Text size="1" color="gray" mt="1">
                      Afficher en premier sur la page blog
                    </Text>
                  </Box>
                </Flex>
              </Card>

              {/* Category & Author */}
              <Card size="3">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Catégorie <Text color="red">*</Text>
                    </Text>
                    <Select.Root
                      value={watchedValues.categoryId}
                      onValueChange={(val) => setValue("categoryId", val, { shouldDirty: true })}
                    >
                      <Select.Trigger placeholder="Sélectionner..." style={{ width: "100%" }} />
                      <Select.Content position="popper">
                        {categories.map((cat) => (
                          <Select.Item key={cat.id} value={cat.id}>
                            {cat.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.categoryId ? (
                      <Text size="1" color="red" mt="1">
                        {errors.categoryId.message}
                      </Text>
                    ) : null}
                  </Box>

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Auteur <Text color="red">*</Text>
                    </Text>
                    <Select.Root
                      value={watchedValues.authorId}
                      onValueChange={(val) => setValue("authorId", val, { shouldDirty: true })}
                    >
                      <Select.Trigger placeholder="Sélectionner..." style={{ width: "100%" }} />
                      <Select.Content position="popper">
                        {authors.map((author) => (
                          <Select.Item key={author.id} value={author.id}>
                            {author.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.authorId ? (
                      <Text size="1" color="red" mt="1">
                        {errors.authorId.message}
                      </Text>
                    ) : null}
                  </Box>
                </Flex>
              </Card>

              {/* Tags */}
              <Card size="3">
                <Text size="2" weight="medium" mb="3" style={{ display: "block" }}>
                  Tags
                </Text>
                <ScrollArea style={{ maxHeight: 150 }}>
                  <Flex direction="column" gap="2">
                    {tags.map((tag) => (
                      <Flex key={tag.id} align="center" gap="2">
                        <Checkbox
                          checked={watchedValues.tags.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            const newTags = checked
                              ? [...watchedValues.tags, tag.id]
                              : watchedValues.tags.filter((t) => t !== tag.id);
                            setValue("tags", newTags, { shouldDirty: true });
                          }}
                        />
                        <Text size="2">{tag.name}</Text>
                      </Flex>
                    ))}
                    {tags.length === 0 && (
                      <Text size="1" color="gray">
                        Aucun tag disponible
                      </Text>
                    )}
                  </Flex>
                </ScrollArea>
              </Card>

              {/* Visual */}
              <Card size="3">
                <Heading size="3" mb="4">
                  Apparence
                </Heading>
                <Flex direction="column" gap="4">
                  <IconPicker
                    value={watchedValues.icon}
                    onChange={(val) => setValue("icon", val, { shouldDirty: true })}
                    label="Icône"
                    type="blog"
                  />

                  <ColorPicker
                    value={watchedValues.color}
                    onChange={(val) => setValue("color", val, { shouldDirty: true })}
                    label="Couleur"
                  />

                  <Box>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Image de couverture (URL)
                    </Text>
                    <TextField.Root
                      size="2"
                      placeholder="https://..."
                      {...register("featuredImage")}
                    >
                      <TextField.Slot>
                        <ImageIcon size={14} weight="duotone" />
                      </TextField.Slot>
                    </TextField.Root>
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
                      background: "var(--violet-9)",
                      cursor: isSubmitting ? "wait" : "pointer",
                      opacity: !isDirty ? 0.5 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>Enregistrement...</>
                    ) : (
                      <>
                        <FloppyDisk size={18} weight="bold" />
                        Enregistrer
                      </>
                    )}
                  </Button>

                  <Link href="/admin/contenu/blog" style={{ width: "100%" }}>
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
                  Créé le {new Date(post.created_at).toLocaleDateString("fr-FR")}
                </Text>
                <br />
                <Text size="1" color="gray">
                  Modifié le {new Date(post.updated_at).toLocaleDateString("fr-FR")}
                </Text>
              </Card>
            </Flex>
          </motion.div>
        </Flex>
      </form>
    </Box>
  );
}
