/**
 * Systeme de gestion des permissions (RBAC - Role-Based Access Control)
 *
 * @security Defense en profondeur:
 * - Permissions granulaires par action
 * - Hierarchie de roles
 * - Verification cote serveur obligatoire
 */

import { type Role, ROLES } from '@/lib/db/types'

/**
 * Actions possibles dans le systeme
 * Nomenclature: entite:action
 */
export type Permission =
  // Ventes
  | 'vente:creer'
  | 'vente:lire'
  | 'vente:modifier'
  | 'vente:annuler'
  | 'vente:rembourser'
  | 'vente:appliquer_remise'
  | 'vente:modifier_prix' // Modifier le prix d'un article pendant la vente

  // Produits
  | 'produit:creer'
  | 'produit:lire'
  | 'produit:modifier'
  | 'produit:supprimer'
  | 'produit:import'
  | 'produit:export'

  // Categories
  | 'categorie:creer'
  | 'categorie:lire'
  | 'categorie:modifier'
  | 'categorie:supprimer'

  // Stocks
  | 'stock:lire'
  | 'stock:modifier'
  | 'stock:inventaire'
  | 'stock:mouvement'

  // Clients
  | 'client:creer'
  | 'client:lire'
  | 'client:modifier'
  | 'client:supprimer'
  | 'client:credit_autoriser'
  | 'client:solde_modifier'

  // Tables / Salle
  | 'table:lire'
  | 'table:modifier_statut'
  | 'table:creer'
  | 'table:supprimer'
  | 'table:plan_modifier' // Modifier le plan de salle

  // Session Caisse
  | 'caisse:ouvrir'
  | 'caisse:cloturer'
  | 'caisse:consulter'
  | 'caisse:annuler_vente'

  // Employes
  | 'employe:creer'
  | 'employe:lire'
  | 'employe:modifier'
  | 'employe:supprimer'
  | 'employe:modifier_role'
  | 'employe:reset_pin'

  // Rapports
  | 'rapport:ventes'
  | 'rapport:caisse'
  | 'rapport:stocks'
  | 'rapport:z' // Rapport Z (cloture journaliere)
  | 'rapport:complet'
  | 'rapport:export'

  // Etablissement
  | 'etablissement:lire'
  | 'etablissement:modifier'
  | 'etablissement:parametres'

  // Imprimantes
  | 'imprimante:lire'
  | 'imprimante:creer'
  | 'imprimante:modifier'
  | 'imprimante:supprimer'
  | 'imprimante:tester'

  // Audit
  | 'audit:lire'
  | 'audit:exporter'

/**
 * Matrice des permissions par role
 * Chaque role a un ensemble de permissions autorisees
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // Toutes les permissions
    'vente:creer', 'vente:lire', 'vente:modifier', 'vente:annuler', 'vente:rembourser', 'vente:appliquer_remise', 'vente:modifier_prix',
    'produit:creer', 'produit:lire', 'produit:modifier', 'produit:supprimer', 'produit:import', 'produit:export',
    'categorie:creer', 'categorie:lire', 'categorie:modifier', 'categorie:supprimer',
    'stock:lire', 'stock:modifier', 'stock:inventaire', 'stock:mouvement',
    'client:creer', 'client:lire', 'client:modifier', 'client:supprimer', 'client:credit_autoriser', 'client:solde_modifier',
    'table:lire', 'table:modifier_statut', 'table:creer', 'table:supprimer', 'table:plan_modifier',
    'caisse:ouvrir', 'caisse:cloturer', 'caisse:consulter', 'caisse:annuler_vente',
    'employe:creer', 'employe:lire', 'employe:modifier', 'employe:supprimer', 'employe:modifier_role', 'employe:reset_pin',
    'rapport:ventes', 'rapport:caisse', 'rapport:stocks', 'rapport:z', 'rapport:complet', 'rapport:export',
    'etablissement:lire', 'etablissement:modifier', 'etablissement:parametres',
    'imprimante:lire', 'imprimante:creer', 'imprimante:modifier', 'imprimante:supprimer', 'imprimante:tester',
    'audit:lire', 'audit:exporter',
  ],

  ADMIN: [
    // Presque toutes les permissions sauf modification etablissement critique
    'vente:creer', 'vente:lire', 'vente:modifier', 'vente:annuler', 'vente:rembourser', 'vente:appliquer_remise', 'vente:modifier_prix',
    'produit:creer', 'produit:lire', 'produit:modifier', 'produit:supprimer', 'produit:import', 'produit:export',
    'categorie:creer', 'categorie:lire', 'categorie:modifier', 'categorie:supprimer',
    'stock:lire', 'stock:modifier', 'stock:inventaire', 'stock:mouvement',
    'client:creer', 'client:lire', 'client:modifier', 'client:supprimer', 'client:credit_autoriser', 'client:solde_modifier',
    'table:lire', 'table:modifier_statut', 'table:creer', 'table:supprimer', 'table:plan_modifier',
    'caisse:ouvrir', 'caisse:cloturer', 'caisse:consulter', 'caisse:annuler_vente',
    'employe:creer', 'employe:lire', 'employe:modifier', 'employe:supprimer', 'employe:modifier_role', 'employe:reset_pin',
    'rapport:ventes', 'rapport:caisse', 'rapport:stocks', 'rapport:z', 'rapport:complet', 'rapport:export',
    'etablissement:lire', 'etablissement:modifier', 'etablissement:parametres',
    'imprimante:lire', 'imprimante:creer', 'imprimante:modifier', 'imprimante:supprimer', 'imprimante:tester',
    'audit:lire', 'audit:exporter',
  ],

  MANAGER: [
    // Gestion quotidienne, pas de modification utilisateurs/etablissement
    'vente:creer', 'vente:lire', 'vente:modifier', 'vente:annuler', 'vente:appliquer_remise',
    'produit:creer', 'produit:lire', 'produit:modifier', 'produit:import', 'produit:export',
    'categorie:creer', 'categorie:lire', 'categorie:modifier',
    'stock:lire', 'stock:modifier', 'stock:inventaire', 'stock:mouvement',
    'client:creer', 'client:lire', 'client:modifier', 'client:credit_autoriser',
    'table:lire', 'table:modifier_statut', 'table:creer', 'table:supprimer', 'table:plan_modifier',
    'caisse:ouvrir', 'caisse:cloturer', 'caisse:consulter',
    'employe:lire',
    'rapport:ventes', 'rapport:caisse', 'rapport:stocks', 'rapport:z',
    'etablissement:lire',
    'imprimante:lire', 'imprimante:tester',
  ],

  CAISSIER: [
    // Operations de caisse uniquement
    'vente:creer', 'vente:lire', 'vente:appliquer_remise',
    'produit:lire',
    'categorie:lire',
    'stock:lire',
    'client:creer', 'client:lire', 'client:modifier',
    'table:lire', 'table:modifier_statut',
    'caisse:ouvrir', 'caisse:cloturer', 'caisse:consulter',
    'rapport:z', // Rapport de sa propre session
    'etablissement:lire',
    'imprimante:lire',
  ],

  SERVEUR: [
    // Operations de service en salle
    'vente:creer', 'vente:lire',
    'produit:lire',
    'categorie:lire',
    'table:lire', 'table:modifier_statut',
    'client:lire',
    'etablissement:lire',
  ],
}

/**
 * Hierarchie des roles pour comparaison
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  CAISSIER: 2,
  SERVEUR: 1,
}

/**
 * Verifie si un role a une permission specifique
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions?.includes(permission) ?? false
}

/**
 * Verifie si un role a toutes les permissions specifiees
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Verifie si un role a au moins une des permissions specifiees
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Retourne toutes les permissions d'un role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Verifie si un role est superieur ou egal a un autre
 */
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Verifie si un role est strictement superieur a un autre
 */
export function isRoleAbove(userRole: Role, otherRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[otherRole]
}

/**
 * Retourne les roles qu'un utilisateur peut gerer (roles inferieurs)
 */
export function getManageableRoles(userRole: Role): Role[] {
  const userLevel = ROLE_HIERARCHY[userRole]
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level < userLevel)
    .map(([role]) => role as Role)
}

/**
 * Verifie si un utilisateur peut modifier un autre utilisateur
 * (on ne peut modifier que les utilisateurs de rang inferieur)
 */
export function canManageUser(managerRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole]
}

/**
 * Obtient le nom d'affichage du role en francais
 */
export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    SUPER_ADMIN: 'Super Administrateur',
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    CAISSIER: 'Caissier',
    SERVEUR: 'Serveur',
  }
  return names[role] || role
}

/**
 * Obtient la couleur associee au role (pour badges, etc.)
 */
export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    SUPER_ADMIN: 'red',
    ADMIN: 'violet',
    MANAGER: 'blue',
    CAISSIER: 'green',
    SERVEUR: 'gray',
  }
  return colors[role] || 'gray'
}

/**
 * Type pour le resultat de verification de permission
 */
export type PermissionCheckResult = {
  allowed: boolean
  reason?: string
}

/**
 * Verifie une permission avec raison detaillee
 */
export function checkPermission(
  role: Role,
  permission: Permission
): PermissionCheckResult {
  if (hasPermission(role, permission)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Le role "${getRoleDisplayName(role)}" n'a pas la permission "${permission}"`,
  }
}

/**
 * Decorateur pour verifier les permissions (pour les Server Actions)
 * Usage: await requirePermission(session.role, 'vente:creer')
 */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission refusee: ${permission}`)
  }
}

/**
 * Decorateur pour verifier plusieurs permissions
 */
export function requireAllPermissions(role: Role, permissions: Permission[]): void {
  const missing = permissions.filter((p) => !hasPermission(role, p))
  if (missing.length > 0) {
    throw new Error(`Permissions refusees: ${missing.join(', ')}`)
  }
}

/**
 * Decorateur pour verifier au moins une permission
 */
export function requireAnyPermission(role: Role, permissions: Permission[]): void {
  if (!hasAnyPermission(role, permissions)) {
    throw new Error(`Au moins une permission requise parmi: ${permissions.join(', ')}`)
  }
}
