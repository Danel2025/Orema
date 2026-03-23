/**
 * Generateur de bon bar
 *
 * Similaire au bon cuisine mais pour les categories bar/boissons
 * Format plus compact et oriente service rapide
 */

import { createESCPOSBuilder, formatPrintTime, formatPrintDateTime } from "./escpos";
import { type BonPreparationData, TYPE_VENTE_LABELS } from "./types";

/**
 * Genere les commandes ESC/POS pour un bon bar
 */
export function generateBonBar(data: BonPreparationData, paperWidth: 58 | 80 = 80): string {
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

  // Titre "BON BAR" avec style inverse
  builder
    .invert(true)
    .size("double")
    .bold(true)
    .println("  BON BAR  ")
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

  // Table ou client (affichage prioritaire)
  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) {
      tableInfo += ` (${data.tableZone})`;
    }
    builder.bold(true).size("double-height").println(tableInfo).size("normal").bold(false);
  } else {
    // Type de vente
    builder.leftRight("Mode:", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente);

    // Client si applicable
    if (data.clientNom) {
      builder.leftRight("Client:", data.clientNom);
    }
  }

  // Serveur
  builder.leftRight("Serveur:", data.serveurNom);

  builder.line("=");

  // ============================================
  // BOISSONS A SERVIR
  // ============================================

  builder.align("center").bold(true).println("BOISSONS A SERVIR").bold(false).align("left");

  builder.line("-");

  // Grouper par categorie si plusieurs
  const produitsParCategorie = new Map<string, typeof data.lignes>();

  for (const ligne of data.lignes) {
    const categorie = ligne.categorieNom || "Boissons";
    if (!produitsParCategorie.has(categorie)) {
      produitsParCategorie.set(categorie, []);
    }
    produitsParCategorie.get(categorie)!.push(ligne);
  }

  // Afficher les produits
  for (const [categorie, produits] of produitsParCategorie) {
    // Titre de la categorie (si plusieurs categories)
    if (produitsParCategorie.size > 1) {
      builder.underline(true).println(`[ ${categorie.toUpperCase()} ]`).underline(false);
    }

    // Produits de cette categorie
    for (const ligne of produits) {
      // Format compact: quantite + nom sur une ligne
      builder.size("double-height").bold(true);

      const qteStr = `${ligne.quantite}x`;
      const nomProduit = ligne.produitNom;

      // Affichage simple et clair
      builder.println(`${qteStr} ${nomProduit.substring(0, paperWidth === 80 ? 35 : 24)}`);

      builder.size("normal").bold(false);

      // Notes speciales (ex: "avec glace", "sans sucre")
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

  // Nombre total d'articles
  const totalArticles = data.lignes.reduce((sum, l) => sum + l.quantite, 0);
  builder
    .align("center")
    .size("double-height")
    .bold(true)
    .println(`${totalArticles} boisson(s)`)
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
 * Filtre les lignes pour le bar (boissons uniquement)
 */
export function filterLignesBar(
  lignes: BonPreparationData["lignes"],
  categoriesBar: string[] // IDs des categories bar/boissons
): BonPreparationData["lignes"] {
  if (categoriesBar.length === 0) {
    // Si pas de filtre configure, retourner toutes les lignes
    return lignes;
  }

  return lignes.filter((ligne) => ligne.categorieId && categoriesBar.includes(ligne.categorieId));
}

/**
 * Cree les donnees de bon bar a partir d'une vente
 */
export function createBonBarDataFromVente(
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
      prixUnitaire: 0, // Pas affiche sur bon bar
      total: 0, // Pas affiche sur bon bar
      notes: ligne.notes || null,
      categorieId: ligne.produit.categorie?.id,
      categorieNom: ligne.produit.categorie?.nom,
    })),
    notes: vente.notes || null,
    urgent,
  };
}

/**
 * Detecte si une ligne doit aller au bar (par defaut, categories contenant "boisson", "bar", "cocktail", "vin", "biere")
 */
export function isBarCategory(categorieName: string | undefined | null): boolean {
  if (!categorieName) return false;

  const nomLower = categorieName.toLowerCase();
  const motsCleBars = [
    "boisson",
    "bar",
    "cocktail",
    "vin",
    "biere",
    "alcool",
    "soft",
    "jus",
    "cafe",
    "the",
    "eau",
    "soda",
  ];

  return motsCleBars.some((mot) => nomLower.includes(mot));
}

/**
 * Detecte si une ligne doit aller en cuisine (par defaut, tout sauf bar)
 */
export function isCuisineCategory(categorieName: string | undefined | null): boolean {
  if (!categorieName) return true; // Par defaut, va en cuisine

  // Si c'est une categorie bar, ca ne va pas en cuisine
  return !isBarCategory(categorieName);
}
