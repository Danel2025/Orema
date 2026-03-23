"use client";

/**
 * Page de facturation d'un etablissement
 * Historique des factures, creation, stats de facturation
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Skeleton,
} from "@radix-ui/themes";
import {
  CaretRight,
  Receipt,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import {
  listFactures,
  createFacture,
} from "@/actions/admin/etablissements-facturation";
import { FacturationManager } from "@/components/admin/etablissements/advanced/facturation-manager";
import type { Facture, FactureStatut } from "@/components/admin/etablissements/shared/types";
import { getEtablissementName } from "@/actions/admin/etablissements";

export default function FacturationPage() {
  const params = useParams();
  const etablissementId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [etablissementNom, setEtablissementNom] = useState("");
  const [factures, setFactures] = useState<Facture[]>([]);
  const [totals, setTotals] = useState({
    totalFacture: 0,
    totalPaye: 0,
    totalEnAttente: 0,
    totalEnRetard: 0,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [facturesResult, nameResult] = await Promise.all([
        listFactures(etablissementId),
        getEtablissementName(etablissementId),
      ]);

      if (nameResult.success && nameResult.data) {
        setEtablissementNom(nameResult.data.nom);
      }

      if (facturesResult.success && facturesResult.data) {
        const items = facturesResult.data.data || [];
        const mappedFactures: Facture[] = items.map((f) => ({
          id: f.id,
          numero: f.numero || `FAC-${f.id.slice(0, 8)}`,
          dateEmission: f.created_at || new Date().toISOString(),
          dateEcheance: f.date_echeance || new Date().toISOString(),
          montant: f.montant || 0,
          statut: mapStatut(f.statut),
        }));

        setFactures(mappedFactures);

        // Calculer les totaux
        const now = new Date();
        let totalFacture = 0;
        let totalPaye = 0;
        let totalEnAttente = 0;
        let totalEnRetard = 0;

        for (const f of mappedFactures) {
          totalFacture += f.montant;
          if (f.statut === "payee") {
            totalPaye += f.montant;
          } else if (f.statut === "envoyee" || f.statut === "brouillon") {
            if (new Date(f.dateEcheance) < now) {
              totalEnRetard += f.montant;
            } else {
              totalEnAttente += f.montant;
            }
          }
        }

        setTotals({ totalFacture, totalPaye, totalEnAttente, totalEnRetard });
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des factures");
    } finally {
      setIsLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFacture = async (data: {
    montant: number;
    notes?: string;
    dateEcheance?: string;
  }) => {
    const result = await createFacture(etablissementId, {
      montant: data.montant,
      notes: data.notes,
      date_echeance: data.dateEcheance,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    await loadData();
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <nav aria-label="Fil d'Ariane">
          <Flex align="center" gap="2" mb="2">
            <Link
              href="/admin/etablissements"
              style={{ textDecoration: "none" }}
            >
              <Text size="2" color="gray" style={{ cursor: "pointer" }}>
                Établissements
              </Text>
            </Link>
            <CaretRight
              size={12}
              weight="bold"
              style={{ color: "var(--gray-8)" }}
              aria-hidden="true"
            />
            {isLoading ? (
              <Skeleton style={{ height: 16, width: 120 }} />
            ) : (
              <Link
                href={`/admin/etablissements/${etablissementId}`}
                style={{ textDecoration: "none" }}
              >
                <Text size="2" color="gray" style={{ cursor: "pointer" }}>
                  {etablissementNom || "Détail"}
                </Text>
              </Link>
            )}
            <CaretRight
              size={12}
              weight="bold"
              style={{ color: "var(--gray-8)" }}
              aria-hidden="true"
            />
            <Text size="2" weight="medium" aria-current="page">
              Facturation
            </Text>
          </Flex>
        </nav>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Flex align="center" gap="3" mb="6">
          <Box
            p="3"
            style={{
              background: "var(--accent-a3)",
              borderRadius: 8,
            }}
          >
            <Receipt
              size={24}
              weight="duotone"
              style={{ color: "var(--accent-9)" }}
            />
          </Box>
          <Box>
            <Flex align="center" gap="2">
              <Heading size="6" weight="bold">
                Facturation
              </Heading>
              {etablissementNom ? <Badge color="gray" variant="soft" size="1">
                  {etablissementNom}
                </Badge> : null}
            </Flex>
            <Text size="2" color="gray">
              Historique et création de factures
            </Text>
          </Box>
        </Flex>
      </motion.div>

      {/* Contenu principal */}
      {isLoading ? (
        <Flex direction="column" gap="5">
          <Flex gap="4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                style={{ height: 100, borderRadius: 12, flex: 1 }}
              />
            ))}
          </Flex>
          <Skeleton style={{ height: 60, borderRadius: 12 }} />
          <Skeleton style={{ height: 300, borderRadius: 12 }} />
        </Flex>
      ) : (
        <FacturationManager
          etablissementId={etablissementId}
          factures={factures}
          onCreateFacture={handleCreateFacture}
          totalFacture={totals.totalFacture}
          totalPaye={totals.totalPaye}
          totalEnAttente={totals.totalEnAttente}
          totalEnRetard={totals.totalEnRetard}
        />
      )}
    </Box>
  );
}

function mapStatut(statut: string): FactureStatut {
  switch (statut) {
    case "payee":
      return "payee";
    case "envoyee":
    case "en_attente":
      return "envoyee";
    case "annulee":
      return "annulee";
    default:
      return "brouillon";
  }
}
