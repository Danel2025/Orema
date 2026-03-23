"use client";

/**
 * Modal de gestion des pages autorisees pour un employe
 * Permet aux admins de definir quelles pages un non-admin peut voir
 */

import { useState, useEffect } from "react";
import { Dialog, Button, Flex, Text, Checkbox, Badge, Separator, Callout } from "@radix-ui/themes";
import {
  SpinnerGap,
  FloppyDisk,
  SquaresFour,
  ShoppingCart,
  ForkKnife,
  Package,
  Warehouse,
  Users,
  UserCircle,
  ChartBar,
  GearSix,
  Info,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { updateEmployeAllowedRoutes } from "@/actions/employes";

interface PageConfig {
  path: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}

const AVAILABLE_PAGES: PageConfig[] = [
  {
    path: "/",
    label: "Tableau de bord",
    description: "Vue globale de l'activite",
    icon: SquaresFour,
  },
  {
    path: "/caisse",
    label: "Caisse",
    description: "Point de vente et encaissement",
    icon: ShoppingCart,
  },
  {
    path: "/salle",
    label: "Plan de salle",
    description: "Gestion des tables et service",
    icon: ForkKnife,
  },
  {
    path: "/produits",
    label: "Produits",
    description: "Catalogue des produits",
    icon: Package,
  },
  {
    path: "/stocks",
    label: "Stocks",
    description: "Gestion des stocks et inventaire",
    icon: Warehouse,
  },
  {
    path: "/clients",
    label: "Clients",
    description: "Fichier clients et fidelite",
    icon: Users,
  },
  {
    path: "/employes",
    label: "Employés",
    description: "Gestion du personnel",
    icon: UserCircle,
  },
  {
    path: "/rapports",
    label: "Rapports",
    description: "Statistiques et analyses",
    icon: ChartBar,
  },
  {
    path: "/parametres",
    label: "Paramètres",
    description: "Configuration du système",
    icon: GearSix,
  },
];

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  allowed_routes?: string[];
}

interface PageAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

export function PageAccessModal({ open, onOpenChange, employee, onSuccess }: PageAccessModalProps) {
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomAccess, setUseCustomAccess] = useState(false);

  // Initialiser avec les routes actuelles de l'employe
  useEffect(() => {
    if (employee) {
      const currentRoutes = employee.allowed_routes || [];
      setSelectedRoutes(currentRoutes);
      setUseCustomAccess(currentRoutes.length > 0);
    }
  }, [employee]);

  const handleToggleRoute = (path: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(path) ? prev.filter((r) => r !== path) : [...prev, path]
    );
  };

  const handleSelectAll = () => {
    setSelectedRoutes(AVAILABLE_PAGES.map((p) => p.path));
  };

  const handleDeselectAll = () => {
    setSelectedRoutes([]);
  };

  const handleResetToDefault = () => {
    setSelectedRoutes([]);
    setUseCustomAccess(false);
  };

  const handleSubmit = async () => {
    if (!employee) return;

    setIsSubmitting(true);

    try {
      // Si useCustomAccess est false, on envoie un tableau vide
      // ce qui signifie que les permissions du role s'appliquent
      const routesToSave = useCustomAccess ? selectedRoutes : [];

      const result = await updateEmployeAllowedRoutes({
        employeId: employee.id,
        allowedRoutes: routesToSave,
      });

      if (result.success) {
        toast.success("Accès aux pages mis à jour");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Erreur lors de la mise a jour");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = employee?.role === "SUPER_ADMIN" || employee?.role === "ADMIN";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="550px">
        <Dialog.Title>Acces aux pages</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Definir les pages accessibles pour{" "}
          <Text weight="bold">
            {employee?.prenom} {employee?.nom}
          </Text>
        </Dialog.Description>

        {isAdmin ? (
          <Callout.Root color="blue" mb="4">
            <Callout.Icon>
              <Info size={16} />
            </Callout.Icon>
            <Callout.Text>
              Les administrateurs ont acces a toutes les pages par defaut. Cette configuration ne
              s'applique qu'aux non-administrateurs.
            </Callout.Text>
          </Callout.Root>
        ) : (
          <>
            {/* Toggle acces personnalise */}
            <Flex direction="column" gap="3" mb="4">
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox
                    checked={useCustomAccess}
                    onCheckedChange={(checked) => {
                      setUseCustomAccess(checked === true);
                      if (!checked) {
                        setSelectedRoutes([]);
                      }
                    }}
                  />
                  <Text weight="medium">Utiliser un acces personnalise</Text>
                </Flex>
              </Text>
              <Text size="1" color="gray">
                {useCustomAccess
                  ? "Seules les pages cochees ci-dessous seront accessibles"
                  : "Les permissions du role s'appliquent (acces standard)"}
              </Text>
            </Flex>

            {useCustomAccess ? (
              <>
                <Separator size="4" mb="4" />

                {/* Actions rapides */}
                <Flex gap="2" mb="4">
                  <Button type="button" variant="soft" size="1" onClick={handleSelectAll}>
                    Tout selectionner
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    size="1"
                    color="gray"
                    onClick={handleDeselectAll}
                  >
                    Tout deselectionner
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="1"
                    color="gray"
                    onClick={handleResetToDefault}
                  >
                    <ArrowCounterClockwise size={14} />
                    Defaut
                  </Button>
                </Flex>

                {/* Liste des pages */}
                <Flex direction="column" gap="2" style={{ maxHeight: "350px", overflowY: "auto" }}>
                  {AVAILABLE_PAGES.map((page) => {
                    const Icon = page.icon;
                    const isSelected = selectedRoutes.includes(page.path);

                    return (
                      <Text
                        as="label"
                        size="2"
                        key={page.path}
                        style={{
                          cursor: "pointer",
                          padding: "12px",
                          borderRadius: "8px",
                          backgroundColor: isSelected ? "var(--accent-a3)" : "var(--gray-a2)",
                          border: isSelected
                            ? "1px solid var(--accent-6)"
                            : "1px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Flex gap="3" align="center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleRoute(page.path)}
                          />
                          <Flex
                            align="center"
                            justify="center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              backgroundColor: isSelected ? "var(--accent-9)" : "var(--gray-a4)",
                              color: isSelected ? "white" : "var(--gray-11)",
                            }}
                          >
                            <Icon size={16} />
                          </Flex>
                          <Flex direction="column" gap="0">
                            <Text weight="medium">{page.label}</Text>
                            <Text size="1" color="gray">
                              {page.description}
                            </Text>
                          </Flex>
                        </Flex>
                      </Text>
                    );
                  })}
                </Flex>

                {/* Compteur */}
                <Flex justify="end" mt="3">
                  <Badge color={selectedRoutes.length > 0 ? "green" : "gray"}>
                    {selectedRoutes.length} / {AVAILABLE_PAGES.length} pages
                  </Badge>
                </Flex>
              </>
            ) : null}
          </>
        )}

        {/* Actions */}
        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isSubmitting}>
              Annuler
            </Button>
          </Dialog.Close>
          {!isAdmin && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap className="animate-spin" size={16} /> : <FloppyDisk size={16} />}
              Enregistrer
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
