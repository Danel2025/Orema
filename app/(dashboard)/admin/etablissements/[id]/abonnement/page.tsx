"use client";

/**
 * Page de gestion de l'abonnement d'un etablissement
 * Affiche le plan actuel, quotas, plans disponibles et historique
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Badge,
  Skeleton,
} from "@radix-ui/themes";
import {
  CaretRight,
  CreditCard,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import {
  getAbonnementFull,
  checkQuotas,
  updateAbonnement,
  getPaymentHistory,
} from "@/actions/admin/etablissements-abonnements";
import { getEtablissementName } from "@/actions/admin/etablissements";
import { AbonnementManager } from "@/components/admin/etablissements/advanced/abonnement-manager";
import type { Abonnement } from "@/components/admin/etablissements/advanced/abonnement-manager";
import type { QuotaInfo, PlanType, BillingCycle, PaymentInfo } from "@/components/admin/etablissements/shared/types";
import { PLAN_QUOTAS } from "@/schemas/admin-etablissement.schema";
import { resolvePlanSlug, getPlanPrice as getConfigPlanPrice } from "@/lib/config/plans";

export default function AbonnementPage() {
  const params = useParams();
  const etablissementId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [etablissementNom, setEtablissementNom] = useState("");
  const [currentPlan, setCurrentPlan] = useState<Abonnement | null>(null);
  const [quotas, setQuotas] = useState<QuotaInfo[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [abonnementResult, quotasResult, nameResult, paymentsResult] = await Promise.all([
        getAbonnementFull(etablissementId),
        checkQuotas(etablissementId),
        getEtablissementName(etablissementId),
        getPaymentHistory(etablissementId),
      ]);

      // Charger le nom
      if (nameResult.success && nameResult.data) {
        setEtablissementNom(nameResult.data.nom);
      }

      // Charger les paiements
      if (paymentsResult.success && paymentsResult.data) {
        setPayments(paymentsResult.data);
      }

      if (abonnementResult.success && abonnementResult.data) {
        const data = abonnementResult.data;
        const plan = resolvePlanSlug(data.plan as string) as PlanType;

        // Mapper le statut enrichi vers le type Abonnement
        const statutMap: Record<string, Abonnement["statut"]> = {
          actif: "actif",
          expire: "expire",
          annule: "annule",
          en_essai: "actif",
        };

        setCurrentPlan({
          plan,
          cycle: (data.billing_cycle as BillingCycle) || "mensuel",
          dateDebut: data.date_debut || new Date().toISOString(),
          dateFin: data.date_fin || undefined,
          statut: statutMap[data.abonnement_statut || ""] || "actif",
          prixMensuel: data.prix_mensuel ?? getConfigPlanPrice(plan, "mensuel"),
        });
      } else {
        // Fallback si pas d'abonnement
        setCurrentPlan({
          plan: "essentiel",
          cycle: "mensuel",
          dateDebut: new Date().toISOString(),
          statut: "actif",
          prixMensuel: 0,
        });
      }

      if (quotasResult.success && quotasResult.data) {
        const q = quotasResult.data;
        setQuotas([
          {
            label: "Utilisateurs",
            current: q.utilisateurs.actuel,
            max: q.utilisateurs.max,
          },
          {
            label: "Produits",
            current: q.produits.actuel,
            max: q.produits.max,
          },
          {
            label: "Ventes / mois",
            current: q.ventes_mois.actuel,
            max: q.ventes_mois.max,
          },
        ]);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChangePlan = async (newPlan: PlanType, cycle: BillingCycle) => {
    const planQuotas = PLAN_QUOTAS[newPlan];
    await updateAbonnement(etablissementId, {
      plan: newPlan,
      max_utilisateurs: planQuotas.max_utilisateurs,
      max_produits: planQuotas.max_produits,
      max_ventes_mois: planQuotas.max_ventes_mois,
    });
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
              Abonnement
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
            <CreditCard
              size={24}
              weight="duotone"
              style={{ color: "var(--accent-9)" }}
            />
          </Box>
          <Box>
            <Flex align="center" gap="2">
              <Heading size="6" weight="bold">
                Abonnement
              </Heading>
              {etablissementNom ? <Badge color="gray" variant="soft" size="1">
                  {etablissementNom}
                </Badge> : null}
            </Flex>
            <Text size="2" color="gray">
              Gérez le plan et les quotas de l&apos;établissement
            </Text>
          </Box>
        </Flex>
      </motion.div>

      {/* Contenu principal */}
      {isLoading ? (
        <Flex direction="column" gap="5">
          <Skeleton style={{ height: 100, borderRadius: 14 }} />
          <Skeleton style={{ height: 100, borderRadius: 14 }} />
          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                style={{ height: 440, borderRadius: 14 }}
              />
            ))}
          </Grid>
        </Flex>
      ) : currentPlan ? (
        <AbonnementManager
          etablissementId={etablissementId}
          currentPlan={currentPlan}
          quotas={quotas}
          recentPayments={payments}
          onChangePlan={handleChangePlan}
        />
      ) : null}
    </Box>
  );
}

