"use server";

/**
 * Server Actions pour l'import/export CSV
 * Migré vers Supabase
 */

import { createServiceClient } from "@/lib/db";
import { getEtablissement } from "@/lib/etablissement";
import { parseProductsCSV, mapCSVToProduct } from "@/lib/csv/parser";
import { exportProductsToCSV, exportVentesToCSV, exportClientsToCSV } from "@/lib/csv/exporter";
import { revalidatePath } from "next/cache";
import { sanitizeSearchTerm } from "@/lib/utils/sanitize";
import { getCurrentUser } from "@/lib/auth";

interface ImportResult {
  success: boolean;
  message: string;
  importes: number;
  ignores: number;
  erreurs: { ligne: number; message: string }[];
}

const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CSV_ROWS = 10000;

export async function importProductsFromCSV(formData: FormData): Promise<ImportResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(currentUser.role)) {
      return {
        success: false,
        message: "Permissions insuffisantes",
        importes: 0,
        ignores: 0,
        erreurs: [],
      };
    }

    const file = formData.get("file") as File;
    if (!file)
      return {
        success: false,
        message: "Aucun fichier fourni",
        importes: 0,
        ignores: 0,
        erreurs: [],
      };

    // Verification de la taille du fichier
    if (file.size > MAX_CSV_SIZE) {
      return {
        success: false,
        message: "Fichier trop volumineux (max 5MB)",
        importes: 0,
        ignores: 0,
        erreurs: [],
      };
    }

    const content = await file.text();
    const parseResult = await parseProductsCSV(content);

    if (!parseResult.success && parseResult.errors.length > 0) {
      return {
        success: false,
        message: "Erreurs de validation dans le fichier",
        importes: 0,
        ignores: parseResult.lignesEnErreur,
        erreurs: parseResult.errors.map((e) => ({
          ligne: e.ligne,
          message: `${e.champ}: ${e.message}`,
        })),
      };
    }

    // Verification du nombre de lignes
    if (parseResult.produits.length > MAX_CSV_ROWS) {
      return {
        success: false,
        message: `Trop de lignes (${parseResult.produits.length}). Maximum autorise : ${MAX_CSV_ROWS}`,
        importes: 0,
        ignores: 0,
        erreurs: [],
      };
    }

    const etablissement = await getEtablissement();
    const supabase = createServiceClient();
    const produitsValides = parseResult.produits;

    // Récupérer ou créer les catégories
    const categoriesMap = new Map<string, string>();
    const categoriesNoms = [...new Set(produitsValides.map((p) => p.categorie))];

    for (const nomCategorie of categoriesNoms) {
      const { data: categorie } = await supabase
        .from("categories")
        .select("id")
        .eq("etablissement_id", etablissement.id)
        .ilike("nom", nomCategorie)
        .single();

      if (categorie) {
        categoriesMap.set(nomCategorie.toLowerCase(), categorie.id);
      } else {
        const { data: newCategorie } = await supabase
          .from("categories")
          .insert({
            nom: nomCategorie,
            etablissement_id: etablissement.id,
            couleur: "#f97316",
            ordre: categoriesMap.size,
          })
          .select("id")
          .single();
        if (newCategorie) categoriesMap.set(nomCategorie.toLowerCase(), newCategorie.id);
      }
    }

    let importes = 0,
      ignores = 0;
    const erreurs: { ligne: number; message: string }[] = [];

    for (let i = 0; i < produitsValides.length; i++) {
      const produit = produitsValides[i];
      const ligne = i + 2;

      try {
        const categorieId = categoriesMap.get(produit.categorie.toLowerCase());
        if (!categorieId) {
          erreurs.push({ ligne, message: `Catégorie non trouvée: ${produit.categorie}` });
          ignores++;
          continue;
        }

        const cleanNom = sanitizeSearchTerm(produit.nom);
        const cleanCodeBarre = produit.codeBarre ? sanitizeSearchTerm(produit.codeBarre) : null;
        const { data: existant } = await supabase
          .from("produits")
          .select("id")
          .eq("etablissement_id", etablissement.id)
          .or(
            cleanCodeBarre
              ? `code_barre.eq.${cleanCodeBarre},nom.eq.${cleanNom}`
              : `nom.eq.${cleanNom}`
          )
          .single();

        const productData = mapCSVToProduct(produit, categorieId, etablissement.id);
        if (existant) {
          await supabase.from("produits").update(productData).eq("id", existant.id);
        } else {
          await supabase.from("produits").insert(productData);
        }
        importes++;
      } catch (error) {
        erreurs.push({
          ligne,
          message: error instanceof Error ? error.message : "Erreur inconnue",
        });
        ignores++;
      }
    }

    revalidatePath("/produits");
    revalidatePath("/caisse");

    return {
      success: erreurs.length === 0,
      message:
        erreurs.length === 0
          ? `${importes} produit(s) importé(s) avec succès`
          : `${importes} importé(s), ${ignores} ignoré(s)`,
      importes,
      ignores,
      erreurs,
    };
  } catch (error) {
    console.error("[CSV Import] Erreur:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur interne",
      importes: 0,
      ignores: 0,
      erreurs: [],
    };
  }
}

export async function exportProducts(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const etablissement = await getEtablissement();
    const supabase = createServiceClient();

    const { data: produits } = await supabase
      .from("produits")
      .select("*, categories(nom)")
      .eq("etablissement_id", etablissement.id)
      .order("nom", { ascending: true });

    const produitsExport = (produits || []).map((p) => ({
      nom: p.nom,
      description: p.description,
      codeBarre: p.code_barre,
      prixVente: Number(p.prix_vente),
      prixAchat: p.prix_achat ? Number(p.prix_achat) : null,
      tauxTva: p.taux_tva,
      categorie: p.categories as { nom: string },
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
    }));

    const csv = exportProductsToCSV(produitsExport);
    return { success: true, data: csv };
  } catch (error) {
    console.error("[CSV Export] Erreur:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur interne" };
  }
}

export async function exportVentes(
  dateDebut: Date,
  dateFin: Date
): Promise<{ success: boolean; data?: string; error?: string; count?: number }> {
  try {
    const etablissement = await getEtablissement();
    const supabase = createServiceClient();

    const { data: ventes } = await supabase
      .from("ventes")
      .select("*, utilisateurs(nom, prenom), clients(nom, prenom), tables(numero), paiements(*)")
      .eq("etablissement_id", etablissement.id)
      .eq("statut", "PAYEE")
      .gte("created_at", dateDebut.toISOString())
      .lte("created_at", dateFin.toISOString())
      .order("created_at", { ascending: false });

    const ventesExport = (ventes || []).map((v) => ({
      numeroTicket: v.numero_ticket,
      createdAt: new Date(v.created_at),
      type: v.type,
      statut: v.statut,
      sousTotal: Number(v.sous_total),
      totalTva: Number(v.total_tva),
      totalRemise: Number(v.total_remise),
      totalFinal: Number(v.total_final),
      utilisateur: v.utilisateurs as { nom: string; prenom: string | null },
      client: v.clients as { nom: string; prenom: string | null } | null,
      table: v.tables as { numero: string } | null,
      paiements: (
        (v.paiements || []) as Array<{ mode_paiement: string; montant: string | number }>
      ).map((p) => ({
        modePaiement: p.mode_paiement,
        montant: Number(p.montant),
      })),
    }));

    const csv = exportVentesToCSV(ventesExport);
    return { success: true, data: csv, count: (ventes || []).length };
  } catch (error) {
    console.error("[CSV Export Ventes] Erreur:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur interne" };
  }
}

export async function exportClients(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
  count?: number;
}> {
  try {
    const etablissement = await getEtablissement();
    const supabase = createServiceClient();

    const { data: clients } = await supabase
      .from("clients")
      .select("*")
      .eq("etablissement_id", etablissement.id)
      .order("nom", { ascending: true });

    const clientsExport = (clients || []).map((c) => ({
      nom: c.nom,
      prenom: c.prenom,
      telephone: c.telephone,
      email: c.email,
      adresse: c.adresse,
      pointsFidelite: c.points_fidelite,
      soldePrepaye: Number(c.solde_prepaye),
      creditAutorise: c.credit_autorise,
      limitCredit: c.limit_credit ? Number(c.limit_credit) : null,
      soldeCredit: Number(c.solde_credit),
      actif: c.actif,
      createdAt: new Date(c.created_at),
    }));

    const csv = exportClientsToCSV(clientsExport);
    return { success: true, data: csv, count: (clients || []).length };
  } catch (error) {
    console.error("[CSV Export Clients] Erreur:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur interne" };
  }
}
