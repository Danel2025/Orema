/**
 * Tests unitaires pour le systeme de permissions RBAC
 *
 * Teste la matrice de permissions par role, la hierarchie,
 * les verifications granulaires et les groupes de permissions.
 */

import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  isRoleAtLeast,
  isRoleAbove,
  getManageableRoles,
  canManageUser,
  getRoleDisplayName,
  getRoleColor,
  checkPermission,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  ROLE_HIERARCHY,
  type Permission,
} from "@/lib/permissions";
import {
  getAllPermissionsList,
  getPermissionDefinition,
  getPermissionGroup,
  countPermissionsByGroup,
  PERMISSION_GROUPS,
} from "@/lib/permission-groups";

// ============================================================================
// Matrice de permissions par role
// ============================================================================

describe("Matrice de permissions par role", () => {
  describe("SUPER_ADMIN", () => {
    it("a toutes les permissions", () => {
      const allPerms = getAllPermissionsList();
      for (const perm of allPerms) {
        expect(hasPermission("SUPER_ADMIN", perm)).toBe(true);
      }
    });
  });

  describe("ADMIN", () => {
    it("a presque toutes les permissions", () => {
      expect(hasPermission("ADMIN", "vente:creer")).toBe(true);
      expect(hasPermission("ADMIN", "produit:supprimer")).toBe(true);
      expect(hasPermission("ADMIN", "employe:modifier_role")).toBe(true);
      expect(hasPermission("ADMIN", "audit:lire")).toBe(true);
      expect(hasPermission("ADMIN", "rapport:complet")).toBe(true);
    });
  });

  describe("MANAGER", () => {
    it("peut gerer les ventes et produits", () => {
      expect(hasPermission("MANAGER", "vente:creer")).toBe(true);
      expect(hasPermission("MANAGER", "vente:annuler")).toBe(true);
      expect(hasPermission("MANAGER", "produit:creer")).toBe(true);
      expect(hasPermission("MANAGER", "produit:modifier")).toBe(true);
    });

    it("peut gerer les stocks", () => {
      expect(hasPermission("MANAGER", "stock:lire")).toBe(true);
      expect(hasPermission("MANAGER", "stock:modifier")).toBe(true);
      expect(hasPermission("MANAGER", "stock:inventaire")).toBe(true);
    });

    it("ne peut pas supprimer les employes", () => {
      expect(hasPermission("MANAGER", "employe:supprimer")).toBe(false);
    });

    it("ne peut pas rembourser les ventes", () => {
      expect(hasPermission("MANAGER", "vente:rembourser")).toBe(false);
    });

    it("ne peut pas acceder aux rapports complets", () => {
      expect(hasPermission("MANAGER", "rapport:complet")).toBe(false);
    });
  });

  describe("CAISSIER", () => {
    it("peut creer et voir les ventes", () => {
      expect(hasPermission("CAISSIER", "vente:creer")).toBe(true);
      expect(hasPermission("CAISSIER", "vente:lire")).toBe(true);
    });

    it("peut appliquer des remises", () => {
      expect(hasPermission("CAISSIER", "vente:appliquer_remise")).toBe(true);
    });

    it("ne peut pas modifier les ventes", () => {
      expect(hasPermission("CAISSIER", "vente:modifier")).toBe(false);
    });

    it("ne peut pas gerer les produits", () => {
      expect(hasPermission("CAISSIER", "produit:creer")).toBe(false);
      expect(hasPermission("CAISSIER", "produit:modifier")).toBe(false);
      expect(hasPermission("CAISSIER", "produit:supprimer")).toBe(false);
    });

    it("peut ouvrir et cloturer la caisse", () => {
      expect(hasPermission("CAISSIER", "caisse:ouvrir")).toBe(true);
      expect(hasPermission("CAISSIER", "caisse:cloturer")).toBe(true);
    });

    it("peut voir le rapport Z (de sa propre session)", () => {
      expect(hasPermission("CAISSIER", "rapport:z")).toBe(true);
    });

    it("ne peut pas voir les rapports complets", () => {
      expect(hasPermission("CAISSIER", "rapport:complet")).toBe(false);
    });
  });

  describe("SERVEUR", () => {
    it("peut creer et voir les ventes", () => {
      expect(hasPermission("SERVEUR", "vente:creer")).toBe(true);
      expect(hasPermission("SERVEUR", "vente:lire")).toBe(true);
    });

    it("peut voir et modifier le statut des tables", () => {
      expect(hasPermission("SERVEUR", "table:lire")).toBe(true);
      expect(hasPermission("SERVEUR", "table:modifier_statut")).toBe(true);
    });

    it("ne peut pas ouvrir la caisse", () => {
      expect(hasPermission("SERVEUR", "caisse:ouvrir")).toBe(false);
    });

    it("ne peut pas gerer les stocks", () => {
      expect(hasPermission("SERVEUR", "stock:modifier")).toBe(false);
    });

    it("ne peut pas appliquer de remises", () => {
      expect(hasPermission("SERVEUR", "vente:appliquer_remise")).toBe(false);
    });
  });
});

// ============================================================================
// Verification multi-permissions
// ============================================================================

describe("Verification multi-permissions", () => {
  describe("hasAllPermissions", () => {
    it("retourne true si le role a toutes les permissions", () => {
      expect(
        hasAllPermissions("ADMIN", ["vente:creer", "vente:lire", "vente:modifier"])
      ).toBe(true);
    });

    it("retourne false si une permission manque", () => {
      expect(
        hasAllPermissions("CAISSIER", ["vente:creer", "vente:modifier"])
      ).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("retourne true si au moins une permission est presente", () => {
      expect(
        hasAnyPermission("SERVEUR", ["vente:modifier", "vente:creer"])
      ).toBe(true);
    });

    it("retourne false si aucune permission n'est presente", () => {
      expect(
        hasAnyPermission("SERVEUR", ["stock:modifier", "rapport:complet"])
      ).toBe(false);
    });
  });
});

// ============================================================================
// Hierarchie des roles
// ============================================================================

describe("Hierarchie des roles", () => {
  it("definit correctement les niveaux de hierarchie", () => {
    expect(ROLE_HIERARCHY["SUPER_ADMIN"]).toBe(5);
    expect(ROLE_HIERARCHY["ADMIN"]).toBe(4);
    expect(ROLE_HIERARCHY["MANAGER"]).toBe(3);
    expect(ROLE_HIERARCHY["CAISSIER"]).toBe(2);
    expect(ROLE_HIERARCHY["SERVEUR"]).toBe(1);
  });

  describe("isRoleAtLeast", () => {
    it("ADMIN est au moins MANAGER", () => {
      expect(isRoleAtLeast("ADMIN", "MANAGER")).toBe(true);
    });

    it("MANAGER est au moins MANAGER", () => {
      expect(isRoleAtLeast("MANAGER", "MANAGER")).toBe(true);
    });

    it("CAISSIER n'est pas au moins MANAGER", () => {
      expect(isRoleAtLeast("CAISSIER", "MANAGER")).toBe(false);
    });

    it("SUPER_ADMIN est au moins n'importe quel role", () => {
      expect(isRoleAtLeast("SUPER_ADMIN", "SERVEUR")).toBe(true);
      expect(isRoleAtLeast("SUPER_ADMIN", "SUPER_ADMIN")).toBe(true);
    });
  });

  describe("isRoleAbove", () => {
    it("ADMIN est au-dessus de MANAGER", () => {
      expect(isRoleAbove("ADMIN", "MANAGER")).toBe(true);
    });

    it("MANAGER n'est pas au-dessus de MANAGER (egal)", () => {
      expect(isRoleAbove("MANAGER", "MANAGER")).toBe(false);
    });

    it("SERVEUR n'est au-dessus de personne", () => {
      expect(isRoleAbove("SERVEUR", "CAISSIER")).toBe(false);
    });
  });

  describe("getManageableRoles", () => {
    it("ADMIN peut gerer MANAGER, CAISSIER, SERVEUR", () => {
      const roles = getManageableRoles("ADMIN");
      expect(roles).toContain("MANAGER");
      expect(roles).toContain("CAISSIER");
      expect(roles).toContain("SERVEUR");
      expect(roles).not.toContain("SUPER_ADMIN");
      expect(roles).not.toContain("ADMIN");
    });

    it("MANAGER peut gerer CAISSIER et SERVEUR", () => {
      const roles = getManageableRoles("MANAGER");
      expect(roles).toContain("CAISSIER");
      expect(roles).toContain("SERVEUR");
      expect(roles).toHaveLength(2);
    });

    it("SERVEUR ne peut gerer personne", () => {
      const roles = getManageableRoles("SERVEUR");
      expect(roles).toHaveLength(0);
    });
  });

  describe("canManageUser", () => {
    it("ADMIN peut gerer un CAISSIER", () => {
      expect(canManageUser("ADMIN", "CAISSIER")).toBe(true);
    });

    it("ADMIN ne peut pas gerer un autre ADMIN", () => {
      expect(canManageUser("ADMIN", "ADMIN")).toBe(false);
    });

    it("CAISSIER ne peut pas gerer un MANAGER", () => {
      expect(canManageUser("CAISSIER", "MANAGER")).toBe(false);
    });
  });
});

// ============================================================================
// Affichage des roles
// ============================================================================

describe("Affichage des roles", () => {
  describe("getRoleDisplayName", () => {
    it("retourne les noms francais des roles", () => {
      expect(getRoleDisplayName("SUPER_ADMIN")).toBe("Super Administrateur");
      expect(getRoleDisplayName("ADMIN")).toBe("Administrateur");
      expect(getRoleDisplayName("MANAGER")).toBe("Manager");
      expect(getRoleDisplayName("CAISSIER")).toBe("Caissier");
      expect(getRoleDisplayName("SERVEUR")).toBe("Serveur");
    });
  });

  describe("getRoleColor", () => {
    it("retourne les couleurs associees aux roles", () => {
      expect(getRoleColor("SUPER_ADMIN")).toBe("red");
      expect(getRoleColor("ADMIN")).toBe("violet");
      expect(getRoleColor("MANAGER")).toBe("blue");
      expect(getRoleColor("CAISSIER")).toBe("green");
      expect(getRoleColor("SERVEUR")).toBe("gray");
    });
  });
});

// ============================================================================
// checkPermission avec raison detaillee
// ============================================================================

describe("checkPermission", () => {
  it("retourne allowed:true pour une permission valide", () => {
    const result = checkPermission("ADMIN", "vente:creer");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("retourne allowed:false avec raison pour une permission manquante", () => {
    const result = checkPermission("SERVEUR", "stock:modifier");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Serveur");
    expect(result.reason).toContain("stock:modifier");
  });
});

// ============================================================================
// require* (decorateurs qui lancent des erreurs)
// ============================================================================

describe("Decorateurs requirePermission", () => {
  describe("requirePermission", () => {
    it("ne lance pas d'erreur pour une permission valide", () => {
      expect(() => requirePermission("ADMIN", "vente:creer")).not.toThrow();
    });

    it("lance une erreur pour une permission manquante", () => {
      expect(() =>
        requirePermission("SERVEUR", "stock:modifier")
      ).toThrowError("Permission refusee");
    });
  });

  describe("requireAllPermissions", () => {
    it("ne lance pas d'erreur si toutes les permissions sont presentes", () => {
      expect(() =>
        requireAllPermissions("ADMIN", ["vente:creer", "vente:lire"])
      ).not.toThrow();
    });

    it("lance une erreur listant les permissions manquantes", () => {
      expect(() =>
        requireAllPermissions("SERVEUR", [
          "vente:creer",
          "stock:modifier",
          "rapport:complet",
        ])
      ).toThrowError("Permissions refusees");
    });
  });

  describe("requireAnyPermission", () => {
    it("ne lance pas d'erreur si au moins une permission est presente", () => {
      expect(() =>
        requireAnyPermission("SERVEUR", ["vente:creer", "stock:modifier"])
      ).not.toThrow();
    });

    it("lance une erreur si aucune permission n'est presente", () => {
      expect(() =>
        requireAnyPermission("SERVEUR", ["stock:modifier", "rapport:complet"])
      ).toThrowError("Au moins une permission requise");
    });
  });
});

// ============================================================================
// Groupes de permissions
// ============================================================================

describe("Groupes de permissions", () => {
  it("contient au moins 10 groupes", () => {
    expect(PERMISSION_GROUPS.length).toBeGreaterThanOrEqual(10);
  });

  it("chaque groupe a une cle, un label et des permissions", () => {
    for (const group of PERMISSION_GROUPS) {
      expect(group.key).toBeDefined();
      expect(group.label).toBeDefined();
      expect(group.permissions.length).toBeGreaterThan(0);
    }
  });

  describe("getAllPermissionsList", () => {
    it("retourne toutes les permissions en liste plate", () => {
      const allPerms = getAllPermissionsList();
      expect(allPerms.length).toBeGreaterThan(40);

      // Verifier quelques permissions connues
      expect(allPerms).toContain("vente:creer");
      expect(allPerms).toContain("produit:lire");
      expect(allPerms).toContain("stock:inventaire");
      expect(allPerms).toContain("audit:lire");
    });
  });

  describe("getPermissionDefinition", () => {
    it("retourne la definition d'une permission existante", () => {
      const def = getPermissionDefinition("vente:creer");
      expect(def).toBeDefined();
      expect(def?.label).toContain("ventes");
    });

    it("retourne undefined pour une permission inexistante", () => {
      const def = getPermissionDefinition("inexistant:action" as Permission);
      expect(def).toBeUndefined();
    });
  });

  describe("getPermissionGroup", () => {
    it("retourne le groupe d'une permission", () => {
      const group = getPermissionGroup("vente:creer");
      expect(group).toBeDefined();
      expect(group?.key).toBe("ventes");
    });
  });

  describe("countPermissionsByGroup", () => {
    it("compte correctement les permissions actives", () => {
      const activePerms: Permission[] = [
        "vente:creer",
        "vente:lire",
        "produit:lire",
      ];

      const counts = countPermissionsByGroup(activePerms);

      expect(counts["ventes"].active).toBe(2);
      expect(counts["produits"].active).toBe(1);
      expect(counts["stocks"].active).toBe(0);
    });

    it("inclut le total de permissions par groupe", () => {
      const counts = countPermissionsByGroup([]);

      expect(counts["ventes"].total).toBe(7);
      expect(counts["stocks"].total).toBe(4);
    });
  });
});

// ============================================================================
// getRolePermissions
// ============================================================================

describe("getRolePermissions", () => {
  it("retourne les permissions du CAISSIER", () => {
    const perms = getRolePermissions("CAISSIER");
    expect(perms).toContain("vente:creer");
    expect(perms).toContain("caisse:ouvrir");
    expect(perms).not.toContain("employe:supprimer");
  });

  it("retourne un tableau non vide pour chaque role", () => {
    const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"] as const;
    for (const role of roles) {
      const perms = getRolePermissions(role);
      expect(perms.length).toBeGreaterThan(0);
    }
  });

  it("SUPER_ADMIN a plus de permissions que SERVEUR", () => {
    const superAdminPerms = getRolePermissions("SUPER_ADMIN");
    const serveurPerms = getRolePermissions("SERVEUR");
    expect(superAdminPerms.length).toBeGreaterThan(serveurPerms.length);
  });
});
