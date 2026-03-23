import { Suspense } from "react";
import { Box, Flex, Heading, Text, Tabs, Skeleton } from "@radix-ui/themes";

import {
  getReglesTarificationAction,
  getConfigTarificationAction,
  getHistoriquePrixAction,
  getTarifsHorairesAction,
} from "@/actions/tarification";
import {
  getApprobationsPendantesAction,
  getApprobationsHistoriqueAction,
} from "@/actions/approbation-remises";

import { ReglesRoleTable } from "@/components/parametres/tarification/regles-role-table";
import { MargeProtectionCard } from "@/components/parametres/tarification/marge-protection-card";
import { TarifsHorairesManager } from "@/components/parametres/tarification/tarifs-horaires-manager";
import { HistoriquePrixTimeline } from "@/components/parametres/tarification/historique-prix-timeline";
import { ApprobationQueue } from "@/components/parametres/tarification/approbation-queue";

export const metadata = {
  title: "Tarification & Restrictions | Parametres",
  description: "Configuration des regles tarifaires, marges et approbations",
};

function SectionLoading() {
  return (
    <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
      <Flex direction="column" gap="4">
        <Skeleton height="24px" width="250px" />
        <Skeleton height="80px" />
        <Skeleton height="80px" />
        <Skeleton height="48px" width="180px" />
      </Flex>
    </Box>
  );
}

async function ReglesLoader() {
  const result = await getReglesTarificationAction();
  const rows = result.success && result.data ? result.data : [];

  // Map DB rows (snake_case) to UI types (camelCase)
  const regles = rows.map((r) => ({
    role: r.role as "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR",
    remiseMaxPourcent: r.remise_max_pourcent,
    peutModifierPrix: r.peut_modifier_prix,
    peutAppliquerRemise: r.peut_appliquer_remise,
    plafondRemiseTransaction: r.plafond_remise_transaction,
    necessiteApprobationAuDela: r.necessite_approbation_au_dela,
  }));

  return <ReglesRoleTable initialRegles={regles} />;
}

async function ConfigLoader() {
  const result = await getConfigTarificationAction();

  // Map DB row (snake_case) to UI type (camelCase)
  const config = result.success && result.data
    ? {
        protectionMargeActive: result.data.protection_marge_active,
        margeMinimumGlobale: result.data.marge_minimum_globale,
        approbationRemiseActive: result.data.approbation_remise_active,
        tarifsHorairesActifs: result.data.tarifs_horaires_actifs,
      }
    : {
        protectionMargeActive: false,
        margeMinimumGlobale: 0,
        approbationRemiseActive: false,
        tarifsHorairesActifs: false,
      };

  return <MargeProtectionCard initialConfig={config} />;
}

async function TarifsHorairesLoader() {
  const result = await getTarifsHorairesAction();
  const rows = result.success && result.data ? result.data : [];

  // Map DB rows to UI types
  const tarifs = rows.map((t) => ({
    id: t.id,
    nom: t.nom,
    heureDebut: t.heure_debut,
    heureFin: t.heure_fin,
    joursSemaine: t.jours_semaine,
    typeAjustement: t.type_ajustement,
    valeurAjustement: t.valeur_ajustement,
    categorieId: t.categorie_id,
    actif: t.actif,
    priorite: t.priorite,
  }));

  return <TarifsHorairesManager initialTarifs={tarifs} />;
}

async function HistoriqueLoader() {
  const result = await getHistoriquePrixAction({ page: 1, limit: 10 });
  const rawData = result.success && result.data
    ? result.data
    : { data: [], total: 0 };

  // Map DB rows to UI types
  const entries = rawData.data.map((h) => ({
    id: h.id,
    produitNom: h.produit_id,
    ancienPrix: h.ancien_prix,
    nouveauPrix: h.nouveau_prix,
    utilisateurNom: h.utilisateur_id,
    raison: h.raison,
    createdAt: h.created_at,
  }));

  return (
    <HistoriquePrixTimeline
      initialEntries={entries}
      initialTotal={rawData.total}
    />
  );
}

async function ApprobationsLoader() {
  const [pendantesResult, historiqueResult] = await Promise.all([
    getApprobationsPendantesAction(),
    getApprobationsHistoriqueAction(1, 10),
  ]);

  const pendantesRows =
    pendantesResult.success && pendantesResult.data
      ? pendantesResult.data
      : [];
  const historiqueRaw =
    historiqueResult.success && historiqueResult.data
      ? historiqueResult.data
      : { data: [], total: 0 };

  // Map DB rows to UI types
  const mapApprobation = (a: typeof pendantesRows[number]) => ({
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
  });

  return (
    <ApprobationQueue
      initialPendantes={pendantesRows.map(mapApprobation)}
      initialHistorique={historiqueRaw.data.map(mapApprobation)}
      initialHistoriqueTotal={historiqueRaw.total}
    />
  );
}

export default function TarificationPage() {
  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="6" weight="bold">
            Tarification & Restrictions
          </Heading>
          <Text size="2" color="gray">
            Regles de remise par role, protection des marges, tarifs horaires et approbations
          </Text>
        </Box>

        <Tabs.Root defaultValue="regles">
          <Tabs.List mb="4" style={{ flexWrap: "wrap" }}>
            <Tabs.Trigger value="regles">
              <Flex align="center" gap="2">
                Regles par role
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="protection">
              <Flex align="center" gap="2">
                Protection des marges
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="horaires">
              <Flex align="center" gap="2">
                Tarifs horaires
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="historique">
              <Flex align="center" gap="2">
                Historique des prix
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="approbations">
              <Flex align="center" gap="2">
                Approbations
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="regles">
            <Suspense fallback={<SectionLoading />}>
              <ReglesLoader />
            </Suspense>
          </Tabs.Content>

          <Tabs.Content value="protection">
            <Suspense fallback={<SectionLoading />}>
              <ConfigLoader />
            </Suspense>
          </Tabs.Content>

          <Tabs.Content value="horaires">
            <Suspense fallback={<SectionLoading />}>
              <TarifsHorairesLoader />
            </Suspense>
          </Tabs.Content>

          <Tabs.Content value="historique">
            <Suspense fallback={<SectionLoading />}>
              <HistoriqueLoader />
            </Suspense>
          </Tabs.Content>

          <Tabs.Content value="approbations">
            <Suspense fallback={<SectionLoading />}>
              <ApprobationsLoader />
            </Suspense>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Box>
  );
}
