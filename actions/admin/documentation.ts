"use server";

/**
 * Server Actions pour la gestion de la documentation
 * SUPER_ADMIN uniquement
 */

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth, type AuthUser } from "@/lib/auth/supabase";
import {
  docCategorySchema,
  docArticleSchema,
  type DocCategoryFormData,
  type DocArticleFormData,
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
 * Revalide les paths publics et admin de la documentation
 */
function revalidateDocPaths() {
  revalidatePath("/docs");
  revalidatePath("/admin/contenu/documentation");
}

// ===========================================
// CATEGORIES - LECTURE (PUBLIC)
// ===========================================

/**
 * Récupère toutes les catégories de documentation (public: publiées uniquement)
 */
export async function getPublishedDocCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doc_categories")
    .select(
      `
      *,
      doc_articles(id, slug, title, read_time, status)
    `
    )
    .eq("status", "PUBLISHED")
    .order("ordre", { ascending: true });

  if (error) {
    console.error("Erreur getPublishedDocCategories:", error);
    return [];
  }

  return data.map((cat) => {
    const publishedArticles = (cat.doc_articles || []).filter(
      (a: { status: string }) => a.status === "PUBLISHED"
    );
    return {
      ...cat,
      doc_articles: publishedArticles,
      articleCount: publishedArticles.length,
    };
  });
}

/**
 * Récupère une catégorie par son slug (public: publiée uniquement)
 */
export async function getPublishedDocCategoryBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("doc_categories")
    .select(
      `
      *,
      doc_articles(*)
    `
    )
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .single();

  if (error) {
    return null;
  }

  // Filtrer les articles publiés uniquement
  const publishedArticles = (data.doc_articles || [])
    .filter((a: { status: ContentStatus }) => a.status === "PUBLISHED")
    .sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre);

  return {
    ...data,
    doc_articles: publishedArticles,
  };
}

/**
 * Récupère un article par ses slugs (public: publié uniquement)
 */
export async function getPublishedDocArticleBySlugs(categorySlug: string, articleSlug: string) {
  const supabase = await createClient();

  // Récupérer la catégorie
  const { data: category } = await supabase
    .from("doc_categories")
    .select("id, slug, title, color, icon")
    .eq("slug", categorySlug)
    .eq("status", "PUBLISHED")
    .single();

  if (!category) {
    return null;
  }

  // Récupérer l'article
  const { data: article, error } = await supabase
    .from("doc_articles")
    .select("*")
    .eq("category_id", category.id)
    .eq("slug", articleSlug)
    .eq("status", "PUBLISHED")
    .single();

  if (error || !article) {
    return null;
  }

  // Récupérer les autres articles de la catégorie pour la navigation
  const { data: otherArticles } = await supabase
    .from("doc_articles")
    .select("id, slug, title, ordre")
    .eq("category_id", category.id)
    .eq("status", "PUBLISHED")
    .order("ordre", { ascending: true });

  return {
    article,
    category,
    relatedArticles: otherArticles || [],
  };
}

// ===========================================
// CATEGORIES - ADMIN (SUPER_ADMIN)
// ===========================================

/**
 * Récupère toutes les catégories (admin: tous les statuts)
 */
export async function getDocCategories() {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("doc_categories")
    .select(
      `
      *,
      doc_articles(id, status),
      created_by_user:utilisateurs!doc_categories_created_by_fkey(nom, prenom)
    `
    )
    .order("ordre", { ascending: true });

  if (error) {
    console.error("Erreur getDocCategories:", error);
    return [];
  }

  return data.map((cat) => ({
    ...cat,
    articleCount: cat.doc_articles?.length || 0,
    publishedArticleCount:
      cat.doc_articles?.filter((a: { status: ContentStatus }) => a.status === "PUBLISHED").length ||
      0,
  }));
}

/**
 * Récupère une catégorie par son ID (admin)
 */
export async function getDocCategoryById(id: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("doc_categories")
    .select(
      `
      *,
      doc_articles(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  // Trier les articles par ordre
  const sortedArticles = (data.doc_articles || []).sort(
    (a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre
  );

  return {
    ...data,
    doc_articles: sortedArticles,
  };
}

/**
 * Crée une nouvelle catégorie de documentation
 */
export async function createDocCategory(data: DocCategoryFormData) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    // Validation
    const validationResult = docCategorySchema.safeParse(data);
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
      .from("doc_categories")
      .select("id")
      .eq("slug", validatedData.slug)
      .single();

    if (existing) {
      return {
        success: false,
        error: "Une catégorie avec ce slug existe déjà",
      };
    }

    // Déterminer l'ordre (dernier + 1)
    const { data: lastCategory } = await supabase
      .from("doc_categories")
      .select("ordre")
      .order("ordre", { ascending: false })
      .limit(1)
      .single();

    const ordre = validatedData.ordre || (lastCategory?.ordre || 0) + 1;

    // Créer la catégorie
    const { data: category, error } = await supabase
      .from("doc_categories")
      .insert({
        slug: validatedData.slug,
        title: validatedData.title,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        ordre,
        status: validatedData.status,
        created_by: user.userId,
        updated_by: user.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur createDocCategory:", error);
      return {
        success: false,
        error: "Erreur lors de la création de la catégorie",
      };
    }

    revalidateDocPaths();

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Erreur createDocCategory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Met à jour une catégorie de documentation
 */
export async function updateDocCategory(id: string, data: DocCategoryFormData) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    // Validation
    const validationResult = docCategorySchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier que la catégorie existe
    const { data: existing } = await supabase
      .from("doc_categories")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    // Vérifier l'unicité du slug (sauf pour la catégorie actuelle)
    const { data: duplicate } = await supabase
      .from("doc_categories")
      .select("id")
      .eq("slug", validatedData.slug)
      .neq("id", id)
      .single();

    if (duplicate) {
      return {
        success: false,
        error: "Une catégorie avec ce slug existe déjà",
      };
    }

    // Mettre à jour
    const { data: category, error } = await supabase
      .from("doc_categories")
      .update({
        slug: validatedData.slug,
        title: validatedData.title,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        ordre: validatedData.ordre,
        status: validatedData.status,
        updated_by: user.userId,
        published_at: validatedData.status === "PUBLISHED" ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur updateDocCategory:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour de la catégorie",
      };
    }

    revalidateDocPaths();

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Erreur updateDocCategory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime une catégorie de documentation
 */
export async function deleteDocCategory(id: string) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    // Vérifier que la catégorie existe
    const { data: existing } = await supabase
      .from("doc_categories")
      .select("id, doc_articles(id)")
      .eq("id", id)
      .single();

    if (!existing) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    // Vérifier qu'il n'y a pas d'articles (CASCADE supprimera quand même, mais on prévient)
    const articleCount = existing.doc_articles?.length || 0;
    if (articleCount > 0) {
      // On peut choisir de prévenir ou de laisser CASCADE faire son travail
      // Ici on laisse passer avec un message
    }

    // Supprimer (CASCADE supprimera les articles)
    const { error } = await supabase.from("doc_categories").delete().eq("id", id);

    if (error) {
      console.error("Erreur deleteDocCategory:", error);
      return {
        success: false,
        error: "Erreur lors de la suppression de la catégorie",
      };
    }

    revalidateDocPaths();

    return {
      success: true,
      deletedArticles: articleCount,
    };
  } catch (error) {
    console.error("Erreur deleteDocCategory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Change le statut d'une catégorie (publish/unpublish)
 */
export async function updateDocCategoryStatus(id: string, status: ContentStatus) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    const { data: category, error } = await supabase
      .from("doc_categories")
      .update({
        status,
        updated_by: user.userId,
        published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
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

    revalidateDocPaths();

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Réorganise les catégories
 */
export async function reorderDocCategories(orderedIds: string[]) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    // Mettre à jour l'ordre de chaque catégorie
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("doc_categories")
        .update({ ordre: i + 1 })
        .eq("id", orderedIds[i]);
    }

    revalidateDocPaths();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ===========================================
// ARTICLES - LECTURE (PUBLIC)
// ===========================================

/**
 * Récupère un article par son slug (public: publié uniquement)
 */
export async function getPublishedDocArticleBySlug(categorySlug: string, articleSlug: string) {
  const supabase = await createClient();

  // D'abord récupérer la catégorie
  const { data: category } = await supabase
    .from("doc_categories")
    .select("id")
    .eq("slug", categorySlug)
    .eq("status", "PUBLISHED")
    .single();

  if (!category) {
    return null;
  }

  // Puis récupérer l'article
  const { data: article } = await supabase
    .from("doc_articles")
    .select(
      `
      *,
      doc_categories(slug, title, icon, color)
    `
    )
    .eq("category_id", category.id)
    .eq("slug", articleSlug)
    .eq("status", "PUBLISHED")
    .single();

  return article;
}

// ===========================================
// ARTICLES - ADMIN (SUPER_ADMIN)
// ===========================================

/**
 * Récupère tous les articles d'une catégorie (admin)
 */
export async function getDocArticles(categoryId: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("doc_articles")
    .select(
      `
      *,
      created_by_user:utilisateurs!doc_articles_created_by_fkey(nom, prenom)
    `
    )
    .eq("category_id", categoryId)
    .order("ordre", { ascending: true });

  if (error) {
    console.error("Erreur getDocArticles:", error);
    return [];
  }

  return data;
}

/**
 * Récupère un article par son ID (admin)
 */
export async function getDocArticleById(id: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("doc_articles")
    .select(
      `
      *,
      doc_categories(id, slug, title, icon, color)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Crée un nouvel article de documentation
 */
export async function createDocArticle(data: DocArticleFormData) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    // Validation
    const validationResult = docArticleSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier que la catégorie existe
    const { data: category } = await supabase
      .from("doc_categories")
      .select("id")
      .eq("id", validatedData.categoryId)
      .single();

    if (!category) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    // Vérifier l'unicité du slug dans la catégorie
    const { data: existing } = await supabase
      .from("doc_articles")
      .select("id")
      .eq("category_id", validatedData.categoryId)
      .eq("slug", validatedData.slug)
      .single();

    if (existing) {
      return {
        success: false,
        error: "Un article avec ce slug existe déjà dans cette catégorie",
      };
    }

    // Déterminer l'ordre
    const { data: lastArticle } = await supabase
      .from("doc_articles")
      .select("ordre")
      .eq("category_id", validatedData.categoryId)
      .order("ordre", { ascending: false })
      .limit(1)
      .single();

    const ordre = validatedData.ordre || (lastArticle?.ordre || 0) + 1;

    // Calculer le temps de lecture
    const readTime = validatedData.readTime || estimateReadTime(validatedData.content);

    // Créer l'article
    const { data: article, error } = await supabase
      .from("doc_articles")
      .insert({
        category_id: validatedData.categoryId,
        slug: validatedData.slug,
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        read_time: readTime,
        ordre,
        status: validatedData.status,
        meta_title: validatedData.metaTitle,
        meta_description: validatedData.metaDescription,
        created_by: user.userId,
        updated_by: user.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur createDocArticle:", error);
      return {
        success: false,
        error: "Erreur lors de la création de l'article",
      };
    }

    revalidateDocPaths();

    return {
      success: true,
      data: article,
    };
  } catch (error) {
    console.error("Erreur createDocArticle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Met à jour un article de documentation
 */
export async function updateDocArticle(id: string, data: DocArticleFormData) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    // Validation
    const validationResult = docArticleSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier que l'article existe
    const { data: existing } = await supabase
      .from("doc_articles")
      .select("id, category_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return {
        success: false,
        error: "Article non trouvé",
      };
    }

    // Vérifier l'unicité du slug (sauf pour l'article actuel)
    const { data: duplicate } = await supabase
      .from("doc_articles")
      .select("id")
      .eq("category_id", validatedData.categoryId)
      .eq("slug", validatedData.slug)
      .neq("id", id)
      .single();

    if (duplicate) {
      return {
        success: false,
        error: "Un article avec ce slug existe déjà dans cette catégorie",
      };
    }

    // Calculer le temps de lecture
    const readTime = validatedData.readTime || estimateReadTime(validatedData.content);

    // Mettre à jour
    const { data: article, error } = await supabase
      .from("doc_articles")
      .update({
        category_id: validatedData.categoryId,
        slug: validatedData.slug,
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        read_time: readTime,
        ordre: validatedData.ordre,
        status: validatedData.status,
        meta_title: validatedData.metaTitle,
        meta_description: validatedData.metaDescription,
        updated_by: user.userId,
        published_at: validatedData.status === "PUBLISHED" ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erreur updateDocArticle:", error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour de l'article",
      };
    }

    revalidateDocPaths();

    return {
      success: true,
      data: article,
    };
  } catch (error) {
    console.error("Erreur updateDocArticle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Supprime un article de documentation
 */
export async function deleteDocArticle(id: string) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    const { error } = await supabase.from("doc_articles").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "Erreur lors de la suppression de l'article",
      };
    }

    revalidateDocPaths();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Change le statut d'un article
 */
export async function updateDocArticleStatus(id: string, status: ContentStatus) {
  try {
    const user = await requireSuperAdmin();
    const supabase = createServiceClient();

    const { data: article, error } = await supabase
      .from("doc_articles")
      .update({
        status,
        updated_by: user.userId,
        published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
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

    revalidateDocPaths();

    return {
      success: true,
      data: article,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Réorganise les articles d'une catégorie
 */
export async function reorderDocArticles(categoryId: string, orderedIds: string[]) {
  try {
    await requireSuperAdmin();
    const supabase = createServiceClient();

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("doc_articles")
        .update({ ordre: i + 1 })
        .eq("id", orderedIds[i])
        .eq("category_id", categoryId);
    }

    revalidateDocPaths();

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
 * Génère un slug unique pour une catégorie
 */
export async function generateUniqueCategorySlug(title: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  let slug = generateSlug(title);
  let counter = 1;

  while (true) {
    const { data } = await supabase.from("doc_categories").select("id").eq("slug", slug).single();

    if (!data) break;

    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Génère un slug unique pour un article dans une catégorie
 */
export async function generateUniqueArticleSlug(categoryId: string, title: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  let slug = generateSlug(title);
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("doc_articles")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", slug)
      .single();

    if (!data) break;

    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Statistiques de la documentation
 */
export async function getDocStats() {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const { data: categories } = await supabase.from("doc_categories").select("id, status");

  const { data: articles } = await supabase.from("doc_articles").select("id, status");

  return {
    categories: {
      total: categories?.length || 0,
      published: categories?.filter((c) => c.status === "PUBLISHED").length || 0,
      draft: categories?.filter((c) => c.status === "DRAFT").length || 0,
      archived: categories?.filter((c) => c.status === "ARCHIVED").length || 0,
    },
    articles: {
      total: articles?.length || 0,
      published: articles?.filter((a) => a.status === "PUBLISHED").length || 0,
      draft: articles?.filter((a) => a.status === "DRAFT").length || 0,
      archived: articles?.filter((a) => a.status === "ARCHIVED").length || 0,
    },
  };
}
