/**
 * Script de test de connexion Supabase
 * Usage: npx tsx scripts/test-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Vérification de la connexion Supabase...\n");

// Vérifier les variables d'environnement
console.log("1️⃣ Variables d'environnement:");
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Défini" : "❌ Manquant"}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✅ Défini" : "❌ Manquant"}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "✅ Défini" : "❌ Manquant"}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("\n❌ Variables d'environnement manquantes. Vérifiez votre fichier .env");
  process.exit(1);
}

async function testConnection() {
  try {
    // Test avec la clé anonyme
    console.log("\n2️⃣ Test de connexion (clé anonyme):");
    const supabaseAnon = createClient(supabaseUrl!, supabaseAnonKey!);

    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from("etablissements")
      .select("count")
      .limit(1);

    if (healthError) {
      console.log(`   ⚠️ Erreur (peut être normal si RLS actif): ${healthError.message}`);
    } else {
      console.log("   ✅ Connexion réussie");
    }

    // Test avec la clé service (bypass RLS)
    if (supabaseServiceKey) {
      console.log("\n3️⃣ Test de connexion (clé service):");
      const supabaseService = createClient(supabaseUrl!, supabaseServiceKey!);

      // Compter les établissements
      const { count: etablissementsCount, error: etablissementsError } = await supabaseService
        .from("etablissements")
        .select("*", { count: "exact", head: true });

      if (etablissementsError) {
        console.log(`   ❌ Erreur: ${etablissementsError.message}`);
      } else {
        console.log(`   ✅ Table 'etablissements': ${etablissementsCount ?? 0} enregistrement(s)`);
      }

      // Compter les utilisateurs
      const { count: utilisateursCount, error: utilisateursError } = await supabaseService
        .from("utilisateurs")
        .select("*", { count: "exact", head: true });

      if (utilisateursError) {
        console.log(`   ❌ Erreur: ${utilisateursError.message}`);
      } else {
        console.log(`   ✅ Table 'utilisateurs': ${utilisateursCount ?? 0} enregistrement(s)`);
      }

      // Compter les catégories
      const { count: categoriesCount, error: categoriesError } = await supabaseService
        .from("categories")
        .select("*", { count: "exact", head: true });

      if (categoriesError) {
        console.log(`   ❌ Erreur: ${categoriesError.message}`);
      } else {
        console.log(`   ✅ Table 'categories': ${categoriesCount ?? 0} enregistrement(s)`);
      }

      // Compter les produits
      const { count: produitsCount, error: produitsError } = await supabaseService
        .from("produits")
        .select("*", { count: "exact", head: true });

      if (produitsError) {
        console.log(`   ❌ Erreur: ${produitsError.message}`);
      } else {
        console.log(`   ✅ Table 'produits': ${produitsCount ?? 0} enregistrement(s)`);
      }

      // Lister les tables disponibles
      console.log("\n4️⃣ Tables disponibles:");
      const { data: tables, error: tablesError } = await supabaseService
        .rpc("get_tables_info")
        .select("*");

      if (tablesError) {
        // Fallback: essayer une requête directe
        const { data: schemaInfo, error: schemaError } = await supabaseService
          .from("etablissements")
          .select("id")
          .limit(0);

        if (!schemaError) {
          console.log("   ✅ Schéma accessible (requête test réussie)");
        } else {
          console.log(`   ⚠️ Impossible de lister les tables: ${tablesError.message}`);
        }
      } else {
        tables?.forEach((table: { table_name: string }) => {
          console.log(`   - ${table.table_name}`);
        });
      }
    }

    console.log("\n✅ Vérification terminée avec succès!");
  } catch (error) {
    console.error("\n❌ Erreur de connexion:", error);
    process.exit(1);
  }
}

testConnection();
