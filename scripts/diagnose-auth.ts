/**
 * Script de diagnostic de l'authentification
 * Vérifie la cohérence entre Supabase Auth et la table utilisateurs
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function diagnose() {
  console.log("=".repeat(60));
  console.log("DIAGNOSTIC AUTHENTIFICATION");
  console.log("=".repeat(60));
  console.log("");

  // 1. Vérifier les variables d'env
  console.log("1. Variables d'environnement:");
  console.log(`   SUPABASE_URL: ${SUPABASE_URL ? "✓ Configuré" : "✗ MANQUANT"}`);
  console.log(`   SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? "✓ Configuré" : "✗ MANQUANT"}`);
  console.log("");

  // 2. Récupérer les utilisateurs de la table utilisateurs
  console.log('2. Utilisateurs dans la table "utilisateurs":');
  const dbUsers = await prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      actif: true,
      password: true,
    },
    orderBy: { email: "asc" },
  });

  for (const user of dbUsers) {
    console.log(`   - ${user.email}`);
    console.log(`     ID: ${user.id}`);
    console.log(`     Nom: ${user.prenom} ${user.nom}`);
    console.log(`     Role: ${user.role}`);
    console.log(`     Actif: ${user.actif}`);
    console.log(
      `     Password hash: ${user.password ? user.password.substring(0, 20) + "..." : "NULL"}`
    );
    console.log("");
  }

  // 3. Récupérer les utilisateurs de Supabase Auth
  console.log("3. Utilisateurs dans Supabase Auth:");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log(`   ERREUR: ${authError.message}`);
  } else {
    for (const user of authData.users) {
      console.log(`   - ${user.email}`);
      console.log(`     ID Supabase: ${user.id}`);
      console.log(`     Email confirmé: ${user.email_confirmed_at ? "Oui" : "Non"}`);
      console.log(`     Créé le: ${user.created_at}`);
      console.log("");
    }
  }

  // 4. Vérifier la correspondance
  console.log("4. Vérification de la correspondance:");
  const authEmails = authData?.users.map((u) => u.email?.toLowerCase()) || [];
  const dbEmails = dbUsers.map((u) => u.email.toLowerCase());

  for (const dbUser of dbUsers) {
    const emailLower = dbUser.email.toLowerCase();
    const inAuth = authEmails.includes(emailLower);
    const status = inAuth ? "✓" : "✗";
    console.log(
      `   ${status} ${dbUser.email} - ${inAuth ? "Existe dans Supabase Auth" : "MANQUANT dans Supabase Auth"}`
    );
  }

  for (const authUser of authData?.users || []) {
    const emailLower = authUser.email?.toLowerCase();
    if (emailLower && !dbEmails.includes(emailLower)) {
      console.log(
        `   ✗ ${authUser.email} - Existe dans Auth mais MANQUANT dans table utilisateurs`
      );
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("FIN DU DIAGNOSTIC");
  console.log("=".repeat(60));
}

diagnose()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
