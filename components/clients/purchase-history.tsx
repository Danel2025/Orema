"use client";

/**
 * PurchaseHistory - Composant pour afficher l'historique des achats d'un client
 */

import { useState } from "react";
import { Card, Flex, Text, Badge, Button, Separator, Table, Dialog } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  ShoppingBag,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Package,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PurchaseLine {
  produit: {
    nom: string;
  };
  quantite: number;
  total: number;
}

interface Purchase {
  id: string;
  numeroTicket: string;
  type: string;
  totalFinal: number;
  createdAt: Date;
  lignes: PurchaseLine[];
}

interface ProductPreference {
  produitId: string;
  nom: string;
  quantiteTotale: number;
  totalDepense: number;
}

interface PurchaseHistoryProps {
  clientNom: string;
  ventes: Purchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: {
    totalDepense: number;
    nombreAchats: number;
    panierMoyen: number;
    produitsPreference: ProductPreference[];
  };
  onPageChange?: (page: number) => void;
}

// Mapping des types de vente
const TYPE_VENTE_LABELS: Record<string, string> = {
  DIRECT: "Vente directe",
  TABLE: "Service table",
  LIVRAISON: "Livraison",
  EMPORTER: "A emporter",
};

const TYPE_VENTE_COLORS: Record<string, "violet" | "blue" | "green" | "purple"> = {
  DIRECT: "violet",
  TABLE: "blue",
  LIVRAISON: "green",
  EMPORTER: "purple",
};

export function PurchaseHistory({
  clientNom,
  ventes,
  pagination,
  stats,
  onPageChange,
}: PurchaseHistoryProps) {
  const [selectedVente, setSelectedVente] = useState<Purchase | null>(null);

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <ShoppingBag size={20} style={{ color: "var(--accent-9)" }} />
            <Text size="3" weight="medium">
              Historique des achats
            </Text>
          </Flex>
          <Badge size="2" variant="soft">
            {pagination.total} achats
          </Badge>
        </Flex>

        {/* Statistiques */}
        {stats ? (
          <Flex gap="3" wrap="wrap">
            <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold" style={{ fontFamily: "var(--font-google-sans-code)" }}>
                  {formatCurrency(stats.totalDepense)}
                </Text>
                <Text size="1" color="gray">
                  Total depense
                </Text>
              </Flex>
            </Card>
            <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold" style={{ fontFamily: "var(--font-google-sans-code)" }}>
                  {stats.nombreAchats}
                </Text>
                <Text size="1" color="gray">
                  Achats
                </Text>
              </Flex>
            </Card>
            <Card variant="surface" style={{ flex: 1, minWidth: 120 }}>
              <Flex direction="column" align="center" gap="1">
                <Text size="4" weight="bold" style={{ fontFamily: "var(--font-google-sans-code)" }}>
                  {formatCurrency(stats.panierMoyen)}
                </Text>
                <Text size="1" color="gray">
                  Panier moyen
                </Text>
              </Flex>
            </Card>
          </Flex>
        ) : null}

        {/* Produits preferes */}
        {stats && stats.produitsPreference.length > 0 ? (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <TrendingUp size={16} className="text-green-500" />
                <Text size="2" weight="medium" color="gray">
                  Produits preferes
                </Text>
              </Flex>
              <Flex gap="2" wrap="wrap">
                {stats.produitsPreference.map((p, index) => (
                  <Badge
                    key={p.produitId}
                    size="2"
                    variant="soft"
                    color={index === 0 ? "violet" : "gray"}
                  >
                    <Package size={12} />
                    {p.nom} ({p.quantiteTotale}x)
                  </Badge>
                ))}
              </Flex>
            </Flex>
          </>
        ) : null}

        <Separator size="4" />

        {/* Liste des achats */}
        {ventes.length > 0 ? (
          <>
            <ScrollArea style={{ maxHeight: 400 }}>
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ticket</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Montant</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="center">Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {ventes.map((vente) => (
                    <Table.Row key={vente.id}>
                      <Table.Cell>
                        <Text size="2">{formatDate(vente.createdAt)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" style={{ fontFamily: "var(--font-google-sans-code)" }}>
                          #{vente.numeroTicket}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          size="1"
                          color={TYPE_VENTE_COLORS[vente.type] || "gray"}
                          variant="soft"
                        >
                          {TYPE_VENTE_LABELS[vente.type] || vente.type}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text
                          size="2"
                          weight="medium"
                          style={{ fontFamily: "var(--font-google-sans-code)" }}
                        >
                          {formatCurrency(vente.totalFinal)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Button variant="ghost" size="1" onClick={() => setSelectedVente(vente)}>
                          <Eye size={14} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </ScrollArea>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Flex justify="between" align="center" pt="2">
                <Text size="2" color="gray">
                  Page {pagination.page} sur {pagination.totalPages}
                </Text>
                <Flex gap="2">
                  <Button
                    variant="soft"
                    size="1"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange?.(pagination.page - 1)}
                  >
                    <ChevronLeft size={14} />
                    Precedent
                  </Button>
                  <Button
                    variant="soft"
                    size="1"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange?.(pagination.page + 1)}
                  >
                    Suivant
                    <ChevronRight size={14} />
                  </Button>
                </Flex>
              </Flex>
            )}
          </>
        ) : (
          <Flex direction="column" align="center" gap="2" py="6" style={{ color: "var(--gray-9)" }}>
            <Receipt size={32} />
            <Text size="2" color="gray">
              Aucun achat enregistre
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Modal detail d'une vente */}
      <Dialog.Root open={!!selectedVente} onOpenChange={(open) => !open && setSelectedVente(null)}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Detail du ticket</Dialog.Title>
          {selectedVente ? (
            <>
              <Dialog.Description size="2" color="gray" mb="4">
                Ticket #{selectedVente.numeroTicket} du{" "}
                {formatDate(selectedVente.createdAt, "datetime")}
              </Dialog.Description>

              <Flex direction="column" gap="3">
                {/* Type de vente */}
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">
                    Type
                  </Text>
                  <Badge color={TYPE_VENTE_COLORS[selectedVente.type] || "gray"} variant="soft">
                    {TYPE_VENTE_LABELS[selectedVente.type] || selectedVente.type}
                  </Badge>
                </Flex>

                <Separator size="4" />

                {/* Lignes de la vente */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    Articles
                  </Text>
                  {selectedVente.lignes.map((ligne, index) => (
                    <Flex key={index} justify="between" align="center">
                      <Flex align="center" gap="2">
                        <Badge size="1" variant="outline">
                          {ligne.quantite}x
                        </Badge>
                        <Text size="2">{ligne.produit.nom}</Text>
                      </Flex>
                      <Text size="2" style={{ fontFamily: "var(--font-google-sans-code)" }}>
                        {formatCurrency(ligne.total)}
                      </Text>
                    </Flex>
                  ))}
                </Flex>

                <Separator size="4" />

                {/* Total */}
                <Flex justify="between" align="center">
                  <Text size="3" weight="bold">
                    Total
                  </Text>
                  <Text
                    size="3"
                    weight="bold"
                    style={{ fontFamily: "var(--font-google-sans-code)" }}
                  >
                    {formatCurrency(selectedVente.totalFinal)}
                  </Text>
                </Flex>
              </Flex>
            </>
          ) : null}

          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Fermer
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}
