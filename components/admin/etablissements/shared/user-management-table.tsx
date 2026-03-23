"use client";

/**
 * UserManagementTable - Table d'utilisateurs avec actions
 * Colonnes : avatar, nom, email, rôle, dernière connexion, statut, actions
 */

import { Badge, Text, IconButton } from "@/components/ui";
import { Table, DropdownMenu } from "@radix-ui/themes";
import { DotsThree } from "@phosphor-icons/react";
import type { User, UserRole } from "./types";

interface UserManagementTableProps {
  users: User[];
  onResetPassword?: (id: string) => void;
  onChangeRole?: (id: string, role: UserRole) => void;
  onToggleActive?: (id: string) => void;
}

const roleConfig: Record<UserRole, { label: string; color: "violet" | "blue" | "green" | "orange" | "gray" }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "violet" },
  ADMIN: { label: "Admin", color: "blue" },
  MANAGER: { label: "Manager", color: "green" },
  CAISSIER: { label: "Caissier", color: "orange" },
  SERVEUR: { label: "Serveur", color: "gray" },
};

const allRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CAISSIER", "SERVEUR"];

function getInitials(nom: string, prenom: string): string {
  return `${prenom[0] || ""}${nom[0] || ""}`.toUpperCase();
}

function getInitialsColor(name: string): string {
  const colors = [
    "var(--violet-9)",
    "var(--blue-9)",
    "var(--green-9)",
    "var(--orange-9)",
    "var(--red-9)",
    "var(--cyan-9)",
    "var(--pink-9)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getRelativeTime(date?: string | Date): string {
  if (!date) return "Jamais";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-GA", { day: "numeric", month: "short" });
}

export function UserManagementTable({
  users,
  onResetPassword,
  onChangeRole,
  onToggleActive,
}: UserManagementTableProps) {
  return (
    <Table.Root variant="surface" size="2">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Utilisateur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Rôle</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Dernière connexion</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ width: 50 }} />
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {users.map((user) => {
          const initials = getInitials(user.nom, user.prenom);
          const initialsColor = getInitialsColor(`${user.prenom} ${user.nom}`);
          const role = roleConfig[user.role];

          return (
            <Table.Row key={user.id}>
              {/* Avatar + Nom */}
              <Table.Cell>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: `color-mix(in srgb, ${initialsColor} 15%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      color: initialsColor,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <Text size="2" weight="medium">
                    {user.prenom} {user.nom}
                  </Text>
                </div>
              </Table.Cell>

              {/* Email */}
              <Table.Cell>
                <Text size="2" color="gray">
                  {user.email}
                </Text>
              </Table.Cell>

              {/* Rôle */}
              <Table.Cell>
                <Badge variant="soft" color={role.color}>
                  {role.label}
                </Badge>
              </Table.Cell>

              {/* Dernière connexion */}
              <Table.Cell>
                <Text size="2" color="gray">
                  {getRelativeTime(user.derniereConnexion)}
                </Text>
              </Table.Cell>

              {/* Statut */}
              <Table.Cell>
                <Badge variant="soft" color={user.actif ? "green" : "red"}>
                  {user.actif ? "Actif" : "Inactif"}
                </Badge>
              </Table.Cell>

              {/* Actions */}
              <Table.Cell>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <IconButton variant="ghost" color="gray" size="1">
                      <DotsThree size={18} weight="bold" />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content size="1">
                    {onResetPassword ? (
                      <DropdownMenu.Item onClick={() => onResetPassword(user.id)}>
                        Réinitialiser mot de passe
                      </DropdownMenu.Item>
                    ) : null}

                    {onChangeRole ? (
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger>Changer rôle</DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                          {allRoles
                            .filter((r) => r !== user.role)
                            .map((r) => (
                              <DropdownMenu.Item
                                key={r}
                                onClick={() => onChangeRole(user.id, r)}
                              >
                                {roleConfig[r].label}
                              </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Sub>
                    ) : null}

                    {onToggleActive ? (
                      <>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          color={user.actif ? "red" : "green"}
                          onClick={() => onToggleActive(user.id)}
                        >
                          {user.actif ? "Désactiver" : "Activer"}
                        </DropdownMenu.Item>
                      </>
                    ) : null}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
