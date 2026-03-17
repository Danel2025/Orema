"use server";

/**
 * Server Actions pour la gestion du blog
 * SUPER_ADMIN uniquement
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth, type AuthUser } from "@/lib/auth/supabase";
import {
  blogPostSchema,
  blogCategorySchema,
  blogAuthorSchema,
  blogTagSchema,
  type BlogPostFormData,
  type BlogCategoryFormData,
  type BlogAuthorFormData,
  type BlogTagFormData,
  type BlogFilterData,
  type ContentStatus,
  generateSlug,
  estimateReadTime,
} from "@/schemas/content.schema";

// ===========================================
// HELPERS
// ===========================================

/**
 * Vérifie que l'utilisateur est SUPER_ADMIN
 */
async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Accès refusé: SUPER_ADMIN requis");
  }
  return user;
}

/**
 * Revalide les paths publics et admin du blog
 */
function revalidateBlogPaths() {
  revalidatePath("/blog");
  revalidatePath("/admin/contenu/blog");
}

// ===========================================
// POSTS - LECTURE (PUBLIC)
// ===========================================

/**
 * Récupère tous les posts publiés (public)
 */
export async function getPublishedBlogPosts(options?: {
  categoryId?: string;
  limit?: number;
  offset?: number;
  featured?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(id, slug, name, color),
      blog_authors(id, name, role, avatar_url),
      blog_post_tags(blog_tags(id, name, slug))
    `)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.featured !== undefined) {
    query = query.eq("featured", options.featured);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur getPublishedBlogPosts:", error);
    return [];
  }

  // Transformer les tags
  return data.map((post) => ({
    ...post,
    tags: post.blog_post_tags?.map((pt: { blog_tags: { id: string; name: string; slug: string } }) => pt.blog_tags) || [],
    category: post.blog_categories,
    author: post.blog_authors,
  }));
}

/**
 * Récupère un post par son slug (public)
 */
export async function getPublishedBlogPostBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(id, slug, name, color),
      blog_authors(id, name, role, avatar_url, bio),
      blog_post_tags(blog_tags(id, name, slug))
    `)
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .single();

  if (error) {
    return null;
  }

  return {
    ...data,
    tags: data.blog_post_tags?.map((pt: { blog_tags: { id: string; name: string; slug: string } }) => pt.blog_tags) || [],
    category: data.blog_categories,
    author: data.blog_authors,
  };
}

/**
 * Récupère le post mis en avant (public)
 */
export async function getFeaturedBlogPost() {
  const posts = await getPublishedBlogPosts({ featured: true, limit: 1 });
  return posts[0] || null;
}

/**
 * Récupère les posts liés (public)
 */
export async function getRelatedBlogPosts(postId: string, categoryId: string, limit = 3) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("blog_posts")
    .select(`
      id, slug, title, excerpt, icon, color, published_at,
      blog_categories(slug, name, color),
      blog_authors(name)
    `)
    .eq("status", "PUBLISHED")
    .eq("category_id", categoryId)
    .neq("id", postId)
    .order("published_at", { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Récupère toutes les catégories de blog (public)
 */
export async function getPublishedBlogCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_categories")
    .select("id, slug, name, color")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur getPublishedBlogCategories:", error);
    return [];
  }

  return data;
}

// ===========================================
// POSTS - ADMIN (SUPER_ADMIN)
// ===========================================

/**
 * Récupère tous les posts (admin)
 */
export async function getBlogPosts(filters?: BlogFilterData) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(id, slug, name, color),
      blog_authors(id, name),
      blog_post_tags(blog_tags(id, name, slug)),
      created_by_user:utilisateurs!blog_posts_created_by_fkey(nom, prenom)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.authorId) {
    query = query.eq("author_id", filters.authorId);
  }

  if (filters?.featured !== undefined) {
    query = query.eq("featured", filters.featured);
  }

  if (filters?.search) {
    const sanitized = filters.search.replace(/[%_\\'"(),.*]/g, '');
    query = query.or(`title.ilike.%${sanitized}%,excerpt.ilike.%${sanitized}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur getBlogPosts:", error);
    return [];
  }

  return data.map((post) => ({
    ...post,
    tags: post.blog_post_tags?.map((pt: { blog_tags: { id: string; name: string; slug: string } }) => pt.blog_tags) || [],
    category: post.blog_categories,
    author: post.blog_authors,
  }));
}

/**
 * Récupère un post par son ID (admin)
 */
export async function getBlogPostById(id: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      *,
      blog_categories(id, slug, name, color),
      blog_authors(id, name, role, avatar_url),
      blog_post_tags(blog_tags(id, name, slug))
    `)
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return {
    ...data,
    tags: data.blog_post_tags?.map((pt: { blog_tags: { id: string; name: string; slug: string } }) => pt.blog_tags) || [],
    category: data.blog_categories,
    author: data.blog_authors,
  };
}

/**
 * Crée un nouveau post
 */
export async function createBlogPost(data: BlogPostFormData) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    // Validation
    const validationResult = blogPostSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier l'unicité du slug
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", validatedData.slug)
      .single();

    if (existing) {
      return {
        success: false,
        error: "Un article avec ce slug existe déjà",
      };
    }

    // Créer le post
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        slug: validatedData.slug,
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        category_id: validatedData.categoryId,
        author_id: validatedData.authorId,
        featured_image: validatedData.featuredImage,
        icon: validatedData.icon,
        color: validatedData.color,
        status: validatedData.status,
        featured: validatedData.featured,
        meta_title: validatedData.metaTitle,
        meta_description: validatedData.metaDescription,
        created_by: user.userId,
        updated_by: user.userId,
        published_at: validatedData.status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur createBlogPost:", error);
      return {
        success: false,
        error: "Erreur lors de la création de l'article",
      };
    }

    // Ajouter les tags
    if (validatedData.tags.length > 0) {
      const tagInserts = validatedData.tags.map((tagId) => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      await supabase.from("blog_post_tags").insert(tagInserts);
    }

    revalidateBlogPaths();

    return {
      success: true,
      data: post,
    };
  } catch (error) {
    console.error("Erreur createBlogPost:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Met à jour un post
 */
export async function updateBlogPost(id: string, data: BlogPostFormData) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    // Validation
    const validationResult = blogPostSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier que le post existe
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id, status, published_at")
      .eq("id", id)
      .single();

    if (!existing) {
      return {
        success: false,
        error: "Article non trouvé",
      };
    }

    // Vérifier l'unicité du slug
    const { data: duplicate } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", validatedData.slug)
      .neq("id", id)
      .single();

    if (duplicate) {
      return {
        success: false,
        error: "Un article avec ce slug existe déjà",
      };
    }

    // Déterminer published_at
    let publishedAt = existing.published_at;
    if (validatedData.status === "PUBLISHED" && !existing.published_at) {
      publishedAt = new Date().toISOString();
    } else if (validatedData.status !== "PUBLISHED") {
      publishedAt = null;
    }

    // Mettre à jour le post
    const { data: post, error } = await supabase
      .from("blog_posts")
      .update({
        slug: validatedData.slug,
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        category_id: validatedData.categoryId,
        author_id: validatedData.authorId,
        featured_image: validatedData.featuredImage,
        icon: validatedData.icon,
        color: validatedData.color,
        status: validatedData.status,
        featured: validatedData.featured,
        meta_title: validatedData.metaTitle,
        meta_description: validatedData.metaDescription,
        updated_by: user.userId,
        published_at: publishedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur updateBlogPost:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour de l'article",
      };
    }

    // Mettre à jour les tags
    await supabase.from("blog_post_tags").delete().eq("post_id", id);

    if (validatedData.tags.length > 0) {
      const tagInserts = validatedData.tags.map((tagId) => ({
        post_id: id,
        tag_id: tagId,
      }));

      await supabase.from("blog_post_tags").insert(tagInserts);
    }

    revalidateBlogPaths();

    return {
      success: true,
      data: post,
    };
  } catch (error) {
    console.error("Erreur updateBlogPost:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime un post
 */
export async function deleteBlogPost(id: string) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la suppression de l'article",
      };
    }

    revalidateBlogPaths();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Change le statut d'un post
 */
export async function updateBlogPostStatus(id: string, status: ContentStatus) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .single();

    let publishedAt = existing?.published_at;
    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date().toISOString();
    } else if (status !== "PUBLISHED") {
      publishedAt = null;
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update({
        status,
        updated_by: user.userId,
        published_at: publishedAt,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour du statut",
      };
    }

    revalidateBlogPaths();

    return {
      success: true,
      data: post,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Bascule le statut "featured" d'un post
 */
export async function toggleBlogPostFeatured(id: string) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("featured")
      .eq("id", id)
      .single();

    if (!existing) {
      return {
        success: false,
        error: "Article non trouvé",
      };
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update({
        featured: !existing.featured,
        updated_by: user.userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour",
      };
    }

    revalidateBlogPaths();

    return {
      success: true,
      data: post,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ===========================================
// CATEGORIES
// ===========================================

/**
 * Récupère toutes les catégories de blog
 */
export async function getBlogCategories() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("blog_categories")
    .select(`
      *,
      blog_posts(id)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur getBlogCategories:", error);
    return [];
  }

  return data.map((cat) => ({
    ...cat,
    postCount: cat.blog_posts?.length || 0,
  }));
}

/**
 * Crée une catégorie de blog
 */
export async function createBlogCategory(data: BlogCategoryFormData) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const validationResult = blogCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Données invalides",
      };
    }

    const { data: category, error } = await supabase
      .from("blog_categories")
      .insert(validationResult.data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "Une catégorie avec ce slug existe déjà",
        };
      }
      return {
        success: false,
        error: "Erreur lors de la création",
      };
    }

    revalidateBlogPaths();

    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Met à jour une catégorie de blog
 */
export async function updateBlogCategory(id: string, data: BlogCategoryFormData) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const validationResult = blogCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Données invalides",
      };
    }

    const { data: category, error } = await supabase
      .from("blog_categories")
      .update(validationResult.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour",
      };
    }

    revalidateBlogPaths();

    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime une catégorie de blog
 */
export async function deleteBlogCategory(id: string) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    // Vérifier qu'il n'y a pas de posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (posts && posts.length > 0) {
      return {
        success: false,
        error: "Impossible de supprimer une catégorie contenant des articles",
      };
    }

    const { error } = await supabase
      .from("blog_categories")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la suppression",
      };
    }

    revalidateBlogPaths();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ===========================================
// AUTHORS
// ===========================================

/**
 * Récupère tous les auteurs
 */
export async function getBlogAuthors() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("blog_authors")
    .select(`
      *,
      blog_posts(id)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur getBlogAuthors:", error);
    return [];
  }

  return data.map((author) => ({
    ...author,
    postCount: author.blog_posts?.length || 0,
  }));
}

/**
 * Crée un auteur
 */
export async function createBlogAuthor(data: BlogAuthorFormData) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const validationResult = blogAuthorSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Données invalides",
      };
    }

    const { data: author, error } = await supabase
      .from("blog_authors")
      .insert(validationResult.data)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la création",
      };
    }

    return { success: true, data: author };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Met à jour un auteur
 */
export async function updateBlogAuthor(id: string, data: BlogAuthorFormData) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const validationResult = blogAuthorSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Données invalides",
      };
    }

    const { data: author, error } = await supabase
      .from("blog_authors")
      .update(validationResult.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la mise à jour",
      };
    }

    return { success: true, data: author };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime un auteur
 */
export async function deleteBlogAuthor(id: string) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    // Vérifier qu'il n'y a pas de posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("author_id", id)
      .limit(1);

    if (posts && posts.length > 0) {
      return {
        success: false,
        error: "Impossible de supprimer un auteur ayant des articles",
      };
    }

    const { error } = await supabase
      .from("blog_authors")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la suppression",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ===========================================
// TAGS
// ===========================================

/**
 * Récupère tous les tags
 */
export async function getBlogTags() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("blog_tags")
    .select(`
      *,
      blog_post_tags(post_id)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erreur getBlogTags:", error);
    return [];
  }

  return data.map((tag) => ({
    ...tag,
    postCount: tag.blog_post_tags?.length || 0,
  }));
}

/**
 * Crée un tag
 */
export async function createBlogTag(data: BlogTagFormData) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const validationResult = blogTagSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Données invalides",
      };
    }

    const slug = validationResult.data.slug || generateSlug(validationResult.data.name);

    const { data: tag, error } = await supabase
      .from("blog_tags")
      .insert({
        name: validationResult.data.name,
        slug,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "Un tag avec ce nom existe déjà",
        };
      }
      return {
        success: false,
        error: "Erreur lors de la création",
      };
    }

    return { success: true, data: tag };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime un tag
 */
export async function deleteBlogTag(id: string) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    // Supprimer les associations d'abord
    await supabase.from("blog_post_tags").delete().eq("tag_id", id);

    // Puis supprimer le tag
    const { error } = await supabase
      .from("blog_tags")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la suppression",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ===========================================
// UTILITAIRES
// ===========================================

/**
 * Génère un slug unique pour un post
 */
export async function generateUniquePostSlug(title: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  let slug = generateSlug(title);
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!data) break;

    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Statistiques du blog
 */
export async function getBlogStats() {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, status, featured");

  const { data: categories } = await supabase
    .from("blog_categories")
    .select("id");

  const { data: authors } = await supabase
    .from("blog_authors")
    .select("id");

  const { data: tags } = await supabase
    .from("blog_tags")
    .select("id");

  return {
    posts: {
      total: posts?.length || 0,
      published: posts?.filter((p) => p.status === "PUBLISHED").length || 0,
      draft: posts?.filter((p) => p.status === "DRAFT").length || 0,
      archived: posts?.filter((p) => p.status === "ARCHIVED").length || 0,
      featured: posts?.filter((p) => p.featured).length || 0,
    },
    categories: categories?.length || 0,
    authors: authors?.length || 0,
    tags: tags?.length || 0,
  };
}
