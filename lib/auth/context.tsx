"use client";

/**
 * Contexte d'authentification React
 *
 * Fournit l'utilisateur connecte et ses permissions a toute l'application.
 * Optimise avec useMemo/useCallback pour eviter les re-renders inutiles.
 *
 * @see https://react.dev/reference/react/useContext
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { Role } from "@/lib/db/types";
import {
  type Permission,
  isRoleAtLeast,
  isRoleAbove,
  getManageableRoles,
  canManageUser,
  getRoleDisplayName,
  getRoleColor,
} from "@/lib/permissions";
import { type RouteConfig, getRouteConfig, DASHBOARD_ROUTES } from "@/lib/route-config";

/**
 * Donnees de l'utilisateur authentifie
 */
export interface AuthUser {
  userId: string;
  authId: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  /** ID de l'établissement (peut être null pour SUPER_ADMIN global) */
  etablissementId: string | null;
  etablissementNom?: string;
  /** Routes personnalisées autorisées (override les permissions du rôle pour les non-admins) */
  allowedRoutes?: string[];
}

/**
 * Resultat de verification de permission
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valeur du contexte d'authentification
 */
export interface AuthContextValue {
  /** Utilisateur connecte (null si chargement ou non connecte) */
  user: AuthUser | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur de chargement */
  error: string | null;

  // Verifications de permissions
  /** Verifie si l'utilisateur a une permission */
  can: (permission: Permission) => boolean;
  /** Verifie si l'utilisateur a toutes les permissions */
  canAll: (permissions: Permission[]) => boolean;
  /** Verifie si l'utilisateur a au moins une des permissions */
  canAny: (permissions: Permission[]) => boolean;

  // Verifications de roles
  /** Verifie si le role est au moins egal a un role requis */
  isAtLeast: (requiredRole: Role) => boolean;
  /** Verifie si le role est strictement superieur */
  isAbove: (otherRole: Role) => boolean;
  /** Verifie si l'utilisateur peut gerer un autre utilisateur */
  canManage: (targetRole: Role) => boolean;
  /** Roles que l'utilisateur peut gerer */
  manageableRoles: Role[];

  // Informations sur le role
  /** Informations formatees du role */
  roleInfo: { role: Role; displayName: string; color: string } | null;
  /** Est admin (SUPER_ADMIN ou ADMIN) */
  isAdmin: boolean;
  /** Est super admin */
  isSuperAdmin: boolean;

  // Verification d'acces aux routes
  /** Verifie si l'utilisateur peut acceder a une route */
  canAccessRoute: (path: string) => PermissionCheckResult;
  /** Routes accessibles par l'utilisateur */
  accessibleRoutes: RouteConfig[];

  // Actions
  /** Rafraichir les donnees utilisateur */
  refresh: () => Promise<void>;
  /** Deconnexion (cote client seulement - la vraie deconnexion est serveur) */
  clearUser: () => void;
}

/**
 * Contexte d'authentification
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Props du provider
 */
export interface AuthProviderProps {
  children: ReactNode;
  /** Utilisateur initial (passe depuis le serveur) */
  initialUser: AuthUser | null;
  /** Permissions initiales chargees depuis la BD */
  initialPermissions?: Permission[];
}

/**
 * Provider d'authentification
 *
 * Fournit l'utilisateur et ses permissions a toute l'application.
 * Doit wrapper le contenu du dashboard.
 *
 * @example
 * ```tsx
 * <AuthProvider initialUser={user} initialPermissions={permissions}>
 *   <DashboardContent />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children, initialUser, initialPermissions }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchroniser avec initialUser et initialPermissions quand ils changent
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    if (initialPermissions) {
      setPermissions(initialPermissions);
    }
  }, [initialPermissions]);

  // ============= Verifications de permissions =============
  // Utilise les permissions chargees depuis la BD (ou defaults)

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      // Utiliser les permissions du state (chargees depuis BD)
      return permissions.includes(permission);
    },
    [user, permissions]
  );

  const canAll = useCallback(
    (perms: Permission[]): boolean => {
      if (!user) return false;
      return perms.every((p) => permissions.includes(p));
    },
    [user, permissions]
  );

  const canAny = useCallback(
    (perms: Permission[]): boolean => {
      if (!user) return false;
      return perms.some((p) => permissions.includes(p));
    },
    [user, permissions]
  );

  // ============= Verifications de roles =============

  const isAtLeast = useCallback(
    (requiredRole: Role): boolean => {
      if (!user) return false;
      return isRoleAtLeast(user.role, requiredRole);
    },
    [user]
  );

  const isAbove = useCallback(
    (otherRole: Role): boolean => {
      if (!user) return false;
      return isRoleAbove(user.role, otherRole);
    },
    [user]
  );

  const canManage = useCallback(
    (targetRole: Role): boolean => {
      if (!user) return false;
      return canManageUser(user.role, targetRole);
    },
    [user]
  );

  const manageableRoles = useMemo(() => {
    if (!user) return [];
    return getManageableRoles(user.role);
  }, [user]);

  // ============= Informations sur le role =============

  const roleInfo = useMemo(() => {
    if (!user) return null;
    return {
      role: user.role,
      displayName: getRoleDisplayName(user.role),
      color: getRoleColor(user.role),
    };
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  }, [user]);

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === "SUPER_ADMIN";
  }, [user]);

  // ============= Verification d'acces aux routes =============

  const canAccessRoute = useCallback(
    (path: string): PermissionCheckResult => {
      if (!user) {
        return { allowed: false, reason: "Non authentifie" };
      }

      // Les admins (SUPER_ADMIN et ADMIN) ont accès à tout
      const isUserAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

      // Pour les non-admins avec allowedRoutes configurées
      // Seules ces routes sont accessibles (override total des permissions)
      // Note: un tableau vide [] signifie "aucun accès" (toutes routes bloquées)
      // alors que undefined signifie "pas de restriction configurée"
      if (!isUserAdmin && Array.isArray(user.allowedRoutes)) {
        // Tableau vide = aucun accès
        if (user.allowedRoutes.length === 0) {
          return {
            allowed: false,
            reason: "Aucune page autorisée pour ce rôle",
          };
        }

        const isAllowed = user.allowedRoutes.some((route) => {
          // Correspondance exacte ou route parente
          return path === route || path.startsWith(route + "/");
        });
        if (!isAllowed) {
          return {
            allowed: false,
            reason: "Route non autorisée pour ce rôle",
          };
        }
        // Route autorisée par allowedRoutes
        return { allowed: true };
      }

      const routeConfig = getRouteConfig(path);

      // Route non configuree = accessible a tous les utilisateurs connectes
      if (!routeConfig) {
        return { allowed: true };
      }

      // Route publique pour tous les authentifies
      if (routeConfig.publicForAuthenticated) {
        return { allowed: true };
      }

      // Verification des roles autorises specifiquement
      if (routeConfig.allowedRoles && routeConfig.allowedRoles.length > 0) {
        if (!routeConfig.allowedRoles.includes(user.role)) {
          return {
            allowed: false,
            reason: `Role non autorise. Roles requis: ${routeConfig.allowedRoles.join(", ")}`,
          };
        }
      }

      // Verification du role minimum
      if (routeConfig.minRole) {
        if (!isRoleAtLeast(user.role, routeConfig.minRole)) {
          return {
            allowed: false,
            reason: `Role insuffisant. Minimum requis: ${getRoleDisplayName(routeConfig.minRole)}`,
          };
        }
      }

      // Verification des permissions (toutes requises - AND)
      if (routeConfig.requiredAllPermissions && routeConfig.requiredAllPermissions.length > 0) {
        const hasAll = routeConfig.requiredAllPermissions.every((p) => permissions.includes(p));
        if (!hasAll) {
          const missing = routeConfig.requiredAllPermissions.filter(
            (p) => !permissions.includes(p)
          );
          return {
            allowed: false,
            reason: `Permissions manquantes: ${missing.join(", ")}`,
          };
        }
      }

      // Verification des permissions (au moins une - OR)
      if (routeConfig.requiredPermissions && routeConfig.requiredPermissions.length > 0) {
        const hasAny = routeConfig.requiredPermissions.some((p) => permissions.includes(p));
        if (!hasAny) {
          return {
            allowed: false,
            reason: `Une permission requise parmi: ${routeConfig.requiredPermissions.join(", ")}`,
          };
        }
      }

      return { allowed: true };
    },
    [user, permissions]
  );

  const accessibleRoutes = useMemo(() => {
    if (!user) return [];
    return DASHBOARD_ROUTES.filter((route) => {
      const result = canAccessRoute(route.path);
      return result.allowed;
    });
  }, [user, canAccessRoute]);

  // ============= Actions =============

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Appeler l'API pour rafraichir les donnees utilisateur
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Erreur lors du rafraichissement");
      }
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  // ============= Valeur du contexte memorisee =============

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      can,
      canAll,
      canAny,
      isAtLeast,
      isAbove,
      canManage,
      manageableRoles,
      roleInfo,
      isAdmin,
      isSuperAdmin,
      canAccessRoute,
      accessibleRoutes,
      refresh,
      clearUser,
    }),
    [
      user,
      isLoading,
      error,
      can,
      canAll,
      canAny,
      isAtLeast,
      isAbove,
      canManage,
      manageableRoles,
      roleInfo,
      isAdmin,
      isSuperAdmin,
      canAccessRoute,
      accessibleRoutes,
      refresh,
      clearUser,
    ]
  );

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}

/**
 * Hook pour acceder au contexte d'authentification
 *
 * @throws Error si utilise en dehors d'un AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, can, isAdmin } = useAuth()
 *
 *   if (!can('produit:creer')) {
 *     return <AccessDenied />
 *   }
 *
 *   return <CreateProductForm />
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * Hook pour acceder uniquement a l'utilisateur courant
 *
 * @example
 * ```tsx
 * function UserBadge() {
 *   const user = useCurrentUser()
 *   return <Badge>{user?.prenom} {user?.nom}</Badge>
 * }
 * ```
 */
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook pour verifier l'acces a une route
 *
 * @example
 * ```tsx
 * function NavLink({ href, children }) {
 *   const canAccess = useCanAccessRoute(href)
 *   if (!canAccess) return null
 *   return <Link href={href}>{children}</Link>
 * }
 * ```
 */
export function useCanAccessRoute(path: string): boolean {
  const { canAccessRoute } = useAuth();
  return canAccessRoute(path).allowed;
}
