/**
 * Groupes de permissions pour l'interface utilisateur
 *
 * Organise les 47 permissions granulaires en catégories
 * pour une navigation facile dans l'éditeur de permissions.
 */

import type { Permission } from "./permissions";
import {
  ShoppingCart,
  Package,
  TreeStructure,
  Warehouse,
  Users,
  ForkKnife,
  Calculator,
  UserCircle,
  ChartBar,
  BuildingOffice,
  Printer,
  FileMagnifyingGlass,
  type Icon,
} from "@phosphor-icons/react";

/**
 * Définition d'un groupe de permissions
 */
export interface PermissionGroup {
  /** Clé unique du groupe */
  key: string;
  /** Label affiché */
  label: string;
  /** Description courte */
  description: string;
  /** Icône Phosphor */
  icon: Icon;
  /** Liste des permissions du groupe */
  permissions: PermissionDefinition[];
}

/**
 * Définition d'une permission individuelle
 */
export interface PermissionDefinition {
  /** Clé de la permission (ex: 'vente:creer') */
  key: Permission;
  /** Label affiché */
  label: string;
  /** Description détaillée */
  description: string;
}

/**
 * Groupes de permissions organisés par catégorie
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "ventes",
    label: "Ventes",
    description: "Opérations de vente et encaissement",
    icon: ShoppingCart,
    permissions: [
      {
        key: "vente:creer",
        label: "Créer des ventes",
        description: "Créer de nouvelles ventes et commandes",
      },
      {
        key: "vente:lire",
        label: "Voir les ventes",
        description: "Consulter l'historique des ventes",
      },
      {
        key: "vente:modifier",
        label: "Modifier les ventes",
        description: "Modifier les ventes en cours",
      },
      {
        key: "vente:annuler",
        label: "Annuler des ventes",
        description: "Annuler une vente en cours",
      },
      { key: "vente:rembourser", label: "Rembourser", description: "Effectuer des remboursements" },
      {
        key: "vente:appliquer_remise",
        label: "Appliquer des remises",
        description: "Appliquer des remises sur les ventes",
      },
      {
        key: "vente:modifier_prix",
        label: "Modifier les prix",
        description: "Modifier le prix d'un article pendant la vente",
      },
    ],
  },
  {
    key: "produits",
    label: "Produits",
    description: "Gestion du catalogue de produits",
    icon: Package,
    permissions: [
      {
        key: "produit:creer",
        label: "Créer des produits",
        description: "Ajouter de nouveaux produits au catalogue",
      },
      {
        key: "produit:lire",
        label: "Voir les produits",
        description: "Consulter le catalogue de produits",
      },
      {
        key: "produit:modifier",
        label: "Modifier les produits",
        description: "Modifier les informations des produits",
      },
      {
        key: "produit:supprimer",
        label: "Supprimer des produits",
        description: "Supprimer des produits du catalogue",
      },
      {
        key: "produit:import",
        label: "Importer des produits",
        description: "Importer des produits depuis un fichier CSV",
      },
      {
        key: "produit:export",
        label: "Exporter des produits",
        description: "Exporter le catalogue en CSV",
      },
    ],
  },
  {
    key: "categories",
    label: "Catégories",
    description: "Gestion des catégories de produits",
    icon: TreeStructure,
    permissions: [
      {
        key: "categorie:creer",
        label: "Créer des catégories",
        description: "Créer de nouvelles catégories",
      },
      {
        key: "categorie:lire",
        label: "Voir les catégories",
        description: "Consulter les catégories",
      },
      {
        key: "categorie:modifier",
        label: "Modifier les catégories",
        description: "Modifier les informations des catégories",
      },
      {
        key: "categorie:supprimer",
        label: "Supprimer des catégories",
        description: "Supprimer des catégories",
      },
    ],
  },
  {
    key: "stocks",
    label: "Stocks",
    description: "Gestion des stocks et inventaires",
    icon: Warehouse,
    permissions: [
      {
        key: "stock:lire",
        label: "Voir les stocks",
        description: "Consulter les niveaux de stock",
      },
      {
        key: "stock:modifier",
        label: "Modifier les stocks",
        description: "Ajuster les quantités en stock",
      },
      {
        key: "stock:inventaire",
        label: "Faire l'inventaire",
        description: "Réaliser un inventaire complet",
      },
      {
        key: "stock:mouvement",
        label: "Mouvements de stock",
        description: "Créer des entrées/sorties de stock",
      },
    ],
  },
  {
    key: "clients",
    label: "Clients",
    description: "Gestion de la clientèle et fidélité",
    icon: Users,
    permissions: [
      {
        key: "client:creer",
        label: "Créer des clients",
        description: "Ajouter de nouveaux clients",
      },
      {
        key: "client:lire",
        label: "Voir les clients",
        description: "Consulter le fichier clients",
      },
      {
        key: "client:modifier",
        label: "Modifier les clients",
        description: "Modifier les informations des clients",
      },
      {
        key: "client:supprimer",
        label: "Supprimer des clients",
        description: "Supprimer des clients",
      },
      {
        key: "client:credit_autoriser",
        label: "Autoriser le crédit",
        description: "Activer le crédit pour un client",
      },
      {
        key: "client:solde_modifier",
        label: "Modifier le solde",
        description: "Ajuster le solde prépayé d'un client",
      },
    ],
  },
  {
    key: "tables",
    label: "Tables / Salle",
    description: "Gestion du plan de salle",
    icon: ForkKnife,
    permissions: [
      {
        key: "table:lire",
        label: "Voir les tables",
        description: "Voir le plan de salle et l'état des tables",
      },
      {
        key: "table:modifier_statut",
        label: "Modifier le statut",
        description: "Changer le statut d'une table",
      },
      {
        key: "table:creer",
        label: "Créer des tables",
        description: "Ajouter de nouvelles tables au plan",
      },
      {
        key: "table:supprimer",
        label: "Supprimer des tables",
        description: "Retirer des tables du plan",
      },
      {
        key: "table:plan_modifier",
        label: "Modifier le plan",
        description: "Réorganiser le plan de salle",
      },
    ],
  },
  {
    key: "caisse",
    label: "Caisse",
    description: "Opérations de caisse",
    icon: Calculator,
    permissions: [
      {
        key: "caisse:ouvrir",
        label: "Ouvrir la caisse",
        description: "Ouvrir une session de caisse",
      },
      {
        key: "caisse:cloturer",
        label: "Clôturer la caisse",
        description: "Clôturer une session de caisse",
      },
      {
        key: "caisse:consulter",
        label: "Consulter la caisse",
        description: "Voir les totaux de la caisse",
      },
      {
        key: "caisse:annuler_vente",
        label: "Annuler en caisse",
        description: "Annuler une vente depuis la caisse",
      },
    ],
  },
  {
    key: "employes",
    label: "Employés",
    description: "Gestion du personnel",
    icon: UserCircle,
    permissions: [
      {
        key: "employe:creer",
        label: "Créer des employés",
        description: "Ajouter de nouveaux employés",
      },
      {
        key: "employe:lire",
        label: "Voir les employés",
        description: "Consulter la liste des employés",
      },
      {
        key: "employe:modifier",
        label: "Modifier les employés",
        description: "Modifier les informations des employés",
      },
      {
        key: "employe:supprimer",
        label: "Supprimer des employés",
        description: "Supprimer des employés",
      },
      {
        key: "employe:modifier_role",
        label: "Modifier les rôles",
        description: "Changer le rôle d'un employé",
      },
      {
        key: "employe:reset_pin",
        label: "Réinitialiser le PIN",
        description: "Réinitialiser le code PIN d'un employé",
      },
    ],
  },
  {
    key: "rapports",
    label: "Rapports",
    description: "Statistiques et analyses",
    icon: ChartBar,
    permissions: [
      {
        key: "rapport:ventes",
        label: "Rapports de ventes",
        description: "Voir les rapports de ventes",
      },
      {
        key: "rapport:caisse",
        label: "Rapports de caisse",
        description: "Voir les rapports de caisse",
      },
      {
        key: "rapport:stocks",
        label: "Rapports de stocks",
        description: "Voir les rapports de stocks",
      },
      {
        key: "rapport:z",
        label: "Rapport Z",
        description: "Générer le rapport de clôture journalière",
      },
      {
        key: "rapport:complet",
        label: "Rapports complets",
        description: "Accès à tous les rapports détaillés",
      },
      {
        key: "rapport:export",
        label: "Exporter les rapports",
        description: "Exporter les rapports en PDF/Excel",
      },
    ],
  },
  {
    key: "etablissement",
    label: "Établissement",
    description: "Configuration de l'établissement",
    icon: BuildingOffice,
    permissions: [
      {
        key: "etablissement:lire",
        label: "Voir l'établissement",
        description: "Voir les informations de l'établissement",
      },
      {
        key: "etablissement:modifier",
        label: "Modifier l'établissement",
        description: "Modifier les informations de l'établissement",
      },
      {
        key: "etablissement:parametres",
        label: "Gérer les paramètres",
        description: "Configurer les paramètres avancés",
      },
    ],
  },
  {
    key: "imprimantes",
    label: "Imprimantes",
    description: "Gestion des imprimantes",
    icon: Printer,
    permissions: [
      {
        key: "imprimante:lire",
        label: "Voir les imprimantes",
        description: "Voir la liste des imprimantes",
      },
      {
        key: "imprimante:creer",
        label: "Ajouter une imprimante",
        description: "Configurer une nouvelle imprimante",
      },
      {
        key: "imprimante:modifier",
        label: "Modifier une imprimante",
        description: "Modifier la configuration d'une imprimante",
      },
      {
        key: "imprimante:supprimer",
        label: "Supprimer une imprimante",
        description: "Retirer une imprimante",
      },
      {
        key: "imprimante:tester",
        label: "Tester une imprimante",
        description: "Imprimer une page de test",
      },
    ],
  },
  {
    key: "audit",
    label: "Audit",
    description: "Journaux d'activité",
    icon: FileMagnifyingGlass,
    permissions: [
      {
        key: "audit:lire",
        label: "Voir les journaux",
        description: "Consulter les journaux d'audit",
      },
      {
        key: "audit:exporter",
        label: "Exporter les journaux",
        description: "Exporter les journaux d'audit",
      },
    ],
  },
];

/**
 * Obtient toutes les permissions sous forme de liste plate
 */
export function getAllPermissionsList(): Permission[] {
  return PERMISSION_GROUPS.flatMap((group) => group.permissions.map((p) => p.key));
}

/**
 * Obtient la définition d'une permission
 */
export function getPermissionDefinition(permission: Permission): PermissionDefinition | undefined {
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find((p) => p.key === permission);
    if (found) return found;
  }
  return undefined;
}

/**
 * Obtient le groupe d'une permission
 */
export function getPermissionGroup(permission: Permission): PermissionGroup | undefined {
  return PERMISSION_GROUPS.find((group) => group.permissions.some((p) => p.key === permission));
}

/**
 * Compte les permissions actives par groupe
 */
export function countPermissionsByGroup(
  activePermissions: Permission[]
): Record<string, { active: number; total: number }> {
  const result: Record<string, { active: number; total: number }> = {};

  for (const group of PERMISSION_GROUPS) {
    const activeInGroup = group.permissions.filter((p) => activePermissions.includes(p.key)).length;

    result[group.key] = {
      active: activeInGroup,
      total: group.permissions.length,
    };
  }

  return result;
}
