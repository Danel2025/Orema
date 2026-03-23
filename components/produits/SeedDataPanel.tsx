"use client";

/**
 * SeedDataPanel - Panneau permettant aux admins de charger des données modèles
 *
 * Visible uniquement par ADMIN et SUPER_ADMIN.
 * Permet de charger des catégories et produits pré-configurés pour un restaurant gabonais.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Separator,
  Badge,
  AlertDialog,
  Spinner,
} from "@radix-ui/themes";
import { Database, CaretDown, CaretRight, Warning, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import {
  getSeedDataPreview,
  loadSeedData,
  resetAndLoadSeedData,
} from "@/actions/seed-data";

interface SeedPreview {
  categories: number;
  produits: number;
  details: {
    categorie: string;
    couleur: string;
    nbProduits: number;
  }[];
}

export function SeedDataPanel() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [preview, setPreview] = useState<SeedPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [actionType, setActionType] = useState<"load" | "reset" | null>(null);

  const etablissementId = user?.etablissementId ?? null;

  // Charger l'aperçu au montage
  useEffect(() => {
    if (!isAdmin || !etablissementId) {
      setIsLoadingPreview(false);
      return;
    }

    async function fetchPreview() {
      try {
        const data = await getSeedDataPreview();
        setPreview(data);
      } catch {
        console.error("[SeedDataPanel] Erreur chargement preview");
      } finally {
        setIsLoadingPreview(false);
      }
    }
    fetchPreview();
  }, [isAdmin, etablissementId]);

  const handleLoadSeedData = useCallback(async () => {
    if (!etablissementId) return;
    setIsLoadingAction(true);
    setActionType("load");
    try {
      const result = await loadSeedData(etablissementId);
      if (result.success) {
        toast.success("Données modèles chargées", {
          description: `${result.categoriesCreated} catégorie(s) et ${result.produitsCreated} produit(s) créés.`,
        });
        router.refresh();
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur est survenue.",
        });
      }
    } catch {
      toast.error("Erreur inattendue lors du chargement des données.");
    } finally {
      setIsLoadingAction(false);
      setActionType(null);
    }
  }, [etablissementId]);

  const handleResetAndLoad = useCallback(async () => {
    if (!etablissementId) return;
    setIsLoadingAction(true);
    setActionType("reset");
    try {
      const result = await resetAndLoadSeedData(etablissementId);
      if (result.success) {
        toast.success("Réinitialisation terminée", {
          description: `${result.categoriesCreated} catégorie(s) et ${result.produitsCreated} produit(s) créés.`,
        });
        router.refresh();
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur est survenue.",
        });
      }
    } catch {
      toast.error("Erreur inattendue lors de la réinitialisation.");
    } finally {
      setIsLoadingAction(false);
      setActionType(null);
    }
  }, [etablissementId]);

  // Ne pas afficher si non-admin ou pas d'établissement
  if (!isAdmin || !user || !etablissementId) {
    return null;
  }

  return (
    <Card size="2" style={{ marginBottom: 24 }}>
      <Flex direction="column" gap="3">
        {/* En-tete */}
        <Flex align="center" gap="2">
          <Database size={20} weight="duotone" style={{ color: "var(--accent-9)" }} />
          <Text size="3" weight="bold">
            Données modèles
          </Text>
        </Flex>

        <Text size="2" color="gray">
          Chargez des catégories et produits pré-configurés pour démarrer rapidement votre
          restaurant.
        </Text>

        {/* Apercu des donnees */}
        {isLoadingPreview ? (
          <Flex align="center" gap="2" py="2">
            <Spinner size="2" />
            <Text size="2" color="gray">
              Chargement de l&apos;aperçu...
            </Text>
          </Flex>
        ) : preview ? (
          <Box>
            <Flex gap="3" mb="2">
              <Badge variant="soft" color="blue" size="2">
                {preview.categories} catégories
              </Badge>
              <Badge variant="soft" color="orange" size="2">
                {preview.produits} produits
              </Badge>
            </Flex>

            {/* Bouton pour voir/masquer les details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 0",
                fontSize: 13,
                color: "var(--gray-11)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {showDetails ? (
                <CaretDown size={14} weight="bold" />
              ) : (
                <CaretRight size={14} weight="bold" />
              )}
              Voir le détail par catégorie
            </button>

            {/* Detail par categorie */}
            {showDetails ? <Box
                mt="2"
                p="3"
                style={{
                  backgroundColor: "var(--gray-a2)",
                  borderRadius: "var(--radius-2)",
                }}
              >
                <Flex direction="column" gap="2">
                  {preview.details.map((detail) => (
                    <Flex key={detail.categorie} align="center" justify="between">
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: detail.couleur,
                            flexShrink: 0,
                          }}
                        />
                        <Text size="2">{detail.categorie}</Text>
                      </Flex>
                      <Text size="2" color="gray">
                        {detail.nbProduits} produits
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Box> : null}
          </Box>
        ) : null}

        <Separator size="4" />

        {/* Actions */}
        <Flex gap="3" wrap="wrap">
          {/* Bouton Charger les donnees */}
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button
                color="green"
                variant="soft"
                disabled={isLoadingAction}
                size="2"
              >
                {isLoadingAction && actionType === "load" ? (
                  <Spinner size="2" />
                ) : (
                  <CheckCircle size={16} weight="bold" />
                )}
                Charger les données modèles
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="450px">
              <AlertDialog.Title>Charger les données modèles</AlertDialog.Title>
              <AlertDialog.Description size="2">
                Les catégories et produits modèles seront ajoutés à votre établissement. Les
                éléments existants portant le même nom ne seront pas dupliqués.
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Annuler
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button color="green" onClick={handleLoadSeedData}>
                    Confirmer le chargement
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>

          {/* Bouton Reinitialiser */}
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button
                color="red"
                variant="soft"
                disabled={isLoadingAction}
                size="2"
              >
                {isLoadingAction && actionType === "reset" ? (
                  <Spinner size="2" />
                ) : (
                  <Warning size={16} weight="bold" />
                )}
                Réinitialiser tout
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="500px">
              <AlertDialog.Title>Réinitialiser toutes les données</AlertDialog.Title>
              <AlertDialog.Description size="2">
                <Flex direction="column" gap="2">
                  <Text as="p" size="2" color="red" weight="bold">
                    Attention : cette action est irréversible !
                  </Text>
                  <Text as="p" size="2">
                    Cela supprimera TOUTES vos catégories et produits actuels, puis rechargera
                    les données modèles. Les ventes existantes ne seront pas affectées mais les
                    références produits pourraient être perdues.
                  </Text>
                </Flex>
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Annuler
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button color="red" onClick={handleResetAndLoad}>
                    Oui, tout réinitialiser
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Flex>

        {/* Indicateur de progression */}
        {isLoadingAction ? <Flex align="center" gap="2" py="1">
            <Spinner size="2" />
            <Text size="2" color="gray">
              {actionType === "load"
                ? "Chargement des données en cours..."
                : "Réinitialisation en cours..."}
            </Text>
          </Flex> : null}
      </Flex>
    </Card>
  );
}
