/**
 * Utilitaires de validation et sanitization
 *
 * @security Defense contre:
 * - Injection SQL (via Prisma ORM parametrise)
 * - XSS (Cross-Site Scripting)
 * - Injection de commandes
 * - Path traversal
 */

import { z } from "zod";

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Caracteres HTML dangereux a echapper
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Echappe les caracteres HTML pour prevenir XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Supprime les balises HTML d'une chaine.
 * Gere les balises malformees (sans > final) et les commentaires.
 */
export function stripHtml(str: string): string {
  return str
    .replace(/<!--[\s\S]*?-->/g, "") // Commentaires HTML
    .replace(/<[^>]*>?/g, "") // Balises (y compris malformees)
    .trim();
}

/**
 * Sanitize une chaine pour affichage securise
 * Combine stripHtml et escapeHtml
 */
export function sanitizeString(str: string): string {
  return escapeHtml(stripHtml(str));
}

/**
 * Sanitize un objet recursivement (toutes les chaines)
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    }
  }

  return sanitized;
}

/**
 * Verifie si une chaine contient des caracteres potentiellement dangereux
 */
export function containsDangerousChars(str: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick=, onload=, etc.
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(str));
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema pour un UUID valide
 */
export const uuidSchema = z.string().uuid("ID invalide");

/**
 * Schema pour un email valide
 */
export const emailSchema = z
  .string()
  .email("Email invalide")
  .max(255, "Email trop long")
  .transform((email) => email.toLowerCase().trim());

/**
 * Schema pour un mot de passe securise
 */
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
  .max(128, "Le mot de passe est trop long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
    "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special"
  );

/**
 * Schema pour un PIN (4-6 chiffres)
 */
export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "Le PIN doit contenir entre 4 et 6 chiffres");

/**
 * Schema pour un numero de telephone gabonais
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+241)?[0-9]{7,8}$/, "Numero de telephone invalide. Format: +241XXXXXXXX ou XXXXXXXX")
  .transform((phone) => {
    // Normaliser au format +241XXXXXXXX
    const cleaned = phone.replace(/\s+/g, "");
    if (!cleaned.startsWith("+241") && !cleaned.startsWith("241")) {
      return `+241${cleaned}`;
    }
    if (cleaned.startsWith("241")) {
      return `+${cleaned}`;
    }
    return cleaned;
  });

/**
 * Schema pour un montant en FCFA (entier positif)
 */
export const montantSchema = z
  .number()
  .int("Le montant doit etre un nombre entier")
  .nonnegative("Le montant ne peut pas etre negatif")
  .max(999999999, "Montant trop eleve"); // Max ~1 milliard FCFA

/**
 * Schema pour une quantite (entier positif)
 */
export const quantiteSchema = z
  .number()
  .int("La quantite doit etre un nombre entier")
  .positive("La quantite doit etre positive")
  .max(99999, "Quantite trop elevee");

/**
 * Schema pour un pourcentage (0-100)
 */
export const pourcentageSchema = z
  .number()
  .min(0, "Le pourcentage doit etre au moins 0")
  .max(100, "Le pourcentage ne peut pas depasser 100");

/**
 * Schema pour une chaine sanitisee (texte libre)
 */
export const safeStringSchema = z
  .string()
  .max(1000, "Texte trop long")
  .transform(sanitizeString)
  .refine((str) => !containsDangerousChars(str), "Le texte contient des caracteres non autorises");

/**
 * Schema pour un nom (lettres, espaces, tirets, apostrophes)
 */
export const nomSchema = z
  .string()
  .min(1, "Ce champ est requis")
  .max(100, "Nom trop long")
  .regex(
    /^[\p{L}\s\-']+$/u,
    "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"
  )
  .transform((str) => str.trim());

/**
 * Schema pour une adresse
 */
export const adresseSchema = z
  .string()
  .min(5, "Adresse trop courte")
  .max(500, "Adresse trop longue")
  .transform(sanitizeString);

/**
 * Schema pour un code-barres EAN/UPC
 */
export const codeBarreSchema = z
  .string()
  .regex(/^[0-9]{8,14}$/, "Code-barres invalide. Doit contenir entre 8 et 14 chiffres")
  .optional();

/**
 * Schema pour un NIF gabonais (Numero d'Identification Fiscale)
 */
export const nifSchema = z
  .string()
  .regex(/^[A-Z0-9]{10,15}$/, "NIF invalide")
  .optional();

/**
 * Schema pour un RCCM (Registre du Commerce)
 */
export const rccmSchema = z
  .string()
  .regex(/^[A-Z0-9\-\/]{5,30}$/, "RCCM invalide")
  .optional();

// ============================================================================
// VALIDATION DE FICHIERS
// ============================================================================

/**
 * Types MIME autorises pour les images
 */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

/**
 * Taille max pour les images (5 MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Valide un fichier image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return {
      valid: false,
      error: "Type de fichier non autorise. Utilisez JPG, PNG, GIF ou WebP",
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: "Fichier trop volumineux. Taille max: 5 MB",
    };
  }

  // Verifier l'extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: "Extension de fichier non autorisee",
    };
  }

  return { valid: true };
}

/**
 * Types MIME autorises pour l'import CSV
 */
export const ALLOWED_CSV_TYPES = [
  "text/csv",
  "text/plain",
  "application/csv",
  "application/vnd.ms-excel",
] as const;

/**
 * Taille max pour les fichiers CSV (10 MB)
 */
export const MAX_CSV_SIZE = 10 * 1024 * 1024;

/**
 * Valide un fichier CSV
 */
export function validateCsvFile(file: File): { valid: boolean; error?: string } {
  // Verifier le type MIME ou l'extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isValidType = ALLOWED_CSV_TYPES.includes(file.type as (typeof ALLOWED_CSV_TYPES)[number]);
  const isValidExtension = extension === "csv";

  if (!isValidType && !isValidExtension) {
    return {
      valid: false,
      error: "Type de fichier non autorise. Utilisez un fichier CSV",
    };
  }

  if (file.size > MAX_CSV_SIZE) {
    return {
      valid: false,
      error: "Fichier trop volumineux. Taille max: 10 MB",
    };
  }

  return { valid: true };
}

// ============================================================================
// VALIDATION DE CHEMINS
// ============================================================================

/**
 * Verifie si un chemin contient une tentative de path traversal
 */
export function hasPathTraversal(path: string): boolean {
  const dangerous = ["../", "..\\", "%2e%2e", "%252e%252e"];
  return dangerous.some((pattern) => path.toLowerCase().includes(pattern));
}

/**
 * Sanitize un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
  // Supprimer les caracteres dangereux
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Caracteres invalides Windows
    .replace(/\.\./g, "_") // Path traversal
    .replace(/^\./, "_") // Fichiers caches
    .trim()
    .slice(0, 255); // Limite de longueur
}

// ============================================================================
// SCHEMAS METIER COMPLETS
// ============================================================================

/**
 * Schema pour la creation d'un produit
 */
export const createProduitSchema = z.object({
  nom: nomSchema,
  description: safeStringSchema.optional(),
  prixVente: montantSchema,
  prixAchat: montantSchema.optional(),
  tauxTva: z.enum(["STANDARD", "REDUIT", "EXONERE"]).default("STANDARD"),
  categorieId: uuidSchema,
  gererStock: z.boolean().default(false),
  stockActuel: z.number().int().nonnegative().optional(),
  stockMin: z.number().int().nonnegative().optional(),
  stockMax: z.number().int().positive().optional(),
  codeBarre: codeBarreSchema,
  disponibleDirect: z.boolean().default(true),
  disponibleTable: z.boolean().default(true),
  disponibleLivraison: z.boolean().default(true),
  disponibleEmporter: z.boolean().default(true),
});

/**
 * Schema pour la creation d'un client
 */
export const createClientSchema = z.object({
  nom: nomSchema,
  prenom: nomSchema.optional(),
  telephone: phoneSchema.optional(),
  email: emailSchema.optional(),
  adresse: adresseSchema.optional(),
  creditAutorise: z.boolean().default(false),
  limitCredit: montantSchema.optional(),
});

/**
 * Schema pour une ligne de vente
 */
export const ligneVenteSchema = z.object({
  produitId: uuidSchema,
  quantite: quantiteSchema,
  prixUnitaire: montantSchema.optional(), // Optionnel car peut utiliser le prix du produit
  notes: safeStringSchema.optional(),
});

/**
 * Schema pour la creation d'une vente
 */
export const createVenteSchema = z.object({
  type: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"]).default("DIRECT"),
  tableId: uuidSchema.optional(),
  clientId: uuidSchema.optional(),
  lignes: z.array(ligneVenteSchema).min(1, "Au moins un article requis"),
  adresseLivraison: adresseSchema.optional(),
  fraisLivraison: montantSchema.optional(),
  typeRemise: z.enum(["POURCENTAGE", "MONTANT_FIXE"]).optional(),
  valeurRemise: z.number().nonnegative().optional(),
  notes: safeStringSchema.optional(),
});

/**
 * Type infere du schema de creation de vente
 */
export type CreateVenteInput = z.infer<typeof createVenteSchema>;
