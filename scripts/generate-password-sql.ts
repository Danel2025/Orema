/**
 * Génère le SQL pour mettre à jour les mots de passe
 */

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { writeFileSync } from "fs";
import { join } from "path";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🔑 Génération des hash de mots de passe...\n");

  // Définir les utilisateurs et leurs mots de passe
  const users = [
    { email: "admin@orema.ga", password: "Admin2026!", pin: "1234" },
    { email: "manager@orema.ga", password: "Manager2026!", pin: "5678" },
    { email: "caisse@orema.ga", password: null, pin: "0000" },
    { email: "serveur@orema.ga", password: null, pin: "1111" },
  ];

  let sql = "-- Mise à jour des mots de passe et PINs\n";
  sql += "-- Généré automatiquement le " + new Date().toLocaleString("fr-FR") + "\n\n";

  for (const user of users) {
    console.log(`📝 ${user.email}...`);

    const passwordHash = user.password ? await hashPassword(user.password) : null;
    const pinHash = user.pin ? await hashPassword(user.pin) : null;

    if (passwordHash) {
      console.log(`  ✅ Password: ${user.password}`);
    }
    if (pinHash) {
      console.log(`  ✅ PIN: ${user.pin}`);
    }

    sql += `-- ${user.email}\n`;
    sql += `UPDATE utilisateurs SET\n`;
    sql += `  password = ${passwordHash ? `'${passwordHash}'` : "NULL"},\n`;
    sql += `  "pinCode" = ${pinHash ? `'${pinHash}'` : "NULL"},\n`;
    sql += `  "updatedAt" = NOW()\n`;
    sql += `WHERE email = '${user.email}';\n\n`;
  }

  // Sauvegarder le fichier SQL
  const sqlPath = join(process.cwd(), "scripts", "update-passwords.sql");
  writeFileSync(sqlPath, sql, "utf-8");

  console.log(`\n✅ Fichier SQL généré: ${sqlPath}`);
  console.log("\n📋 Pour appliquer les changements, exécutez:");
  console.log("   psql -U postgres -d orema_nplus -p 5433 -f scripts/update-passwords.sql");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
