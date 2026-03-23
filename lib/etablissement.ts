/**
 * Utilitaire pour récupérer l'établissement actuel
 *
 * IMPORTANT: Ces fonctions récupèrent l'établissement de l'utilisateur connecté.
 * L'authentification est obligatoire - si l'utilisateur n'est pas connecté, une erreur est levée.
 */

import { createServiceClient } from "./supabase/server";
import { requireAuth } from "./auth/supabase";

/**
 * Type de l'établissement avec champs en camelCase pour l'application
 */
export interface Etablissement {
  id: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  nif: string | null;
  rccm: string | null;
  logo: string | null;
  messageTicket: string | null;
  devisePar: string;
  dernierNumeroTicket: number;
  dateNumeroTicket: string;
  // Fiscalité
  tauxTvaStandard: number;
  tauxTvaReduit: number;
  afficherTvaSurTicket: boolean;
  // Caisse & Ventes
  modeVenteDefaut: string;
  confirmationVente: boolean;
  montantMinimumVente: number;
  remiseMaxAutorisee: number;
  impressionAutoTicket: boolean;
  modesPaiementActifs: string[];
  // Stocks
  seuilAlerteStockBas: number;
  seuilCritiqueStock: number;
  alerteStockEmail: boolean;
  emailAlerteStock: string | null;
  methodeValuationStock: string;
  // Fidélité
  fideliteActif: boolean;
  tauxPointsFidelite: number;
  valeurPointFidelite: number;
  creditClientActif: boolean;
  limiteCreditDefaut: number;
  dureeValiditeSolde: number;
  // Sécurité
  longueurPinMinimum: number;
  tentativesLoginMax: number;
  dureeBlocage: number;
  sessionTimeout: number;
  auditActif: boolean;
  actionsALogger: string[];
  // Plan de salle
  couleurTableLibre: string;
  couleurTableOccupee: string;
  couleurTablePrepa: string;
  couleurTableAddition: string;
  couleurTableNettoyer: string;
  affichageTable: string;
  grilleActivee: boolean;
  tailleGrille: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Récupère l'ID de l'établissement de l'utilisateur connecté
 * @throws Error si l'utilisateur n'est pas connecté ou n'a pas d'établissement
 */
export async function getEtablissementId(): Promise<string> {
  const session = await requireAuth();
  if (!session.etablissementId) {
    throw new Error("Aucun établissement associé à cet utilisateur");
  }
  return session.etablissementId;
}

/**
 * Récupère l'établissement complet de l'utilisateur connecté
 * avec mapping snake_case → camelCase
 * @throws Error si l'utilisateur n'est pas connecté ou si l'établissement n'existe pas
 */
export async function getEtablissement(): Promise<Etablissement> {
  const session = await requireAuth();

  if (!session.etablissementId) {
    throw new Error("Aucun établissement associé à cet utilisateur");
  }

  const supabase = createServiceClient();

  const { data: e, error } = await supabase
    .from("etablissements")
    .select("*")
    .eq("id", session.etablissementId)
    .single();

  if (error || !e) {
    throw new Error("Établissement non trouvé. Contactez votre administrateur.");
  }

  return {
    id: e.id,
    nom: e.nom,
    adresse: e.adresse,
    telephone: e.telephone,
    email: e.email,
    nif: e.nif,
    rccm: e.rccm,
    logo: e.logo,
    messageTicket: e.message_ticket,
    devisePar: e.devise_par,
    dernierNumeroTicket: e.dernier_numero_ticket,
    dateNumeroTicket: e.date_numero_ticket,
    // Fiscalité
    tauxTvaStandard: e.taux_tva_standard,
    tauxTvaReduit: e.taux_tva_reduit,
    afficherTvaSurTicket: e.afficher_tva_sur_ticket,
    // Caisse & Ventes
    modeVenteDefaut: e.mode_vente_defaut,
    confirmationVente: e.confirmation_vente,
    montantMinimumVente: e.montant_minimum_vente,
    remiseMaxAutorisee: e.remise_max_autorisee,
    impressionAutoTicket: e.impression_auto_ticket,
    modesPaiementActifs: e.modes_paiement_actifs ?? [],
    // Stocks
    seuilAlerteStockBas: e.seuil_alerte_stock_bas,
    seuilCritiqueStock: e.seuil_critique_stock,
    alerteStockEmail: e.alerte_stock_email,
    emailAlerteStock: e.email_alerte_stock,
    methodeValuationStock: e.methode_valuation_stock,
    // Fidélité
    fideliteActif: e.fidelite_actif,
    tauxPointsFidelite: e.taux_points_fidelite,
    valeurPointFidelite: e.valeur_point_fidelite,
    creditClientActif: e.credit_client_actif,
    limiteCreditDefaut: e.limite_credit_defaut,
    dureeValiditeSolde: e.duree_validite_solde,
    // Sécurité
    longueurPinMinimum: e.longueur_pin_minimum,
    tentativesLoginMax: e.tentatives_login_max,
    dureeBlocage: e.duree_blocage,
    sessionTimeout: e.session_timeout,
    auditActif: e.audit_actif,
    actionsALogger: e.actions_a_logger ?? [],
    // Plan de salle
    couleurTableLibre: e.couleur_table_libre,
    couleurTableOccupee: e.couleur_table_occupee,
    couleurTablePrepa: e.couleur_table_prepa,
    couleurTableAddition: e.couleur_table_addition,
    couleurTableNettoyer: e.couleur_table_nettoyer,
    affichageTable: e.affichage_table,
    grilleActivee: e.grille_activee,
    tailleGrille: e.taille_grille,
    // Timestamps
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}
