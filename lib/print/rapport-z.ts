/**
 * Generateur de rapport Z (rapport de cloture de caisse)
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

import {
  createESCPOSBuilder,
  formatPrintAmount,
  formatPrintDate,
  formatPrintTime,
  formatPrintDateTime,
} from "./escpos";
import { type RapportZData, TYPE_VENTE_LABELS } from "./types";

/**
 * Genere les commandes ESC/POS pour un rapport Z
 */
export function generateRapportZ(data: RapportZData, paperWidth: 58 | 80 = 80): string {
  const builder = createESCPOSBuilder(paperWidth);

  builder.init();

  // ============================================
  // EN-TETE
  // ============================================

  builder.align("center");

  // Titre RAPPORT Z
  builder
    .invert(true)
    .size("double")
    .bold(true)
    .println("  RAPPORT Z  ")
    .size("normal")
    .bold(false)
    .invert(false);

  builder.feed(1);

  // Nom de l'etablissement
  builder
    .size("double-height")
    .bold(true)
    .println(data.etablissement.nom.toUpperCase())
    .size("normal")
    .bold(false);

  // Adresse et contact
  if (data.etablissement.adresse) {
    builder.println(data.etablissement.adresse);
  }
  if (data.etablissement.telephone) {
    builder.println(`Tel: ${data.etablissement.telephone}`);
  }

  // Identifiants fiscaux
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
  // PERIODE ET CAISSIER
  // ============================================

  builder.align("left");

  // Identifiant session
  builder.leftRight("Session:", data.sessionId.substring(0, 8) + "...");

  builder.line("-");

  // Ouverture
  builder
    .bold(true)
    .println("OUVERTURE")
    .bold(false)
    .leftRight("Date:", formatPrintDate(data.dateOuverture))
    .leftRight("Heure:", formatPrintTime(data.dateOuverture));

  builder.line("-");

  // Cloture
  builder
    .bold(true)
    .println("CLOTURE")
    .bold(false)
    .leftRight("Date:", data.dateCloture ? formatPrintDate(data.dateCloture) : "-")
    .leftRight("Heure:", data.dateCloture ? formatPrintTime(data.dateCloture) : "-");

  builder.line("-");

  // Caissier
  builder.leftRight("Caissier:", data.caissierNom);

  builder.line("=");

  // ============================================
  // RESUME DES VENTES
  // ============================================

  builder.align("center").bold(true).println("RESUME DES VENTES").bold(false).align("left");

  builder.line("-");

  // Nombre de ventes
  builder.leftRight("Nombre de ventes:", data.nombreVentes.toString());

  // Nombre d'annulations
  if (data.nombreAnnulations > 0) {
    builder.leftRight("Annulations:", data.nombreAnnulations.toString());
  }

  // Articles vendus
  builder.leftRight("Articles vendus:", data.articlesVendus.toString());

  // Panier moyen
  builder.leftRight("Panier moyen:", `${formatPrintAmount(data.panierMoyen)} F`);

  builder.line("-");

  // Total des ventes (grand et gras)
  builder
    .size("double")
    .bold(true)
    .leftRight("TOTAL:", `${formatPrintAmount(data.totalVentes)} F`)
    .size("normal")
    .bold(false);

  builder.line("=");

  // ============================================
  // REPARTITION PAR MODE DE PAIEMENT
  // ============================================

  builder.align("center").bold(true).println("ENCAISSEMENTS").bold(false).align("left");

  builder.line("-");

  // Especes
  builder.leftRight("Especes:", `${formatPrintAmount(data.paiements.especes)} F`);

  // Cartes bancaires
  builder.leftRight("Cartes:", `${formatPrintAmount(data.paiements.cartes)} F`);

  // Mobile Money
  builder.leftRight("Mobile Money:", `${formatPrintAmount(data.paiements.mobileMoney)} F`);

  // Autres
  if (data.paiements.autres > 0) {
    builder.leftRight("Autres:", `${formatPrintAmount(data.paiements.autres)} F`);
  }

  builder.line("-");

  // Total encaissements
  const totalEncaissements =
    data.paiements.especes +
    data.paiements.cartes +
    data.paiements.mobileMoney +
    data.paiements.autres;

  builder
    .bold(true)
    .leftRight("Total:", `${formatPrintAmount(totalEncaissements)} F`)
    .bold(false);

  builder.line("=");

  // ============================================
  // REPARTITION PAR TYPE DE VENTE
  // ============================================

  // Verifier s'il y a des ventes par type
  const typesAvecVentes = Object.entries(data.ventesParType).filter(
    ([_, stats]) => stats.count > 0
  );

  if (typesAvecVentes.length > 0) {
    builder.align("center").bold(true).println("VENTES PAR TYPE").bold(false).align("left");

    builder.line("-");

    for (const [type, stats] of typesAvecVentes) {
      const label = TYPE_VENTE_LABELS[type as keyof typeof TYPE_VENTE_LABELS] || type;
      builder.leftRight(`${label} (${stats.count}):`, `${formatPrintAmount(stats.total)} F`);
    }

    builder.line("=");
  }

  // ============================================
  // TOP PRODUITS
  // ============================================

  if (data.topProduits.length > 0) {
    builder.align("center").bold(true).println("TOP PRODUITS").bold(false).align("left");

    builder.line("-");

    // Afficher les 5 premiers (ou moins si moins de produits)
    const topN = data.topProduits.slice(0, 5);

    for (let i = 0; i < topN.length; i++) {
      const produit = topN[i];
      const nom = produit.nom.substring(0, paperWidth === 80 ? 25 : 18);
      builder.leftRight(
        `${i + 1}. ${nom} (${produit.quantite})`,
        `${formatPrintAmount(produit.total)} F`
      );
    }

    builder.line("=");
  }

  // ============================================
  // TVA
  // ============================================

  builder.align("center").bold(true).println("TVA COLLECTEE").bold(false).align("left");

  builder.line("-");

  // Total HT
  builder.leftRight("Total HT:", `${formatPrintAmount(data.tva.totalHT)} F`);

  // TVA
  builder.leftRight("TVA:", `${formatPrintAmount(data.tva.totalTVA)} F`);

  // Total TTC
  builder
    .bold(true)
    .leftRight("Total TTC:", `${formatPrintAmount(data.tva.totalTTC)} F`)
    .bold(false);

  builder.line("=");

  // ============================================
  // SITUATION DE CAISSE
  // ============================================

  builder.align("center").bold(true).println("SITUATION DE CAISSE").bold(false).align("left");

  builder.line("-");

  // Fond de caisse
  builder.leftRight("Fond de caisse:", `${formatPrintAmount(data.fondCaisse)} F`);

  // Especes encaissees
  builder.leftRight("+ Especes encaissees:", `${formatPrintAmount(data.paiements.especes)} F`);

  builder.line("-");

  // Especes attendues
  builder
    .bold(true)
    .leftRight("= Especes attendues:", `${formatPrintAmount(data.especesAttendues)} F`)
    .bold(false);

  // Especes comptees
  builder.leftRight("Especes comptees:", `${formatPrintAmount(data.especesComptees)} F`);

  builder.line("-");

  // Ecart de caisse (avec mise en evidence si ecart)
  const hasEcart = data.ecart !== 0;
  if (hasEcart) {
    builder.invert(true);
  }
  builder
    .bold(true)
    .leftRight("ECART:", `${data.ecart >= 0 ? "+" : ""}${formatPrintAmount(data.ecart)} F`)
    .bold(false);
  if (hasEcart) {
    builder.invert(false);
  }

  // Notes de cloture
  if (data.notesCloture) {
    builder.line("-");
    builder.bold(true).println("Notes:").bold(false).println(data.notesCloture);
  }

  builder.line("=");

  // ============================================
  // PIED DE PAGE
  // ============================================

  builder.align("center");

  // Signature
  builder.feed(2).println("Signature du caissier:").feed(2).line(".").feed(1);

  // Heure d'impression
  builder
    .font("B")
    .println("Document genere par Orema N+ POS")
    .println(`Imprime le ${formatPrintDateTime(new Date())}`)
    .font("A");

  // Note legale
  builder
    .feed(1)
    .font("B")
    .println("Ce document est un rapport interne")
    .println("Il ne constitue pas une facture")
    .font("A");

  // Coupe du papier
  builder.cut();

  return builder.build();
}

/**
 * Transforme les donnees de session en donnees de rapport Z
 */
export function createRapportZDataFromSession(
  session: {
    id: string;
    dateOuverture: Date;
    dateCloture: Date;
    fondCaisse: number | bigint;
    especesComptees?: number | bigint | null;
    ecart?: number | bigint | null;
    notesCloture?: string | null;
    utilisateur: {
      nom: string;
      prenom?: string | null;
    };
  },
  stats: {
    totalVentes: number;
    nombreVentes: number;
    nombreAnnulations: number;
    articlesVendus: number;
    panierMoyen: number;
    paiements: {
      especes: number;
      cartes: number;
      mobileMoney: number;
      autres: number;
    };
    tva: {
      totalHT: number;
      totalTVA: number;
      totalTTC: number;
    };
    ventesParType: Record<string, { count: number; total: number }>;
    topProduits: Array<{ nom: string; quantite: number; total: number }>;
  },
  etablissement: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    nif?: string | null;
    rccm?: string | null;
  }
): RapportZData {
  const fondCaisse = Number(session.fondCaisse);
  const especesComptees = session.especesComptees ? Number(session.especesComptees) : 0;
  const especesAttendues = fondCaisse + stats.paiements.especes;

  return {
    etablissement: {
      nom: etablissement.nom,
      adresse: etablissement.adresse || null,
      telephone: etablissement.telephone || null,
      email: etablissement.email || null,
      nif: etablissement.nif || null,
      rccm: etablissement.rccm || null,
    },
    sessionId: session.id,
    dateOuverture: session.dateOuverture,
    dateCloture: session.dateCloture,
    caissierNom: `${session.utilisateur.nom}${session.utilisateur.prenom ? " " + session.utilisateur.prenom : ""}`,
    fondCaisse,
    especesComptees,
    especesAttendues,
    ecart: session.ecart ? Number(session.ecart) : especesComptees - especesAttendues,
    totalVentes: stats.totalVentes,
    nombreVentes: stats.nombreVentes,
    nombreAnnulations: stats.nombreAnnulations,
    articlesVendus: stats.articlesVendus,
    panierMoyen: stats.panierMoyen,
    paiements: stats.paiements,
    tva: stats.tva,
    ventesParType: stats.ventesParType,
    topProduits: stats.topProduits,
    notesCloture: session.notesCloture || null,
  };
}
