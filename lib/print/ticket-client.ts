/**
 * Generateur de ticket client (recu de caisse)
 *
 * Format standard:
 * - En-tete: Logo/nom etablissement, adresse, NIF, RCCM
 * - Corps: Lignes de vente avec quantite, prix, total
 * - Pied: Sous-total, TVA, remise, total, mode paiement, rendu
 * - Message de remerciement
 */

import {
  ESCPOSBuilder,
  createESCPOSBuilder,
  formatPrintAmount,
  formatPrintDateTime,
} from "./escpos";
import { type TicketClientData, PAIEMENT_LABELS, TYPE_VENTE_LABELS } from "./types";

/**
 * Genere les commandes ESC/POS pour un ticket client
 */
export function generateTicketClient(data: TicketClientData, paperWidth: 58 | 80 = 80): string {
  const builder = createESCPOSBuilder(paperWidth);
  const charsPerLine = builder.getCharsPerLine();

  builder.init().align("center");

  // ============================================
  // EN-TETE
  // ============================================

  // Nom de l'etablissement (grand et gras)
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

  // NIF et RCCM
  if (data.etablissement.nif || data.etablissement.rccm) {
    const fiscal: string[] = [];
    if (data.etablissement.nif) {
      fiscal.push(`NIF: ${data.etablissement.nif}`);
    }
    if (data.etablissement.rccm) {
      fiscal.push(`RCCM: ${data.etablissement.rccm}`);
    }
    builder.println(fiscal.join(" - "));
  }

  builder.line("=");

  // ============================================
  // INFORMATIONS TICKET
  // ============================================

  builder.align("left");

  // Numero et date
  builder.leftRight("Ticket:", `#${data.numeroTicket}`);
  builder.leftRight("Date:", formatPrintDateTime(data.dateVente));

  // Type de vente
  builder.leftRight("Type:", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente);

  // Table (si service a table)
  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) {
      tableInfo += ` (${data.tableZone})`;
    }
    builder.leftRight("Table:", tableInfo);
  }

  // Client (si applicable)
  if (data.clientNom) {
    builder.leftRight("Client:", data.clientNom);
  }

  // Caissier
  builder.leftRight("Caissier:", data.caissierNom);

  builder.line("-");

  // ============================================
  // LIGNES DE VENTE
  // ============================================

  // En-tete des colonnes
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

  // Remise (si applicable)
  if (data.totalRemise > 0) {
    let remiseLabel = "Remise";
    if (data.remiseType === "POURCENTAGE" && data.remiseValeur) {
      remiseLabel = `Remise (${data.remiseValeur}%)`;
    }
    builder.leftRight(remiseLabel + ":", `-${formatPrintAmount(data.totalRemise)} F`);
  }

  builder.line("=");

  // TOTAL TTC (grand et gras)
  builder
    .size("double")
    .bold(true)
    .leftRight("TOTAL TTC:", `${formatPrintAmount(data.totalFinal)} F`)
    .size("normal")
    .bold(false);

  builder.line("=");

  // ============================================
  // PAIEMENTS
  // ============================================

  builder.bold(true).println("MODE DE PAIEMENT").bold(false);

  for (const paiement of data.paiements) {
    const label = PAIEMENT_LABELS[paiement.mode] || paiement.mode;
    builder.leftRight(label + ":", `${formatPrintAmount(paiement.montant)} F`);

    // Reference (pour Mobile Money, cheque, etc.)
    if (paiement.reference) {
      builder.println(`  Ref: ${paiement.reference}`);
    }
  }

  // Montant recu et monnaie rendue (especes)
  if (data.montantRecu && data.montantRecu > 0) {
    builder.line("-");
    builder.leftRight("Montant recu:", `${formatPrintAmount(data.montantRecu)} F`);
    if (data.monnaieRendue && data.monnaieRendue > 0) {
      builder
        .bold(true)
        .leftRight("Monnaie rendue:", `${formatPrintAmount(data.monnaieRendue)} F`)
        .bold(false);
    }
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  builder.feed(1);
  builder.line("-");
  builder.align("center");

  // Message de remerciement personnalise ou par defaut
  const messageRemerciement =
    data.etablissement.messageTicket || "Merci de votre visite!\nA bientot!";

  const lignesMessage = messageRemerciement.split("\n");
  for (const ligneMsg of lignesMessage) {
    builder.println(ligneMsg);
  }

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
 * Genere les commandes ESC/POS pour un ticket de test
 */
export function generateTestTicket(
  etablissementNom: string,
  printerName: string,
  paperWidth: 58 | 80 = 80
): string {
  const builder = createESCPOSBuilder(paperWidth);

  builder
    .init()
    .align("center")
    .size("double")
    .bold(true)
    .println("TEST D'IMPRESSION")
    .size("normal")
    .bold(false)
    .feed(1)
    .line("=")
    .println(etablissementNom)
    .line("=")
    .feed(1)
    .align("left")
    .println(`Imprimante: ${printerName}`)
    .println(`Largeur: ${paperWidth}mm`)
    .println(`Caracteres/ligne: ${builder.getCharsPerLine()}`)
    .println(`Date: ${formatPrintDateTime(new Date())}`)
    .feed(1)
    .line("-")
    .bold(true)
    .println("Test des styles:")
    .bold(false)
    .println("Texte normal")
    .bold(true)
    .println("Texte en gras")
    .bold(false)
    .underline(true)
    .println("Texte souligne")
    .underline(false)
    .size("double-height")
    .println("Double hauteur")
    .size("double-width")
    .println("Double largeur")
    .size("double")
    .println("Double taille")
    .size("normal")
    .feed(1)
    .line("-")
    .println("Test alignements:")
    .align("left")
    .println("Gauche")
    .align("center")
    .println("Centre")
    .align("right")
    .println("Droite")
    .align("left")
    .feed(1)
    .line("-")
    .println("Test colonnes:")
    .leftRight("Gauche", "Droite")
    .leftRight("Article exemple", "1 500 F")
    .feed(1)
    .line("-")
    .align("center")
    .bold(true)
    .println("Test reussi!")
    .bold(false)
    .println("L'imprimante fonctionne correctement")
    .feed(1)
    .println("Orema N+ POS System")
    .cut();

  return builder.build();
}

/**
 * Cree les donnees de ticket a partir d'une vente complete
 * (utilitaire pour transformer les donnees Prisma en TicketClientData)
 */
export function createTicketDataFromVente(
  vente: {
    numeroTicket: string;
    createdAt: Date;
    type: string;
    sousTotal: number | bigint;
    totalTva: number | bigint;
    totalRemise: number | bigint;
    totalFinal: number | bigint;
    typeRemise?: string | null;
    valeurRemise?: number | bigint | null;
    lignes: Array<{
      quantite: number;
      prixUnitaire: number | bigint;
      total: number | bigint;
      notes?: string | null;
      produit: {
        nom: string;
        categorie?: {
          id: string;
          nom: string;
        };
      };
    }>;
    paiements: Array<{
      modePaiement: string;
      montant: number | bigint;
      reference?: string | null;
      montantRecu?: number | bigint | null;
      monnaieRendue?: number | bigint | null;
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
  etablissement: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    nif?: string | null;
    rccm?: string | null;
    messageTicket?: string | null;
  }
): TicketClientData {
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
    numeroTicket: vente.numeroTicket,
    dateVente: vente.createdAt,
    typeVente: vente.type as "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER",
    tableNumero: vente.table?.numero || null,
    tableZone: vente.table?.zone?.nom || null,
    clientNom: vente.client
      ? `${vente.client.nom}${vente.client.prenom ? " " + vente.client.prenom : ""}`
      : null,
    caissierNom: `${vente.utilisateur.nom}${vente.utilisateur.prenom ? " " + vente.utilisateur.prenom : ""}`,
    lignes: vente.lignes.map((ligne) => ({
      produitNom: ligne.produit.nom,
      quantite: ligne.quantite,
      prixUnitaire: Number(ligne.prixUnitaire),
      total: Number(ligne.total),
      notes: ligne.notes || null,
      categorieId: ligne.produit.categorie?.id,
      categorieNom: ligne.produit.categorie?.nom,
    })),
    sousTotal: Number(vente.sousTotal),
    totalTva: Number(vente.totalTva),
    totalRemise: Number(vente.totalRemise),
    totalFinal: Number(vente.totalFinal),
    remiseType: vente.typeRemise as "POURCENTAGE" | "MONTANT_FIXE" | null,
    remiseValeur: vente.valeurRemise ? Number(vente.valeurRemise) : null,
    paiements: vente.paiements.map((p) => ({
      mode: p.modePaiement as any,
      montant: Number(p.montant),
      reference: p.reference || null,
      montantRecu: p.montantRecu ? Number(p.montantRecu) : null,
      monnaieRendue: p.monnaieRendue ? Number(p.monnaieRendue) : null,
    })),
    montantRecu: vente.paiements.find((p) => p.montantRecu)?.montantRecu
      ? Number(vente.paiements.find((p) => p.montantRecu)!.montantRecu)
      : null,
    monnaieRendue: vente.paiements.find((p) => p.monnaieRendue)?.monnaieRendue
      ? Number(vente.paiements.find((p) => p.monnaieRendue)!.monnaieRendue)
      : null,
  };
}
