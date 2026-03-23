/**
 * Template de generation de bon cuisine ESC/POS
 * Utilise l'API node-thermal-printer pour generer les commandes
 *
 * Format:
 * - En-tete: "BON CUISINE" ou "BON BAR" selon destination
 * - Numero commande + table
 * - Heure de commande bien visible
 * - Liste produits par categorie avec quantites
 * - Notes speciales par produit
 * - Marque d'urgence si necessaire
 */

import type { BonCuisineData } from "../types";
import { TYPE_VENTE_LABELS } from "../types";

function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function generateBonCuisineCommands(
  printer: any,
  data: BonCuisineData,
  width: number,
  destination: "CUISINE" | "BAR"
): void {
  const title = destination === "CUISINE" ? "BON CUISINE" : "BON BAR";
  const sectionTitle = destination === "CUISINE" ? "PRODUITS A PREPARER" : "BOISSONS A SERVIR";

  // ============================================
  // EN-TETE
  // ============================================

  printer.alignCenter();

  // Alerte d'urgence
  if (data.priorite === "URGENT") {
    printer.invert(true);
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    printer.bold(true);
    printer.println(`  ! URGENT !  `);
    printer.bold(false);
    printer.setTextNormal();
    printer.invert(false);
    printer.newLine();
  }

  // Titre du bon (inverse: texte blanc sur fond noir)
  printer.invert(true);
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();
  printer.bold(true);
  printer.println(`  ${title}  `);
  printer.bold(false);
  printer.setTextNormal();
  printer.invert(false);

  printer.newLine();

  // Numero de commande (grand)
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();
  printer.bold(true);
  printer.println(`#${data.numeroTicket}`);
  printer.bold(false);
  printer.setTextNormal();

  printer.drawLine();

  // ============================================
  // INFORMATIONS COMMANDE
  // ============================================

  printer.alignLeft();

  // Heure de commande (tres visible)
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.leftRight("HEURE:", formatTime(data.date));
  printer.setTextNormal();
  printer.bold(false);

  printer.drawLine();

  // Type de vente
  printer.leftRight("Type:", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente);

  // Table (affichage en grand si present)
  if (data.table) {
    printer.bold(true);
    printer.setTextDoubleHeight();
    printer.println(`Table ${data.table}`);
    printer.setTextNormal();
    printer.bold(false);
  }

  // Serveur
  printer.leftRight("Serveur:", data.serveur);

  printer.drawLine();

  // ============================================
  // PRODUITS
  // ============================================

  printer.alignCenter();
  printer.bold(true);
  printer.println(sectionTitle);
  printer.bold(false);
  printer.alignLeft();

  printer.drawLine();

  // Affichage des produits
  for (const ligne of data.lignes) {
    // Quantite + nom du produit (en grand pour la lisibilite en cuisine)
    printer.setTextDoubleHeight();
    printer.bold(true);

    const qteStr = `${ligne.quantite}x`;
    const nomProduit = ligne.nom;
    const maxNomLen = width >= 48 ? 35 : 24;

    printer.println(`${qteStr} ${nomProduit.substring(0, maxNomLen)}`);

    printer.setTextNormal();
    printer.bold(false);

    // Supplements
    if (ligne.supplements && ligne.supplements.length > 0) {
      for (const sup of ligne.supplements) {
        printer.println(`   + ${sup}`);
      }
    }

    // Notes speciales pour ce produit (tres visibles)
    if (ligne.notes) {
      printer.bold(true);
      printer.println(`   >> ${ligne.notes.toUpperCase()}`);
      printer.bold(false);
    }
  }

  printer.newLine();

  // ============================================
  // NOTES GENERALES
  // ============================================

  if (data.notes) {
    printer.drawLine();
    printer.bold(true);
    printer.println("NOTES:");
    printer.bold(false);
    printer.println(data.notes);
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  printer.drawLine();

  // Nombre total d'articles
  const totalArticles = data.lignes.reduce((sum, l) => sum + l.quantite, 0);
  const articleLabel = destination === "CUISINE" ? "article(s)" : "boisson(s)";

  printer.alignCenter();
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.println(`${totalArticles} ${articleLabel}`);
  printer.setTextNormal();
  printer.bold(false);

  printer.newLine();

  // Heure d'impression
  printer.setTypeFontB();
  printer.println(`Imprime: ${formatDateTime(new Date())}`);
  printer.setTypeFontA();

  // Coupe du papier
  printer.cut();
}
