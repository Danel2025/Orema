/**
 * Module d'impression via le systeme (window.print)
 *
 * Permet d'imprimer sur n'importe quelle imprimante deja installee
 * et configuree dans le systeme d'exploitation (Windows, Linux, macOS).
 *
 * Fonctionne en generant un document HTML formate comme un ticket
 * de caisse, puis en l'imprimant via une iframe cachee avec window.print().
 *
 * Avantages :
 * - Aucune configuration d'imprimante necessaire
 * - Compatible avec TOUTES les imprimantes (thermiques, laser, jet d'encre)
 * - Fonctionne sur tous les navigateurs
 * - Supporte l'impression silencieuse en mode kiosque Chrome
 *
 * @example
 * ```ts
 * import { printViaSystem } from "@/lib/print/system-print";
 *
 * // Imprimer un ticket
 * const ticketData = { ... };
 * const html = generateTicketHTML(ticketData);
 * await printViaSystem(html);
 * ```
 */

import type { TicketClientData, BonPreparationData, RapportZData, AdditionData, PrintResult } from "./types";
import { TYPE_VENTE_LABELS, PAIEMENT_LABELS } from "./types";
import { escapeHtml } from "@/lib/utils/sanitize";

/**
 * Options d'impression systeme
 */
export interface SystemPrintOptions {
  /** Largeur du ticket en mm (defaut: 80) */
  paperWidth?: 58 | 76 | 80;
  /** Delai avant impression en ms (defaut: 300, pour laisser le CSS se charger) */
  delay?: number;
}

// ============================================
// IMPRESSION VIA IFRAME
// ============================================

/**
 * Imprime du contenu HTML via une iframe cachee
 * Utilise window.print() donc toutes les imprimantes systeme sont accessibles
 */
export async function printViaSystem(
  htmlContent: string,
  options: SystemPrintOptions = {}
): Promise<PrintResult> {
  const { paperWidth = 80, delay = 300 } = options;

  try {
    // Creer l'iframe cachee
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return {
        success: false,
        error: "Impossible de creer le document d'impression",
      };
    }

    // Ecrire le contenu HTML avec les styles d'impression
    const fullHTML = wrapWithPrintStyles(htmlContent, paperWidth);
    iframeDoc.open();
    iframeDoc.write(fullHTML);
    iframeDoc.close();

    // Attendre que le contenu soit charge
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Lancer l'impression
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }

    // Nettoyer l'iframe apres un delai
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);

    return {
      success: true,
      message: "Impression envoyee au systeme",
    };
  } catch (error) {
    return {
      success: false,
      error: `Erreur d'impression systeme: ${error instanceof Error ? error.message : "Inconnue"}`,
    };
  }
}

/**
 * Enveloppe le contenu HTML avec les styles d'impression
 */
function wrapWithPrintStyles(content: string, paperWidth: number): string {
  const widthMm = paperWidth;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Impression</title>
<style>
  @page {
    size: ${widthMm}mm auto;
    margin: 2mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Courier New', 'Consolas', 'Liberation Mono', monospace;
    font-size: ${widthMm >= 80 ? "11px" : "9px"};
    line-height: 1.3;
    color: #000;
    width: ${widthMm - 4}mm;
    max-width: ${widthMm - 4}mm;
    background: #fff;
  }

  .ticket {
    width: 100%;
    padding: 2mm 0;
  }

  .center { text-align: center; }
  .left { text-align: left; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .big { font-size: ${widthMm >= 80 ? "16px" : "13px"}; font-weight: bold; }
  .small { font-size: ${widthMm >= 80 ? "9px" : "8px"}; }

  .separator {
    border: none;
    border-top: 1px dashed #000;
    margin: 3px 0;
  }

  .separator-double {
    border: none;
    border-top: 2px solid #000;
    margin: 3px 0;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px;
  }

  .row .label { flex-shrink: 0; }
  .row .value { text-align: right; flex-shrink: 0; }
  .row .dots {
    flex: 1;
    border-bottom: 1px dotted #ccc;
    margin: 0 2px;
    min-width: 10px;
  }

  table.items {
    width: 100%;
    border-collapse: collapse;
    margin: 4px 0;
  }

  table.items th {
    font-weight: bold;
    text-align: left;
    border-bottom: 1px solid #000;
    padding: 2px 0;
    font-size: ${widthMm >= 80 ? "10px" : "8px"};
  }

  table.items td {
    padding: 1px 0;
    vertical-align: top;
  }

  table.items .qty { text-align: center; width: 35px; }
  table.items .price { text-align: right; width: 70px; }
  table.items .total { text-align: right; width: 80px; font-weight: bold; }
  table.items .name { text-align: left; }

  .note {
    font-size: ${widthMm >= 80 ? "9px" : "7px"};
    color: #333;
    padding-left: 8px;
    font-style: italic;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 1px 0;
  }

  .grand-total {
    font-size: ${widthMm >= 80 ? "18px" : "14px"};
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }

  .footer {
    text-align: center;
    margin-top: 8px;
    font-size: ${widthMm >= 80 ? "10px" : "8px"};
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }

  @media screen {
    body {
      max-width: 350px;
      margin: 20px auto;
      padding: 10px;
      border: 1px solid #ddd;
      background: #fff;
    }
  }
</style>
</head>
<body>
${content}
</body>
</html>`;
}

// ============================================
// GENERATEURS HTML (equivalent des templates ESC/POS)
// ============================================

/**
 * Formate un montant en FCFA
 */
function fmt(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate une date
 */
function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Africa/Libreville",
  });
}

function fmtTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Libreville",
  });
}

function fmtDateTime(date: Date | string): string {
  return `${fmtDate(date)} ${fmtTime(date)}`;
}

/**
 * Genere le HTML d'un ticket client (recu de caisse)
 */
export function generateTicketHTML(data: TicketClientData): string {
  const lines: string[] = [];

  lines.push('<div class="ticket">');

  // ========== EN-TETE ==========
  lines.push('<div class="center">');
  lines.push(`<div class="big">${escapeHtml(data.etablissement.nom.toUpperCase())}</div>`);

  if (data.etablissement.adresse) {
    lines.push(`<div>${escapeHtml(data.etablissement.adresse)}</div>`);
  }
  if (data.etablissement.telephone) {
    lines.push(`<div>Tel: ${escapeHtml(data.etablissement.telephone)}</div>`);
  }
  if (data.etablissement.nif || data.etablissement.rccm) {
    const fiscal: string[] = [];
    if (data.etablissement.nif) fiscal.push(`NIF: ${data.etablissement.nif}`);
    if (data.etablissement.rccm) fiscal.push(`RCCM: ${data.etablissement.rccm}`);
    lines.push(`<div class="small">${escapeHtml(fiscal.join(" - "))}</div>`);
  }
  lines.push("</div>");

  lines.push('<hr class="separator-double">');

  // ========== INFOS TICKET ==========
  lines.push(row("Ticket", `#${data.numeroTicket}`));
  lines.push(row("Date", fmtDateTime(data.dateVente)));
  lines.push(row("Type", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente));

  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) tableInfo += ` (${data.tableZone})`;
    lines.push(row("Table", tableInfo));
  }
  if (data.clientNom) {
    lines.push(row("Client", data.clientNom));
  }
  lines.push(row("Caissier", data.caissierNom));

  lines.push('<hr class="separator">');

  // ========== ARTICLES ==========
  lines.push('<table class="items">');
  lines.push("<thead><tr>");
  lines.push('<th class="name">Article</th>');
  lines.push('<th class="qty">Qte</th>');
  lines.push('<th class="price">P.U.</th>');
  lines.push('<th class="total">Total</th>');
  lines.push("</tr></thead>");
  lines.push("<tbody>");

  for (const ligne of data.lignes) {
    lines.push("<tr>");
    lines.push(`<td class="name">${escapeHtml(ligne.produitNom)}</td>`);
    lines.push(`<td class="qty">${ligne.quantite}</td>`);
    lines.push(`<td class="price">${fmt(ligne.prixUnitaire)}</td>`);
    lines.push(`<td class="total">${fmt(ligne.total)}</td>`);
    lines.push("</tr>");

    // Supplements
    if (ligne.supplements && ligne.supplements.length > 0) {
      for (const sup of ligne.supplements) {
        lines.push("<tr>");
        lines.push(`<td class="note" colspan="3">+ ${escapeHtml(sup.nom)}</td>`);
        lines.push(`<td class="price">${fmt(sup.prix)}</td>`);
        lines.push("</tr>");
      }
    }

    // Notes
    if (ligne.notes) {
      lines.push("<tr>");
      lines.push(`<td class="note" colspan="4">→ ${escapeHtml(ligne.notes)}</td>`);
      lines.push("</tr>");
    }
  }

  lines.push("</tbody></table>");

  lines.push('<hr class="separator">');

  // ========== TOTAUX ==========
  lines.push(totalRow("Sous-total HT", `${fmt(data.sousTotal)} F`));
  lines.push(totalRow("TVA", `${fmt(data.totalTva)} F`));

  if (data.totalRemise > 0) {
    let remiseLabel = "Remise";
    if (data.remiseType === "POURCENTAGE" && data.remiseValeur) {
      remiseLabel = `Remise (${data.remiseValeur}%)`;
    }
    lines.push(totalRow(remiseLabel, `-${fmt(data.totalRemise)} F`));
  }

  lines.push('<hr class="separator-double">');
  lines.push(
    `<div class="grand-total"><span>TOTAL TTC</span><span>${fmt(data.totalFinal)} FCFA</span></div>`
  );
  lines.push('<hr class="separator-double">');

  // ========== PAIEMENTS ==========
  lines.push('<div class="bold center" style="margin: 4px 0;">MODE DE PAIEMENT</div>');

  for (const paiement of data.paiements) {
    const label = PAIEMENT_LABELS[paiement.mode] || paiement.mode;
    lines.push(totalRow(label, `${fmt(paiement.montant)} F`));

    if (paiement.reference) {
      lines.push(`<div class="note">Ref: ${escapeHtml(paiement.reference)}</div>`);
    }
  }

  if (data.montantRecu && data.montantRecu > 0) {
    lines.push('<hr class="separator">');
    lines.push(totalRow("Montant recu", `${fmt(data.montantRecu)} F`));
    if (data.monnaieRendue && data.monnaieRendue > 0) {
      lines.push(
        `<div class="total-row bold"><span>Monnaie rendue</span><span>${fmt(data.monnaieRendue)} F</span></div>`
      );
    }
  }

  // ========== PIED DE PAGE ==========
  lines.push('<hr class="separator">');
  lines.push('<div class="footer">');

  const message = data.etablissement.messageTicket || "Merci de votre visite !\nA bientot !";
  for (const line of message.split("\n")) {
    lines.push(`<div>${escapeHtml(line)}</div>`);
  }

  lines.push("</div>");
  lines.push("</div>"); // .ticket

  return lines.join("\n");
}

/**
 * Genere le HTML d'une addition (pre-note pour le client)
 */
export function generateAdditionHTML(data: AdditionData): string {
  const lines: string[] = [];

  lines.push('<div class="ticket">');

  // ========== EN-TETE ==========
  lines.push('<div class="center">');
  lines.push(`<div class="big">${escapeHtml(data.etablissement.nom.toUpperCase())}</div>`);

  if (data.etablissement.adresse) {
    lines.push(`<div>${escapeHtml(data.etablissement.adresse)}</div>`);
  }
  if (data.etablissement.telephone) {
    lines.push(`<div>Tel: ${escapeHtml(data.etablissement.telephone)}</div>`);
  }
  if (data.etablissement.nif || data.etablissement.rccm) {
    const fiscal: string[] = [];
    if (data.etablissement.nif) fiscal.push(`NIF: ${data.etablissement.nif}`);
    if (data.etablissement.rccm) fiscal.push(`RCCM: ${data.etablissement.rccm}`);
    lines.push(`<div class="small">${escapeHtml(fiscal.join(" - "))}</div>`);
  }
  lines.push("</div>");

  lines.push('<hr class="separator-double">');

  lines.push('<div class="center bold" style="font-size:16px;margin:4px 0;">ADDITION</div>');

  lines.push('<hr class="separator-double">');

  // ========== INFOS ==========
  lines.push(row("Date", fmtDateTime(data.dateAddition)));
  lines.push(row("Type", TYPE_VENTE_LABELS[data.typeVente] || data.typeVente));
  lines.push(row("Serveur", data.serveurNom));

  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) tableInfo += ` (${data.tableZone})`;
    lines.push(row("Table", tableInfo));
  }
  if (data.couverts) {
    lines.push(row("Couverts", String(data.couverts)));
  }
  if (data.clientNom) {
    lines.push(row("Client", data.clientNom));
  }

  lines.push('<hr class="separator">');

  // ========== ARTICLES ==========
  lines.push('<table class="items">');
  lines.push("<thead><tr>");
  lines.push('<th class="name">Article</th>');
  lines.push('<th class="qty">Qte</th>');
  lines.push('<th class="price">P.U.</th>');
  lines.push('<th class="total">Total</th>');
  lines.push("</tr></thead>");
  lines.push("<tbody>");

  for (const ligne of data.lignes) {
    lines.push("<tr>");
    lines.push(`<td class="name">${escapeHtml(ligne.produitNom)}</td>`);
    lines.push(`<td class="qty">${ligne.quantite}</td>`);
    lines.push(`<td class="price">${fmt(ligne.prixUnitaire)}</td>`);
    lines.push(`<td class="total">${fmt(ligne.total)}</td>`);
    lines.push("</tr>");

    if (ligne.supplements && ligne.supplements.length > 0) {
      for (const sup of ligne.supplements) {
        lines.push("<tr>");
        lines.push(`<td class="note" colspan="3">+ ${escapeHtml(sup.nom)}</td>`);
        lines.push(`<td class="price">${fmt(sup.prix)}</td>`);
        lines.push("</tr>");
      }
    }

    if (ligne.notes) {
      lines.push("<tr>");
      lines.push(`<td class="note" colspan="4">&rarr; ${escapeHtml(ligne.notes)}</td>`);
      lines.push("</tr>");
    }
  }

  lines.push("</tbody></table>");

  lines.push('<hr class="separator">');

  // ========== TOTAUX ==========
  lines.push(totalRow("Sous-total HT", `${fmt(data.sousTotal)} F`));
  lines.push(totalRow("TVA", `${fmt(data.totalTva)} F`));

  if (data.totalRemise > 0) {
    let remiseLabel = "Remise";
    if (data.remiseType === "POURCENTAGE" && data.remiseValeur) {
      remiseLabel = `Remise (${data.remiseValeur}%)`;
    }
    lines.push(totalRow(remiseLabel, `-${fmt(data.totalRemise)} F`));
  }

  lines.push('<hr class="separator-double">');
  lines.push(
    `<div class="grand-total"><span>TOTAL TTC</span><span>${fmt(data.totalFinal)} FCFA</span></div>`
  );
  lines.push('<hr class="separator-double">');

  // ========== LIVRAISON ==========
  if (data.adresseLivraison) {
    lines.push(row("Adresse", data.adresseLivraison));
  }
  if (data.telephoneLivraison) {
    lines.push(row("Téléphone", data.telephoneLivraison));
  }

  // ========== PIED DE PAGE ==========
  lines.push('<div class="footer">');
  lines.push("<div>--- Pre-note / Addition ---</div>");
  lines.push("<div class=\"small\">Ce document n'est pas un recu de paiement</div>");
  lines.push("</div>");

  lines.push("</div>"); // .ticket

  return lines.join("\n");
}

/**
 * Genere le HTML d'un bon de preparation (cuisine/bar)
 */
export function generateBonPreparationHTML(
  data: BonPreparationData,
  type: "cuisine" | "bar" = "cuisine"
): string {
  const lines: string[] = [];
  const title = type === "cuisine" ? "BON DE CUISINE" : "BON DE BAR";

  lines.push('<div class="ticket">');

  // En-tete
  lines.push(`<div class="center big">${title}</div>`);
  if (data.urgent) {
    lines.push(
      '<div class="center bold" style="font-size:16px;border:2px solid #000;padding:4px;margin:4px 0;">!!! URGENT !!!</div>'
    );
  }

  lines.push('<hr class="separator-double">');

  // Infos
  lines.push(row("Commande", `#${data.numeroCommande}`));
  lines.push(row("Date", fmtDateTime(data.dateCommande)));
  lines.push(row("Serveur", data.serveurNom));

  if (data.tableNumero) {
    let tableInfo = `Table ${data.tableNumero}`;
    if (data.tableZone) tableInfo += ` (${data.tableZone})`;
    lines.push(row("Table", tableInfo));
  }

  const typeLabel = TYPE_VENTE_LABELS[data.typeVente] || data.typeVente;
  lines.push(row("Type", typeLabel));

  lines.push('<hr class="separator-double">');

  // Articles
  for (const ligne of data.lignes) {
    lines.push(
      `<div class="row bold" style="font-size:14px;"><span>${ligne.quantite}x</span><span>${escapeHtml(ligne.produitNom)}</span></div>`
    );

    if (ligne.supplements && ligne.supplements.length > 0) {
      for (const sup of ligne.supplements) {
        lines.push(`<div class="note">+ ${escapeHtml(sup.nom)}</div>`);
      }
    }

    if (ligne.notes) {
      lines.push(`<div class="note" style="font-weight:bold;">→ ${escapeHtml(ligne.notes)}</div>`);
    }
  }

  // Notes globales
  if (data.notes) {
    lines.push('<hr class="separator">');
    lines.push(`<div class="bold">Notes: ${escapeHtml(data.notes)}</div>`);
  }

  lines.push("</div>");
  return lines.join("\n");
}

/**
 * Genere le HTML d'un rapport Z
 */
export function generateRapportZHTML(data: RapportZData): string {
  const lines: string[] = [];

  lines.push('<div class="ticket">');

  // En-tete
  lines.push('<div class="center">');
  lines.push(`<div class="big">${escapeHtml(data.etablissement.nom)}</div>`);
  if (data.etablissement.adresse) {
    lines.push(`<div>${escapeHtml(data.etablissement.adresse)}</div>`);
  }
  lines.push('<div class="big" style="margin-top:8px;">RAPPORT Z</div>');
  lines.push("</div>");

  lines.push('<hr class="separator-double">');

  // Session
  lines.push(row("Session", data.sessionId.substring(0, 8)));
  lines.push(row("Caissier", data.caissierNom));
  lines.push(row("Ouverture", fmtDateTime(data.dateOuverture)));
  if (data.dateCloture) {
    lines.push(row("Cloture", fmtDateTime(data.dateCloture)));
  }

  lines.push('<hr class="separator">');

  // Ventes
  lines.push('<div class="center bold">VENTES</div>');
  lines.push(totalRow("Nombre de ventes", String(data.nombreVentes)));
  lines.push(totalRow("Articles vendus", String(data.articlesVendus)));
  lines.push(totalRow("Panier moyen", `${fmt(data.panierMoyen)} F`));
  lines.push(totalRow("Annulations", String(data.nombreAnnulations)));

  lines.push('<hr class="separator">');

  // Paiements
  lines.push('<div class="center bold">PAIEMENTS</div>');
  lines.push(totalRow("Especes", `${fmt(data.paiements.especes)} F`));
  lines.push(totalRow("Cartes", `${fmt(data.paiements.cartes)} F`));
  lines.push(totalRow("Mobile Money", `${fmt(data.paiements.mobileMoney)} F`));
  lines.push(totalRow("Autres", `${fmt(data.paiements.autres)} F`));

  lines.push('<hr class="separator">');

  // TVA
  lines.push('<div class="center bold">TVA</div>');
  lines.push(totalRow("Total HT", `${fmt(data.tva.totalHT)} F`));
  lines.push(totalRow("Total TVA", `${fmt(data.tva.totalTVA)} F`));
  lines.push(totalRow("Total TTC", `${fmt(data.tva.totalTTC)} F`));

  lines.push('<hr class="separator-double">');

  // Caisse
  lines.push('<div class="center bold">CAISSE</div>');
  lines.push(totalRow("Fond de caisse", `${fmt(data.fondCaisse)} F`));
  lines.push(totalRow("Especes attendues", `${fmt(data.especesAttendues)} F`));
  lines.push(totalRow("Especes comptees", `${fmt(data.especesComptees)} F`));

  const ecartColor = data.ecart === 0 ? "" : data.ecart > 0 ? "color:green;" : "color:red;";
  lines.push(
    `<div class="total-row bold" style="${ecartColor}"><span>Ecart</span><span>${data.ecart >= 0 ? "+" : ""}${fmt(data.ecart)} F</span></div>`
  );

  lines.push('<hr class="separator-double">');

  // Total
  lines.push(
    `<div class="grand-total"><span>TOTAL</span><span>${fmt(data.totalVentes)} FCFA</span></div>`
  );

  // Top produits
  if (data.topProduits && data.topProduits.length > 0) {
    lines.push('<hr class="separator">');
    lines.push('<div class="center bold">TOP PRODUITS</div>');
    for (const prod of data.topProduits.slice(0, 5)) {
      lines.push(totalRow(`${prod.nom} (x${prod.quantite})`, `${fmt(prod.total)} F`));
    }
  }

  if (data.notesCloture) {
    lines.push('<hr class="separator">');
    lines.push(`<div class="small">Notes: ${escapeHtml(data.notesCloture)}</div>`);
  }

  lines.push("</div>");
  return lines.join("\n");
}

// ============================================
// HELPERS
// ============================================

function row(label: string, value: string): string {
  return `<div class="row"><span class="label">${escapeHtml(label)}:</span><span class="dots"></span><span class="value">${escapeHtml(value)}</span></div>`;
}

function totalRow(label: string, value: string): string {
  return `<div class="total-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

// escapeHtml importé depuis @/lib/utils/sanitize

// ============================================
// PAGE DE TEST UNIVERSELLE
// ============================================

/**
 * Genere une page de test HTML imprimable sur tout type d'imprimante
 * (jet d'encre, laser, thermique) via window.print().
 *
 * La page inclut :
 * - En-tete avec le nom de l'etablissement
 * - Titre "PAGE DE TEST"
 * - Date et heure du test
 * - Motif en damier pour verifier la qualite d'impression
 * - Textes en differentes tailles
 * - Tableau style ticket avec articles fictifs
 * - Pied de page Orema N+
 */
export function generateTestPageHTML(etablissementNom: string): string {
  const now = new Date();
  const dateStr = fmtDate(now);
  const timeStr = fmtTime(now);
  const lines: string[] = [];

  lines.push('<div class="ticket">');

  // ========== BORDURE DECORATIVE HAUT ==========
  lines.push('<div class="test-border-top">');
  for (let i = 0; i < 4; i++) {
    lines.push('<div class="test-border-row">');
    for (let j = 0; j < 20; j++) {
      const filled = (i + j) % 2 === 0;
      lines.push(`<span class="test-square${filled ? " filled" : ""}"></span>`);
    }
    lines.push("</div>");
  }
  lines.push("</div>");

  // ========== EN-TETE ==========
  lines.push('<div class="center" style="margin:8px 0 4px;">');
  lines.push(`<div class="big">${escapeHtml(etablissementNom.toUpperCase())}</div>`);
  lines.push("</div>");

  lines.push('<hr class="separator-double">');

  lines.push('<div class="center" style="margin:6px 0;">');
  lines.push('<div class="test-title">PAGE DE TEST</div>');
  lines.push('<div class="test-subtitle">Test d\'impression systeme</div>');
  lines.push("</div>");

  lines.push('<hr class="separator-double">');

  // ========== DATE ET HEURE ==========
  lines.push(row("Date", dateStr));
  lines.push(row("Heure", timeStr));
  lines.push(row("Imprimante", "Système (window.print)"));

  lines.push('<hr class="separator">');

  // ========== TEST DE TAILLES DE TEXTE ==========
  lines.push('<div class="center bold" style="margin:6px 0 4px;">TAILLES DE TEXTE</div>');
  lines.push('<div style="font-size:8px;margin:2px 0;">8px - Le renard brun rapide saute par-dessus le chien paresseux</div>');
  lines.push('<div style="font-size:10px;margin:2px 0;">10px - Le renard brun rapide saute</div>');
  lines.push('<div style="font-size:12px;margin:2px 0;">12px - Le renard brun rapide</div>');
  lines.push('<div style="font-size:14px;margin:2px 0;font-weight:bold;">14px gras - Montant total</div>');
  lines.push('<div style="font-size:18px;margin:2px 0;font-weight:bold;">18px - 25 000 FCFA</div>');

  lines.push('<hr class="separator">');

  // ========== TEST CARACTERES SPECIAUX ==========
  lines.push('<div class="center bold" style="margin:6px 0 4px;">CARACTERES SPECIAUX</div>');
  lines.push('<div style="margin:2px 0;">Accents : e e a u i o c</div>');
  lines.push('<div style="margin:2px 0;">Symboles : @ # % &amp; * + = / \\ | ~ ^</div>');
  lines.push('<div style="margin:2px 0;">Monnaie : 15 000 FCFA | 250,00 EUR</div>');

  lines.push('<hr class="separator">');

  // ========== TABLEAU ARTICLES FICTIFS ==========
  lines.push('<div class="center bold" style="margin:6px 0 4px;">TICKET EXEMPLE</div>');
  lines.push('<table class="items">');
  lines.push("<thead><tr>");
  lines.push('<th class="name">Article</th>');
  lines.push('<th class="qty">Qte</th>');
  lines.push('<th class="price">P.U.</th>');
  lines.push('<th class="total">Total</th>');
  lines.push("</tr></thead>");
  lines.push("<tbody>");

  const sampleItems = [
    { nom: "Poulet braise", qty: 2, pu: 5000 },
    { nom: "Biere Regab 65cl", qty: 3, pu: 1500 },
    { nom: "Riz sauce arachide", qty: 1, pu: 3500 },
    { nom: "Jus de gingembre", qty: 2, pu: 1000 },
    { nom: "Banane plantain frit", qty: 1, pu: 2000 },
  ];

  let sousTotal = 0;
  for (const item of sampleItems) {
    const total = item.qty * item.pu;
    sousTotal += total;
    lines.push("<tr>");
    lines.push(`<td class="name">${item.nom}</td>`);
    lines.push(`<td class="qty">${item.qty}</td>`);
    lines.push(`<td class="price">${fmt(item.pu)}</td>`);
    lines.push(`<td class="total">${fmt(total)}</td>`);
    lines.push("</tr>");
  }

  lines.push("</tbody></table>");

  lines.push('<hr class="separator">');

  const tva = Math.round(sousTotal * 0.18);
  const totalTTC = sousTotal + tva;

  lines.push(totalRow("Sous-total HT", `${fmt(sousTotal)} F`));
  lines.push(totalRow("TVA 18%", `${fmt(tva)} F`));

  lines.push('<hr class="separator-double">');
  lines.push(
    `<div class="grand-total"><span>TOTAL TTC</span><span>${fmt(totalTTC)} FCFA</span></div>`
  );
  lines.push('<hr class="separator-double">');

  // ========== MOTIF DAMIER QUALITE ==========
  lines.push('<div class="center bold" style="margin:6px 0 4px;">TEST QUALITE IMPRESSION</div>');

  lines.push('<div class="test-checkerboard">');
  for (let i = 0; i < 6; i++) {
    lines.push('<div class="test-checker-row">');
    for (let j = 0; j < 16; j++) {
      const filled = (i + j) % 2 === 0;
      lines.push(`<span class="test-checker${filled ? " dark" : " light"}"></span>`);
    }
    lines.push("</div>");
  }
  lines.push("</div>");

  // ========== LIGNES HORIZONTALES ==========
  lines.push('<div style="margin:6px 0;">');
  lines.push('<div class="center small" style="margin-bottom:3px;">Lignes fines a epaisses :</div>');
  lines.push('<div style="border-top:1px solid #000;margin:3px 0;"></div>');
  lines.push('<div style="border-top:2px solid #000;margin:3px 0;"></div>');
  lines.push('<div style="border-top:3px solid #000;margin:3px 0;"></div>');
  lines.push('<div style="border-top:1px dashed #000;margin:3px 0;"></div>');
  lines.push('<div style="border-top:1px dotted #000;margin:3px 0;"></div>');
  lines.push("</div>");

  // ========== NIVEAUX DE GRIS ==========
  lines.push('<div class="center small" style="margin:3px 0;">Niveaux de gris :</div>');
  lines.push('<div class="test-grayscale">');
  const grays = ["#000", "#333", "#666", "#999", "#ccc", "#eee"];
  for (const g of grays) {
    lines.push(`<span class="test-gray-block" style="background:${g};"></span>`);
  }
  lines.push("</div>");

  lines.push('<hr class="separator">');

  // ========== BORDURE DECORATIVE BAS ==========
  lines.push('<div class="test-border-bottom">');
  for (let i = 0; i < 4; i++) {
    lines.push('<div class="test-border-row">');
    for (let j = 0; j < 20; j++) {
      const filled = (i + j) % 2 === 0;
      lines.push(`<span class="test-square${filled ? " filled" : ""}"></span>`);
    }
    lines.push("</div>");
  }
  lines.push("</div>");

  // ========== PIED DE PAGE ==========
  lines.push('<div class="footer" style="margin-top:10px;">');
  lines.push("<div class=\"bold\">Orema N+ - Système POS</div>");
  lines.push(`<div>Test effectue le ${dateStr} a ${timeStr}</div>`);
  lines.push("<div class=\"small\" style=\"margin-top:4px;\">Si cette page s'imprime correctement,</div>");
  lines.push("<div class=\"small\">votre imprimante est prete a l'emploi.</div>");
  lines.push("</div>");

  lines.push("</div>"); // .ticket

  // ========== STYLES SUPPLEMENTAIRES POUR LA PAGE DE TEST ==========
  // On injecte un bloc <style> en haut du contenu qui sera insere dans le body
  // par wrapWithPrintStyles. C'est supporte car le navigateur accepte <style> dans <body>.
  const testStyles = `<style>
  .test-title {
    font-size: 22px;
    font-weight: bold;
    letter-spacing: 3px;
    margin: 4px 0;
  }
  .test-subtitle {
    font-size: 11px;
    color: #555;
    margin-bottom: 2px;
  }
  .test-border-top, .test-border-bottom {
    margin: 0 0 4px;
  }
  .test-border-bottom {
    margin: 4px 0 0;
  }
  .test-border-row {
    display: flex;
    justify-content: center;
    gap: 0;
  }
  .test-square {
    display: inline-block;
    width: 3.2mm;
    height: 3.2mm;
    border: 0.5px solid #ccc;
    flex-shrink: 0;
  }
  .test-square.filled {
    background: #000;
    border-color: #000;
  }
  .test-checkerboard {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 4px 0;
  }
  .test-checker-row {
    display: flex;
    gap: 0;
  }
  .test-checker {
    display: inline-block;
    width: 4mm;
    height: 4mm;
    flex-shrink: 0;
  }
  .test-checker.dark {
    background: #000;
  }
  .test-checker.light {
    background: #fff;
    border: 0.5px solid #ddd;
  }
  .test-grayscale {
    display: flex;
    justify-content: center;
    gap: 2px;
    margin: 4px 0;
  }
  .test-gray-block {
    display: inline-block;
    width: 8mm;
    height: 6mm;
    border: 0.5px solid #ccc;
    flex-shrink: 0;
  }
</style>`;

  return testStyles + "\n" + lines.join("\n");
}

/**
 * Imprime une page de test via le systeme (window.print).
 * Utilise un format 80mm compatible avec toutes les imprimantes.
 */
export async function printSystemTest(
  etablissementNom: string,
  options?: Omit<SystemPrintOptions, "paperWidth">
): Promise<PrintResult> {
  const html = generateTestPageHTML(etablissementNom);
  return printViaSystem(html, { ...options, paperWidth: 80 });
}
