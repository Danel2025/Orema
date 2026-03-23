"use client";

/**
 * Hook pour la verification des permissions cote client
 *
 * @security Note: Ce hook est pour l'UX uniquement (masquer/afficher des elements).
 * La verification de securite DOIT toujours etre faite cote serveur.
 */

import { useCallback, useMemo } from "react";
import type { Role } from "@/lib/db/types";
import {
  type Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isRoleAtLeast,
  isRoleAbove,
  getManageableRoles,
  canManageUser,
  getRoleDisplayName,
  getRoleColor,
} from "@/lib/permissions";

// Type pour l'utilisateur courant (provenant du store ou context)
interface CurrentUser {
  role: Role;
  etablissementId: string;
  userId: string;
}

/**
 * Hook principal pour les permissions
 * Usage: const { can, canAll, canAny } = usePermissions(currentUser)
 */
export function usePermissions(user: CurrentUser | null) {
  /**
   * Verifie une permission unique
   */
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user]
  );

  /**
   * Verifie si l'utilisateur a toutes les permissions
   */
  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return hasAllPermissions(user.role, permissions);
    },
    [user]
  );

  /**
   * Verifie si l'utilisateur a au moins une permission
   */
  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return hasAnyPermission(user.role, permissions);
    },
    [user]
  );

  /**
   * Verifie si le role est au moins egal a un role requis
   */
  const isAtLeast = useCallback(
    (requiredRole: Role): boolean => {
      if (!user) return false;
      return isRoleAtLeast(user.role, requiredRole);
    },
    [user]
  );

  /**
   * Verifie si le role est strictement superieur
   */
  const isAbove = useCallback(
    (otherRole: Role): boolean => {
      if (!user) return false;
      return isRoleAbove(user.role, otherRole);
    },
    [user]
  );

  /**
   * Verifie si l'utilisateur peut gerer un autre utilisateur
   */
  const canManage = useCallback(
    (targetRole: Role): boolean => {
      if (!user) return false;
      return canManageUser(user.role, targetRole);
    },
    [user]
  );

  /**
   * Retourne les roles que l'utilisateur peut gerer
   */
  const manageableRoles = useMemo(() => {
    if (!user) return [];
    return getManageableRoles(user.role);
  }, [user]);

  /**
   * Informations sur le role de l'utilisateur
   */
  const roleInfo = useMemo(() => {
    if (!user) return null;
    return {
      role: user.role,
      displayName: getRoleDisplayName(user.role),
      color: getRoleColor(user.role),
    };
  }, [user]);

  /**
   * Verifie si l'utilisateur est admin (SUPER_ADMIN ou ADMIN)
   */
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  }, [user]);

  /**
   * Verifie si l'utilisateur est super admin
   */
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === "SUPER_ADMIN";
  }, [user]);

  /**
   * Verifie si l'utilisateur peut acceder aux parametres
   */
  const canAccessSettings = useMemo(() => {
    return canAny(["etablissement:parametres", "imprimante:modifier", "employe:modifier"]);
  }, [canAny]);

  /**
   * Verifie si l'utilisateur peut acceder aux rapports complets
   */
  const canAccessFullReports = useMemo(() => {
    return can("rapport:complet");
  }, [can]);

  return {
    // Verifications de base
    can,
    canAll,
    canAny,

    // Comparaisons de roles
    isAtLeast,
    isAbove,
    canManage,
    manageableRoles,

    // Informations utilisateur
    roleInfo,
    isAdmin,
    isSuperAdmin,

    // Raccourcis pour features communes
    canAccessSettings,
    canAccessFullReports,
  };
}

/**
 * Hook pour proteger un composant avec une permission
 * Retourne null si pas autorise, permettant un rendu conditionnel
 *
 * Usage:
 * const authorized = useRequirePermission(user, 'produit:creer')
 * if (!authorized) return <AccessDenied />
 */
export function useRequirePermission(user: CurrentUser | null, permission: Permission): boolean {
  return useMemo(() => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user, permission]);
}

/**
 * Hook pour obtenir les informations d'un role
 */
export function useRoleInfo(role: Role | null) {
  return useMemo(() => {
    if (!role) return null;
    return {
      role,
      displayName: getRoleDisplayName(role),
      color: getRoleColor(role),
    };
  }, [role]);
}

/**
 * Type pour le retour du hook usePermissions
 */
export type UsePermissionsReturn = ReturnType<typeof usePermissions>;
