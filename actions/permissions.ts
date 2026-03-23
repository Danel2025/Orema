"use server";

/**
 * Server Actions pour la gestion des permissions configurables
 * Migré vers Supabase
 */

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/db";
import { requireAuth, requireAnyRole } from "@/lib/auth";
import { type Permission, ROLE_HIERARCHY } from "@/lib/permissions";
import {
  getPermissionsForRole,
  saveRolePermissions,
  resetRolePermissions,
  getAllRolePermissions,
  hasCustomPermissions,
} from "@/lib/permissions-db";

type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR";
type ActionResult<T = void> = { success: boolean; error?: string; data?: T };

function canEditRolePermissions(userRole: Role, targetRole: Role): boolean {
  if (targetRole === "SUPER_ADMIN") return false;
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") return false;
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export async function getRolePermissionConfig(
  role: Role
): Promise<ActionResult<{ permissions: Permission[]; isCustom: boolean; isEditable: boolean }>> {
  try {
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const permissions = await getPermissionsForRole(role, session.etablissementId);
    const isCustom = await hasCustomPermissions(role, session.etablissementId);
    const isEditable = canEditRolePermissions(session.role as Role, role);
    return { success: true, data: { permissions, isCustom, isEditable } };
  } catch (error) {
    console.error("[getRolePermissionConfig] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des permissions" };
  }
}

export async function getAllRolePermissionConfigs(): Promise<
  ActionResult<Record<Role, { permissions: Permission[]; isCustom: boolean; isEditable: boolean }>>
> {
  try {
    const session = await requireAuth();
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    const allPermissions = await getAllRolePermissions(session.etablissementId);
    const result = {} as Record<
      Role,
      { permissions: Permission[]; isCustom: boolean; isEditable: boolean }
    >;
    const roles: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"];
    for (const role of roles)
      result[role] = {
        ...allPermissions[role],
        isEditable: canEditRolePermissions(session.role as Role, role),
      };
    return { success: true, data: result };
  } catch (error) {
    console.error("[getAllRolePermissionConfigs] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des permissions" };
  }
}

export async function updateRolePermissions(
  role: Role,
  permissions: Permission[]
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    if (!canEditRolePermissions(session.role as Role, role))
      return { success: false, error: "Vous ne pouvez pas modifier les permissions de ce rôle" };

    await saveRolePermissions(role, permissions, session.etablissementId);

    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      action: "UPDATE",
      entite: "RolePermission",
      entite_id: role,
      description: `Modification des permissions du rôle ${role}`,
      nouvelle_valeur: JSON.stringify(permissions),
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId,
    });

    revalidatePath("/employes");
    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[updateRolePermissions] Erreur:", error);
    return { success: false, error: "Erreur lors de la mise à jour des permissions" };
  }
}

export async function togglePermission(
  role: Role,
  permission: Permission,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    if (!canEditRolePermissions(session.role as Role, role))
      return { success: false, error: "Vous ne pouvez pas modifier les permissions de ce rôle" };

    const currentPermissions = await getPermissionsForRole(role, session.etablissementId);
    const newPermissions = enabled
      ? currentPermissions.includes(permission)
        ? currentPermissions
        : [...currentPermissions, permission]
      : currentPermissions.filter((p) => p !== permission);

    await saveRolePermissions(role, newPermissions, session.etablissementId);

    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      action: "UPDATE",
      entite: "RolePermission",
      entite_id: role,
      description: `${enabled ? "Activation" : "Désactivation"} permission ${permission} pour ${role}`,
      ancienne_valeur: enabled ? "Non" : "Oui",
      nouvelle_valeur: enabled ? "Oui" : "Non",
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId,
    });

    revalidatePath("/employes");
    return { success: true };
  } catch (error) {
    console.error("[togglePermission] Erreur:", error);
    return { success: false, error: "Erreur lors de la modification de la permission" };
  }
}

export async function resetRolePermissionsToDefaults(role: Role): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    if (!canEditRolePermissions(session.role as Role, role))
      return { success: false, error: "Vous ne pouvez pas modifier les permissions de ce rôle" };

    await resetRolePermissions(role, session.etablissementId);

    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      action: "UPDATE",
      entite: "RolePermission",
      entite_id: role,
      description: `Réinitialisation des permissions du rôle ${role} aux valeurs par défaut`,
      utilisateur_id: session.userId,
      etablissement_id: session.etablissementId,
    });

    revalidatePath("/employes");
    revalidatePath("/parametres");
    return { success: true };
  } catch (error) {
    console.error("[resetRolePermissionsToDefaults] Erreur:", error);
    return { success: false, error: "Erreur lors de la réinitialisation des permissions" };
  }
}

export async function enableAllPermissionsInGroup(
  role: Role,
  groupPermissions: Permission[]
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    if (!canEditRolePermissions(session.role as Role, role))
      return { success: false, error: "Vous ne pouvez pas modifier les permissions de ce rôle" };

    const currentPermissions = await getPermissionsForRole(role, session.etablissementId);
    const newPermissions = [...new Set([...currentPermissions, ...groupPermissions])];
    await saveRolePermissions(role, newPermissions, session.etablissementId);

    revalidatePath("/employes");
    return { success: true };
  } catch (error) {
    console.error("[enableAllPermissionsInGroup] Erreur:", error);
    return { success: false, error: "Erreur lors de l'activation des permissions" };
  }
}

export async function disableAllPermissionsInGroup(
  role: Role,
  groupPermissions: Permission[]
): Promise<ActionResult> {
  try {
    const session = await requireAnyRole(["SUPER_ADMIN", "ADMIN"]);
    if (!session.etablissementId) return { success: false, error: "Aucun établissement associé" };
    if (!canEditRolePermissions(session.role as Role, role))
      return { success: false, error: "Vous ne pouvez pas modifier les permissions de ce rôle" };

    const currentPermissions = await getPermissionsForRole(role, session.etablissementId);
    const newPermissions = currentPermissions.filter((p) => !groupPermissions.includes(p));
    await saveRolePermissions(role, newPermissions, session.etablissementId);

    revalidatePath("/employes");
    return { success: true };
  } catch (error) {
    console.error("[disableAllPermissionsInGroup] Erreur:", error);
    return { success: false, error: "Erreur lors de la désactivation des permissions" };
  }
}
