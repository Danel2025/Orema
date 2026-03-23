"use client";

/**
 * SupplementsManager - Gestion des suppléments/options d'un produit
 * Utilise Radix UI Dialog + AlertDialog pour l'accessibilité
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, PencilSimple, Trash, X, SpinnerGap, Check } from "@phosphor-icons/react";
import { Dialog, AlertDialog, Flex, Text, Button, IconButton, Box, Spinner } from "@radix-ui/themes";
import { toast } from "sonner";
import {
  getSupplements,
  createSupplement,
  updateSupplement,
  deleteSupplement,
  type SupplementFormData,
} from "@/actions/supplements";
import { formatCurrency } from "@/lib/utils";

interface Supplement {
  id: string;
  nom: string;
  prix: number;
}

interface SupplementsManagerProps {
  produitId: string;
  produitNom: string;
  onClose: () => void;
}

export function SupplementsManager({ produitId, produitNom, onClose }: SupplementsManagerProps) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplementFormData>({ nom: "", prix: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Charger les suppléments
  const loadSupplements = useCallback(async () => {
    setIsLoading(true);
    const result = await getSupplements(produitId);
    if (result.success && result.data) {
      setSupplements(result.data);
    }
    setIsLoading(false);
  }, [produitId]);

  useEffect(() => {
    loadSupplements();
  }, [loadSupplements]);

  const handleAdd = () => {
    setFormData({ nom: "", prix: 0 });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (supplement: Supplement) => {
    setFormData({ nom: supplement.nom, prix: supplement.prix });
    setEditingId(supplement.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nom: "", prix: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        const result = await updateSupplement(editingId, formData);
        if (result.success) {
          toast.success("Supplément modifié");
          await loadSupplements();
          handleCancel();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createSupplement(produitId, formData);
        if (result.success) {
          toast.success("Supplément ajouté");
          await loadSupplements();
          handleCancel();
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSupplement(id);
    if (result.success) {
      toast.success("Supplément supprimé");
      setSupplements(supplements.filter((s) => s.id !== id));
      setDeleteTarget(null);
    } else {
      toast.error(result.error);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid var(--gray-a6)",
    backgroundColor: "var(--gray-a2)",
    color: "var(--gray-12)",
    outline: "none",
    minHeight: 44,
  };

  return (
    <>
      <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
        <Dialog.Content maxWidth="500px" style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
          <Dialog.Title>Suppléments / Options</Dialog.Title>
          <Dialog.Description size="2">{produitNom}</Dialog.Description>

          {/* Content */}
          <Box style={{ flex: 1, overflow: "auto", paddingTop: 16 }}>
            {isLoading ? (
              <Flex justify="center" py="8" role="status" aria-live="polite">
                <Spinner size="3" />
              </Flex>
            ) : (
              <>
                {/* Formulaire d'ajout/édition */}
                {showForm ? <form
                    onSubmit={handleSubmit}
                    style={{
                      padding: 16,
                      backgroundColor: "var(--gray-a2)",
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Flex direction="column" gap="3">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
                        <Box>
                          <label htmlFor="supplement-nom" className="sr-only">Nom du supplément</label>
                          <input
                            id="supplement-nom"
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            placeholder="Nom du supplément"
                            required
                            aria-label="Nom du supplément"
                            style={inputStyle}
                          />
                        </Box>
                        <Box>
                          <label htmlFor="supplement-prix" className="sr-only">Prix du supplément</label>
                          <input
                            id="supplement-prix"
                            type="number"
                            value={formData.prix || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, prix: Number(e.target.value) || 0 })
                            }
                            placeholder="Prix (FCFA)"
                            min={0}
                            step={100}
                            required
                            aria-label="Prix du supplément en FCFA"
                            style={{ ...inputStyle, fontFamily: "monospace" }}
                          />
                        </Box>
                      </div>
                      <Flex gap="2" justify="end">
                        <Button
                          type="button"
                          variant="soft"
                          color="gray"
                          size="2"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          style={{ minHeight: 44 }}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          size="2"
                          disabled={isSubmitting}
                          style={{ minHeight: 44 }}
                        >
                          {isSubmitting ? (
                            <SpinnerGap size={14} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Check size={14} aria-hidden="true" />
                          )}
                          {editingId ? "Modifier" : "Ajouter"}
                        </Button>
                      </Flex>
                    </Flex>
                  </form> : null}

                {/* Liste des suppléments */}
                {supplements.length === 0 ? (
                  <Flex direction="column" align="center" py="8">
                    <Text size="2" color="gray">Aucun supplément</Text>
                    <Text size="2" color="gray" mt="1">
                      Ajoutez des options comme tailles, garnitures, etc.
                    </Text>
                  </Flex>
                ) : (
                  <Flex direction="column" gap="2">
                    {supplements.map((supplement) => (
                      <Flex
                        key={supplement.id}
                        align="center"
                        justify="between"
                        p="3"
                        style={{
                          backgroundColor: "var(--gray-a2)",
                          borderRadius: 10,
                          border: "1px solid var(--gray-a4)",
                        }}
                      >
                        <Flex align="center" gap="3">
                          <Text size="2" weight="medium">
                            {supplement.nom}
                          </Text>
                          <Text
                            size="2"
                            style={{
                              fontFamily: "monospace",
                              color: "var(--accent-11)",
                            }}
                          >
                            +{formatCurrency(supplement.prix)}
                          </Text>
                        </Flex>
                        <Flex gap="1">
                          <IconButton
                            variant="ghost"
                            color="gray"
                            size="2"
                            onClick={() => handleEdit(supplement)}
                            aria-label={`Modifier ${supplement.nom}`}
                            style={{ minWidth: 44, minHeight: 44 }}
                          >
                            <PencilSimple size={16} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            color="red"
                            size="2"
                            onClick={() => setDeleteTarget(supplement.id)}
                            aria-label={`Supprimer ${supplement.nom}`}
                            style={{ minWidth: 44, minHeight: 44 }}
                          >
                            <Trash size={16} aria-hidden="true" />
                          </IconButton>
                        </Flex>
                      </Flex>
                    ))}
                  </Flex>
                )}
              </>
            )}
          </Box>

          {/* Footer */}
          {!showForm && (
            <Box pt="4" style={{ borderTop: "1px solid var(--gray-a6)" }}>
              <Button
                variant="outline"
                color="gray"
                size="2"
                onClick={handleAdd}
                style={{ width: "100%", minHeight: 44, borderStyle: "dashed" }}
              >
                <Plus size={18} aria-hidden="true" />
                Ajouter un supplément
              </Button>
            </Box>
          )}
        </Dialog.Content>
      </Dialog.Root>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog.Root
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Supprimer ce supplément ?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Cette action est irréversible.
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Annuler
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => { if (deleteTarget) handleDelete(deleteTarget); }}
              >
                Supprimer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
