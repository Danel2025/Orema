/**
 * Module de base de données Supabase
 *
 * Ce module remplace Prisma et fournit toutes les fonctions nécessaires
 * pour interagir avec la base de données Supabase.
 *
 * @example
 * ```ts
 * import { db, createClient } from '@/lib/db'
 *
 * // Dans un Server Action
 * const supabase = await createClient()
 * const categories = await db.getCategories(supabase, etablissementId)
 * ```
 */

// Re-export des clients
// Import des requêtes pour l'objet db
import * as queries from './queries'

export { createClient, createServiceClient, getServerClient, getServiceClient, createAuthenticatedClient } from './client'
export type { DbClient, RlsContext } from './client'

// Re-export des types
export * from './types'

// Re-export des utilitaires
export * from './utils'

/**
 * Objet db contenant toutes les requêtes de base de données
 * Utilisé comme remplacement de l'objet prisma
 */
export const db = {
  // Audit
  getAuditLogs: queries.getAuditLogs,
  getAuditLogsPaginated: queries.getAuditLogsPaginated,
  createAuditLog: queries.createAuditLog,
  logAuditAction: queries.logAuditAction,
  logLogin: queries.logLogin,
  logLogout: queries.logLogout,
  logCaisseOuverture: queries.logCaisseOuverture,
  logCaisseCloture: queries.logCaisseCloture,
  logAnnulationVente: queries.logAnnulationVente,
  logRemiseAppliquee: queries.logRemiseAppliquee,
  countAuditLogsByAction: queries.countAuditLogsByAction,

  // Catégories
  getCategories: queries.getCategories,
  getCategoriesPaginated: queries.getCategoriesPaginated,
  getCategorieById: queries.getCategorieById,
  createCategorie: queries.createCategorie,
  updateCategorie: queries.updateCategorie,
  deleteCategorie: queries.deleteCategorie,
  updateCategoriesOrder: queries.updateCategoriesOrder,
  countCategories: queries.countCategories,

  // Clients
  getClients: queries.getClients,
  getClientsPaginated: queries.getClientsPaginated,
  getClientById: queries.getClientById,
  getClientByTelephone: queries.getClientByTelephone,
  createClient: queries.createClient,
  updateClient: queries.updateClient,
  deleteClient: queries.deleteClient,
  updateClientPoints: queries.updateClientPoints,
  updateClientSoldePrepaye: queries.updateClientSoldePrepaye,
  updateClientSoldeCredit: queries.updateClientSoldeCredit,
  countClients: queries.countClients,

  // Employés
  getEmployes: queries.getEmployes,
  getEmployesPaginated: queries.getEmployesPaginated,
  getEmployeById: queries.getEmployeById,
  getEmployeByEmail: queries.getEmployeByEmail,
  getEmployeByEmailForAuth: queries.getEmployeByEmailForAuth,
  getEmployeByPin: queries.getEmployeByPin,
  createEmploye: queries.createEmploye,
  updateEmploye: queries.updateEmploye,
  updateEmployePassword: queries.updateEmployePassword,
  updateEmployePin: queries.updateEmployePin,
  deleteEmploye: queries.deleteEmploye,
  emailExists: queries.emailExists,
  pinExists: queries.pinExists,
  countEmployes: queries.countEmployes,

  // Établissements
  getEtablissementById: queries.getEtablissementById,
  createEtablissement: queries.createEtablissement,
  updateEtablissement: queries.updateEtablissement,
  getNextTicketNumber: queries.getNextTicketNumber,
  updateTauxTva: queries.updateTauxTva,
  updateInfosLegales: queries.updateInfosLegales,
  updateLogo: queries.updateLogo,
  getEtablissementSettings: queries.getEtablissementSettings,

  // Imprimantes
  getImprimantes: queries.getImprimantes,
  getImprimanteById: queries.getImprimanteById,
  getImprimanteTicket: queries.getImprimanteTicket,
  getImprimantesCuisine: queries.getImprimantesCuisine,
  getImprimantesBar: queries.getImprimantesBar,
  createImprimante: queries.createImprimante,
  updateImprimante: queries.updateImprimante,
  deleteImprimante: queries.deleteImprimante,
  toggleImprimante: queries.toggleImprimante,
  imprimanteNomExists: queries.imprimanteNomExists,
  countImprimantesByType: queries.countImprimantesByType,

  // Produits
  getProduits: queries.getProduits,
  getProduitsPaginated: queries.getProduitsPaginated,
  getProduitById: queries.getProduitById,
  getProduitByCodeBarre: queries.getProduitByCodeBarre,
  createProduit: queries.createProduit,
  updateProduit: queries.updateProduit,
  deleteProduit: queries.deleteProduit,
  updateProduitStock: queries.updateProduitStock,
  getSupplementsProduit: queries.getSupplementsProduit,
  createSupplementProduit: queries.createSupplementProduit,
  deleteSupplementProduit: queries.deleteSupplementProduit,
  countProduits: queries.countProduits,
  getProduitsRuptureStock: queries.getProduitsRuptureStock,

  // Rapports et sessions caisse
  getSessionCaisseEnCours: queries.getSessionCaisseEnCours,
  getSessionCaisseById: queries.getSessionCaisseById,
  createSessionCaisse: queries.createSessionCaisse,
  closeSessionCaisse: queries.closeSessionCaisse,
  getSessionsCaisse: queries.getSessionsCaisse,
  getVentesStats: queries.getVentesStats,
  getVentesStatsDuJour: queries.getVentesStatsDuJour,
  getVentesStatsDuMois: queries.getVentesStatsDuMois,
  getPaiementsStatsByMode: queries.getPaiementsStatsByMode,
  getTopProduits: queries.getTopProduits,
  genererRapportZ: queries.genererRapportZ,

  // Stocks
  getMouvementsStock: queries.getMouvementsStock,
  getMouvementsStockPaginated: queries.getMouvementsStockPaginated,
  createMouvementStock: queries.createMouvementStock,
  enregistrerEntreeStock: queries.enregistrerEntreeStock,
  enregistrerSortieStock: queries.enregistrerSortieStock,
  enregistrerAjustementStock: queries.enregistrerAjustementStock,
  enregistrerPerteStock: queries.enregistrerPerteStock,
  enregistrerInventaire: queries.enregistrerInventaire,
  getTotalEntrees: queries.getTotalEntrees,
  getTotalSorties: queries.getTotalSorties,

  // Tables et zones
  getZones: queries.getZones,
  getZoneById: queries.getZoneById,
  createZone: queries.createZone,
  updateZone: queries.updateZone,
  deleteZone: queries.deleteZone,
  countZones: queries.countZones,
  zoneNomExists: queries.zoneNomExists,
  updateZonesOrder: queries.updateZonesOrder,
  getZonesWithTableCount: queries.getZonesWithTableCount,
  getLastZone: queries.getLastZone,
  getTables: queries.getTables,
  getTableById: queries.getTableById,
  getTableByNumero: queries.getTableByNumero,
  createTable: queries.createTable,
  updateTable: queries.updateTable,
  updateTableStatut: queries.updateTableStatut,
  updateTablePosition: queries.updateTablePosition,
  updateTablesPositions: queries.updateTablesPositions,
  deleteTable: queries.deleteTable,
  countTables: queries.countTables,
  countTablesByStatut: queries.countTablesByStatut,
  getTablesLibres: queries.getTablesLibres,
  tableNumeroExists: queries.tableNumeroExists,

  // Ventes
  getVentes: queries.getVentes,
  getVentesPaginated: queries.getVentesPaginated,
  getVenteById: queries.getVenteById,
  getVenteByNumeroTicket: queries.getVenteByNumeroTicket,
  getVenteEnCoursTable: queries.getVenteEnCoursTable,
  createVente: queries.createVente,
  updateVente: queries.updateVente,
  annulerVente: queries.annulerVente,
  marquerVentePayee: queries.marquerVentePayee,
  createLigneVente: queries.createLigneVente,
  createLignesVente: queries.createLignesVente,
  updateLigneVenteStatut: queries.updateLigneVenteStatut,
  deleteLigneVente: queries.deleteLigneVente,
  createLigneVenteSupplement: queries.createLigneVenteSupplement,
  createPaiement: queries.createPaiement,
  createPaiements: queries.createPaiements,
  getPaiementsVente: queries.getPaiementsVente,
  countVentes: queries.countVentes,
  getTotalVentes: queries.getTotalVentes,
}

// Export default pour compatibilité
export default db
