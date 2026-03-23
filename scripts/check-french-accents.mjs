#!/usr/bin/env node

/**
 * Script de vérification des accents français dans le code source
 *
 * Détecte les mots français courants écrits sans accents dans :
 * - Les chaînes de caractères ("...", '...', `...`)
 * - Le texte JSX (entre balises >...</)
 * - Les commentaires (// ... et /* ... *\/)
 *
 * Ignore volontairement :
 * - Les noms de variables, fonctions, types (identifiants programmatiques)
 * - Les colonnes de base de données (Supabase/Prisma)
 * - Les imports et chemins de fichiers
 * - Les clés de permissions (ex: "vente:creer")
 * - Les slugs et URLs
 *
 * Usage:
 *   pnpm check:accents              # Vérification complète
 *   node scripts/check-french-accents.mjs
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

// ============================================================================
// Règles de détection
// ============================================================================

// Mots français courants nécessitant des accents
// Format: [regex, correction]
// Ces regex ne matchent QUE des mots isolés (word boundary)
const ACCENT_RULES = [
  // Labels et mots courants (É/é)
  [/\bEtablissement(?:s)?\b/g, "Établissement(s)"],
  [/\bEmployes\b/g, "Employés"],
  [/\bParametres\b/g, "Paramètres"],
  [/\bSysteme\b/g, "Système"],
  [/\bCategories\b/g, "Catégories"],
  [/\bCategorie\b/g, "Catégorie"],

  // Verbes
  [/\bCreer\b/g, "Créer"],
  [/\bGenerer\b/g, "Générer"],
  [/\bGerer\b/g, "Gérer"],
  [/\bReinitialiser\b/g, "Réinitialiser"],
  [/\bCloturer\b/g, "Clôturer"],
  [/\bDesactiver\b/g, "Désactiver"],
  [/\bSelectionnez\b/g, "Sélectionnez"],
  [/\bGerez\b/g, "Gérez"],

  // Noms (majuscule initiale = label visible)
  [/\bPrenom\b/g, "Prénom"],
  [/\bTelephone\b/g, "Téléphone"],
  [/\bTelechargement\b/g, "Téléchargement"],
  [/\bNumero\b/g, "Numéro"],
  [/\bDerniere\b/g, "Dernière"],
  [/\bDernieres\b/g, "Dernières"],
  [/\bApercu\b/g, "Aperçu"],
  [/\bPrepaye\b/g, "Prépayé"],
  [/\bConcu\b/g, "Conçu"],
  [/\bAcces\b/g, "Accès"],
  [/\bDeverrouillage\b/g, "Déverrouillage"],
  [/\bOperations\b/g, "Opérations"],

  // Dans les messages d'erreur et descriptions (minuscules dans des phrases)
  [/\bdoit etre\b/g, "doit être"],
  [/\bpeut pas etre\b/g, "peut pas être"],
  [/\bpeuvent pas etre\b/g, "peuvent pas être"],
  [/\bdoivent etre\b/g, "doivent être"],
  [/\breessayer\b/g, "réessayer"],
  [/\bverrouille\b(?!\()/g, "verrouillé"],
  [/\bsuperieur\b/g, "supérieur"],
  [/\binferieur\b/g, "inférieur"],
  [/\bdepasser\b/g, "dépasser"],
  [/\bmis a jour\b/g, "mis à jour"],
  [/\bcree avec succes\b/g, "créé avec succès"],
  [/\bcreee avec succes\b/g, "créée avec succès"],
  [/\bsupprimee?\b(?=["'\s,;.!?)])/g, "supprimé(e)"],
  [/\btelechargement\b/g, "téléchargement"],
  [/\bdesactive\b(?=["'\s,;.!?)])/g, "désactivé"],
  [/\birreversible\b/g, "irréversible"],
  [/\bEtes-vous sur\b/g, "Êtes-vous sûr"],
];

// ============================================================================
// Filtrage intelligent
// ============================================================================

/**
 * Extrait les chaînes littérales et texte JSX d'une ligne
 */
function extractFrenchText(line) {
  const segments = [];

  // Extraire les chaînes entre guillemets doubles
  const doubleQuoted = line.matchAll(/"([^"]+)"/g);
  for (const m of doubleQuoted) segments.push({ text: m[1], start: m.index + 1 });

  // Extraire les chaînes entre guillemets simples
  const singleQuoted = line.matchAll(/'([^']+)'/g);
  for (const m of singleQuoted) segments.push({ text: m[1], start: m.index + 1 });

  // Extraire les commentaires
  const lineComment = line.match(/\/\/\s*(.+)/);
  if (lineComment) segments.push({ text: lineComment[1], start: lineComment.index + 3 });

  const blockComment = line.match(/\/\*\*?\s*(.+?)(?:\*\/)?$/);
  if (blockComment) segments.push({ text: blockComment[1], start: blockComment.index + 3 });

  const docComment = line.match(/^\s*\*\s+(.+)/);
  if (docComment) segments.push({ text: docComment[1], start: docComment.index + 3 });

  // Extraire le texte JSX (entre > et <)
  const jsxText = line.matchAll(/>([^<>{]+)</g);
  for (const m of jsxText) {
    const text = m[1].trim();
    if (text.length > 1) segments.push({ text, start: m.index + 1 });
  }

  return segments;
}

/**
 * Vérifie si un segment de texte est un identifiant programmatique
 */
function isProgrammatic(text) {
  // Clé de permission: "vente:creer"
  if (/^[a-z_]+:[a-z_]+$/.test(text)) return true;
  // Slug: "creer-modifier-produits"
  if (/^[a-z0-9-]+$/.test(text)) return true;
  // Chemin: "@/schemas/..."
  if (text.startsWith("@/") || text.startsWith("./") || text.startsWith("../")) return true;
  // Colonne DB: "nom, prenom, telephone" (virgules = select query)
  if (/^[a-z_]+(?:,\s*[a-z_]+)+$/.test(text.trim())) return true;
  // Nom de table/colonne seul
  if (/^[a-z_]+$/.test(text.trim())) return true;
  // Variable: camelCase
  if (/^[a-z][a-zA-Z0-9]*$/.test(text.trim())) return true;
  return false;
}

// ============================================================================
// Scan
// ============================================================================

const EXTENSIONS = new Set([".ts", ".tsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", ".git", ".turbo"]);

function getAllFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      getAllFiles(full, files);
    } else if (EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

function checkFile(filePath, rootDir) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const segments = extractFrenchText(line);

    for (const segment of segments) {
      if (isProgrammatic(segment.text)) continue;

      for (const [pattern, correction] of ACCENT_RULES) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(segment.text)) !== null) {
          issues.push({
            file: relative(rootDir, filePath),
            line: i + 1,
            found: match[0],
            expected: correction,
            context: line.trim().substring(0, 120),
          });
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// Main
// ============================================================================

const rootDir = join(import.meta.dirname, "..");
const files = getAllFiles(rootDir);
const allIssues = [];

for (const file of files) {
  const issues = checkFile(file, rootDir);
  allIssues.push(...issues);
}

// Grouper par fichier
const byFile = {};
for (const issue of allIssues) {
  if (!byFile[issue.file]) byFile[issue.file] = [];
  byFile[issue.file].push(issue);
}

const totalIssues = allIssues.length;

if (totalIssues === 0) {
  console.log("✅ Aucun accent français manquant détecté !");
  process.exit(0);
}

console.log(`\n⚠️  ${totalIssues} accent(s) français manquant(s) dans ${Object.keys(byFile).length} fichier(s) :\n`);

for (const [file, issues] of Object.entries(byFile)) {
  console.log(`📄 ${file}`);
  for (const issue of issues) {
    console.log(`   L${issue.line}: "${issue.found}" → "${issue.expected}"`);
    console.log(`      ${issue.context}`);
  }
  console.log();
}

console.log(`Total: ${totalIssues} problème(s)`);
console.log(`\nCorrigez ces accents puis relancez: pnpm check:accents`);
process.exit(1);
