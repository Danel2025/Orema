"use client";

/**
 * ClientList - Liste des clients avec recherche et pagination
 */

import { useState } from "react";
import {
  Flex,
  Text,
  TextField,
  Button,
  Badge,
  Table,
  IconButton,
  DropdownMenu,
  AlertDialog,
  Checkbox,
} from "@radix-ui/themes";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Wallet,
  Star,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteClient } from "@/actions/clients";
import { toast } from "sonner";

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  pointsFidelite: number;
  soldePrepaye: number;
  creditAutorise: boolean;
  limitCredit: number | null;
  soldeCredit: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    ventes: number;
  };
}

interface ClientListProps {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onRefresh: () => void;
  searchQuery?: string;
  showInactive?: boolean;
  onToggleInactive?: (show: boolean) => void;
}

export function ClientList({
  clients,
  pagination,
  onSearch,
  onPageChange,
  onAdd,
  onEdit,
  onView,
  onRefresh,
  searchQuery = "",
  showInactive = false,
  onToggleInactive,
}: ClientListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteClient(clientToDelete.id);

      if (result.success) {
        toast.success(result.message || "Client supprime");
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const getClientName = (client: Client) => {
    return client.prenom
      ? `${client.nom} ${client.prenom}`
      : client.nom;
  };

  return (
    <>
      <Flex direction="column" gap="4">
        {/* Header avec recherche et bouton ajouter */}
        <Flex justify="between" align="center" gap="4" wrap="wrap">
          <Flex align="center" gap="3" style={{ flex: 1, minWidth: 200 }}>
            <TextField.Root
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 400 }}
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Flex>

          <Flex align="center" gap="3">
            {onToggleInactive ? <Flex align="center" gap="2">
                <Checkbox
                  checked={showInactive}
                  onCheckedChange={(checked) => onToggleInactive(!!checked)}
                />
                <Text size="2" color="gray">
                  Afficher inactifs
                </Text>
              </Flex> : null}
            <Button onClick={onAdd}>
              <Plus size={16} />
              Nouveau client
            </Button>
          </Flex>
        </Flex>

        {/* Liste des clients */}
        {clients.length > 0 ? (
          <>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Client</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Fidelite
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Solde prepaye
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Achats
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Statut
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Actions
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {clients.map((client) => (
                  <Table.Row key={client.id}>
                    {/* Nom */}
                    <Table.Cell>
                      <Flex direction="column">
                        <Text size="2" weight="medium">
                          {getClientName(client)}
                        </Text>
                        {client.adresse ? <Text size="1" color="gray">
                            {client.adresse}
                          </Text> : null}
                      </Flex>
                    </Table.Cell>

                    {/* Contact */}
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        {client.telephone ? <Flex align="center" gap="1">
                            <Phone size={12} className="text-gray-500" />
                            <Text size="1">{client.telephone}</Text>
                          </Flex> : null}
                        {client.email ? <Flex align="center" gap="1">
                            <Mail size={12} className="text-gray-500" />
                            <Text size="1">{client.email}</Text>
                          </Flex> : null}
                        {!client.telephone && !client.email && (
                          <Text size="1" color="gray">
                            -
                          </Text>
                        )}
                      </Flex>
                    </Table.Cell>

                    {/* Points fidelite */}
                    <Table.Cell align="center">
                      <Flex align="center" justify="center" gap="1">
                        <Star size={14} className="text-amber-500" />
                        <Text
                          size="2"
                          weight="medium"
                          style={{ fontFamily: "var(--font-google-sans-code)" }}
                        >
                          {client.pointsFidelite}
                        </Text>
                      </Flex>
                    </Table.Cell>

                    {/* Solde prepaye */}
                    <Table.Cell align="center">
                      <Flex align="center" justify="center" gap="1">
                        <Wallet size={14} className="text-green-500" />
                        <Text
                          size="2"
                          weight="medium"
                          color={client.soldePrepaye > 0 ? "green" : undefined}
                          style={{ fontFamily: "var(--font-google-sans-code)" }}
                        >
                          {formatCurrency(client.soldePrepaye)}
                        </Text>
                      </Flex>
                    </Table.Cell>

                    {/* Nombre d'achats */}
                    <Table.Cell align="center">
                      <Text
                        size="2"
                        style={{ fontFamily: "var(--font-google-sans-code)" }}
                      >
                        {client._count?.ventes || 0}
                      </Text>
                    </Table.Cell>

                    {/* Statut */}
                    <Table.Cell align="center">
                      <Badge
                        size="1"
                        color={client.actif ? "green" : "gray"}
                        variant="soft"
                      >
                        {client.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell align="center">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          <IconButton variant="ghost" size="1">
                            <MoreHorizontal size={16} />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          <DropdownMenu.Item onClick={() => onView(client)}>
                            <Eye size={14} />
                            Voir details
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => onEdit(client)}>
                            <Edit size={14} />
                            Modifier
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            color="red"
                            onClick={() => {
                              setClientToDelete(client);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 size={14} />
                            {client._count?.ventes ? "Desactiver" : "Supprimer"}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Flex justify="between" align="center" pt="2">
                <Text size="2" color="gray">
                  {pagination.total} client{pagination.total > 1 ? "s" : ""} -
                  Page {pagination.page} sur {pagination.totalPages}
                </Text>
                <Flex gap="2">
                  <Button
                    variant="soft"
                    size="1"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange(pagination.page - 1)}
                  >
                    <ChevronLeft size={14} />
                    Precedent
                  </Button>
                  <Button
                    variant="soft"
                    size="1"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange(pagination.page + 1)}
                  >
                    Suivant
                    <ChevronRight size={14} />
                  </Button>
                </Flex>
              </Flex>
            )}
          </>
        ) : (
          <Flex
            direction="column"
            align="center"
            gap="3"
            py="8"
            style={{ color: "var(--gray-9)" }}
          >
            <Users size={48} />
            <Text size="3" color="gray">
              {searchQuery
                ? "Aucun client trouve pour cette recherche"
                : "Aucun client enregistre"}
            </Text>
            {!searchQuery && (
              <Button variant="soft" onClick={onAdd}>
                <Plus size={16} />
                Ajouter un client
              </Button>
            )}
          </Flex>
        )}
      </Flex>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>
            {clientToDelete?._count?.ventes
              ? "Desactiver le client"
              : "Supprimer le client"}
          </AlertDialog.Title>
          <AlertDialog.Description size="2">
            {clientToDelete?._count?.ventes ? (
              <>
                Le client <strong>{clientToDelete ? getClientName(clientToDelete) : null}</strong>{" "}
                a {clientToDelete._count.ventes} achat(s) enregistre(s). Il sera
                desactive mais son historique sera conserve.
              </>
            ) : (
              <>
                Etes-vous sur de vouloir supprimer le client{" "}
                <strong>{clientToDelete ? getClientName(clientToDelete) : null}</strong> ?
                Cette action est irreversible.
              </>
            )}
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" disabled={isDeleting}>
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleDelete} disabled={isDeleting}>
                {clientToDelete?._count?.ventes ? "Desactiver" : "Supprimer"}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
