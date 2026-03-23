"use server";

/**
 * Server Actions pour la gestion des parametres
 * Migré de Prisma vers Supabase - Version optimisée
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import { getEtablissementId, getEtablissement } from "@/lib/etablissement";
import {
  etablissementSchema,
  fiscalSchema,
  imprimanteSchema,
  zoneLivraisonSchema,
  caisseVentesSchema,
  stockSettingsSchema,
  fideliteSettingsSchema,
  securiteSettingsSchema,
  planSalleSettingsSchema,
  resetDataOptionsSchema,
  parametresFactureSchema,
  defaultParametresFacture,
  type EtablissementFormData,
  type FiscalFormData,
  type ImprimanteFormData,
  type ZoneLivraisonFormData,
  type CaisseVentesFormData,
  type StockSettingsFormData,
  type FideliteSettingsFormData,
  type SecuriteSettingsFormData,
  type PlanSalleSettingsFormData,
  type ResetDataOptions,
  type ParametresFactureFormData,
} from "@/schemas/parametres.schema";
import { getCurrentUser } from "@/lib/auth";
import type { ZodSchema } from "zod";

// ============================================================================
// HELPERS
// ============================================================================

type ActionResult<T = unknown> = { success: boolean; error?: string; data?: T };

function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { valid: true; data: T } | { valid: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success)
    return { valid: false, error: result.error.issues[0]?.message || "Données invalides" };
  return { valid: true, data: result.data };
}

function handleError<T = unknown>(message: string, error: unknown): ActionResult<T> {
  console.error(message, error);
  return { success: false, error: message };
}

const MUTATION_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

async function requireMutationRole<T = void>(): Promise<
  | { authorized: true }
  | { authorized: false; result: ActionResult<T> }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !MUTATION_ALLOWED_ROLES.includes(currentUser.role)) {
    return { authorized: false, result: { success: false, error: "Permissions insuffisantes" } as ActionResult<T> };
  }
  return { authorized: true };
}

// ============================================================================
// ETABLISSEMENT
// ============================================================================

export async function getEtablissementInfo() {
  return getEtablissement();
}

export async function updateEtablissement(data: EtablissementFormData): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(etablissementSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        nom: validation.data.nom,
        adresse: validation.data.adresse,
        telephone: validation.data.telephone,
        email: validation.data.email,
        nif: validation.data.nif,
        rccm: validation.data.rccm,
        logo: validation.data.logo || null,
        message_ticket: validation.data.messageTicket || null,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour de l'etablissement", error);
  }
}

// ============================================================================
// FISCALITE
// ============================================================================

export async function getFiscalSettings() {
  const etablissement = await getEtablissement();
  return {
    tauxTvaStandard: etablissement.tauxTvaStandard,
    tauxTvaReduit: etablissement.tauxTvaReduit,
    afficherTvaSurTicket: etablissement.afficherTvaSurTicket,
  };
}

export async function getTvaRates() {
  const { tauxTvaStandard, tauxTvaReduit } = await getFiscalSettings();
  return [
    { value: tauxTvaStandard, label: `Standard (${tauxTvaStandard}%)`, isDefault: true },
    { value: tauxTvaReduit, label: `Reduit (${tauxTvaReduit}%)`, isDefault: false },
    { value: 0, label: "Exonere (0%)", isDefault: false },
  ];
}

export async function updateFiscalSettings(data: FiscalFormData): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(fiscalSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        taux_tva_standard: validation.data.tauxTvaStandard,
        taux_tva_reduit: validation.data.tauxTvaReduit,
        afficher_tva_sur_ticket: validation.data.afficherTvaSurTicket,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return {
      success: true,
      data: {
        tauxTvaStandard: result.taux_tva_standard,
        tauxTvaReduit: result.taux_tva_reduit,
        afficherTvaSurTicket: result.afficher_tva_sur_ticket,
      },
    };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres fiscaux", error);
  }
}

// ============================================================================
// IMPRIMANTES
// ============================================================================

export async function getImprimantes() {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("imprimantes")
    .select("*, categories(id, nom, couleur)")
    .eq("etablissement_id", etablissementId)
    .order("nom", { ascending: true });

  return data || [];
}

export async function getImprimantesWithCategories() {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("imprimantes")
    .select("*, categories(id, nom, couleur)")
    .eq("etablissement_id", etablissementId)
    .order("nom", { ascending: true });

  // Transformer les données pour le frontend
  return (data || []).map((imp) => ({
    id: imp.id,
    nom: imp.nom,
    type: imp.type,
    typeConnexion: imp.type_connexion,
    adresseIp: imp.adresse_ip,
    port: imp.port,
    pathUsb: imp.path_usb,
    largeurPapier: imp.largeur_papier,
    actif: imp.actif,
    categories: (imp.categories || []) as Array<{ id: string; nom: string; couleur: string }>,
  }));
}

export async function getImprimanteById(id: string) {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("imprimantes")
    .select("*")
    .eq("id", id)
    .eq("etablissement_id", etablissementId)
    .single();

  return data;
}

export async function createImprimante(data: ImprimanteFormData): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(imprimanteSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("imprimantes")
      .insert({
        nom: validation.data.nom,
        type: validation.data.type,
        type_connexion: validation.data.typeConnexion as "USB" | "RESEAU" | "SERIE" | "BLUETOOTH",
        adresse_ip: validation.data.adresseIp,
        port: validation.data.port,
        path_usb: validation.data.pathUsb,
        largeur_papier: validation.data.largeurPapier,
        actif: validation.data.actif,
        etablissement_id: etablissementId,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors de la creation de l'imprimante", error);
  }
}

export async function updateImprimante(
  id: string,
  data: ImprimanteFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(imprimanteSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();

    // Vérifier existence
    const { data: existing } = await supabase
      .from("imprimantes")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!existing) return { success: false, error: "Imprimante non trouvee" };

    const { data: result, error } = await supabase
      .from("imprimantes")
      .update({
        nom: validation.data.nom,
        type: validation.data.type,
        type_connexion: validation.data.typeConnexion as "USB" | "RESEAU" | "SERIE" | "BLUETOOTH",
        adresse_ip: validation.data.adresseIp,
        port: validation.data.port,
        path_usb: validation.data.pathUsb,
        largeur_papier: validation.data.largeurPapier,
        actif: validation.data.actif,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour de l'imprimante", error);
  }
}

export async function deleteImprimante(id: string): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("imprimantes")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!existing) return { success: false, error: "Imprimante non trouvee" };

    const { error } = await supabase.from("imprimantes").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    return handleError("Erreur lors de la suppression de l'imprimante", error);
  }
}

export async function toggleImprimanteActif(id: string): Promise<ActionResult<{ actif: boolean }>> {
  try {
    const auth = await requireMutationRole<{ actif: boolean }>();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    const { data: imprimante } = await supabase
      .from("imprimantes")
      .select("actif")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!imprimante) return { success: false, error: "Imprimante non trouvee" };

    const { data: result, error } = await supabase
      .from("imprimantes")
      .update({ actif: !imprimante.actif })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors du changement d'etat de l'imprimante", error);
  }
}

// ============================================================================
// ZONES DE LIVRAISON
// ============================================================================

export async function getZonesLivraison() {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("zones")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .order("ordre", { ascending: true });

  return data || [];
}

export async function getZoneLivraisonById(id: string) {
  const etablissementId = await getEtablissementId();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("zones")
    .select("*")
    .eq("id", id)
    .eq("etablissement_id", etablissementId)
    .single();

  return data;
}

export async function createZoneLivraison(data: ZoneLivraisonFormData): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(zoneLivraisonSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();

    // Vérifier unicité du nom
    const { data: existing } = await supabase
      .from("zones")
      .select("id")
      .eq("etablissement_id", etablissementId)
      .eq("nom", validation.data.nom)
      .single();

    if (existing) return { success: false, error: "Une zone avec ce nom existe deja" };

    // Déterminer l'ordre
    const { data: lastZone } = await supabase
      .from("zones")
      .select("ordre")
      .eq("etablissement_id", etablissementId)
      .order("ordre", { ascending: false })
      .limit(1)
      .single();

    const { data: result, error } = await supabase
      .from("zones")
      .insert({
        nom: validation.data.nom,
        frais_livraison: validation.data.frais,
        delai_estime: validation.data.delaiEstime || null,
        couleur: "#f97316",
        ordre: (lastZone?.ordre ?? 0) + 1,
        active: validation.data.actif,
        etablissement_id: etablissementId,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors de la creation de la zone", error);
  }
}

export async function updateZoneLivraison(
  id: string,
  data: ZoneLivraisonFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(zoneLivraisonSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();

    // Vérifier existence
    const { data: existing } = await supabase
      .from("zones")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!existing) return { success: false, error: "Zone non trouvee" };

    // Vérifier unicité du nom
    const { data: duplicate } = await supabase
      .from("zones")
      .select("id")
      .eq("etablissement_id", etablissementId)
      .eq("nom", validation.data.nom)
      .neq("id", id)
      .single();

    if (duplicate) return { success: false, error: "Une zone avec ce nom existe deja" };

    const { data: result, error } = await supabase
      .from("zones")
      .update({
        nom: validation.data.nom,
        frais_livraison: validation.data.frais,
        delai_estime: validation.data.delaiEstime || null,
        active: validation.data.actif,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour de la zone", error);
  }
}

export async function deleteZoneLivraison(id: string): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    // Vérifier existence et compter les tables
    const { data: existing } = await supabase
      .from("zones")
      .select("id")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!existing) return { success: false, error: "Zone non trouvee" };

    const { count } = await supabase
      .from("tables")
      .select("*", { count: "exact", head: true })
      .eq("zone_id", id);

    if (count && count > 0) {
      return {
        success: false,
        error: `Impossible de supprimer cette zone car elle contient ${count} table(s)`,
      };
    }

    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    return handleError("Erreur lors de la suppression de la zone", error);
  }
}

export async function toggleZoneLivraisonActif(id: string): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    const { data: zone } = await supabase
      .from("zones")
      .select("active")
      .eq("id", id)
      .eq("etablissement_id", etablissementId)
      .single();

    if (!zone) return { success: false, error: "Zone non trouvee" };

    const { data: result, error } = await supabase
      .from("zones")
      .update({ active: !zone.active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return { success: true, data: result };
  } catch (error) {
    return handleError("Erreur lors du changement d'etat de la zone", error);
  }
}

// ============================================================================
// CAISSE & VENTES
// ============================================================================

export async function getCaisseVentesSettings() {
  const etablissement = await getEtablissement();
  const modesPaiementActifs = etablissement.modesPaiementActifs.filter(
    (mode) => mode !== "MIXTE"
  ) as Array<
    | "ESPECES"
    | "CARTE_BANCAIRE"
    | "AIRTEL_MONEY"
    | "MOOV_MONEY"
    | "CHEQUE"
    | "VIREMENT"
    | "COMPTE_CLIENT"
  >;

  return {
    modeVenteDefaut: etablissement.modeVenteDefaut as "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER",
    confirmationVente: etablissement.confirmationVente,
    montantMinimumVente: etablissement.montantMinimumVente,
    remiseMaxAutorisee: Number(etablissement.remiseMaxAutorisee),
    impressionAutoTicket: etablissement.impressionAutoTicket,
    modesPaiementActifs,
  };
}

export async function updateCaisseVentesSettings(
  data: CaisseVentesFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(caisseVentesSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        mode_vente_defaut: validation.data.modeVenteDefaut,
        confirmation_vente: validation.data.confirmationVente,
        montant_minimum_vente: validation.data.montantMinimumVente,
        remise_max_autorisee: validation.data.remiseMaxAutorisee,
        impression_auto_ticket: validation.data.impressionAutoTicket,
        modes_paiement_actifs: validation.data.modesPaiementActifs,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return {
      success: true,
      data: {
        modeVenteDefaut: result.mode_vente_defaut,
        confirmationVente: result.confirmation_vente,
        montantMinimumVente: result.montant_minimum_vente,
        remiseMaxAutorisee: Number(result.remise_max_autorisee),
        impressionAutoTicket: result.impression_auto_ticket,
        modesPaiementActifs: result.modes_paiement_actifs,
      },
    };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres de caisse", error);
  }
}

// ============================================================================
// GESTION DES STOCKS
// ============================================================================

export async function getStockSettings() {
  const etablissement = await getEtablissement();
  return {
    seuilAlerteStockBas: etablissement.seuilAlerteStockBas,
    seuilCritiqueStock: etablissement.seuilCritiqueStock,
    alerteStockEmail: etablissement.alerteStockEmail,
    emailAlerteStock: etablissement.emailAlerteStock,
    methodeValuationStock: etablissement.methodeValuationStock as "FIFO" | "LIFO",
  };
}

export async function updateStockSettings(data: StockSettingsFormData): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(stockSettingsSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        seuil_alerte_stock_bas: validation.data.seuilAlerteStockBas,
        seuil_critique_stock: validation.data.seuilCritiqueStock,
        alerte_stock_email: validation.data.alerteStockEmail,
        email_alerte_stock: validation.data.emailAlerteStock,
        methode_valuation_stock: validation.data.methodeValuationStock,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return {
      success: true,
      data: {
        seuilAlerteStockBas: result.seuil_alerte_stock_bas,
        seuilCritiqueStock: result.seuil_critique_stock,
        alerteStockEmail: result.alerte_stock_email,
        emailAlerteStock: result.email_alerte_stock,
        methodeValuationStock: result.methode_valuation_stock,
      },
    };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres de stock", error);
  }
}

// ============================================================================
// PROGRAMME FIDELITE
// ============================================================================

export async function getFideliteSettings() {
  const etablissement = await getEtablissement();
  return {
    fideliteActif: etablissement.fideliteActif,
    tauxPointsFidelite: etablissement.tauxPointsFidelite,
    valeurPointFidelite: etablissement.valeurPointFidelite,
    creditClientActif: etablissement.creditClientActif,
    limiteCreditDefaut: etablissement.limiteCreditDefaut,
    dureeValiditeSolde: etablissement.dureeValiditeSolde,
  };
}

export async function updateFideliteSettings(
  data: FideliteSettingsFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(fideliteSettingsSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        fidelite_actif: validation.data.fideliteActif,
        taux_points_fidelite: validation.data.tauxPointsFidelite,
        valeur_point_fidelite: validation.data.valeurPointFidelite,
        credit_client_actif: validation.data.creditClientActif,
        limite_credit_defaut: validation.data.limiteCreditDefaut,
        duree_validite_solde: validation.data.dureeValiditeSolde,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return {
      success: true,
      data: {
        fideliteActif: result.fidelite_actif,
        tauxPointsFidelite: result.taux_points_fidelite,
        valeurPointFidelite: result.valeur_point_fidelite,
        creditClientActif: result.credit_client_actif,
        limiteCreditDefaut: result.limite_credit_defaut,
        dureeValiditeSolde: result.duree_validite_solde,
      },
    };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres de fidelite", error);
  }
}

// ============================================================================
// SECURITE
// ============================================================================

export async function getSecuriteSettings() {
  const etablissement = await getEtablissement();
  return {
    longueurPinMinimum: etablissement.longueurPinMinimum,
    tentativesLoginMax: etablissement.tentativesLoginMax,
    dureeBlocage: etablissement.dureeBlocage,
    sessionTimeout: etablissement.sessionTimeout,
    auditActif: etablissement.auditActif,
    actionsALogger: etablissement.actionsALogger as Array<
      | "CREATE"
      | "UPDATE"
      | "DELETE"
      | "LOGIN"
      | "LOGOUT"
      | "CAISSE_OUVERTURE"
      | "CAISSE_CLOTURE"
      | "ANNULATION_VENTE"
      | "REMISE_APPLIQUEE"
    >,
  };
}

export async function updateSecuriteSettings(
  data: SecuriteSettingsFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(securiteSettingsSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        longueur_pin_minimum: validation.data.longueurPinMinimum,
        tentatives_login_max: validation.data.tentativesLoginMax,
        duree_blocage: validation.data.dureeBlocage,
        session_timeout: validation.data.sessionTimeout,
        audit_actif: validation.data.auditActif,
        actions_a_logger: validation.data.actionsALogger,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return {
      success: true,
      data: {
        longueurPinMinimum: result.longueur_pin_minimum,
        tentativesLoginMax: result.tentatives_login_max,
        dureeBlocage: result.duree_blocage,
        sessionTimeout: result.session_timeout,
        auditActif: result.audit_actif,
        actionsALogger: result.actions_a_logger,
      },
    };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres de securite", error);
  }
}

// ============================================================================
// PLAN DE SALLE
// ============================================================================

export async function getPlanSalleSettings() {
  const etablissement = await getEtablissement();
  return {
    couleurTableLibre: etablissement.couleurTableLibre,
    couleurTableOccupee: etablissement.couleurTableOccupee,
    couleurTablePrepa: etablissement.couleurTablePrepa,
    couleurTableAddition: etablissement.couleurTableAddition,
    couleurTableNettoyer: etablissement.couleurTableNettoyer,
    affichageTable: etablissement.affichageTable as
      | "NOM"
      | "NUMERO"
      | "CAPACITE"
      | "NOM_NUMERO"
      | "NUMERO_CAPACITE",
    grilleActivee: etablissement.grilleActivee,
    tailleGrille: etablissement.tailleGrille,
  };
}

export async function updatePlanSalleSettings(
  data: PlanSalleSettingsFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(planSalleSettingsSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();
    const { data: result, error } = await supabase
      .from("etablissements")
      .update({
        couleur_table_libre: validation.data.couleurTableLibre,
        couleur_table_occupee: validation.data.couleurTableOccupee,
        couleur_table_prepa: validation.data.couleurTablePrepa,
        couleur_table_addition: validation.data.couleurTableAddition,
        couleur_table_nettoyer: validation.data.couleurTableNettoyer,
        affichage_table: validation.data.affichageTable,
        grille_activee: validation.data.grilleActivee,
        taille_grille: validation.data.tailleGrille,
      })
      .eq("id", etablissementId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/parametres");
    return {
      success: true,
      data: {
        couleurTableLibre: result.couleur_table_libre,
        couleurTableOccupee: result.couleur_table_occupee,
        couleurTablePrepa: result.couleur_table_prepa,
        couleurTableAddition: result.couleur_table_addition,
        couleurTableNettoyer: result.couleur_table_nettoyer,
        affichageTable: result.affichage_table,
        grilleActivee: result.grille_activee,
        tailleGrille: result.taille_grille,
      },
    };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres du plan de salle", error);
  }
}

// ============================================================================
// REMISE A ZERO DES DONNEES
// ============================================================================

/**
 * Roles autorises a effectuer une remise a zero
 */
const RESET_ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN"];

/**
 * Resultat de la remise a zero avec details des suppressions
 */
interface ResetDataResult {
  success: boolean;
  deletedCounts?: Record<string, number>;
  timestamp?: string;
}

/**
 * Remet a zero les donnees selectionnees
 * ATTENTION: Action irreversible - Reservee aux administrateurs
 */
export async function resetData(data: ResetDataOptions): Promise<ActionResult<ResetDataResult>> {
  try {
    // 1. Verifier l'authentification et les permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Vous devez etre connecte pour effectuer cette action" };
    }

    if (!RESET_ALLOWED_ROLES.includes(currentUser.role)) {
      return {
        success: false,
        error: "Seuls les administrateurs peuvent effectuer une remise a zero des donnees",
      };
    }

    // 2. Valider les donnees
    const validation = validate(resetDataOptionsSchema, data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 3. Recuperer l'etablissement
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();
    const deletedCounts: Record<string, number> = {};

    // 4. Supprimer les donnees selon les options selectionnees
    // L'ordre est important pour respecter les contraintes de cle etrangere

    // Ventes: paiements -> lignes_vente -> ventes -> sessions_caisse
    if (validation.data.ventes) {
      // Supprimer les paiements des ventes de l'etablissement
      const { data: ventes } = await supabase
        .from("ventes")
        .select("id")
        .eq("etablissement_id", etablissementId);
      const venteIds = ventes?.map((v) => v.id) || [];

      if (venteIds.length > 0) {
        const { count: paiementsCount } = await supabase
          .from("paiements")
          .delete({ count: "exact" })
          .in("vente_id", venteIds);
        deletedCounts.paiements = paiementsCount || 0;

        const { count: lignesCount } = await supabase
          .from("lignes_vente")
          .delete({ count: "exact" })
          .in("vente_id", venteIds);
        deletedCounts.lignes_vente = lignesCount || 0;
      }

      const { count: ventesCount } = await supabase
        .from("ventes")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.ventes = ventesCount || 0;

      const { count: sessionsCount } = await supabase
        .from("sessions_caisse")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.sessions_caisse = sessionsCount || 0;
    }

    // Stocks: mouvements_stock
    if (validation.data.stocks) {
      const { count } = await supabase
        .from("mouvements_stock")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.mouvements_stock = count || 0;
    }

    // Clients
    if (validation.data.clients) {
      const { count } = await supabase
        .from("clients")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.clients = count || 0;
    }

    // Produits: supplements_produit -> produits -> categories
    if (validation.data.produits) {
      // D'abord supprimer les supplements
      const { data: produits } = await supabase
        .from("produits")
        .select("id")
        .eq("etablissement_id", etablissementId);
      const produitIds = produits?.map((p) => p.id) || [];

      if (produitIds.length > 0) {
        const { count: suppCount } = await supabase
          .from("supplements_produits")
          .delete({ count: "exact" })
          .in("produit_id", produitIds);
        deletedCounts.supplements_produits = suppCount || 0;
      }

      const { count: produitsCount } = await supabase
        .from("produits")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.produits = produitsCount || 0;

      const { count: categoriesCount } = await supabase
        .from("categories")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.categories = categoriesCount || 0;
    }

    // Tables: tables -> zones
    if (validation.data.tables) {
      const { count: tablesCount } = await supabase
        .from("tables")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.tables = tablesCount || 0;

      const { count: zonesCount } = await supabase
        .from("zones")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.zones = zonesCount || 0;
    }

    // Imprimantes
    if (validation.data.imprimantes) {
      const { count } = await supabase
        .from("imprimantes")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.imprimantes = count || 0;
    }

    // Utilisateurs (sauf l'utilisateur actuel)
    if (validation.data.utilisateurs) {
      const { count } = await supabase
        .from("utilisateurs")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId)
        .neq("id", currentUser.userId);
      deletedCounts.utilisateurs = count || 0;
    }

    // Logs d'audit
    if (validation.data.auditLogs) {
      const { count } = await supabase
        .from("audit_logs")
        .delete({ count: "exact" })
        .eq("etablissement_id", etablissementId);
      deletedCounts.audit_logs = count || 0;
    }

    // 5. Creer un log d'audit pour cette operation
    // Note: RESET_DATA n'est pas dans l'enum ActionAudit, on utilise DELETE comme action d'audit
    await supabase.from("audit_logs").insert({
      action: "DELETE",
      entite: "Système",
      entite_id: etablissementId,
      description: `Remise à zéro des données: ${Object.entries(deletedCounts)
        .filter(([, count]) => count > 0)
        .map(([table, count]) => `${table}(${count})`)
        .join(", ")}`,
      utilisateur_id: currentUser.userId,
      etablissement_id: etablissementId,
    });

    // 6. Revalider les chemins affectes
    revalidatePath("/parametres");
    revalidatePath("/caisse");
    revalidatePath("/produits");
    revalidatePath("/clients");
    revalidatePath("/stocks");
    revalidatePath("/salle");
    revalidatePath("/employes");
    revalidatePath("/rapports");

    return {
      success: true,
      data: {
        success: true,
        deletedCounts,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la remise a zero des donnees", error);
    return { success: false, error: "Erreur lors de la remise a zero des donnees" };
  }
}

/**
 * Obtient les statistiques des donnees pour l'apercu avant suppression
 */
export async function getDataStatistics(): Promise<ActionResult<Record<string, number>>> {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    // Compter les enregistrements de chaque table
    const counts: Record<string, number> = {};

    // Ventes
    const { count: ventesCount } = await supabase
      .from("ventes")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.ventes = ventesCount || 0;

    // Sessions de caisse
    const { count: sessionsCount } = await supabase
      .from("sessions_caisse")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.sessions_caisse = sessionsCount || 0;

    // Clients
    const { count: clientsCount } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.clients = clientsCount || 0;

    // Produits
    const { count: produitsCount } = await supabase
      .from("produits")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.produits = produitsCount || 0;

    // Categories
    const { count: categoriesCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.categories = categoriesCount || 0;

    // Mouvements de stock
    const { count: stocksCount } = await supabase
      .from("mouvements_stock")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.mouvements_stock = stocksCount || 0;

    // Tables
    const { count: tablesCount } = await supabase
      .from("tables")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.tables = tablesCount || 0;

    // Zones
    const { count: zonesCount } = await supabase
      .from("zones")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.zones = zonesCount || 0;

    // Imprimantes
    const { count: imprimantesCount } = await supabase
      .from("imprimantes")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.imprimantes = imprimantesCount || 0;

    // Utilisateurs
    const { count: utilisateursCount } = await supabase
      .from("utilisateurs")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.utilisateurs = utilisateursCount || 0;

    // Audit logs
    const { count: auditCount } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("etablissement_id", etablissementId);
    counts.audit_logs = auditCount || 0;

    return { success: true, data: counts };
  } catch (error) {
    console.error("Erreur lors de la recuperation des statistiques", error);
    return { success: false, error: "Erreur lors de la recuperation des statistiques" };
  }
}

// ============================================================================
// PARAMETRES DE FACTURE / TICKET
// ============================================================================

/**
 * Recupere les parametres de facture pour l'etablissement courant
 * Cree les parametres par defaut s'ils n'existent pas
 */
export async function getParametresFacture(): Promise<ParametresFactureFormData> {
  try {
    const etablissementId = await getEtablissementId();
    const supabase = createServiceClient();

    // Essayer de recuperer les parametres existants
    // Note: Table parametres_facture peut ne pas exister dans les types generés
    const { data, error } = await (supabase as any)
      .from("parametres_facture")
      .select("*")
      .eq("etablissement_id", etablissementId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Erreur lors de la recuperation des parametres facture:", error);
    }

    // Si pas de parametres, creer les valeurs par defaut
    if (!data) {
      const { data: newData, error: insertError } = await (supabase as any)
        .from("parametres_facture")
        .insert({ etablissement_id: etablissementId })
        .select()
        .single();

      if (insertError) {
        console.error("Erreur lors de la creation des parametres facture:", insertError);
        return defaultParametresFacture;
      }

      return mapDbToFormData(newData);
    }

    return mapDbToFormData(data);
  } catch (error) {
    console.error("Erreur getParametresFacture:", error);
    return defaultParametresFacture;
  }
}

/**
 * Mappe les donnees de la base vers le format du formulaire
 */
function mapDbToFormData(data: Record<string, unknown>): ParametresFactureFormData {
  return {
    typeFactureDefaut: (data.type_facture_defaut as string) || "TICKET_SIMPLE",
    afficherLogo: (data.afficher_logo as boolean) ?? true,
    afficherInfosEtablissement: (data.afficher_infos_etablissement as boolean) ?? true,
    afficherNifRccm: (data.afficher_nif_rccm as boolean) ?? false,
    afficherDetailTva: (data.afficher_detail_tva as boolean) ?? true,
    afficherQrCode: (data.afficher_qr_code as boolean) ?? false,
    styleSeparateur: (data.style_separateur as string) || "TIRETS",
    enteteTicketSimple: data.entete_ticket_simple as string | null,
    enteteFactureDetaillee: (data.entete_facture_detaillee as string | null) ?? "FACTURE",
    enteteProForma: (data.entete_pro_forma as string | null) ?? "PRO-FORMA",
    enteteNoteAddition: (data.entete_note_addition as string | null) ?? "ADDITION",
    piedPageTicketSimple:
      (data.pied_page_ticket_simple as string | null) ?? "Merci de votre visite !",
    piedPageFactureDetaillee:
      (data.pied_page_facture_detaillee as string | null) ?? "Conditions de paiement : comptant",
    piedPageProForma:
      (data.pied_page_pro_forma as string | null) ?? "Ce document n'est pas une facture",
    piedPageNoteAddition:
      (data.pied_page_note_addition as string | null) ?? "Merci de régler à la caisse",
    copiesTicketSimple: (data.copies_ticket_simple as number) ?? 1,
    copiesFactureDetaillee: (data.copies_facture_detaillee as number) ?? 2,
    copiesProForma: (data.copies_pro_forma as number) ?? 1,
    copiesNoteAddition: (data.copies_note_addition as number) ?? 1,
  } as ParametresFactureFormData;
}

/**
 * Met a jour les parametres de facture
 */
export async function updateParametresFacture(
  data: ParametresFactureFormData
): Promise<ActionResult> {
  try {
    const auth = await requireMutationRole();
    if (!auth.authorized) return auth.result;
    const etablissementId = await getEtablissementId();
    const validation = validate(parametresFactureSchema, data);
    if (!validation.valid) return { success: false, error: validation.error };

    const supabase = createServiceClient();

    // Upsert pour creer ou mettre a jour
    // Note: Table parametres_facture peut ne pas exister dans les types generés
    const { data: result, error } = await (supabase as any)
      .from("parametres_facture")
      .upsert(
        {
          etablissement_id: etablissementId,
          type_facture_defaut: validation.data.typeFactureDefaut,
          afficher_logo: validation.data.afficherLogo,
          afficher_infos_etablissement: validation.data.afficherInfosEtablissement,
          afficher_nif_rccm: validation.data.afficherNifRccm,
          afficher_detail_tva: validation.data.afficherDetailTva,
          afficher_qr_code: validation.data.afficherQrCode,
          style_separateur: validation.data.styleSeparateur,
          entete_ticket_simple: validation.data.enteteTicketSimple || null,
          entete_facture_detaillee: validation.data.enteteFactureDetaillee || null,
          entete_pro_forma: validation.data.enteteProForma || null,
          entete_note_addition: validation.data.enteteNoteAddition || null,
          pied_page_ticket_simple: validation.data.piedPageTicketSimple || null,
          pied_page_facture_detaillee: validation.data.piedPageFactureDetaillee || null,
          pied_page_pro_forma: validation.data.piedPageProForma || null,
          pied_page_note_addition: validation.data.piedPageNoteAddition || null,
          copies_ticket_simple: validation.data.copiesTicketSimple,
          copies_facture_detaillee: validation.data.copiesFactureDetaillee,
          copies_pro_forma: validation.data.copiesProForma,
          copies_note_addition: validation.data.copiesNoteAddition,
        },
        {
          onConflict: "etablissement_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/parametres");
    return { success: true, data: mapDbToFormData(result) };
  } catch (error) {
    return handleError("Erreur lors de la mise a jour des parametres de facture", error);
  }
}
