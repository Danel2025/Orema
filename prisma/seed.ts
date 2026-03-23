import { StatutTable, FormeTable, TypeImprimante } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { categories, allProduits } from "./seed-data";

async function main() {
  console.log("=".repeat(60));
  console.log("ORÉMA N+ - Seed des données de démonstration");
  console.log("Produits, catégories, tables (sans toucher aux utilisateurs)");
  console.log("=".repeat(60));
  console.log("");

  // Récupérer l'établissement existant
  const etablissement = await prisma.etablissement.findFirst();

  if (!etablissement) {
    console.error(
      "❌ Aucun établissement trouvé. Créez d'abord un établissement et un utilisateur."
    );
    process.exit(1);
  }

  console.log(`✓ Établissement trouvé: ${etablissement.nom}`);
  console.log("");

  // Récupérer un utilisateur admin pour l'audit
  const adminUser = await prisma.utilisateur.findFirst({
    where: {
      etablissementId: etablissement.id,
      role: { in: ["SUPER_ADMIN", "ADMIN"] },
    },
  });

  if (!adminUser) {
    console.error("❌ Aucun utilisateur admin trouvé.");
    process.exit(1);
  }

  console.log(`✓ Utilisateur admin trouvé: ${adminUser.prenom} ${adminUser.nom}`);
  console.log("");

  // Nettoyer les données existantes (SANS toucher aux utilisateurs et établissement)
  console.log("Nettoyage des données de démonstration...");

  // Supprimer les mouvements de stock liés aux produits de l'établissement
  await prisma.mouvementStock.deleteMany({
    where: { produit: { etablissementId: etablissement.id } },
  });

  // Supprimer les ventes et données liées
  await prisma.ligneVenteSupplement.deleteMany({
    where: { ligneVente: { vente: { etablissementId: etablissement.id } } },
  });
  await prisma.paiement.deleteMany({
    where: { vente: { etablissementId: etablissement.id } },
  });
  await prisma.ligneVente.deleteMany({
    where: { vente: { etablissementId: etablissement.id } },
  });
  await prisma.vente.deleteMany({ where: { etablissementId: etablissement.id } });

  // Supprimer les sessions caisse
  await prisma.sessionCaisse.deleteMany({ where: { etablissementId: etablissement.id } });

  // Supprimer les suppléments produits
  await prisma.supplementProduit.deleteMany({
    where: { produit: { etablissementId: etablissement.id } },
  });

  // Supprimer produits, catégories, etc.
  await prisma.produit.deleteMany({ where: { etablissementId: etablissement.id } });
  await prisma.categorie.deleteMany({ where: { etablissementId: etablissement.id } });
  await prisma.table.deleteMany({ where: { etablissementId: etablissement.id } });
  await prisma.zone.deleteMany({ where: { etablissementId: etablissement.id } });
  await prisma.client.deleteMany({ where: { etablissementId: etablissement.id } });
  await prisma.imprimante.deleteMany({ where: { etablissementId: etablissement.id } });
  await prisma.auditLog.deleteMany({ where: { etablissementId: etablissement.id } });

  console.log("✓ Données de démonstration nettoyées");
  console.log("");

  // 1. Créer les imprimantes
  console.log("Création des imprimantes...");
  const imprimantes: Record<string, string> = {};

  const imprimanteTicket = await prisma.imprimante.create({
    data: {
      nom: "Imprimante Caisse",
      type: TypeImprimante.TICKET,
      typeConnexion: "USB",
      pathUsb: "/dev/usb/lp0",
      largeurPapier: 80,
      actif: true,
      etablissementId: etablissement.id,
    },
  });
  imprimantes["TICKET"] = imprimanteTicket.id;

  const imprimanteCuisine = await prisma.imprimante.create({
    data: {
      nom: "Imprimante Cuisine",
      type: TypeImprimante.CUISINE,
      typeConnexion: "RESEAU",
      adresseIp: "192.168.1.100",
      port: 9100,
      largeurPapier: 80,
      actif: true,
      etablissementId: etablissement.id,
    },
  });
  imprimantes["CUISINE"] = imprimanteCuisine.id;

  const imprimanteBar = await prisma.imprimante.create({
    data: {
      nom: "Imprimante Bar",
      type: TypeImprimante.BAR,
      typeConnexion: "RESEAU",
      adresseIp: "192.168.1.101",
      port: 9100,
      largeurPapier: 58,
      actif: true,
      etablissementId: etablissement.id,
    },
  });
  imprimantes["BAR"] = imprimanteBar.id;
  console.log("✓ 3 imprimantes créées (Caisse, Cuisine, Bar)");
  console.log("");

  // 4. Créer les catégories
  console.log("Création des catégories...");
  const categoriesMap: Record<string, string> = {};

  for (const cat of categories) {
    const categorie = await prisma.categorie.create({
      data: {
        nom: cat.nom,
        couleur: cat.couleur,
        icone: cat.icone,
        ordre: cat.ordre,
        actif: true,
        imprimanteId: imprimantes[cat.imprimante],
        etablissementId: etablissement.id,
      },
    });
    categoriesMap[cat.nom] = categorie.id;
  }
  console.log(`✓ ${categories.length} catégories créées`);
  console.log("");

  // 5. Créer les produits
  console.log("Création des produits...");
  let produitCount = 0;
  const produitsByCategorie: Record<string, number> = {};

  // Suivre les codes-barres utilisés pour éviter les doublons
  const usedBarcodes = new Set<string>();

  for (const prod of allProduits) {
    const categorieId = categoriesMap[prod.categorie];
    if (!categorieId) {
      console.warn(`⚠ Catégorie non trouvée pour: ${prod.nom} (${prod.categorie})`);
      continue;
    }

    // Gérer les codes-barres : ne pas inclure si non défini ou déjà utilisé
    let codeBarre: string | undefined = undefined;
    if (prod.codeBarre && !usedBarcodes.has(prod.codeBarre)) {
      codeBarre = prod.codeBarre;
      usedBarcodes.add(prod.codeBarre);
    }

    await prisma.produit.create({
      data: {
        nom: prod.nom,
        description: prod.description,
        prixVente: prod.prixVente,
        prixAchat: prod.prixAchat,
        tauxTva: prod.tauxTva,
        gererStock: prod.gererStock,
        stockActuel: prod.stockActuel,
        stockMin: prod.stockMin,
        codeBarre,
        actif: true,
        categorieId,
        etablissementId: etablissement.id,
      },
    });

    produitCount++;
    produitsByCategorie[prod.categorie] = (produitsByCategorie[prod.categorie] || 0) + 1;
  }

  console.log(`✓ ${produitCount} produits créés`);
  console.log("");
  console.log("Répartition par catégorie:");
  for (const [cat, count] of Object.entries(produitsByCategorie).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${cat}: ${count} produits`);
  }
  console.log("");

  // 6. Créer les zones
  console.log("Création des zones...");
  const zonesData = [
    { nom: "Salle", description: "Salle principale du restaurant", couleur: "#3b82f6", ordre: 1 },
    { nom: "Terrasse", description: "Terrasse extérieure", couleur: "#22c55e", ordre: 2 },
    { nom: "VIP", description: "Espace VIP privé", couleur: "#f59e0b", ordre: 3 },
  ];

  const zones: Record<string, string> = {};
  for (const zoneData of zonesData) {
    const zone = await prisma.zone.create({
      data: {
        ...zoneData,
        etablissementId: etablissement.id,
      },
    });
    zones[zoneData.nom] = zone.id;
  }
  console.log(`✓ ${zonesData.length} zones créées`);
  console.log("");

  // 7. Créer les tables
  console.log("Création des tables...");
  const tables = [
    // Salle
    {
      numero: "S1",
      capacite: 2,
      zoneId: zones["Salle"],
      forme: FormeTable.RONDE,
      positionX: 50,
      positionY: 50,
    },
    {
      numero: "S2",
      capacite: 4,
      zoneId: zones["Salle"],
      forme: FormeTable.CARREE,
      positionX: 150,
      positionY: 50,
    },
    {
      numero: "S3",
      capacite: 4,
      zoneId: zones["Salle"],
      forme: FormeTable.CARREE,
      positionX: 250,
      positionY: 50,
    },
    {
      numero: "S4",
      capacite: 6,
      zoneId: zones["Salle"],
      forme: FormeTable.RECTANGULAIRE,
      positionX: 50,
      positionY: 150,
    },
    {
      numero: "S5",
      capacite: 6,
      zoneId: zones["Salle"],
      forme: FormeTable.RECTANGULAIRE,
      positionX: 200,
      positionY: 150,
    },
    {
      numero: "S6",
      capacite: 8,
      zoneId: zones["Salle"],
      forme: FormeTable.RECTANGULAIRE,
      positionX: 400,
      positionY: 150,
    },
    // Terrasse
    {
      numero: "T1",
      capacite: 2,
      zoneId: zones["Terrasse"],
      forme: FormeTable.RONDE,
      positionX: 50,
      positionY: 300,
    },
    {
      numero: "T2",
      capacite: 4,
      zoneId: zones["Terrasse"],
      forme: FormeTable.CARREE,
      positionX: 150,
      positionY: 300,
    },
    {
      numero: "T3",
      capacite: 4,
      zoneId: zones["Terrasse"],
      forme: FormeTable.CARREE,
      positionX: 250,
      positionY: 300,
    },
    {
      numero: "T4",
      capacite: 6,
      zoneId: zones["Terrasse"],
      forme: FormeTable.RECTANGULAIRE,
      positionX: 50,
      positionY: 400,
    },
    // VIP
    {
      numero: "VIP1",
      capacite: 6,
      zoneId: zones["VIP"],
      forme: FormeTable.RECTANGULAIRE,
      positionX: 50,
      positionY: 500,
    },
    {
      numero: "VIP2",
      capacite: 10,
      zoneId: zones["VIP"],
      forme: FormeTable.RECTANGULAIRE,
      positionX: 250,
      positionY: 500,
    },
  ];

  for (const table of tables) {
    await prisma.table.create({
      data: {
        ...table,
        statut: StatutTable.LIBRE,
        active: true,
        etablissementId: etablissement.id,
      },
    });
  }
  console.log(`✓ ${tables.length} tables créées`);
  console.log("");

  // 8. Créer des clients
  console.log("Création des clients...");
  const clients = [
    {
      nom: "Dupont",
      prenom: "Jean",
      telephone: "+241 06 12 34 56",
      email: "jean.dupont@example.com",
      adresse: "45 Rue des Flamboyants, Libreville",
      pointsFidelite: 150,
      soldePrepaye: 5000,
      creditAutorise: false,
    },
    {
      nom: "Mba",
      prenom: "Sylvie",
      telephone: "+241 07 89 01 23",
      email: "sylvie.mba@example.com",
      adresse: "12 Avenue du Bord de Mer, Port-Gentil",
      pointsFidelite: 320,
      soldePrepaye: 0,
      creditAutorise: true,
      limitCredit: 50000,
      soldeCredit: 15000,
    },
    {
      nom: "Nguema",
      prenom: "Patrick",
      telephone: "+241 05 45 67 89",
      pointsFidelite: 75,
      soldePrepaye: 10000,
      creditAutorise: false,
    },
    {
      nom: "Entreprise ABC",
      telephone: "+241 01 99 88 77",
      email: "contact@abc-gabon.com",
      adresse: "Zone Industrielle, Libreville",
      pointsFidelite: 0,
      creditAutorise: true,
      limitCredit: 200000,
      soldeCredit: 0,
    },
  ];

  for (const client of clients) {
    await prisma.client.create({
      data: {
        ...client,
        actif: true,
        etablissementId: etablissement.id,
      },
    });
  }
  console.log(`✓ ${clients.length} clients créés`);
  console.log("");

  // 8. Créer un log d'audit initial
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entite: "Seed",
      entiteId: etablissement.id,
      description: "Seed des données de démonstration (produits gabonais)",
      utilisateurId: adminUser.id,
      etablissementId: etablissement.id,
    },
  });

  // Résumé final
  console.log("");
  console.log("=".repeat(60));
  console.log("SEED TERMINÉ AVEC SUCCÈS");
  console.log("=".repeat(60));
  console.log("");
  console.log("STATISTIQUES:");
  console.log(`  • Imprimantes:    3`);
  console.log(`  • Catégories:     ${categories.length}`);
  console.log(`  • Produits:       ${produitCount}`);
  console.log(`  • Zones:          ${zonesData.length}`);
  console.log(`  • Tables:         ${tables.length}`);
  console.log(`  • Clients:        ${clients.length}`);
  console.log("");
  console.log("Les utilisateurs existants ont été conservés.");
  console.log("");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("Erreur lors de la migration:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
