"use client";

/**
 * Dialog de confirmation de suppression d'un etablissement
 * Réutilisé dans la page liste et la page détail
 */

import { useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Text,
  Badge,
  Button,
  Dialog,
  TextField,
  Callout,
  ScrollArea,
} from "@radix-ui/themes";
import {
  Warning,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  Trash,
  Users,
  Package,
  ShoppingCart,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { deleteEtablissement } from "@/actions/admin/etablissements";

interface DeleteEtablissementData {
  id: string;
  nom: string;
  nbUtilisateurs: number;
  nbProduits: number;
  nbVentes: number;
  nbClients?: number;
}

interface DeleteEtablissementDialogProps {
  etablissement: DeleteEtablissementData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteEtablissementDialog({
  etablissement,
  open,
  onOpenChange,
  onDeleted,
}: DeleteEtablissementDialogProps) {
  const [confirmationNom, setConfirmationNom] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    counts?: Record<string, number>;
    error?: string;
  } | null>(null);

  const closeDialog = () => {
    if (!isDeleting) {
      onOpenChange(false);
      setConfirmationNom("");
      setDeleteResult(null);
    }
  };

  const handleDelete = async () => {
    if (!etablissement) return;
    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const result = await deleteEtablissement(etablissement.id, confirmationNom);
      if (result.success) {
        setDeleteResult({ success: true, counts: result.data?.deletedCounts });
        toast.success(`Etablissement "${etablissement.nom}" supprime avec succes`);
        setTimeout(() => {
          closeDialog();
          onDeleted?.();
        }, 2000);
      } else {
        setDeleteResult({ success: false, error: result.error });
      }
    } catch {
      setDeleteResult({ success: false, error: "Erreur inattendue lors de la suppression" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeDialog();
      }}
    >
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Warning size={20} weight="fill" style={{ color: "var(--red-9)" }} />
            Supprimer l'etablissement
          </Flex>
        </Dialog.Title>

        {deleteResult?.success ? (
          <Box>
            <Callout.Root color="green" mb="4">
              <Callout.Icon>
                <CheckCircle size={18} weight="fill" />
              </Callout.Icon>
              <Callout.Text>Établissement supprimé avec succès !</Callout.Text>
            </Callout.Root>
            {deleteResult.counts ? <Box
                p="3"
                style={{
                  background: "var(--gray-a2)",
                  borderRadius: 8,
                }}
              >
                <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                  Donnees supprimees :
                </Text>
                <ScrollArea style={{ maxHeight: 200 }}>
                  <Grid columns="2" gap="2">
                    {Object.entries(deleteResult.counts).map(([key, count]) => (
                      <Flex key={key} justify="between" align="center" py="1">
                        <Text size="2" color="gray">
                          {key.replace(/_/g, " ")}
                        </Text>
                        <Badge color="red" variant="soft">
                          {count}
                        </Badge>
                      </Flex>
                    ))}
                  </Grid>
                </ScrollArea>
              </Box> : null}
          </Box>
        ) : deleteResult?.error ? (
          <Callout.Root color="red" mb="4">
            <Callout.Icon>
              <XCircle size={18} weight="fill" />
            </Callout.Icon>
            <Callout.Text>{deleteResult.error}</Callout.Text>
          </Callout.Root>
        ) : (
          <>
            <Dialog.Description size="2" mb="4">
              Vous etes sur le point de supprimer definitivement l'etablissement{" "}
              <Text weight="bold">"{etablissement?.nom}"</Text> et toutes ses donnees.
            </Dialog.Description>

            <Callout.Root color="red" variant="surface" mb="4">
              <Callout.Icon>
                <Warning size={16} weight="fill" />
              </Callout.Icon>
              <Callout.Text size="2">
                Cette action est <Text weight="bold">irreversible</Text>. Toutes les donnees
                associees seront supprimees.
              </Callout.Text>
            </Callout.Root>

            <Grid columns="2" gap="3" mb="4">
              <Flex align="center" gap="2">
                <Users size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                <Text size="2">{etablissement?.nbUtilisateurs ?? 0} utilisateur(s)</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Package size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                <Text size="2">{etablissement?.nbProduits ?? 0} produit(s)</Text>
              </Flex>
              <Flex align="center" gap="2">
                <ShoppingCart size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                <Text size="2">{etablissement?.nbVentes ?? 0} vente(s)</Text>
              </Flex>
              {etablissement?.nbClients !== undefined && (
                <Flex align="center" gap="2">
                  <Users size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                  <Text size="2">{etablissement.nbClients} client(s)</Text>
                </Flex>
              )}
            </Grid>

            <Box mb="4">
              <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                Pour confirmer, tapez le nom exact :
              </Text>
              <Text
                size="1"
                color="gray"
                mb="2"
                style={{
                  display: "block",
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                "{etablissement?.nom}"
              </Text>
              <TextField.Root
                placeholder="Nom de l'etablissement"
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
                confirmationNom !== etablissement?.nom ||
                !!deleteResult?.error
              }
            >
              {isDeleting ? (
                <>
                  <ArrowClockwise size={14} weight="bold" className="animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash size={14} weight="bold" />
                  Supprimer definitivement
                </>
              )}
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
