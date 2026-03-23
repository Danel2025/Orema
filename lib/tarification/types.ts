/**
 * Types partagés pour le système de tarification
 */

export interface ValidationResult {
  valide: boolean;
  raison?: string;
  necessiteApprobation?: boolean;
}

export interface EnforcementContext {
  etablissementId: string;
  userId: string;
  role: string;
  remiseMaxPourcent: number;
  peutAppliquerRemise: boolean;
  peutModifierPrix: boolean;
  plafondRemiseTransaction: number;
  necessiteApprobationAuDela: number | null;
  protectionMargeActive: boolean;
  margeMinimumGlobale: number;
  approbationRemiseActive: boolean;
}

export interface TarifHoraireRow {
  id: string;
  nom: string;
  heure_debut: string;
  heure_fin: string;
  jours_semaine: number[];
  type_ajustement: "pourcentage" | "montant_fixe";
  valeur_ajustement: number;
  categorie_id: string | null;
  actif: boolean;
  priorite: number;
  etablissement_id: string;
  created_at: string;
  updated_at: string;
}

export interface RegleTarificationRow {
  id: string;
  role: string;
  remise_max_pourcent: number;
  peut_modifier_prix: boolean;
  peut_appliquer_remise: boolean;
  plafond_remise_transaction: number;
  necessite_approbation_au_dela: number | null;
  etablissement_id: string;
  created_at: string;
  updated_at: string;
}

export interface HistoriquePrixRow {
  id: string;
  produit_id: string;
  ancien_prix: number;
  nouveau_prix: number;
  raison: string | null;
  utilisateur_id: string;
  etablissement_id: string;
  created_at: string;
}

export interface ApprobationRemiseRow {
  id: string;
  demandeur_id: string;
  approbateur_id: string | null;
  montant_remise: number;
  pourcentage_remise: number;
  montant_vente: number;
  commentaire: string | null;
  commentaire_reponse: string | null;
  statut: "en_attente" | "approuvee" | "refusee";
  etablissement_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigTarificationRow {
  protection_marge_active: boolean;
  marge_minimum_globale: number;
  approbation_remise_active: boolean;
  tarifs_horaires_actifs: boolean;
}
