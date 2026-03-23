/**
 * API Route pour l'impression
 * Migré vers Supabase
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getEtablissement } from "@/lib/etablissement";
import { getCurrentUser } from "@/lib/auth";
import {
  generateTicketClient,
  generateTestTicket,
  generateBonCuisine,
  generateBonBar,
  generateRapportZ,
  generateAddition,
  findTicketPrinter,
  findKitchenPrinter,
  findBarPrinter,
  getPrinterById,
  sendToPrinter,
  type TicketClientData,
  type BonPreparationData,
  type RapportZData,
  type AdditionData,
} from "@/lib/print";
import {
  generateTicketHTML,
  generateBonPreparationHTML,
  generateRapportZHTML,
  generateAdditionHTML,
  generateTestPageHTML,
} from "@/lib/print/system-print";

type PrintRequestType = "ticket" | "cuisine" | "bar" | "rapport-z" | "test" | "addition";

interface PrintRequestBody {
  type: PrintRequestType;
  data?: TicketClientData | BonPreparationData | RapportZData | AdditionData | null;
  printerId?: string;
  venteId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth complète : récupérer l'utilisateur avec etablissementId et role
    const user = await getCurrentUser();
    if (!user || !user.etablissementId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = (await request.json()) as PrintRequestBody;
    const { type, data, printerId, venteId, sessionId } = body;

    if (!["ticket", "cuisine", "bar", "rapport-z", "test", "addition"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Type d'impression invalide" },
        { status: 400 }
      );
    }

    const etablissement = await getEtablissement();

    switch (type) {
      case "test":
        return handleTestPrint(etablissement.id, etablissement.nom, printerId);
      case "ticket":
        return handleTicketPrint(
          etablissement.id,
          data as TicketClientData | undefined,
          printerId,
          venteId
        );
      case "cuisine":
        return handleKitchenPrint(
          etablissement.id,
          data as BonPreparationData | undefined,
          printerId,
          venteId
        );
      case "bar":
        return handleBarPrint(
          etablissement.id,
          data as BonPreparationData | undefined,
          printerId,
          venteId
        );
      case "rapport-z":
        return handleRapportZPrint(
          etablissement.id,
          data as RapportZData | undefined,
          printerId,
          sessionId
        );
      case "addition":
        return handleAdditionPrint(etablissement.id, data as AdditionData | undefined, printerId);
      default:
        return NextResponse.json(
          { success: false, error: "Type d'impression non géré" },
          { status: 400 }
        );
    }
  } catch (error) {
    // Logger l'erreur complète côté serveur uniquement
    console.error("[API Print] Erreur:", error);
    if (error instanceof Error) {
      console.error("[API Print] Stack:", error.stack);
    }
    // Ne PAS exposer error.message au client - retourner un message générique
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'impression" },
      { status: 500 }
    );
  }
}

async function handleTestPrint(
  etablissementId: string,
  etablissementNom: string,
  printerId?: string
) {
  const printer = printerId
    ? await getPrinterById(printerId)
    : await findTicketPrinter(etablissementId);
  if (!printer)
    return NextResponse.json(
      { success: false, error: "Aucune imprimante disponible" },
      { status: 404 }
    );

  // Imprimante SYSTEME → renvoyer HTML pour impression cote client
  if (printer.typeConnexion === "SYSTEME") {
    const html = generateTestPageHTML(etablissementNom);
    return NextResponse.json({ success: true, useSystemPrint: true, htmlContent: html });
  }

  const commands = generateTestTicket(
    etablissementNom,
    printer.nom,
    printer.largeurPapier as 58 | 80
  );
  const result = await sendToPrinter(printer, commands);
  return NextResponse.json(result);
}

async function handleTicketPrint(
  etablissementId: string,
  data?: TicketClientData,
  printerId?: string,
  venteId?: string
) {
  let ticketData = data;
  if (!ticketData && venteId) ticketData = (await loadTicketDataFromVente(venteId, etablissementId)) ?? undefined;
  if (!ticketData)
    return NextResponse.json(
      { success: false, error: "Données de ticket manquantes" },
      { status: 400 }
    );

  const printer = printerId
    ? await getPrinterById(printerId)
    : await findTicketPrinter(etablissementId);
  if (!printer)
    return NextResponse.json(
      { success: false, error: "Aucune imprimante ticket disponible" },
      { status: 404 }
    );

  if (printer.typeConnexion === "SYSTEME") {
    const html = generateTicketHTML(ticketData);
    return NextResponse.json({ success: true, useSystemPrint: true, htmlContent: html });
  }

  const commands = generateTicketClient(ticketData, printer.largeurPapier as 58 | 80);
  const result = await sendToPrinter(printer, commands);
  return NextResponse.json(result);
}

async function handleKitchenPrint(
  etablissementId: string,
  data?: BonPreparationData,
  printerId?: string,
  venteId?: string
) {
  let bonData = data;
  if (!bonData && venteId) bonData = (await loadBonDataFromVente(venteId, "cuisine", etablissementId)) ?? undefined;
  if (!bonData)
    return NextResponse.json(
      { success: false, error: "Données du bon cuisine manquantes" },
      { status: 400 }
    );

  const printer = printerId
    ? await getPrinterById(printerId)
    : await findKitchenPrinter(etablissementId);
  if (!printer)
    return NextResponse.json(
      { success: false, error: "Aucune imprimante cuisine disponible" },
      { status: 404 }
    );

  if (printer.typeConnexion === "SYSTEME") {
    const html = generateBonPreparationHTML(bonData, "cuisine");
    return NextResponse.json({ success: true, useSystemPrint: true, htmlContent: html });
  }

  const commands = generateBonCuisine(bonData, printer.largeurPapier as 58 | 80);
  const result = await sendToPrinter(printer, commands);
  return NextResponse.json(result);
}

async function handleBarPrint(
  etablissementId: string,
  data?: BonPreparationData,
  printerId?: string,
  venteId?: string
) {
  let bonData = data;
  if (!bonData && venteId) bonData = (await loadBonDataFromVente(venteId, "bar", etablissementId)) ?? undefined;
  if (!bonData)
    return NextResponse.json(
      { success: false, error: "Données du bon bar manquantes" },
      { status: 400 }
    );

  const printer = printerId
    ? await getPrinterById(printerId)
    : await findBarPrinter(etablissementId);
  if (!printer)
    return NextResponse.json(
      { success: false, error: "Aucune imprimante bar disponible" },
      { status: 404 }
    );

  if (printer.typeConnexion === "SYSTEME") {
    const html = generateBonPreparationHTML(bonData, "bar");
    return NextResponse.json({ success: true, useSystemPrint: true, htmlContent: html });
  }

  const commands = generateBonBar(bonData, printer.largeurPapier as 58 | 80);
  const result = await sendToPrinter(printer, commands);
  return NextResponse.json(result);
}

async function handleRapportZPrint(
  etablissementId: string,
  data?: RapportZData,
  printerId?: string,
  sessionId?: string
) {
  let rapportData = data;
  if (!rapportData && sessionId)
    rapportData = (await loadRapportZDataFromSession(sessionId, etablissementId)) ?? undefined;
  if (!rapportData)
    return NextResponse.json(
      { success: false, error: "Données du rapport Z manquantes" },
      { status: 400 }
    );

  const printer = printerId
    ? await getPrinterById(printerId)
    : await findTicketPrinter(etablissementId);
  if (!printer)
    return NextResponse.json(
      { success: false, error: "Aucune imprimante disponible pour le rapport Z" },
      { status: 404 }
    );

  if (printer.typeConnexion === "SYSTEME") {
    const html = generateRapportZHTML(rapportData);
    return NextResponse.json({ success: true, useSystemPrint: true, htmlContent: html });
  }

  const commands = generateRapportZ(rapportData, printer.largeurPapier as 58 | 80);
  const result = await sendToPrinter(printer, commands);
  return NextResponse.json(result);
}

async function handleAdditionPrint(
  etablissementId: string,
  data?: AdditionData,
  printerId?: string
) {
  if (!data)
    return NextResponse.json(
      { success: false, error: "Données de l'addition manquantes" },
      { status: 400 }
    );

  const printer = printerId
    ? await getPrinterById(printerId)
    : await findTicketPrinter(etablissementId);
  if (!printer)
    return NextResponse.json(
      { success: false, error: "Aucune imprimante disponible pour l'addition" },
      { status: 404 }
    );

  if (printer.typeConnexion === "SYSTEME") {
    const html = generateAdditionHTML(data);
    return NextResponse.json({ success: true, useSystemPrint: true, htmlContent: html });
  }

  const commands = generateAddition(data, printer.largeurPapier as 58 | 80);
  const result = await sendToPrinter(printer, commands);
  return NextResponse.json(result);
}

async function loadTicketDataFromVente(venteId: string, etablissementId: string): Promise<TicketClientData | null> {
  const supabase = createServiceClient();
  const { data: vente } = await supabase
    .from("ventes")
    .select(
      `
      *, etablissements(*), utilisateurs(nom, prenom), clients(nom, prenom),
      tables(numero, zones(nom)),
      lignes_vente(*, produits(nom, categories(id, nom))),
      paiements(*)
    `
    )
    .eq("id", venteId)
    .eq("etablissement_id", etablissementId)
    .single();

  if (!vente) return null;

  const etab = vente.etablissements as Record<string, unknown>;
  const user = vente.utilisateurs as { nom: string; prenom: string | null };
  const client = vente.clients as { nom: string; prenom: string | null } | null;
  const table = vente.tables as { numero: string; zones: { nom: string } } | null;
  const lignes = vente.lignes_vente as Array<{
    quantite: number;
    prix_unitaire: string | number;
    total: string | number;
    notes: string | null;
    produits: { nom: string; categories: { id: string; nom: string } };
  }>;
  const paiements = vente.paiements as Array<{
    mode_paiement: string;
    montant: string | number;
    reference: string | null;
    montant_recu: string | number | null;
    monnaie_rendue: string | number | null;
  }>;

  return {
    etablissement: {
      nom: etab.nom as string,
      adresse: etab.adresse as string,
      telephone: etab.telephone as string,
      email: etab.email as string,
      nif: etab.nif as string,
      rccm: etab.rccm as string,
    },
    numeroTicket: vente.numero_ticket,
    dateVente: new Date(vente.created_at),
    typeVente: vente.type,
    tableNumero: table?.numero || null,
    tableZone: table?.zones?.nom || null,
    clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
    caissierNom: `${user.nom}${user.prenom ? " " + user.prenom : ""}`,
    lignes: lignes.map((l) => ({
      produitNom: l.produits.nom,
      quantite: l.quantite,
      prixUnitaire: Number(l.prix_unitaire),
      total: Number(l.total),
      notes: l.notes,
      categorieId: l.produits.categories?.id,
      categorieNom: l.produits.categories?.nom,
    })),
    sousTotal: Number(vente.sous_total),
    totalTva: Number(vente.total_tva),
    totalRemise: Number(vente.total_remise),
    totalFinal: Number(vente.total_final),
    remiseType: vente.type_remise as "POURCENTAGE" | "MONTANT_FIXE" | null,
    remiseValeur: vente.valeur_remise ? Number(vente.valeur_remise) : null,
    paiements: paiements.map((p) => ({
      mode: p.mode_paiement,
      montant: Number(p.montant),
      reference: p.reference,
      montantRecu: p.montant_recu ? Number(p.montant_recu) : null,
      monnaieRendue: p.monnaie_rendue ? Number(p.monnaie_rendue) : null,
    })),
    montantRecu: paiements.find((p) => p.montant_recu)
      ? Number(paiements.find((p) => p.montant_recu)!.montant_recu)
      : null,
    monnaieRendue: paiements.find((p) => p.monnaie_rendue)
      ? Number(paiements.find((p) => p.monnaie_rendue)!.monnaie_rendue)
      : null,
  };
}

async function loadBonDataFromVente(
  venteId: string,
  type: "cuisine" | "bar",
  etablissementId: string
): Promise<BonPreparationData | null> {
  const supabase = createServiceClient();
  const { data: vente } = await supabase
    .from("ventes")
    .select(
      `
      *, utilisateurs(nom, prenom), clients(nom, prenom),
      tables(numero, zones(nom)),
      lignes_vente(quantite, notes, produits(nom, categories(nom)))
    `
    )
    .eq("id", venteId)
    .eq("etablissement_id", etablissementId)
    .single();

  if (!vente) return null;

  const user = vente.utilisateurs as { nom: string; prenom: string | null };
  const client = vente.clients as { nom: string; prenom: string | null } | null;
  const table = vente.tables as { numero: string; zones: { nom: string } } | null;
  const allLignes = vente.lignes_vente as Array<{
    quantite: number;
    notes: string | null;
    produits: { nom: string; categories: { nom: string } | null };
  }>;

  const barKeywords = [
    "boisson",
    "bar",
    "cocktail",
    "vin",
    "biere",
    "alcool",
    "soft",
    "jus",
    "cafe",
  ];
  const lignes = allLignes
    .filter((l) => {
      const catNom = l.produits.categories?.nom?.toLowerCase() || "";
      const isBar = barKeywords.some((mot) => catNom.includes(mot));
      return type === "bar" ? isBar : !isBar;
    })
    .map((l) => ({
      produitNom: l.produits.nom,
      quantite: l.quantite,
      prixUnitaire: 0,
      total: 0,
      notes: l.notes,
      categorieNom: l.produits.categories?.nom,
    }));

  if (lignes.length === 0) return null;

  return {
    numeroCommande: vente.numero_ticket,
    dateCommande: new Date(vente.created_at),
    typeVente: vente.type,
    tableNumero: table?.numero || null,
    tableZone: table?.zones?.nom || null,
    clientNom: client ? `${client.nom}${client.prenom ? " " + client.prenom : ""}` : null,
    serveurNom: `${user.nom}${user.prenom ? " " + user.prenom : ""}`,
    lignes,
    notes: vente.notes,
    urgent: false,
  };
}

async function loadRapportZDataFromSession(sessionId: string, etablissementId: string): Promise<RapportZData | null> {
  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("sessions_caisse")
    .select(
      `
      *, etablissements(*), utilisateurs(nom, prenom),
      ventes(statut, type, total_final, sous_total, total_tva, paiements(mode_paiement, montant), lignes_vente(quantite, total, produit_id, produits(nom)))
    `
    )
    .eq("id", sessionId)
    .eq("etablissement_id", etablissementId)
    .single();

  if (!session || !session.date_cloture) return null;

  const etab = session.etablissements as Record<string, unknown>;
  const user = session.utilisateurs as { nom: string; prenom: string | null };
  const ventes = session.ventes as Array<{
    statut: string;
    type: string;
    total_final: string | number;
    sous_total: string | number;
    total_tva: string | number;
    paiements: Array<{ mode_paiement: string; montant: string | number }>;
    lignes_vente: Array<{
      quantite: number;
      total: string | number;
      produit_id: string;
      produits: { nom: string };
    }>;
  }>;

  let totalVentes = 0,
    totalEspeces = 0,
    totalCartes = 0,
    totalMobileMoney = 0,
    totalAutres = 0,
    articlesVendus = 0,
    totalHT = 0,
    totalTVA = 0;
  const ventesParType: Record<string, { count: number; total: number }> = {
    DIRECT: { count: 0, total: 0 },
    TABLE: { count: 0, total: 0 },
    LIVRAISON: { count: 0, total: 0 },
    EMPORTER: { count: 0, total: 0 },
  };
  const produitsVendus: Record<string, { nom: string; quantite: number; total: number }> = {};

  const ventesPayees = ventes.filter((v) => v.statut === "PAYEE");
  const ventesAnnulees = ventes.filter((v) => v.statut === "ANNULEE");

  for (const v of ventesPayees) {
    const total = Number(v.total_final);
    totalVentes += total;
    totalHT += Number(v.sous_total);
    totalTVA += Number(v.total_tva);
    if (ventesParType[v.type]) {
      ventesParType[v.type].count++;
      ventesParType[v.type].total += total;
    }

    for (const p of v.paiements) {
      const montant = Number(p.montant);
      if (p.mode_paiement === "ESPECES") totalEspeces += montant;
      else if (p.mode_paiement === "CARTE_BANCAIRE") totalCartes += montant;
      else if (["AIRTEL_MONEY", "MOOV_MONEY"].includes(p.mode_paiement))
        totalMobileMoney += montant;
      else totalAutres += montant;
    }

    for (const l of v.lignes_vente) {
      articlesVendus += l.quantite;
      if (!produitsVendus[l.produit_id])
        produitsVendus[l.produit_id] = { nom: l.produits.nom, quantite: 0, total: 0 };
      produitsVendus[l.produit_id].quantite += l.quantite;
      produitsVendus[l.produit_id].total += Number(l.total);
    }
  }

  const topProduits = Object.values(produitsVendus)
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 10);
  const fondCaisse = Number(session.fond_caisse);
  const especesComptees = session.especes_comptees ? Number(session.especes_comptees) : 0;
  const especesAttendues = fondCaisse + totalEspeces;

  return {
    etablissement: {
      nom: etab.nom as string,
      adresse: etab.adresse as string,
      telephone: etab.telephone as string,
      email: etab.email as string,
      nif: etab.nif as string,
      rccm: etab.rccm as string,
    },
    sessionId: session.id,
    dateOuverture: new Date(session.date_ouverture),
    dateCloture: new Date(session.date_cloture),
    caissierNom: `${user.nom}${user.prenom ? " " + user.prenom : ""}`,
    fondCaisse,
    especesComptees,
    especesAttendues,
    ecart: session.ecart ? Number(session.ecart) : especesComptees - especesAttendues,
    totalVentes,
    nombreVentes: ventesPayees.length,
    nombreAnnulations: ventesAnnulees.length,
    articlesVendus,
    panierMoyen: ventesPayees.length > 0 ? Math.round(totalVentes / ventesPayees.length) : 0,
    paiements: {
      especes: totalEspeces,
      cartes: totalCartes,
      mobileMoney: totalMobileMoney,
      autres: totalAutres,
    },
    tva: { totalHT, totalTVA, totalTTC: totalVentes },
    ventesParType,
    topProduits,
    notesCloture: session.notes_cloture,
  };
}
