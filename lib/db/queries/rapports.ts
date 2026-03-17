/**
 * Requêtes Supabase pour les rapports et statistiques
 */

import type { DbClient } from '../client'
import type {
  SessionCaisse,
  SessionCaisseInsert,
  SessionCaisseUpdate,
  ModePaiement,
} from '../types'
import {
  getErrorMessage,
  serializePrices,
  PRICE_FIELDS,
  getDayBounds,
  getMonthBounds,
  parseDecimal,
} from '../utils'

const SESSION_PRICE_FIELDS = PRICE_FIELDS.sessions_caisse

// ================== SESSIONS CAISSE ==================

/**
 * Récupère la session de caisse en cours
 */
export async function getSessionCaisseEnCours(
  client: DbClient,
  etablissementId: string,
  utilisateurId?: string
): Promise<SessionCaisse | null> {
  let query = client
    .from('sessions_caisse')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .is('date_cloture', null)
    .order('date_ouverture', { ascending: false })
    .limit(1)

  if (utilisateurId) {
    query = query.eq('utilisateur_id', utilisateurId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  if (!data || data.length === 0) return null

  return serializePrices(data[0], [...SESSION_PRICE_FIELDS])
}

/**
 * Récupère une session de caisse par son ID
 */
export async function getSessionCaisseById(
  client: DbClient,
  id: string
): Promise<SessionCaisse | null> {
  const { data, error } = await client
    .from('sessions_caisse')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(getErrorMessage(error))
  }

  return serializePrices(data, [...SESSION_PRICE_FIELDS])
}

/**
 * Crée une session de caisse (ouverture)
 */
export async function createSessionCaisse(
  client: DbClient,
  data: SessionCaisseInsert
): Promise<SessionCaisse> {
  const { data: session, error } = await client
    .from('sessions_caisse')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return serializePrices(session, [...SESSION_PRICE_FIELDS])
}

/**
 * Clôture une session de caisse
 */
export async function closeSessionCaisse(
  client: DbClient,
  id: string,
  data: SessionCaisseUpdate
): Promise<SessionCaisse> {
  const { data: session, error } = await client
    .from('sessions_caisse')
    .update({
      ...data,
      date_cloture: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return serializePrices(session, [...SESSION_PRICE_FIELDS])
}

/**
 * Récupère les sessions de caisse d'un établissement
 */
export async function getSessionsCaisse(
  client: DbClient,
  etablissementId: string,
  options?: {
    utilisateurId?: string
    dateDebut?: string
    dateFin?: string
    closedOnly?: boolean
  }
): Promise<SessionCaisse[]> {
  let query = client
    .from('sessions_caisse')
    .select('*')
    .eq('etablissement_id', etablissementId)
    .order('date_ouverture', { ascending: false })

  if (options?.utilisateurId) {
    query = query.eq('utilisateur_id', options.utilisateurId)
  }

  if (options?.dateDebut) {
    query = query.gte('date_ouverture', options.dateDebut)
  }

  if (options?.dateFin) {
    query = query.lte('date_ouverture', options.dateFin)
  }

  if (options?.closedOnly) {
    query = query.not('date_cloture', 'is', null)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  return (data ?? []).map(row => serializePrices(row, [...SESSION_PRICE_FIELDS]))
}

// ================== STATISTIQUES VENTES ==================

interface VenteStats {
  totalVentes: number
  nombreVentes: number
  ticketMoyen: number
  totalTva: number
  totalRemises: number
}

/**
 * Calcule les statistiques de ventes sur une période
 */
export async function getVentesStats(
  client: DbClient,
  etablissementId: string,
  options?: {
    dateDebut?: string
    dateFin?: string
    utilisateurId?: string
  }
): Promise<VenteStats> {
  let query = client
    .from('ventes')
    .select('total_final, total_tva, total_remise')
    .eq('etablissement_id', etablissementId)
    .eq('statut', 'PAYEE')

  if (options?.dateDebut) {
    query = query.gte('created_at', options.dateDebut)
  }

  if (options?.dateFin) {
    query = query.lte('created_at', options.dateFin)
  }

  if (options?.utilisateurId) {
    query = query.eq('utilisateur_id', options.utilisateurId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  const ventes = data ?? []
  const totalVentes = ventes.reduce((sum, v) => sum + parseDecimal(v.total_final), 0)
  const totalTva = ventes.reduce((sum, v) => sum + parseDecimal(v.total_tva), 0)
  const totalRemises = ventes.reduce((sum, v) => sum + parseDecimal(v.total_remise), 0)
  const nombreVentes = ventes.length
  const ticketMoyen = nombreVentes > 0 ? Math.round(totalVentes / nombreVentes) : 0

  return {
    totalVentes,
    nombreVentes,
    ticketMoyen,
    totalTva,
    totalRemises,
  }
}

/**
 * Statistiques du jour
 */
export async function getVentesStatsDuJour(
  client: DbClient,
  etablissementId: string
): Promise<VenteStats> {
  const { start, end } = getDayBounds()
  return getVentesStats(client, etablissementId, {
    dateDebut: start,
    dateFin: end,
  })
}

/**
 * Statistiques du mois
 */
export async function getVentesStatsDuMois(
  client: DbClient,
  etablissementId: string
): Promise<VenteStats> {
  const { start, end } = getMonthBounds()
  return getVentesStats(client, etablissementId, {
    dateDebut: start,
    dateFin: end,
  })
}

// ================== STATISTIQUES PAR MODE DE PAIEMENT ==================

interface PaiementStats {
  mode: ModePaiement
  total: number
  count: number
}

/**
 * Statistiques des paiements par mode
 */
export async function getPaiementsStatsByMode(
  client: DbClient,
  etablissementId: string,
  options?: {
    dateDebut?: string
    dateFin?: string
  }
): Promise<PaiementStats[]> {
  const query = client
    .from('paiements')
    .select(`
      mode_paiement,
      montant,
      vente:ventes!inner(etablissement_id, statut)
    `)

  // Le filtre sur l'établissement est fait via la relation vente
  // On ne peut pas directement filtrer ici, donc on récupère tout et filtre après
  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  // Filtrer par établissement et statut payé
  const filteredData = (data ?? []).filter((p: any) => {
    const vente = p.vente
    if (!vente) return false
    if (vente.etablissement_id !== etablissementId) return false
    if (vente.statut !== 'PAYEE') return false
    return true
  })

  // Grouper par mode de paiement
  const stats: Record<ModePaiement, { total: number; count: number }> = {
    ESPECES: { total: 0, count: 0 },
    CARTE_BANCAIRE: { total: 0, count: 0 },
    AIRTEL_MONEY: { total: 0, count: 0 },
    MOOV_MONEY: { total: 0, count: 0 },
    CHEQUE: { total: 0, count: 0 },
    VIREMENT: { total: 0, count: 0 },
    COMPTE_CLIENT: { total: 0, count: 0 },
    MIXTE: { total: 0, count: 0 },
  }

  for (const p of filteredData) {
    const mode = p.mode_paiement as ModePaiement
    stats[mode].total += parseDecimal(p.montant)
    stats[mode].count++
  }

  return Object.entries(stats).map(([mode, data]) => ({
    mode: mode as ModePaiement,
    ...data,
  }))
}

// ================== TOP PRODUITS ==================

interface TopProduit {
  produitId: string
  nom: string
  quantiteVendue: number
  totalVentes: number
}

/**
 * Récupère les top produits vendus
 */
export async function getTopProduits(
  client: DbClient,
  etablissementId: string,
  options?: {
    dateDebut?: string
    dateFin?: string
    limit?: number
  }
): Promise<TopProduit[]> {
  const limit = options?.limit ?? 10

  // Récupérer les lignes de vente avec les produits
  const query = client
    .from('lignes_vente')
    .select(`
      quantite,
      total,
      produit:produits!inner(id, nom, etablissement_id),
      vente:ventes!inner(statut, created_at)
    `)

  const { data, error } = await query

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  // Filtrer et agréger
  const produitStats: Record<string, TopProduit> = {}

  for (const ligne of data ?? []) {
    const produit = ligne.produit as any
    const vente = ligne.vente as any

    if (!produit || !vente) continue
    if (produit.etablissement_id !== etablissementId) continue
    if (vente.statut !== 'PAYEE') continue

    // Filtrer par date si spécifié
    if (options?.dateDebut && vente.created_at < options.dateDebut) continue
    if (options?.dateFin && vente.created_at > options.dateFin) continue

    const produitId = produit.id as string

    if (!produitStats[produitId]) {
      produitStats[produitId] = {
        produitId,
        nom: produit.nom as string,
        quantiteVendue: 0,
        totalVentes: 0,
      }
    }

    produitStats[produitId].quantiteVendue += parseDecimal(ligne.quantite)
    produitStats[produitId].totalVentes += parseDecimal(ligne.total)
  }

  // Trier par quantité vendue et limiter
  return Object.values(produitStats)
    .sort((a, b) => b.quantiteVendue - a.quantiteVendue)
    .slice(0, limit)
}

// ================== RAPPORT Z ==================

interface RapportZ {
  date: string
  nombreVentes: number
  nombreAnnulations: number
  totalBrut: number
  totalRemises: number
  totalNet: number
  totalTva: number
  paiementsParMode: PaiementStats[]
}

/**
 * Génère le rapport Z du jour
 */
export async function genererRapportZ(
  client: DbClient,
  etablissementId: string,
  date: Date = new Date()
): Promise<RapportZ> {
  const { start, end } = getDayBounds(date)

  // Stats de ventes
  const ventesStats = await getVentesStats(client, etablissementId, {
    dateDebut: start,
    dateFin: end,
  })

  // Compter les annulations
  const { count: nombreAnnulations } = await client
    .from('ventes')
    .select('*', { count: 'exact', head: true })
    .eq('etablissement_id', etablissementId)
    .eq('statut', 'ANNULEE')
    .gte('created_at', start)
    .lte('created_at', end)

  // Stats par mode de paiement
  const paiementsParMode = await getPaiementsStatsByMode(client, etablissementId, {
    dateDebut: start,
    dateFin: end,
  })

  return {
    date: date.toISOString().slice(0, 10),
    nombreVentes: ventesStats.nombreVentes,
    nombreAnnulations: nombreAnnulations ?? 0,
    totalBrut: ventesStats.totalVentes + ventesStats.totalRemises,
    totalRemises: ventesStats.totalRemises,
    totalNet: ventesStats.totalVentes,
    totalTva: ventesStats.totalTva,
    paiementsParMode,
  }
}
