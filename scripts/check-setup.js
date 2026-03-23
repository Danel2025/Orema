#!/usr/bin/env node

/**
 * Script de vérification de l'environnement - Oréma N+ POS
 *
 * Vérifie que tous les prérequis sont installés et configurés correctement
 * Usage: node scripts/check-setup.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function check(label, passed, details = "") {
  const icon = passed ? "✅" : "❌";
  const color = passed ? "green" : "red";
  log(`${icon} ${label}`, color);
  if (details) {
    log(`   ${details}`, "yellow");
  }
}

function getVersion(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, "..", filePath));
}

function main() {
  log("🚀 Vérification de l'environnement Oréma N+ POS", "blue");

  // 1. Vérification des outils système
  section("1. Outils Système");

  const nodeVersion = getVersion("node --version");
  check(
    "Node.js installé",
    nodeVersion !== null,
    nodeVersion ? `Version: ${nodeVersion} (Requis: 18+)` : "Non installé"
  );

  const pnpmVersion = getVersion("pnpm --version");
  check(
    "pnpm installé",
    pnpmVersion !== null,
    pnpmVersion ? `Version: ${pnpmVersion}` : "Installez avec: npm install -g pnpm"
  );

  const gitVersion = getVersion("git --version");
  check("Git installé", gitVersion !== null, gitVersion || "Non installé");

  // 2. Vérification des fichiers de configuration
  section("2. Fichiers de Configuration");

  check(".env existe", fileExists(".env"), "Fichier d'environnement");
  check(".env.example existe", fileExists(".env.example"), "Template d'environnement");
  check("next.config.ts existe", fileExists("next.config.ts"), "Configuration Next.js");
  check("tailwind.config.ts existe", fileExists("tailwind.config.ts"), "Configuration Tailwind");
  check(
    "prisma/schema.prisma existe",
    fileExists("prisma/schema.prisma"),
    "Schéma de base de données"
  );
  check("tsconfig.json existe", fileExists("tsconfig.json"), "Config TypeScript");

  // 3. Vérification des dépendances
  section("3. Dépendances npm");

  const nodeModulesExists = fileExists("node_modules");
  check(
    "node_modules installés",
    nodeModulesExists,
    nodeModulesExists ? "" : "Exécutez: pnpm install"
  );

  if (nodeModulesExists) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
    );

    const criticalDeps = [
      "next",
      "react",
      "react-dom",
      "@radix-ui/themes",
      "@tanstack/react-query",
      "@prisma/client",
      "zustand",
      "zod",
    ];

    criticalDeps.forEach((dep) => {
      const version = packageJson.dependencies[dep];
      check(`${dep} déclaré`, version !== undefined, `Version: ${version || "N/A"}`);
    });
  }

  // 4. Vérification de la structure du projet
  section("4. Structure du Projet");

  const requiredDirs = [
    "app",
    "app/(auth)",
    "app/(dashboard)",
    "components",
    "lib",
    "prisma",
    "stores",
    "schemas",
  ];

  requiredDirs.forEach((dir) => {
    check(`${dir}/ existe`, fileExists(dir), `Dossier requis`);
  });

  // 5. Vérification des fichiers clés
  section("5. Fichiers Clés de l'Application");

  const keyFiles = [
    "app/layout.tsx",
    "app/providers.tsx",
    "app/globals.css",
    "lib/prisma.ts",
    "lib/query-client.ts",
    "lib/utils.ts",
  ];

  keyFiles.forEach((file) => {
    check(file, fileExists(file), "Fichier clé");
  });

  // 6. Vérification de .env
  section("6. Variables d'Environnement");

  if (fileExists(".env")) {
    const envContent = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf-8");

    const hasDbUrl = envContent.includes("DATABASE_URL=");
    check("DATABASE_URL définie", hasDbUrl, hasDbUrl ? "" : "Ajoutez DATABASE_URL dans .env");

    const hasPlaceholder = envContent.includes("yourPassword") || envContent.includes("password@");
    check(
      "DATABASE_URL configurée",
      hasDbUrl && !hasPlaceholder,
      hasPlaceholder
        ? "⚠️  Placeholder détecté - Configurez votre mot de passe"
        : "Mot de passe configuré"
    );

    const hasTz = envContent.includes("TZ=");
    check("TZ définie", hasTz, 'Timezone (devrait être "Africa/Libreville")');
  }

  // 7. Vérification du client Prisma
  section("7. Prisma");

  const prismaClientExists = fileExists("node_modules/.prisma/client");
  check(
    "Client Prisma généré",
    prismaClientExists,
    prismaClientExists ? "" : "Exécutez: pnpm prisma generate"
  );

  const migrationsExist = fileExists("prisma/migrations");
  check(
    "Migrations créées",
    migrationsExist,
    migrationsExist ? "" : "Exécutez: pnpm prisma migrate dev"
  );

  // 8. Résumé
  section("8. Résumé");

  log("\n✅ Si toutes les vérifications sont vertes, vous êtes prêt !", "green");
  log("❌ Si des vérifications sont rouges, consultez SETUP.md pour les instructions", "yellow");

  log("\n📚 Commandes utiles:", "cyan");
  log("  pnpm install              # Installer les dépendances", "reset");
  log("  pnpm prisma generate      # Générer le client Prisma", "reset");
  log("  pnpm prisma migrate dev   # Créer les migrations", "reset");
  log("  pnpm db:seed              # Seed la base de données", "reset");
  log("  pnpm dev                  # Démarrer le serveur de dev", "reset");

  console.log("\n");
}

main();
