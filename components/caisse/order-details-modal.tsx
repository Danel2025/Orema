"use client";

/**
 * OrderDetailsModal - Modal affichant les détails d'une commande en attente
 */

import {
  Dialog,
  Flex,
  Text,
  Button,
  Badge,
  Box,
  Separator,
  ScrollArea,
  Table,
} from "@radix-ui/themes";
import {
  Receipt,
  ForkKnife,
  Truck,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  X,
  Timer,
  CookingPot,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import type { StatutPreparation } from "@/lib/db/types";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

interface OrderLine {
  id: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  notes?: string | null;
  produit: { id: string; nom: string };
  supplements?: Array<{ id: string; nom: string; prix: number }>;
  statut_preparation?: StatutPreparation | null;
  updated_at?: string | null;
}

interface OrderDetails {
  id: string;
  numeroTicket: string;
  type: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
  sousTotal: number;
  totalTva: number;
  totalRemise: number;
  totalFinal: number;
  typeRemise?: "POURCENTAGE" | "MONTANT_FIXE" | null;
  valeurRemise?: number | null;
  createdAt: Date | string;
  adresseLivraison?: string | null;
  notes?: string | null;
  lignes: OrderLine[];
  table?: { id: string; numero: string; zone?: { nom: string } | null } | null;
  client?: { id: string; nom: string; prenom?: string | null; telephone?: string | null } | null;
  utilisateur: { nom: string; prenom?: string | null };
}

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetails | null;
  onPayer?: () => void;
}

export function OrderDetailsModal({ open, onOpenChange, order, onPayer }: OrderDetailsModalProps) {
  if (!order) return null;

  const createdAt =
    typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TABLE":
        return <ForkKnife size={16} />;
      case "LIVRAISON":
        return <Truck size={16} />;
      case "EMPORTER":
        return <ShoppingBag size={16} />;
      default:
        return <Receipt size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TABLE":
        return "Service à table";
      case "LIVRAISON":
        return "Livraison";
      case "EMPORTER":
        return "À emporter";
      default:
        return "Vente directe";
    }
  };

  const getTypeColor = (type: string): "blue" | "green" | "violet" | "gray" => {
    switch (type) {
      case "TABLE":
        return "blue";
      case "LIVRAISON":
        return "green";
      case "EMPORTER":
        return "violet";
      default:
        return "gray";
    }
  };

  const getPreparationConfig = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return { color: "amber" as const, label: "En attente", icon: <Timer size={12} weight="bold" /> };
      case "EN_PREPARATION":
        return { color: "blue" as const, label: "En préparation", icon: <CookingPot size={12} weight="bold" /> };
      case "PRETE":
        return { color: "green" as const, label: "Prête", icon: <CheckCircle size={12} weight="bold" /> };
      case "SERVIE":
        return { color: "gray" as const, label: "Servie", icon: <ArrowRight size={12} weight="bold" /> };
      default:
        return { color: "gray" as const, label: statut, icon: null };
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="600px" style={{ maxHeight: "85vh" }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Receipt size={20} />
            Commande #{order.numeroTicket}
          </Flex>
        </Dialog.Title>

        <ScrollArea style={{ maxHeight: "calc(85vh - 150px)" }}>
          {/* En-tête avec type et infos */}
          <Flex gap="3" mb="4" wrap="wrap">
            <Badge color={getTypeColor(order.type)} size="2">
              {getTypeIcon(order.type)}
              <Text ml="1">{getTypeLabel(order.type)}</Text>
            </Badge>

            {order.table ? (
              <Badge color="blue" variant="soft" size="2">
                <ForkKnife size={14} />
                <Text ml="1">Table {order.table.numero}</Text>
                {order.table.zone ? (
                  <Text color="gray" ml="1">
                    ({order.table.zone.nom})
                  </Text>
                ) : null}
              </Badge>
            ) : null}

            <Badge color="gray" variant="soft" size="2">
              <Clock size={14} />
              <Text ml="1">
                {format(createdAt, "HH:mm", { locale: fr })} (il y a{" "}
                {formatDistanceToNow(createdAt, { locale: fr })})
              </Text>
            </Badge>
          </Flex>

          {/* Client */}
          {order.client ? (
            <Box mb="4" p="3" style={{ backgroundColor: "var(--gray-a2)", borderRadius: 8 }}>
              <Flex align="center" gap="2" mb="2">
                <User size={16} color="var(--gray-11)" />
                <Text weight="medium">
                  {order.client.nom}
                  {order.client.prenom ? ` ${order.client.prenom}` : null}
                </Text>
              </Flex>
              {order.client.telephone ? (
                <Flex align="center" gap="2">
                  <Phone size={14} color="var(--gray-9)" />
                  <Text size="2" color="gray">
                    {order.client.telephone}
                  </Text>
                </Flex>
              ) : null}
            </Box>
          ) : null}

          {/* Adresse livraison */}
          {order.adresseLivraison ? (
            <Box mb="4" p="3" style={{ backgroundColor: "var(--green-a2)", borderRadius: 8 }}>
              <Flex align="start" gap="2">
                <MapPin size={16} color="var(--green-11)" style={{ marginTop: 2 }} />
                <Text size="2">{order.adresseLivraison}</Text>
              </Flex>
            </Box>
          ) : null}

          <Separator size="4" mb="4" />

          {/* Liste des articles */}
          <Text size="2" weight="medium" mb="2" as="p">
            Articles ({order.lignes.reduce((acc, l) => acc + l.quantite, 0)})
          </Text>

          <Table.Root variant="surface" mb="4">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Qté</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">P.U.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {order.lignes.map((ligne) => {
                const statutPrep = ligne.statut_preparation || "EN_ATTENTE";
                const prepConfig = getPreparationConfig(statutPrep);
                const isPrete = statutPrep === "PRETE";
                return (
                  <Table.Row key={ligne.id}>
                    <Table.Cell>
                      <Text size="2">{ligne.produit.nom}</Text>
                      {ligne.supplements && ligne.supplements.length > 0 ? (
                        <Text size="1" color="gray" as="p">
                          + {ligne.supplements.map((s) => s.nom).join(", ")}
                        </Text>
                      ) : null}
                      {ligne.notes ? (
                        <Text size="1" color="violet" as="p" style={{ fontStyle: "italic" }}>
                          {ligne.notes}
                        </Text>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Flex direction="column" align="center" gap="1">
                        <Badge
                          color={prepConfig.color}
                          variant="soft"
                          size="1"
                          style={isPrete ? {
                            animation: "pulse-preparation 2s ease-in-out infinite",
                          } : undefined}
                        >
                          {prepConfig.icon}
                          <Text size="1" ml="1">{prepConfig.label}</Text>
                        </Badge>
                        {ligne.updated_at ? (
                          <Text size="1" color="gray">
                            {format(new Date(ligne.updated_at), "HH:mm", { locale: fr })}
                          </Text>
                        ) : null}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Text size="2">{ligne.quantite}</Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Text size="2">{formatCurrency(ligne.prixUnitaire)}</Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Text size="2" weight="medium">
                        {formatCurrency(ligne.total)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>

          <Separator size="4" mb="4" />

          {/* Totaux */}
          <Box style={{ backgroundColor: "var(--gray-a2)", borderRadius: 8, padding: 16 }}>
            <Flex justify="between" mb="2">
              <Text size="2" color="gray">
                Sous-total
              </Text>
              <Text size="2">{formatCurrency(order.sousTotal)}</Text>
            </Flex>

            <Flex justify="between" mb="2">
              <Text size="2" color="gray">
                TVA
              </Text>
              <Text size="2">{formatCurrency(order.totalTva)}</Text>
            </Flex>

            {order.totalRemise > 0 && (
              <Flex justify="between" mb="2">
                <Text size="2" color="gray">
                  Remise
                  {order.typeRemise === "POURCENTAGE" && order.valeurRemise ? (
                    <Text color="green"> (-{order.valeurRemise}%)</Text>
                  ) : null}
                </Text>
                <Text size="2" color="green">
                  -{formatCurrency(order.totalRemise)}
                </Text>
              </Flex>
            )}

            <Separator size="4" my="2" />

            <Flex justify="between">
              <Text size="3" weight="bold">
                Total à payer
              </Text>
              <Text size="4" weight="bold" color="violet">
                {formatCurrency(order.totalFinal)}
              </Text>
            </Flex>
          </Box>

          {/* Notes */}
          {order.notes ? (
            <Box mt="4" p="3" style={{ backgroundColor: "var(--purple-a2)", borderRadius: 8 }}>
              <Text size="2" color="amber">
                <strong>Notes:</strong> {order.notes}
              </Text>
            </Box>
          ) : null}

          {/* Serveur */}
          <Text size="1" color="gray" mt="4" as="p">
            Serveur: {order.utilisateur.prenom} {order.utilisateur.nom}
          </Text>
        </ScrollArea>

        <Separator size="4" my="4" />

        <Flex justify="between" gap="3">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              <X size={14} />
              Fermer
            </Button>
          </Dialog.Close>

          {onPayer ? (
            <Button color="green" onClick={onPayer}>
              <CreditCard size={14} />
              Payer cette commande
            </Button>
          ) : null}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
