"use server";

/**
 * Server Actions pour la gestion des tables (plan de salle)
 * Migré de Prisma vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, db } from "@/lib/db";
import type { StatutTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  tableSchema,
  tablePositionSchema,
  tableStatutSchema,
  type TableFormData,
  type TablePositionData,
  type TableStatutData,
  type StatutTableType,
} from "@/schemas/table.schema";

/**
 * Récupère toutes les tables de l'établissement
 */
export async function getTables(options?: { includeInactive?: boolean; zoneId?: string }) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    throw new Error("Etablissement non trouvé. Veuillez vous connecter.");
  }
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Récupérer les tables
  const tables = await db.getTables(supabase, etablissementId, {
    active: options?.includeInactive ? undefined : true,
    zoneId: options?.zoneId,
  });

  // Récupérer les zones pour enrichir les données
  const zones = await db.getZones(supabase, etablissementId);
  const zonesMap = new Map(zones.map((z) => [z.id, z]));

  // Récupérer toutes les ventes en cours pour toutes les tables en une seule requête
  const tableIds = tables.map((t) => t.id);
  const { data: allVentes } = await supabase
    .from("ventes")
    .select("id, table_id, numero_ticket, total_final, created_at")
    .in("table_id", tableIds)
    .eq("statut", "EN_COURS");

  // Récupérer le nombre de lignes pour toutes les ventes en une seule requête
  const venteIds = (allVentes ?? []).map((v) => v.id);
  const { data: lignesCounts } = venteIds.length > 0
    ? await supabase
        .from("lignes_vente")
        .select("vente_id")
        .in("vente_id", venteIds)
    : { data: [] };

  // Créer un map pour compter les lignes par vente
  const lignesCountMap = new Map<string, number>();
  (lignesCounts ?? []).forEach((ligne) => {
    const count = lignesCountMap.get(ligne.vente_id) ?? 0;
    lignesCountMap.set(ligne.vente_id, count + 1);
  });

  // Grouper les ventes par table
  const ventesParTable = new Map<string, typeof allVentes>();
  (allVentes ?? []).forEach((vente) => {
    if (!vente.table_id) return; // Ignorer les ventes sans table
    const tableVentes = ventesParTable.get(vente.table_id) ?? [];
    tableVentes.push(vente);
    ventesParTable.set(vente.table_id, tableVentes);
  });

  // Assembler les données des tables
  const tablesWithRelations = tables.map((table) => {
    const tableVentes = ventesParTable.get(table.id) ?? [];
    const ventesWithCount = tableVentes.map((vente) => ({
      id: vente.id,
      numeroTicket: vente.numero_ticket,
      totalFinal: Number(vente.total_final),
      createdAt: vente.created_at,
      _count: { lignes: lignesCountMap.get(vente.id) ?? 0 },
    }));

    return {
      ...table,
      // Map snake_case to camelCase for compatibility
      positionX: table.position_x,
      positionY: table.position_y,
      zoneId: table.zone_id,
      etablissementId: table.etablissement_id,
      createdAt: table.created_at,
      updatedAt: table.updated_at,
      zone: table.zone_id ? zonesMap.get(table.zone_id) ?? null : null,
      ventes: ventesWithCount,
    };
  });

  // Trier par zone puis par numéro
  return tablesWithRelations.sort((a, b) => {
    const zoneA = a.zone?.ordre ?? 0;
    const zoneB = b.zone?.ordre ?? 0;
    if (zoneA !== zoneB) return zoneA - zoneB;
    return a.numero.localeCompare(b.numero);
  });
}

/**
 * Récupère une table par son ID
 */
export async function getTableById(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    throw new Error("Etablissement non trouvé. Veuillez vous connecter.");
  }
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  const table = await db.getTableById(supabase, id);

  if (!table) {
    return null;
  }

  // Récupérer la zone
  const zone = table.zone_id ? await db.getZoneById(supabase, table.zone_id) : null;

  // Récupérer les ventes en cours avec lignes
  const { data: ventes } = await supabase
    .from("ventes")
    .select("*")
    .eq("table_id", id)
    .eq("statut", "EN_COURS");

  const ventesWithRelations = await Promise.all(
    (ventes ?? []).map(async (vente) => {
      // Récupérer les lignes avec produit
      const { data: lignes } = await supabase
        .from("lignes_vente")
        .select("*, produits(id, nom)")
        .eq("vente_id", vente.id);

      // Récupérer l'utilisateur
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select("id, nom, prenom")
        .eq("id", vente.utilisateur_id)
        .single();

      return {
        id: vente.id,
        numero_ticket: vente.numero_ticket,
        created_at: vente.created_at,
        sous_total: Number(vente.sous_total),
        total_tva: Number(vente.total_tva),
        total_remise: Number(vente.total_remise),
        total_final: Number(vente.total_final),
        valeur_remise: vente.valeur_remise ? Number(vente.valeur_remise) : null,
        frais_livraison: vente.frais_livraison ? Number(vente.frais_livraison) : null,
        lignes: (lignes ?? []).map((ligne) => ({
          id: ligne.id,
          quantite: ligne.quantite,
          prix_unitaire: Number(ligne.prix_unitaire),
          total: Number(ligne.total),
          produit: ligne.produits,
        })),
        utilisateur,
      };
    })
  );

  return {
    ...table,
    positionX: table.position_x,
    positionY: table.position_y,
    zoneId: table.zone_id,
    etablissementId: table.etablissement_id,
    createdAt: table.created_at,
    updatedAt: table.updated_at,
    zone,
    ventes: ventesWithRelations,
  };
}

/**
 * Récupère toutes les zones de l'établissement
 */
export async function getZones() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    throw new Error("Etablissement non trouvé. Veuillez vous connecter.");
  }
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  const zones = await db.getZones(supabase, etablissementId, { active: true });

  return zones;
}

/**
 * Crée une nouvelle zone
 */
export async function createZone(data: {
  nom: string;
  description?: string;
  couleur?: string;
  position_x?: number;
  position_y?: number;
  largeur?: number;
  hauteur?: number;
}) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    return {
      success: false,
      error: "Etablissement non trouvé. Veuillez vous connecter.",
    };
  }
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Vérifier l'unicité du nom
  const exists = await db.zoneNomExists(supabase, etablissementId, data.nom);

  if (exists) {
    return {
      success: false,
      error: "Une zone avec ce nom existe déjà",
    };
  }

  // Calculer l'ordre (dernier + 1)
  const lastZone = await db.getLastZone(supabase, etablissementId);
  const ordre = (lastZone?.ordre ?? 0) + 1;

  const zone = await db.createZone(supabase, {
    nom: data.nom,
    description: data.description,
    couleur: data.couleur,
    ordre,
    etablissement_id: etablissementId,
    active: true,
    position_x: data.position_x,
    position_y: data.position_y,
    largeur: data.largeur ?? 200,
    hauteur: data.hauteur ?? 150,
  });

  revalidatePath("/salle");

  return {
    success: true,
    data: zone,
  };
}

/**
 * Crée une nouvelle table
 */
export async function createTable(data: TableFormData) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Validation
  const validatedData = tableSchema.parse(data);

  // Vérifier l'unicité du numéro
  const exists = await db.tableNumeroExists(supabase, etablissementId, validatedData.numero);

  if (exists) {
    return {
      success: false,
      error: "Une table avec ce numéro existe déjà",
    };
  }

  // Calculer la position par défaut si non spécifiée
  let positionX = validatedData.positionX;
  let positionY = validatedData.positionY;

  if (positionX === undefined || positionY === undefined) {
    // Compter les tables existantes pour calculer la position en grille
    const tableCount = await db.countTables(supabase, etablissementId);

    // Configuration de la grille
    const GRID_START_X = 50;
    const GRID_START_Y = 50;
    const GRID_SPACING_X = 100;
    const GRID_SPACING_Y = 100;
    const TABLES_PER_ROW = 5;

    // Calculer la position en grille
    const column = tableCount % TABLES_PER_ROW;
    const row = Math.floor(tableCount / TABLES_PER_ROW);

    positionX = positionX ?? GRID_START_X + column * GRID_SPACING_X;
    positionY = positionY ?? GRID_START_Y + row * GRID_SPACING_Y;
  }

  const largeur = validatedData.largeur ?? (validatedData.forme === "RECTANGULAIRE" ? 120 : 80);
  const hauteur = validatedData.hauteur ?? 80;

  // Créer la table
  const table = await db.createTable(supabase, {
    numero: validatedData.numero,
    capacite: validatedData.capacite,
    forme: validatedData.forme,
    zone_id: validatedData.zoneId || null,
    position_x: positionX,
    position_y: positionY,
    largeur,
    hauteur,
    active: validatedData.active,
    statut: "LIBRE" as StatutTable,
    etablissement_id: etablissementId,
  });

  revalidatePath("/salle");

  return {
    success: true,
    data: table,
  };
}

/**
 * Met à jour une table
 */
export async function updateTable(id: string, data: TableFormData) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Validation
  const validatedData = tableSchema.parse(data);

  // Vérifier que la table existe (RLS filtre par établissement)
  const existing = await db.getTableById(supabase, id);

  if (!existing) {
    return {
      success: false,
      error: "Table non trouvée",
    };
  }

  // Vérifier l'unicité du numéro (sauf pour la table actuelle)
  const duplicate = await db.tableNumeroExists(
    supabase,
    etablissementId,
    validatedData.numero,
    id
  );

  if (duplicate) {
    return {
      success: false,
      error: "Une table avec ce numéro existe déjà",
    };
  }

  // Mettre à jour
  const table = await db.updateTable(supabase, id, {
    numero: validatedData.numero,
    capacite: validatedData.capacite,
    forme: validatedData.forme,
    zone_id: validatedData.zoneId || null,
    position_x: validatedData.positionX,
    position_y: validatedData.positionY,
    largeur: validatedData.largeur,
    hauteur: validatedData.hauteur,
    active: validatedData.active,
  });

  revalidatePath("/salle");

  return {
    success: true,
    data: table,
  };
}

/**
 * Supprime une table
 */
export async function deleteTable(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  // Vérifier que la table existe (RLS filtre par établissement)
  const table = await db.getTableById(supabase, id);

  if (!table) {
    return {
      success: false,
      error: "Table non trouvée",
    };
  }

  // Vérifier qu'il n'y a pas de vente en cours
  const { count: ventesEnCours } = await supabase
    .from("ventes")
    .select("*", { count: "exact", head: true })
    .eq("table_id", id)
    .eq("statut", "EN_COURS");

  if ((ventesEnCours ?? 0) > 0) {
    return {
      success: false,
      error: "Impossible de supprimer cette table car elle a une vente en cours",
    };
  }

  // Supprimer
  await db.deleteTable(supabase, id);

  revalidatePath("/salle");

  return {
    success: true,
  };
}

/**
 * Met à jour la position d'une table (drag & drop)
 */
export async function updateTablePosition(data: TablePositionData) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  // Validation
  const validatedData = tablePositionSchema.parse(data);

  // Vérifier que la table existe (RLS filtre par établissement)
  const table = await db.getTableById(supabase, validatedData.id);

  if (!table) {
    return {
      success: false,
      error: "Table non trouvée",
    };
  }

  // Mettre à jour la position
  await db.updateTablePosition(supabase, validatedData.id, {
    x: validatedData.positionX,
    y: validatedData.positionY,
  });

  // Pas de revalidatePath ici pour éviter le re-render pendant le drag

  return {
    success: true,
  };
}

/**
 * Met à jour les positions de plusieurs tables (batch)
 */
export async function updateTablesPositions(positions: TablePositionData[]) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  // Préparer les positions pour le batch update
  const positionsData = positions.map((pos) => ({
    id: pos.id,
    position_x: pos.positionX,
    position_y: pos.positionY,
  }));

  // Note: En mode strict, on devrait vérifier chaque table appartient à l'établissement
  // Pour la performance, on fait un batch update direct
  await db.updateTablesPositions(supabase, positionsData);

  revalidatePath("/salle");

  return {
    success: true,
  };
}

/**
 * Met à jour le statut d'une table
 */
export async function updateTableStatut(data: TableStatutData) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  // Validation
  const validatedData = tableStatutSchema.parse(data);

  // Vérifier que la table existe (RLS filtre par établissement)
  const table = await db.getTableById(supabase, validatedData.id);

  if (!table) {
    return {
      success: false,
      error: "Table non trouvée",
    };
  }

  // Mettre à jour le statut
  const updated = await db.updateTableStatut(
    supabase,
    validatedData.id,
    validatedData.statut as StatutTable
  );

  revalidatePath("/salle");

  return {
    success: true,
    data: updated,
  };
}

/**
 * Libère une table (statut = LIBRE)
 */
export async function libererTable(id: string) {
  return updateTableStatut({ id, statut: "LIBRE" as StatutTableType });
}

/**
 * Statistiques des tables
 */
export async function getTablesStats() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    throw new Error("Etablissement non trouvé. Veuillez vous connecter.");
  }
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Récupérer toutes les tables actives
  const tables = await db.getTables(supabase, etablissementId, { active: true });

  const stats = {
    total: tables.length,
    libres: tables.filter((t) => t.statut === "LIBRE").length,
    occupees: tables.filter((t) => t.statut === "OCCUPEE").length,
    enPreparation: tables.filter((t) => t.statut === "EN_PREPARATION").length,
    additionDemandee: tables.filter((t) => t.statut === "ADDITION").length,
    aNettoyer: tables.filter((t) => t.statut === "A_NETTOYER").length,
    capaciteTotale: tables.reduce((acc, t) => acc + t.capacite, 0),
    capaciteDisponible: tables
      .filter((t) => t.statut === "LIBRE")
      .reduce((acc, t) => acc + t.capacite, 0),
  };

  return stats;
}

/**
 * Transfère une vente d'une table à une autre
 */
export async function transferTable(data: {
  fromTableId: string;
  toTableId: string;
  markSourceAsClean?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  // Vérifier que les deux tables existent (RLS filtre par établissement)
  const [fromTable, toTable] = await Promise.all([
    db.getTableById(supabase, data.fromTableId),
    db.getTableById(supabase, data.toTableId),
  ]);

  if (!fromTable) {
    return {
      success: false,
      error: "Table source non trouvée",
    };
  }

  if (!toTable) {
    return {
      success: false,
      error: "Table destination non trouvée",
    };
  }

  // Récupérer la vente en cours sur la table source
  const { data: ventesSource } = await supabase
    .from("ventes")
    .select("*")
    .eq("table_id", data.fromTableId)
    .eq("statut", "EN_COURS")
    .limit(1);

  const venteEnCours = ventesSource?.[0];

  if (!venteEnCours) {
    return {
      success: false,
      error: "Aucune commande en cours sur cette table",
    };
  }

  // Vérifier si la table de destination a une commande en cours
  const { data: ventesDestination } = await supabase
    .from("ventes")
    .select("id")
    .eq("table_id", data.toTableId)
    .eq("statut", "EN_COURS")
    .limit(1);

  if (ventesDestination && ventesDestination.length > 0) {
    return {
      success: false,
      error: "MERGE_REQUIRED",
      message:
        "La table de destination a une commande en cours. Voulez-vous fusionner les commandes?",
      targetVenteId: ventesDestination[0].id,
    };
  }

  // Déterminer le statut de la table source après transfert
  const newSourceStatus = data.markSourceAsClean ? "A_NETTOYER" : "LIBRE";

  // Effectuer le transfert (opérations séquentielles)
  // 1. Transférer la vente vers la nouvelle table
  await supabase
    .from("ventes")
    .update({ table_id: data.toTableId, updated_at: new Date().toISOString() })
    .eq("id", venteEnCours.id);

  // 2. Mettre à jour le statut de l'ancienne table
  await db.updateTableStatut(supabase, data.fromTableId, newSourceStatus as StatutTable);

  // 3. Occuper la nouvelle table avec le même statut que l'ancienne
  await db.updateTableStatut(supabase, data.toTableId, fromTable.statut);

  revalidatePath("/salle");
  revalidatePath("/caisse");

  return {
    success: true,
    data: {
      fromTableNumero: fromTable.numero,
      toTableNumero: toTable.numero,
    },
  };
}

/**
 * Fusionne deux commandes de tables différentes
 */
export async function mergeTableOrders(data: {
  sourceVenteId: string;
  targetVenteId: string;
  sourceTableId: string;
}) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Récupérer les deux ventes
  const [sourceVenteResult, targetVenteResult, sourceTableResult] = await Promise.all([
    supabase.from("ventes").select("*").eq("id", data.sourceVenteId).single(),
    supabase.from("ventes").select("*").eq("id", data.targetVenteId).single(),
    db.getTableById(supabase, data.sourceTableId),
  ]);

  const sourceVente = sourceVenteResult.data;
  const targetVente = targetVenteResult.data;
  const sourceTable = sourceTableResult;

  if (!sourceVente || sourceVente.statut !== "EN_COURS") {
    return {
      success: false,
      error: "Commande source non trouvée",
    };
  }

  if (!targetVente || targetVente.statut !== "EN_COURS") {
    return {
      success: false,
      error: "Commande de destination non trouvée",
    };
  }

  if (!sourceTable) {
    return {
      success: false,
      error: "Table source non trouvée",
    };
  }

  // Récupérer les lignes de la vente source avec leurs suppléments
  const { data: sourceLignes } = await supabase
    .from("lignes_vente")
    .select("*")
    .eq("vente_id", data.sourceVenteId);

  // Pour chaque ligne, récupérer les suppléments et les copier
  for (const ligne of sourceLignes ?? []) {
    // Récupérer les suppléments de cette ligne
    const { data: supplements } = await supabase
      .from("lignes_vente_supplements")
      .select("*")
      .eq("ligne_vente_id", ligne.id);

    // Créer la nouvelle ligne dans la vente de destination
    const { data: newLigne } = await supabase
      .from("lignes_vente")
      .insert({
        vente_id: data.targetVenteId,
        produit_id: ligne.produit_id,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        sous_total: ligne.sous_total,
        taux_tva: ligne.taux_tva,
        montant_tva: ligne.montant_tva,
        total: ligne.total,
        statut_preparation: ligne.statut_preparation,
        notes: ligne.notes,
      })
      .select()
      .single();

    // Copier les suppléments si présents
    if (newLigne && supplements && supplements.length > 0) {
      await supabase.from("lignes_vente_supplements").insert(
        supplements.map((sup) => ({
          ligne_vente_id: newLigne.id,
          nom: sup.nom,
          prix: sup.prix,
          supplement_produit_id: sup.supplement_produit_id,
        }))
      );
    }
  }

  // Recalculer les totaux de la vente de destination
  const newSousTotal = Number(targetVente.sous_total) + Number(sourceVente.sous_total);
  const newTotalTva = Number(targetVente.total_tva) + Number(sourceVente.total_tva);
  const newTotalRemise = Number(targetVente.total_remise) + Number(sourceVente.total_remise);
  const newTotalFinal = Number(targetVente.total_final) + Number(sourceVente.total_final);

  // Mettre à jour la vente de destination
  const newNotes = targetVente.notes
    ? `${targetVente.notes}\n[Fusion depuis table ${sourceTable.numero}]`
    : `[Fusion depuis table ${sourceTable.numero}]`;

  await supabase
    .from("ventes")
    .update({
      sous_total: newSousTotal,
      total_tva: newTotalTva,
      total_remise: newTotalRemise,
      total_final: newTotalFinal,
      notes: newNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.targetVenteId);

  // Supprimer les lignes de la vente source (les suppléments seront supprimés en cascade si configuré)
  await supabase.from("lignes_vente").delete().eq("vente_id", data.sourceVenteId);

  // Supprimer la vente source
  await supabase.from("ventes").delete().eq("id", data.sourceVenteId);

  // Libérer la table source
  await db.updateTableStatut(supabase, data.sourceTableId, "LIBRE" as StatutTable);

  revalidatePath("/salle");
  revalidatePath("/caisse");

  return {
    success: true,
    message: "Commandes fusionnées avec succès",
  };
}

/**
 * Récupère les détails d'une vente en cours sur une table
 */
export async function getTableVenteDetails(tableId: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return null;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId: user.etablissementId, role: user.role });

  const table = await db.getTableById(supabase, tableId);

  if (!table) {
    return null;
  }

  // Récupérer la zone
  const zone = table.zone_id ? await db.getZoneById(supabase, table.zone_id) : null;

  // Récupérer les ventes en cours avec relations
  const { data: ventes } = await supabase
    .from("ventes")
    .select("*")
    .eq("table_id", tableId)
    .eq("statut", "EN_COURS");

  const ventesWithRelations = await Promise.all(
    (ventes ?? []).map(async (vente) => {
      // Récupérer les lignes avec produit et suppléments
      const { data: lignes } = await supabase
        .from("lignes_vente")
        .select("*")
        .eq("vente_id", vente.id)
        .order("created_at", { ascending: false });

      const lignesWithRelations = await Promise.all(
        (lignes ?? []).map(async (ligne) => {
          // Récupérer le produit
          const { data: produit } = await supabase
            .from("produits")
            .select("id, nom, image")
            .eq("id", ligne.produit_id)
            .single();

          // Récupérer les suppléments
          const { data: supplements } = await supabase
            .from("lignes_vente_supplements")
            .select("*")
            .eq("ligne_vente_id", ligne.id);

          return {
            ...ligne,
            prixUnitaire: Number(ligne.prix_unitaire),
            sousTotal: Number(ligne.sous_total),
            tauxTva: Number(ligne.taux_tva),
            montantTva: Number(ligne.montant_tva),
            total: Number(ligne.total),
            produit,
            supplements: (supplements ?? []).map((sup) => ({
              ...sup,
              prix: Number(sup.prix),
            })),
          };
        })
      );

      // Récupérer l'utilisateur
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select("id, nom, prenom")
        .eq("id", vente.utilisateur_id)
        .single();

      return {
        ...vente,
        sousTotal: Number(vente.sous_total),
        totalTva: Number(vente.total_tva),
        totalRemise: Number(vente.total_remise),
        totalFinal: Number(vente.total_final),
        valeurRemise: vente.valeur_remise ? Number(vente.valeur_remise) : null,
        fraisLivraison: vente.frais_livraison ? Number(vente.frais_livraison) : null,
        lignes: lignesWithRelations,
        utilisateur,
      };
    })
  );

  return {
    ...table,
    positionX: table.position_x,
    positionY: table.position_y,
    zoneId: table.zone_id,
    etablissementId: table.etablissement_id,
    createdAt: table.created_at,
    updatedAt: table.updated_at,
    zone,
    ventes: ventesWithRelations,
  };
}

/**
 * Récupère toutes les tables avec leurs ventes en cours pour le modal de transfert
 */
export async function getTablesForTransfer(excludeTableId?: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    throw new Error("Etablissement non trouvé. Veuillez vous connecter.");
  }
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Récupérer les tables actives
  let tables = await db.getTables(supabase, etablissementId, { active: true });

  // Filtrer si nécessaire
  if (excludeTableId) {
    tables = tables.filter((t) => t.id !== excludeTableId);
  }

  // Récupérer les zones
  const zones = await db.getZones(supabase, etablissementId);
  const zonesMap = new Map(zones.map((z) => [z.id, z]));

  // Récupérer toutes les ventes en cours pour toutes les tables en une seule requête
  const tableIds = tables.map((t) => t.id);
  const { data: allVentes } = await supabase
    .from("ventes")
    .select("id, table_id, numero_ticket, total_final, created_at")
    .in("table_id", tableIds)
    .eq("statut", "EN_COURS");

  // Récupérer le nombre de lignes pour toutes les ventes en une seule requête
  const venteIds = (allVentes ?? []).map((v) => v.id);
  const { data: lignesCounts } = venteIds.length > 0
    ? await supabase
        .from("lignes_vente")
        .select("vente_id")
        .in("vente_id", venteIds)
    : { data: [] };

  // Créer un map pour compter les lignes par vente
  const lignesCountMap = new Map<string, number>();
  (lignesCounts ?? []).forEach((ligne) => {
    const count = lignesCountMap.get(ligne.vente_id) ?? 0;
    lignesCountMap.set(ligne.vente_id, count + 1);
  });

  // Grouper les ventes par table
  const ventesParTable = new Map<string, typeof allVentes>();
  (allVentes ?? []).forEach((vente) => {
    if (!vente.table_id) return; // Ignorer les ventes sans table
    const tableVentes = ventesParTable.get(vente.table_id) ?? [];
    tableVentes.push(vente);
    ventesParTable.set(vente.table_id, tableVentes);
  });

  // Assembler les données des tables
  const tablesWithVentes = tables.map((table) => {
    const tableVentes = ventesParTable.get(table.id) ?? [];
    const ventesWithCount = tableVentes.map((vente) => ({
      id: vente.id,
      numeroTicket: vente.numero_ticket,
      totalFinal: Number(vente.total_final),
      createdAt: vente.created_at,
      _count: { lignes: lignesCountMap.get(vente.id) ?? 0 },
    }));

    return {
      ...table,
      positionX: table.position_x,
      positionY: table.position_y,
      zoneId: table.zone_id,
      etablissementId: table.etablissement_id,
      zone: table.zone_id ? zonesMap.get(table.zone_id) ?? null : null,
      ventes: ventesWithCount,
    };
  });

  // Trier par zone puis par numéro
  return tablesWithVentes.sort((a, b) => {
    const zoneA = a.zone?.ordre ?? 0;
    const zoneB = b.zone?.ordre ?? 0;
    if (zoneA !== zoneB) return zoneA - zoneB;
    return a.numero.localeCompare(b.numero);
  });
}

/**
 * Met à jour une zone existante
 */
export async function updateZone(
  id: string,
  data: {
    nom?: string;
    description?: string;
    couleur?: string;
    position_x?: number;
    position_y?: number;
    largeur?: number;
    hauteur?: number;
  }
) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Vérifier que la zone existe (RLS filtre par établissement)
  const existing = await db.getZoneById(supabase, id);

  if (!existing) {
    return {
      success: false,
      error: "Zone non trouvée",
    };
  }

  // Vérifier l'unicité du nom si modifié
  if (data.nom && data.nom !== existing.nom) {
    const duplicate = await db.zoneNomExists(supabase, etablissementId, data.nom, id);

    if (duplicate) {
      return {
        success: false,
        error: "Une zone avec ce nom existe déjà",
      };
    }
  }

  const zone = await db.updateZone(supabase, id, {
    nom: data.nom,
    description: data.description,
    couleur: data.couleur,
    position_x: data.position_x,
    position_y: data.position_y,
    largeur: data.largeur,
    hauteur: data.hauteur,
  });

  revalidatePath("/salle");

  return {
    success: true,
    data: zone,
  };
}

/**
 * Supprime une zone
 */
export async function deleteZone(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Vérifier que la zone existe (RLS filtre par établissement)
  const zone = await db.getZoneById(supabase, id);

  if (!zone) {
    return {
      success: false,
      error: "Zone non trouvée",
    };
  }

  // Vérifier qu'il n'y a pas de tables associées
  const tableCount = await db.countTables(supabase, etablissementId, { zoneId: id });

  if (tableCount > 0) {
    return {
      success: false,
      error: `Impossible de supprimer cette zone car elle contient ${tableCount} table(s)`,
    };
  }

  await db.deleteZone(supabase, id);

  revalidatePath("/salle");

  return {
    success: true,
  };
}

/**
 * Réordonne les zones
 */
export async function reorderZones(zoneIds: string[]) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Vérifier que toutes les zones appartiennent à l'établissement
  const zones = await db.getZones(supabase, etablissementId);
  const validZoneIds = new Set(zones.map((z) => z.id));

  const ordersToUpdate = zoneIds
    .filter((id) => validZoneIds.has(id))
    .map((id, index) => ({ id, ordre: index }));

  await db.updateZonesOrder(supabase, ordersToUpdate);

  revalidatePath("/salle");

  return {
    success: true,
  };
}

/**
 * Récupère les zones avec le compte de tables
 */
export async function getZonesWithTableCount() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    throw new Error("Etablissement non trouvé. Veuillez vous connecter.");
  }
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  const zones = await db.getZonesWithTableCount(supabase, etablissementId, { active: true });

  return zones;
}

/**
 * Met à jour les positions de plusieurs zones en une fois (pour le plan de salle)
 */
export async function updateZonesPositions(
  updates: Array<{
    id: string;
    position_x?: number;
    position_y?: number;
    largeur?: number;
    hauteur?: number;
  }>
) {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return { success: false, error: "Vous devez être connecté" };
  const etablissementId = user.etablissementId;
  const supabase = await createAuthenticatedClient({ userId: user.userId, etablissementId, role: user.role });

  // Vérifier que toutes les zones appartiennent à l'établissement
  const zones = await db.getZones(supabase, etablissementId);
  const validZoneIds = new Set(zones.map((z) => z.id));

  const validUpdates = updates.filter((u) => validZoneIds.has(u.id));

  if (validUpdates.length === 0) {
    return {
      success: false,
      error: "Aucune zone valide à mettre à jour",
    };
  }

  // Mettre à jour chaque zone
  for (const update of validUpdates) {
    await db.updateZone(supabase, update.id, {
      position_x: update.position_x,
      position_y: update.position_y,
      largeur: update.largeur,
      hauteur: update.hauteur,
    });
  }

  revalidatePath("/salle");

  return {
    success: true,
    count: validUpdates.length,
  };
}
