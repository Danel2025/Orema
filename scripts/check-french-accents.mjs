#!/usr/bin/env node

/**
 * Vérifie les accents français manquants dans les textes visibles par l'utilisateur.
 *
 * Cible uniquement :
 * - Les chaînes littérales ("...", '...')
 * - Le texte JSX (entre > et <)
 *
 * Ignore :
 * - Les commentaires (// ..., /* ... *\/)
 * - Les noms de variables, fonctions, types
 * - Les colonnes DB, imports, slugs, clés de permission
 *
 * Usage:
 *   pnpm check:accents
 *   pnpm check:accents --all     # Inclut aussi les commentaires
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const includeComments = process.argv.includes("--all");

// ============================================================================
// Règles
// ============================================================================

const RULES = [
  // Mots courants (labels, titres)
  [/\bEtablissement(?:s)?\b/g, "Établissement(s)"],
  [/\bEmployes\b/g, "Employés"],
  [/\bParametres\b/g, "Paramètres"],
  [/\bSysteme\b/g, "Système"],
  [/\bCategories\b/g, "Catégories"],
  [/\bCategorie\b/g, "Catégorie"],
  [/\bPrenom\b/g, "Prénom"],
  [/\bTelephone\b/g, "Téléphone"],
  [/\bTelechargement\b/g, "Téléchargement"],
  [/\bNumero\b/g, "Numéro"],
  [/\bDerniere(?:s)?\b/g, "Dernière(s)"],
  [/\bApercu\b/g, "Aperçu"],
  [/\bPrepaye\b/g, "Prépayé"],
  [/\bConcu\b/g, "Conçu"],
  [/\bAcces\b/g, "Accès"],
  [/\bOperations\b/g, "Opérations"],
  [/\bDeverrouillage\b/g, "Déverrouillage"],
  [/\bSecurite\b/g, "Sécurité"],
  [/\bDeconnexion\b/g, "Déconnexion"],
  [/\bPeriode\b/g, "Période"],
  [/\bEcran\b/g, "Écran"],
  [/\bDemarrage\b/g, "Démarrage"],
  [/\bDonnees\b/g, "Données"],
  [/\bdonnees\b/g, "données"],
  [/\bAmelioration\b/g, "Amélioration"],
  [/\bRecuperer\b/g, "Récupérer"],
  [/\bAcceder\b/g, "Accéder"],

  // Verbes (labels de boutons, titres)
  [/\bCreer\b/g, "Créer"],
  [/\bCreez\b/g, "Créez"],
  [/\bGenerer\b/g, "Générer"],
  [/\bGerer\b/g, "Gérer"],
  [/\bGerez\b/g, "Gérez"],
  [/\bReinitialiser\b/g, "Réinitialiser"],
  [/\bCloturer\b/g, "Clôturer"],
  [/\bDesactiver\b/g, "Désactiver"],
  [/\bReactiver\b/g, "Réactiver"],
  [/\bSelectionnez\b/g, "Sélectionnez"],

  // Phrases dans messages d'erreur / validation
  [/\bdoit etre\b/g, "doit être"],
  [/\bdoivent etre\b/g, "doivent être"],
  [/\bpeut pas etre\b/g, "peut pas être"],
  [/\breessayer\b/g, "réessayer"],
  [/\bverrouille\b(?=["'\s,;.!)])/g, "verrouillé"],
  [/\bsuperieur\b/g, "supérieur"],
  [/\binferieur\b/g, "inférieur"],
  [/\bmis a jour\b/g, "mis à jour"],
  [/\bcree avec succes\b/gi, "créé avec succès"],
  [/\btelechargement\b/g, "téléchargement"],
  [/\bdesactive\b(?=["'\s,;.!)])/g, "désactivé"],
  [/\birreversible\b/g, "irréversible"],
  [/\bEtes-vous sur\b/g, "Êtes-vous sûr"],
  [/\bavec succes\b/g, "avec succès"],
  [/\bexporte avec\b/g, "exporté avec"],
  [/\bsupprimee?s? avec\b/g, "supprimé(e)(s) avec"],
  [/\bmodifiee? avec\b/g, "modifié(e) avec"],
  [/\bajoutee? avec\b/g, "ajouté(e) avec"],
  [/\bcloturee? avec\b/g, "clôturé(e) avec"],
  [/\benregistree? avec\b/g, "enregistré(e) avec"],
  [/\bregeneree? avec\b/g, "régénéré(e) avec"],
  [/\bpreparation\b/g, "préparation"],
  [/\bconfigure avec\b/g, "configuré avec"],
  [/\breinitialise avec\b/g, "réinitialisé avec"],
];

// ============================================================================
// Extraction de texte
// ============================================================================

function extractUserVisibleText(line) {
  const segments = [];

  // Chaînes entre guillemets doubles
  for (const m of line.matchAll(/"([^"]{2,})"/g)) {
    segments.push(m[1]);
  }

  // Chaînes entre guillemets simples (pas les chars seuls)
  for (const m of line.matchAll(/'([^']{2,})'/g)) {
    segments.push(m[1]);
  }

  // Texte JSX entre > et <
  for (const m of line.matchAll(/>([^<>{}`$]{2,})</g)) {
    const t = m[1].trim();
    if (t.length > 1) segments.push(t);
  }

  // Template literals avec du texte (après ` ou avant `)
  for (const m of line.matchAll(/`([^`]{2,})`/g)) {
    segments.push(m[1]);
  }

  if (includeComments) {
    const comment = line.match(/\/\/\s*(.{3,})/);
    if (comment) segments.push(comment[1]);
    const doc = line.match(/^\s*\*\s+(.{3,})/);
    if (doc) segments.push(doc[1]);
  }

  return segments;
}

function isProgrammatic(text) {
  if (/^[a-z_]+:[a-z_]+$/.test(text)) return true;         // permission key
  if (/^[a-z0-9][-a-z0-9]*$/.test(text)) return true;      // slug
  if (text.startsWith("@/") || text.startsWith("./")) return true; // import
  if (/^[a-z_]+(?:,\s*[a-z_*]+)+$/.test(text)) return true; // DB select
  if (/^[a-z_]+$/.test(text)) return true;                  // column/table
  if (/^[a-z][a-zA-Z0-9]*$/.test(text)) return true;        // camelCase
  if (/^[A-Z][A-Z_]+$/.test(text)) return true;             // CONSTANT
  if (/animation:\s*"/.test(text)) return true;              // CSS animation
  if (/pulse-|fade-|slide-/.test(text)) return true;         // CSS keyframe names
  return false;
}

// ============================================================================
// Scan
// ============================================================================

const EXTS = new Set([".ts", ".tsx"]);
const SKIP = new Set(["node_modules", ".next", "dist", ".git", ".turbo"]);

function walk(dir) {
  const files = [];
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else if (EXTS.has(extname(e))) files.push(p);
  }
  return files;
}

function check(filePath, root) {
  const lines = readFileSync(filePath, "utf-8").split("\n");
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    const segments = extractUserVisibleText(lines[i]);

    for (const seg of segments) {
      if (isProgrammatic(seg)) continue;

      for (const [re, fix] of RULES) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(seg)) !== null) {
          hits.push({
            file: relative(root, filePath),
            line: i + 1,
            found: m[0],
            fix,
            ctx: lines[i].trim().slice(0, 120),
          });
        }
      }
    }
  }
  return hits;
}

// ============================================================================
// Main
// ============================================================================

const root = join(import.meta.dirname, "..");
const allHits = walk(root).flatMap((f) => check(f, root));

// Grouper par fichier
const grouped = Object.groupBy(allHits, (h) => h.file);
const total = allHits.length;
const fileCount = Object.keys(grouped).length;

if (total === 0) {
  console.log("✅ Aucun accent français manquant détecté !");
  process.exit(0);
}

console.log(
  `\n⚠️  ${total} accent(s) manquant(s) dans ${fileCount} fichier(s)` +
    (includeComments ? " (commentaires inclus)" : "") +
    "\n"
);

for (const [file, hits] of Object.entries(grouped)) {
  console.log(`📄 ${file}`);
  for (const h of hits) {
    console.log(`   L${h.line}: "${h.found}" → "${h.fix}"`);
    console.log(`      ${h.ctx}`);
  }
  console.log();
}

console.log(`Total: ${total} problème(s)`);
if (!includeComments) {
  console.log("Astuce: pnpm check:accents --all  pour inclure les commentaires");
}
process.exit(1);
