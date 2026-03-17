"use client";

/**
 * ClientDetailModal - Modal affichant les details d'un client avec onglets
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  Tabs,
  Box,
  Badge,
  Card,
  Separator,
  Spinner,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Wallet,
  Star,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getClientById,
  getHistoriqueAchats,
  getHistoriqueFidelite,
  getHistoriqueComptePrepaye,
  getStatistiquesClient,
} from "@/actions/clients";
import { PrepaidAccount } from "./prepaid-account";
import { LoyaltyPoints } from "./loyalty-points";
import { PurchaseHistory } from "./purchase-history";

interface ClientDetailModalProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function ClientDetailModal({
  clientId,
  open,
  onOpenChange,
  onEdit,
}: ClientDetailModalProps) {
  const [client, setClient] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [achats, setAchats] = useState<any>({ ventes: [], pagination: {} });
  const [fideliteHistory, setFideliteHistory] = useState<any[]>([]);
  const [prepaidHistory, setPrepaidHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [achatsPage, setAchatsPage] = useState(1);

  // Charger les donnees du client
  const loadClientData = async () => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      const [
        clientData,
        statsData,
        achatsData,
        fideliteData,
        prepaidData,
      ] = await Promise.all([
        getClientById(clientId),
        getStatistiquesClient(clientId),
        getHistoriqueAchats(clientId, { page: achatsPage }),
        getHistoriqueFidelite(clientId),
        getHistoriqueComptePrepaye(clientId),
      ]);

      setClient(clientData);
      setStats(statsData);
      setAchats(achatsData);
      setFideliteHistory(fideliteData);
      setPrepaidHistory(prepaidData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && clientId) {
      loadClientData();
    }
  }, [open, clientId, achatsPage]);

  const handlePageChange = (page: number) => {
    setAchatsPage(page);
  };

  const getClientName = () => {
    if (!client) return "";
    return client.prenom ? `${client.nom} ${client.prenom}` : client.nom;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="700px" style={{ maxHeight: "90vh" }}>
        {isLoading ? (
          <Flex align="center" justify="center" py="9">
            <Spinner size="3" />
          </Flex>
        ) : client ? (
          <>
            {/* Header */}
            <Flex justify="between" align="start" mb="4">
              <Flex direction="column" gap="1">
                <Dialog.Title>{getClientName()}</Dialog.Title>
                <Dialog.Description size="2" color="gray">
                  Client depuis le {formatDate(client.createdAt, "long")}
                </Dialog.Description>
              </Flex>
              <Flex align="center" gap="2">
                <Badge
                  size="2"
                  color={client.actif ? "green" : "gray"}
                  variant="soft"
                >
                  {client.actif ? "Actif" : "Inactif"}
                </Badge>
                {onEdit ? <Button variant="soft" size="2" onClick={onEdit}>
                    <Edit size={14} />
                    Modifier
                  </Button> : null}
              </Flex>
            </Flex>

            {/* Informations principales */}
            <Card variant="surface" mb="4">
              <Flex gap="4" wrap="wrap">
                {client.telephone ? <Flex align="center" gap="2">
                    <Phone size={14} className="text-gray-500" />
                    <Text size="2">{client.telephone}</Text>
                  </Flex> : null}
                {client.email ? <Flex align="center" gap="2">
                    <Mail size={14} className="text-gray-500" />
                    <Text size="2">{client.email}</Text>
                  </Flex> : null}
                {client.adresse ? <Flex align="center" gap="2">
                    <MapPin size={14} className="text-gray-500" />
                    <Text size="2">{client.adresse}</Text>
                  </Flex> : null}
              </Flex>
            </Card>

            {/* Statistiques resumees */}
            <Flex gap="3" mb="4" wrap="wrap">
              <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
                <Flex direction="column" align="center" gap="1">
                  <Flex align="center" gap="1">
                    <Wallet size={16} className="text-green-500" />
                    <Text
                      size="4"
                      weight="bold"
                      style={{ fontFamily: "var(--font-google-sans-code)" }}
                    >
                      {formatCurrency(client.soldePrepaye)}
                    </Text>
                  </Flex>
                  <Text size="1" color="gray">
                    Solde prepaye
                  </Text>
                </Flex>
              </Card>
              <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
                <Flex direction="column" align="center" gap="1">
                  <Flex align="center" gap="1">
                    <Star size={16} className="text-amber-500" />
                    <Text
                      size="4"
                      weight="bold"
                      style={{ fontFamily: "var(--font-google-sans-code)" }}
                    >
                      {client.pointsFidelite}
                    </Text>
                  </Flex>
                  <Text size="1" color="gray">
                    Points fidelite
                  </Text>
                </Flex>
              </Card>
              <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
                <Flex direction="column" align="center" gap="1">
                  <Flex align="center" gap="1">
                    <ShoppingBag size={16} style={{ color: "var(--accent-9)" }} />
                    <Text
                      size="4"
                      weight="bold"
                      style={{ fontFamily: "var(--font-google-sans-code)" }}
                    >
                      {client._count?.ventes || 0}
                    </Text>
                  </Flex>
                  <Text size="1" color="gray">
                    Achats
                  </Text>
                </Flex>
              </Card>
              {client.totalDepense !== undefined && (
                <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
                  <Flex direction="column" align="center" gap="1">
                    <Text
                      size="4"
                      weight="bold"
                     
                      style={{ fontFamily: "var(--font-google-sans-code)" }}
                    >
                      {formatCurrency(client.totalDepense)}
                    </Text>
                    <Text size="1" color="gray">
                      Total depense
                    </Text>
                  </Flex>
                </Card>
              )}
            </Flex>

            {/* Onglets */}
            <Tabs.Root defaultValue="prepaid">
              <Tabs.List>
                <Tabs.Trigger value="prepaid">
                  <Wallet size={14} />
                  Compte prepaye
                </Tabs.Trigger>
                <Tabs.Trigger value="loyalty">
                  <Star size={14} />
                  Fidelite
                </Tabs.Trigger>
                <Tabs.Trigger value="history">
                  <ShoppingBag size={14} />
                  Historique
                </Tabs.Trigger>
              </Tabs.List>

              <ScrollArea style={{ maxHeight: 400 }}>
                <Tabs.Content value="prepaid">
                  <PrepaidAccount
                    clientId={clientId!}
                    clientNom={getClientName()}
                    soldePrepaye={client.soldePrepaye}
                    transactions={prepaidHistory}
                    onRechargeSuccess={loadClientData}
                  />
                </Tabs.Content>

                <Tabs.Content value="loyalty">
                  <LoyaltyPoints
                    clientNom={getClientName()}
                    pointsFidelite={client.pointsFidelite}
                    transactions={fideliteHistory}
                  />
                </Tabs.Content>

                <Tabs.Content value="history">
                  <PurchaseHistory
                    clientNom={getClientName()}
                    ventes={achats.ventes}
                    pagination={achats.pagination}
                    stats={stats}
                    onPageChange={handlePageChange}
                  />
                </Tabs.Content>
              </ScrollArea>
            </Tabs.Root>

            {/* Actions */}
            <Flex gap="3" mt="5" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Fermer
                </Button>
              </Dialog.Close>
            </Flex>
          </>
        ) : (
          <Flex direction="column" align="center" gap="3" py="9">
            <User size={48} className="text-gray-400" />
            <Text size="3" color="gray">
              Client non trouve
            </Text>
            <Dialog.Close>
              <Button variant="soft">Fermer</Button>
            </Dialog.Close>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
