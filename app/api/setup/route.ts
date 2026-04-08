/**
 * Route API pour initialiser les données de démonstration
 * Migré vers Supabase
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/db";
import { hashPassword, hashPin } from "@/lib/auth/password";

export async function GET(request: NextRequest) {
  try {
    // Disable in production unless SETUP_TOKEN is provided
    if (process.env.NODE_ENV === "production") {
      const setupToken = request.headers.get("x-setup-token");
      if (!setupToken || setupToken !== process.env.SETUP_TOKEN) {
        return NextResponse.json({ error: "Endpoint désactivé en production" }, { status: 403 });
      }
    }

    const supabase = await createClient();

    // Vérifier si des données existent déjà
    const { data: existingEtablissement } = await supabase
      .from("etablissements")
      .select("id, nom")
      .limit(1)
      .single();

    if (existingEtablissement) {
      const { data: existingAdmin } = await supabase
        .from("utilisateurs")
        .select("email, nom, prenom")
        .eq("role", "ADMIN")
        .limit(1)
        .single();

      if (existingAdmin) {
        return NextResponse.json({
          success: true,
          message: "Les données de démonstration existent deja",
        });
      }
    }

    // Créer l'établissement
    const { data: etablissement, error: etabError } = await supabase
      .from("etablissements")
      .insert({
        nom: "Restaurant Oréma Demo",
        adresse: "123 Avenue de l'Indépendance, Libreville",
        telephone: "+241 01 23 45 67",
        email: "demo@orema.ga",
        nif: "NIF123456789",
        devise_par: "FCFA",
        taux_tva_standard: 18,
        taux_tva_reduit: 10,
      })
      .select()
      .single();

    if (etabError) throw etabError;

    // Créer l'utilisateur admin
    const hashedPassword = await hashPassword("Admin123!");
    const hashedPin = await hashPin("1234");

    const { data: utilisateur, error: userError } = await supabase
      .from("utilisateurs")
      .insert({
        email: "admin@orema.ga",
        password: hashedPassword,
        nom: "Admin",
        prenom: "Super",
        role: "ADMIN",
        pin_code: hashedPin,
        actif: true,
        etablissement_id: etablissement.id,
      })
      .select()
      .single();

    if (userError) throw userError;

    // Créer les catégories
    const { data: categories } = await supabase
      .from("categories")
      .insert([
        { nom: "Boissons", couleur: "#3b82f6", ordre: 1, etablissement_id: etablissement.id },
        { nom: "Entrées", couleur: "#22c55e", ordre: 2, etablissement_id: etablissement.id },
        { nom: "Plats", couleur: "#f97316", ordre: 3, etablissement_id: etablissement.id },
        { nom: "Desserts", couleur: "#ec4899", ordre: 4, etablissement_id: etablissement.id },
      ])
      .select();

    if (!categories) throw new Error("Erreur création catégories");

    // Créer les produits
    await supabase.from("produits").insert([
      {
        nom: "Coca-Cola",
        prix_vente: 1000,
        categorie_id: categories[0].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Fanta Orange",
        prix_vente: 1000,
        categorie_id: categories[0].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Eau minérale",
        prix_vente: 500,
        categorie_id: categories[0].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Bière Régab",
        prix_vente: 1500,
        categorie_id: categories[0].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Salade verte",
        prix_vente: 2500,
        categorie_id: categories[1].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Soupe du jour",
        prix_vente: 3000,
        categorie_id: categories[1].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Poulet braisé",
        prix_vente: 8000,
        categorie_id: categories[2].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Poisson grillé",
        prix_vente: 10000,
        categorie_id: categories[2].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Riz sauce arachide",
        prix_vente: 5000,
        categorie_id: categories[2].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Brochettes de boeuf",
        prix_vente: 7500,
        categorie_id: categories[2].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Fruits frais",
        prix_vente: 2000,
        categorie_id: categories[3].id,
        etablissement_id: etablissement.id,
      },
      {
        nom: "Gâteau au chocolat",
        prix_vente: 3500,
        categorie_id: categories[3].id,
        etablissement_id: etablissement.id,
      },
    ]);

    // Créer les tables
    await supabase.from("tables").insert([
      {
        numero: "T1",
        capacite: 4,
        forme: "CARREE",
        position_x: 100,
        position_y: 100,
        etablissement_id: etablissement.id,
      },
      {
        numero: "T2",
        capacite: 4,
        forme: "CARREE",
        position_x: 250,
        position_y: 100,
        etablissement_id: etablissement.id,
      },
      {
        numero: "T3",
        capacite: 6,
        forme: "RECTANGULAIRE",
        position_x: 400,
        position_y: 100,
        largeur: 120,
        hauteur: 80,
        etablissement_id: etablissement.id,
      },
      {
        numero: "T4",
        capacite: 2,
        forme: "RONDE",
        position_x: 100,
        position_y: 250,
        etablissement_id: etablissement.id,
      },
      {
        numero: "T5",
        capacite: 8,
        forme: "RECTANGULAIRE",
        position_x: 250,
        position_y: 250,
        largeur: 150,
        hauteur: 80,
        etablissement_id: etablissement.id,
      },
    ]);

    // Log credentials only in development
    if (process.env.NODE_ENV !== "production") {
      console.log("Setup credentials:", { email: "admin@orema.ga", pin: "****" });
    }

    return NextResponse.json({
      success: true,
      message: "Setup termine. Consultez les logs serveur pour les credentials initiales.",
    });
  } catch (error) {
    console.error("[Setup] Erreur:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ success: false, error: "Erreur lors du setup" }, { status: 500 });
  }
}
