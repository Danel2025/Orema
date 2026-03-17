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
    const prixLigne = prixUnitaire * ligne.quantite;
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

  // Calcul remise
  let totalRemise = 0;
  if (remise) {
    totalRemise = remise.type === "POURCENTAGE"
      ? Math.round((sousTotal * remise.valeur) / 100)
      : remise.valeur;
  }

  return {
    lignesCalculees,
    sousTotal,
    totalTva,
    totalRemise,
    totalFinal: sousTotal + totalTva - totalRemise,
  };
}

/** Génère le numéro de ticket unique */
async function generateNumeroTicket(supabase: DbClient, etablissementId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const { data: etab } = await supabase
    .from("etablissements")
    .select("dernier_numero_ticket, date_numero_ticket")
    .eq("id", etablissementId)
    .single();

  const lastDate = etab?.date_numero_ticket
    ? new Date(etab.date_numero_ticket).toISOString().slice(0, 10).replace(/-/g, "")
    : "";

  const numero = lastDate !== dateStr ? 1 : (etab?.dernier_numero_ticket || 0) + 1;

  await supabase
    .from("etablissements")
    .update({ dernier_numero_ticket: numero, date_numero_ticket: today.toISOString() })
    .eq("id", etablissementId);

  return `${dateStr}${numero.toString().padStart(5, "0")}`;
}

/** Déduit le stock des produits et crée les mouvements */
async function deduireStock(
  supabase: DbClient,
  lignes: LigneVenteInput[],
  motifPrefix: string,
  reference: string
) {
  // Récupérer tous les produits en une seule requête
  const produitIds = lignes.map((l) => l.produitId);
  const { data: produits } = await supabase
    .from("produits")
    .select("id, gerer_stock, stock_actuel")
    .in("id", produitIds);

  const produitsMap = new Map(produits?.map((p) => [p.id, p]) || []);

  // Préparer les updates et mouvements
  for (const ligne of lignes) {
    const produit = produitsMap.get(ligne.produitId);
    if (!produit?.gerer_stock || produit.stock_actuel === null) continue;

    const stockAvant = produit.stock_actuel;
    const stockApres = stockAvant - ligne.quantite;

    await supabase.from("produits").update({ stock_actuel: stockApres }).eq("id", ligne.produitId);
    await supabase.from("mouvements_stock").insert({
      type: "SORTIE" as TypeMouvement,
      quantite: ligne.quantite,
      quantite_avant: stockAvant,
      quantite_apres: stockApres,
      motif: `${motifPrefix} - ${reference}`,
      reference,
      produit_id: ligne.produitId,
    });
  }
}

/** Restitue le stock (annulation) */
async function restituerStock(
  supabase: DbClient,
  lignes: Array<{ produit_id: string; quantite: number; gerer_stock?: boolean; stock_actuel?: number | null }>,
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
    notes: (vente.notes as string | null) ?? null,
    createdAt: vente.created_at as string,
    updatedAt: vente.updated_at as string,
  };
}

// ============================================================================
// CRÉATION DE VENTES
// ============================================================================

/**
 * Crée une nouvelle vente (payée immédiatement)
 * Note: Les serveurs ne peuvent pas encaisser, seulement prendre des commandes
 */
export async function createVente(input: CreateVenteInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
  const etablissementId = user.etablissementId;

  // Les serveurs ne peuvent pas encaisser
  if (user.role === "SERVEUR") {
    return { success: false, error: "Les serveurs ne sont pas autorisés à encaisser. Utilisez la prise de commande." };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  try {
    const numeroTicket = await generateNumeroTicket(supabase, etablissementId);
    const { lignesCalculees, sousTotal, totalTva, totalRemise, totalFinal } = calculerTotaux(input.lignes, input.remise);

    // Créer la vente
    const { data: vente, error: venteError } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: input.typeVente,
        statut: "PAYEE" as StatutVente,
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: input.remise?.type ?? null,
        valeur_remise: input.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: input.tableId ?? null,
        client_id: input.clientId ?? null,
        utilisateur_id: user.userId,
        session_caisse_id: input.sessionCaisseId ?? null,
        adresse_livraison: input.adresseLivraison ?? null,
        notes: input.notesLivraison ?? null,
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
    const paiementsData = input.modePaiement === "MIXTE" && input.paiements?.length
      ? input.paiements.map((p) => ({
          vente_id: vente.id,
          mode_paiement: p.mode,
          montant: p.montant,
          reference: p.reference ?? null,
        }))
      : [{
          vente_id: vente.id,
          mode_paiement: input.modePaiement,
          montant: totalFinal,
          reference: input.reference ?? null,
          montant_recu: input.modePaiement === "ESPECES" ? input.montantRecu : null,
          monnaie_rendue: input.modePaiement === "ESPECES" ? input.montantRendu : null,
        }];

    await supabase.from("paiements").insert(paiementsData);

    // Déduire le stock
    await deduireStock(supabase, input.lignes, "Vente - Ticket", numeroTicket);

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
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Vous devez être connecté" };
  if (!user.etablissementId) return { success: false, error: "Aucun établissement associé" };
  const etablissementId = user.etablissementId;

  if (input.typeVente === "DIRECT") {
    return { success: false, error: "La mise en attente n'est pas disponible pour les ventes directes" };
  }

  if (input.typeVente === "TABLE" && !input.tableId) {
    return { success: false, error: "Veuillez sélectionner une table" };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  // Vérifier s'il y a déjà une commande en cours sur cette table
  if (input.tableId) {
    const { data: existing } = await supabase
      .from("ventes")
      .select("id, numero_ticket")
      .eq("table_id", input.tableId)
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
    const numeroTicket = await generateNumeroTicket(supabase, etablissementId);
    const { lignesCalculees, sousTotal, totalTva, totalRemise, totalFinal } = calculerTotaux(input.lignes, input.remise);

    // Créer la vente EN_COURS
    const { data: vente, error } = await supabase
      .from("ventes")
      .insert({
        numero_ticket: numeroTicket,
        type: input.typeVente,
        statut: "EN_COURS" as StatutVente,
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: input.remise?.type ?? null,
        valeur_remise: input.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: input.tableId ?? null,
        client_id: input.clientId ?? null,
        utilisateur_id: user.userId,
        session_caisse_id: input.sessionCaisseId ?? null,
        adresse_livraison: input.adresseLivraison ?? null,
        notes: input.notesLivraison ?? null,
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
    await deduireStock(supabase, input.lignes, "Commande en attente - Ticket", numeroTicket);

    // Mettre à jour le statut de la table
    if (input.tableId) {
      await supabase.from("tables").update({ statut: "OCCUPEE" }).eq("id", input.tableId);
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
    .eq("id", input.venteId)
    .eq("statut", "EN_COURS")
    .single();

  if (!vente) return { success: false, error: "Commande non trouvée ou déjà payée" };

  try {
    // Créer les paiements
    const paiementsData = input.modePaiement === "MIXTE" && input.paiements?.length
      ? input.paiements.map((p) => ({
          vente_id: vente.id,
          mode_paiement: p.mode,
          montant: p.montant,
          reference: p.reference ?? null,
        }))
      : [{
          vente_id: vente.id,
          mode_paiement: input.modePaiement,
          montant: Number(vente.total_final),
          reference: input.reference ?? null,
          montant_recu: input.modePaiement === "ESPECES" ? input.montantRecu : null,
          monnaie_rendue: input.modePaiement === "ESPECES" ? input.montantRendu : null,
        }];

    await supabase.from("paiements").insert(paiementsData);

    // Mettre à jour la vente
    await supabase
      .from("ventes")
      .update({ statut: "PAYEE", session_caisse_id: input.sessionCaisseId })
      .eq("id", input.venteId);

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
    .eq("id", venteId)
    .eq("statut", "EN_COURS")
    .single();

  if (!vente) return { success: false, error: "Commande non trouvée" };

  try {
    const { lignesCalculees, sousTotal: addSousTotal, totalTva: addTotalTva } = calculerTotaux(lignes);

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
      vente_id: venteId,
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
    await supabase.from("ventes").update({
      sous_total: newSousTotal,
      total_tva: newTotalTva,
      total_remise: newTotalRemise,
      total_final: newTotalFinal,
    }).eq("id", venteId);

    // Déduire le stock
    await deduireStock(supabase, lignes, "Ajout commande - Ticket", vente.numero_ticket);

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
 */
export async function annulerVenteEnAttente(venteId: string) {
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
    .select("id, numero_ticket, table_id")
    .eq("id", venteId)
    .eq("statut", "EN_COURS")
    .single();

  if (!vente) return { success: false, error: "Commande non trouvée" };

  try {
    // Récupérer les lignes avec infos produit pour restitution stock
    const { data: lignes } = await supabase
      .from("lignes_vente")
      .select("produit_id, quantite, produits(gerer_stock, stock_actuel)")
      .eq("vente_id", venteId);

    // Restituer le stock
    const lignesWithStock = (lignes || []).map((l) => ({
      produit_id: l.produit_id,
      quantite: l.quantite,
      gerer_stock: (l.produits as { gerer_stock: boolean })?.gerer_stock,
      stock_actuel: (l.produits as { stock_actuel: number | null })?.stock_actuel,
    }));

    await restituerStock(supabase, lignesWithStock, vente.numero_ticket);

    // Annuler la vente
    await supabase.from("ventes").update({ statut: "ANNULEE" }).eq("id", venteId);

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
  if (!input.clientId) {
    return { success: false, error: "Un client doit être sélectionné pour la mise en compte" };
  }

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

  // Vérifier le client
  const { data: client } = await supabase
    .from("clients")
    .select("id, nom, prenom, credit_autorise, solde_credit, limit_credit")
    .eq("id", input.clientId)
    .eq("actif", true)
    .single();

  if (!client) return { success: false, error: "Client non trouvé" };
  if (!client.credit_autorise) return { success: false, error: "Client non autorisé à acheter en compte" };

  const { totalFinal, lignesCalculees, sousTotal, totalTva, totalRemise } = calculerTotaux(input.lignes, input.remise);

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
        type: input.typeVente,
        statut: "PAYEE" as StatutVente,
        sous_total: sousTotal,
        total_tva: totalTva,
        total_remise: totalRemise,
        total_final: totalFinal,
        type_remise: input.remise?.type ?? null,
        valeur_remise: input.remise?.valeur ?? null,
        etablissement_id: etablissementId,
        table_id: input.tableId ?? null,
        client_id: input.clientId,
        utilisateur_id: user.userId,
        session_caisse_id: input.sessionCaisseId ?? null,
        notes: input.notesLivraison ?? null,
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
      reference: `Client: ${client.nom}${client.prenom ? ' ' + client.prenom : ''}`,
    });

    // Incrémenter le solde crédit du client
    await supabase
      .from("clients")
      .update({ solde_credit: soldeActuel + totalFinal })
      .eq("id", input.clientId);

    // Déduire le stock
    await deduireStock(supabase, input.lignes, "Vente en compte - Ticket", numeroTicket);

    // Mettre à jour la table
    if (input.tableId) {
      await supabase.from("tables").update({ statut: "A_NETTOYER" }).eq("id", input.tableId);
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
    .select(`
      *,
      lignes_vente(*, produits(nom)),
      paiements(*),
      clients(nom, prenom)
    `)
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
  if (!user || !user.etablissementId) return { totalVentes: 0, chiffreAffaires: 0, articlesVendus: 0, panierMoyen: 0 };

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
    (acc, v) => acc + (v.lignes_vente || []).reduce((a: number, l: { quantite: number }) => a + l.quantite, 0),
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
    .select(`
      *,
      lignes_vente(*, produits(id, nom), lignes_vente_supplements(*)),
      tables(id, numero, zones(nom)),
      clients(id, nom, prenom, telephone),
      utilisateurs(nom, prenom)
    `)
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
      supplements: ((l.lignes_vente_supplements as Array<Record<string, unknown>>) || []).map((s) => ({
        id: s.id,
        nom: s.nom,
        prix: Number(s.prix),
      })),
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
    .select(`
      *,
      lignes_vente(*, produits(id, nom), lignes_vente_supplements(*)),
      tables(id, numero),
      clients(id, nom, prenom),
      utilisateurs(nom, prenom)
    `)
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
      supplements: ((l.lignes_vente_supplements as Array<Record<string, unknown>>) || []).map((s) => ({
        id: s.id,
        nom: s.nom,
        prix: Number(s.prix),
      })),
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
