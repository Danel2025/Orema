// @ts-nocheck — Tables pas encore dans types/supabase.ts (migrations non appliquées). Supprimer après `pnpm db:types`.
/**
 * Module d'enforcement des règles de tarification
 *
 * Fournit les fonctions de validation pour :
 * - Remises (pourcentage, plafond, approbation)
 * - Prix minimum de vente
 * - Marge minimale sur les produits
 * - Modes de paiement autorisés
 * - Modification des prix
 * - Tarifs horaires (ajustement automatique des prix)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ValidationResult,
  EnforcementContext,
  RegleTarificationRow,
  ConfigTarificationRow,
} from "./types";
import { ROLES_DEFAUT_REMISE } from "@/schemas/tarification.schema";

// ============================================================================
// CONTEXTE D'ENFORCEMENT
// ============================================================================

/**
 * Charge le contexte d'enforcement complet pour un utilisateur.
 * Combine les règles par rôle et la configuration globale de l'établissement.
 */
export async function getEnforcementContext(
  supabase: SupabaseClient,
  etablissementId: string,
  userId: string,
  role: string
): Promise<EnforcementContext> {
  // Charger les règles pour ce rôle
  const { data: regle } = await supabase
    .from("regles_tarification")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("role", role)
    .single();

  // Charger la config globale
  const { data: config } = await supabase
    .from("etablissements")
    .select(
      "protection_marge_active, marge_minimum_globale, approbation_remise_active, tarifs_horaires_actifs"
    )
    .eq("id", etablissementId)
    .single();

  const typedRegle = regle as RegleTarificationRow | null;
  const typedConfig = config as ConfigTarificationRow | null;

  // Valeurs par défaut si pas de règle configurée
  const remiseDefaut = ROLES_DEFAUT_REMISE[role] ?? 0;

  return {
    etablissementId,
    userId,
    role,
    remiseMaxPourcent: typedRegle?.remise_max_pourcent ?? remiseDefaut,
    peutAppliquerRemise: typedRegle?.peut_appliquer_remise ?? remiseDefaut > 0,
    peutModifierPrix: typedRegle?.peut_modifier_prix ?? ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role),
    plafondRemiseTransaction: typedRegle?.plafond_remise_transaction ?? 0,
    necessiteApprobationAuDela: typedRegle?.necessite_approbation_au_dela ?? null,
    protectionMargeActive: typedConfig?.protection_marge_active ?? false,
    margeMinimumGlobale: typedConfig?.marge_minimum_globale ?? 0,
    approbationRemiseActive: typedConfig?.approbation_remise_active ?? false,
  };
}

// ============================================================================
// VALIDATIONS
// ============================================================================

/**
 * Valide si une remise est autorisée pour l'utilisateur courant.
 *
 * Vérifie dans l'ordre :
 * 1. L'utilisateur a-t-il le droit d'appliquer des remises ?
 * 2. Le pourcentage dépasse-t-il le maximum autorisé ?
 * 3. Le montant dépasse-t-il le plafond par transaction ?
 * 4. Faut-il une approbation au-delà d'un certain seuil ?
 */
export function validerRemise(
  context: EnforcementContext,
  pourcentageRemise: number,
  montantRemise: number
): ValidationResult {
  // Vérifier le droit d'appliquer des remises
  if (!context.peutAppliquerRemise) {
    return {
      valide: false,
      raison: "Vous n'êtes pas autorisé à appliquer des remises",
    };
  }

  // Vérifier le pourcentage maximum
  if (pourcentageRemise > context.remiseMaxPourcent) {
    // Si l'approbation est active, demander une approbation plutôt que refuser
    if (context.approbationRemiseActive && context.necessiteApprobationAuDela !== null) {
      if (pourcentageRemise > context.necessiteApprobationAuDela) {
        return {
          valide: false,
          raison: `Remise de ${pourcentageRemise}% dépasse votre limite de ${context.remiseMaxPourcent}%. Approbation requise.`,
          necessiteApprobation: true,
        };
      }
    }

    return {
      valide: false,
      raison: `Remise de ${pourcentageRemise}% dépasse la limite autorisée de ${context.remiseMaxPourcent}%`,
    };
  }

  // Vérifier le plafond par transaction (0 = illimité)
  if (context.plafondRemiseTransaction > 0 && montantRemise > context.plafondRemiseTransaction) {
    return {
      valide: false,
      raison: `Montant de remise (${montantRemise} FCFA) dépasse le plafond de ${context.plafondRemiseTransaction} FCFA par transaction`,
    };
  }

  // Vérifier si approbation nécessaire au-delà d'un seuil
  if (
    context.approbationRemiseActive &&
    context.necessiteApprobationAuDela !== null &&
    pourcentageRemise > context.necessiteApprobationAuDela
  ) {
    return {
      valide: false,
      raison: `Remise de ${pourcentageRemise}% nécessite une approbation (seuil: ${context.necessiteApprobationAuDela}%)`,
      necessiteApprobation: true,
    };
  }

  return { valide: true };
}

/**
 * Valide le montant minimum d'une vente.
 */
export function validerPrixMinimum(
  montantTotal: number,
  montantMinimum: number
): ValidationResult {
  if (montantMinimum > 0 && montantTotal < montantMinimum) {
    return {
      valide: false,
      raison: `Le montant total (${montantTotal} FCFA) est inférieur au minimum requis de ${montantMinimum} FCFA`,
    };
  }

  return { valide: true };
}

/**
 * Valide la marge sur un produit.
 * Si la protection de marge est active, vérifie que la marge est suffisante.
 */
export function validerMarge(
  prixVente: number,
  prixAchat: number | null,
  margeMinimum: number
): ValidationResult {
  // Si pas de prix d'achat, on ne peut pas vérifier la marge
  if (prixAchat === null || prixAchat === 0) {
    return { valide: true };
  }

  const margePourcent = ((prixVente - prixAchat) / prixAchat) * 100;

  if (margePourcent < margeMinimum) {
    return {
      valide: false,
      raison: `La marge (${margePourcent.toFixed(1)}%) est inférieure au minimum requis de ${margeMinimum}%`,
    };
  }

  return { valide: true };
}

/**
 * Valide que le mode de paiement est actif pour l'établissement.
 */
export function validerModePaiement(
  mode: string,
  modesActifs: string[]
): ValidationResult {
  if (modesActifs.length > 0 && !modesActifs.includes(mode)) {
    return {
      valide: false,
      raison: `Le mode de paiement "${mode}" n'est pas activé pour cet établissement`,
    };
  }

  return { valide: true };
}

/**
 * Vérifie si l'utilisateur peut modifier les prix des produits.
 */
export function validerModificationPrix(
  context: EnforcementContext
): ValidationResult {
  if (!context.peutModifierPrix) {
    return {
      valide: false,
      raison: "Vous n'êtes pas autorisé à modifier les prix des produits",
    };
  }

  return { valide: true };
}

// ============================================================================
// TARIFS HORAIRES
// ============================================================================

/**
 * Calcule le prix ajusté selon les tarifs horaires actifs.
 *
 * Recherche les tarifs applicables à l'heure actuelle et applique
 * l'ajustement avec la plus haute priorité.
 *
 * @returns Le prix ajusté et le nom du tarif appliqué (null si aucun)
 */
export async function getPrixAjuste(
  supabase: SupabaseClient,
  prixBase: number,
  etablissementId: string,
  categorieId: string | null,
  heureActuelle?: Date
): Promise<{ prixAjuste: number; tarifApplique: string | null }> {
  // Vérifier si les tarifs horaires sont actifs
  const { data: config } = await supabase
    .from("etablissements")
    .select("tarifs_horaires_actifs")
    .eq("id", etablissementId)
    .single();

  if (!config?.tarifs_horaires_actifs) {
    return { prixAjuste: prixBase, tarifApplique: null };
  }

  const now = heureActuelle ?? new Date();
  // UTC+1 pour Gabon (Africa/Libreville)
  const heureGabon = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const heureStr = heureGabon.getUTCHours().toString().padStart(2, "0") + ":" +
    heureGabon.getUTCMinutes().toString().padStart(2, "0");
  // getUTCDay() : 0=Dimanche, on convertit en 1=Lundi...7=Dimanche
  const jourSemaine = heureGabon.getUTCDay() === 0 ? 7 : heureGabon.getUTCDay();

  // Chercher les tarifs applicables
  let query = supabase
    .from("tarifs_horaires")
    .select("*")
    .eq("etablissement_id", etablissementId)
    .eq("actif", true)
    .contains("jours_semaine", [jourSemaine])
    .lte("heure_debut", heureStr)
    .gte("heure_fin", heureStr)
    .order("priorite", { ascending: false })
    .limit(1);

  // Filtrer par catégorie si spécifié, sinon chercher les tarifs globaux (categorie_id IS NULL)
  if (categorieId) {
    // Chercher d'abord un tarif spécifique à la catégorie
    const { data: tarifCategorie } = await supabase
      .from("tarifs_horaires")
      .select("*")
      .eq("etablissement_id", etablissementId)
      .eq("actif", true)
      .eq("categorie_id", categorieId)
      .contains("jours_semaine", [jourSemaine])
      .lte("heure_debut", heureStr)
      .gte("heure_fin", heureStr)
      .order("priorite", { ascending: false })
      .limit(1);

    if (tarifCategorie && tarifCategorie.length > 0) {
      const tarif = tarifCategorie[0];
      return {
        prixAjuste: appliquerAjustement(prixBase, tarif.type_ajustement, tarif.valeur_ajustement),
        tarifApplique: tarif.nom,
      };
    }

    // Sinon, chercher un tarif global
    query = query.is("categorie_id", null);
  } else {
    query = query.is("categorie_id", null);
  }

  const { data: tarifs } = await query;

  if (!tarifs || tarifs.length === 0) {
    return { prixAjuste: prixBase, tarifApplique: null };
  }

  const tarif = tarifs[0];
  return {
    prixAjuste: appliquerAjustement(prixBase, tarif.type_ajustement, tarif.valeur_ajustement),
    tarifApplique: tarif.nom,
  };
}

/**
 * Applique un ajustement de prix (pourcentage ou montant fixe).
 * Le résultat est arrondi et ne peut pas être négatif.
 */
function appliquerAjustement(
  prixBase: number,
  typeAjustement: string,
  valeur: number
): number {
  let prixAjuste: number;

  if (typeAjustement === "pourcentage") {
    prixAjuste = Math.round(prixBase * (1 + valeur / 100));
  } else {
    prixAjuste = prixBase + valeur;
  }

  // Le prix ne peut pas être négatif
  return Math.max(0, Math.round(prixAjuste));
}
