/**
 * Script pour régénérer les hash des mots de passe et PINs
 * Utilise les mêmes fonctions que l'application
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword, hashPin } from "../lib/auth/password";

async function main() {
  console.log("🔄 Régénération des hash de mots de passe...\n");

  // Récupérer tous les utilisateurs
  const users = await prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
    },
  });

  // Définir les mots de passe en clair pour les utilisateurs de test
  const passwords: Record<string, { password?: string; pin?: string }> = {
    "admin@orema.ga": { password: "Admin2026!", pin: "1234" },
    "manager@orema.ga": { password: "Manager2026!", pin: "5678" },
    "caisse@orema.ga": { pin: "0000" },
    "serveur@orema.ga": { pin: "1111" },
  };

  for (const user of users) {
    const userPasswords = passwords[user.email];
    if (!userPasswords) {
      console.log(`⏭️  Ignorer ${user.email} (pas de mot de passe défini)`);
      continue;
    }

    const updates: { password?: string; pinCode?: string } = {};

    // Hasher le mot de passe si présent
    if (userPasswords.password) {
      updates.password = await hashPassword(userPasswords.password);
      console.log(`✅ ${user.email}: mot de passe haché`);
    }

    // Hasher le PIN si présent
    if (userPasswords.pin) {
      updates.pinCode = await hashPin(userPasswords.pin);
      console.log(`✅ ${user.email}: PIN haché`);
    }

    // Mettre à jour l'utilisateur
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: updates,
    });

    console.log(`✅ ${user.prenom} ${user.nom} (${user.email}) - Hash mis à jour\n`);
  }

  console.log("✅ Tous les hash ont été régénérés avec succès!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .then(() => {
    console.log("\n✨ Script terminé avec succès!");
    process.exit(0);
  });
