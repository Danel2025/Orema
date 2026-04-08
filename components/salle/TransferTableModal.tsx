"use client";

/**
 * TransferTableModal - Modal de transfert de table avec grille visuelle
 * Permet de transferer une commande d'une table a une autre
 * ou de fusionner deux commandes si la table de destination est occupee
 */

import { useState, useTransition, useEffect, useCallback } from "react";
import { Dialog, Text, Flex, Button, Badge, Separator, Checkbox } from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  ArrowsLeftRight,
  CheckCircle,
  Clock,
  CookingPot,
  Receipt,
  Sparkle,
  Users,
  Warning,
  GitMerge,
  X,
  SpinnerGap,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { transferTable, mergeTableOrders, getTablesForTransfer } from "@/actions/tables";
import { STATUT_TABLE_LABELS, type StatutTableType } from "@/schemas/table.schema";
import { formatCurrency } from "@/lib/utils";

// Types
interface VenteEnCours {
  id: string;
  numeroTicket: string;
  totalFinal: number | { toNumber?: () => number };
  createdAt: Date | string;
  _count: {
    lignes: number;
  };
}

interface ZoneInfo {
  id: string;
  nom: string;
  couleur?: string | null;
}

interface TableData {
  id: string;
  numero: string;
  capacite: number;
  statut: string;
  zone: ZoneInfo | null;
  ventes: VenteEnCours[];
}

interface SourceTableInfo {
  id: string;
  numero: string;
  statut: StatutTableType;
  capacite: number;
  venteEnCours: {
    id: string;
    numeroTicket: string;
    totalFinal: number;
    _count: {
      lignes: number;
    };
  };
}

interface TransferTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTable: SourceTableInfo | null;
  onSuccess?: () => void;
}

// Couleurs de statut
const STATUS_COLORS: Record<StatutTableType, { bg: string; border: string; text: string }> = {
  LIBRE: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  OCCUPEE: { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
  EN_PREPARATION: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  ADDITION: { bg: "#ffedd5", border: "#f97316", text: "#9a3412" },
  A_NETTOYER: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
};

// Icones de statut
const STATUS_ICONS: Record<StatutTableType, React.ReactNode> = {
  LIBRE: <CheckCircle size={14} />,
  OCCUPEE: <Clock size={14} />,
  EN_PREPARATION: <CookingPot size={14} />,
  ADDITION: <Receipt size={14} />,
  A_NETTOYER: <Sparkle size={14} />,
};

export function TransferTableModal({
  open,
  onOpenChange,
  sourceTable,
  onSuccess,
}: TransferTableModalProps) {
  const [isPending, startTransition] = useTransition();
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [markSourceAsClean, setMarkSourceAsClean] = useState(false);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [mergeTargetVenteId, setMergeTargetVenteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Charger les tables disponibles
  const loadTables = useCallback(async () => {
    if (!sourceTable) return;

    setIsLoading(true);
    try {
      const data = await getTablesForTransfer(sourceTable.id);
      setTables(data as unknown as TableData[]);
    } catch (error) {
      toast.error("Erreur lors du chargement des tables");
    } finally {
      setIsLoading(false);
    }
  }, [sourceTable]);

  // Charger les tables quand le modal s'ouvre
  useEffect(() => {
    if (open && sourceTable) {
      loadTables();
      setSelectedTableId(null);
      setShowMergeConfirm(false);
      setMergeTargetVenteId(null);
      setShowSuccess(false);
    }
  }, [open, sourceTable, loadTables]);

  // Table selectionnee
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // Formatter le total
  const formatTotal = (total: number | { toNumber?: () => number }) => {
    const num = typeof total === "number" ? total : total.toNumber?.() || 0;
    return formatCurrency(num);
  };

  // Grouper les tables par zone
  const tablesByZone = tables.reduce(
    (acc, table) => {
      const zoneName = table.zone?.nom || "Sans zone";
      if (!acc[zoneName]) {
        acc[zoneName] = [];
      }
      acc[zoneName].push(table);
      return acc;
    },
    {} as Record<string, TableData[]>
  );

  // Gerer le transfert
  const handleTransfer = () => {
    if (!sourceTable || !selectedTableId) return;

    startTransition(async () => {
      try {
        const result = await transferTable({
          fromTableId: sourceTable.id,
          toTableId: selectedTableId,
          markSourceAsClean,
        });

        if (result.success) {
          setShowSuccess(true);
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
            toast.success(`Commande transferee vers la table ${result.data?.toTableNumero}`);
          }, 1500);
        } else if (result.error === "MERGE_REQUIRED") {
          // Proposer la fusion
          setMergeTargetVenteId(result.targetVenteId || null);
          setShowMergeConfirm(true);
        } else {
          toast.error(result.error || "Erreur lors du transfert");
        }
      } catch (error) {
        toast.error("Erreur lors du transfert");
      }
    });
  };

  // Gerer la fusion
  const handleMerge = () => {
    if (!sourceTable || !selectedTableId || !mergeTargetVenteId) return;

    startTransition(async () => {
      try {
        const result = await mergeTableOrders({
          sourceVenteId: sourceTable.venteEnCours.id,
          targetVenteId: mergeTargetVenteId,
          sourceTableId: sourceTable.id,
        });

        if (result.success) {
          setShowSuccess(true);
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
            toast.success("Commandes fusionnées avec succès");
          }, 1500);
        } else {
          toast.error(result.error || "Erreur lors de la fusion");
        }
      } catch (error) {
        toast.error("Erreur lors de la fusion");
      }
    });
  };

  if (!sourceTable) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        style={{
          maxWidth: 720,
          maxHeight: "90vh",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-a5)",
            backgroundColor: "var(--accent-a2)",
          }}
        >
          <Dialog.Title size="5" style={{ marginBottom: 8 }}>
            <Flex align="center" gap="2">
              <ArrowsLeftRight size={20} style={{ color: "var(--accent-9)" }} />
              Transferer la commande
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" color="gray">
            Selectionnez la table de destination pour la commande de la table{" "}
            <strong>{sourceTable.numero}</strong>
          </Dialog.Description>
        </div>

        {/* Animation de succes */}
        {showSuccess ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--color-background)",
              zIndex: 100,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "var(--green-9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                animation: "scaleIn 0.3s ease-out",
              }}
            >
              <CheckCircle size={40} color="white" />
            </div>
            <Text size="5" weight="bold" style={{ color: "var(--green-11)" }}>
              {showMergeConfirm ? "Commandes fusionnées!" : "Transfert réussi!"}
            </Text>
          </div>
        ) : null}

        {/* Confirmation de fusion */}
        {showMergeConfirm && !showSuccess ? (
          <div style={{ padding: 24 }}>
            <Flex
              direction="column"
              align="center"
              gap="4"
              style={{
                padding: 24,
                backgroundColor: "var(--purple-a2)",
                borderRadius: 12,
                border: "1px solid var(--purple-a6)",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "var(--purple-9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GitMerge size={28} color="white" />
              </div>

              <Text size="4" weight="bold" align="center">
                Fusionner les commandes?
              </Text>

              <Text size="2" color="gray" align="center" style={{ maxWidth: 400 }}>
                La table <strong>{selectedTable?.numero}</strong> a deja une commande en cours.
                Voulez-vous fusionner les deux commandes?
              </Text>

              <Flex gap="4" mt="2" align="center">
                {/* Table source */}
                <div
                  style={{
                    padding: 16,
                    backgroundColor: "var(--gray-a2)",
                    borderRadius: 8,
                    minWidth: 140,
                    textAlign: "center",
                  }}
                >
                  <Text size="1" color="gray">
                    Table source
                  </Text>
                  <Text size="5" weight="bold" style={{ display: "block" }}>
                    {sourceTable.numero}
                  </Text>
                  <Badge size="1" mt="1">
                    {sourceTable.venteEnCours._count.lignes} article(s)
                  </Badge>
                  <Text size="2" weight="bold" style={{ display: "block", marginTop: 8 }}>
                    {formatTotal(sourceTable.venteEnCours.totalFinal)}
                  </Text>
                </div>

                <ArrowsLeftRight size={24} style={{ color: "var(--gray-9)" }} />

                {/* Table destination */}
                <div
                  style={{
                    padding: 16,
                    backgroundColor: "var(--gray-a2)",
                    borderRadius: 8,
                    minWidth: 140,
                    textAlign: "center",
                  }}
                >
                  <Text size="1" color="gray">
                    Table destination
                  </Text>
                  <Text size="5" weight="bold" style={{ display: "block" }}>
                    {selectedTable?.numero}
                  </Text>
                  {selectedTable?.ventes[0] ? (
                    <>
                      <Badge color="blue" size="1" mt="1">
                        {selectedTable.ventes[0]._count.lignes} article(s)
                      </Badge>
                      <Text size="2" weight="bold" style={{ display: "block", marginTop: 8 }}>
                        {formatTotal(selectedTable.ventes[0].totalFinal)}
                      </Text>
                    </>
                  ) : null}
                </div>
              </Flex>

              <Flex
                align="center"
                gap="2"
                mt="2"
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--green-a2)",
                  borderRadius: 6,
                }}
              >
                <Warning size={16} style={{ color: "var(--green-11)" }} />
                <Text size="2" style={{ color: "var(--green-11)" }}>
                  Total apres fusion:{" "}
                  <strong>
                    {formatCurrency(
                      (typeof sourceTable.venteEnCours.totalFinal === "number"
                        ? sourceTable.venteEnCours.totalFinal
                        : 0) +
                        (selectedTable?.ventes[0]
                          ? typeof selectedTable.ventes[0].totalFinal === "number"
                            ? selectedTable.ventes[0].totalFinal
                            : (
                                selectedTable.ventes[0].totalFinal as { toNumber?: () => number }
                              ).toNumber?.() || 0
                          : 0)
                    )}
                  </strong>
                </Text>
              </Flex>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Button
                variant="soft"
                color="gray"
                onClick={() => {
                  setShowMergeConfirm(false);
                  setMergeTargetVenteId(null);
                }}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button onClick={handleMerge} disabled={isPending}>
                {isPending ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    Fusion en cours...
                  </>
                ) : (
                  <>
                    <GitMerge size={16} />
                    Fusionner les commandes
                  </>
                )}
              </Button>
            </Flex>
          </div>
        ) : null}

        {/* Contenu principal */}
        {!showMergeConfirm && !showSuccess && (
          <>
            {/* Info de la table source */}
            <div
              style={{
                padding: "16px 24px",
                backgroundColor: "var(--gray-a2)",
                borderBottom: "1px solid var(--gray-a4)",
              }}
            >
              <Flex gap="4" align="center">
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: STATUS_COLORS[sourceTable.statut]?.bg || "#f5f5f5",
                    border: `2px solid ${STATUS_COLORS[sourceTable.statut]?.border || "#ccc"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    size="5"
                    weight="bold"
                    style={{
                      color: STATUS_COLORS[sourceTable.statut]?.text || "#333",
                    }}
                  >
                    {sourceTable.numero}
                  </Text>
                  <Flex
                    align="center"
                    gap="1"
                    style={{
                      color: STATUS_COLORS[sourceTable.statut]?.text || "#333",
                      opacity: 0.8,
                    }}
                  >
                    <Users size={10} />
                    <Text size="1">{sourceTable.capacite}</Text>
                  </Flex>
                </div>

                <div style={{ flex: 1 }}>
                  <Text size="2" color="gray">
                    Commande en cours
                  </Text>
                  <Flex align="center" gap="3" mt="1">
                    <Badge size="2">{sourceTable.venteEnCours._count.lignes} article(s)</Badge>
                    <Text size="3" weight="bold">
                      {formatTotal(sourceTable.venteEnCours.totalFinal)}
                    </Text>
                  </Flex>
                </div>

                <ArrowsLeftRight size={24} style={{ color: "var(--accent-9)" }} />
              </Flex>
            </div>

            {/* Grille des tables */}
            <ScrollArea type="auto" scrollbars="vertical" style={{ height: 360 }}>
              <div style={{ padding: "16px 24px" }}>
                {isLoading ? (
                  <Flex align="center" justify="center" style={{ height: 200 }}>
                    <SpinnerGap
                      size={32}
                      className="animate-spin"
                      style={{ color: "var(--gray-9)" }}
                    />
                  </Flex>
                ) : tables.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" style={{ height: 200 }}>
                    <Warning size={32} style={{ color: "var(--gray-8)", marginBottom: 12 }} />
                    <Text size="2" color="gray">
                      Aucune autre table disponible
                    </Text>
                  </Flex>
                ) : (
                  Object.entries(tablesByZone).map(([zoneName, zoneTables]) => (
                    <div key={zoneName} style={{ marginBottom: 24 }}>
                      <Text
                        size="2"
                        weight="bold"
                        color="gray"
                        style={{ marginBottom: 12, display: "block" }}
                      >
                        {zoneName}
                      </Text>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                          gap: 12,
                        }}
                      >
                        {zoneTables.map((table) => {
                          const statut = table.statut as StatutTableType;
                          const isSelected = selectedTableId === table.id;
                          const hasVente = table.ventes.length > 0;
                          const statusStyle = STATUS_COLORS[statut];

                          return (
                            <button
                              key={table.id}
                              onClick={() => setSelectedTableId(table.id)}
                              style={{
                                padding: 12,
                                borderRadius: 12,
                                border: isSelected
                                  ? "3px solid var(--accent-9)"
                                  : `2px solid ${statusStyle?.border || "var(--gray-a5)"}`,
                                backgroundColor: statusStyle?.bg || "var(--gray-a2)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                transform: isSelected ? "scale(1.02)" : "none",
                                boxShadow: isSelected
                                  ? "0 4px 12px rgba(139, 92, 246, 0.25)"
                                  : "none",
                              }}
                            >
                              {/* Numero */}
                              <Text
                                size="4"
                                weight="bold"
                                style={{
                                  color: statusStyle?.text || "var(--gray-12)",
                                  display: "block",
                                }}
                              >
                                {table.numero}
                              </Text>

                              {/* Capacite */}
                              <Flex
                                align="center"
                                justify="center"
                                gap="1"
                                mt="1"
                                style={{
                                  color: statusStyle?.text || "var(--gray-11)",
                                  opacity: 0.7,
                                }}
                              >
                                <Users size={12} />
                                <Text size="1">{table.capacite}</Text>
                              </Flex>

                              {/* Statut */}
                              <Flex
                                align="center"
                                justify="center"
                                gap="1"
                                mt="2"
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  backgroundColor: `${statusStyle?.border}20`,
                                  color: statusStyle?.text || "var(--gray-11)",
                                }}
                              >
                                {STATUS_ICONS[statut]}
                                <Text size="1" weight="medium">
                                  {STATUT_TABLE_LABELS[statut]}
                                </Text>
                              </Flex>

                              {/* Info vente si occupee */}
                              {hasVente ? (
                                <div
                                  style={{
                                    marginTop: 8,
                                    padding: "6px 8px",
                                    borderRadius: 6,
                                    backgroundColor: "var(--purple-a3)",
                                  }}
                                >
                                  <Flex align="center" justify="center" gap="1">
                                    <Receipt size={12} style={{ color: "var(--purple-11)" }} />
                                    <Text
                                      size="1"
                                      weight="bold"
                                      style={{ color: "var(--purple-11)" }}
                                    >
                                      {formatTotal(table.ventes[0].totalFinal)}
                                    </Text>
                                  </Flex>
                                  <Text
                                    size="1"
                                    style={{
                                      color: "var(--amber-10)",
                                      display: "block",
                                      marginTop: 2,
                                    }}
                                  >
                                    Fusion possible
                                  </Text>
                                </div>
                              ) : null}

                              {/* Indicateur de selection */}
                              {isSelected ? (
                                <div
                                  style={{
                                    marginTop: 8,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    backgroundColor: "var(--accent-9)",
                                    color: "white",
                                    textAlign: "center",
                                  }}
                                >
                                  <Text size="1" weight="bold">
                                    Selectionne
                                  </Text>
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator size="4" />

            {/* Options et actions */}
            <div style={{ padding: "16px 24px" }}>
              {/* Option pour marquer comme a nettoyer */}
              <Flex align="center" gap="2" mb="4">
                <Checkbox
                  checked={markSourceAsClean}
                  onCheckedChange={(checked) => setMarkSourceAsClean(checked === true)}
                  id="mark-clean"
                />
                <label
                  htmlFor="mark-clean"
                  style={{
                    fontSize: 14,
                    color: "var(--gray-11)",
                    cursor: "pointer",
                  }}
                >
                  Marquer la table {sourceTable.numero} comme "A nettoyer" apres le transfert
                </label>
              </Flex>

              {/* Legende */}
              <Flex gap="4" mb="4" wrap="wrap">
                <Flex align="center" gap="2">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: STATUS_COLORS.LIBRE.bg,
                      border: `1px solid ${STATUS_COLORS.LIBRE.border}`,
                    }}
                  />
                  <Text size="1" color="gray">
                    Libre
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: STATUS_COLORS.OCCUPEE.bg,
                      border: `1px solid ${STATUS_COLORS.OCCUPEE.border}`,
                    }}
                  />
                  <Text size="1" color="gray">
                    Occupee (fusion)
                  </Text>
                </Flex>
                <Flex align="center" gap="2">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: STATUS_COLORS.A_NETTOYER.bg,
                      border: `1px solid ${STATUS_COLORS.A_NETTOYER.border}`,
                    }}
                  />
                  <Text size="1" color="gray">
                    A nettoyer
                  </Text>
                </Flex>
              </Flex>

              {/* Boutons d'action */}
              <Flex gap="3" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" disabled={isPending}>
                    <X size={16} />
                    Annuler
                  </Button>
                </Dialog.Close>

                <Button onClick={handleTransfer} disabled={!selectedTableId || isPending}>
                  {isPending ? (
                    <>
                      <SpinnerGap size={16} className="animate-spin" />
                      Transfert en cours...
                    </>
                  ) : (
                    <>
                      <ArrowsLeftRight size={16} />
                      Transferer vers {selectedTable?.numero || "..."}
                    </>
                  )}
                </Button>
              </Flex>
            </div>
          </>
        )}

        {/* Style pour l'animation */}
        <style>{`
          @keyframes scaleIn {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </Dialog.Content>
    </Dialog.Root>
  );
}
