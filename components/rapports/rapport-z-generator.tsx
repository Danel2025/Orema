"use client";

/**
 * RapportZGenerator - Composant de generation et apercu du Rapport Z
 * Permet de selectionner une session cloturee et generer le rapport complet
 */

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Badge,
  Separator,
  Callout,
  Skeleton,
  ScrollArea,
} from "@radix-ui/themes";
import {
  FileText,
  Printer,
  Calendar,
  Clock,
  User,
  Wallet,
  CreditCard,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ShoppingCart,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  genererRapportZAction,
  getClosedSessions,
  type RapportZComplet,
} from "@/actions/rapports";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

const TYPE_VENTE_LABELS: Record<string, string> = {
  DIRECT: "Vente directe",
  TABLE: "Sur place",
  LIVRAISON: "Livraison",
  EMPORTER: "A emporter",
};

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

interface RapportZGeneratorProps {
  initialSessions?: Session[];
}

export function RapportZGenerator({ initialSessions }: RapportZGeneratorProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions || []);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [rapport, setRapport] = useState<RapportZComplet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopProduits, setShowTopProduits] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const result = await getClosedSessions(20);
      setSessions(result as Session[]);
    } catch {
      setError("Erreur lors du chargement des sessions");
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Charger les sessions si non fournies
  useEffect(() => {
    if (!initialSessions) {
      loadSessions();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(
    async (sessionId: string) => {
      setSelectedSessionId(sessionId);
      setIsGenerating(true);
      setError(null);
      setRapport(null);

      try {
        const result = await genererRapportZAction(sessionId);
        if (result.success && result.data) {
          setRapport(result.data);
        } else {
          setError(result.error || "Erreur de generation");
        }
      } catch {
        setError("Erreur lors de la generation du rapport");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  return (
    <Flex direction="column" gap="4">
      {/* Selection de session */}
      <Card size="3">
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="2">
            <FileText size={20} style={{ color: "var(--purple-9)" }} />
            <Text size="4" weight="bold">
              Generer un Rapport Z
            </Text>
          </Flex>
          <Button
            variant="soft"
            size="1"
            onClick={loadSessions}
            disabled={isLoadingSessions}
          >
            Actualiser
          </Button>
        </Flex>

        <Text size="2" color="gray" mb="3" style={{ display: "block" }}>
          Selectionnez une session cloturee pour generer le rapport de cloture
          journaliere.
        </Text>

        {isLoadingSessions ? (
          <Flex direction="column" gap="2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="60px" />
            ))}
          </Flex>
        ) : sessions.length === 0 ? (
          <Callout.Root color="gray">
            <Callout.Text>
              Aucune session cloturee trouvee. Cloturez une session de caisse
              pour generer un rapport Z.
            </Callout.Text>
          </Callout.Root>
        ) : (
          <Flex direction="column" gap="2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleGenerate(session.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: `1px solid ${
                    selectedSessionId === session.id
                      ? "var(--accent-8)"
                      : "var(--gray-a5)"
                  }`,
                  backgroundColor:
                    selectedSessionId === session.id
                      ? "var(--accent-a3)"
                      : "var(--color-panel-solid)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="1">
                    <Flex align="center" gap="2">
                      <Calendar size={14} />
                      <Text size="2" weight="medium">
                        {formatDate(session.dateCloture, "long")}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="3">
                      <Flex align="center" gap="1">
                        <Clock size={12} />
                        <Text size="1" color="gray">
                          {formatTime(session.dateOuverture)} -{" "}
                          {formatTime(session.dateCloture)}
                        </Text>
                      </Flex>
                      <Flex align="center" gap="1">
                        <User size={12} />
                        <Text size="1" color="gray">
                          {session.utilisateur.prenom}{" "}
                          {session.utilisateur.nom}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="3">
                    <Badge variant="soft" color="gray">
                      {session.nombreVentes} ventes
                    </Badge>
                    <Text
                      size="2"
                      weight="bold"
                      style={{
                        fontFamily:
                          "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(session.totalVentes)}
                    </Text>
                  </Flex>
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </Card>

      {/* Erreur */}
      {error ? <Callout.Root color="red">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root> : null}

      {/* Chargement */}
      {isGenerating ? <Card size="3">
          <Flex direction="column" gap="3" py="4">
            <Skeleton width="100%" height="40px" />
            <Skeleton width="100%" height="40px" />
            <Skeleton width="80%" height="40px" />
            <Skeleton width="60%" height="40px" />
          </Flex>
        </Card> : null}

      {/* Rapport genere */}
      {rapport && !isGenerating ? <Card
          size="3"
          id="rapport-z-print"
          style={{
            pageBreakInside: "avoid",
          }}
        >
          {/* En-tete */}
          <Flex justify="between" align="start" mb="4">
            <Box>
              <Flex align="center" gap="2" mb="1">
                <FileText size={24} style={{ color: "var(--purple-9)" }} />
                <Text size="5" weight="bold">
                  RAPPORT Z
                </Text>
              </Flex>
              <Text size="3" weight="medium">
                {rapport.etablissement.nom}
              </Text>
              {rapport.etablissement.adresse ? <Text size="2" color="gray" style={{ display: "block" }}>
                  {rapport.etablissement.adresse}
                </Text> : null}
              {rapport.etablissement.telephone ? <Text size="2" color="gray" style={{ display: "block" }}>
                  Tel: {rapport.etablissement.telephone}
                </Text> : null}
              {(rapport.etablissement.nif || rapport.etablissement.rccm) ? <Text size="1" color="gray" style={{ display: "block" }}>
                  {rapport.etablissement.nif ? `NIF: ${rapport.etablissement.nif}` : null}
                  {rapport.etablissement.nif &&
                    rapport.etablissement.rccm ? " - " : null}
                  {rapport.etablissement.rccm ? `RCCM: ${rapport.etablissement.rccm}` : null}
                </Text> : null}
            </Box>
            <Button
              variant="solid"
              onClick={handlePrint}
              className="no-print"
            >
              <Printer size={16} />
              Imprimer
            </Button>
          </Flex>

          <Separator size="4" mb="4" />

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
                  Session
                </Text>
                <Text size="2" weight="medium" style={{ display: "block" }}>
                  {rapport.session.id.substring(0, 8)}...
                </Text>
              </Box>
              <Box>
                <Text size="1" color="gray">
                  Caissier
                </Text>
                <Text size="2" weight="medium" style={{ display: "block" }}>
                  {rapport.session.caissierNom}
                </Text>
              </Box>
              <Box>
                <Text size="1" color="gray">
                  Ouverture
                </Text>
                <Text size="2" weight="medium" style={{ display: "block" }}>
                  {formatDate(rapport.session.dateOuverture, "short")}{" "}
                  {formatTime(rapport.session.dateOuverture)}
                </Text>
              </Box>
              <Box>
                <Text size="1" color="gray">
                  Cloture
                </Text>
                <Text size="2" weight="medium" style={{ display: "block" }}>
                  {formatDate(rapport.session.dateCloture, "short")}{" "}
                  {formatTime(rapport.session.dateCloture)}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Resume des ventes */}
          <Text size="3" weight="bold" mb="2">
            Resume des ventes
          </Text>
          <Box
            mb="4"
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--gray-a5)",
            }}
          >
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Flex align="center" gap="2">
                  <Receipt size={14} />
                  <Text size="2">Nombre de ventes</Text>
                </Flex>
                <Text size="2" weight="medium">
                  {rapport.ventes.nombreVentes}
                </Text>
              </Flex>
              <Flex justify="between">
                <Flex align="center" gap="2">
                  <ShoppingCart size={14} />
                  <Text size="2">Articles vendus</Text>
                </Flex>
                <Text size="2" weight="medium">
                  {rapport.ventes.articlesVendus}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2">Panier moyen</Text>
                <Text
                  size="2"
                  weight="medium"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.ventes.panierMoyen)}
                </Text>
              </Flex>
              {rapport.ventes.nombreAnnulations > 0 && (
                <Flex justify="between">
                  <Flex align="center" gap="2">
                    <AlertTriangle size={14} style={{ color: "var(--red-9)" }} />
                    <Text size="2" color="red">
                      Annulations
                    </Text>
                  </Flex>
                  <Text size="2" weight="medium" color="red">
                    {rapport.ventes.nombreAnnulations}
                  </Text>
                </Flex>
              )}
              <Separator size="4" />
              <Flex justify="between">
                <Text size="3" weight="bold">
                  Total ventes
                </Text>
                <Text
                  size="4"
                  weight="bold"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                    color: "var(--accent-9)",
                  }}
                >
                  {formatCurrency(rapport.ventes.totalVentes)}
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Encaissements par mode de paiement */}
          <Text size="3" weight="bold" mb="2">
            Encaissements
          </Text>
          <Box
            mb="4"
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--gray-a5)",
            }}
          >
            <Flex direction="column" gap="2">
              {rapport.paiements.especes > 0 && (
                <Flex justify="between">
                  <Flex align="center" gap="2">
                    <Wallet size={14} />
                    <Text size="2">Especes</Text>
                  </Flex>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.especes)}
                  </Text>
                </Flex>
              )}
              {rapport.paiements.cartes > 0 && (
                <Flex justify="between">
                  <Flex align="center" gap="2">
                    <CreditCard size={14} />
                    <Text size="2">Cartes bancaires</Text>
                  </Flex>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.cartes)}
                  </Text>
                </Flex>
              )}
              {rapport.paiements.mobileMoney > 0 && (
                <Flex justify="between">
                  <Flex align="center" gap="2">
                    <Smartphone size={14} />
                    <Text size="2">Mobile Money</Text>
                  </Flex>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.mobileMoney)}
                  </Text>
                </Flex>
              )}
              {rapport.paiements.cheques > 0 && (
                <Flex justify="between">
                  <Text size="2">Cheques</Text>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.cheques)}
                  </Text>
                </Flex>
              )}
              {rapport.paiements.virements > 0 && (
                <Flex justify="between">
                  <Text size="2">Virements</Text>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.virements)}
                  </Text>
                </Flex>
              )}
              {rapport.paiements.compteClient > 0 && (
                <Flex justify="between">
                  <Text size="2">Compte client</Text>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.compteClient)}
                  </Text>
                </Flex>
              )}
              {rapport.paiements.autres > 0 && (
                <Flex justify="between">
                  <Text size="2">Autres</Text>
                  <Text
                    size="2"
                    weight="medium"
                    style={{
                      fontFamily:
                        "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(rapport.paiements.autres)}
                  </Text>
                </Flex>
              )}
              <Separator size="4" />
              <Flex justify="between">
                <Text size="2" weight="bold">
                  Total encaissements
                </Text>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.paiements.total)}
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Ventes par type */}
          {Object.entries(rapport.ventesParType).some(
            ([, stats]) => stats.count > 0
          ) && (
            <>
              <Text size="3" weight="bold" mb="2">
                Ventes par type
              </Text>
              <Box
                mb="4"
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a5)",
                }}
              >
                <Flex direction="column" gap="2">
                  {Object.entries(rapport.ventesParType)
                    .filter(([, stats]) => stats.count > 0)
                    .map(([type, stats]) => (
                      <Flex key={type} justify="between">
                        <Text size="2">
                          {TYPE_VENTE_LABELS[type] || type}{" "}
                          <Text color="gray">({stats.count})</Text>
                        </Text>
                        <Text
                          size="2"
                          weight="medium"
                          style={{
                            fontFamily:
                              "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(stats.total)}
                        </Text>
                      </Flex>
                    ))}
                </Flex>
              </Box>
            </>
          )}

          {/* TVA */}
          <Text size="3" weight="bold" mb="2">
            Recapitulatif TVA
          </Text>
          <Box
            mb="4"
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--gray-a5)",
            }}
          >
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2">Total HT</Text>
                <Text
                  size="2"
                  weight="medium"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.tva.totalHT)}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2">Total TVA</Text>
                <Text
                  size="2"
                  weight="medium"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.tva.totalTVA)}
                </Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text size="2" weight="bold">
                  Total TTC
                </Text>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.tva.totalTTC)}
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Etat de la caisse */}
          <Text size="3" weight="bold" mb="2">
            Etat de la caisse
          </Text>
          <Box
            mb="4"
            style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor:
                rapport.caisse.ecart === 0
                  ? "var(--green-a3)"
                  : rapport.caisse.ecart > 0
                    ? "var(--blue-a3)"
                    : "var(--red-a3)",
              border: `1px solid ${
                rapport.caisse.ecart === 0
                  ? "var(--green-a6)"
                  : rapport.caisse.ecart > 0
                    ? "var(--blue-a6)"
                    : "var(--red-a6)"
              }`,
            }}
          >
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2">Fond de caisse</Text>
                <Text
                  size="2"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.caisse.fondCaisse)}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2">+ Especes encaissees</Text>
                <Text
                  size="2"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.paiements.especes)}
                </Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text size="2" weight="bold">
                  = Especes attendues
                </Text>
                <Text
                  size="2"
                  weight="bold"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.caisse.especesAttendues)}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text size="2">Especes comptees</Text>
                <Text
                  size="2"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  {formatCurrency(rapport.caisse.especesComptees)}
                </Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  {rapport.caisse.ecart === 0 ? (
                    <CheckCircle
                      size={16}
                      style={{ color: "var(--green-9)" }}
                    />
                  ) : (
                    <AlertTriangle
                      size={16}
                      style={{
                        color:
                          rapport.caisse.ecart > 0
                            ? "var(--blue-9)"
                            : "var(--red-9)",
                      }}
                    />
                  )}
                  <Text size="2" weight="bold">
                    Ecart
                  </Text>
                </Flex>
                <Text
                  size="3"
                  weight="bold"
                  style={{
                    fontFamily:
                      "var(--font-google-sans-code), ui-monospace, monospace",
                    color:
                      rapport.caisse.ecart === 0
                        ? "var(--green-9)"
                        : rapport.caisse.ecart > 0
                          ? "var(--blue-9)"
                          : "var(--red-9)",
                  }}
                >
                  {rapport.caisse.ecart > 0 ? "+" : ""}
                  {formatCurrency(rapport.caisse.ecart)}
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Top produits (pliable) */}
          {rapport.topProduits.length > 0 && (
            <>
              <Flex
                align="center"
                justify="between"
                mb="2"
                style={{ cursor: "pointer" }}
                onClick={() => setShowTopProduits(!showTopProduits)}
              >
                <Flex align="center" gap="2">
                  <TrendingUp size={16} />
                  <Text size="3" weight="bold">
                    Top produits
                  </Text>
                </Flex>
                {showTopProduits ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Flex>
              {showTopProduits ? <Box
                  mb="4"
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid var(--gray-a5)",
                  }}
                >
                  <Flex direction="column" gap="2">
                    {rapport.topProduits.map((produit, i) => (
                      <Flex key={i} justify="between" align="center">
                        <Flex align="center" gap="2">
                          <Badge
                            variant="soft"
                            color="gray"
                            size="1"
                            style={{ minWidth: 24, textAlign: "center" }}
                          >
                            {i + 1}
                          </Badge>
                          <Text size="2">{produit.nom}</Text>
                          <Badge variant="outline" size="1">
                            x{produit.quantite}
                          </Badge>
                        </Flex>
                        <Text
                          size="2"
                          weight="medium"
                          style={{
                            fontFamily:
                              "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(produit.total)}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Box> : null}
            </>
          )}

          {/* Notes de cloture */}
          {rapport.notesCloture ? <Callout.Root color="gray" mb="4">
              <Callout.Text>
                <Text weight="bold">Notes: </Text>
                {rapport.notesCloture}
              </Callout.Text>
            </Callout.Root> : null}

          {/* Pied de page */}
          <Separator size="4" mb="3" />
          <Flex justify="between" align="center">
            <Text size="1" color="gray">
              Document genere par Orema N+ POS - Ce document est un rapport
              interne
            </Text>
            <Text size="1" color="gray">
              Imprime le {formatDate(new Date(), "datetime")}
            </Text>
          </Flex>
        </Card> : null}
    </Flex>
  );
}
