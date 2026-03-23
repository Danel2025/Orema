/**
 * Utilitaires de sanitisation pour prevenir les injections
 * dans les filtres PostgREST / Supabase et les uploads de fichiers.
 *
 * Principe : whitelist > blacklist, validation en entree.
 *
 * @module lib/utils/sanitize
 */

/**
 * Sanitize les termes de recherche pour prevenir les injections
 * de filtres PostgREST.
 *
 * PostgREST utilise des operateurs speciaux dans les chaines de filtre
 * (ex: `.eq.`, `.ilike.`, `%`, `_`, etc.). Un input malveillant pourrait
 * injecter des operateurs supplementaires dans un `.or()`.
 *
 * Strategie : supprimer tous les caracteres speciaux dangereux,
 * limiter la longueur a 200 caracteres.
 */
export function sanitizeSearchTerm(term: string): string {
  if (!term || typeof term !== "string") return "";
  return term
    .replace(/[%_\\'"();:!<>=~*&|{}[\]]/g, "")
    .replace(/\.\./g, "")
    .trim()
    .slice(0, 200);
}

/**
 * Sanitize un nom de dossier pour les uploads.
 * N'autorise que les caracteres alphanumeriques, tirets et underscores.
 * Retourne 'uploads' par defaut si le nom est invalide.
 */
export function sanitizeFolderName(folder: string): string {
  if (!folder || typeof folder !== "string") return "uploads";
  return folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50) || "uploads";
}

/**
 * Verifie si l'extension d'un fichier est dans la liste autorisee (whitelist).
 *
 * @param filename - Nom du fichier a verifier
 * @param allowed - Liste des extensions autorisees (sans le point)
 * @returns true si l'extension est autorisee
 */
export function isAllowedFileExtension(
  filename: string,
  allowed: string[] = ["jpg", "jpeg", "png", "webp", "gif"]
): boolean {
  if (!filename) return false;
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowed.includes(ext) : false;
}

// ============================================================================
// PROTECTION XSS
// ============================================================================

/**
 * Table d'echappement HTML complete.
 * Couvre tous les caracteres pouvant initier une attaque XSS,
 * y compris les attaques combinées type <img onerror=alert(1)>.
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

const HTML_ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Echappe tous les caracteres HTML dangereux pour prevenir XSS.
 *
 * Protege contre:
 * - <script>alert(1)</script>
 * - <img src=x onerror=alert(1)>
 * - "><img src=x onerror=alert(1)>
 * - javascript:alert(1)
 * - Attributs d'evenements (onclick, onload, etc.)
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Supprime toutes les balises HTML d'une chaine de maniere robuste.
 *
 * Gere les cas complexes:
 * - Balises auto-fermantes: <br/>, <img ... />
 * - Balises malformees: <img onerror="alert(1)" (sans >)
 * - Balises imbriquees: <div><script>alert(1)</script></div>
 * - Commentaires HTML: <!-- ... -->
 */
export function stripHtmlTags(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<!--[\s\S]*?-->/g, "") // Commentaires HTML
    .replace(/<[^>]*>?/g, "") // Balises (y compris malformees sans > final)
    .trim();
}

/**
 * Sanitize une chaine pour affichage securise.
 * Combine stripHtmlTags puis escapeHtml pour une double protection.
 */
export function sanitizeForDisplay(str: string): string {
  return escapeHtml(stripHtmlTags(str));
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valide qu'une chaine est un UUID v4 valide.
 * Utile pour valider les parametres d'ID dans les routes API.
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Valide qu'une chaine est un CUID valide (format Supabase/Prisma).
 * Accepte aussi les UUID pour compatibilite.
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  // UUID v4
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return true;
  // CUID (commence par 'c', 25+ caracteres alphanumeriques)
  if (/^c[a-z0-9]{24,}$/i.test(id)) return true;
  return false;
}
