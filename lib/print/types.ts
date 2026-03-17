/**
 * Types pour le module d'impression thermique ESC/POS
 * Oréma N+ - POS System
 */

export type TypeImprimante = "TICKET" | "CUISINE" | "BAR";
export type TypeConnexion = "USB" | "RESEAU" | "SERIE" | "BLUETOOTH" | "SYSTEME";

// Labels pour les types de vente
export const TYPE_VENTE_LABELS: Record<string, string> = {
  DIRECT: "Vente directe",
  TABLE: "Sur place",
  LIVRAISON: "Livraison",
  EMPORTER: "A emporter",
};

// Labels pour les modes de paiement
export const PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  CARTE: "Carte bancaire",
  AIRTEL_MONEY: "Airtel Money",
  MOOV_MONEY: "Moov Money",
  CHEQUE: "Chèque",
  VIREMENT: "Virement",
  COMPTE_CLIENT: "Compte client",
  MIXTE: "Mixte",
};

export interface PrinterConfig {
  id: string;
  nom: string;
  type: TypeImprimante;
  typeConnexion: TypeConnexion;
  adresseIP?: string | null;
  port?: number | null;
  pathUSB?: string | null;
  largeurPapier: number; // 58, 76, 80mm
  actif: boolean;
}

export interface EtablissementInfo {
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  nif?: string | null;
  rccm?: string | null;
  logo?: string | null;
}

export interface LigneTicket {
  nom: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  notes?: string | null;
  supplements?: { nom: string; prix: number }[];
}

export interface PaiementTicket {
  mode: string;
  montant: number;
  reference?: string | null;
}

export interface TicketData {
  numeroTicket: string;
  date: Date;
  caissier: string;
  typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  table?: string | null;
  client?: string | null;
  lignes: LigneTicket[];
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  paiements: PaiementTicket[];
  montantRecu?: number;
  montantRendu?: number;
  adresseLivraison?: string | null;
  fraisLivraison?: number;
  notes?: string | null;
}

export interface BonCuisineData {
  numeroTicket: string;
  date: Date;
  serveur: string;
  table?: string | null;
  typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  lignes: {
    nom: string;
    quantite: number;
    notes?: string | null;
    supplements?: string[];
  }[];
  notes?: string | null;
  priorite?: "NORMAL" | "URGENT";
}

export interface RapportZData {
  etablissement: EtablissementInfo;
  sessionId: string;
  dateOuverture: Date;
  dateCloture: Date | null;
  caissierNom: string;
  fondCaisse: number;
  especesComptees: number;
  especesAttendues: number;
  ecart: number;
  totalVentes: number;
  nombreVentes: number;
  nombreAnnulations: number;
  articlesVendus: number;
  panierMoyen: number;
  paiements: {
    especes: number;
    cartes: number;
    mobileMoney: number;
    autres: number;
  };
  tva: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
  };
  ventesParType: Record<string, { count: number; total: number }>;
  topProduits: { nom: string; quantite: number; total: number }[];
  notesCloture?: string | null;
}

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
  printerId?: string;
}

export interface PrintJob {
  id: string;
  imprimanteId: string;
  type: "TICKET" | "BON_CUISINE" | "BON_BAR" | "RAPPORT_Z";
  data: TicketData | BonCuisineData | RapportZData;
  createdAt: Date;
  status: "PENDING" | "PRINTING" | "SUCCESS" | "ERROR";
  error?: string;
}

// Structure pour les tickets clients (utilisée par generateTicketClient)
export interface TicketClientData {
  etablissement: EtablissementInfo & { messageTicket?: string | null };
  numeroTicket: string;
  dateVente: Date;
  typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  tableNumero?: string | null;
  tableZone?: string | null;
  clientNom?: string | null;
  caissierNom: string;
  lignes: {
    produitNom: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
    notes?: string | null;
    categorieId?: string;
    categorieNom?: string;
    supplements?: { nom: string; prix: number }[];
  }[];
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  remiseType?: "POURCENTAGE" | "MONTANT_FIXE" | null;
  remiseValeur?: number | null;
  paiements: {
    mode: string;
    montant: number;
    reference?: string | null;
    montantRecu?: number | null;
    monnaieRendue?: number | null;
  }[];
  montantRecu?: number | null;
  monnaieRendue?: number | null;
  adresseLivraison?: string | null;
  fraisLivraison?: number;
  notes?: string | null;
}

// Structure pour les bons de préparation (cuisine/bar)
export interface BonPreparationData {
  numeroCommande: string;
  dateCommande: Date;
  typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  tableNumero?: string | null;
  tableZone?: string | null;
  clientNom?: string | null;
  serveurNom: string;
  lignes: PrintLineItem[];
  notes?: string | null;
  urgent?: boolean;
}

// Type pour les jobs d'impression
export type PrintJobType = PrintJob["type"];

// Ligne produit pour le routage d'impression
export interface PrintLineItem {
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  notes?: string | null;
  categorieId?: string;
  categorieNom?: string;
  supplements?: { nom: string; prix: number }[];
}

// Structure pour l'addition (pré-note avant paiement)
export interface AdditionData {
  etablissement: EtablissementInfo & { messageTicket?: string | null };
  dateAddition: Date;
  typeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  tableNumero?: string | null;
  tableZone?: string | null;
  clientNom?: string | null;
  serveurNom: string;
  lignes: {
    produitNom: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
    notes?: string | null;
    supplements?: { nom: string; prix: number }[];
    remiseLigne?: { type: "POURCENTAGE" | "MONTANT_FIXE"; valeur: number } | null;
    montantRemiseLigne?: number | null;
  }[];
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  remiseType?: "POURCENTAGE" | "MONTANT_FIXE" | null;
  remiseValeur?: number | null;
  couverts?: number;
  adresseLivraison?: string | null;
  telephoneLivraison?: string | null;
}
