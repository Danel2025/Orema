/**
 * Types pour le layer de base de données Supabase
 * Réexporte les types de supabase.ts avec des alias plus pratiques
 */

import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

// Re-export des types de base
export type { Database, Tables, TablesInsert, TablesUpdate, Enums };

// Types de tables avec alias courts
export type Etablissement = Tables<"etablissements">;
export type EtablissementInsert = TablesInsert<"etablissements">;
export type EtablissementUpdate = TablesUpdate<"etablissements">;

export type Utilisateur = Tables<"utilisateurs">;
export type UtilisateurInsert = TablesInsert<"utilisateurs">;
export type UtilisateurUpdate = TablesUpdate<"utilisateurs">;

export type Categorie = Tables<"categories">;
export type CategorieInsert = TablesInsert<"categories">;
export type CategorieUpdate = TablesUpdate<"categories">;

export type Produit = Tables<"produits">;
export type ProduitInsert = TablesInsert<"produits">;
export type ProduitUpdate = TablesUpdate<"produits">;

export type SupplementProduit = Tables<"supplements_produits">;
export type SupplementProduitInsert = TablesInsert<"supplements_produits">;
export type SupplementProduitUpdate = TablesUpdate<"supplements_produits">;

export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;

export type Zone = Tables<"zones">;
export type ZoneInsert = TablesInsert<"zones">;
export type ZoneUpdate = TablesUpdate<"zones">;

export type Table = Tables<"tables">;
export type TableInsert = TablesInsert<"tables">;
export type TableUpdate = TablesUpdate<"tables">;

export type Vente = Tables<"ventes">;
export type VenteInsert = TablesInsert<"ventes">;
export type VenteUpdate = TablesUpdate<"ventes">;

export type LigneVente = Tables<"lignes_vente">;
export type LigneVenteInsert = TablesInsert<"lignes_vente">;
export type LigneVenteUpdate = TablesUpdate<"lignes_vente">;

export type LigneVenteSupplement = Tables<"lignes_vente_supplements">;
export type LigneVenteSupplementInsert = TablesInsert<"lignes_vente_supplements">;
export type LigneVenteSupplementUpdate = TablesUpdate<"lignes_vente_supplements">;

export type Paiement = Tables<"paiements">;
export type PaiementInsert = TablesInsert<"paiements">;
export type PaiementUpdate = TablesUpdate<"paiements">;

export type SessionCaisse = Tables<"sessions_caisse">;
export type SessionCaisseInsert = TablesInsert<"sessions_caisse">;
export type SessionCaisseUpdate = TablesUpdate<"sessions_caisse">;

export type Imprimante = Tables<"imprimantes">;
export type ImprimanteInsert = TablesInsert<"imprimantes">;
export type ImprimanteUpdate = TablesUpdate<"imprimantes">;

export type MouvementStock = Tables<"mouvements_stock">;
export type MouvementStockInsert = TablesInsert<"mouvements_stock">;
export type MouvementStockUpdate = TablesUpdate<"mouvements_stock">;

export type AuditLog = Tables<"audit_logs">;
export type AuditLogInsert = TablesInsert<"audit_logs">;
export type AuditLogUpdate = TablesUpdate<"audit_logs">;

export type Session = Tables<"sessions">;
export type SessionInsert = TablesInsert<"sessions">;
export type SessionUpdate = TablesUpdate<"sessions">;

// Types d'enums réexportés
export type Role = Enums<"Role">;
export type TypeVente = Enums<"TypeVente">;
export type StatutVente = Enums<"StatutVente">;
export type StatutTable = Enums<"StatutTable">;
export type ModePaiement = Enums<"ModePaiement">;
export type TypeMouvement = Enums<"TypeMouvement">;
export type TypeImprimante = Enums<"TypeImprimante">;
export type TypeConnexion = Enums<"TypeConnexion">;
export type FormeTable = Enums<"FormeTable">;
export type StatutPreparation = Enums<"StatutPreparation">;
export type TypeRemise = Enums<"TypeRemise">;
export type TauxTva = Enums<"TauxTva">;
export type ActionAudit = Enums<"ActionAudit">;

// Constantes d'enums pour utilisation dans le code
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CAISSIER: "CAISSIER",
  SERVEUR: "SERVEUR",
} as const;

export const TYPE_VENTE = {
  DIRECT: "DIRECT",
  TABLE: "TABLE",
  LIVRAISON: "LIVRAISON",
  EMPORTER: "EMPORTER",
} as const;

export const STATUT_VENTE = {
  EN_COURS: "EN_COURS",
  PAYEE: "PAYEE",
  ANNULEE: "ANNULEE",
} as const;

export const MODE_PAIEMENT = {
  ESPECES: "ESPECES",
  CARTE_BANCAIRE: "CARTE_BANCAIRE",
  AIRTEL_MONEY: "AIRTEL_MONEY",
  MOOV_MONEY: "MOOV_MONEY",
  CHEQUE: "CHEQUE",
  VIREMENT: "VIREMENT",
  COMPTE_CLIENT: "COMPTE_CLIENT",
  MIXTE: "MIXTE",
} as const;

export const TYPE_MOUVEMENT = {
  ENTREE: "ENTREE",
  SORTIE: "SORTIE",
  AJUSTEMENT: "AJUSTEMENT",
  PERTE: "PERTE",
  INVENTAIRE: "INVENTAIRE",
} as const;

export const STATUT_TABLE = {
  LIBRE: "LIBRE",
  OCCUPEE: "OCCUPEE",
  EN_PREPARATION: "EN_PREPARATION",
  ADDITION: "ADDITION",
  A_NETTOYER: "A_NETTOYER",
} as const;

export const STATUT_PREPARATION = {
  EN_ATTENTE: "EN_ATTENTE",
  EN_PREPARATION: "EN_PREPARATION",
  PRETE: "PRETE",
  SERVIE: "SERVIE",
} as const;

export const TAUX_TVA = {
  STANDARD: "STANDARD",
  REDUIT: "REDUIT",
  EXONERE: "EXONERE",
} as const;

export const TAUX_TVA_VALUES = {
  STANDARD: 18,
  REDUIT: 10,
  EXONERE: 0,
} as const;

export const TYPE_IMPRIMANTE = {
  TICKET: "TICKET",
  CUISINE: "CUISINE",
  BAR: "BAR",
} as const;

export const TYPE_CONNEXION = {
  USB: "USB",
  RESEAU: "RESEAU",
  SERIE: "SERIE",
  BLUETOOTH: "BLUETOOTH",
  SYSTEME: "SYSTEME",
} as const;

export const FORME_TABLE = {
  RONDE: "RONDE",
  CARREE: "CARREE",
  RECTANGULAIRE: "RECTANGULAIRE",
} as const;

export const TYPE_REMISE = {
  POURCENTAGE: "POURCENTAGE",
  MONTANT_FIXE: "MONTANT_FIXE",
} as const;

export const ACTION_AUDIT = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  CAISSE_OUVERTURE: "CAISSE_OUVERTURE",
  CAISSE_CLOTURE: "CAISSE_CLOTURE",
  ANNULATION_VENTE: "ANNULATION_VENTE",
  REMISE_APPLIQUEE: "REMISE_APPLIQUEE",
} as const;

// Types utilitaires pour les requêtes
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface SortOptions {
  column: string;
  ascending?: boolean;
}

export interface QueryOptions extends PaginationOptions {
  sort?: SortOptions;
}

// Type pour les résultats paginés
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Type pour les produits avec relations
export interface ProduitWithRelations extends Produit {
  categorie?: Categorie;
  supplements_produits?: SupplementProduit[];
}

// Type pour les ventes avec relations
export interface VenteWithRelations extends Vente {
  lignes_vente?: (LigneVente & {
    produit?: Produit;
    lignes_vente_supplements?: LigneVenteSupplement[];
  })[];
  paiements?: Paiement[];
  client?: Client;
  table?: Table;
  utilisateur?: Utilisateur;
}

// Type pour les catégories avec relations
export interface CategorieWithRelations extends Categorie {
  produits?: Produit[];
  imprimante?: Imprimante;
}

// Type pour les tables avec relations
export interface TableWithRelations extends Table {
  zone?: Zone;
  ventes?: Vente[];
}
