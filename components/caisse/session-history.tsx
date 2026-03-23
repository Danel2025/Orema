"use client";

/**
 * SessionHistory - Liste des sessions de caisse passees avec details
 * Utilise Radix UI Themes pour le styling
 */

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Card,
  Table,
  Badge,
  Button,
  Dialog,
  DataList,
  Separator,
  Skeleton,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  Calendar,
  Clock,
  User,
  Receipt,
  TrendUp,
  TrendDown,
  Money,
  CreditCard,
  DeviceMobile,
  Eye,
  CaretLeft,
  CaretRight,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { getSessionsHistory, generateRapportZ } from "@/actions/sessions";
import type { SessionHistoryItem, RapportZ } from "@/actions/sessions";

interface SessionHistoryProps {
  onRefresh?: () => void;
}

export function SessionHistory({ onRefresh }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionHistoryItem | null>(null);
  const [rapportZ, setRapportZ] = useState<RapportZ | null>(null);
  const [isLoadingRapport, setIsLoadingRapport] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Charger l'historique
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getSessionsHistory(50);
      setSessions(data);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger le rapport Z pour une session
  const loadRapportZ = async (sessionId: string) => {
    setIsLoadingRapport(true);
    try {
      const rapport = await generateRapportZ(sessionId);
      setRapportZ(rapport);
    } catch (error) {
      console.error("Erreur chargement rapport:", error);
    } finally {
      setIsLoadingRapport(false);
    }
  };

  const handleViewDetails = (session: SessionHistoryItem) => {
    setSelectedSession(session);
    loadRapportZ(session.id);
  };

  // Pagination
  const paginatedSessions = sessions.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sessions.length / pageSize);

  // Calcul de la duree
  const getDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <Card>
        <Flex direction="column" gap="3">
          <Skeleton height="40px" />
          <Skeleton height="200px" />
        </Flex>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <Flex direction="column" align="center" gap="3" py="6">
          <Receipt size={48} color="var(--gray-8)" />
          <Text size="3" color="gray">
            Aucune session de caisse cloturee
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Flex justify="between" align="center" mb="4">
          <Text size="4" weight="bold">
            Historique des sessions
          </Text>
          <Button variant="soft" color="gray" size="1" onClick={loadHistory}>
            Actualiser
          </Button>
        </Flex>

        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Caissier</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Duree</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Ventes</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Ecart</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {paginatedSessions.map((session) => (
              <Table.Row key={session.id}>
                <Table.Cell>
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      {formatDate(session.dateCloture, "short")}
                    </Text>
                    <Text size="1" color="gray">
                      {formatTime(new Date(session.dateOuverture))} -{" "}
                      {formatTime(new Date(session.dateCloture))}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Flex align="center" gap="2">
                    <User size={14} color="var(--gray-10)" />
                    <Text size="2">
                      {session.utilisateur.prenom} {session.utilisateur.nom}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Badge color="gray" size="1">
                    {getDuration(session.dateOuverture, session.dateCloture)}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Flex align="center" gap="2">
                    <Badge color="blue" size="1">
                      {session.nombreVentes}
                    </Badge>
                    {session.nombreAnnulations > 0 && (
                      <Badge color="red" size="1" variant="soft">
                        -{session.nombreAnnulations}
                      </Badge>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      color: "var(--green-11)",
                      fontFamily: "var(--font-google-sans-code), monospace",
                    }}
                  >
                    {formatCurrency(session.totalVentes)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  {session.ecart !== null && (
                    <Flex align="center" gap="1">
                      {session.ecart === 0 ? (
                        <CheckCircle size={14} color="var(--green-10)" />
                      ) : session.ecart > 0 ? (
                        <TrendUp size={14} color="var(--blue-10)" />
                      ) : (
                        <TrendDown size={14} color="var(--red-10)" />
                      )}
                      <Text
                        size="2"
                        style={{
                          color:
                            session.ecart === 0
                              ? "var(--green-11)"
                              : session.ecart > 0
                                ? "var(--blue-11)"
                                : "var(--red-11)",
                          fontFamily: "var(--font-google-sans-code), monospace",
                        }}
                      >
                        {session.ecart >= 0 ? "+" : ""}
                        {formatCurrency(session.ecart)}
                      </Text>
                    </Flex>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Button variant="ghost" size="1" onClick={() => handleViewDetails(session)}>
                    <Eye size={14} />
                    Details
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="between" align="center" mt="4">
            <Text size="2" color="gray">
              Page {page + 1} sur {totalPages} ({sessions.length} sessions)
            </Text>
            <Flex gap="2">
              <Button
                variant="soft"
                color="gray"
                size="1"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <CaretLeft size={14} />
                Precedent
              </Button>
              <Button
                variant="soft"
                color="gray"
                size="1"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Suivant
                <CaretRight size={14} />
              </Button>
            </Flex>
          </Flex>
        )}
      </Card>

      {/* Dialog details session / Rapport Z */}
      <Dialog.Root
        open={selectedSession !== null}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      >
        <Dialog.Content maxWidth="600px">
          <Dialog.Title>
            Rapport Z - {selectedSession ? formatDate(selectedSession.dateCloture, "long") : null}
          </Dialog.Title>
          <Dialog.Description size="2" color="gray" mb="4">
            Details de la session de caisse
          </Dialog.Description>

          {isLoadingRapport ? (
            <Flex direction="column" gap="3">
              <Skeleton height="100px" />
              <Skeleton height="150px" />
              <Skeleton height="100px" />
            </Flex>
          ) : rapportZ ? (
            <ScrollArea style={{ maxHeight: "60vh" }}>
              <Flex direction="column" gap="4">
                {/* Infos session */}
                <Card variant="surface">
                  <Flex wrap="wrap" gap="4">
                    <Flex align="center" gap="2">
                      <User size={16} color="var(--gray-10)" />
                      <Text size="2">
                        {rapportZ.session.utilisateur.prenom} {rapportZ.session.utilisateur.nom}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Calendar size={16} color="var(--gray-10)" />
                      <Text size="2">{formatDate(rapportZ.session.dateCloture, "short")}</Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Clock size={16} color="var(--gray-10)" />
                      <Text size="2">
                        {formatTime(new Date(rapportZ.session.dateOuverture))} -{" "}
                        {formatTime(new Date(rapportZ.session.dateCloture))}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>

                {/* Stats ventes */}
                <Card>
                  <Text size="3" weight="bold" mb="3">
                    Ventes
                  </Text>
                  <DataList.Root size="2">
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Total des ventes</DataList.Label>
                      <DataList.Value>
                        <Text
                          weight="bold"
                          style={{
                            color: "var(--green-11)",
                            fontFamily: "var(--font-google-sans-code), monospace",
                          }}
                        >
                          {formatCurrency(rapportZ.ventes.totalVentes)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Nombre de ventes</DataList.Label>
                      <DataList.Value>
                        <Badge color="blue">{rapportZ.ventes.nombreVentes}</Badge>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Articles vendus</DataList.Label>
                      <DataList.Value>{rapportZ.ventes.articlesVendus}</DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Panier moyen</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.ventes.panierMoyen)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    {rapportZ.ventes.nombreAnnulations > 0 && (
                      <DataList.Item>
                        <DataList.Label minWidth="140px">Annulations</DataList.Label>
                        <DataList.Value>
                          <Badge color="red">{rapportZ.ventes.nombreAnnulations}</Badge>
                        </DataList.Value>
                      </DataList.Item>
                    )}
                  </DataList.Root>
                </Card>

                {/* Paiements */}
                <Card>
                  <Text size="3" weight="bold" mb="3">
                    Paiements
                  </Text>
                  <DataList.Root size="2">
                    <DataList.Item>
                      <DataList.Label minWidth="140px">
                        <Flex align="center" gap="2">
                          <Money size={14} color="var(--green-10)" />
                          Especes
                        </Flex>
                      </DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.paiements.especes)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">
                        <Flex align="center" gap="2">
                          <CreditCard size={14} color="var(--blue-10)" />
                          Cartes
                        </Flex>
                      </DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.paiements.cartes)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">
                        <Flex align="center" gap="2">
                          <DeviceMobile size={14} color="var(--accent-10)" />
                          Mobile Money
                        </Flex>
                      </DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.paiements.mobileMoney)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    {rapportZ.paiements.autres > 0 && (
                      <DataList.Item>
                        <DataList.Label minWidth="140px">Autres</DataList.Label>
                        <DataList.Value>
                          <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                            {formatCurrency(rapportZ.paiements.autres)}
                          </Text>
                        </DataList.Value>
                      </DataList.Item>
                    )}
                  </DataList.Root>
                </Card>

                {/* Caisse */}
                <Card
                  style={{
                    backgroundColor:
                      rapportZ.caisse.ecart === 0
                        ? "var(--green-a2)"
                        : rapportZ.caisse.ecart > 0
                          ? "var(--blue-a2)"
                          : "var(--red-a2)",
                  }}
                >
                  <Text size="3" weight="bold" mb="3">
                    Caisse
                  </Text>
                  <DataList.Root size="2">
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Fond de caisse</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.caisse.fondCaisse)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Especes attendues</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.caisse.especesAttendues)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Especes comptees</DataList.Label>
                      <DataList.Value>
                        <Text
                          weight="bold"
                          style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                        >
                          {formatCurrency(rapportZ.caisse.especesComptees)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Ecart</DataList.Label>
                      <DataList.Value>
                        <Flex align="center" gap="2">
                          {rapportZ.caisse.ecart === 0 ? (
                            <CheckCircle size={16} color="var(--green-10)" />
                          ) : rapportZ.caisse.ecart > 0 ? (
                            <TrendUp size={16} color="var(--blue-10)" />
                          ) : (
                            <TrendDown size={16} color="var(--red-10)" />
                          )}
                          <Text
                            weight="bold"
                            style={{
                              color:
                                rapportZ.caisse.ecart === 0
                                  ? "var(--green-11)"
                                  : rapportZ.caisse.ecart > 0
                                    ? "var(--blue-11)"
                                    : "var(--red-11)",
                              fontFamily: "var(--font-google-sans-code), monospace",
                            }}
                          >
                            {rapportZ.caisse.ecart >= 0 ? "+" : ""}
                            {formatCurrency(rapportZ.caisse.ecart)}
                          </Text>
                        </Flex>
                      </DataList.Value>
                    </DataList.Item>
                  </DataList.Root>
                </Card>

                {/* TVA */}
                <Card>
                  <Text size="3" weight="bold" mb="3">
                    TVA
                  </Text>
                  <DataList.Root size="2">
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Total HT</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.tva.totalHT)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">TVA collectee</DataList.Label>
                      <DataList.Value>
                        <Text style={{ fontFamily: "var(--font-google-sans-code), monospace" }}>
                          {formatCurrency(rapportZ.tva.totalTVA)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.Label minWidth="140px">Total TTC</DataList.Label>
                      <DataList.Value>
                        <Text
                          weight="bold"
                          style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                        >
                          {formatCurrency(rapportZ.tva.totalTTC)}
                        </Text>
                      </DataList.Value>
                    </DataList.Item>
                  </DataList.Root>
                </Card>

                {/* Top produits */}
                {rapportZ.topProduits.length > 0 && (
                  <Card>
                    <Text size="3" weight="bold" mb="3">
                      Top produits
                    </Text>
                    <Flex direction="column" gap="2">
                      {rapportZ.topProduits.slice(0, 5).map((produit, index) => (
                        <Flex key={index} justify="between" align="center">
                          <Flex align="center" gap="2">
                            <Badge color="gray" size="1">
                              {index + 1}
                            </Badge>
                            <Text size="2">{produit.nom}</Text>
                          </Flex>
                          <Flex align="center" gap="3">
                            <Badge color="blue" size="1">
                              x{produit.quantite}
                            </Badge>
                            <Text
                              size="2"
                              style={{ fontFamily: "var(--font-google-sans-code), monospace" }}
                            >
                              {formatCurrency(produit.total)}
                            </Text>
                          </Flex>
                        </Flex>
                      ))}
                    </Flex>
                  </Card>
                )}
              </Flex>
            </ScrollArea>
          ) : (
            <Flex direction="column" align="center" gap="3" py="6">
              <Warning size={32} color="var(--red-9)" />
              <Text color="red">Impossible de charger le rapport</Text>
            </Flex>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Fermer
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
