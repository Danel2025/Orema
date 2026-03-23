"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  Card,
  TextField,
  Separator,
  Callout,
} from "@radix-ui/themes";
import {
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  CaretLeft,
  CaretRight,
  Info,
  User,
  Percent,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  traiterApprobation,
  getApprobationsHistoriqueAction,
} from "@/actions/approbation-remises";

type StatutApprobation = "en_attente" | "approuvee" | "refusee" | "expiree";

interface Approbation {
  id: string;
  montantVente: number;
  montantRemise: number;
  pourcentageRemise: number;
  commentaire?: string | null;
  statut: StatutApprobation;
  demandeurNom: string;
  traitePar?: string | null;
  commentaireReponse?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ApprobationQueueProps {
  initialPendantes: Approbation[];
  initialHistorique: Approbation[];
  initialHistoriqueTotal: number;
}

const STATUT_CONFIG: Record<
  StatutApprobation,
  { color: "yellow" | "green" | "red" | "gray"; label: string }
> = {
  en_attente: { color: "yellow", label: "En attente" },
  approuvee: { color: "green", label: "Approuvee" },
  refusee: { color: "red", label: "Refusee" },
  expiree: { color: "gray", label: "Expiree" },
};

const PAGE_SIZE = 10;

export function ApprobationQueue({
  initialPendantes,
  initialHistorique,
  initialHistoriqueTotal,
}: ApprobationQueueProps) {
  const [pendantes, setPendantes] = useState<Approbation[]>(initialPendantes);
  const [historique, setHistorique] = useState<Approbation[]>(initialHistorique);
  const [historiqueTotal, setHistoriqueTotal] = useState(initialHistoriqueTotal);
  const [historiquePage, setHistoriquePage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [isLoadingHistorique, setIsLoadingHistorique] = useState(false);

  const historiquePages = Math.ceil(historiqueTotal / PAGE_SIZE);

  const handleTraiter = async (
    approbationId: string,
    statut: "approuvee" | "refusee"
  ) => {
    setLoadingId(approbationId);
    try {
      const result = await traiterApprobation({
        approbationId,
        statut,
        commentaire: commentaires[approbationId] || undefined,
      });

      if (result.success) {
        const treated = pendantes.find((a) => a.id === approbationId);
        setPendantes((prev) => prev.filter((a) => a.id !== approbationId));
        if (treated) {
          setHistorique((prev) => [
            { ...treated, statut, commentaireReponse: commentaires[approbationId] || null },
            ...prev,
          ]);
          setHistoriqueTotal((prev) => prev + 1);
        }
        toast.success(
          statut === "approuvee" ? "Remise approuvee" : "Remise refusee"
        );
      } else {
        toast.error(result.error || "Erreur lors du traitement");
      }
    } catch {
      toast.error("Erreur lors du traitement");
    } finally {
      setLoadingId(null);
    }
  };

  const fetchHistoriquePage = async (newPage: number) => {
    setIsLoadingHistorique(true);
    try {
      const result = await getApprobationsHistoriqueAction(newPage, PAGE_SIZE);

      if (result.success && result.data) {
        // Map DB rows (snake_case) to UI types (camelCase)
        const mapped = result.data.data.map((a: any) => ({
          id: a.id,
          montantVente: a.montant_vente,
          montantRemise: a.montant_remise,
          pourcentageRemise: a.pourcentage_remise,
          commentaire: a.commentaire,
          statut: a.statut,
          demandeurNom: a.demandeur_id,
          traitePar: a.approbateur_id,
          commentaireReponse: a.commentaire_reponse,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }));
        setHistorique(mapped);
        setHistoriqueTotal(result.data.total);
        setHistoriquePage(newPage);
      }
    } catch {
      // keep current data
    } finally {
      setIsLoadingHistorique(false);
    }
  };

  return (
    <Flex direction="column" gap="5">
      {/* Section En attente */}
      <Box>
        <Flex align="center" gap="2" mb="3">
          <Clock size={20} weight="duotone" style={{ color: "var(--yellow-9)" }} />
          <Text size="4" weight="bold">
            En attente d&apos;approbation
          </Text>
          {pendantes.length > 0 && (
            <Badge color="yellow" size="2">
              {pendantes.length}
            </Badge>
          )}
        </Flex>

        {pendantes.length === 0 ? (
          <Box
            style={{
              border: "1px dashed var(--gray-a6)",
              borderRadius: 8,
              padding: "32px",
              textAlign: "center",
            }}
          >
            <CheckCircle
              size={36}
              weight="thin"
              style={{ color: "var(--green-8)", marginBottom: 8 }}
            />
            <Text as="p" size="2" color="gray">
              Aucune demande en attente.
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap="3">
            {pendantes.map((approbation) => (
              <Card key={approbation.id} size="2">
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="start" wrap="wrap" gap="3">
                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <Receipt size={16} style={{ color: "var(--accent-9)" }} />
                        <Text size="2" weight="bold">
                          Vente de {formatCurrency(approbation.montantVente)}
                        </Text>
                        <Badge color="yellow" size="1" variant="soft">
                          En attente
                        </Badge>
                      </Flex>

                      <Flex gap="3" align="center" wrap="wrap">
                        <Flex align="center" gap="1">
                          <Percent size={14} style={{ color: "var(--accent-9)" }} />
                          <Text size="2" weight="medium">
                            Remise : {approbation.pourcentageRemise}% ({formatCurrency(approbation.montantRemise)})
                          </Text>
                        </Flex>
                      </Flex>

                      <Flex gap="3" align="center" wrap="wrap">
                        <Flex align="center" gap="1">
                          <User size={14} style={{ color: "var(--gray-8)" }} />
                          <Text size="1" color="gray">
                            Demande par {approbation.demandeurNom}
                          </Text>
                        </Flex>
                        <Text size="1" color="gray">
                          {formatDate(approbation.createdAt, "datetime")}
                        </Text>
                      </Flex>

                      {approbation.commentaire ? <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
                          &quot;{approbation.commentaire}&quot;
                        </Text> : null}
                    </Flex>
                  </Flex>

                  <Separator size="4" />

                  <Flex gap="3" align="end" wrap="wrap">
                    <Box style={{ flex: "1 1 200px" }}>
                      <Text as="div" size="1" color="gray" mb="1">
                        Commentaire (optionnel)
                      </Text>
                      <TextField.Root
                        size="2"
                        placeholder="Raison de l'approbation ou du refus..."
                        value={commentaires[approbation.id] || ""}
                        onChange={(e) =>
                          setCommentaires((prev) => ({
                            ...prev,
                            [approbation.id]: e.target.value,
                          }))
                        }
                      />
                    </Box>

                    <Flex gap="2">
                      <Button
                        color="red"
                        variant="soft"
                        size="2"
                        disabled={loadingId === approbation.id}
                        onClick={() => handleTraiter(approbation.id, "refusee")}
                      >
                        <XCircle size={16} />
                        Refuser
                      </Button>
                      <Button
                        color="green"
                        size="2"
                        disabled={loadingId === approbation.id}
                        onClick={() => handleTraiter(approbation.id, "approuvee")}
                      >
                        <CheckCircle size={16} />
                        Approuver
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Box>

      <Separator size="4" />

      {/* Section Historique */}
      <Box>
        <Flex align="center" gap="2" mb="3">
          <Clock size={20} weight="duotone" style={{ color: "var(--gray-9)" }} />
          <Text size="4" weight="bold">
            Historique des approbations
          </Text>
          <Badge size="1" variant="soft" color="gray">
            {historiqueTotal}
          </Badge>
        </Flex>

        {isLoadingHistorique ? (
          <Box style={{ textAlign: "center", padding: "32px" }}>
            <Text size="2" color="gray">
              Chargement...
            </Text>
          </Box>
        ) : historique.length === 0 ? (
          <Box
            style={{
              border: "1px dashed var(--gray-a6)",
              borderRadius: 8,
              padding: "32px",
              textAlign: "center",
            }}
          >
            <Text as="p" size="2" color="gray">
              Aucun historique d&apos;approbation.
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap="2">
            {historique.map((approbation) => {
              const config = STATUT_CONFIG[approbation.statut];
              return (
                <Box
                  key={approbation.id}
                  style={{
                    border: "1px solid var(--gray-a4)",
                    borderRadius: 8,
                    padding: "12px 16px",
                  }}
                >
                  <Flex justify="between" align="center" wrap="wrap" gap="2">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Text size="2" weight="medium">
                          {formatCurrency(approbation.montantVente)}
                        </Text>
                        <Text size="1" color="gray">
                          remise {approbation.pourcentageRemise}% ({formatCurrency(approbation.montantRemise)})
                        </Text>
                      </Flex>

                      <Flex gap="2" align="center" wrap="wrap">
                        <Text size="1" color="gray">
                          Par {approbation.demandeurNom}
                        </Text>
                        {approbation.traitePar ? <Text size="1" color="gray">
                            {approbation.statut === "approuvee" ? "approuve" : "refuse"} par {approbation.traitePar}
                          </Text> : null}
                        <Text size="1" color="gray">
                          {formatDate(approbation.createdAt, "datetime")}
                        </Text>
                      </Flex>

                      {approbation.commentaireReponse ? <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
                          &quot;{approbation.commentaireReponse}&quot;
                        </Text> : null}
                    </Flex>

                    <Badge color={config.color} size="2" variant="soft">
                      {config.label}
                    </Badge>
                  </Flex>
                </Box>
              );
            })}
          </Flex>
        )}

        {/* Pagination historique */}
        {historiquePages > 1 && (
          <Flex justify="center" align="center" gap="3" mt="3">
            <Button
              variant="soft"
              size="2"
              disabled={historiquePage <= 1 || isLoadingHistorique}
              onClick={() => fetchHistoriquePage(historiquePage - 1)}
            >
              <CaretLeft size={16} />
              Precedent
            </Button>
            <Text size="2" color="gray">
              Page {historiquePage} / {historiquePages}
            </Text>
            <Button
              variant="soft"
              size="2"
              disabled={historiquePage >= historiquePages || isLoadingHistorique}
              onClick={() => fetchHistoriquePage(historiquePage + 1)}
            >
              Suivant
              <CaretRight size={16} />
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
