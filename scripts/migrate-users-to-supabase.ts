/**
 * Script de migration des utilisateurs vers Supabase Auth
 *
 * Ce script cree des comptes Supabase Auth pour tous les utilisateurs
 * existants dans la table `utilisateurs`.
 *
 * PREREQUIS:
 * 1. Configurer NEXT_PUBLIC_SUPABASE_URL dans .env
 * 2. Configurer SUPABASE_SERVICE_ROLE_KEY dans .env (requis pour admin.createUser)
 *
 * EXECUTION:
 *   npx tsx scripts/migrate-users-to-supabase.ts
 *
 * OPTIONS:
 *   --dry-run    Affiche les utilisateurs sans les creer
 *   --force      Recreer meme si l'utilisateur existe deja
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as crypto from "crypto";

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Options de ligne de commande
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

// Couleurs pour le terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Genere un mot de passe temporaire securise
 */
function generateTempPassword(): string {
  // 16 caracteres aleatoires + suffixe pour garantir les regles de complexite
  const randomPart = crypto.randomBytes(12).toString("base64").slice(0, 12);
  return `${randomPart}Aa1!`;
}

interface MigrationResult {
  email: string;
  status: "created" | "exists" | "error" | "skipped";
  tempPassword?: string;
  error?: string;
}

async function migrateUsers(): Promise<void> {
  log("\n========================================", colors.blue);
  log("  Migration des utilisateurs vers Supabase Auth", colors.blue);
  log("========================================\n", colors.blue);

  // Verifier la configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    log("ERREUR: Variables d'environnement manquantes:", colors.red);
    log("  - NEXT_PUBLIC_SUPABASE_URL", !SUPABASE_URL ? colors.red : colors.green);
    log("  - SUPABASE_SERVICE_ROLE_KEY", !SUPABASE_SERVICE_ROLE_KEY ? colors.red : colors.green);
    log("\nConfigurez ces variables dans .env.local ou .env", colors.yellow);
    process.exit(1);
  }

  // Creer le client Supabase admin
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Recuperer tous les utilisateurs
  log("Recuperation des utilisateurs...", colors.dim);
  const utilisateurs = await prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      actif: true,
      etablissement: {
        select: {
          nom: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  log(`${utilisateurs.length} utilisateur(s) trouve(s)\n`, colors.green);

  if (DRY_RUN) {
    log("MODE DRY-RUN: Aucune modification ne sera effectuee\n", colors.yellow);
  }

  const results: MigrationResult[] = [];

  for (const user of utilisateurs) {
    const displayName = `${user.prenom} ${user.nom}`;
    log(`\nTraitement: ${displayName} (${user.email})`, colors.blue);
    log(`  Role: ${user.role}`, colors.dim);
    log(`  Établissement: ${user.etablissement.nom}`, colors.dim);
    log(`  Actif: ${user.actif ? "Oui" : "Non"}`, colors.dim);

    if (DRY_RUN) {
      results.push({ email: user.email, status: "skipped" });
      log("  -> SKIP (dry-run)", colors.yellow);
      continue;
    }

    // Verifier si l'utilisateur existe deja dans Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u) => u.email === user.email);

    if (existingUser && !FORCE) {
      results.push({ email: user.email, status: "exists" });
      log("  -> EXISTE DEJA dans Supabase Auth", colors.yellow);
      continue;
    }

    // Supprimer l'utilisateur existant si --force
    if (existingUser && FORCE) {
      log("  -> Suppression de l'utilisateur existant (--force)...", colors.dim);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        log(`  -> ERREUR suppression: ${deleteError.message}`, colors.red);
        results.push({ email: user.email, status: "error", error: deleteError.message });
        continue;
      }
    }

    // Generer un mot de passe temporaire
    const tempPassword = generateTempPassword();

    // Creer l'utilisateur dans Supabase Auth
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        etablissement: user.etablissement.nom,
      },
    });

    if (error) {
      log(`  -> ERREUR: ${error.message}`, colors.red);
      results.push({ email: user.email, status: "error", error: error.message });
      continue;
    }

    log("  -> CRÉÉ avec succès", colors.green);
    log(`  -> ID Supabase: ${newUser.user.id}`, colors.dim);
    log(`  -> Mot de passe temporaire: ${tempPassword}`, colors.yellow);

    results.push({
      email: user.email,
      status: "created",
      tempPassword,
    });
  }

  // Resume
  log("\n========================================", colors.blue);
  log("  Resume de la migration", colors.blue);
  log("========================================\n", colors.blue);

  const created = results.filter((r) => r.status === "created");
  const exists = results.filter((r) => r.status === "exists");
  const errors = results.filter((r) => r.status === "error");
  const skipped = results.filter((r) => r.status === "skipped");

  log(`Crees:     ${created.length}`, colors.green);
  log(`Existants: ${exists.length}`, colors.yellow);
  log(`Erreurs:   ${errors.length}`, colors.red);
  if (DRY_RUN) {
    log(`Ignores:   ${skipped.length} (dry-run)`, colors.dim);
  }

  // Afficher les mots de passe temporaires
  if (created.length > 0) {
    log("\n--- Mots de passe temporaires ---", colors.yellow);
    log("IMPORTANT: Communiquez ces mots de passe aux utilisateurs", colors.yellow);
    log("Ils devront les changer a la premiere connexion.\n", colors.yellow);

    for (const result of created) {
      log(`${result.email}: ${result.tempPassword}`, colors.reset);
    }
  }

  // Afficher les erreurs
  if (errors.length > 0) {
    log("\n--- Erreurs ---", colors.red);
    for (const result of errors) {
      log(`${result.email}: ${result.error}`, colors.red);
    }
  }

  log("\n");
}

// Execution principale
migrateUsers()
  .catch((error) => {
    log(`\nErreur fatale: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
