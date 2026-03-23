"use client";

/**
 * Page de detail d'un etablissement - SUPER_ADMIN uniquement
 * Navigation par onglets : Informations, Statistiques, Utilisateurs, Activite
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  Tabs,
  Skeleton,
  Dialog,
  TextField,
  Callout,
  ScrollArea,
} from "@radix-ui/themes";
import {
  CaretLeft,
  PencilSimple,
  Pause,
  Play,
  Trash,
  Info,
  ChartLine,
  Users,
  ClockCounterClockwise,
  Warning,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  Package,
  ShoppingCart,
  CreditCard,
  Receipt,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import {
  getEtablissementDetail,
  getEtablissementStats,
  getEtablissementUsers,
  updateEtablissement,
  suspendEtablissement,
  reactivateEtablissement,
  deleteEtablissement,
} from "@/actions/admin/etablissements";
import { getAuditLogs } from "@/actions/admin/etablissements-audit";
import {
  statutLabels,
  planLabels,
  PLAN_QUOTAS,
} from "@/schemas/admin-etablissement.schema";
import type {
  EtablissementDetailStats,
  EtablissementStatsDetaillees,
  EtablissementUser,
} from "@/lib/db/queries/admin-etablissements";
import type { AdminAuditLog } from "@/lib/db/queries/audit-logs";
import type {
  EtablissementDetail,
  EtablissementStats,
} from "@/components/admin/etablissements/detail/types";
import { InfoTab } from "@/components/admin/etablissements/detail/info-tab";
import { StatsTab } from "@/components/admin/etablissements/detail/stats-tab";
import { UsersTab } from "@/components/admin/etablissements/detail/users-tab";
import { AuditTab } from "@/components/admin/etablissements/detail/audit-tab";
import { EditEtablissementDialog } from "@/components/admin/etablissements/detail/edit-etablissement-dialog";
import { SuspendDialog } from "@/components/admin/etablissements/detail/suspend-dialog";
import { ReactivateDialog } from "@/components/admin/etablissements/detail/reactivate-dialog";

// Type pour les donnees de l'etablissement chargees depuis le backend
interface EtablissementData {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  nif: string | null;
  rccm: string | null;
  logo: string | null;
  statut: string;
  motif_suspension: string | null;
  date_suspension: string | null;
  plan: string;
  message_ticket: string | null;
  taux_tva_standard: number;
  taux_tva_reduit: number;
  mode_vente_defaut: string;
  modes_paiement_actifs: string[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

// Mapping vers le type EtablissementDetail attendu par les composants
function mapToEtablissementDetail(data: EtablissementData, stats: EtablissementDetailStats): EtablissementDetail {
  return {
    id: data.id,
    nom: data.nom,
    email: data.email,
    telephone: data.telephone,
    adresse: data.adresse,
    nif: data.nif,
    rccm: data.rccm,
    logo: data.logo,
    statut: data.statut,
    motifSuspension: data.motif_suspension,
    dateSuspension: data.date_suspension,
    plan: data.plan,
    planAbonnement: data.plan?.toUpperCase() || "GRATUIT",
    messageTicket: data.message_ticket,
    tauxTvaStandard: data.taux_tva_standard,
    tauxTvaReduit: data.taux_tva_reduit,
    modeVenteDefaut: data.mode_vente_defaut,
    modesPaiementActifs: data.modes_paiement_actifs || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    nbUtilisateurs: stats.nb_utilisateurs,
    nbProduits: stats.nb_produits,
    nbVentes: stats.nb_ventes,
    nbClients: stats.nb_clients,
    caTotal: stats.ca_total,
    dateExpirationAbonnement: null as string | null,
    quotas: getQuotas(data.plan, stats),
  };
}

function getQuotas(plan: string, stats: EtablissementDetailStats) {
  const quotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS] || PLAN_QUOTAS.essentiel;
  return {
    utilisateurs: { used: stats.nb_utilisateurs, max: quotas.max_utilisateurs },
    produits: { used: stats.nb_produits, max: quotas.max_produits },
    ventes: { used: stats.nb_ventes_dernier_mois, max: quotas.max_ventes_mois },
  };
}

// Types importes depuis ./detail/types.ts

function mapStatsDetaillees(
  stats: EtablissementStatsDetaillees,
  basicStats: EtablissementDetailStats
): EtablissementStats {
  const joursSemaine = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Calculer les ventes par jour de la semaine a partir de ca_par_jour
  const ventesParJourMap = new Map<number, number>();
  for (const jour of stats.ca_par_jour) {
    const dayOfWeek = new Date(jour.date).getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
    ventesParJourMap.set(adjustedDay, (ventesParJourMap.get(adjustedDay) || 0) + 1);
  }

  return {
    caTotal: basicStats.ca_total,
    ventesTotal: basicStats.nb_ventes,
    panierMoyen: stats.panier_moyen,
    produitsActifs: basicStats.nb_produits,
    evolutionCA: stats.ca_par_jour.map((d) => ({
      date: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      montant: d.total,
    })),
    ventesParJour: joursSemaine.map((jour, index) => ({
      jour,
      nombre: ventesParJourMap.get(index) || 0,
    })),
    topProduits: stats.top_produits.map((p) => ({
      nom: p.nom,
      ca: p.total,
      quantite: p.quantite,
    })),
    heuresPointe: stats.heures_pointe.map((h) => ({
      heure: h.heure.toString().padStart(2, "0"),
      ventes: h.nb_ventes,
    })),
  };
}

const statutColors: Record<string, "green" | "red" | "blue"> = {
  actif: "green",
  suspendu: "red",
  en_essai: "blue",
};

const planColors: Record<string, "gray" | "blue" | "orange" | "purple"> = {
  gratuit: "gray",
  starter: "blue",
  pro: "orange",
  enterprise: "purple",
};

export default function EtablissementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Donnees
  const [etablissement, setEtablissement] = useState<EtablissementDetail | null>(null);
  const [basicStats, setBasicStats] = useState<EtablissementDetailStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<EtablissementStats | null>(null);
  const [users, setUsers] = useState<EtablissementUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditLog[]>([]);
  const [auditHasMore, setAuditHasMore] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationNom, setConfirmationNom] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    counts?: Record<string, number>;
    error?: string;
  } | null>(null);

  // Tab actif
  const [activeTab, setActiveTab] = useState("info");

  // Charger les donnees de base
  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getEtablissementDetail(id);
      if (result.success && result.data) {
        const rawEtab = result.data.etablissement as unknown as EtablissementData;
        const stats = result.data.stats;
        setBasicStats(stats);
        setEtablissement(mapToEtablissementDetail(rawEtab, stats));
      } else {
        toast.error(result.error || "Établissement non trouvé");
        router.push("/admin/etablissements");
      }
    } catch {
      toast.error("Erreur lors du chargement");
      router.push("/admin/etablissements");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Charger les stats detaillees
  const loadStats = useCallback(
    async (periode?: string) => {
      setIsStatsLoading(true);
      try {
        const now = new Date();
        let dateDebut: string;
        const dateFin = now.toISOString();

        switch (periode) {
          case "7j":
            dateDebut = new Date(now.getTime() - 7 * 86400000).toISOString();
            break;
          case "90j":
            dateDebut = new Date(now.getTime() - 90 * 86400000).toISOString();
            break;
          case "12m":
            dateDebut = new Date(now.getTime() - 365 * 86400000).toISOString();
            break;
          default:
            dateDebut = new Date(now.getTime() - 30 * 86400000).toISOString();
        }

        const result = await getEtablissementStats(id, { dateDebut, dateFin });
        if (result.success && result.data && basicStats) {
          setDetailedStats(mapStatsDetaillees(result.data, basicStats));
        }
      } catch {
        toast.error("Erreur lors du chargement des statistiques");
      } finally {
        setIsStatsLoading(false);
      }
    },
    [id, basicStats]
  );

  // Charger les utilisateurs
  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const result = await getEtablissementUsers(id);
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsUsersLoading(false);
    }
  }, [id]);

  // Charger l'audit
  const loadAudit = useCallback(
    async (page = 1, filters?: Record<string, string | undefined>) => {
      setIsAuditLoading(true);
      try {
        const result = await getAuditLogs(
          id,
          {
            action: filters?.action,
            utilisateur_id: filters?.userId,
          },
          { page, pageSize: 20 }
        );
        if (result.success && result.data) {
          if (page === 1) {
            setAuditEvents(result.data.data);
          } else {
            setAuditEvents((prev) => [...prev, ...result.data!.data]);
          }
          setAuditHasMore(page < result.data.totalPages);
          setAuditPage(page);
        }
      } catch {
        toast.error("Erreur lors du chargement de l'audit");
      } finally {
        setIsAuditLoading(false);
      }
    },
    [id]
  );

  // Charger les donnees de l'onglet actif au changement
  useEffect(() => {
    if (!etablissement) return;

    switch (activeTab) {
      case "stats":
        if (!detailedStats) loadStats();
        break;
      case "users":
        if (users.length === 0) loadUsers();
        break;
      case "audit":
        if (auditEvents.length === 0) loadAudit();
        break;
    }
  }, [activeTab, etablissement, detailedStats, users.length, auditEvents.length, loadStats, loadUsers, loadAudit]);

  // Handlers
  const handleEdit = async (data: Record<string, unknown>) => {
    const result = await updateEtablissement(id, data as Parameters<typeof updateEtablissement>[1]);
    if (result.success) {
      await loadDetail();
    } else {
      throw new Error(result.error);
    }
  };

  const handleSuspend = async (motif: string) => {
    const result = await suspendEtablissement(id, { motif });
    if (result.success) {
      toast.success("Établissement suspendu");
      await loadDetail();
    } else {
      toast.error(result.error || "Erreur lors de la suspension");
      throw new Error(result.error);
    }
  };

  const handleReactivate = async () => {
    const result = await reactivateEtablissement(id);
    if (result.success) {
      toast.success("Établissement réactivé");
      await loadDetail();
    } else {
      toast.error(result.error || "Erreur lors de la réactivation");
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!etablissement) return;
    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const result = await deleteEtablissement(id, confirmationNom);
      if (result.success) {
        setDeleteResult({ success: true, counts: result.data?.deletedCounts });
        toast.success(`Etablissement "${etablissement.nom}" supprime`);
        setTimeout(() => {
          router.push("/admin/etablissements");
        }, 2000);
      } else {
        setDeleteResult({ success: false, error: result.error });
      }
    } catch {
      setDeleteResult({ success: false, error: "Erreur inattendue" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading || !etablissement) {
    return <LoadingSkeleton />;
  }

  const isSuspended = etablissement.statut === "suspendu";

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Flex align="start" justify="between" mb="6" gap="4" wrap="wrap">
          <Flex align="center" gap="4">
            {/* Bouton retour */}
            <Link href="/admin/etablissements" style={{ textDecoration: "none" }}>
              <Button
                variant="ghost"
                color="gray"
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  padding: 0,
                  borderRadius: 8,
                }}
              >
                <CaretLeft size={20} weight="bold" />
              </Button>
            </Link>

            <Box>
              <Flex align="center" gap="3" mb="1">
                <Heading size="6" weight="bold">
                  {etablissement.nom}
                </Heading>
              </Flex>
              <Flex gap="2" align="center" wrap="wrap">
                {/* Badge statut */}
                <Badge
                  variant="soft"
                  color={statutColors[etablissement.statut] || "gray"}
                >
                  {statutLabels[etablissement.statut] || etablissement.statut}
                </Badge>
                {/* Badge plan */}
                <Badge
                  variant="surface"
                  color={planColors[etablissement.plan] || "gray"}
                >
                  {planLabels[etablissement.plan] || etablissement.plan}
                </Badge>
                {/* Date de creation */}
                <Text size="1" color="gray">
                  Cree le{" "}
                  {new Date(etablissement.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Flex>
            </Box>
          </Flex>

          {/* Boutons d'action */}
          <Flex gap="2" wrap="wrap">
            <Link
              href={`/admin/etablissements/${id}/abonnement`}
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="soft"
                color="blue"
                style={{ minHeight: 36 }}
              >
                <CreditCard size={16} weight="bold" />
                Abonnement
              </Button>
            </Link>

            <Link
              href={`/admin/etablissements/${id}/facturation`}
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="soft"
                color="orange"
                style={{ minHeight: 36 }}
              >
                <Receipt size={16} weight="bold" />
                Facturation
              </Button>
            </Link>

            <Button
              variant="soft"
              onClick={() => setEditDialogOpen(true)}
              style={{ minHeight: 36 }}
            >
              <PencilSimple size={16} weight="bold" />
              Editer
            </Button>

            {isSuspended ? (
              <Button
                variant="soft"
                color="green"
                onClick={() => setReactivateDialogOpen(true)}
                style={{ minHeight: 36 }}
              >
                <Play size={16} weight="fill" />
                Reactiver
              </Button>
            ) : (
              <Button
                variant="soft"
                color="amber"
                onClick={() => setSuspendDialogOpen(true)}
                style={{ minHeight: 36 }}
              >
                <Pause size={16} weight="bold" />
                Suspendre
              </Button>
            )}

            <Button
              variant="soft"
              color="red"
              onClick={() => setDeleteDialogOpen(true)}
              style={{ minHeight: 36 }}
            >
              <Trash size={16} weight="bold" />
              Supprimer
            </Button>
          </Flex>
        </Flex>
      </motion.div>

      {/* Onglets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="info">
              <Flex align="center" gap="2">
                <Info size={16} weight={activeTab === "info" ? "fill" : "regular"} />
                Informations
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="stats">
              <Flex align="center" gap="2">
                <ChartLine size={16} weight={activeTab === "stats" ? "fill" : "regular"} />
                Statistiques
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="users">
              <Flex align="center" gap="2">
                <Users size={16} weight={activeTab === "users" ? "fill" : "regular"} />
                Utilisateurs
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="audit">
              <Flex align="center" gap="2">
                <ClockCounterClockwise size={16} weight={activeTab === "audit" ? "fill" : "regular"} />
                Activite
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="5">
            <Tabs.Content value="info">
              <InfoTab etablissement={etablissement} />
            </Tabs.Content>

            <Tabs.Content value="stats">
              <StatsTab
                etablissement={etablissement}
                stats={detailedStats}
                isLoading={isStatsLoading}
                onPeriodeChange={(p) => loadStats(p)}
              />
            </Tabs.Content>

            <Tabs.Content value="users">
              <UsersTab
                etablissement={etablissement}
                users={users.map((u) => ({
                  id: u.id,
                  nom: u.nom,
                  prenom: u.prenom,
                  email: u.email,
                  role: u.role,
                  actif: u.actif,
                  lastLogin: u.derniere_connexion,
                  createdAt: u.created_at,
                }))}
                isLoading={isUsersLoading}
                maxUsers={etablissement.quotas?.utilisateurs?.max}
              />
            </Tabs.Content>

            <Tabs.Content value="audit">
              <AuditTab
                events={auditEvents.map((e) => ({
                  id: e.id,
                  action: e.action,
                  entite: e.entite,
                  entiteId: e.entite_id || undefined,
                  description: e.description || "",
                  utilisateurNom: e.utilisateur_nom
                    ? `${e.utilisateur_prenom || ""} ${e.utilisateur_nom}`.trim()
                    : undefined,
                  createdAt: e.created_at,
                }))}
                isLoading={isAuditLoading}
                hasMore={auditHasMore}
                onLoadMore={() => loadAudit(auditPage + 1)}
                onFilterChange={(filters) => loadAudit(1, filters)}
                users={users.map((u) => ({
                  id: u.id,
                  nom: u.nom,
                  prenom: u.prenom,
                }))}
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </motion.div>

      {/* Dialogs */}
      <EditEtablissementDialog
        etablissement={etablissement}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEdit}
      />

      <SuspendDialog
        etablissement={etablissement}
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        onConfirm={handleSuspend}
        nbUtilisateurs={etablissement.nbUtilisateurs}
      />

      <ReactivateDialog
        etablissement={etablissement}
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
        onConfirm={handleReactivate}
        motifSuspension={etablissement.motifSuspension}
        dateSuspension={etablissement.dateSuspension}
      />

      {/* Dialog suppression */}
      <Dialog.Root
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteDialogOpen(false);
            setConfirmationNom("");
            setDeleteResult(null);
          }
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
                    <Flex direction="column" gap="1">
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
                    </Flex>
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
                <Text weight="bold">"{etablissement.nom}"</Text> et toutes ses donnees.
              </Dialog.Description>

              <Callout.Root color="red" variant="surface" mb="4">
                <Callout.Icon>
                  <Warning size={16} weight="fill" />
                </Callout.Icon>
                <Callout.Text size="2">
                  Cette action est <Text weight="bold">irreversible</Text>.
                </Callout.Text>
              </Callout.Root>

              <Flex direction="column" gap="2" mb="4">
                <Flex align="center" gap="2">
                  <Users size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                  <Text size="2">{etablissement.nbUtilisateurs} utilisateur(s)</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Package size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                  <Text size="2">{etablissement.nbProduits} produit(s)</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <ShoppingCart size={14} weight="duotone" style={{ color: "var(--red-9)" }} />
                  <Text size="2">{etablissement.nbVentes} vente(s)</Text>
                </Flex>
              </Flex>

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
                  "{etablissement.nom}"
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
                disabled={isDeleting || confirmationNom !== etablissement.nom || !!deleteResult?.error}
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
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Box>
      <Flex align="center" justify="between" mb="6">
        <Flex align="center" gap="4">
          <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
          <Flex direction="column" gap="2">
            <Skeleton style={{ width: 280, height: 28 }} />
            <Flex gap="2">
              <Skeleton style={{ width: 64, height: 22, borderRadius: 9999 }} />
              <Skeleton style={{ width: 80, height: 22, borderRadius: 9999 }} />
              <Skeleton style={{ width: 140, height: 16 }} />
            </Flex>
          </Flex>
        </Flex>
        <Flex gap="2">
          <Skeleton style={{ width: 100, height: 36, borderRadius: 8 }} />
          <Skeleton style={{ width: 110, height: 36, borderRadius: 8 }} />
          <Skeleton style={{ width: 110, height: 36, borderRadius: 8 }} />
        </Flex>
      </Flex>
      <Skeleton style={{ width: "100%", height: 40, borderRadius: 8, marginBottom: 20 }} />
      <Skeleton style={{ width: "100%", height: 400, borderRadius: 12 }} />
    </Box>
  );
}
