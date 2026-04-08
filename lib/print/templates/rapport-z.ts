/**
 * Template de generation de rapport Z ESC/POS
 * Utilise l'API node-thermal-printer pour generer les commandes
 *
 * Format detaille:
 * - En-tete: Nom etablissement + identifiants fiscaux
 * - Periode: Date/heure ouverture et cloture
 * - Caissier
 * - Resume des ventes
 * - Repartition par mode de paiement
 * - Repartition par type de vente
 * - Top produits
 * - TVA collectee
 * - Ecart de caisse
 */

import type { RapportZData, EtablissementInfo } from "../types";
import { TYPE_VENTE_LABELS } from "../types";

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u202F/g, " ");
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function generateRapportZCommands(
  printer: any,
  etablissement: EtablissementInfo,
  data: RapportZData,
  width: number
): void {
  // ============================================
  // EN-TETE
  // ============================================

  printer.alignCenter();

  // Titre RAPPORT Z (inverse)
  printer.invert(true);
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();
  printer.bold(true);
  printer.println("  RAPPORT Z  ");
  printer.bold(false);
  printer.setTextNormal();
  printer.invert(false);

  printer.newLine();

  // Nom de l'etablissement
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.println(etablissement.nom.toUpperCase());
  printer.setTextNormal();
  printer.bold(false);

  // Adresse et contact
  if (etablissement.adresse) {
    printer.println(etablissement.adresse);
  }
  if (etablissement.telephone) {
    printer.println(`Tel: ${etablissement.telephone}`);
  }

  // Identifiants fiscaux
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
  // PERIODE ET CAISSIER
  // ============================================

  printer.alignLeft();

  // Identifiant session
  printer.leftRight("Session:", data.sessionId.substring(0, 8) + "...");

  printer.drawLine();

  // Ouverture
  printer.bold(true);
  printer.println("OUVERTURE");
  printer.bold(false);
  printer.leftRight("Date:", formatDate(data.dateOuverture));
  printer.leftRight("Heure:", formatTime(data.dateOuverture));

  printer.drawLine();

  // Cloture
  printer.bold(true);
  printer.println("CLOTURE");
  printer.bold(false);
  printer.leftRight("Date:", data.dateCloture ? formatDate(data.dateCloture) : "-");
  printer.leftRight("Heure:", data.dateCloture ? formatTime(data.dateCloture) : "-");

  printer.drawLine();

  // Caissier
  printer.leftRight("Caissier:", data.caissierNom);

  printer.drawLine();

  // ============================================
  // RESUME DES VENTES
  // ============================================

  printer.alignCenter();
  printer.bold(true);
  printer.println("RESUME DES VENTES");
  printer.bold(false);
  printer.alignLeft();

  printer.drawLine();

  // Nombre de ventes
  printer.leftRight("Nombre de ventes:", data.nombreVentes.toString());

  // Nombre d'annulations
  if (data.nombreAnnulations > 0) {
    printer.leftRight("Annulations:", data.nombreAnnulations.toString());
  }

  // Articles vendus
  printer.leftRight("Articles vendus:", data.articlesVendus.toString());

  // Panier moyen
  printer.leftRight("Panier moyen:", `${formatAmount(data.panierMoyen)} F`);

  printer.drawLine();

  // Total des ventes (grand et gras)
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();
  printer.bold(true);
  printer.leftRight("TOTAL:", `${formatAmount(data.totalVentes)} F`);
  printer.bold(false);
  printer.setTextNormal();

  printer.drawLine();

  // ============================================
  // REPARTITION PAR MODE DE PAIEMENT
  // ============================================

  printer.alignCenter();
  printer.bold(true);
  printer.println("ENCAISSEMENTS");
  printer.bold(false);
  printer.alignLeft();

  printer.drawLine();

  // Especes
  printer.leftRight("Especes:", `${formatAmount(data.paiements.especes)} F`);

  // Cartes bancaires
  printer.leftRight("Cartes:", `${formatAmount(data.paiements.cartes)} F`);

  // Mobile Money
  printer.leftRight("Mobile Money:", `${formatAmount(data.paiements.mobileMoney)} F`);

  // Autres
  if (data.paiements.autres > 0) {
    printer.leftRight("Autres:", `${formatAmount(data.paiements.autres)} F`);
  }

  printer.drawLine();

  // Total encaissements
  const totalEncaissements =
    data.paiements.especes +
    data.paiements.cartes +
    data.paiements.mobileMoney +
    data.paiements.autres;

  printer.bold(true);
  printer.leftRight("Total:", `${formatAmount(totalEncaissements)} F`);
  printer.bold(false);

  printer.drawLine();

  // ============================================
  // REPARTITION PAR TYPE DE VENTE
  // ============================================

  const typesAvecVentes = Object.entries(data.ventesParType).filter(([, stats]) => stats.count > 0);

  if (typesAvecVentes.length > 0) {
    printer.alignCenter();
    printer.bold(true);
    printer.println("VENTES PAR TYPE");
    printer.bold(false);
    printer.alignLeft();

    printer.drawLine();

    for (const [type, stats] of typesAvecVentes) {
      const label = TYPE_VENTE_LABELS[type] || type;
      printer.leftRight(`${label} (${stats.count}):`, `${formatAmount(stats.total)} F`);
    }

    printer.drawLine();
  }

  // ============================================
  // TOP PRODUITS
  // ============================================

  if (data.topProduits.length > 0) {
    printer.alignCenter();
    printer.bold(true);
    printer.println("TOP PRODUITS");
    printer.bold(false);
    printer.alignLeft();

    printer.drawLine();

    const topN = data.topProduits.slice(0, 5);
    const maxNomLen = width >= 48 ? 25 : 18;

    for (let i = 0; i < topN.length; i++) {
      const produit = topN[i];
      const nom = produit.nom.substring(0, maxNomLen);
      printer.leftRight(
        `${i + 1}. ${nom} (${produit.quantite})`,
        `${formatAmount(produit.total)} F`
      );
    }

    printer.drawLine();
  }

  // ============================================
  // TVA
  // ============================================

  printer.alignCenter();
  printer.bold(true);
  printer.println("TVA COLLECTEE");
  printer.bold(false);
  printer.alignLeft();

  printer.drawLine();

  // Total HT
  printer.leftRight("Total HT:", `${formatAmount(data.tva.totalHT)} F`);

  // TVA
  printer.leftRight("TVA:", `${formatAmount(data.tva.totalTVA)} F`);

  // Total TTC
  printer.bold(true);
  printer.leftRight("Total TTC:", `${formatAmount(data.tva.totalTTC)} F`);
  printer.bold(false);

  printer.drawLine();

  // ============================================
  // SITUATION DE CAISSE
  // ============================================

  printer.alignCenter();
  printer.bold(true);
  printer.println("SITUATION DE CAISSE");
  printer.bold(false);
  printer.alignLeft();

  printer.drawLine();

  // Fond de caisse
  printer.leftRight("Fond de caisse:", `${formatAmount(data.fondCaisse)} F`);

  // Especes encaissees
  printer.leftRight("+ Especes encaissees:", `${formatAmount(data.paiements.especes)} F`);

  printer.drawLine();

  // Especes attendues
  printer.bold(true);
  printer.leftRight("= Especes attendues:", `${formatAmount(data.especesAttendues)} F`);
  printer.bold(false);

  // Especes comptees
  printer.leftRight("Especes comptees:", `${formatAmount(data.especesComptees)} F`);

  printer.drawLine();

  // Ecart de caisse (avec mise en evidence si ecart)
  const hasEcart = data.ecart !== 0;
  if (hasEcart) {
    printer.invert(true);
  }
  printer.bold(true);
  printer.leftRight("ECART:", `${data.ecart >= 0 ? "+" : ""}${formatAmount(data.ecart)} F`);
  printer.bold(false);
  if (hasEcart) {
    printer.invert(false);
  }

  // Notes de cloture
  if (data.notesCloture) {
    printer.drawLine();
    printer.bold(true);
    printer.println("Notes:");
    printer.bold(false);
    printer.println(data.notesCloture);
  }

  printer.drawLine();

  // ============================================
  // PIED DE PAGE
  // ============================================

  printer.alignCenter();

  // Signature
  printer.newLine();
  printer.newLine();
  printer.println("Signature du caissier:");
  printer.newLine();
  printer.newLine();
  printer.println("..............................");
  printer.newLine();

  // Heure d'impression
  printer.setTypeFontB();
  printer.println("Document généré par Orema N+ POS");
  printer.println(`Imprime le ${formatDateTime(new Date())}`);
  printer.setTypeFontA();

  // Note legale
  printer.newLine();
  printer.setTypeFontB();
  printer.println("Ce document est un rapport interne");
  printer.println("Il ne constitue pas une facture");
  printer.setTypeFontA();

  // Coupe du papier
  printer.cut();
}
