/**
 * Generateur de bon cuisine
 *
 * Format:
 * - En-tete: "BON CUISINE" + numero commande + table/mode
 * - Heure de commande bien visible
 * - Liste des produits par categorie
 * - Notes speciales par produit
 * - Marque d'urgence si necessaire
 */

import { createESCPOSBuilder, formatPrintTime, formatPrintDateTime } from "./escpos";
import { type BonPreparationData, TYPE_VENTE_LABELS } from "./types";

/**
 * Genere les commandes ESC/POS pour un bon cuisine
 */
export function generateBonCuisine(data: BonPreparationData, paperWidth: 58 | 80 = 80): string {
  const builder = createESCPOSBuilder(paperWidth);

  builder.init();

  // ============================================
  // EN-TETE
  // ============================================

  builder.align("center");

  // Alerte d'urgence
  if (data.urgent) {
    builder
      .invert(true)
      .size("double")
      .bold(true)
      .println("  ! URGENT !  ")
      .size("normal")
      .bold(false)
      .invert(false)
      .feed(1);
  }

  // Titre "BON CUISINE"
  builder
    .invert(true)
    .size("double")
    .bold(true)
    .println("  BON CUISINE  ")
    .size("normal")
    .bold(false)
    .invert(false);

  builder.feed(1);

  // Numero de commande (grand)
  builder.size("double").bold(true).println(`#${data.numeroCommande}`).size("normal").bold(false);

  builder.line("=");

  // ============================================
  // INFORMATIONS COMMANDE
  // ============================================

  builder.align("left");

  // Heure de commande (tres visible)
  builder
    .size("double-height")
    .bold(true)
    .leftRight("HEURE:", formatPrintTime(data.dateCommande))
    .size("normal")
    .bold(false);

  builder.line("-");

  // Type de vente
  builder.leftRight("Type:", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente);

  // Table ou client
  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) {
      tableInfo += ` (${data.tableZone})`;
    }
    builder.bold(true).size("double-height").println(tableInfo).size("normal").bold(false);
  } else if (data.clientNom) {
    builder.leftRight("Client:", data.clientNom);
  }

  // Serveur
  builder.leftRight("Serveur:", data.serveurNom);

  builder.line("=");

  // ============================================
  // PRODUITS A PREPARER
  // ============================================

  builder.align("center").bold(true).println("PRODUITS A PREPARER").bold(false).align("left");

  builder.line("-");

  // Grouper les produits par categorie
  const produitsParCategorie = new Map<string, typeof data.lignes>();

  for (const ligne of data.lignes) {
    const categorie = ligne.categorieNom || "Autres";
    if (!produitsParCategorie.has(categorie)) {
      produitsParCategorie.set(categorie, []);
    }
    produitsParCategorie.get(categorie)!.push(ligne);
  }

  // Afficher par categorie
  for (const [categorie, produits] of produitsParCategorie) {
    // Titre de la categorie (si plusieurs categories)
    if (produitsParCategorie.size > 1) {
      builder.underline(true).println(`[ ${categorie.toUpperCase()} ]`).underline(false);
    }

    // Produits de cette categorie
    for (const ligne of produits) {
      // Quantite + nom du produit
      builder.size("double-height").bold(true);

      const qteStr = `${ligne.quantite}x`;
      const nomProduit = ligne.produitNom;

      if (paperWidth === 80) {
        builder.leftRight(qteStr, nomProduit.substring(0, 35));
      } else {
        builder.println(`${qteStr} ${nomProduit.substring(0, 24)}`);
      }

      builder.size("normal").bold(false);

      // Notes speciales pour ce produit
      if (ligne.notes) {
        builder.bold(true).println(`   >> ${ligne.notes.toUpperCase()}`).bold(false);
      }
    }

    builder.feed(1);
  }

  // ============================================
  // NOTES GENERALES
  // ============================================

  if (data.notes) {
    builder.line("-");
    builder.bold(true).println("NOTES:").bold(false).println(data.notes);
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  builder.line("=");

  builder
    .align("center")
    .size("double-height")
    .bold(true)
    .println(`${data.lignes.reduce((sum, l) => sum + l.quantite, 0)} article(s)`)
    .size("normal")
    .bold(false);

  builder.feed(1);

  // Heure d'impression
  builder
    .font("B")
    .println(`Imprime: ${formatPrintDateTime(new Date())}`)
    .font("A");

  // Coupe du papier
  builder.cut();

  return builder.build();
}

/**
 * Filtre les lignes pour la cuisine (exclut les boissons/bar)
 * Cette fonction devra etre adaptee selon les categories configurees
 */
export function filterLignesCuisine(
  lignes: BonPreparationData["lignes"],
  categoriesCuisine: string[] // IDs des categories cuisine
): BonPreparationData["lignes"] {
  if (categoriesCuisine.length === 0) {
    // Si pas de filtre configure, retourner toutes les lignes
    return lignes;
  }

  return lignes.filter(
    (ligne) => ligne.categorieId && categoriesCuisine.includes(ligne.categorieId)
  );
}

/**
 * Cree les donnees de bon cuisine a partir d'une vente
 */
export function createBonCuisineDataFromVente(
  vente: {
    numeroTicket: string;
    createdAt: Date;
    type: string;
    notes?: string | null;
    lignes: Array<{
      quantite: number;
      notes?: string | null;
      produit: {
        nom: string;
        categorie?: {
          id: string;
          nom: string;
        };
      };
    }>;
    table?: {
      numero: string;
      zone?: {
        nom: string;
      } | null;
    } | null;
    client?: {
      nom: string;
      prenom?: string | null;
    } | null;
    utilisateur: {
      nom: string;
      prenom?: string | null;
    };
  },
  urgent: boolean = false
): BonPreparationData {
  return {
    numeroCommande: vente.numeroTicket,
    dateCommande: vente.createdAt,
    typeVente: vente.type as "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER",
    tableNumero: vente.table?.numero || null,
    tableZone: vente.table?.zone?.nom || null,
    clientNom: vente.client
      ? `${vente.client.nom}${vente.client.prenom ? " " + vente.client.prenom : ""}`
      : null,
    serveurNom: `${vente.utilisateur.nom}${vente.utilisateur.prenom ? " " + vente.utilisateur.prenom : ""}`,
    lignes: vente.lignes.map((ligne) => ({
      produitNom: ligne.produit.nom,
      quantite: ligne.quantite,
      prixUnitaire: 0, // Pas affiche sur bon cuisine
      total: 0, // Pas affiche sur bon cuisine
      notes: ligne.notes || null,
      categorieId: ligne.produit.categorie?.id,
      categorieNom: ligne.produit.categorie?.nom,
    })),
    notes: vente.notes || null,
    urgent,
  };
}
