"use client";

/**
 * Page de gestion des établissements - SUPER_ADMIN uniquement
 * Permet de voir et supprimer des établissements avec toutes leurs données
 */

import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Button,
  Skeleton,
  Table,
  Dialog,
  TextField,
  Callout,
  ScrollArea,
} from "@radix-ui/themes";
import {
  Building2,
  Users,
  Package,
  ShoppingCart,
  UserCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  getAllEtablissements,
  deleteEtablissement,
  type EtablissementWithStats,
} from "@/actions/admin/etablissements";

export default function AdminEtablissementsPage() {
  const [etablissements, setEtablissements] = useState<EtablissementWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEtab, setSelectedEtab] = useState<EtablissementWithStats | null>(null);
  const [confirmationNom, setConfirmationNom] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    counts?: Record<string, number>;
    error?: string;
  } | null>(null);

  const loadEtablissements = async () => {
    setIsLoading(true);
    try {
      const result = await getAllEtablissements();
      if (result.success && result.data) {
        setEtablissements(result.data);
      } else {
        toast.error(result.error || "Erreur de chargement");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEtablissements();
  }, []);

  const handleDelete = async () => {
    if (!selectedEtab) return;

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const result = await deleteEtablissement(selectedEtab.id, confirmationNom);

      if (result.success) {
        setDeleteResult({
          success: true,
          counts: result.data?.deletedCounts,
        });
        toast.success(`Établissement "${selectedEtab.nom}" supprimé avec succès`);
        // Recharger la liste après 2 secondes
        setTimeout(() => {
          setSelectedEtab(null);
          setConfirmationNom("");
          setDeleteResult(null);
          loadEtablissements();
        }, 2000);
      } else {
        setDeleteResult({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      setDeleteResult({
        success: false,
        error: "Erreur inattendue lors de la suppression",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDialog = () => {
    if (!isDeleting) {
      setSelectedEtab(null);
      setConfirmationNom("");
      setDeleteResult(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Flex align="center" justify="between" mb="6">
          <Flex align="center" gap="3">
            <Box
              p="3"
              style={{
                background: "linear-gradient(135deg, var(--red-9) 0%, var(--violet-9) 100%)",
                borderRadius: 12,
                boxShadow: "0 4px 16px var(--red-a4)",
              }}
            >
              <Building2 size={24} style={{ color: "white" }} />
            </Box>
            <Box>
              <Heading size="6">Gestion des établissements</Heading>
              <Text size="2" color="gray">
                Gérer et supprimer des établissements (action irréversible)
              </Text>
            </Box>
          </Flex>

          <Button
            variant="soft"
            onClick={loadEtablissements}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Actualiser
          </Button>
        </Flex>
      </motion.div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Callout.Root color="red" mb="5">
          <Callout.Icon>
            <AlertTriangle size={18} />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="bold">Attention :</Text> La suppression d'un établissement est{" "}
            <Text weight="bold">définitive et irréversible</Text>. Toutes les données
            associées (utilisateurs, produits, ventes, clients, etc.) seront
            supprimées.
          </Callout.Text>
        </Callout.Root>
      </motion.div>

      {/* Stats globales */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Grid columns={{ initial: "2", md: "4" }} gap="4" mb="6">
          <Box
            p="4"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3">
              <Box p="2" style={{ background: "var(--blue-a3)", borderRadius: 8 }}>
                <Building2 size={18} style={{ color: "var(--blue-9)" }} />
              </Box>
              <Box>
                <Text size="1" color="gray">Établissements</Text>
                <Text size="5" weight="bold">
                  {isLoading ? <Skeleton style={{ width: 30 }} /> : etablissements.length}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box
            p="4"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3">
              <Box p="2" style={{ background: "var(--green-a3)", borderRadius: 8 }}>
                <Users size={18} style={{ color: "var(--green-9)" }} />
              </Box>
              <Box>
                <Text size="1" color="gray">Utilisateurs total</Text>
                <Text size="5" weight="bold">
                  {isLoading ? (
                    <Skeleton style={{ width: 30 }} />
                  ) : (
                    etablissements.reduce((sum, e) => sum + e.nbUtilisateurs, 0)
                  )}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box
            p="4"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3">
              <Box p="2" style={{ background: "var(--violet-a3)", borderRadius: 8 }}>
                <Package size={18} style={{ color: "var(--violet-9)" }} />
              </Box>
              <Box>
                <Text size="1" color="gray">Produits total</Text>
                <Text size="5" weight="bold">
                  {isLoading ? (
                    <Skeleton style={{ width: 30 }} />
                  ) : (
                    etablissements.reduce((sum, e) => sum + e.nbProduits, 0)
                  )}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Box
            p="4"
            style={{
              background: "var(--color-background)",
              borderRadius: 12,
              border: "1px solid var(--gray-a4)",
            }}
          >
            <Flex align="center" gap="3">
              <Box p="2" style={{ background: "var(--purple-a3)", borderRadius: 8 }}>
                <ShoppingCart size={18} style={{ color: "var(--purple-9)" }} />
              </Box>
              <Box>
                <Text size="1" color="gray">Ventes total</Text>
                <Text size="5" weight="bold">
                  {isLoading ? (
                    <Skeleton style={{ width: 30 }} />
                  ) : (
                    etablissements.reduce((sum, e) => sum + e.nbVentes, 0)
                  )}
                </Text>
              </Box>
            </Flex>
          </Box>
        </Grid>
      </motion.div>

      {/* Table des établissements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Box
          style={{
            background: "var(--color-background)",
            borderRadius: 12,
            border: "1px solid var(--gray-a4)",
            overflow: "hidden",
          }}
        >
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Établissement</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Utilisateurs</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Produits</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Ventes</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Clients</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Créé le</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Table.Row key={i}>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                    <Table.Cell><Skeleton style={{ height: 20 }} /></Table.Cell>
                  </Table.Row>
                ))
              ) : etablissements.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <Text color="gray" align="center">
                      Aucun établissement trouvé
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                etablissements.map((etab) => (
                  <Table.Row key={etab.id}>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Text weight="medium">{etab.nom}</Text>
                        <Text size="1" color="gray">{etab.id.slice(0, 8)}...</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Text size="2">{etab.email || "-"}</Text>
                        <Text size="1" color="gray">{etab.telephone || "-"}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Badge color="blue" variant="soft">{etab.nbUtilisateurs}</Badge>
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Badge color="violet" variant="soft">{etab.nbProduits}</Badge>
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Badge color="green" variant="soft">{etab.nbVentes}</Badge>
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Badge color="purple" variant="soft">{etab.nbClients}</Badge>
                    </Table.Cell>
                    <Table.Cell align="center">
                      <Text size="2">
                        {etab.createdAt.toLocaleDateString("fr-FR")}
                      </Text>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Button
                        color="red"
                        variant="soft"
                        size="1"
                        onClick={() => setSelectedEtab(etab)}
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </motion.div>

      {/* Dialog de confirmation de suppression */}
      <Dialog.Root open={!!selectedEtab} onOpenChange={(open) => !open && closeDialog()}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <AlertTriangle size={20} style={{ color: "var(--red-9)" }} />
              Supprimer l'établissement
            </Flex>
          </Dialog.Title>

          {deleteResult?.success ? (
            // Résultat de succès
            <Box>
              <Callout.Root color="green" mb="4">
                <Callout.Icon>
                  <CheckCircle2 size={18} />
                </Callout.Icon>
                <Callout.Text>
                  Établissement supprimé avec succès !
                </Callout.Text>
              </Callout.Root>

              <Box
                p="3"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 8,
                }}
              >
                <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  Données supprimées :
                </Text>
                <ScrollArea style={{ maxHeight: 200 }}>
                  <Grid columns="2" gap="2">
                    {Object.entries(deleteResult.counts || {}).map(([key, count]) => (
                      <Flex key={key} justify="between" align="center" py="1">
                        <Text size="2" color="gray">{key.replace(/_/g, " ")}</Text>
                        <Badge color="red" variant="soft">{count}</Badge>
                      </Flex>
                    ))}
                  </Grid>
                </ScrollArea>
              </Box>
            </Box>
          ) : deleteResult?.error ? (
            // Résultat d'erreur
            <Callout.Root color="red" mb="4">
              <Callout.Icon>
                <XCircle size={18} />
              </Callout.Icon>
              <Callout.Text>{deleteResult.error}</Callout.Text>
            </Callout.Root>
          ) : (
            // Formulaire de confirmation
            <>
              <Dialog.Description size="2" mb="4">
                Vous êtes sur le point de supprimer définitivement l'établissement{" "}
                <Text weight="bold">"{selectedEtab?.nom}"</Text> et toutes ses données.
              </Dialog.Description>

              <Box
                p="3"
                mb="4"
                style={{
                  background: "var(--red-a2)",
                  borderRadius: 8,
                  border: "1px solid var(--red-a5)",
                }}
              >
                <Text size="2" color="red">
                  Cette action supprimera :
                </Text>
                <Grid columns="2" gap="2" mt="2">
                  <Flex align="center" gap="2">
                    <Users size={14} style={{ color: "var(--red-9)" }} />
                    <Text size="2">{selectedEtab?.nbUtilisateurs} utilisateur(s)</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Package size={14} style={{ color: "var(--red-9)" }} />
                    <Text size="2">{selectedEtab?.nbProduits} produit(s)</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <ShoppingCart size={14} style={{ color: "var(--red-9)" }} />
                    <Text size="2">{selectedEtab?.nbVentes} vente(s)</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <UserCheck size={14} style={{ color: "var(--red-9)" }} />
                    <Text size="2">{selectedEtab?.nbClients} client(s)</Text>
                  </Flex>
                </Grid>
              </Box>

              <Box mb="4">
                <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  Pour confirmer, tapez le nom exact de l'établissement :
                </Text>
                <Text size="1" color="gray" mb="2" style={{ display: "block" }}>
                  "{selectedEtab?.nom}"
                </Text>
                <TextField.Root
                  placeholder="Nom de l'établissement"
                  value={confirmationNom}
                  onChange={(e) => setConfirmationNom(e.target.value)}
                />
              </Box>
            </>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isDeleting}>
                {deleteResult?.success ? "Fermer" : "Annuler"}
              </Button>
            </Dialog.Close>

            {!deleteResult?.success && (
              <Button
                color="red"
                onClick={handleDelete}
                disabled={
                  isDeleting ||
                  confirmationNom !== selectedEtab?.nom ||
                  !!deleteResult?.error
                }
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
