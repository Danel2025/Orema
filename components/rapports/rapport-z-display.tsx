"use client";

/**
 * RapportZDisplay - Affichage du rapport Z de cloture de caisse
 * Affiche les details complets d'une session de caisse cloturee
 * Utilise genererRapportZAction pour les donnees completes
 */

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Flex,
  Text,
  Table,
  Badge,
  Skeleton,
  Separator,
  Dialog,
  Button,
  Callout,
} from "@radix-ui/themes";
import {
  FileText,
  Calendar,
  User,
  Clock,
  Wallet,
  CreditCard,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Eye,
  Printer,
  TrendingUp,
} from "lucide-react";
import {
  genererRapportZAction,
  getClosedSessions,
  type RapportZComplet,
} from "@/actions/rapports";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

interface Session {
  id: string;
  dateOuverture: Date | string;
  dateCloture: Date | string;
  fondCaisse: number;
  totalVentes: number;
  totalEspeces: number;
  totalCartes: number;
  totalMobileMoney: number;
  nombreVentes: number;
  nombreAnnulations: number;
  especesComptees: number | null;
  ecart: number | null;
  notesCloture: string | null;
  utilisateur: {
    nom: string;
    prenom: string | null;
  };
}

interface RapportZDisplayProps {
  initialSessions?: Session[];
}

export function RapportZDisplay({ initialSessions }: RapportZDisplayProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions || []);
  const [isLoading, setIsLoading] = useState(!initialSessions);
  const [rapportZ, setRapportZ] = useState<RapportZComplet | null>(null);
  const [isLoadingRapport, setIsLoadingRapport] = useState(false);
  const [rapportError, setRapportError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      try {
        const result = await getClosedSessions(10);
        setSessions(result as Session[]);
      } catch (error) {
        console.error("Erreur chargement sessions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!initialSessions) {
      fetchSessions();
    }
  }, [initialSessions]);

  const handleViewRapport = async (sessionId: string) => {
    setIsLoadingRapport(true);
    setRapportError(null);
    setRapportZ(null);
    try {
      const result = await genererRapportZAction(sessionId);
      if (result.success && result.data) {
        setRapportZ(result.data);
      } else {
        setRapportError(result.error || "Erreur de generation");
      }
    } catch (error) {
      console.error("Erreur generation rapport Z:", error);
      setRapportError("Erreur lors de la generation du rapport");
    } finally {
      setIsLoadingRapport(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <FileText size={20} style={{ color: "var(--purple-9)" }} />
            <Text size="4" weight="bold">
              Rapports Z
            </Text>
          </Flex>
        </Flex>
        <Box>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="64px" mb="2" />
          ))}
        </Box>
      </Card>
    );
  }

  return (
    <Card size="3">
      <Flex justify="between" align="center" mb="4">
        <Flex align="center" gap="2">
          <FileText size={20} style={{ color: "var(--purple-9)" }} />
          <Text size="4" weight="bold">
            Rapports Z (Sessions cloturees)
          </Text>
        </Flex>
        <Badge color="gray" variant="soft">
          {sessions.length} sessions
        </Badge>
      </Flex>

      {sessions.length === 0 ? (
        <Flex align="center" justify="center" style={{ height: 200 }}>
          <Text size="3" color="gray">
            Aucune session cloturee
          </Text>
        </Flex>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Caissier</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">
                Ventes
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">CA</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">
                Ecart
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="center">
                Actions
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {sessions.map((session) => (
              <Table.Row key={session.id}>
                <Table.RowHeaderCell>
                  <Flex direction="column" gap="1">
                    <Flex align="center" gap="1">
                      <Calendar size={12} />
                      <Text size="2" weight="medium">
                        {formatDate(session.dateCloture, "short")}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="1">
                      <Clock size={12} />
                      <Text size="1" color="gray">
                        {formatTime(session.dateOuverture)} -{" "}
                        {formatTime(session.dateCloture)}
                      </Text>
                    </Flex>
                  </Flex>
                </Table.RowHeaderCell>
                <Table.Cell>
                  <Flex align="center" gap="1">
                    <User size={14} />
                    <Text size="2">
                      {session.utilisateur.prenom} {session.utilisateur.nom}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell align="right">
                  <Badge variant="soft" color="gray">
                    {session.nombreVentes}
                  </Badge>
                </Table.Cell>
                <Table.Cell align="right">
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(session.totalVentes)}
                  </Text>
                </Table.Cell>
                <Table.Cell align="right">
                  {session.ecart !== null && (
                    <Flex align="center" gap="1" justify="end">
                      {session.ecart === 0 ? (
                        <CheckCircle
                          size={14}
                          style={{ color: "var(--green-9)" }}
                        />
                      ) : (
                        <AlertTriangle
                          size={14}
                          style={{
                            color:
                              session.ecart > 0
                                ? "var(--blue-9)"
                                : "var(--red-9)",
                          }}
                        />
                      )}
                      <Text
                        size="2"
                        weight="medium"
                        style={{
                          fontFamily:
                            "var(--font-google-sans-code), ui-monospace, monospace",
                          color:
                            session.ecart === 0
                              ? "var(--green-9)"
                              : session.ecart > 0
                                ? "var(--blue-9)"
                                : "var(--red-9)",
                        }}
                      >
                        {session.ecart > 0 ? "+" : ""}
                        {formatCurrency(session.ecart)}
                      </Text>
                    </Flex>
                  )}
                </Table.Cell>
                <Table.Cell align="center">
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <Button
                        variant="ghost"
                        size="1"
                        onClick={() => handleViewRapport(session.id)}
                      >
                        <Eye size={16} />
                        Voir
                      </Button>
                    </Dialog.Trigger>

                    <Dialog.Content maxWidth="650px">
                      <Dialog.Title>
                        <Flex align="center" gap="2">
                          <FileText size={20} />
                          Rapport Z
                        </Flex>
                      </Dialog.Title>
                      <Dialog.Description size="2" color="gray">
                        Session du{" "}
                        {formatDate(session.dateCloture, "long")}
                      </Dialog.Description>

                      {isLoadingRapport ? (
                        <Box py="6">
                          <Flex direction="column" gap="3">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton
                                key={i}
                                width="100%"
                                height="40px"
                              />
                            ))}
                          </Flex>
                        </Box>
                      ) : rapportError ? (
                        <Box py="6">
                          <Callout.Root color="red">
                            <Callout.Icon>
                              <AlertTriangle size={16} />
                            </Callout.Icon>
                            <Callout.Text>{rapportError}</Callout.Text>
                          </Callout.Root>
                        </Box>
                      ) : rapportZ ? (
                        <Box py="4">
                          {/* Infos session */}
                          <Box
                            mb="4"
                            style={{
                              padding: 16,
                              borderRadius: 8,
                              backgroundColor: "var(--gray-a2)",
                            }}
                          >
                            <Flex justify="between" wrap="wrap" gap="3">
                              <Box>
                                <Text size="1" color="gray">
                                  Caissier
                                </Text>
                                <Text
                                  size="2"
                                  weight="medium"
                                  style={{ display: "block" }}
                                >
                                  {rapportZ.session.caissierNom}
                                </Text>
                              </Box>
                              <Box>
                                <Text size="1" color="gray">
                                  Ouverture
                                </Text>
                                <Text
                                  size="2"
                                  weight="medium"
                                  style={{ display: "block" }}
                                >
                                  {formatTime(rapportZ.session.dateOuverture)}
                                </Text>
                              </Box>
                              <Box>
                                <Text size="1" color="gray">
                                  Cloture
                                </Text>
                                <Text
                                  size="2"
                                  weight="medium"
                                  style={{ display: "block" }}
                                >
                                  {formatTime(rapportZ.session.dateCloture)}
                                </Text>
                              </Box>
                            </Flex>
                          </Box>

                          {/* Resume ventes */}
                          <Text size="3" weight="bold" mb="2">
                            Resume des ventes
                          </Text>
                          <Table.Root size="1" mb="4">
                            <Table.Body>
                              <Table.Row>
                                <Table.Cell>Nombre de ventes</Table.Cell>
                                <Table.Cell align="right">
                                  {rapportZ.ventes.nombreVentes}
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Articles vendus</Table.Cell>
                                <Table.Cell align="right">
                                  {rapportZ.ventes.articlesVendus}
                                </Table.Cell>
                              </Table.Row>
                              <Table.Row>
                                <Table.Cell>Panier moyen</Table.Cell>
                                <Table.Cell align="right">
                                  {formatCurrency(rapportZ.ventes.panierMoyen)}
                                </Table.Cell>
                              </Table.Row>
                              {rapportZ.ventes.nombreAnnulations > 0 && (
                                <Table.Row>
                                  <Table.Cell>Annulations</Table.Cell>
                                  <Table.Cell align="right">
                                    <Text color="red">
                                      {rapportZ.ventes.nombreAnnulations}
                                    </Text>
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              <Table.Row>
                                <Table.Cell>
                                  <Text weight="bold">Total ventes</Text>
                                </Table.Cell>
                                <Table.Cell align="right">
                                  <Text weight="bold">
                                    {formatCurrency(
                                      rapportZ.ventes.totalVentes
                                    )}
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                            </Table.Body>
                          </Table.Root>

                          <Separator size="4" mb="4" />

                          {/* Paiements */}
                          <Text size="3" weight="bold" mb="2">
                            Encaissements par mode
                          </Text>
                          <Table.Root size="1" mb="4">
                            <Table.Body>
                              {rapportZ.paiements.especes > 0 && (
                                <Table.Row>
                                  <Table.Cell>
                                    <Flex align="center" gap="2">
                                      <Wallet size={14} />
                                      Especes
                                    </Flex>
                                  </Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(rapportZ.paiements.especes)}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              {rapportZ.paiements.cartes > 0 && (
                                <Table.Row>
                                  <Table.Cell>
                                    <Flex align="center" gap="2">
                                      <CreditCard size={14} />
                                      Cartes
                                    </Flex>
                                  </Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(rapportZ.paiements.cartes)}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              {rapportZ.paiements.mobileMoney > 0 && (
                                <Table.Row>
                                  <Table.Cell>
                                    <Flex align="center" gap="2">
                                      <Smartphone size={14} />
                                      Mobile Money
                                    </Flex>
                                  </Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(
                                      rapportZ.paiements.mobileMoney
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              {rapportZ.paiements.cheques > 0 && (
                                <Table.Row>
                                  <Table.Cell>Cheques</Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(
                                      rapportZ.paiements.cheques
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              {rapportZ.paiements.virements > 0 && (
                                <Table.Row>
                                  <Table.Cell>Virements</Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(
                                      rapportZ.paiements.virements
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              {rapportZ.paiements.compteClient > 0 && (
                                <Table.Row>
                                  <Table.Cell>Compte client</Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(
                                      rapportZ.paiements.compteClient
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              {rapportZ.paiements.autres > 0 && (
                                <Table.Row>
                                  <Table.Cell>Autres</Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(rapportZ.paiements.autres)}
                                  </Table.Cell>
                                </Table.Row>
                              )}
                              <Table.Row>
                                <Table.Cell>
                                  <Text weight="bold">Total</Text>
                                </Table.Cell>
                                <Table.Cell align="right">
                                  <Text weight="bold">
                                    {formatCurrency(rapportZ.paiements.total)}
                                  </Text>
                                </Table.Cell>
                              </Table.Row>
                            </Table.Body>
                          </Table.Root>

                          <Separator size="4" mb="4" />

                          {/* Caisse */}
                          <Text size="3" weight="bold" mb="2">
                            Etat de la caisse
                          </Text>
                          <Box
                            style={{
                              padding: 16,
                              borderRadius: 8,
                              backgroundColor:
                                rapportZ.caisse.ecart === 0
                                  ? "var(--green-a3)"
                                  : rapportZ.caisse.ecart > 0
                                    ? "var(--blue-a3)"
                                    : "var(--red-a3)",
                              border: `1px solid ${
                                rapportZ.caisse.ecart === 0
                                  ? "var(--green-a6)"
                                  : rapportZ.caisse.ecart > 0
                                    ? "var(--blue-a6)"
                                    : "var(--red-a6)"
                              }`,
                            }}
                          >
                            <Flex direction="column" gap="2">
                              <Flex justify="between">
                                <Text size="2">Fond de caisse</Text>
                                <Text size="2">
                                  {formatCurrency(rapportZ.caisse.fondCaisse)}
                                </Text>
                              </Flex>
                              <Flex justify="between">
                                <Text size="2">Especes attendues</Text>
                                <Text size="2">
                                  {formatCurrency(
                                    rapportZ.caisse.especesAttendues
                                  )}
                                </Text>
                              </Flex>
                              <Flex justify="between">
                                <Text size="2">Especes comptees</Text>
                                <Text size="2">
                                  {formatCurrency(
                                    rapportZ.caisse.especesComptees
                                  )}
                                </Text>
                              </Flex>
                              <Separator size="4" />
                              <Flex justify="between">
                                <Text size="2" weight="bold">
                                  Ecart
                                </Text>
                                <Text
                                  size="2"
                                  weight="bold"
                                  style={{
                                    color:
                                      rapportZ.caisse.ecart === 0
                                        ? "var(--green-9)"
                                        : rapportZ.caisse.ecart > 0
                                          ? "var(--blue-9)"
                                          : "var(--red-9)",
                                  }}
                                >
                                  {rapportZ.caisse.ecart > 0 ? "+" : ""}
                                  {formatCurrency(rapportZ.caisse.ecart)}
                                </Text>
                              </Flex>
                            </Flex>
                          </Box>

                          {/* TVA */}
                          <Box mt="4">
                            <Text size="3" weight="bold" mb="2">
                              Recapitulatif TVA
                            </Text>
                            <Table.Root size="1">
                              <Table.Body>
                                <Table.Row>
                                  <Table.Cell>Total HT</Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(rapportZ.tva.totalHT)}
                                  </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                  <Table.Cell>Total TVA</Table.Cell>
                                  <Table.Cell align="right">
                                    {formatCurrency(rapportZ.tva.totalTVA)}
                                  </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                  <Table.Cell>
                                    <Text weight="bold">Total TTC</Text>
                                  </Table.Cell>
                                  <Table.Cell align="right">
                                    <Text weight="bold">
                                      {formatCurrency(rapportZ.tva.totalTTC)}
                                    </Text>
                                  </Table.Cell>
                                </Table.Row>
                              </Table.Body>
                            </Table.Root>
                          </Box>

                          {/* Top produits */}
                          {rapportZ.topProduits.length > 0 && (
                            <Box mt="4">
                              <Flex align="center" gap="2" mb="2">
                                <TrendingUp size={16} />
                                <Text size="3" weight="bold">
                                  Top produits
                                </Text>
                              </Flex>
                              <Table.Root size="1">
                                <Table.Body>
                                  {rapportZ.topProduits
                                    .slice(0, 5)
                                    .map((produit, i) => (
                                      <Table.Row key={i}>
                                        <Table.Cell>
                                          <Flex align="center" gap="2">
                                            <Badge
                                              variant="soft"
                                              color="gray"
                                              size="1"
                                            >
                                              {i + 1}
                                            </Badge>
                                            {produit.nom}
                                          </Flex>
                                        </Table.Cell>
                                        <Table.Cell align="center">
                                          <Badge variant="outline" size="1">
                                            x{produit.quantite}
                                          </Badge>
                                        </Table.Cell>
                                        <Table.Cell align="right">
                                          {formatCurrency(produit.total)}
                                        </Table.Cell>
                                      </Table.Row>
                                    ))}
                                </Table.Body>
                              </Table.Root>
                            </Box>
                          )}

                          {/* Notes */}
                          {rapportZ.notesCloture ? <Callout.Root color="gray" mt="4">
                              <Callout.Text>
                                <Text weight="bold">Notes: </Text>
                                {rapportZ.notesCloture}
                              </Callout.Text>
                            </Callout.Root> : null}
                        </Box>
                      ) : (
                        <Box py="6">
                          <Text color="gray">
                            Impossible de charger le rapport
                          </Text>
                        </Box>
                      )}

                      <Flex gap="3" mt="4" justify="end">
                        {rapportZ ? <Button
                            variant="soft"
                            onClick={handlePrint}
                          >
                            <Printer size={16} />
                            Imprimer
                          </Button> : null}
                        <Dialog.Close>
                          <Button variant="soft" color="gray">
                            Fermer
                          </Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  </Dialog.Root>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Card>
  );
}
