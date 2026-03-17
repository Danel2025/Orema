/**
 * Templates SMS prédéfinis pour les notifications client.
 *
 * Chaque template retourne un message de max 160 caractères (1 SMS).
 * Le préfixe "OREMA:" est inclus dans la limite.
 */

const PREFIX = "OREMA: ";
const MAX_LENGTH = 160;

/**
 * Tronque proprement un message à la limite SMS (160 chars).
 * Coupe au dernier espace avant la limite et ajoute "..." si nécessaire.
 */
function truncate(text: string): string {
  if (text.length <= MAX_LENGTH) return text;

  const cutoff = MAX_LENGTH - 3; // place pour "..."
  const lastSpace = text.lastIndexOf(" ", cutoff);
  const breakPoint = lastSpace > MAX_LENGTH * 0.5 ? lastSpace : cutoff;

  return text.substring(0, breakPoint) + "...";
}

/**
 * Confirmation de commande.
 *
 * @example confirmationCommande("20260317001", "15 000") =>
 *   "OREMA: Commande #20260317001 confirmée. Total: 15 000 FCFA. Merci!"
 */
export function confirmationCommande(numero: string, total: string): string {
  return truncate(
    `${PREFIX}Commande #${numero} confirmée. Total: ${total} FCFA. Merci!`
  );
}

/**
 * Notification de livraison en cours.
 *
 * @example notificationLivraison("Quartier Louis, Libreville") =>
 *   "OREMA: Votre commande est en cours de livraison vers Quartier Louis, Libreville."
 */
export function notificationLivraison(adresse: string): string {
  return truncate(
    `${PREFIX}Votre commande est en cours de livraison vers ${adresse}.`
  );
}

/**
 * Rappel de points fidélité.
 *
 * @example rappelFidelite("Jean", 250) =>
 *   "OREMA: Bonjour Jean, vous avez 250 points fidélité!"
 */
export function rappelFidelite(nom: string, points: number): string {
  return truncate(
    `${PREFIX}Bonjour ${nom}, vous avez ${points} points fidélité!`
  );
}

/**
 * Alerte de stock bas (notification interne).
 *
 * @example alerteStockBas("Coca-Cola 33cl", 5) =>
 *   "OREMA: Alerte: Coca-Cola 33cl — stock bas (5 restants)"
 */
export function alerteStockBas(produit: string, stock: number): string {
  return truncate(
    `${PREFIX}Alerte: ${produit} — stock bas (${stock} restants)`
  );
}

/**
 * Message personnalisé avec préfixe OREMA.
 */
export function messagePersonnalise(texte: string): string {
  return truncate(`${PREFIX}${texte}`);
}

/**
 * Commande prête à récupérer.
 *
 * @example commandePrete("20260317001") =>
 *   "OREMA: Votre commande #20260317001 est prête! Venez la récupérer."
 */
export function commandePrete(numero: string): string {
  return truncate(
    `${PREFIX}Votre commande #${numero} est prête! Venez la récupérer.`
  );
}

/**
 * Confirmation de réservation.
 */
export function confirmationReservation(
  date: string,
  heure: string,
  nombrePersonnes: number
): string {
  return truncate(
    `${PREFIX}Réservation confirmée: ${nombrePersonnes} pers. le ${date} à ${heure}.`
  );
}
