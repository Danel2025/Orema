/**
 * Types pour la page de detail d'un etablissement
 */

/**
 * Donnees completes d'un etablissement pour la page de detail
 */
export interface EtablissementDetail {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  nif: string | null;
  rccm: string | null;
  logo: string | null;
  statut: string;
  motifSuspension: string | null;
  dateSuspension: string | null;
  plan: string;
  planAbonnement: string;
  messageTicket: string | null;
  tauxTvaStandard: number;
  tauxTvaReduit: number;
  modeVenteDefaut: string;
  modesPaiementActifs: string[];
  createdAt: string;
  updatedAt: string;
  nbUtilisateurs: number;
  nbProduits: number;
  nbVentes: number;
  nbClients: number;
  caTotal: number;
  dateExpirationAbonnement: string | null;
  quotas: {
    utilisateurs?: { used: number; max: number };
    produits?: { used: number; max: number };
    ventes?: { used: number; max: number };
  } | null;
}

/**
 * Stats detaillees d'un etablissement
 */
export interface EtablissementStats {
  caTotal: number;
  ventesTotal: number;
  panierMoyen: number;
  produitsActifs: number;
  caTrend?: { value: string; isPositive: boolean };
  ventesTrend?: { value: string; isPositive: boolean };
  evolutionCA: Array<{ date: string; montant: number }>;
  ventesParJour: Array<{ jour: string; nombre: number }>;
  topProduits: Array<{ nom: string; ca: number; quantite: number }>;
  heuresPointe: Array<{ heure: string; ventes: number }>;
}
