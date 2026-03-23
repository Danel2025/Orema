/**
 * Types pour le module de suivi de livraison
 *
 * Les données sont stockées dans les tables `livraisons` et `historique_livraison`.
 */

// ============================================================================
// ENUMS
// ============================================================================

export const STATUT_LIVRAISON = {
  EN_PREPARATION: "EN_PREPARATION",
  PRETE: "PRETE",
  EN_COURS: "EN_COURS",
  LIVREE: "LIVREE",
  ECHOUEE: "ECHOUEE",
  ANNULEE: "ANNULEE",
} as const;

export type StatutLivraison = (typeof STATUT_LIVRAISON)[keyof typeof STATUT_LIVRAISON];

/**
 * Statuts considérés comme "actifs" (livraison pas encore terminée)
 */
export const STATUTS_ACTIFS: StatutLivraison[] = [
  STATUT_LIVRAISON.EN_PREPARATION,
  STATUT_LIVRAISON.PRETE,
  STATUT_LIVRAISON.EN_COURS,
];

/**
 * Statuts considérés comme "terminés"
 */
export const STATUTS_TERMINES: StatutLivraison[] = [
  STATUT_LIVRAISON.LIVREE,
  STATUT_LIVRAISON.ECHOUEE,
  STATUT_LIVRAISON.ANNULEE,
];

/**
 * Transitions de statut autorisées
 */
export const TRANSITIONS_AUTORISEES: Record<StatutLivraison, StatutLivraison[]> = {
  EN_PREPARATION: ["PRETE", "ANNULEE"],
  PRETE: ["EN_COURS", "ANNULEE"],
  EN_COURS: ["LIVREE", "ECHOUEE"],
  LIVREE: [],
  ECHOUEE: ["EN_COURS"], // Possibilité de retenter
  ANNULEE: [],
};

// ============================================================================
// TYPES PRINCIPAUX
// ============================================================================

/**
 * Représente une livraison associée à une vente
 */
export interface Livraison {
  id: string;
  venteId: string;
  numeroTicket: string;
  statut: StatutLivraison;
  adresse: string;
  telephone: string;
  clientNom?: string | null;
  livreurId?: string | null;
  livreurNom?: string | null;
  estimationMinutes?: number | null;
  notes?: string | null;
  montantTotal: number;
  fraisLivraison: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entrée dans l'historique d'une livraison
 */
export interface HistoriqueLivraison {
  id: string;
  livraisonId: string;
  ancienStatut: StatutLivraison | null;
  nouveauStatut: StatutLivraison;
  timestamp: string;
  note?: string | null;
  acteurId?: string | null;
  acteurNom?: string | null;
}

/**
 * Livraison avec son historique complet
 */
export interface LivraisonAvecHistorique extends Livraison {
  historique: HistoriqueLivraison[];
}

/**
 * Statistiques de livraison pour une période
 */
export interface StatistiquesLivraison {
  total: number;
  enCours: number;
  livrees: number;
  echouees: number;
  annulees: number;
  tempsLivraisonMoyen: number; // en minutes
  fraisLivraisonTotal: number;
}

// ============================================================================
// TYPES POUR LES RÉSULTATS D'ACTIONS
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Labels lisibles pour chaque statut de livraison
 */
export const STATUT_LIVRAISON_LABELS: Record<StatutLivraison, string> = {
  EN_PREPARATION: "En préparation",
  PRETE: "Prête",
  EN_COURS: "En cours de livraison",
  LIVREE: "Livrée",
  ECHOUEE: "Échouée",
  ANNULEE: "Annulée",
};

/**
 * Couleurs pour chaque statut (compatibles Radix UI Themes)
 */
export const STATUT_LIVRAISON_COLORS: Record<StatutLivraison, string> = {
  EN_PREPARATION: "orange",
  PRETE: "blue",
  EN_COURS: "violet",
  LIVREE: "green",
  ECHOUEE: "red",
  ANNULEE: "gray",
};
