"use client";

/**
 * Page de gestion des clients
 * Liste, creation, edition, details des clients
 */

import { useState, useEffect, useCallback } from "react";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { Users } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { getClients } from "@/actions/clients";
import { ClientList, ClientFormModal, ClientDetailModal } from "@/components/clients";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientsPage() {
  // Etats
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Debounce de la recherche
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Charger les clients
  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getClients({
        search: debouncedSearch || undefined,
        includeInactive: showInactive,
        page: pagination.page,
        limit: pagination.limit,
      });

      setClients(result.clients as Client[]);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, showInactive, pagination.page, pagination.limit]);

  // Charger les clients au montage et quand les filtres changent
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleToggleInactive = (show: boolean) => {
    setShowInactive(show);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleView = (client: Client) => {
    setSelectedClientId(client.id);
    setIsDetailModalOpen(true);
  };

  const handleFormSuccess = () => {
    loadClients();
  };

  const handleEditFromDetail = () => {
    setIsDetailModalOpen(false);
    const client = clients.find((c) => c.id === selectedClientId);
    if (client) {
      setSelectedClient(client);
      setIsFormModalOpen(true);
    }
  };

  return (
    <Flex direction="column" gap="6" p="6">
      {/* Header */}
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          <Users size={28} className="text-violet-500" />
          <Heading size="7">Clients</Heading>
        </Flex>
        <Text size="3" color="gray">
          Gestion de la clientele, comptes prepayes et programme de fidelite
        </Text>
      </Flex>

      {/* Liste des clients */}
      <ClientList
        clients={clients}
        pagination={pagination}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onRefresh={loadClients}
        searchQuery={searchQuery}
        showInactive={showInactive}
        onToggleInactive={handleToggleInactive}
      />

      {/* Modal de creation/edition */}
      <ClientFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={
          selectedClient
            ? {
                id: selectedClient.id,
                nom: selectedClient.nom,
                prenom: selectedClient.prenom,
                telephone: selectedClient.telephone,
                email: selectedClient.email,
                adresse: selectedClient.adresse,
                creditAutorise: selectedClient.creditAutorise,
                limitCredit: selectedClient.limitCredit,
                actif: selectedClient.actif,
              }
            : undefined
        }
        onSuccess={handleFormSuccess}
      />

      {/* Modal de detail */}
      <ClientDetailModal
        clientId={selectedClientId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onEdit={handleEditFromDetail}
      />
    </Flex>
  );
}
