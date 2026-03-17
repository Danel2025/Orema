"use client";

/**
 * Page de création d'un nouvel article de blog
 */

import { useState, useEffect } from "react";
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
  Sparkles,
  Plus,
  User,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  blogPostSchema,
  type BlogPostFormData,
  generateSlug,
  estimateReadTime,
} from "@/schemas/content.schema";
import {
  createBlogPost,
  getBlogCategories,
  getBlogAuthors,
  getBlogTags,
  createBlogCategory,
  createBlogAuthor,
  createBlogTag,
} from "@/actions/admin/blog";
import {
  MarkdownEditor,
  IconPicker,
  ColorPicker,
  StatusSelect,
} from "@/components/admin/content";

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

export default function NouveauBlogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick add modals
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddAuthor, setShowAddAuthor] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
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

  const watchedValues = watch();

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, authorsData, tagsData] = await Promise.all([
          getBlogCategories(),
          getBlogAuthors(),
          getBlogTags(),
        ]);

        setCategories(categoriesData as BlogCategory[]);
        setAuthors(authorsData as BlogAuthor[]);
        setTags(tagsData as BlogTag[]);
      } catch {
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    if (!watchedValues.slug || watchedValues.slug === generateSlug(watch("title"))) {
      setValue("slug", generateSlug(title));
    }
  };

  // Auto-calculate excerpt from content if empty
  const handleContentChange = (content: string) => {
    setValue("content", content);
  };

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const result = await createBlogCategory({
        name: newCategoryName,
        slug: generateSlug(newCategoryName),
        color: "gray",
      });

      if (result.success && result.data) {
        setCategories([...categories, result.data as BlogCategory]);
        setValue("categoryId", result.data.id);
        toast.success("Catégorie créée");
        setNewCategoryName("");
        setShowAddCategory(false);
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const handleQuickAddAuthor = async () => {
    if (!newAuthorName.trim()) return;

    try {
      const result = await createBlogAuthor({
        name: newAuthorName,
        role: null,
        avatarUrl: null,
        bio: null,
      });

      if (result.success && result.data) {
        setAuthors([...authors, result.data as BlogAuthor]);
        setValue("authorId", result.data.id);
        toast.success("Auteur créé");
        setNewAuthorName("");
        setShowAddAuthor(false);
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const handleQuickAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const result = await createBlogTag({ name: newTagName });

      if (result.success && result.data) {
        setTags([...tags, result.data as BlogTag]);
        setValue("tags", [...watchedValues.tags, result.data.id]);
        toast.success("Tag créé");
        setNewTagName("");
        setShowAddTag(false);
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createBlogPost(data);
      if (result.success) {
        toast.success("Article créé avec succès");
        router.push("/admin/contenu/blog");
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

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex align="center" gap="4" mb="6">
          <Link href="/admin/contenu/blog">
            <Button variant="ghost" size="2" style={{ cursor: "pointer" }}>
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <Box
            p="2"
            style={{
              background: "var(--violet-a3)",
              borderRadius: 8,
            }}
          >
            <Newspaper size={20} style={{ color: "var(--violet-9)" }} />
          </Box>
          <Box>
            <Heading size="5">Nouvel article</Heading>
            <Text size="2" color="gray">
              Créez un nouvel article de blog
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
                      placeholder="Un titre accrocheur pour votre article"
                      {...register("title")}
                      onChange={handleTitleChange}
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
                      placeholder="mon-article-de-blog"
                      {...register("slug")}
                    >
                      <TextField.Slot side="left">
                        <Text size="1" color="gray">/blog/</Text>
                      </TextField.Slot>
                    </TextField.Root>
                    {errors.slug ? <Text size="1" color="red" mt="1">
                        {errors.slug.message}
                      </Text> : null}
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
                    onChange={(val) => setValue("status", val)}
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
                            onCheckedChange={field.onChange}
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
                  {/* Category */}
                  <Box>
                    <Flex align="center" justify="between" mb="2">
                      <Text size="2" weight="medium">
                        Catégorie <Text color="red">*</Text>
                      </Text>
                      <Button
                        type="button"
                        variant="ghost"
                        size="1"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        style={{ cursor: "pointer" }}
                      >
                        <Plus size={14} />
                      </Button>
                    </Flex>
                    {showAddCategory ? <Flex gap="2" mb="2">
                        <TextField.Root
                          size="2"
                          placeholder="Nouvelle catégorie"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="button"
                          size="2"
                          onClick={handleQuickAddCategory}
                          style={{ cursor: "pointer" }}
                        >
                          Ajouter
                        </Button>
                      </Flex> : null}
                    <Select.Root
                      value={watchedValues.categoryId}
                      onValueChange={(val) => setValue("categoryId", val)}
                    >
                      <Select.Trigger
                        placeholder="Sélectionner..."
                        style={{ width: "100%" }}
                      />
                      <Select.Content>
                        {categories.map((cat) => (
                          <Select.Item key={cat.id} value={cat.id}>
                            {cat.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.categoryId ? <Text size="1" color="red" mt="1">
                        {errors.categoryId.message}
                      </Text> : null}
                  </Box>

                  {/* Author */}
                  <Box>
                    <Flex align="center" justify="between" mb="2">
                      <Text size="2" weight="medium">
                        Auteur <Text color="red">*</Text>
                      </Text>
                      <Button
                        type="button"
                        variant="ghost"
                        size="1"
                        onClick={() => setShowAddAuthor(!showAddAuthor)}
                        style={{ cursor: "pointer" }}
                      >
                        <Plus size={14} />
                      </Button>
                    </Flex>
                    {showAddAuthor ? <Flex gap="2" mb="2">
                        <TextField.Root
                          size="2"
                          placeholder="Nom de l'auteur"
                          value={newAuthorName}
                          onChange={(e) => setNewAuthorName(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="button"
                          size="2"
                          onClick={handleQuickAddAuthor}
                          style={{ cursor: "pointer" }}
                        >
                          Ajouter
                        </Button>
                      </Flex> : null}
                    <Select.Root
                      value={watchedValues.authorId}
                      onValueChange={(val) => setValue("authorId", val)}
                    >
                      <Select.Trigger
                        placeholder="Sélectionner..."
                        style={{ width: "100%" }}
                      />
                      <Select.Content>
                        {authors.map((author) => (
                          <Select.Item key={author.id} value={author.id}>
                            {author.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.authorId ? <Text size="1" color="red" mt="1">
                        {errors.authorId.message}
                      </Text> : null}
                  </Box>
                </Flex>
              </Card>

              {/* Tags */}
              <Card size="3">
                <Flex align="center" justify="between" mb="3">
                  <Text size="2" weight="medium">
                    Tags
                  </Text>
                  <Button
                    type="button"
                    variant="ghost"
                    size="1"
                    onClick={() => setShowAddTag(!showAddTag)}
                    style={{ cursor: "pointer" }}
                  >
                    <Plus size={14} />
                  </Button>
                </Flex>
                {showAddTag ? <Flex gap="2" mb="3">
                    <TextField.Root
                      size="2"
                      placeholder="Nouveau tag"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="button"
                      size="2"
                      onClick={handleQuickAddTag}
                      style={{ cursor: "pointer" }}
                    >
                      Ajouter
                    </Button>
                  </Flex> : null}
                <ScrollArea style={{ maxHeight: 150 }}>
                  <Flex direction="column" gap="2">
                    {tags.map((tag) => (
                      <Flex key={tag.id} align="center" gap="2">
                        <Checkbox
                          checked={watchedValues.tags.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue("tags", [...watchedValues.tags, tag.id]);
                            } else {
                              setValue(
                                "tags",
                                watchedValues.tags.filter((t) => t !== tag.id)
                              );
                            }
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
                    onChange={(val) => setValue("icon", val)}
                    label="Icône"
                    type="blog"
                  />

                  <ColorPicker
                    value={watchedValues.color}
                    onChange={(val) => setValue("color", val)}
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
                        <ImageIcon size={14} />
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
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      background: "linear-gradient(135deg, var(--violet-9) 0%, var(--purple-9) 100%)",
                      cursor: isSubmitting ? "wait" : "pointer",
                    }}
                  >
                    {isSubmitting ? (
                      <>Création...</>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Créer l'article
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
                      Annuler
                    </Button>
                  </Link>
                </Flex>
              </Card>
            </Flex>
          </motion.div>
        </Flex>
      </form>
    </Box>
  );
}
