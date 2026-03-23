/**
 * Generateur d'addition (pre-note avant paiement)
 *
 * L'addition permet au client de voir le total avant de payer.
 * Elle ne contient pas d'informations de paiement.
 *
 * Format:
 * - En-tete: Nom etablissement, adresse
 * - Corps: Lignes avec quantite, prix, total
 * - Pied: Sous-total, TVA, remise, total a payer
 */

import {
  createESCPOSBuilder,
  formatPrintAmount,
  formatPrintDateTime,
  formatPrintTime,
} from "./escpos";
import { type AdditionData, TYPE_VENTE_LABELS } from "./types";

/**
 * Genere les commandes ESC/POS pour une addition
 */
export function generateAddition(data: AdditionData, paperWidth: 58 | 80 = 80): string {
  const builder = createESCPOSBuilder(paperWidth);

  builder.init().align("center");

  // ============================================
  // EN-TETE
  // ============================================

  // Nom de l'etablissement
  builder
    .size("double")
    .bold(true)
    .println(data.etablissement.nom.toUpperCase())
    .size("normal")
    .bold(false);

  // Adresse
  if (data.etablissement.adresse) {
    builder.println(data.etablissement.adresse);
  }

  // Telephone
  if (data.etablissement.telephone) {
    builder.println(`Tel: ${data.etablissement.telephone}`);
  }

  builder.line("=");

  // Titre "ADDITION"
  builder.size("double").bold(true).println("ADDITION").size("normal").bold(false);

  builder.line("=");

  // ============================================
  // INFORMATIONS
  // ============================================

  builder.align("left");

  // Date et heure
  builder.leftRight("Date:", formatPrintDateTime(data.dateAddition));

  // Type de vente
  builder.leftRight("Type:", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente);

  // Table (si service a table)
  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) {
      tableInfo += ` (${data.tableZone})`;
    }
    builder.leftRight("Table:", tableInfo);

    // Nombre de couverts
    if (data.couverts && data.couverts > 0) {
      builder.leftRight("Couverts:", data.couverts.toString());
    }
  }

  // Client (si applicable)
  if (data.clientNom) {
    builder.leftRight("Client:", data.clientNom);
  }

  // Adresse livraison
  if (data.adresseLivraison) {
    builder.println(`Livraison: ${data.adresseLivraison}`);
    if (data.telephoneLivraison) {
      builder.println(`Tel: ${data.telephoneLivraison}`);
    }
  }

  // Serveur
  builder.leftRight("Serveur:", data.serveurNom);

  builder.line("-");

  // ============================================
  // LIGNES DE COMMANDE
  // ============================================

  // En-tete des colonnes (80mm uniquement)
  if (paperWidth === 80) {
    builder.bold(true);
    builder.table([
      { text: "Article", width: 24, align: "left" },
      { text: "Qte", width: 5, align: "center" },
      { text: "P.U.", width: 9, align: "right" },
      { text: "Total", width: 10, align: "right" },
    ]);
    builder.bold(false);
    builder.line("-");
  }

  // Lignes de produits
  for (const ligne of data.lignes) {
    if (paperWidth === 80) {
      // Format large (80mm)
      const nomTronque = ligne.produitNom.substring(0, 22);
      builder.table([
        { text: nomTronque, width: 24, align: "left" },
        { text: ligne.quantite.toString(), width: 5, align: "center" },
        { text: formatPrintAmount(ligne.prixUnitaire), width: 9, align: "right" },
        { text: formatPrintAmount(ligne.total), width: 10, align: "right" },
      ]);
    } else {
      // Format compact (58mm)
      builder.println(ligne.produitNom.substring(0, 28));
      builder.leftRight(
        `  ${ligne.quantite} x ${formatPrintAmount(ligne.prixUnitaire)}`,
        formatPrintAmount(ligne.total)
      );
    }

    // Supplements
    if (ligne.supplements && ligne.supplements.length > 0) {
      for (const sup of ligne.supplements) {
        builder.println(`  + ${sup.nom}: ${formatPrintAmount(sup.prix)}`);
      }
    }

    // Remise sur la ligne
    if (ligne.remiseLigne && ligne.montantRemiseLigne) {
      const remiseLabel =
        ligne.remiseLigne.type === "POURCENTAGE"
          ? `${ligne.remiseLigne.valeur}%`
          : formatPrintAmount(ligne.remiseLigne.valeur);
      builder.println(`  Remise: -${formatPrintAmount(ligne.montantRemiseLigne)} (${remiseLabel})`);
    }

    // Notes sur le produit
    if (ligne.notes) {
      builder.println(`  -> ${ligne.notes}`);
    }
  }

  builder.line("-");

  // ============================================
  // TOTAUX
  // ============================================

  // Sous-total HT
  builder.leftRight("Sous-total HT:", `${formatPrintAmount(data.sousTotal)} F`);

  // TVA
  builder.leftRight("TVA:", `${formatPrintAmount(data.totalTva)} F`);

  // Remise globale (si applicable)
  if (data.totalRemise > 0) {
    let remiseLabel = "Remise";
    if (data.remiseType === "POURCENTAGE" && data.remiseValeur) {
      remiseLabel = `Remise (${data.remiseValeur}%)`;
    }
    builder.leftRight(remiseLabel + ":", `-${formatPrintAmount(data.totalRemise)} F`);
  }

  builder.line("=");

  // TOTAL A PAYER (grand et gras)
  builder
    .size("double")
    .bold(true)
    .leftRight("A PAYER:", `${formatPrintAmount(data.totalFinal)} F`)
    .size("normal")
    .bold(false);

  builder.line("=");

  // ============================================
  // PIED DE PAGE
  // ============================================

  builder.feed(1);
  builder.align("center");
  builder.println("--- ADDITION ---");
  builder.println("Ce document n'est pas une facture");
  builder.feed(1);

  // Date et heure d'impression
  builder
    .font("B")
    .println(`Imprime le ${formatPrintDateTime(new Date())}`)
    .font("A");

  // Coupe du papier
  builder.cut();

  return builder.build();
}

/**
 * Cree les donnees d'addition a partir du panier (cart store)
 */
export function createAdditionDataFromCart(
  cart: {
    items: Array<{
      produit: { nom: string };
      quantite: number;
      prixUnitaire: number;
      total: number;
      notes?: string | null;
      supplements?: { nom: string; prix: number }[];
      totalSupplements?: number;
      remiseLigne?: { type: "POURCENTAGE" | "MONTANT_FIXE"; valeur: number } | null;
      montantRemiseLigne?: number;
    }>;
    sousTotal: number;
    totalTva: number;
    totalRemise: number;
    totalFinal: number;
    remise?: { type: "POURCENTAGE" | "MONTANT_FIXE"; valeur: number } | null;
    typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
    table?: { numero: string; zone?: { nom: string } | null; couverts?: number } | null;
    client?: { nom: string; prenom?: string | null } | null;
    adresseLivraison?: string | null;
    telephoneLivraison?: string | null;
  },
  etablissement: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    nif?: string | null;
    rccm?: string | null;
    messageTicket?: string | null;
  },
  serveurNom: string
): AdditionData {
  return {
    etablissement: {
      nom: etablissement.nom,
      adresse: etablissement.adresse || null,
      telephone: etablissement.telephone || null,
      email: etablissement.email || null,
      nif: etablissement.nif || null,
      rccm: etablissement.rccm || null,
      messageTicket: etablissement.messageTicket || null,
    },
    dateAddition: new Date(),
    typeVente: cart.typeVente,
    tableNumero: cart.table?.numero || null,
    tableZone: cart.table?.zone?.nom || null,
    couverts: cart.table?.couverts,
    clientNom: cart.client
      ? `${cart.client.nom}${cart.client.prenom ? " " + cart.client.prenom : ""}`
      : null,
    serveurNom,
    lignes: cart.items.map((item) => ({
      produitNom: item.produit.nom,
      quantite: item.quantite,
      prixUnitaire: item.prixUnitaire + (item.totalSupplements || 0),
      total: item.total,
      notes: item.notes || null,
      supplements: item.supplements,
      remiseLigne: item.remiseLigne || null,
      montantRemiseLigne: item.montantRemiseLigne || null,
    })),
    sousTotal: cart.sousTotal,
    totalTva: cart.totalTva,
    totalRemise: cart.totalRemise,
    totalFinal: cart.totalFinal,
    remiseType: cart.remise?.type || null,
    remiseValeur: cart.remise?.valeur || null,
    adresseLivraison: cart.adresseLivraison || null,
    telephoneLivraison: cart.telephoneLivraison || null,
  };
}
