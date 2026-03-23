/**
 * Script de diagnostic pour vérifier les mots de passe
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";
import { verifyPassword } from "../lib/auth/password";

async function main() {
  console.log("🔍 Diagnostic des mots de passe\n");

  // Récupérer l'utilisateur admin
  const admin = await prisma.utilisateur.findUnique({
    where: { email: "admin@orema.ga" },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      password: true,
      actif: true,
    },
  });

  if (!admin) {
    console.error("❌ Utilisateur admin@orema.ga non trouvé");
    return;
  }

  console.log("✅ Utilisateur trouvé:");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Nom: ${admin.prenom} ${admin.nom}`);
  console.log(`   Actif: ${admin.actif}`);
  console.log(`   Password hash: ${admin.password?.substring(0, 50)}...`);
  console.log();

  if (!admin.password) {
    console.error("❌ Aucun mot de passe défini");
    return;
  }

  // Tester la vérification
  const testPassword = "Admin2026!";
  console.log(`🧪 Test de vérification avec: "${testPassword}"`);

  try {
    const isValid = await verifyPassword(testPassword, admin.password);

    if (isValid) {
      console.log("✅ SUCCÈS - Le mot de passe est VALIDE");
    } else {
      console.log("❌ ÉCHEC - Le mot de passe est INVALIDE");
      console.log();
      console.log("🔧 Solutions possibles:");
      console.log("   1. Le SQL n'a pas été exécuté correctement dans pgAdmin");
      console.log("   2. Le hash dans la base ne correspond pas");
      console.log("   3. Vérifiez que vous avez bien exécuté TOUT le SQL (4 UPDATE)");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
