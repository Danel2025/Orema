/**
 * Script de test de connexion
 * Simule une connexion complète
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TEST_EMAIL = "superadmin@orema.ga";
const TEST_PASSWORD = "1Cag+z4Kah2gAa1!";

async function testLogin() {
  console.log("=".repeat(60));
  console.log("TEST DE CONNEXION");
  console.log("=".repeat(60));
  console.log("");

  // 1. Connexion à Supabase Auth
  console.log("1. Connexion à Supabase Auth...");
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    console.log(`   ✗ ERREUR: ${authError.message}`);
    return;
  }

  console.log(`   ✓ Connexion réussie!`);
  console.log(`   User ID: ${authData.user?.id}`);
  console.log(`   Email: ${authData.user?.email}`);
  console.log("");

  // 2. Récupérer l'utilisateur de la table utilisateurs
  console.log('2. Récupération de l\'utilisateur dans la table "utilisateurs"...');

  const dbUser = await prisma.utilisateur.findUnique({
    where: { email: TEST_EMAIL },
    include: { etablissement: true },
  });

  if (!dbUser) {
    console.log(`   ✗ Utilisateur non trouvé dans la table!`);
    return;
  }

  console.log(`   ✓ Utilisateur trouvé!`);
  console.log(`   ID DB: ${dbUser.id}`);
  console.log(`   Nom: ${dbUser.prenom} ${dbUser.nom}`);
  console.log(`   Role: ${dbUser.role}`);
  console.log(`   Actif: ${dbUser.actif}`);
  console.log(`   Établissement: ${dbUser.etablissement.nom}`);
  console.log("");

  // 3. Test de la requête Supabase client (comme dans getCurrentUser)
  console.log("3. Test de la requête Supabase client (comme getCurrentUser)...");

  const { data: utilisateur, error: dbError } = await supabase
    .from("utilisateurs")
    .select("id, email, nom, prenom, role, actif, etablissement_id, etablissements(id, nom)")
    .eq("email", TEST_EMAIL)
    .single();

  if (dbError) {
    console.log(`   ✗ ERREUR requête: ${dbError.message}`);
    console.log(`   Code: ${dbError.code}`);
    console.log(`   Details: ${dbError.details}`);
    console.log(`   Hint: ${dbError.hint}`);
    return;
  }

  console.log(`   ✓ Requête réussie!`);
  console.log(`   Données:`, JSON.stringify(utilisateur, null, 2));
  console.log("");

  console.log("=".repeat(60));
  console.log("TOUS LES TESTS PASSÉS - La connexion devrait fonctionner!");
  console.log("=".repeat(60));
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
