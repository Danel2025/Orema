/**
 * Module de suivi de livraison
 *
 * Exporte les types et constantes pour le suivi de livraison.
 * Les Server Actions sont dans actions/livraison.ts.
 *
 * @example
 * ```ts
 * import { STATUT_LIVRAISON, type Livraison } from '@/lib/delivery'
 * ```
 */

export {
  // Enums et constantes
  STATUT_LIVRAISON,
  STATUTS_ACTIFS,
  STATUTS_TERMINES,
  TRANSITIONS_AUTORISEES,
  STATUT_LIVRAISON_LABELS,
  STATUT_LIVRAISON_COLORS,

  // Types
  type StatutLivraison,
  type Livraison,
  type HistoriqueLivraison,
  type LivraisonAvecHistorique,
  type StatistiquesLivraison,
  type ActionResult,
} from './types';
