/**
 * Utilitaires de formatage partagés pour les composants admin établissements
 */

/**
 * Retourne une chaîne de temps relatif ("Il y a 5min", "Il y a 3j", etc.)
 * pour une date donnée.
 */
export function getRelativeTime(date: string | null | undefined): string {
  if (!date) return "Jamais";

  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
