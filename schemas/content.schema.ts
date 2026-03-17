/**
 * Schémas de validation pour la gestion de contenu (Documentation & Blog)
 * Réservé aux SUPER_ADMIN
 */

import { z } from "zod";

// ===========================================
// ENUMS & CONSTANTES
// ===========================================

/**
 * Statuts de publication du contenu
 */
export const contentStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof contentStatusValues)[number];

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export const contentStatusColors: Record<ContentStatus, string> = {
  DRAFT: "gray",
  PUBLISHED: "green",
  ARCHIVED: "violet",
};

/**
 * Couleurs Radix UI disponibles pour le contenu
 */
export const contentColors = [
  { value: "violet", label: "Violet" },
  { value: "blue", label: "Bleu" },
  { value: "green", label: "Vert" },
  { value: "purple", label: "Violet" },
  { value: "red", label: "Rouge" },
  { value: "amber", label: "Ambre" },
  { value: "cyan", label: "Cyan" },
  { value: "pink", label: "Rose" },
  { value: "teal", label: "Teal" },
  { value: "indigo", label: "Indigo" },
  { value: "crimson", label: "Cramoisi" },
  { value: "grass", label: "Herbe" },
  { value: "sky", label: "Ciel" },
  { value: "mint", label: "Menthe" },
  { value: "lime", label: "Citron vert" },
  { value: "yellow", label: "Jaune" },
  { value: "bronze", label: "Bronze" },
  { value: "gold", label: "Or" },
  { value: "gray", label: "Gris" },
] as const;

export const contentColorValues = contentColors.map((c) => c.value);

/**
 * Icônes disponibles pour les catégories de documentation
 */
export const docCategoryIcons = [
  { value: "Book", label: "Livre" },
  { value: "BookOpen", label: "Livre ouvert" },
  { value: "FileText", label: "Document" },
  { value: "HelpCircle", label: "Aide" },
  { value: "Settings", label: "Paramètres" },
  { value: "CreditCard", label: "Paiement" },
  { value: "Users", label: "Utilisateurs" },
  { value: "BarChart3", label: "Statistiques" },
  { value: "ShoppingCart", label: "Ventes" },
  { value: "Package", label: "Produits" },
  { value: "Truck", label: "Livraison" },
  { value: "Printer", label: "Impression" },
  { value: "Shield", label: "Sécurité" },
  { value: "Smartphone", label: "Mobile" },
  { value: "Zap", label: "Rapide" },
  { value: "Target", label: "Objectifs" },
  { value: "Layers", label: "Couches" },
  { value: "Database", label: "Données" },
  { value: "Globe", label: "Web" },
  { value: "Rocket", label: "Lancement" },
] as const;

export const docCategoryIconValues = docCategoryIcons.map((i) => i.value);

/**
 * Icônes disponibles pour les articles de blog
 */
export const blogPostIcons = [
  { value: "FileText", label: "Article" },
  { value: "Lightbulb", label: "Idée" },
  { value: "TrendingUp", label: "Croissance" },
  { value: "Target", label: "Objectifs" },
  { value: "Rocket", label: "Lancement" },
  { value: "Shield", label: "Sécurité" },
  { value: "Zap", label: "Nouveauté" },
  { value: "Award", label: "Récompense" },
  { value: "Calendar", label: "Événement" },
  { value: "Users", label: "Équipe" },
  { value: "MessageSquare", label: "Discussion" },
  { value: "BookOpen", label: "Guide" },
  { value: "Code", label: "Technique" },
  { value: "Palette", label: "Design" },
  { value: "BarChart3", label: "Analyse" },
  { value: "Heart", label: "Engagement" },
] as const;

export const blogPostIconValues = blogPostIcons.map((i) => i.value);

// ===========================================
// SCHÉMAS DE VALIDATION
// ===========================================

/**
 * Validation du slug (URL-friendly)
 */
const slugSchema = z
  .string()
  .min(2, "Le slug doit contenir au moins 2 caractères")
  .max(200, "Le slug ne peut pas dépasser 200 caractères")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets (pas de tirets consécutifs)"
  );

/**
 * Validation du statut de contenu
 */
const contentStatusSchema = z.enum(contentStatusValues);

// ===========================================
// DOCUMENTATION
// ===========================================

/**
 * Schéma pour une catégorie de documentation
 */
export const docCategorySchema = z.object({
  slug: slugSchema,
  title: z
    .string()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
  icon: z.string().default("Book"),
  color: z.string().default("blue"),
  ordre: z.coerce.number().int().min(0).default(0),
  status: contentStatusSchema.default("DRAFT"),
});

export type DocCategoryFormData = z.infer<typeof docCategorySchema>;

/**
 * Schéma pour un article de documentation
 */
export const docArticleSchema = z.object({
  categoryId: z.string().uuid("L'identifiant de catégorie doit être un UUID valide"),
  slug: slugSchema,
  title: z
    .string()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(300, "Le titre ne peut pas dépasser 300 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
  content: z
    .string()
    .min(10, "Le contenu doit contenir au moins 10 caractères"),
  readTime: z
    .string()
    .max(20, "Le temps de lecture ne peut pas dépasser 20 caractères")
    .default("5 min"),
  ordre: z.coerce.number().int().min(0).default(0),
  status: contentStatusSchema.default("DRAFT"),
  metaTitle: z
    .string()
    .max(200, "Le meta titre ne peut pas dépasser 200 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
  metaDescription: z
    .string()
    .max(300, "La meta description ne peut pas dépasser 300 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type DocArticleFormData = z.infer<typeof docArticleSchema>;

// ===========================================
// BLOG
// ===========================================

/**
 * Schéma pour une catégorie de blog
 */
export const blogCategorySchema = z.object({
  slug: slugSchema.max(100, "Le slug ne peut pas dépasser 100 caractères"),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  color: z.string().default("gray"),
});

export type BlogCategoryFormData = z.infer<typeof blogCategorySchema>;

/**
 * Schéma pour un auteur de blog
 */
export const blogAuthorSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),
  role: z
    .string()
    .max(200, "Le rôle ne peut pas dépasser 200 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
  avatarUrl: z
    .string()
    .url("L'URL de l'avatar doit être une URL valide")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  bio: z
    .string()
    .max(1000, "La biographie ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type BlogAuthorFormData = z.infer<typeof blogAuthorSchema>;

/**
 * Schéma pour un tag de blog
 */
export const blogTagSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  slug: slugSchema.max(100, "Le slug ne peut pas dépasser 100 caractères").optional(),
});

export type BlogTagFormData = z.infer<typeof blogTagSchema>;

/**
 * Schéma pour un article de blog
 */
export const blogPostSchema = z.object({
  slug: slugSchema.max(300, "Le slug ne peut pas dépasser 300 caractères"),
  title: z
    .string()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .max(300, "Le titre ne peut pas dépasser 300 caractères"),
  excerpt: z
    .string()
    .max(500, "L'extrait ne peut pas dépasser 500 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
  content: z
    .string()
    .min(10, "Le contenu doit contenir au moins 10 caractères"),
  categoryId: z.string().uuid("L'identifiant de catégorie doit être un UUID valide"),
  authorId: z.string().uuid("L'identifiant d'auteur doit être un UUID valide"),
  featuredImage: z
    .string()
    .url("L'URL de l'image doit être une URL valide")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  icon: z.string().default("FileText"),
  color: z.string().default("gray"),
  status: contentStatusSchema.default("DRAFT"),
  featured: z.boolean().default(false),
  tags: z.array(z.string().uuid()).default([]),
  metaTitle: z
    .string()
    .max(200, "Le meta titre ne peut pas dépasser 200 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
  metaDescription: z
    .string()
    .max(300, "La meta description ne peut pas dépasser 300 caractères")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;

// ===========================================
// FILTRES
// ===========================================

/**
 * Schéma pour les filtres de documentation
 */
export const docFilterSchema = z.object({
  search: z.string().optional(),
  status: contentStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
});

export type DocFilterData = z.infer<typeof docFilterSchema>;

/**
 * Schéma pour les filtres de blog
 */
export const blogFilterSchema = z.object({
  search: z.string().optional(),
  status: contentStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  featured: z.boolean().optional(),
  tagId: z.string().uuid().optional(),
});

export type BlogFilterData = z.infer<typeof blogFilterSchema>;

// ===========================================
// HELPERS
// ===========================================

/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères spéciaux
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/-+/g, "-") // Supprime les tirets consécutifs
    .replace(/^-|-$/g, ""); // Supprime les tirets au début et à la fin
}

/**
 * Estime le temps de lecture d'un contenu
 */
export function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
}
