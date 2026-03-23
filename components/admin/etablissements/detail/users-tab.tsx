"use client";

/**
 * Onglet Utilisateurs - Détail établissement
 * Table des utilisateurs avec actions (reset mdp, changer role, desactiver)
 */

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  Table,
  Select,
  Skeleton,
  TextField,
  Callout,
  Avatar,
} from "@radix-ui/themes";
import {
  Users,
  UserPlus,
  Key,
  UserMinus,
  UserCheck,
  Warning,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { EtablissementDetail } from "./types";

interface EtabUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  lastLogin?: string | null;
  createdAt: string;
}

interface UsersTabProps {
  etablissement: EtablissementDetail;
  users: EtabUser[];
  isLoading?: boolean;
  onResetPassword?: (userId: string) => Promise<void>;
  onChangeRole?: (userId: string, newRole: string) => Promise<void>;
  onToggleActive?: (userId: string, active: boolean) => Promise<void>;
  onAddUser?: () => void;
  maxUsers?: number;
}

const roleConfig: Record<string, { color: "orange" | "blue" | "green" | "amber" | "gray"; label: string }> = {
  SUPER_ADMIN: { color: "orange", label: "Super Admin" },
  ADMIN: { color: "blue", label: "Admin" },
  MANAGER: { color: "green", label: "Manager" },
  CAISSIER: { color: "amber", label: "Caissier" },
  SERVEUR: { color: "gray", label: "Serveur" },
};

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function getRelativeTime(date: string | null | undefined): string {
  if (!date) return "Jamais";

  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return d.toLocaleDateString("fr-FR");
}

export function UsersTab({
  etablissement,
  users,
  isLoading,
  onResetPassword,
  onChangeRole,
  onToggleActive,
  onAddUser,
  maxUsers,
}: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Compteur par role
  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  // Filtrer les utilisateurs
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      searchQuery === "" ||
      `${user.prenom} ${user.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole = roleFilter === "all" || user.role === roleFilter;

    return matchSearch && matchRole;
  });

  const handleResetPassword = async (userId: string) => {
    if (!onResetPassword) return;
    setActionLoading(userId);
    try {
      await onResetPassword(userId);
      toast.success("Lien de reinitialisation envoye");
    } catch {
      toast.error("Erreur lors de la reinitialisation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!onChangeRole) return;
    setActionLoading(userId);
    try {
      await onChangeRole(userId, newRole);
      toast.success("Rôle mis à jour");
    } catch {
      toast.error("Erreur lors du changement de role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!onToggleActive) return;
    setActionLoading(userId);
    try {
      await onToggleActive(userId, !currentActive);
      toast.success(currentActive ? "Utilisateur desactive" : "Utilisateur reactive");
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setActionLoading(null);
    }
  };

  const canAddUser = maxUsers ? users.length < maxUsers : true;

  return (
    <Box>
      {/* Compteurs par role */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex gap="2" mb="4" wrap="wrap">
          <Badge variant="soft" color="gray" size="2">
            <Users size={14} weight="bold" />
            Total: {users.length}
            {maxUsers ? ` / ${maxUsers}` : null}
          </Badge>
          {Object.entries(roleCounts).map(([role, count]) => {
            const config = roleConfig[role] || { color: "gray" as const, label: role };
            return (
              <Badge key={role} variant="soft" color={config.color} size="1">
                {config.label}: {count}
              </Badge>
            );
          })}
        </Flex>
      </motion.div>

      {/* Barre de recherche + filtres + bouton ajouter */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Flex gap="3" mb="4" align="end">
          <Box style={{ flex: 1, maxWidth: 320 }}>
            <TextField.Root
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlass size={16} weight="bold" />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
            <Select.Trigger placeholder="Filtrer par role" />
            <Select.Content>
              <Select.Item value="all">Tous les roles</Select.Item>
              <Select.Separator />
              {Object.entries(roleConfig).map(([role, config]) => (
                <Select.Item key={role} value={role}>
                  {config.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <Box style={{ marginLeft: "auto" }}>
            <Button
              onClick={onAddUser}
              disabled={!canAddUser}
              style={{ minHeight: 36 }}
            >
              <UserPlus size={16} weight="bold" />
              Ajouter un utilisateur
            </Button>
          </Box>
        </Flex>
      </motion.div>

      {!canAddUser && (
        <Callout.Root color="amber" mb="4" size="1">
          <Callout.Icon>
            <Warning size={16} weight="fill" />
          </Callout.Icon>
          <Callout.Text>
            Quota d'utilisateurs atteint ({maxUsers}). Passez a un plan superieur pour ajouter plus d'utilisateurs.
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Table des utilisateurs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Box
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
            overflow: "hidden",
          }}
        >
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Utilisateur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Role</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Derniere connexion</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Table.Row key={i}>
                    <Table.Cell>
                      <Flex align="center" gap="3">
                        <Skeleton style={{ width: 36, height: 36, borderRadius: "50%" }} />
                        <Skeleton style={{ width: 120, height: 14 }} />
                      </Flex>
                    </Table.Cell>
                    <Table.Cell><Skeleton style={{ width: 160, height: 14 }} /></Table.Cell>
                    <Table.Cell align="center"><Skeleton style={{ width: 70, height: 22, borderRadius: 9999 }} /></Table.Cell>
                    <Table.Cell align="center"><Skeleton style={{ width: 80, height: 14 }} /></Table.Cell>
                    <Table.Cell align="center"><Skeleton style={{ width: 50, height: 22, borderRadius: 9999 }} /></Table.Cell>
                    <Table.Cell align="right"><Skeleton style={{ width: 120, height: 28, borderRadius: 6 }} /></Table.Cell>
                  </Table.Row>
                ))
              ) : filteredUsers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <Flex direction="column" align="center" justify="center" py="8" gap="2">
                      <Users size={32} weight="duotone" style={{ color: "var(--gray-8)" }} />
                      <Text color="gray" size="2">
                        {searchQuery || roleFilter !== "all"
                          ? "Aucun utilisateur correspondant aux filtres"
                          : "Aucun utilisateur dans cet etablissement"}
                      </Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredUsers.map((user, index) => {
                  const config = roleConfig[user.role] || { color: "gray" as const, label: user.role };
                  const isLoadingAction = actionLoading === user.id;

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.12 + index * 0.03 }}
                      className="rt-TableRow"
                    >
                      <Table.Cell>
                        <Flex align="center" gap="3">
                          <Avatar
                            size="2"
                            fallback={getInitials(user.nom, user.prenom)}
                            color={config.color}
                            variant="soft"
                          />
                          <Text weight="medium" size="2">
                            {user.prenom} {user.nom}
                          </Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {user.email}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Select.Root
                          value={user.role}
                          onValueChange={(value) => handleChangeRole(user.id, value)}
                          size="1"
                          disabled={isLoadingAction}
                        >
                          <Select.Trigger variant="soft" color={config.color} />
                          <Select.Content>
                            {Object.entries(roleConfig)
                              .filter(([role]) => role !== "SUPER_ADMIN")
                              .map(([role, rc]) => (
                                <Select.Item key={role} value={role}>
                                  {rc.label}
                                </Select.Item>
                              ))}
                          </Select.Content>
                        </Select.Root>
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Text size="2" color="gray">
                          {getRelativeTime(user.lastLogin)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Badge
                          variant="soft"
                          color={user.actif ? "green" : "red"}
                          size="1"
                        >
                          {user.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Flex gap="1" justify="end">
                          <Button
                            variant="ghost"
                            color="gray"
                            size="1"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={isLoadingAction}
                            style={{ minWidth: 32, minHeight: 32 }}
                            title="Réinitialiser le mot de passe"
                          >
                            <Key size={14} weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            color={user.actif ? "red" : "green"}
                            size="1"
                            onClick={() => handleToggleActive(user.id, user.actif)}
                            disabled={isLoadingAction}
                            style={{ minWidth: 32, minHeight: 32 }}
                            title={user.actif ? "Désactiver" : "Réactiver"}
                          >
                            {user.actif ? (
                              <UserMinus size={14} weight="bold" />
                            ) : (
                              <UserCheck size={14} weight="bold" />
                            )}
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </motion.tr>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </motion.div>
    </Box>
  );
}
