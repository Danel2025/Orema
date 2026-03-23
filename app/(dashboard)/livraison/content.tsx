"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Flex, Heading, Text } from "@/components/ui";
import { Truck, RefreshCcw } from "lucide-react";
import { Button, IconButton, Tooltip } from "@radix-ui/themes";
import { DeliveryBoard } from "@/components/livraison";
import { EmptyState } from "@/components/composed";
import { updateStatutLivraison, getHistoriqueLivraison } from "@/actions/livraison";
import type { Livraison, StatutLivraison, HistoriqueLivraison } from "@/lib/delivery";

// ============================================================================
// TYPES
// ============================================================================

interface LivraisonContentProps {
  livraisons: Livraison[];
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function LivraisonContent({ livraisons }: LivraisonContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [historiques, setHistoriques] = useState<Record<string, HistoriqueLivraison[]>>({});

  // Charger l'historique d'une livraison quand on ouvre le detail
  const loadHistorique = useCallback(
    async (livraisonId: string) => {
      if (historiques[livraisonId]) return; // Deja charge
      const result = await getHistoriqueLivraison(livraisonId);
      if (result.success && result.data) {
        setHistoriques((prev) => ({ ...prev, [livraisonId]: result.data! }));
      }
    },
    [historiques]
  );

  // Mettre a jour le statut d'une livraison
  const handleUpdateStatut = useCallback(
    async (livraisonId: string, statut: StatutLivraison, note?: string) => {
      const result = await updateStatutLivraison(livraisonId, statut, note);
      if (result.success) {
        // Invalider l'historique cache pour cette livraison
        setHistoriques((prev) => {
          const next = { ...prev };
          delete next[livraisonId];
          return next;
        });
        // Rafraichir les donnees serveur
        startTransition(() => {
          router.refresh();
        });
      }
    },
    [router, startTransition]
  );

  // Rafraichir manuellement
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  // Assigner un livreur (placeholder — ouvre un dialog a implementer plus tard)
  const handleAssignerLivreur = useCallback((_livraisonId: string) => {
    // TODO: Ouvrir un dialog pour selectionner un livreur
    // Pour l'instant, cette fonctionnalite sera ajoutee dans une iteration future
  }, []);

  return (
    <Flex
      direction="column"
      gap="4"
      style={{
        height: "100%",
        opacity: isPending ? 0.7 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Header */}
      <Flex justify="between" align="center">
        <Flex align="center" gap="3">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "var(--violet-a3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Truck size={24} style={{ color: "var(--violet-9)" }} />
          </div>
          <div>
            <Flex align="center" gap="2">
              <Heading as="h1" size="6" weight="bold">
                Suivi des livraisons
              </Heading>
              <Badge color="violet" variant="soft" size="1">
                {livraisons.length}
              </Badge>
            </Flex>
            <Text size="2" color="gray">
              Suivez et gerez les livraisons en cours
            </Text>
          </div>
        </Flex>

        <Tooltip content="Rafraichir les donnees">
          <IconButton
            variant="surface"
            color="gray"
            size="2"
            onClick={handleRefresh}
            disabled={isPending}
            style={{ cursor: "pointer" }}
            aria-label="Rafraichir les livraisons"
          >
            <RefreshCcw
              size={16}
              style={{
                animation: isPending ? "spin 1s linear infinite" : "none",
              }}
            />
          </IconButton>
        </Tooltip>
      </Flex>

      {/* Contenu principal */}
      {livraisons.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Aucune livraison en cours"
          description="Les livraisons apparaitront ici quand des commandes en mode livraison seront passees depuis la caisse."
        />
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <DeliveryBoard
            livraisons={livraisons}
            historiques={historiques}
            onUpdateStatut={handleUpdateStatut}
            onAssignerLivreur={handleAssignerLivreur}
          />
        </div>
      )}

      {/* Style pour l'animation de rotation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Flex>
  );
}
