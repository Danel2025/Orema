/**
 * Template de generation de ticket client ESC/POS
 * Utilise l'API node-thermal-printer pour generer les commandes
 *
 * Format:
 * - En-tete: Logo/nom etablissement, adresse, NIF, RCCM
 * - Corps: Lignes de vente avec quantite, prix, total
 * - Pied: Sous-total, TVA, remise, total, mode paiement, rendu
 * - Message de remerciement
 */

import type { TicketData, EtablissementInfo, PaiementTicket } from "../types";
import { PAIEMENT_LABELS, TYPE_VENTE_LABELS } from "../types";

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u202F/g, " ");
}

function formatDateTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

 
export function generateTicketCommands(
  printer: any,
  etablissement: EtablissementInfo,
  data: TicketData,
  width: number
): void {
  // ============================================
  // EN-TETE
  // ============================================

  printer.alignCenter();

  // Nom de l'etablissement (grand et gras)
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();
  printer.bold(true);
  printer.println(etablissement.nom.toUpperCase());
  printer.bold(false);
  printer.setTextNormal();

  // Adresse
  if (etablissement.adresse) {
    printer.println(etablissement.adresse);
  }

  // Telephone
  if (etablissement.telephone) {
    printer.println(`Tel: ${etablissement.telephone}`);
  }

  // NIF et RCCM
  if (etablissement.nif || etablissement.rccm) {
    const fiscal: string[] = [];
    if (etablissement.nif) {
      fiscal.push(`NIF: ${etablissement.nif}`);
    }
    if (etablissement.rccm) {
      fiscal.push(`RCCM: ${etablissement.rccm}`);
    }
    printer.println(fiscal.join(" - "));
  }

  printer.drawLine();

  // ============================================
  // INFORMATIONS TICKET
  // ============================================

  printer.alignLeft();

  // Numero et date
  printer.leftRight("Ticket:", `#${data.numeroTicket}`);
  printer.leftRight("Date:", formatDateTime(data.date));

  // Type de vente
  printer.leftRight("Type:", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente);

  // Table (si service a table)
  if (data.table) {
    printer.leftRight("Table:", data.table);
  }

  // Client (si applicable)
  if (data.client) {
    printer.leftRight("Client:", data.client);
  }

  // Caissier
  printer.leftRight("Caissier:", data.caissier);

  printer.drawLine();

  // ============================================
  // LIGNES DE VENTE
  // ============================================

  // En-tete des colonnes (80mm uniquement)
  if (width >= 48) {
    printer.bold(true);
    printer.tableCustom([
      { text: "Article", align: "LEFT", width: 0.45 },
      { text: "Qte", align: "CENTER", width: 0.10 },
      { text: "P.U.", align: "RIGHT", width: 0.20 },
      { text: "Total", align: "RIGHT", width: 0.25 },
    ]);
    printer.bold(false);
    printer.drawLine();
  }

  // Lignes de produits
  for (const ligne of data.lignes) {
    if (width >= 48) {
      // Format large (80mm)
      const nomTronque = ligne.nom.substring(0, 20);
      printer.tableCustom([
        { text: nomTronque, align: "LEFT", width: 0.45 },
        { text: ligne.quantite.toString(), align: "CENTER", width: 0.10 },
        { text: formatAmount(ligne.prixUnitaire), align: "RIGHT", width: 0.20 },
        { text: formatAmount(ligne.total), align: "RIGHT", width: 0.25 },
      ]);
    } else {
      // Format compact (58mm)
      printer.println(ligne.nom.substring(0, 28));
      printer.leftRight(
        `  ${ligne.quantite} x ${formatAmount(ligne.prixUnitaire)}`,
        `${formatAmount(ligne.total)} F`
      );
    }

    // Supplements
    if (ligne.supplements && ligne.supplements.length > 0) {
      for (const sup of ligne.supplements) {
        printer.println(`  + ${sup.nom}: ${formatAmount(sup.prix)} F`);
      }
    }

    // Notes sur le produit
    if (ligne.notes) {
      printer.println(`  -> ${ligne.notes}`);
    }
  }

  printer.drawLine();

  // ============================================
  // TOTAUX
  // ============================================

  // Sous-total HT
  printer.leftRight("Sous-total HT:", `${formatAmount(data.sousTotal)} F`);

  // TVA
  printer.leftRight("TVA:", `${formatAmount(data.totalTva)} F`);

  // Remise (si applicable)
  if (data.totalRemise > 0) {
    printer.leftRight("Remise:", `-${formatAmount(data.totalRemise)} F`);
  }

  printer.drawLine();

  // TOTAL TTC (grand et gras)
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();
  printer.bold(true);
  printer.leftRight("TOTAL TTC:", `${formatAmount(data.totalFinal)} F`);
  printer.bold(false);
  printer.setTextNormal();

  printer.drawLine();

  // ============================================
  // PAIEMENTS
  // ============================================

  printer.bold(true);
  printer.println("MODE DE PAIEMENT");
  printer.bold(false);

  for (const paiement of data.paiements) {
    const label = PAIEMENT_LABELS[paiement.mode] || paiement.mode;
    printer.leftRight(`${label}:`, `${formatAmount(paiement.montant)} F`);

    // Reference (pour Mobile Money, cheque, etc.)
    if (paiement.reference) {
      printer.println(`  Ref: ${paiement.reference}`);
    }
  }

  // Montant recu et monnaie rendue (especes)
  if (data.montantRecu && data.montantRecu > 0) {
    printer.drawLine();
    printer.leftRight("Montant recu:", `${formatAmount(data.montantRecu)} F`);
    if (data.montantRendu && data.montantRendu > 0) {
      printer.bold(true);
      printer.leftRight("Monnaie rendue:", `${formatAmount(data.montantRendu)} F`);
      printer.bold(false);
    }
  }

  // ============================================
  // LIVRAISON (si applicable)
  // ============================================

  if (data.adresseLivraison) {
    printer.drawLine();
    printer.bold(true);
    printer.println("LIVRAISON");
    printer.bold(false);
    printer.println(data.adresseLivraison);
    if (data.fraisLivraison && data.fraisLivraison > 0) {
      printer.leftRight("Frais livraison:", `${formatAmount(data.fraisLivraison)} F`);
    }
  }

  // ============================================
  // NOTES
  // ============================================

  if (data.notes) {
    printer.drawLine();
    printer.println(`Note: ${data.notes}`);
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  printer.newLine();
  printer.drawLine();
  printer.alignCenter();

  // Message de remerciement
  printer.println("Merci de votre visite!");
  printer.println("A bientot!");

  printer.newLine();

  // Date et heure d'impression
  printer.setTypeFontB();
  printer.println(`Imprime le ${formatDateTime(new Date())}`);
  printer.setTypeFontA();

  // Coupe du papier
  printer.cut();
}
