/**
 * Fonctions pour charger/sauvegarder les permissions depuis la base de données
 * Migré vers Supabase
 */

import { createClient } from "@/lib/db";
import { type Permission, getRolePermissions as getDefaultRolePermissions } from "./permissions";

type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR";

export async function getPermissionsForRole(
  role: Role,
  etablissementId: string
): Promise<Permission[]> {
  if (role === "SUPER_ADMIN") return getDefaultRolePermissions("SUPER_ADMIN");

  try {
    const supabase = await createClient();
    const { data: customPermissions } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("role", role)
      .eq("etablissement_id", etablissementId)
      .single();

    if (customPermissions?.permissions) {
      return customPermissions.permissions as Permission[];
    }
    return getDefaultRolePermissions(role);
  } catch {
    return getDefaultRolePermissions(role);
  }
}

export async function hasPermissionAsync(
  role: Role,
  permission: Permission,
  etablissementId: string
): Promise<boolean> {
  const permissions = await getPermissionsForRole(role, etablissementId);
  return permissions.includes(permission);
}

export async function saveRolePermissions(
  role: Role,
  permissions: Permission[],
  etablissementId: string
): Promise<void> {
  if (role === "SUPER_ADMIN")
    throw new Error("Les permissions de SUPER_ADMIN ne peuvent pas être modifiées");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("role_permissions")
    .select("id")
    .eq("role", role)
    .eq("etablissement_id", etablissementId)
    .single();

  if (existing) {
    await supabase.from("role_permissions").update({ permissions }).eq("id", existing.id);
  } else {
    await supabase
      .from("role_permissions")
      .insert({
        role,
        etablissement_id: etablissementId,
        permissions,
        updated_at: new Date().toISOString(),
      });
  }
}

export async function resetRolePermissions(role: Role, etablissementId: string): Promise<void> {
  if (role === "SUPER_ADMIN") return;

  const supabase = await createClient();
  await supabase
    .from("role_permissions")
    .delete()
    .eq("role", role)
    .eq("etablissement_id", etablissementId);
}

export async function getAllRolePermissions(
  etablissementId: string
): Promise<Record<Role, { permissions: Permission[]; isCustom: boolean }>> {
  const supabase = await createClient();
  const { data: customConfigs } = await supabase
    .from("role_permissions")
    .select("role, permissions")
    .eq("etablissement_id", etablissementId);

  const customMap = new Map(
    (customConfigs || []).map((c) => [c.role, c.permissions as Permission[]])
  );
  const roles: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"];
  const result = {} as Record<Role, { permissions: Permission[]; isCustom: boolean }>;

  for (const role of roles) {
    const customPermissions = customMap.get(role);
    result[role] = {
      permissions: customPermissions || getDefaultRolePermissions(role),
      isCustom: !!customPermissions && role !== "SUPER_ADMIN",
    };
  }

  return result;
}

export async function hasCustomPermissions(role: Role, etablissementId: string): Promise<boolean> {
  if (role === "SUPER_ADMIN") return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("role_permissions")
    .select("id")
    .eq("role", role)
    .eq("etablissement_id", etablissementId)
    .single();
  return !!data;
}

// ============= Gestion des routes autorisées par rôle =============

/**
 * Récupère les routes autorisées pour un rôle
 * Retourne null si aucune restriction (toutes les pages selon permissions)
 */
export async function getAllowedRoutesForRole(
  role: Role,
  etablissementId: string
): Promise<string[] | null> {
  // Les admins ont accès à tout
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    console.log("[getAllowedRoutesForRole] Admin role, returning null (no restrictions)");
    return null;
  }

  try {
    // Utiliser le service client pour bypasser les RLS
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();

    console.log(
      "[getAllowedRoutesForRole] Querying for role:",
      role,
      "etablissement:",
      etablissementId
    );

    // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur si pas de ligne
    const { data, error } = await supabase
      .from("role_permissions")
      .select("allowed_routes")
      .eq("role", role)
      .eq("etablissement_id", etablissementId)
      .maybeSingle();

    console.log("[getAllowedRoutesForRole] Raw data:", JSON.stringify(data));
    console.log("[getAllowedRoutesForRole] Error:", error?.message || "none");

    // Si erreur ou pas de données, pas de restriction
    if (error) {
      console.error("[getAllowedRoutesForRole] Query error:", error);
      return null;
    }

    // Si pas de config pour ce rôle, pas de restriction
    if (!data) {
      console.log("[getAllowedRoutesForRole] No config found for role, returning null");
      return null;
    }

    // Si allowed_routes est null (switch désactivé), pas de restriction
    if (data.allowed_routes === null) {
      console.log("[getAllowedRoutesForRole] allowed_routes is null, returning null");
      return null;
    }

    // Retourner les routes configurées
    const routes = data.allowed_routes as string[];
    console.log("[getAllowedRoutesForRole] Returning routes:", routes);
    return routes;
  } catch (err) {
    console.error("[getAllowedRoutesForRole] Exception:", err);
    return null;
  }
}

/**
 * Sauvegarde les routes autorisées pour un rôle
 * Passer null pour désactiver les restrictions (revenir au comportement par défaut)
 */
export async function saveAllowedRoutesForRole(
  role: Role,
  allowedRoutes: string[] | null,
  etablissementId: string
): Promise<void> {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    throw new Error("Les routes des administrateurs ne peuvent pas être modifiées");
  }

  // Utiliser le service client pour bypasser les RLS
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  const { data: existing, error: selectError } = await supabase
    .from("role_permissions")
    .select("id")
    .eq("role", role)
    .eq("etablissement_id", etablissementId)
    .single();

  if (existing) {
    const { error: updateError } = await supabase
      .from("role_permissions")
      .update({
        allowed_routes: allowedRoutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[saveAllowedRoutesForRole] Update error:", updateError);
      throw new Error("Erreur lors de la mise à jour");
    }
  } else {
    // Créer une entrée avec les permissions par défaut + les routes
    const defaultPermissions = getDefaultRolePermissions(role);
    const { error: insertError } = await supabase.from("role_permissions").insert({
      role,
      etablissement_id: etablissementId,
      permissions: defaultPermissions,
      allowed_routes: allowedRoutes,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[saveAllowedRoutesForRole] Insert error:", insertError);
      throw new Error("Erreur lors de l'insertion");
    }
  }
}

/**
 * Récupère la configuration complète des routes pour tous les rôles non-admin
 */
export async function getAllRoleAllowedRoutes(
  etablissementId: string
): Promise<Record<string, string[] | null>> {
  // Utiliser le service client pour bypasser les RLS
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("role_permissions")
    .select("role, allowed_routes")
    .eq("etablissement_id", etablissementId);

  if (error) {
    console.error("[getAllRoleAllowedRoutes] Error:", error.message);
  }

  console.log("[getAllRoleAllowedRoutes] Data:", data);

  const result: Record<string, string[] | null> = {
    MANAGER: null,
    CAISSIER: null,
    SERVEUR: null,
  };

  for (const item of data || []) {
    if (item.role in result) {
      result[item.role] = item.allowed_routes as string[] | null;
    }
  }

  return result;
}
