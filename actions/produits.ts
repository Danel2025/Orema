"use server";

/**
 * Server Actions pour la gestion des produits
 * Migré de Prisma vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, createServiceClient, db } from "@/lib/db";
import type { TauxTva } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  produitSchema,
  produitCsvSchema,
  type ProduitFormData,
  type ProduitCsvData,
} from "@/schemas/produit.schema";
import {
  getEnforcementContext,
  validerModificationPrix,
  validerMarge,
} from "@/lib/tarification/enforcement";
import { createAuditLog } from "@/actions/audit";

// Rôles autorisés à modifier les produits (CRUD)
const ROLES_GESTION_PRODUITS = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

// Taille maximale du contenu CSV (2 Mo)
const MAX_CSV_SIZE = 2 * 1024 * 1024;

/**
 * Vérifie que l'utilisateur a le rôle nécessaire pour gérer les produits
 */
function canManageProduits(role: string): boolean {
  return (ROLES_GESTION_PRODUITS as readonly string[]).includes(role);
}

// Mapping des taux TVA vers l'enum
function getTauxTvaEnum(taux: number): TauxTva {
  if (taux === 0) return "EXONERE";
  if (taux === 10) return "REDUIT";
  return "STANDARD";
}

/**
 * Options de pagination pour les produits
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  categorieId?: string;
  search?: string;
  sortBy?: "nom" | "prixVente" | "createdAt" | "stockActuel";
  sortOrder?: "asc" | "desc";
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Récupère les produits avec pagination
 */
export async function getProduitsPaginated(options: PaginationOptions = {}) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId)
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  const {
    page = 1,
    limit = 20,
    includeInactive = false,
    categorieId,
    search,
    sortBy = "nom",
    sortOrder = "asc",
  } = options;

  // Mapper sortBy vers le nom de colonne Supabase
  const sortColumn =
    sortBy === "prixVente"
      ? "prix_vente"
      : sortBy === "stockActuel"
        ? "stock_actuel"
        : sortBy === "createdAt"
          ? "created_at"
          : "nom";

  const result = await db.getProduitsPaginated(supabase, etablissementId, {
    page,
    pageSize: limit,
    actif: includeInactive ? undefined : true,
    categorieId,
    search,
    sortBy: sortColumn as "nom" | "prix_vente" | "created_at" | "stock_actuel",
    sortOrder,
  });

  const totalPages = result.totalPages;

  // Transformer pour le format attendu
  const data = result.data.map((p) => ({
    id: p.id,
    nom: p.nom,
    description: p.description,
    codeBarre: p.code_barre,
    image: p.image,
    prixVente: p.prix_vente,
    prixAchat: p.prix_achat,
    tauxTva: p.taux_tva,
    categorieId: p.categorie_id,
    gererStock: p.gerer_stock,
    stockActuel: p.stock_actuel,
    stockMin: p.stock_min,
    stockMax: p.stock_max,
    unite: p.unite,
    disponibleDirect: p.disponible_direct,
    disponibleTable: p.disponible_table,
    disponibleLivraison: p.disponible_livraison,
    disponibleEmporter: p.disponible_emporter,
    actif: p.actif,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  }));

  return {
    data,
    pagination: {
      page: result.page,
      limit: result.pageSize,
      total: result.count,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Récupère tous les produits de l'établissement (sans pagination)
 */
export async function getProduits(options?: {
  includeInactive?: boolean;
  categorieId?: string;
  search?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  const produits = await db.getProduits(supabase, etablissementId, {
    actif: options?.includeInactive ? undefined : true,
    categorieId: options?.categorieId,
    search: options?.search,
  });

  // Transformer pour le format attendu
  return produits.map((p) => ({
    id: p.id,
    nom: p.nom,
    description: p.description,
    codeBarre: p.code_barre,
    image: p.image,
    prixVente: p.prix_vente,
    prixAchat: p.prix_achat,
    tauxTva: p.taux_tva,
    categorieId: p.categorie_id,
    gererStock: p.gerer_stock,
    stockActuel: p.stock_actuel,
    stockMin: p.stock_min,
    stockMax: p.stock_max,
    unite: p.unite,
    disponibleDirect: p.disponible_direct,
    disponibleTable: p.disponible_table,
    disponibleLivraison: p.disponible_livraison,
    disponibleEmporter: p.disponible_emporter,
    actif: p.actif,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  }));
}

/**
 * Récupère un produit par son ID
 */
export async function getProduitById(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return null;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const produit = await db.getProduitById(supabase, id);

  if (!produit) {
    return null;
  }

  return {
    id: produit.id,
    nom: produit.nom,
    description: produit.description,
    codeBarre: produit.code_barre,
    image: produit.image,
    prixVente: produit.prix_vente,
    prixAchat: produit.prix_achat,
    tauxTva: produit.taux_tva,
    categorieId: produit.categorie_id,
    gererStock: produit.gerer_stock,
    stockActuel: produit.stock_actuel,
    stockMin: produit.stock_min,
    stockMax: produit.stock_max,
    unite: produit.unite,
    disponibleDirect: produit.disponible_direct,
    disponibleTable: produit.disponible_table,
    disponibleLivraison: produit.disponible_livraison,
    disponibleEmporter: produit.disponible_emporter,
    actif: produit.actif,
    createdAt: new Date(produit.created_at),
    updatedAt: new Date(produit.updated_at),
  };
}

/**
 * Crée un nouveau produit
 */
export async function createProduit(data: ProduitFormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    if (!canManageProduits(user.role))
      return { success: false, error: "Permissions insuffisantes" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Validation
    const validationResult = produitSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier l'unicité du nom dans la catégorie (requête directe, pas de chargement complet)
    const existing = await db.findProduitByNom(
      supabase,
      etablissementId,
      validatedData.nom,
      validatedData.categorieId
    );

    if (existing) {
      return {
        success: false,
        error: "Un produit avec ce nom existe déjà dans cette catégorie",
      };
    }

    // Vérifier que la catégorie existe
    const categorie = await db.getCategorieById(supabase, validatedData.categorieId);

    if (!categorie || categorie.etablissement_id !== etablissementId) {
      return {
        success: false,
        error: "Catégorie non trouvée",
      };
    }

    // Créer le produit
    const produit = await db.createProduit(supabase, {
      nom: validatedData.nom,
      description: validatedData.description,
      code_barre: validatedData.codeBarre,
      image: validatedData.image,
      prix_vente: validatedData.prixVente,
      prix_achat: validatedData.prixAchat,
      taux_tva: getTauxTvaEnum(validatedData.tauxTva),
      categorie_id: validatedData.categorieId,
      gerer_stock: validatedData.gererStock,
      stock_actuel: validatedData.stockActuel,
      stock_min: validatedData.stockMin,
      stock_max: validatedData.stockMax,
      unite: validatedData.unite,
      disponible_direct: validatedData.disponibleDirect,
      disponible_table: validatedData.disponibleTable,
      disponible_livraison: validatedData.disponibleLivraison,
      disponible_emporter: validatedData.disponibleEmporter,
      actif: validatedData.actif,
      etablissement_id: etablissementId,
    });

    revalidatePath("/produits");

    return {
      success: true,
      data: {
        id: produit.id,
        nom: produit.nom,
        prixVente: produit.prix_vente,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la création du produit:", error);
    return {
      success: false,
      error: "Erreur lors de la création du produit",
    };
  }
}

/**
 * Met à jour un produit
 */
export async function updateProduit(id: string, data: ProduitFormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    if (!canManageProduits(user.role))
      return { success: false, error: "Permissions insuffisantes" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Validation
    const validationResult = produitSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier que le produit existe (RLS filtre par établissement)
    const existing = await db.getProduitById(supabase, id);

    if (!existing) {
      return {
        success: false,
        error: "Produit non trouvé",
      };
    }

    // Vérifier l'unicité du nom (sauf pour le produit actuel, requête directe)
    const duplicate = await db.findProduitByNom(
      supabase,
      etablissementId,
      validatedData.nom,
      validatedData.categorieId,
      id
    );

    if (duplicate) {
      return {
        success: false,
        error: "Un produit avec ce nom existe déjà dans cette catégorie",
      };
    }

    // --- Enforcement tarification : vérifier la modification de prix ---
    const prixChange = existing.prix_vente !== validatedData.prixVente;

    if (prixChange) {
      const enforcementCtx = await getEnforcementContext(
        supabase,
        etablissementId,
        user.userId,
        user.role
      );

      // Vérifier le droit de modifier les prix
      const resultPrix = validerModificationPrix(enforcementCtx);
      if (!resultPrix.valide) {
        return { success: false, error: resultPrix.raison };
      }

      // Vérifier la marge minimum si protection active
      if (enforcementCtx.protectionMargeActive && validatedData.prixAchat) {
        const resultMarge = validerMarge(
          validatedData.prixVente,
          validatedData.prixAchat,
          enforcementCtx.margeMinimumGlobale
        );
        if (!resultMarge.valide) {
          return { success: false, error: resultMarge.raison };
        }
      }
    }
    // --- Fin enforcement tarification ---

    // Mettre à jour
    const produit = await db.updateProduit(supabase, id, {
      nom: validatedData.nom,
      description: validatedData.description,
      code_barre: validatedData.codeBarre,
      image: validatedData.image,
      prix_vente: validatedData.prixVente,
      prix_achat: validatedData.prixAchat,
      taux_tva: getTauxTvaEnum(validatedData.tauxTva),
      categorie_id: validatedData.categorieId,
      gerer_stock: validatedData.gererStock,
      stock_actuel: validatedData.stockActuel,
      stock_min: validatedData.stockMin,
      stock_max: validatedData.stockMax,
      unite: validatedData.unite,
      disponible_direct: validatedData.disponibleDirect,
      disponible_table: validatedData.disponibleTable,
      disponible_livraison: validatedData.disponibleLivraison,
      disponible_emporter: validatedData.disponibleEmporter,
      actif: validatedData.actif,
    });

    // --- Historique des prix : enregistrer le changement ---
    if (prixChange) {
      const serviceClient = createServiceClient();
      await serviceClient.from("historique_prix").insert({
        produit_id: id,
        ancien_prix: existing.prix_vente,
        nouveau_prix: validatedData.prixVente,
        raison: null,
        modifie_par: user.userId,
        etablissement_id: etablissementId,
      });

      await createAuditLog({
        action: "UPDATE",
        entite: "produits",
        entiteId: id,
        description: `Prix modifié: ${existing.prix_vente} → ${validatedData.prixVente} FCFA`,
        ancienneValeur: { prixVente: existing.prix_vente },
        nouvelleValeur: { prixVente: validatedData.prixVente },
        utilisateurId: user.userId,
        etablissementId,
      });
    }
    // --- Fin historique des prix ---

    revalidatePath("/produits");

    return {
      success: true,
      data: {
        id: produit.id,
        nom: produit.nom,
        prixVente: produit.prix_vente,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du produit",
    };
  }
}

/**
 * Désactive un produit (soft delete - le produit est désactivé, pas supprimé définitivement)
 */
export async function deleteProduit(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    if (!canManageProduits(user.role))
      return { success: false, error: "Permissions insuffisantes" };
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    // Vérifier que le produit existe (RLS filtre par établissement)
    const produit = await db.getProduitById(supabase, id);

    if (!produit) {
      return {
        success: false,
        error: "Produit non trouvé",
      };
    }

    // Soft delete (désactive le produit)
    await db.deleteProduit(supabase, id);

    revalidatePath("/produits");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors de la désactivation du produit:", error);
    return {
      success: false,
      error: "Erreur lors de la désactivation du produit",
    };
  }
}

/**
 * Active/désactive un produit
 */
export async function toggleProduitActif(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    if (!canManageProduits(user.role))
      return { success: false, error: "Permissions insuffisantes" };
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const produit = await db.getProduitById(supabase, id);

    if (!produit) {
      return {
        success: false,
        error: "Produit non trouvé",
      };
    }

    const updated = await db.updateProduit(supabase, id, {
      actif: !produit.actif,
    });

    revalidatePath("/produits");

    return {
      success: true,
      data: {
        id: updated.id,
        actif: updated.actif,
      },
    };
  } catch (error) {
    console.error("Erreur lors du toggle du produit:", error);
    return {
      success: false,
      error: "Erreur lors de la modification du produit",
    };
  }
}

/**
 * Met à jour le stock d'un produit
 */
export async function updateStock(
  id: string,
  quantite: number,
  type: "ENTREE" | "SORTIE" | "AJUSTEMENT",
  motif?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    if (!canManageProduits(user.role))
      return { success: false, error: "Permissions insuffisantes" };
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId: user.etablissementId,
      role: user.role,
    });

    const produit = await db.getProduitById(supabase, id);

    if (!produit || !produit.gerer_stock) {
      return {
        success: false,
        error: "Produit non trouvé ou stock non géré",
      };
    }

    const stockAvant = produit.stock_actuel || 0;
    let stockApres: number;

    switch (type) {
      case "ENTREE":
        stockApres = stockAvant + quantite;
        break;
      case "SORTIE":
        stockApres = stockAvant - quantite;
        if (stockApres < 0) {
          return {
            success: false,
            error: "Stock insuffisant",
          };
        }
        break;
      case "AJUSTEMENT":
        stockApres = quantite;
        break;
      default:
        stockApres = stockAvant;
    }

    // Mettre à jour le produit
    await db.updateProduitStock(supabase, id, stockApres, "set");

    // Créer le mouvement de stock
    await db.createMouvementStock(supabase, {
      type,
      quantite,
      quantite_avant: stockAvant,
      quantite_apres: stockApres,
      motif,
      produit_id: id,
    });

    revalidatePath("/produits");
    revalidatePath("/stocks");

    return {
      success: true,
      data: { stockAvant, stockApres },
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du stock:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du stock",
    };
  }
}

/**
 * Exporte tous les produits au format CSV
 */
export async function exportProduitsCSV() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  const produits = await db.getProduits(supabase, etablissementId);
  const categories = await db.getCategories(supabase, etablissementId);
  const categoriesMap = new Map(categories.map((c) => [c.id, c.nom]));

  // En-têtes CSV
  const headers = [
    "nom",
    "description",
    "codeBarre",
    "prixVente",
    "prixAchat",
    "tauxTva",
    "categorie",
    "gererStock",
    "stockActuel",
    "stockMin",
    "stockMax",
    "unite",
    "disponibleDirect",
    "disponibleTable",
    "disponibleLivraison",
    "disponibleEmporter",
    "actif",
  ];

  // Convertir les produits en lignes CSV
  const rows = produits.map((p) => {
    const tauxTvaNum = p.taux_tva === "STANDARD" ? 18 : p.taux_tva === "REDUIT" ? 10 : 0;
    return [
      escapeCsvField(p.nom),
      escapeCsvField(p.description || ""),
      escapeCsvField(p.code_barre || ""),
      p.prix_vente.toString(),
      p.prix_achat ? p.prix_achat.toString() : "",
      tauxTvaNum.toString(),
      escapeCsvField(categoriesMap.get(p.categorie_id) || ""),
      p.gerer_stock ? "Oui" : "Non",
      p.stock_actuel?.toString() || "",
      p.stock_min?.toString() || "",
      p.stock_max?.toString() || "",
      escapeCsvField(p.unite || ""),
      p.disponible_direct ? "Oui" : "Non",
      p.disponible_table ? "Oui" : "Non",
      p.disponible_livraison ? "Oui" : "Non",
      p.disponible_emporter ? "Oui" : "Non",
      p.actif ? "Oui" : "Non",
    ];
  });

  // Construire le CSV
  const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

  return {
    success: true,
    data: csvContent,
    filename: `produits_${new Date().toISOString().split("T")[0]}.csv`,
  };
}

/**
 * Echappe un champ pour le format CSV
 */
function escapeCsvField(field: string): string {
  if (field.includes(";") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Génère un template CSV vide pour l'import
 */
export async function getCSVTemplate() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  // Récupérer les catégories pour référence
  const categories = await db.getCategories(supabase, etablissementId, { actif: true });

  const headers = [
    "nom",
    "description",
    "codeBarre",
    "prixVente",
    "prixAchat",
    "tauxTva",
    "categorie",
    "gererStock",
    "stockActuel",
    "stockMin",
    "stockMax",
    "unite",
    "disponibleDirect",
    "disponibleTable",
    "disponibleLivraison",
    "disponibleEmporter",
  ];

  // Exemple de ligne
  const exampleRow = [
    "Poulet DG",
    "Poulet aux legumes",
    "",
    "5000",
    "3000",
    "18",
    categories[0]?.nom || "Plats",
    "Non",
    "",
    "",
    "",
    "",
    "Oui",
    "Oui",
    "Oui",
    "Oui",
  ];

  const csvContent = [headers.join(";"), exampleRow.join(";")].join("\n");

  // Ajouter un commentaire avec les catégories disponibles
  const categoriesComment = `# Categories disponibles: ${categories.map((c) => c.nom).join(", ")}`;
  const tvaComment = "# Taux TVA: 0 (Exonere), 10 (Reduit), 18 (Standard)";
  const boolComment = "# Valeurs booleennes: Oui/Non ou true/false ou 1/0";

  return {
    success: true,
    data: `${categoriesComment}\n${tvaComment}\n${boolComment}\n${csvContent}`,
    filename: "template_produits.csv",
    categories: categories.map((c) => c.nom),
  };
}

/**
 * Parse et valide un fichier CSV d'import
 */
export async function parseCSVImport(csvContent: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  if (!canManageProduits(user.role))
    return { success: false, error: "Permissions insuffisantes" };

  // Validation de la taille du contenu CSV
  if (csvContent.length > MAX_CSV_SIZE) {
    return {
      success: false,
      error: `Le fichier CSV est trop volumineux (max ${MAX_CSV_SIZE / 1024 / 1024} Mo)`,
    };
  }

  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId,
    role: user.role,
  });

  // Récupérer les catégories existantes
  const categories = await db.getCategories(supabase, etablissementId);
  const categoryMap = new Map(categories.map((c) => [c.nom.toLowerCase(), c.id]));

  // Parser le CSV
  const lines = csvContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length < 2) {
    return {
      success: false,
      error: "Le fichier CSV doit contenir au moins une ligne d'en-tête et une ligne de données",
    };
  }

  const headers = parseCSVLine(lines[0]);
  const requiredHeaders = ["nom", "prixVente", "categorie"];
  const headerValues = headers.map((col) => col.toLowerCase());
  const missingHeaders = requiredHeaders.filter(
    (required) => !headerValues.includes(required.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: `Colonnes manquantes: ${missingHeaders.join(", ")}`,
    };
  }

  const results: {
    valid: ProduitCsvData[];
    errors: { line: number; errors: string[] }[];
  } = {
    valid: [],
    errors: [],
  };

  // Parser chaque ligne
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowData: Record<string, string | number | boolean | null> = {};

    // Mapper les valeurs aux headers
    headers.forEach((header, index) => {
      const value = values[index] || "";
      rowData[header.toLowerCase()] = value === "" ? null : value;
    });

    // Valider avec Zod
    const validation = produitCsvSchema.safeParse(rowData);

    if (validation.success) {
      // Vérifier que la catégorie existe
      const categoryId = categoryMap.get(validation.data.categorie.toLowerCase());
      if (!categoryId) {
        results.errors.push({
          line: i + 1,
          errors: [`Catégorie "${validation.data.categorie}" non trouvée`],
        });
      } else {
        results.valid.push(validation.data);
      }
    } else {
      results.errors.push({
        line: i + 1,
        errors: validation.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
  }

  return {
    success: true,
    data: results,
    totalLines: lines.length - 1,
    validCount: results.valid.length,
    errorCount: results.errors.length,
  };
}

/**
 * Parse une ligne CSV (gère les guillemets et points-virgules)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ";") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Importe les produits validés depuis un CSV
 * Optimisé : vérification d'existence en batch + insertion batch pour les nouveaux produits
 */
export async function importProduitsCSV(produitsData: ProduitCsvData[]) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.etablissementId)
      return { success: false, error: "Vous devez être connecté" };
    if (!canManageProduits(user.role))
      return { success: false, error: "Permissions insuffisantes" };
    const etablissementId = user.etablissementId;
    const supabase = await createAuthenticatedClient({
      userId: user.userId,
      etablissementId,
      role: user.role,
    });

    // Récupérer les catégories
    const categories = await db.getCategories(supabase, etablissementId);
    const categoryMap = new Map(categories.map((c) => [c.nom.toLowerCase(), c.id]));

    const results = {
      created: 0,
      updated: 0,
      errors: [] as { nom: string; error: string }[],
    };

    // Vérifier les catégories et préparer les données valides
    const validItems: { produitData: ProduitCsvData; categoryId: string }[] = [];
    for (const produitData of produitsData) {
      const categoryId = categoryMap.get(produitData.categorie.toLowerCase());
      if (!categoryId) {
        results.errors.push({
          nom: produitData.nom,
          error: `Catégorie "${produitData.categorie}" non trouvée`,
        });
        continue;
      }
      validItems.push({ produitData, categoryId });
    }

    if (validItems.length === 0) {
      return { success: true, data: results };
    }

    // Vérifier l'existence en batch : une seule requête pour tous les noms
    const allNoms = validItems.map((item) => item.produitData.nom);
    const existingMap = await db.findProduitsByNoms(supabase, etablissementId, allNoms);

    // Séparer les créations et les mises à jour
    const toCreate: Parameters<typeof db.createProduitsBatch>[1] = [];
    const toUpdate: { id: string; data: Parameters<typeof db.updateProduit>[2] }[] = [];

    for (const { produitData, categoryId } of validItems) {
      const data = {
        nom: produitData.nom,
        description: produitData.description || null,
        code_barre: produitData.codeBarre || null,
        prix_vente: produitData.prixVente,
        prix_achat: produitData.prixAchat || null,
        taux_tva: getTauxTvaEnum(produitData.tauxTva),
        categorie_id: categoryId,
        gerer_stock: produitData.gererStock,
        stock_actuel: produitData.stockActuel || null,
        stock_min: produitData.stockMin || null,
        stock_max: produitData.stockMax || null,
        unite: produitData.unite || null,
        disponible_direct: produitData.disponibleDirect ?? true,
        disponible_table: produitData.disponibleTable ?? true,
        disponible_livraison: produitData.disponibleLivraison ?? true,
        disponible_emporter: produitData.disponibleEmporter ?? true,
        actif: true,
      };

      const existing = existingMap.get(produitData.nom.toLowerCase());
      if (existing) {
        toUpdate.push({ id: existing.id, data });
      } else {
        toCreate.push({ ...data, etablissement_id: etablissementId });
      }
    }

    // Insertion batch pour les nouveaux produits
    if (toCreate.length > 0) {
      try {
        await db.createProduitsBatch(supabase, toCreate);
        results.created = toCreate.length;
      } catch (error) {
        console.error("Erreur lors de l'insertion batch:", error);
        // Fallback : insertion un par un pour identifier les erreurs individuelles
        for (const produitData of toCreate) {
          try {
            await db.createProduit(supabase, produitData);
            results.created++;
          } catch (err) {
            results.errors.push({
              nom: produitData.nom,
              error: err instanceof Error ? err.message : "Erreur inconnue",
            });
          }
        }
      }
    }

    // Les mises à jour doivent rester séquentielles (chaque produit a un ID différent)
    for (const { id, data } of toUpdate) {
      try {
        await db.updateProduit(supabase, id, data);
        results.updated++;
      } catch (error) {
        console.error(`Erreur mise à jour produit ${id}:`, error);
        results.errors.push({
          nom: data.nom ?? id,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    revalidatePath("/produits");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Erreur lors de l'import CSV:", error);
    return {
      success: false,
      error: "Erreur lors de l'import des produits",
    };
  }
}
