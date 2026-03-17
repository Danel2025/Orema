"use server";

/**
 * Server Actions optimisées pour la caisse
 * Regroupement des requêtes pour réduire les appels réseau
 * Migré de Prisma vers Supabase
 */

import { unstable_cache } from "next/cache";
import { createServiceClient, createAuthenticatedClient } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEtablissementId, getEtablissement } from "@/lib/etablissement";

/**
 * Données initiales de la caisse (cachées 30 secondes)
 * Regroupe catégories et produits en une seule requête
 */
export async function getCaisseData() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    return { categories: [], produits: [] };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  // Utiliser Promise.all pour paralléliser les requêtes
  const [categoriesResult, produitsResult] = await Promise.all([
    // Catégories - légères, juste ce qui est nécessaire pour l'affichage
    supabase
      .from("categories")
      .select("id, nom, couleur, icone, ordre")
      .eq("actif", true)
      .order("ordre", { ascending: true }),

    // Produits - seulement les champs nécessaires pour la caisse
    supabase
      .from("produits")
      .select(`
        id, nom, prix_vente, taux_tva, image, gerer_stock, stock_actuel,
        categorie_id, actif, disponible_direct, disponible_table,
        disponible_livraison, disponible_emporter, code_barre
      `)
      .eq("actif", true)
      .order("nom", { ascending: true }),
  ]);

  const categories = categoriesResult.data ?? [];
  const produits = produitsResult.data ?? [];

  // Récupérer les suppléments pour tous les produits
  const produitIds = produits.map((p) => p.id);
  let supplements: Array<{ id: string; nom: string; prix: number; produit_id: string }> = [];

  if (produitIds.length > 0) {
    const { data: supplementsData } = await supabase
      .from("supplements_produits")
      .select("id, nom, prix, produit_id")
      .in("produit_id", produitIds);

    supplements = (supplementsData ?? []).map((s) => ({
      ...s,
      prix: Number(s.prix),
    }));
  }

  // Grouper les suppléments par produit
  const supplementsByProduit = new Map<string, typeof supplements>();
  for (const sup of supplements) {
    const existing = supplementsByProduit.get(sup.produit_id) ?? [];
    existing.push(sup);
    supplementsByProduit.set(sup.produit_id, existing);
  }

  // Sérialiser les données
  return {
    categories,
    produits: produits.map((p) => ({
      id: p.id,
      nom: p.nom,
      prixVente: Number(p.prix_vente),
      tauxTva: p.taux_tva,
      image: p.image,
      gererStock: p.gerer_stock,
      stockActuel: p.stock_actuel,
      categorieId: p.categorie_id,
      actif: p.actif,
      disponibleDirect: p.disponible_direct,
      disponibleTable: p.disponible_table,
      disponibleLivraison: p.disponible_livraison,
      disponibleEmporter: p.disponible_emporter,
      codeBarre: p.code_barre,
      supplements: supplementsByProduit.get(p.id) ?? [],
    })),
  };
}

/**
 * Version cachée des données de caisse
 * Cache de 30 secondes pour éviter les requêtes répétées
 */
export const getCaisseDataCached = unstable_cache(
  async (etablissementId: string) => {
    // Utiliser le service client (sans cookies) car unstable_cache ne supporte pas cookies()
    const supabase = createServiceClient();

    const [categoriesResult, produitsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, nom, couleur, icone, ordre")
        .eq("etablissement_id", etablissementId)
        .eq("actif", true)
        .order("ordre", { ascending: true }),

      supabase
        .from("produits")
        .select(`
          id, nom, prix_vente, taux_tva, image, gerer_stock, stock_actuel,
          categorie_id, actif, disponible_direct, disponible_table,
          disponible_livraison, disponible_emporter, code_barre
        `)
        .eq("etablissement_id", etablissementId)
        .eq("actif", true)
        .order("nom", { ascending: true }),
    ]);

    const categories = categoriesResult.data ?? [];
    const produits = produitsResult.data ?? [];

    // Récupérer les suppléments pour tous les produits
    const produitIds = produits.map((p) => p.id);
    let supplements: Array<{ id: string; nom: string; prix: number; produit_id: string }> = [];

    if (produitIds.length > 0) {
      const { data: supplementsData } = await supabase
        .from("supplements_produits")
        .select("id, nom, prix, produit_id")
        .in("produit_id", produitIds);

      supplements = (supplementsData ?? []).map((s) => ({
        ...s,
        prix: Number(s.prix),
      }));
    }

    // Grouper les suppléments par produit
    const supplementsByProduit = new Map<string, typeof supplements>();
    for (const sup of supplements) {
      const existing = supplementsByProduit.get(sup.produit_id) ?? [];
      existing.push(sup);
      supplementsByProduit.set(sup.produit_id, existing);
    }

    return {
      categories,
      produits: produits.map((p) => ({
        id: p.id,
        nom: p.nom,
        prixVente: Number(p.prix_vente),
        tauxTva: p.taux_tva,
        image: p.image,
        gererStock: p.gerer_stock,
        stockActuel: p.stock_actuel,
        categorieId: p.categorie_id,
        actif: p.actif,
        disponibleDirect: p.disponible_direct,
        disponibleTable: p.disponible_table,
        disponibleLivraison: p.disponible_livraison,
        disponibleEmporter: p.disponible_emporter,
        codeBarre: p.code_barre,
        supplements: supplementsByProduit.get(p.id) ?? [],
      })),
    };
  },
  ["caisse-data"],
  {
    revalidate: 30, // Cache 30 secondes
    tags: ["caisse", "produits", "categories"],
  }
);

/**
 * Données initiales avec cache
 */
export async function getCaisseInitialData() {
  const etablissementId = await getEtablissementId();
  return getCaisseDataCached(etablissementId);
}

/**
 * Stats du jour - légères
 */
export async function getCaisseStats() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) {
    return { totalVentes: 0, chiffreAffaires: 0, pendingCount: 0 };
  }

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [ventesResult, pendingResult] = await Promise.all([
    // Ventes payées du jour
    supabase
      .from("ventes")
      .select("total_final")
      .eq("statut", "PAYEE")
      .gte("created_at", todayISO),

    // Ventes en cours (toutes, pas seulement du jour)
    supabase
      .from("ventes")
      .select("id", { count: "exact", head: true })
      .eq("statut", "EN_COURS"),
  ]);

  const ventes = ventesResult.data ?? [];
  const totalVentes = ventes.length;
  const chiffreAffaires = ventes.reduce(
    (sum, v) => sum + Number(v.total_final),
    0
  );
  const pendingCount = pendingResult.count ?? 0;

  return {
    totalVentes,
    chiffreAffaires,
    pendingCount,
  };
}

/**
 * Session active - pas de cache car doit être temps réel
 */
export async function getCaisseSession() {
  const user = await getCurrentUser();
  if (!user || !user.etablissementId) return null;

  const supabase = await createAuthenticatedClient({
    userId: user.userId,
    etablissementId: user.etablissementId,
    role: user.role,
  });

  const { data: session } = await supabase
    .from("sessions_caisse")
    .select("id, date_ouverture, fond_caisse, utilisateur_id")
    .eq("utilisateur_id", user.userId)
    .is("date_cloture", null)
    .order("date_ouverture", { ascending: false })
    .limit(1)
    .single();

  if (!session) return null;

  // Récupérer les infos de l'utilisateur
  const { data: utilisateur } = await supabase
    .from("utilisateurs")
    .select("nom, prenom")
    .eq("id", session.utilisateur_id)
    .single();

  return {
    id: session.id,
    dateOuverture: session.date_ouverture,
    fondCaisse: Number(session.fond_caisse),
    utilisateur: {
      nom: utilisateur?.nom ?? "",
      prenom: utilisateur?.prenom ?? "",
    },
  };
}

/**
 * Tout charger en une seule fonction pour la page caisse
 */
export async function loadCaissePage() {
  const etablissementId = await getEtablissementId();

  // Paralléliser tout
  const [caisseData, stats, session, etablissement] = await Promise.all([
    getCaisseDataCached(etablissementId),
    getCaisseStats(),
    getCaisseSession(),
    getEtablissement(),
  ]);

  return {
    ...caisseData,
    stats,
    session,
    etablissement: {
      id: etablissement.id,
      nom: etablissement.nom,
      adresse: etablissement.adresse,
      telephone: etablissement.telephone,
      email: etablissement.email,
      nif: etablissement.nif,
      rccm: etablissement.rccm,
    },
  };
}
