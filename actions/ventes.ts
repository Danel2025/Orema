"use server";

/**
 * Server Actions pour la gestion des ventes
 * Migré de Prisma vers Supabase - Version optimisée
 */

import { revalidatePath } from "next/cache";
import {
  createAuthenticatedClient,
  type DbClient,
  type TypeVente,
  type StatutVente,
  type ModePaiement,
  type TypeRemise,
  type TypeMouvement,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import {
  getEnforcementContext,
  validerRemise,
  validerPrixMinimum,
  validerModePaiement,
} from "@/lib/tarification/enforcement";
import { checkSalesQuota } from "@/lib/plan-enforcement";
import { createAuditLog } from "@/actions/audit";
import { generateBonCuisine } from "@/lib/print/bon-cuisine";
import { generateBonBar } from "@/lib/print/bon-bar";
import { isBarCategory, findPrinterByType } from "@/lib/print/router";
import { sendToPrinter } from "@/lib/print/sender";
import type { BonPreparationData, PrintLineItem } from "@/lib/print/types";

// ============================================================================
// SCHEMAS DE VALIDATION ZOD
// ============================================================================

const SupplementInputSchema = z.object({
  nom: z.string().min(1, "Le nom du supplément est requis"),
  prix: z.number().int().min(0, "Le prix du supplément ne peut pas être négatif"),
  supplementProduitId: z.string().uuid("ID supplément invalide").optional(),
});

const LigneVenteInputSchema = z.object({
  produitId: z.string().uuid("ID produit invalide"),
  quantite: z.number().int().positive("La quantité doit être positive"),
  prixUnitaire: z.number().int().min(0, "Le prix unitaire ne peut pas être négatif"),
  tauxTva: z.enum(["STANDARD", "REDUIT", "EXONERE"], {
    error: "Taux TVA invalide",
  }),
  notes: z.string().max(200, "Les notes ne peuvent pas dépasser 200 caractères").optional(),
  supplements: z.array(SupplementInputSchema).optional(),
  totalSupplements: z.number().int().min(0).optional(),
  remiseLigne: z
    .object({
      type: z.enum(["POURCENTAGE", "MONTANT_FIXE"]),
      valeur: z.number().positive("La valeur de la remise doit être positive"),
    })
    .optional(),
});

const PaiementInputSchema = z.object({
  mode: z.enum([
    "ESPECES",
    "CARTE_BANCAIRE",
    "AIRTEL_MONEY",
    "MOOV_MONEY",
    "CHEQUE",
    "VIREMENT",
    "COMPTE_CLIENT",
    "MIXTE",
  ], { error: "Mode de paiement invalide" }),
  montant: z.number().int().positive("Le montant doit être positif"),
  reference: z.string().max(100).optional(),
});

const RemiseSchema = z.object({
  type: z.enum(["POURCENTAGE", "MONTANT_FIXE"]),
  valeur: z.number().positive("La valeur de la remise doit être positive"),
});

const CreateVenteSchema = z.object({
  typeVente: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"], {
    error: "Type de vente invalide",
  }),
  lignes: z
    .array(LigneVenteInputSchema)
    .min(1, "Au moins un produit doit être ajouté à la vente"),
  modePaiement: z.enum([
    "ESPECES",
    "CARTE_BANCAIRE",
    "AIRTEL_MONEY",
    "MOOV_MONEY",
    "CHEQUE",
    "VIREMENT",
    "COMPTE_CLIENT",
    "MIXTE",
  ], { error: "Mode de paiement invalide" }),
  montantRecu: z.number().int().min(0, "Le montant reçu ne peut pas être négatif"),
  montantRendu: z.number().int().min(0, "Le montant rendu ne peut pas être négatif"),
  reference: z.string().max(100).optional(),
  paiements: z.array(PaiementInputSchema).optional(),
  remise: RemiseSchema.optional(),
  tableId: z.string().uuid("ID table invalide").optional().nullable(),
  clientId: z.string().uuid("ID client invalide").optional().nullable(),
  sessionCaisseId: z.string().uuid("ID session caisse invalide").optional().nullable(),
  adresseLivraison: z.string().max(300).optional(),
  telephoneLivraison: z.string().max(30).optional(),
  notesLivraison: z.string().max(500).optional(),
});

const CreateVenteEnAttenteSchema = z.object({
  typeVente: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"], {
    error: "Type de vente invalide",
  }),
  lignes: z
    .array(LigneVenteInputSchema)
    .min(1, "Au moins un produit doit être ajouté"),
  remise: RemiseSchema.optional(),
  tableId: z.string().uuid("ID table invalide").optional().nullable(),
  clientId: z.string().uuid("ID client invalide").optional().nullable(),
  sessionCaisseId: z.string().uuid("ID session caisse invalide").optional().nullable(),
  adresseLivraison: z.string().max(300).optional(),
  telephoneLivraison: z.string().max(30).optional(),
  notesLivraison: z.string().max(500).optional(),
});

const PayerVenteEnAttenteSchema = z.object({
  venteId: z.string().uuid("ID vente invalide"),
  modePaiement: z.enum([
    "ESPECES",
    "CARTE_BANCAIRE",
    "AIRTEL_MONEY",
    "MOOV_MONEY",
    "CHEQUE",
    "VIREMENT",
    "COMPTE_CLIENT",
    "MIXTE",
  ], { error: "Mode de paiement invalide" }),
  montantRecu: z.number().int().min(0, "Le montant reçu ne peut pas être négatif"),
  montantRendu: z.number().int().min(0, "Le montant rendu ne peut pas être négatif"),
  reference: z.string().max(100).optional(),
  paiements: z.array(PaiementInputSchema).optional(),
  sessionCaisseId: z.string().uuid("ID session caisse invalide"),
});

const AddToVenteEnAttenteSchema = z.object({
  venteId: z.string().uuid("ID vente invalide"),
  lignes: z
    .array(LigneVenteInputSchema)
    .min(1, "Au moins un produit doit être ajouté"),
});

const AnnulerVenteEnAttenteSchema = z.object({
  venteId: z.string().uuid("ID vente invalide"),
});

// Note: On utilise createAuthenticatedClient qui définit le contexte RLS
// via set_rls_context(). Cela permet aux politiques RLS de fonctionner
// avec l'auth PIN (JWT custom) en plus de Supabase Auth.

// ============================================================================
// TYPES
// ============================================================================

interface SupplementInput {
  nom: string;
  prix: number;
  supplementProduitId?: string;
}

interface LigneVenteInput {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  tauxTva: string;
  notes?: string;
  supplements?: SupplementInput[];
  totalSupplements?: number;
  remiseLigne?: { type: TypeRemise; valeur: number };
}

interface PaiementInput {
  mode: ModePaiement;
  montant: number;
  reference?: string;
}

interface CreateVenteInput {
  typeVente: TypeVente;
  lignes: LigneVenteInput[];
  modePaiement: ModePaiement;
  montantRecu: number;
  montantRendu: number;
  reference?: string;
  paiements?: PaiementInput[];
  remise?: { type: TypeRemise; valeur: number };
  tableId?: string;
  clientId?: string;
  sessionCaisseId?: string;
  adresseLivraison?: string;
  telephoneLivraison?: string;
  notesLivraison?: string;
}

interface CreateVenteEnAttenteInput {
  typeVente: TypeVente;
  lignes: LigneVenteInput[];
  remise?: { type: TypeRemise; valeur: number };
  tableId?: string;
  clientId?: string;
  sessionCaisseId?: string;
  adresseLivraison?: string;
  telephoneLivraison?: string;
  notesLivraison?: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/** Retourne le pourcentage TVA selon le type */
function getTauxTvaPercent(taux: string): number {
  if (taux === "EXONERE") return 0;
  if (taux === "REDUIT") return 10;
  return 18;
}

/** Calcule les totaux d'une liste de lignes */
function calculerTotaux(lignes: LigneVenteInput[], remise?: { type: TypeRemise; valeur: number }) {
  let sousTotal = 0;
  let totalTva = 0;

  const lignesCalculees = lignes.map((ligne) => {
    const prixUnitaire = ligne.prixUnitaire + (ligne.totalSupplements || 0);
    let prixLigne = prixUnitaire * ligne.quantite;

    // Appliquer la remise par ligne si présente
    if (ligne.remiseLigne) {
      const remiseLigneAmount =
        ligne.remiseLigne.type === "POURCENTAGE"
          ? Math.round((prixLigne * ligne.remiseLigne.valeur) / 100)
          : ligne.remiseLigne.valeur;
      prixLigne = Math.max(0, prixLigne - remiseLigneAmount);
    }

    const tauxPercent = getTauxTvaPercent(ligne.tauxTva);
    const montantTva = Math.round((prixLigne * tauxPercent) / 100);

    sousTotal += prixLigne;
    totalTva += montantTva;

    return {
      produit_id: ligne.produitId,
      quantite: ligne.quantite,
      prix_unitaire: prixUnitaire,
      taux_tva: tauxPercent,
      montant_tva: montantTva,
      sous_total: prixLigne,
      total: prixLigne + montantTva,
      notes: ligne.notes,
      supplements: ligne.supplements || [],
    };
  });

  // Calcul remise globale
  let totalRemise = 0;
  if (remise) {
    totalRemise =
      remise.type === "POURCENTAGE" ? Math.round((sousTotal * remise.valeur) / 100) : remise.valeur;
  }

  return {
    lignesCalculees,
    sousTotal,
    totalTva,
    totalRemise,
    totalFinal: sousTotal + totalTva - totalRemise,
  };
}

/** Génère le numéro de ticket unique via RPC atomique (SELECT FOR UPDATE) */
async function generateNumeroTicket(supabase: DbClient, etablissementId: string): Promise<string> {
  const { data, error } = await supabase.rpc("generate_numero_ticket" as never, {
    p_etablissement_id: etablissementId,
  } as never);

  if (error || !data) {
    throw new Error(`Erreur génération numéro ticket: ${error?.message || "pas de résultat"}`);
  }

  return data;
}

/** Déduit le stock des produits via RPC transactionnel (SELECT FOR UPDATE) */
async function deduireStock(
  supabase: DbClient,
  lignes: LigneVenteInput[],
  motifPrefix: string,
  reference: string
) {
  const lignesJson = lignes.map((l) => ({
    produit_id: l.produitId,
    quantite: l.quantite,
  }));

  const { error } = await supabase.rpc("deduire_stock_transactionnel" as never, {
    p_lignes: lignesJson,
    p_motif: motifPrefix,
    p_reference: reference,
  } as never);

  if (error) {
    console.error("Erreur déduction stock transactionnelle:", error);
    throw new Error(`Erreur déduction stock: ${error.message}`);
  }
}

/** Restitue le stock (annulation) */
async function restituerStock(
  supabase: DbClient,
  lignes: Array<{
    produit_id: string;
    quantite: number;
    gerer_stock?: boolean;
    stock_actuel?: number | null;
  }>,
  reference: string
) {
  for (const ligne of lignes) {
    if (!ligne.gerer_stock || ligne.stock_actuel === null) continue;

    const stockAvant = ligne.stock_actuel!;
    const stockApres = stockAvant + ligne.quantite;

    await supabase.from("produits").update({ stock_actuel: stockApres }).eq("id", ligne.produit_id);
    await supabase.from("mouvements_stock").insert({
      type: "ENTREE" as TypeMouvement,
      quantite: ligne.quantite,
      quantite_avant: stockAvant,
      quantite_apres: stockApres,
      motif: `Annulation - ${reference}`,
      reference,
      produit_id: ligne.produit_id,
    });
  }
}

/** Type pour une vente sérialisée (camelCase, avec nombres) */
interface SerializedVente {
  id: string;
  numeroTicket: string;
  type: string;
  statut: string;
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  typeRemise: string | null;
  valeurRemise: number | null;
  tableId: string | null;
  clientId: string | null;
  adresseLivraison: string | null;
  telephoneLivraison: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Sérialise une vente pour le client (Decimal -> number, snake_case -> camelCase) */
function serializeVente(vente: Record<string, unknown>): SerializedVente {
  return {
    id: vente.id as string,
    numeroTicket: vente.numero_ticket as string,
    type: vente.type as string,
    statut: vente.statut as string,
    sousTotal: Number(vente.sous_total),
    totalTva: Number(vente.total_tva),
    totalRemise: Number(vente.total_remise),
    totalFinal: Number(vente.total_final),
    typeRemise: (vente.type_remise as string | null) ?? null,
    valeurRemise: vente.valeur_remise ? Number(vente.valeur_remise) : null,
    tableId: (vente.table_id as string | null) ?? null,
    clientId: (vente.client_id as string | null) ?? null,
    adresseLivraison: (vente.adresse_livraison as string | null) ?? null,
    telephoneLivraison: (vente.telephone_livraison as string | null) ?? null,
    notes: (vente.notes as string | null) ?? null,
    createdAt: vente.created_at as string,
    updatedAt: vente.updated_at as string,
  };
}

// ============================================================================
// VÉRIFICATION DES PRIX SERVEUR
// ============================================================================

/**
 * Récupère les prix réels des produits depuis la DB et remplace les prix client
 * Sécurité: Ne jamais faire confiance aux prix envoyés par le client
 */
async function verifierPrixServeur(
  supabase: DbClient,
  lignes: LigneVenteInput[]
): Promise<LigneVenteInput[]> {
  const produitIds = lignes.map((l) => l.produitId);

  const { data: produits, error } = await supabase
    .from("produits")
    .select("id, prix_vente")
    .in("id", produitIds);

  if (error || !produits) {
    throw new Error("Impossible de vérifier les prix des produits");
  }

  const prixMap = new Map(produits.map((p) => [p.id, Number(p.prix_vente)]));

  return lignes.map((ligne) => {
    const prixServeur = prixMap.get(ligne.produitId);
    if (prixServeur === undefined) {
      throw new Error(`Produit introuvable: ${ligne.produitId}`);
    }
    return {
      ...ligne,
      prixUnitaire: prixServeur,
    };
  });
}

// ============================================================================
// AUTO-IMPRESSION BONS CUISINE / BAR
// ============================================================================

/**
 * Imprime automatiquement les bons cuisine et bar après création d'une vente.
 * Ne bloque jamais la vente en cas d'erreur d'impression.
 */
async function imprimerBonsPreparation(
  supabase: DbClient,
  etablissementId: string,
  venteData: {
    numeroTicket: string;
    typeVente: string;
    notes?: string | null;
    serveurNom: string;
    tableNumero?: string | null;
    tableZone?: string | null;
    clientNom?: string | null;
  },
  lignesAvecProduits: Array<{
    quantite: number;
    notes?: string | null;
    produitNom: string;
    categorieId?: string;
    categorieNom?: string;
    destinationPreparation?: string | null;
  }>
): Promise<void> {
  try {
    // Séparer les lignes cuisine vs bar en utilisant destination_preparation (DB) ou heuristique
    const lignesCuisine: PrintLineItem[] = [];
    const lignesBar: PrintLineItem[] = [];

    for (const ligne of lignesAvecProduits) {
      const printLine: PrintLineItem = {
        produitNom: ligne.produitNom,
        quantite: ligne.quantite,
        prixUnitaire: 0,
        total: 0,
        notes: ligne.notes ?? null,
        categorieId: ligne.categorieId,
        categorieNom: ligne.categorieNom,
      };

      const dest = ligne.destinationPreparation;
      if (dest === "AUCUNE") {
        // Pas d'impression pour cette ligne
        continue;
      } else if (dest === "BAR") {
        lignesBar.push(printLine);
      } else if (dest === "CUISINE") {
        lignesCuisine.push(printLine);
      } else {
        // AUTO ou null : utiliser l'heuristique basée sur le nom de catégorie
        if (isBarCategory(ligne.categorieNom)) {
          lignesBar.push(printLine);
        } else {
          lignesCuisine.push(printLine);
        }
      }
    }

    const now = new Date();

    // Impression bon cuisine
    if (lignesCuisine.length > 0) {
      const cuisinePrinter = await findPrinterByType(etablissementId, "CUISINE");
      if (cuisinePrinter) {
        const bonCuisineData: BonPreparationData = {
          numeroCommande: venteData.numeroTicket,
          dateCommande: now,
          typeVente: venteData.typeVente as "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER",
          tableNumero: venteData.tableNumero ?? null,
          tableZone: venteData.tableZone ?? null,
          clientNom: venteData.clientNom ?? null,
          serveurNom: venteData.serveurNom,
          lignes: lignesCuisine,
          notes: venteData.notes ?? null,
        };

        const escposData = generateBonCuisine(bonCuisineData, cuisinePrinter.largeurPapier as 58 | 80);
        const result = await sendToPrinter(cuisinePrinter, escposData);
        if (!result.success) {
          console.error("[imprimerBonsPreparation] Erreur impression cuisine:", result.error);
        }
      }
    }

    // Impression bon bar
    if (lignesBar.length > 0) {
      const barPrinter = await findPrinterByType(etablissementId, "BAR");
      if (barPrinter) {
        const bonBarData: BonPreparationData = {
          numeroCommande: venteData.numeroTicket,
          dateCommande: now,
          typeVente: venteData.typeVente as "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER",
          tableNumero: venteData.tableNumero ?? null,
          tableZone: venteData.tableZone ?? null,
          clientNom: venteData.clientNom ?? null,
          serveurNom: venteData.serveurNom,
          lignes: lignesBar,
          notes: venteData.notes ?? null,
        };

        const escposData = generateBonBar(bonBarData, barPrinter.largeurPapier as 58 | 80);
        const result = await sendToPrinter(barPrinter, escposData);
        if (!result.success) {
          console.error("[imprimerBonsPreparation] Erreur impression bar:", result.error);
        }
      }
    }
  } catch (error) {
    console.error("[imprimerBonsPreparation] Erreur non bloquante:", error);
  }
}

/**
 * Récupère les infos produits/catégories nécessaires pour l'impression
 * à partir des IDs de produits des lignes de vente.
 */
async function recupererInfosProduitsForPrint(
  supabase: DbClient,
  lignes: LigneVenteInput[]
): Promise<
  Array<{
    quantite: number;
    notes?: string | null;
    produitNom: string;
    categorieId?: string;
    categorieNom?: string;
    destinationPreparation?: string | null;
  }>
> {
  const produitIds = lignes.map((l) => l.produitId);
  const { data: produits } = await supabase
    .from("produits")
    .select("id, nom, categorie_id, categories(id, nom, destination_preparation)")
    .in("id", produitIds);

  const produitMap = new Map(
    (produits || []).map((p) => {
      const cat = p.categories as unknown as { id: string; nom: string; destination_preparation?: string | null } | null;
      return [p.id, { nom: p.nom, categorieId: cat?.id, categorieNom: cat?.nom, destinationPreparation: cat?.destination_preparation }];
    })
  );

  return lignes.map((l) => {
    const info = produitMap.get(l.produitId);
    return {
      quantite: l.quantite,
      notes: l.notes ?? null,
      produitNom: info?.nom ?? "Produit inconnu",
      categorieId: info?.categorieId,
      categorieNom: info?.categorieNom,
      destinationPreparation: info?.destinationPreparation,
    };
  });
}

/**
 * Récupère les infos table (numéro + zone) et client (nom) pour l'impression
 */
async function recupererInfosContextForPrint(
  supabase: DbClient,
  tableId?: string | null,
  clientId?: string | null
): Promise<{
  tableNumero: string | null;
  tableZone: string | null;
  clientNom: string | null;
}> {
  let tableNumero: string | null = null;
  let tableZone: string | null = null;
  let clientNom: string | null = null;

  if (tableId) {
    const { data: table } = await supabase
      .from("tables")
      .select("numero, zones(nom)")
      .eq("id", tableId)
      .single();
    if (table) {
      tableNumero = table.numero?.toString() ?? null;
      const zone = table.zones as unknown as { nom: string } | null;
      tableZone = zone?.nom ?? null;
    }
  }

  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("nom, prenom")
      .eq("id", clientId)
      .single();
    if (client) {
      clientNom = `${client.nom}${client.prenom ? " " + client.prenom : ""}`;
    }
  }

  return { tableNumero, tableZone, clientNom };
}

// ============================================================================
// CRÉATION DE VENTES
// ============================================================================

/**
 * Crée une nouvelle vente (payée immédiatement)
 * Note: Les serveurs ne peuvent pas encaisser, seulement prendre des commandes
 */
export async function createVente(input: CreateVenteInput) {
  // Validation Zod
  const parsed = CreateVenteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
  const etablissementId = user.etablissementId;

  // Les serveurs ne peuvent pas encaisser
  if (user.role === "SERVEUR") {
    return {
      success: false,
      error: "Les serveurs ne sont pas autorisés à encaisser. Utilisez la prise de commande.",
    };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  // Vérification du quota ventes mensuelles
  const salesQuota = await checkSalesQuota(supabase, etablissementId, { userRole: user.role });
  if (!salesQuota.allowed) {
    return { success: false, error: salesQuota.message };
  }

  try {
    // Vérifier les prix serveur (ne jamais faire confiance au client)
    const lignesVerifiees = await verifierPrixServeur(supabase, validatedInput.lignes as LigneVenteInput[]);

    // --- Enforcement tarification ---
    const enforcementCtx = await getEnforcementContext(
      supabase,
      etablissementId,
      user.userId,
      user.role
    );

    // Valider la remise globale si présente
    if (validatedInput.remise) {
      const tempTotaux = calculerTotaux(lignesVerifiees, undefined);
      const pourcentage =
        validatedInput.remise.type === "POURCENTAGE"
          ? validatedInput.remise.valeur
          : (validatedInput.remise.valeur / tempTotaux.sousTotal) * 100;
      const montant =
        validatedInput.remise.type === "POURCENTAGE"
          ? Math.round((tempTotaux.sousTotal * validatedInput.remise.valeur) / 100)
          : validatedInput.remise.valeur;

      const resultRemise = validerRemise(enforcementCtx, pourcentage, montant);
      if (!resultRemise.valide) {
        return {
          success: false,
          error: resultRemise.raison,
          data: resultRemise.necessiteApprobation
            ? { code: "APPROBATION_REQUISE", pourcentage, montant }
            : undefined,
        };
      }
    }

    // Valider le mode de paiement
    const { data: etab } = await supabase
      .from("etablissements")
      .select("modes_paiement_actifs, montant_minimum_vente")
      .eq("id", etablissementId)
      .single();

    if (etab?.modes_paiement_actifs) {
      const resultMode = validerModePaiement(
        validatedInput.modePaiement,
        etab.modes_paiement_actifs
      );
      if (!resultMode.valide) {
        return { success: false, error: resultMode.raison };
      }
    }

    const { lignesCalculees, sousTotal, totalTva, totalRemise, totalFinal } = calculerTotaux(
      lignesVerifiees,
      validatedInput.remise
    );

    // Valider le montant minimum
    if (etab?.montant_minimum_vente) {
      const resultMin = validerPrixMinimum(totalFinal, etab.montant_minimum_vente);
      if (!resultMin.valide) {
        return { success: false, error: resultMin.raison };
      }
    }

    const numeroTicket = await generateNumeroTicket(supabase, etablissementId);

    // Logger la remise dans l'audit si applicable
    if (validatedInput.remise && totalRemise > 0) {
      await createAuditLog({
        action: "REMISE_APPLIQUEE",
        entite: "ventes",
        description: `Remise ${validatedInput.remise.type === "POURCENTAGE" ? validatedInput.remise.valeur + "%" : validatedInput.remise.valeur + " FCFA"} appliquée (${totalRemise} FCFA)`,
        nouvelleValeur: {
          type: validatedInput.remise.type,
          valeur: validatedInput.remise.valeur,
          montantRemise: totalRemise,
          totalAvantRemise: sousTotal + totalTva,
        },
        utilisateurId: user.userId,
        etablissementId,
      });
    }
    // --- Fin enforcement tarification ---

    // Créer la vente
    const { data: vente, error: venteError } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: validatedInput.typeVente,
        statut: "PAYEE" as StatutVente,
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: validatedInput.remise?.type ?? null,
        valeur_remise: validatedInput.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: validatedInput.tableId ?? null,
        client_id: validatedInput.clientId ?? null,
        utilisateur_id: user.userId,
        session_caisse_id: validatedInput.sessionCaisseId ?? null,
        adresse_livraison: validatedInput.adresseLivraison ?? null,
        telephone_livraison: validatedInput.telephoneLivraison ?? null,
        notes: validatedInput.notesLivraison ?? null,
      })
      .select()
      .single();

    if (venteError) throw venteError;

    // Créer les lignes de vente
    const lignesData = lignesCalculees.map((l) => ({
      vente_id: vente.id,
      produit_id: l.produit_id,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      montant_tva: l.montant_tva,
      sous_total: l.sous_total,
      total: l.total,
      notes: l.notes,
    }));

    const { data: lignesVente } = await supabase.from("lignes_vente").insert(lignesData).select();

    // Créer les suppléments
    for (let i = 0; i < lignesCalculees.length; i++) {
      const supplements = lignesCalculees[i].supplements;
      if (supplements.length > 0 && lignesVente?.[i]) {
        await supabase.from("lignes_vente_supplements").insert(
          supplements.map((s) => ({
            ligne_vente_id: lignesVente[i].id,
            nom: s.nom,
            prix: s.prix,
            supplement_produit_id: s.supplementProduitId ?? null,
          }))
        );
      }
    }

    // Créer les paiements
    const paiementsData =
      validatedInput.modePaiement === "MIXTE" && validatedInput.paiements?.length
        ? validatedInput.paiements.map((p) => ({
            vente_id: vente.id,
            mode_paiement: p.mode,
            montant: p.montant,
            reference: p.reference ?? null,
          }))
        : [
            {
              vente_id: vente.id,
              mode_paiement: validatedInput.modePaiement,
              montant: totalFinal,
              reference: validatedInput.reference ?? null,
              montant_recu: validatedInput.modePaiement === "ESPECES" ? validatedInput.montantRecu : null,
              monnaie_rendue: validatedInput.modePaiement === "ESPECES" ? validatedInput.montantRendu : null,
            },
          ];

    await supabase.from("paiements").insert(paiementsData);

    // Déduire le stock
    await deduireStock(supabase, lignesVerifiees, "Vente - Ticket", numeroTicket);

    // Auto-impression des bons cuisine/bar (non bloquant)
    try {
      const lignesForPrint = await recupererInfosProduitsForPrint(supabase, lignesVerifiees);
      const contextForPrint = await recupererInfosContextForPrint(
        supabase,
        validatedInput.tableId,
        validatedInput.clientId
      );
      await imprimerBonsPreparation(supabase, etablissementId, {
        numeroTicket,
        typeVente: validatedInput.typeVente,
        notes: validatedInput.notesLivraison,
        serveurNom: `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "Caissier",
        tableNumero: contextForPrint.tableNumero,
        tableZone: contextForPrint.tableZone,
        clientNom: contextForPrint.clientNom,
      }, lignesForPrint);
    } catch (printError) {
      console.error("[createVente] Erreur impression (non bloquant):", printError);
    }

    revalidatePath("/caisse");
    revalidatePath("/rapports");
    revalidatePath("/stocks");

    return { success: true, data: { id: vente.id, numeroTicket } };
  } catch (error) {
    console.error("Erreur createVente:", error);
    return { success: false, error: "Erreur lors de la création de la vente" };
  }
}

/**
 * Crée une vente en attente (TABLE, LIVRAISON, EMPORTER)
 */
export async function createVenteEnAttente(input: CreateVenteEnAttenteInput) {
  // Validation Zod
  const parsed = CreateVenteEnAttenteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
  const etablissementId = user.etablissementId;

  if (validatedInput.typeVente === "DIRECT") {
    return {
      success: false,
      error: "La mise en attente n'est pas disponible pour les ventes directes",
    };
  }

  if (validatedInput.typeVente === "TABLE" && !validatedInput.tableId) {
    return { success: false, error: "Veuillez sélectionner une table" };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  // Vérification du quota ventes mensuelles
  const salesQuota = await checkSalesQuota(supabase, etablissementId, { userRole: user.role });
  if (!salesQuota.allowed) {
    return { success: false, error: salesQuota.message };
  }

  // Vérifier s'il y a déjà une commande en cours sur cette table
  if (validatedInput.tableId) {
    const { data: existing } = await supabase
      .from("ventes")
      .select("id, numero_ticket")
      .eq("table_id", validatedInput.tableId)
      .eq("statut", "EN_COURS")
      .single();

    if (existing) {
      return {
        success: false,
        error: `Table occupée (#${existing.numero_ticket}). Utilisez "Ajouter à la commande".`,
        existingVenteId: existing.id,
      };
    }
  }

  try {
    // Vérifier les prix serveur (ne jamais faire confiance au client)
    const lignesVerifiees = await verifierPrixServeur(supabase, validatedInput.lignes as LigneVenteInput[]);

    const numeroTicket = await generateNumeroTicket(supabase, etablissementId);
    const { lignesCalculees, sousTotal, totalTva, totalRemise, totalFinal } = calculerTotaux(
      lignesVerifiees,
      validatedInput.remise
    );

    // Créer la vente EN_COURS
    const { data: vente, error } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: validatedInput.typeVente,
        statut: "EN_COURS" as StatutVente,
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: validatedInput.remise?.type ?? null,
        valeur_remise: validatedInput.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: validatedInput.tableId ?? null,
        client_id: validatedInput.clientId ?? null,
        utilisateur_id: user.userId,
        session_caisse_id: validatedInput.sessionCaisseId ?? null,
        adresse_livraison: validatedInput.adresseLivraison ?? null,
        telephone_livraison: validatedInput.telephoneLivraison ?? null,
        notes: validatedInput.notesLivraison ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Créer les lignes
    const lignesData = lignesCalculees.map((l) => ({
      vente_id: vente.id,
      produit_id: l.produit_id,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      montant_tva: l.montant_tva,
      sous_total: l.sous_total,
      total: l.total,
      notes: l.notes,
    }));

    const { data: lignesVente } = await supabase.from("lignes_vente").insert(lignesData).select();

    // Créer les suppléments
    for (let i = 0; i < lignesCalculees.length; i++) {
      const supplements = lignesCalculees[i].supplements;
      if (supplements.length > 0 && lignesVente?.[i]) {
        await supabase.from("lignes_vente_supplements").insert(
          supplements.map((s) => ({
            ligne_vente_id: lignesVente[i].id,
            nom: s.nom,
            prix: s.prix,
            supplement_produit_id: s.supplementProduitId ?? null,
          }))
        );
      }
    }

    // Déduire le stock immédiatement (préparation cuisine)
    await deduireStock(supabase, lignesVerifiees, "Commande en attente - Ticket", numeroTicket);

    // Mettre à jour le statut de la table
    if (validatedInput.tableId) {
      await supabase.from("tables").update({ statut: "OCCUPEE" }).eq("id", validatedInput.tableId);
    }

    // Auto-impression des bons cuisine/bar (non bloquant)
    try {
      const lignesForPrint = await recupererInfosProduitsForPrint(supabase, lignesVerifiees);
      const contextForPrint = await recupererInfosContextForPrint(
        supabase,
        validatedInput.tableId,
        validatedInput.clientId
      );
      await imprimerBonsPreparation(supabase, etablissementId, {
        numeroTicket,
        typeVente: validatedInput.typeVente,
        notes: validatedInput.notesLivraison,
        serveurNom: `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "Serveur",
        tableNumero: contextForPrint.tableNumero,
        tableZone: contextForPrint.tableZone,
        clientNom: contextForPrint.clientNom,
      }, lignesForPrint);
    } catch (printError) {
      console.error("[createVenteEnAttente] Erreur impression (non bloquant):", printError);
    }

    revalidatePath("/caisse");
    revalidatePath("/salle");
    revalidatePath("/stocks");

    return { success: true, data: { id: vente.id, numeroTicket } };
  } catch (error) {
    console.error("Erreur createVenteEnAttente:", error);
    return { success: false, error: "Erreur lors de la création de la commande" };
  }
}

/**
 * Finalise le paiement d'une vente en attente
 * Note: Les serveurs ne peuvent pas encaisser
 */
export async function payerVenteEnAttente(input: {
  venteId: string;
  modePaiement: ModePaiement;
  montantRecu: number;
  montantRendu: number;
  reference?: string;
  paiements?: PaiementInput[];
  sessionCaisseId: string;
}) {
  // Validation Zod
  const parsed = PayerVenteEnAttenteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };

  // Les serveurs ne peuvent pas encaisser
  if (user.role === "SERVEUR") {
    return { success: false, error: "Les serveurs ne sont pas autorisés à encaisser" };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { data: vente } = await supabase
    .from("ventes")
    .select("id, numero_ticket, total_final, table_id")
    .eq("id", validatedInput.venteId)
    .eq("statut", "EN_COURS")
    .single();

  if (!vente) return { success: false, error: "Commande non trouvée ou déjà payée" };

  try {
    // Créer les paiements
    const paiementsData =
      validatedInput.modePaiement === "MIXTE" && validatedInput.paiements?.length
        ? validatedInput.paiements.map((p) => ({
            vente_id: vente.id,
            mode_paiement: p.mode,
            montant: p.montant,
            reference: p.reference ?? null,
          }))
        : [
            {
              vente_id: vente.id,
              mode_paiement: validatedInput.modePaiement,
              montant: Number(vente.total_final),
              reference: validatedInput.reference ?? null,
              montant_recu: validatedInput.modePaiement === "ESPECES" ? validatedInput.montantRecu : null,
              monnaie_rendue: validatedInput.modePaiement === "ESPECES" ? validatedInput.montantRendu : null,
            },
          ];

    await supabase.from("paiements").insert(paiementsData);

    // Mettre à jour la vente
    await supabase
      .from("ventes")
      .update({ statut: "PAYEE", session_caisse_id: validatedInput.sessionCaisseId })
      .eq("id", validatedInput.venteId);

    // Mettre à jour la table
    if (vente.table_id) {
      await supabase.from("tables").update({ statut: "A_NETTOYER" }).eq("id", vente.table_id);
    }

    revalidatePath("/caisse");
    revalidatePath("/salle");

    return { success: true, data: { id: vente.id, numeroTicket: vente.numero_ticket } };
  } catch (error) {
    console.error("Erreur payerVenteEnAttente:", error);
    return { success: false, error: "Erreur lors du paiement" };
  }
}

/**
 * Ajoute des articles à une vente en attente
 */
export async function addToVenteEnAttente(venteId: string, lignes: LigneVenteInput[]) {
  // Validation Zod
  const parsed = AddToVenteEnAttenteSchema.safeParse({ venteId, lignes });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { data: vente } = await supabase
    .from("ventes")
    .select("*")
    .eq("id", validatedInput.venteId)
    .eq("statut", "EN_COURS")
    .single();

  if (!vente) return { success: false, error: "Commande non trouvée" };

  try {
    // Vérifier les prix serveur
    const lignesVerifiees = await verifierPrixServeur(supabase, validatedInput.lignes as LigneVenteInput[]);

    const {
      lignesCalculees,
      sousTotal: addSousTotal,
      totalTva: addTotalTva,
    } = calculerTotaux(lignesVerifiees);

    // Recalculer les totaux
    const newSousTotal = Number(vente.sous_total) + addSousTotal;
    const newTotalTva = Number(vente.total_tva) + addTotalTva;
    let newTotalRemise = Number(vente.total_remise);

    if (vente.type_remise === "POURCENTAGE" && vente.valeur_remise) {
      newTotalRemise = Math.round((newSousTotal * Number(vente.valeur_remise)) / 100);
    }

    const newTotalFinal = newSousTotal + newTotalTva - newTotalRemise;

    // Créer les nouvelles lignes
    const lignesData = lignesCalculees.map((l) => ({
      vente_id: validatedInput.venteId,
      produit_id: l.produit_id,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      montant_tva: l.montant_tva,
      sous_total: l.sous_total,
      total: l.total,
      notes: l.notes,
    }));

    const { data: newLignes } = await supabase.from("lignes_vente").insert(lignesData).select();

    // Créer les suppléments
    for (let i = 0; i < lignesCalculees.length; i++) {
      const supplements = lignesCalculees[i].supplements;
      if (supplements.length > 0 && newLignes?.[i]) {
        await supabase.from("lignes_vente_supplements").insert(
          supplements.map((s) => ({
            ligne_vente_id: newLignes[i].id,
            nom: s.nom,
            prix: s.prix,
            supplement_produit_id: s.supplementProduitId ?? null,
          }))
        );
      }
    }

    // Mettre à jour les totaux de la vente
    await supabase
      .from("ventes")
      .update({
        sous_total: newSousTotal,
        total_tva: newTotalTva,
        total_remise: newTotalRemise,
        total_final: newTotalFinal,
      })
      .eq("id", validatedInput.venteId);

    // Déduire le stock
    await deduireStock(supabase, lignesVerifiees, "Ajout commande - Ticket", vente.numero_ticket);

    // Auto-impression des bons cuisine/bar pour les nouveaux articles (non bloquant)
    try {
      const lignesForPrint = await recupererInfosProduitsForPrint(supabase, lignesVerifiees);
      const contextForPrint = await recupererInfosContextForPrint(
        supabase,
        vente.table_id as string | null,
        vente.client_id as string | null
      );
      await imprimerBonsPreparation(supabase, user.etablissementId!, {
        numeroTicket: vente.numero_ticket as string,
        typeVente: vente.type as string,
        notes: vente.notes as string | null,
        serveurNom: `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "Serveur",
        tableNumero: contextForPrint.tableNumero,
        tableZone: contextForPrint.tableZone,
        clientNom: contextForPrint.clientNom,
      }, lignesForPrint);
    } catch (printError) {
      console.error("[addToVenteEnAttente] Erreur impression (non bloquant):", printError);
    }

    revalidatePath("/caisse");
    revalidatePath("/stocks");

    return { success: true };
  } catch (error) {
    console.error("Erreur addToVenteEnAttente:", error);
    return { success: false, error: "Erreur lors de l'ajout des articles" };
  }
}

/**
 * Annule une vente en attente et restitue le stock
 * Note: Les serveurs ne peuvent pas annuler de commandes
 */
export async function annulerVenteEnAttente(venteId: string) {
  // Validation Zod
  const parsed = AnnulerVenteEnAttenteSchema.safeParse({ venteId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };

  // Les serveurs ne peuvent pas annuler de commandes
  if (user.role === "SERVEUR") {
    return {
      success: false,
      error: "Les serveurs ne sont pas autorisés à annuler des commandes",
    };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { data: vente } = await supabase
    .from("ventes")
    .select("id, numero_ticket, table_id")
    .eq("id", validatedInput.venteId)
    .eq("statut", "EN_COURS")
    .single();

  if (!vente) return { success: false, error: "Commande non trouvée" };

  try {
    // Récupérer les lignes avec infos produit pour restitution stock
    const { data: lignes } = await supabase
      .from("lignes_vente")
      .select("produit_id, quantite, produits(gerer_stock, stock_actuel)")
      .eq("vente_id", validatedInput.venteId);

    // Restituer le stock
    const lignesWithStock = (lignes || []).map((l) => ({
      produit_id: l.produit_id,
      quantite: l.quantite,
      gerer_stock: (l.produits as unknown as { gerer_stock: boolean })?.gerer_stock,
      stock_actuel: (l.produits as unknown as { stock_actuel: number | null })?.stock_actuel,
    }));

    await restituerStock(supabase, lignesWithStock, vente.numero_ticket);

    // Annuler la vente
    await supabase.from("ventes").update({ statut: "ANNULEE" }).eq("id", validatedInput.venteId);

    // Libérer la table
    if (vente.table_id) {
      await supabase.from("tables").update({ statut: "LIBRE" }).eq("id", vente.table_id);
    }

    revalidatePath("/caisse");
    revalidatePath("/salle");
    revalidatePath("/stocks");

    return { success: true };
  } catch (error) {
    console.error("Erreur annulerVenteEnAttente:", error);
    return { success: false, error: "Erreur lors de l'annulation" };
  }
}

/**
 * Crée une vente sur compte client (crédit)
 * Note: Les serveurs ne peuvent pas encaisser ni mettre en compte
 */
export async function createVenteEnCompte(input: CreateVenteEnAttenteInput & { clientId: string }) {
  // Validation Zod (réutilise le schema en attente + clientId obligatoire)
  const parsed = CreateVenteEnAttenteSchema.extend({
    clientId: z.string().uuid("ID client invalide"),
  }).safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
  const etablissementId = user.etablissementId;

  // Les serveurs ne peuvent pas encaisser ni mettre en compte
  if (user.role === "SERVEUR") {
    return { success: false, error: "Les serveurs ne sont pas autorisés à mettre en compte" };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  // Vérification du quota ventes mensuelles
  const salesQuota = await checkSalesQuota(supabase, etablissementId, { userRole: user.role });
  if (!salesQuota.allowed) {
    return { success: false, error: salesQuota.message };
  }

  // Vérifier le client
  const { data: client } = await supabase
    .from("clients")
    .select("id, nom, prenom, credit_autorise, solde_credit, limit_credit")
    .eq("id", validatedInput.clientId)
    .eq("actif", true)
    .single();

  if (!client) return { success: false, error: "Client non trouvé" };
  if (!client.credit_autorise)
    return { success: false, error: "Client non autorisé à acheter en compte" };

  // Vérifier les prix serveur
  const lignesVerifiees = await verifierPrixServeur(supabase, validatedInput.lignes as LigneVenteInput[]);

  const { totalFinal, lignesCalculees, sousTotal, totalTva, totalRemise } = calculerTotaux(
    lignesVerifiees,
    validatedInput.remise
  );

  // Vérifier le crédit disponible
  const soldeActuel = Number(client.solde_credit) || 0;
  const limiteCredit = Number(client.limit_credit) || 0;
  const creditDisponible = limiteCredit - soldeActuel;

  if (totalFinal > creditDisponible) {
    return {
      success: false,
      error: `Crédit insuffisant. Disponible: ${creditDisponible.toLocaleString()} FCFA`,
    };
  }

  try {
    const numeroTicket = await generateNumeroTicket(supabase, etablissementId);

    // Créer la vente
    const { data: vente, error } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: validatedInput.typeVente,
        statut: "PAYEE" as StatutVente,
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: validatedInput.remise?.type ?? null,
        valeur_remise: validatedInput.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: validatedInput.tableId ?? null,
        client_id: validatedInput.clientId,
        utilisateur_id: user.userId,
        session_caisse_id: validatedInput.sessionCaisseId ?? null,
        notes: validatedInput.notesLivraison ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Créer les lignes
    const lignesData = lignesCalculees.map((l) => ({
      vente_id: vente.id,
      produit_id: l.produit_id,
      quantite: l.quantite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      montant_tva: l.montant_tva,
      sous_total: l.sous_total,
      total: l.total,
      notes: l.notes,
    }));

    await supabase.from("lignes_vente").insert(lignesData);

    // Créer le paiement
    await supabase.from("paiements").insert({
      vente_id: vente.id,
      mode_paiement: "COMPTE_CLIENT" as ModePaiement,
      montant: totalFinal,
      reference: `Client: ${client.nom}${client.prenom ? " " + client.prenom : ""}`,
    });

    // Incrémenter le solde crédit du client
    await supabase
      .from("clients")
      .update({ solde_credit: soldeActuel + totalFinal })
      .eq("id", validatedInput.clientId);

    // Déduire le stock
    await deduireStock(supabase, lignesVerifiees, "Vente en compte - Ticket", numeroTicket);

    // Mettre à jour la table
    if (validatedInput.tableId) {
      await supabase.from("tables").update({ statut: "A_NETTOYER" }).eq("id", validatedInput.tableId);
    }

    revalidatePath("/caisse");
    revalidatePath("/salle");
    revalidatePath("/stocks");
    revalidatePath("/clients");

    return { success: true, data: { id: vente.id, numeroTicket } };
  } catch (error) {
    console.error("Erreur createVenteEnCompte:", error);
    return { success: false, error: "Erreur lors de la création de la vente en compte" };
  }
}

// ============================================================================
// LECTURE
// ============================================================================

/**
 * Récupère les ventes du jour
 */
export async function getVentesJour() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("ventes")
    .select(
      `
      *,
      lignes_vente(*, produits(nom)),
      paiements(*),
      clients(nom, prenom)
    `
    )
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });

  return (data || []).map((v) => ({
    ...serializeVente(v),
    lignes: (v.lignes_vente || []).map((l: Record<string, unknown>) => ({
      ...l,
      prixUnitaire: Number(l.prix_unitaire),
      sousTotal: Number(l.sous_total),
      total: Number(l.total),
      produit: l.produits,
    })),
    paiements: v.paiements,
    client: v.clients,
  }));
}

/**
 * Stats du jour
 */
export async function getStatsJour() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId)
    return { totalVentes: 0, chiffreAffaires: 0, articlesVendus: 0, panierMoyen: 0 };

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("ventes")
    .select("total_final, lignes_vente(quantite)")
    .eq("statut", "PAYEE")
    .gte("created_at", today.toISOString());

  const ventes = data || [];
  const totalVentes = ventes.length;
  const chiffreAffaires = ventes.reduce((acc, v) => acc + Number(v.total_final), 0);
  const articlesVendus = ventes.reduce(
    (acc, v) =>
      acc +
      (v.lignes_vente || []).reduce((a: number, l: { quantite: number }) => a + l.quantite, 0),
    0
  );

  return {
    totalVentes,
    chiffreAffaires,
    articlesVendus,
    panierMoyen: totalVentes > 0 ? Math.round(chiffreAffaires / totalVentes) : 0,
  };
}

/**
 * Liste des ventes en attente
 */
export async function getVentesEnAttente() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return [];

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { data } = await supabase
    .from("ventes")
    .select(
      `
      *,
      lignes_vente(*, produits(id, nom), lignes_vente_supplements(*)),
      tables(id, numero, zones(nom)),
      clients(id, nom, prenom, telephone),
      utilisateurs(nom, prenom)
    `
    )
    .eq("statut", "EN_COURS")
    .order("created_at", { ascending: true });

  return (data || []).map((v) => ({
    ...serializeVente(v),
    lignes: (v.lignes_vente || []).map((l: Record<string, unknown>) => ({
      id: l.id,
      quantite: l.quantite,
      prixUnitaire: Number(l.prix_unitaire),
      sousTotal: Number(l.sous_total),
      total: Number(l.total),
      notes: l.notes,
      statutPreparation: l.statut_preparation,
      produitId: l.produit_id,
      produit: l.produits,
      supplements: ((l.lignes_vente_supplements as Array<Record<string, unknown>>) || []).map(
        (s) => ({
          id: s.id,
          nom: s.nom,
          prix: Number(s.prix),
        })
      ),
    })),
    table: v.tables,
    client: v.clients,
    utilisateur: v.utilisateurs,
  }));
}

/**
 * Vente en attente d'une table
 */
export async function getVenteEnAttenteByTable(tableId: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return null;

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { data } = await supabase
    .from("ventes")
    .select(
      `
      *,
      lignes_vente(*, produits(id, nom), lignes_vente_supplements(*)),
      tables(id, numero),
      clients(id, nom, prenom),
      utilisateurs(nom, prenom)
    `
    )
    .eq("table_id", tableId)
    .eq("statut", "EN_COURS")
    .single();

  if (!data) return null;

  return {
    ...serializeVente(data),
    lignes: (data.lignes_vente || []).map((l: Record<string, unknown>) => ({
      id: l.id,
      quantite: l.quantite,
      prixUnitaire: Number(l.prix_unitaire),
      sousTotal: Number(l.sous_total),
      total: Number(l.total),
      notes: l.notes,
      statutPreparation: l.statut_preparation,
      produitId: l.produit_id,
      produit: l.produits,
      supplements: ((l.lignes_vente_supplements as Array<Record<string, unknown>>) || []).map(
        (s) => ({
          id: s.id,
          nom: s.nom,
          prix: Number(s.prix),
        })
      ),
    })),
    table: data.tables,
    client: data.clients,
    utilisateur: data.utilisateurs,
  };
}

/**
 * Compte les ventes en attente
 */
export async function getVentesEnAttenteCount() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return 0;

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { count } = await supabase
    .from("ventes")
    .select("*", { count: "exact", head: true })
    .eq("statut", "EN_COURS");

  return count ?? 0;
}
