/**
 * Types pour la couche offline IndexedDB
 * Miroir simplifie des types Supabase pour le stockage local
 */

import type { DBSchema } from 'idb'
import type {
  StatutVente,
  TypeVente,
  StatutTable,
  FormeTable,
  StatutPreparation,
  TauxTva,
  ModePaiement,
  TypeRemise,
} from '@/lib/db/types'

// ============================================================================
// Entites offline (miroir simplifie des types Supabase)
// ============================================================================

export interface OfflineProduit {
  id: string
  nom: string
  description: string | null
  prix_vente: number
  prix_achat: number | null
  categorie_id: string
  etablissement_id: string
  taux_tva: TauxTva
  actif: boolean
  gerer_stock: boolean
  stock_actuel: number | null
  stock_min: number | null
  stock_max: number | null
  unite: string | null
  code_barre: string | null
  image: string | null
  disponible_direct: boolean
  disponible_table: boolean
  disponible_livraison: boolean
  disponible_emporter: boolean
  created_at: string
  updated_at: string
}

export interface OfflineCategorie {
  id: string
  nom: string
  couleur: string
  icone: string | null
  ordre: number
  actif: boolean
  etablissement_id: string
  imprimante_id: string | null
  created_at: string
  updated_at: string
}

export interface OfflineVente {
  id: string
  numero_ticket: string
  type: TypeVente
  statut: StatutVente
  sous_total: number
  total_tva: number
  total_remise: number
  total_final: number
  type_remise: TypeRemise | null
  valeur_remise: number | null
  frais_livraison: number | null
  adresse_livraison: string | null
  notes: string | null
  utilisateur_id: string
  etablissement_id: string
  session_caisse_id: string | null
  client_id: string | null
  table_id: string | null
  created_at: string
  updated_at: string
}

export interface OfflineLigneVente {
  id: string
  vente_id: string
  produit_id: string
  quantite: number
  prix_unitaire: number
  taux_tva: number
  montant_tva: number
  sous_total: number
  total: number
  notes: string | null
  statut_preparation: StatutPreparation
  created_at: string
  updated_at: string
}

export interface OfflineClient {
  id: string
  nom: string
  prenom: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  actif: boolean
  credit_autorise: boolean
  limit_credit: number | null
  solde_credit: number
  solde_prepaye: number
  points_fidelite: number
  etablissement_id: string
  created_at: string
  updated_at: string
}

export interface OfflineTable {
  id: string
  numero: string
  capacite: number
  forme: FormeTable
  statut: StatutTable
  position_x: number | null
  position_y: number | null
  largeur: number | null
  hauteur: number | null
  active: boolean
  zone_id: string | null
  etablissement_id: string
  created_at: string
  updated_at: string
}

export interface OfflineSessionCaisse {
  id: string
  date_ouverture: string
  date_cloture: string | null
  fond_caisse: number
  total_ventes: number
  total_especes: number
  total_cartes: number
  total_mobile_money: number
  total_autres: number
  nombre_ventes: number
  nombre_annulations: number
  especes_comptees: number | null
  ecart: number | null
  notes_cloture: string | null
  utilisateur_id: string
  etablissement_id: string
  created_at: string
  updated_at: string
}

export interface OfflinePaiement {
  id: string
  vente_id: string
  mode_paiement: ModePaiement
  montant: number
  montant_recu: number | null
  monnaie_rendue: number | null
  reference: string | null
  created_at: string
}

// ============================================================================
// Metadonnees de synchronisation
// ============================================================================

export interface SyncMetadata {
  storeName: string
  lastSynced: number
  dirty: boolean
  conflicted: boolean
  version: number
}

// ============================================================================
// File de mutations offline
// ============================================================================

export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE'
export type MutationStatus = 'pending' | 'syncing' | 'failed' | 'completed'

export interface MutationEntry {
  id: string
  type: MutationType
  entity: string
  entityId: string
  data: unknown
  timestamp: number
  retryCount: number
  status: MutationStatus
}

// ============================================================================
// Schema IndexedDB type pour idb
// ============================================================================

export interface OfflineDBSchema extends DBSchema {
  produits: {
    key: string
    value: OfflineProduit
    indexes: {
      'by-categorie': string
      'by-nom': string
      'by-etablissement': string
    }
  }
  categories: {
    key: string
    value: OfflineCategorie
    indexes: {
      'by-etablissement': string
      'by-ordre': number
    }
  }
  ventes: {
    key: string
    value: OfflineVente
    indexes: {
      'by-date': string
      'by-statut': StatutVente
      'by-etablissement': string
      'by-session': string
    }
  }
  lignesVente: {
    key: string
    value: OfflineLigneVente
    indexes: {
      'by-vente': string
      'by-produit': string
    }
  }
  clients: {
    key: string
    value: OfflineClient
    indexes: {
      'by-telephone': string
      'by-nom': string
      'by-etablissement': string
    }
  }
  tables: {
    key: string
    value: OfflineTable
    indexes: {
      'by-zone': string
      'by-statut': StatutTable
      'by-etablissement': string
    }
  }
  sessionsCaisse: {
    key: string
    value: OfflineSessionCaisse
    indexes: {
      'by-utilisateur': string
      'by-etablissement': string
    }
  }
  paiements: {
    key: string
    value: OfflinePaiement
    indexes: {
      'by-vente': string
    }
  }
  mutationQueue: {
    key: string
    value: MutationEntry
    indexes: {
      'by-status': MutationStatus
      'by-entity': string
      'by-timestamp': number
    }
  }
  syncMetadata: {
    key: string
    value: SyncMetadata
  }
}

// ============================================================================
// Types utilitaires
// ============================================================================

/** Union des noms de stores (string literals explicites) */
export type OfflineStoreName =
  | 'produits'
  | 'categories'
  | 'ventes'
  | 'lignesVente'
  | 'clients'
  | 'tables'
  | 'sessionsCaisse'
  | 'paiements'
  | 'mutationQueue'
  | 'syncMetadata'

/** Map des noms de stores vers leurs types de valeurs */
export type StoreValueType<T extends OfflineStoreName> =
  OfflineDBSchema[T]['value']
