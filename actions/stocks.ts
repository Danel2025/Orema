"use server";

/**
 * Server Actions pour la gestion des stocks
 * Migré de Prisma vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, db } from "@/lib/db";
import type { TypeMouvement } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import {
  createMovementSchema,
  inventoryLineSchema,
  type CreateMovementInput,
  type ProduitAvecStatutStock,
  type StockStatus,
  type MouvementStockAvecProduit,
  type AlerteStock,
  type ValorisationStock,
  type TypeMouvementType,
} from "@/schemas/stock.schema";
import { sanitizeSearchTerm } from "@/lib/utils/sanitize";

/**
 * Crée un client authentifié pour les actions stocks.
 */
async function getAuthClient() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  if (!user.etablissementId) throw new Error("Aucun établissement associé");
  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });
  return { supabase, user: { ...user, etablissementId: user.etablissementId as string } };
}

/**
 * Calcule le statut de stock d'un produit
 */
function calculateStockStatus(stockActuel: number | null, stockMin: number | null): StockStatus {
  if (stockActuel === null || stockActuel === 0) {
    return "RUPTURE";
  }
  if (stockMin !== null && stockActuel <= stockMin) {
    return "ALERTE";
  }
  return "OK";
}

/**
 * Récupère la liste des produits avec leur statut de stock
 */
export async function getStockStatus(options?: {
  categorieId?: string;
  statutFilter?: StockStatus;
  search?: string;
}): Promise<{ success: true; data: ProduitAvecStatutStock[] } | { success: false; error: string }> {
  try {
    const { supabase } = await getAuthClient();

    // Construire la requête - RLS filtre automatiquement par etablissement_id
    let query = supabase
      .from("produits")
      .select("*, categories(id, nom, couleur)")
      .eq("gerer_stock", true)
      .eq("actif", true);

    if (options?.categorieId) {
      query = query.eq("categorie_id", options.categorieId);
    }

    if (options?.search) {
      const cleanSearch = sanitizeSearchTerm(options.search);
      if (cleanSearch) {
        query = query.or(`nom.ilike.%${cleanSearch}%,code_barre.ilike.%${cleanSearch}%`);
      }
    }

    const { data: produits, error } = await query.order("nom");

    if (error) {
      throw new Error(error.message);
    }

    // Transformer et filtrer par statut si nécessaire
    const produitsAvecStatut: ProduitAvecStatutStock[] = (produits ?? [])
      .map((p) => {
        const statut = calculateStockStatus(p.stock_actuel, p.stock_min);
        return {
          id: p.id,
          nom: p.nom,
          stockActuel: p.stock_actuel,
          stockMin: p.stock_min,
          stockMax: p.stock_max,
          unite: p.unite,
          prixAchat: p.prix_achat ? Number(p.prix_achat) : null,
          prixVente: Number(p.prix_vente),
          gererStock: p.gerer_stock,
          statut,
          categorie: p.categories ?? { id: "", nom: "Sans catégorie", couleur: "#6B7280" },
        };
      })
      .filter((p) => !options?.statutFilter || p.statut === options.statutFilter);

    return { success: true, data: produitsAvecStatut };
  } catch (error) {
    console.error("Erreur lors de la récupération du statut des stocks:", error);
    return { success: false, error: "Erreur lors de la récupération des stocks" };
  }
}

/**
 * Crée un mouvement de stock
 */
export async function createMovement(
  input: CreateMovementInput
): Promise<
  | { success: true; data: { stockAvant: number; stockApres: number } }
  | { success: false; error: string }
> {
  try {
    const { supabase } = await getAuthClient();

    // Validation
    const validationResult = createMovementSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données invalides",
      };
    }
    const validatedData = validationResult.data;

    // Vérifier que le produit existe (RLS filtre par etablissement)
    const produit = await db.getProduitById(supabase, validatedData.produitId);

    if (!produit || !produit.gerer_stock) {
      return {
        success: false,
        error: "Produit non trouvé ou gestion de stock non activée",
      };
    }

    const stockAvant = produit.stock_actuel || 0;
    let stockApres: number;

    // Calculer le nouveau stock selon le type de mouvement
    switch (validatedData.type) {
      case "ENTREE":
        stockApres = stockAvant + validatedData.quantite;
        break;
      case "SORTIE":
      case "PERTE":
        stockApres = stockAvant - validatedData.quantite;
        if (stockApres < 0) {
          return {
            success: false,
            error: `Stock insuffisant. Stock actuel: ${stockAvant}, Quantité demandée: ${validatedData.quantite}`,
          };
        }
        break;
      case "AJUSTEMENT":
        // Pour ajustement, la quantité représente le nouveau stock
        stockApres = validatedData.quantite;
        break;
      default:
        stockApres = stockAvant;
    }

    // Mettre à jour le stock du produit
    await db.updateProduitStock(supabase, validatedData.produitId, stockApres);

    // Créer le mouvement de stock
    await db.createMouvementStock(supabase, {
      type: validatedData.type as TypeMouvement,
      quantite: validatedData.quantite,
      quantite_avant: stockAvant,
      quantite_apres: stockApres,
      motif: validatedData.motif,
      reference: validatedData.reference,
      prix_unitaire: validatedData.prixUnitaire,
      produit_id: validatedData.produitId,
    });

    revalidatePath("/stocks");
    revalidatePath("/produits");

    return {
      success: true,
      data: { stockAvant, stockApres },
    };
  } catch (error) {
    console.error("Erreur lors de la création du mouvement de stock:", error);
    return {
      success: false,
      error: "Erreur lors de la création du mouvement",
    };
  }
}

/**
 * Récupère l'historique des mouvements de stock
 */
export async function getMovementHistory(options?: {
  produitId?: string;
  type?: TypeMouvementType;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}): Promise<
  { success: true; data: MouvementStockAvecProduit[] } | { success: false; error: string }
> {
  try {
    const { supabase } = await getAuthClient();

    // Construire la requête - RLS filtre automatiquement par etablissement_id
    let query = supabase
      .from("mouvements_stock")
      .select("*, produits!inner(id, nom, unite)")
      .order("created_at", { ascending: false })
      .limit(options?.limit || 100);

    if (options?.produitId) {
      query = query.eq("produit_id", options.produitId);
    }

    if (options?.type) {
      query = query.eq("type", options.type);
    }

    if (options?.dateFrom) {
      query = query.gte("created_at", options.dateFrom.toISOString());
    }

    if (options?.dateTo) {
      query = query.lte("created_at", options.dateTo.toISOString());
    }

    const { data: mouvements, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const serializedMouvements: MouvementStockAvecProduit[] = (mouvements ?? []).map((m) => ({
      id: m.id,
      type: m.type as TypeMouvementType,
      quantite: m.quantite,
      quantiteAvant: m.quantite_avant,
      quantiteApres: m.quantite_apres,
      prixUnitaire: m.prix_unitaire ? Number(m.prix_unitaire) : null,
      motif: m.motif,
      reference: m.reference,
      createdAt: new Date(m.created_at),
      produit: {
        id: m.produits.id,
        nom: m.produits.nom,
        unite: m.produits.unite,
      },
    }));

    return { success: true, data: serializedMouvements };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return { success: false, error: "Erreur lors de la récupération de l'historique" };
  }
}

/**
 * Récupère les alertes de stock (produits en alerte ou rupture)
 */
export async function getStockAlerts(): Promise<
  { success: true; data: AlerteStock[] } | { success: false; error: string }
> {
  try {
    const { supabase } = await getAuthClient();

    // Récupérer les produits en rupture ou avec stock <= stockMin
    // RLS filtre automatiquement par etablissement_id
    const { data: produits, error } = await supabase
      .from("produits")
      .select("*, categories(id, nom, couleur)")
      .eq("gerer_stock", true)
      .eq("actif", true)
      .order("stock_actuel", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    // Filtrer les produits en alerte (stockActuel <= stockMin) ou rupture (stock = 0/null)
    const alertes: AlerteStock[] = (produits ?? [])
      .filter((p) => {
        if (p.stock_actuel === null || p.stock_actuel === 0) return true;
        if (p.stock_min !== null && p.stock_actuel <= p.stock_min) return true;
        return false;
      })
      .map((p) => ({
        id: p.id,
        nom: p.nom,
        stockActuel: p.stock_actuel || 0,
        stockMin: p.stock_min || 0,
        unite: p.unite,
        statut: (p.stock_actuel === null || p.stock_actuel === 0 ? "RUPTURE" : "ALERTE") as
          | "ALERTE"
          | "RUPTURE",
        categorie: p.categories ?? { id: "", nom: "Sans catégorie", couleur: "#6B7280" },
      }));

    return { success: true, data: alertes };
  } catch (error) {
    console.error("Erreur lors de la récupération des alertes:", error);
    return { success: false, error: "Erreur lors de la récupération des alertes" };
  }
}

/**
 * Calcule la valorisation du stock
 */
export async function getStockValuation(): Promise<
  { success: true; data: ValorisationStock } | { success: false; error: string }
> {
  try {
    const { supabase } = await getAuthClient();

    // RLS filtre automatiquement par etablissement_id
    const { data: produits, error } = await supabase
      .from("produits")
      .select("*, categories(id, nom, couleur)")
      .eq("gerer_stock", true)
      .eq("actif", true)
      .gt("stock_actuel", 0);

    if (error) {
      throw new Error(error.message);
    }

    // Calculer la valorisation par catégorie
    const valorisationMap = new Map<
      string,
      {
        categorieId: string;
        categorieNom: string;
        couleur: string;
        nombreProduits: number;
        valeur: number;
      }
    >();

    let valeurTotale = 0;

    for (const produit of produits ?? []) {
      const stock = produit.stock_actuel || 0;
      // Utiliser le prix d'achat si disponible, sinon le prix de vente
      const prixUnitaire = produit.prix_achat
        ? Number(produit.prix_achat)
        : Number(produit.prix_vente);
      const valeurProduit = stock * prixUnitaire;

      valeurTotale += valeurProduit;

      const categorieId = produit.categories?.id ?? "sans-categorie";
      const existing = valorisationMap.get(categorieId);

      if (existing) {
        existing.nombreProduits += 1;
        existing.valeur += valeurProduit;
      } else {
        valorisationMap.set(categorieId, {
          categorieId,
          categorieNom: produit.categories?.nom ?? "Sans catégorie",
          couleur: produit.categories?.couleur ?? "#gray",
          nombreProduits: 1,
          valeur: valeurProduit,
        });
      }
    }

    const valorisation: ValorisationStock = {
      totalProduits: produits?.length ?? 0,
      valeurTotale,
      valeurParCategorie: Array.from(valorisationMap.values()).sort((a, b) => b.valeur - a.valeur),
    };

    return { success: true, data: valorisation };
  } catch (error) {
    console.error("Erreur lors du calcul de la valorisation:", error);
    return { success: false, error: "Erreur lors du calcul de la valorisation" };
  }
}

/**
 * Récupère les produits pour un inventaire
 */
export async function getInventoryProducts(categorieId?: string): Promise<
  | {
      success: true;
      data: {
        id: string;
        nom: string;
        stockActuel: number;
        unite: string | null;
        categorie: { id: string; nom: string; couleur: string };
      }[];
    }
  | { success: false; error: string }
> {
  try {
    const { supabase } = await getAuthClient();

    // RLS filtre automatiquement par etablissement_id
    let query = supabase
      .from("produits")
      .select("id, nom, stock_actuel, unite, categories(id, nom, couleur)")
      .eq("gerer_stock", true)
      .eq("actif", true)
      .order("nom");

    if (categorieId) {
      query = query.eq("categorie_id", categorieId);
    }

    const { data: produits, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      data: (produits ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        nom: p.nom as string,
        stockActuel: (p.stock_actuel as number) || 0,
        unite: p.unite as string | null,
        categorie: (p.categories as unknown as { id: string; nom: string; couleur: string }) ?? { id: "", nom: "Sans catégorie", couleur: "#6B7280" },
      })),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des produits pour inventaire:", error);
    return { success: false, error: "Erreur lors de la récupération des produits" };
  }
}

/**
 * Soumet les résultats d'un inventaire
 */
export async function submitInventory(
  lignes: { produitId: string; quantiteReelle: number }[]
): Promise<
  | {
      success: true;
      data: {
        produitsTraites: number;
        ecartTotal: number;
        details: { produitNom: string; stockAvant: number; stockApres: number; ecart: number }[];
      };
    }
  | { success: false; error: string }
> {
  try {
    // M6: Validation Zod des lignes d'inventaire
    const validationSchema = z.array(
      z.object({
        produitId: z.string().uuid("ID produit invalide"),
        quantiteReelle: z.number().int().nonnegative("La quantité ne peut pas être négative"),
      })
    );
    const validationResult = validationSchema.safeParse(lignes);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Données d'inventaire invalides",
      };
    }
    const validatedLignes = validationResult.data;

    const { supabase } = await getAuthClient();

    // I3: Charger tous les produits en une seule requête au lieu de N requêtes
    const produitIds = validatedLignes.map((l) => l.produitId);
    const { data: produitsData, error: produitsError } = await supabase
      .from("produits")
      .select("id, nom, stock_actuel, gerer_stock")
      .in("id", produitIds)
      .eq("gerer_stock", true);

    if (produitsError) {
      throw new Error(produitsError.message);
    }

    const produitsMap = new Map(
      (produitsData ?? []).map((p) => [p.id, p])
    );

    const details: { produitNom: string; stockAvant: number; stockApres: number; ecart: number }[] =
      [];
    let ecartTotal = 0;

    // Traiter chaque ligne d'inventaire
    for (const ligne of validatedLignes) {
      const produit = produitsMap.get(ligne.produitId);

      if (!produit || !produit.gerer_stock) {
        continue;
      }

      const stockAvant = produit.stock_actuel || 0;
      const stockApres = ligne.quantiteReelle;
      const ecart = stockApres - stockAvant;

      if (ecart !== 0) {
        // Mettre à jour le stock du produit
        await db.updateProduitStock(supabase, ligne.produitId, stockApres);

        // Créer un mouvement d'inventaire (utilise INVENTAIRE)
        await db.createMouvementStock(supabase, {
          type: "INVENTAIRE" as TypeMouvement,
          quantite: Math.abs(ecart),
          quantite_avant: stockAvant,
          quantite_apres: stockApres,
          motif: `Inventaire - Écart: ${ecart >= 0 ? "+" : ""}${ecart}`,
          produit_id: ligne.produitId,
        });

        ecartTotal += ecart;
        details.push({
          produitNom: produit.nom,
          stockAvant,
          stockApres,
          ecart,
        });
      }
    }

    revalidatePath("/stocks");
    revalidatePath("/produits");

    return {
      success: true,
      data: {
        produitsTraites: lignes.length,
        ecartTotal,
        details,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la soumission de l'inventaire:", error);
    return { success: false, error: "Erreur lors de la soumission de l'inventaire" };
  }
}

/**
 * Récupère les catégories pour les filtres
 */
export async function getStockCategories(): Promise<
  | { success: true; data: { id: string; nom: string; couleur: string }[] }
  | { success: false; error: string }
> {
  try {
    const { supabase } = await getAuthClient();

    // I4: Requête unique avec jointure au lieu de 2 requêtes séparées
    // RLS filtre automatiquement par etablissement_id
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, nom, couleur, produits!inner(gerer_stock, actif)")
      .eq("produits.gerer_stock", true)
      .eq("produits.actif", true)
      .eq("actif", true)
      .order("nom");

    if (error) {
      throw new Error(error.message);
    }

    // Retourner uniquement id, nom, couleur (sans les produits joints)
    return {
      success: true,
      data: (categories ?? []).map((c) => ({
        id: c.id,
        nom: c.nom,
        couleur: c.couleur,
      })),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return { success: false, error: "Erreur lors de la récupération des catégories" };
  }
}

/**
 * Exporte l'état du stock au format CSV
 */
export async function exportStockCSV(): Promise<
  { success: true; data: string; filename: string } | { success: false; error: string }
> {
  try {
    const result = await getStockStatus();
    if (!result.success) {
      return result;
    }

    const produits = result.data;

    // En-têtes CSV
    const headers = [
      "Produit",
      "Catégorie",
      "Stock actuel",
      "Stock min",
      "Stock max",
      "Unité",
      "Statut",
      "Prix d'achat",
      "Prix de vente",
      "Valeur stock",
    ];

    // Construire les lignes CSV
    const rows = produits.map((p) => {
      const valeurStock = (p.stockActuel || 0) * (p.prixAchat || p.prixVente);
      return [
        escapeCsvField(p.nom),
        escapeCsvField(p.categorie.nom),
        (p.stockActuel || 0).toString(),
        (p.stockMin || "").toString(),
        (p.stockMax || "").toString(),
        escapeCsvField(p.unite || ""),
        p.statut,
        (p.prixAchat || "").toString(),
        p.prixVente.toString(),
        valeurStock.toString(),
      ];
    });

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    return {
      success: true,
      data: csvContent,
      filename: `stock_${new Date().toISOString().split("T")[0]}.csv`,
    };
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    return { success: false, error: "Erreur lors de l'export CSV" };
  }
}

/**
 * Échappe un champ pour le format CSV
 */
function escapeCsvField(field: string): string {
  if (field.includes(";") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
