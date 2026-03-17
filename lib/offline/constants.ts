/**
 * Constantes pour la couche offline IndexedDB
 */

/** Nom de la base de donnees IndexedDB */
export const DB_NAME = 'orema-pos-offline' as const

/** Version du schema de la base de donnees */
export const DB_VERSION = 1 as const

/** Noms des object stores IndexedDB */
export const STORE_NAMES = {
  produits: 'produits',
  categories: 'categories',
  ventes: 'ventes',
  lignesVente: 'lignesVente',
  clients: 'clients',
  tables: 'tables',
  sessionsCaisse: 'sessionsCaisse',
  paiements: 'paiements',
  mutationQueue: 'mutationQueue',
  syncMetadata: 'syncMetadata',
} as const

/** Durees de cache par entite (en millisecondes) */
export const CACHE_TTL = {
  /** Produits: 5 minutes */
  produits: 5 * 60 * 1000,
  /** Categories: 30 minutes */
  categories: 30 * 60 * 1000,
  /** Tables: 1 minute (statuts changent souvent) */
  tables: 60 * 1000,
  /** Clients: 10 minutes */
  clients: 10 * 60 * 1000,
  /** Ventes: 2 minutes */
  ventes: 2 * 60 * 1000,
  /** Sessions caisse: 5 minutes */
  sessionsCaisse: 5 * 60 * 1000,
  /** Paiements: 2 minutes */
  paiements: 2 * 60 * 1000,
} as const

/** Nombre maximal de retries pour une mutation en echec */
export const MAX_MUTATION_RETRIES = 5 as const

/** Delai entre les retries (en ms) — backoff exponentiel applique */
export const BASE_RETRY_DELAY = 1000 as const
