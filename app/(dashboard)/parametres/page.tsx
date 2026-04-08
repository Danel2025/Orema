import { Suspense } from "react";
import Link from "next/link";
import { Box, Flex, Heading, Text, Skeleton, Card, Button } from "@radix-ui/themes";

import {
  getEtablissementInfo,
  getFiscalSettings,
  getImprimantesWithCategories,
  getZonesLivraison,
  getCaisseVentesSettings,
  getStockSettings,
  getSecuriteSettings,
  getFideliteSettings,
  getPlanSalleSettings,
  getDataStatistics,
  getParametresFacture,
} from "@/actions/parametres";
import { listBackups, getBackupStats } from "@/actions/backup";
import { getEcrans } from "@/actions/ecrans";
import { getCategories } from "@/actions/categories";

import {
  EtablissementSettings,
  FiscalSettings,
  PrinterSettings,
  AppearanceSettings,
  DeliverySettings,
  CaisseVentesSettings,
  StockSettings,
  SecuriteSettings,
  FideliteSettings,
  PlanSalleSettings,
  DataSettings,
  ParametresTabs,
  TabContent,
} from "@/components/parametres";
import { InvoiceSettings } from "@/components/parametres/invoice-settings";
import { EcransSettings } from "@/components/parametres/ecrans-settings";

// Composant de chargement
function SettingsLoading() {
  return (
    <Box style={{ border: "1px solid var(--gray-a6)", borderRadius: 8 }} p="4">
      <Flex direction="column" gap="4">
        <Skeleton height="24px" width="200px" />
        <Skeleton height="80px" />
        <Skeleton height="80px" />
        <Skeleton height="48px" width="180px" />
      </Flex>
    </Box>
  );
}

// Server Component pour charger les donnees de l'etablissement
async function EtablissementSettingsLoader() {
  const etablissement = await getEtablissementInfo();

  return (
    <EtablissementSettings
      initialData={{
        id: etablissement.id,
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        telephone: etablissement.telephone,
        email: etablissement.email,
        nif: etablissement.nif,
        rccm: etablissement.rccm,
        logo: etablissement.logo,
        messageTicket: etablissement.messageTicket,
      }}
    />
  );
}

// Server Component pour charger les parametres fiscaux
async function FiscalSettingsLoader() {
  const fiscalSettings = await getFiscalSettings();

  return <FiscalSettings initialData={fiscalSettings} />;
}

// Server Component pour charger les imprimantes
async function PrinterSettingsLoader() {
  const [imprimantes, etablissement] = await Promise.all([
    getImprimantesWithCategories(),
    getEtablissementInfo(),
  ]);

  return <PrinterSettings initialData={imprimantes} etablissementNom={etablissement.nom} />;
}

// Server Component pour charger les zones de livraison
async function DeliverySettingsLoader() {
  const zones = await getZonesLivraison();

  return (
    <DeliverySettings
      initialData={zones.map((z) => ({
        id: z.id,
        nom: z.nom,
        description: z.description,
        couleur: z.couleur,
        ordre: z.ordre,
        active: z.active,
        frais_livraison: z.frais_livraison,
        delai_estime: z.delai_estime,
      }))}
    />
  );
}

// Server Component pour charger les parametres de caisse
async function CaisseVentesSettingsLoader() {
  const settings = await getCaisseVentesSettings();

  return <CaisseVentesSettings initialData={settings} />;
}

// Server Component pour charger les parametres de stock
async function StockSettingsLoader() {
  const settings = await getStockSettings();

  return <StockSettings initialData={settings} />;
}

// Server Component pour charger les parametres de securite
async function SecuriteSettingsLoader() {
  const settings = await getSecuriteSettings();

  return <SecuriteSettings initialData={settings} />;
}

// Server Component pour charger les parametres de fidelite
async function FideliteSettingsLoader() {
  const settings = await getFideliteSettings();

  return <FideliteSettings initialData={settings} />;
}

// Server Component pour charger les parametres du plan de salle
async function PlanSalleSettingsLoader() {
  const settings = await getPlanSalleSettings();

  return <PlanSalleSettings initialData={settings} />;
}

// Server Component pour charger les parametres de facture
async function InvoiceSettingsLoader() {
  const settings = await getParametresFacture();

  return <InvoiceSettings initialData={settings} />;
}

// Server Component pour charger les ecrans d'affichage
async function EcransSettingsLoader() {
  const [ecransResult, categoriesResult] = await Promise.all([
    getEcrans(),
    getCategories(),
  ]);

  const ecrans = ecransResult.success ? ecransResult.data ?? [] : [];
  const categories = (categoriesResult ?? []).map((c) => ({
    id: c.id as string,
    nom: c.nom as string,
    couleur: (c.couleur as string) || "#888888",
  }));

  return <EcransSettings initialEcrans={ecrans} initialCategories={categories} />;
}

// Server Component pour charger les statistiques de donnees et backups
async function DataSettingsLoader() {
  const [statsResult, backupsResult, backupStatsResult] = await Promise.all([
    getDataStatistics(),
    listBackups(),
    getBackupStats(),
  ]);

  const stats = statsResult.success ? statsResult.data : {};
  const backups = backupsResult.success ? backupsResult.data : [];
  const backupStats = backupStatsResult.success ? backupStatsResult.data : {};

  return (
    <DataSettings initialStats={stats} initialBackups={backups} initialBackupStats={backupStats} />
  );
}

export default function ParametresPage() {
  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center" wrap="wrap" gap="3">
          <Box>
            <Heading size="6" weight="bold">
              Parametres
            </Heading>
            <Text size="2" color="gray">
              Configuration de l&apos;etablissement et du systeme
            </Text>
          </Box>
        </Flex>

        {/* Onglets de parametres - Composant client pour éviter erreur d'hydratation */}
        <ParametresTabs>
          {/* Contenu: Établissement */}
          <TabContent value="etablissement">
            <Suspense fallback={<SettingsLoading />}>
              <EtablissementSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Fiscalite */}
          <TabContent value="fiscalite">
            <Suspense fallback={<SettingsLoading />}>
              <FiscalSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Caisse & Ventes */}
          <TabContent value="caisse">
            <Suspense fallback={<SettingsLoading />}>
              <CaisseVentesSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Stocks */}
          <TabContent value="stocks">
            <Suspense fallback={<SettingsLoading />}>
              <StockSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Fidelite */}
          <TabContent value="fidelite">
            <Suspense fallback={<SettingsLoading />}>
              <FideliteSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Imprimantes */}
          <TabContent value="imprimantes">
            <Suspense fallback={<SettingsLoading />}>
              <PrinterSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Ecrans d'affichage */}
          <TabContent value="ecrans">
            <Suspense fallback={<SettingsLoading />}>
              <EcransSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Factures */}
          <TabContent value="factures">
            <Suspense fallback={<SettingsLoading />}>
              <InvoiceSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Zones de livraison */}
          <TabContent value="livraison">
            <Suspense fallback={<SettingsLoading />}>
              <DeliverySettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Plan de salle */}
          <TabContent value="plan-salle">
            <Suspense fallback={<SettingsLoading />}>
              <PlanSalleSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Securite */}
          <TabContent value="securite">
            <Suspense fallback={<SettingsLoading />}>
              <SecuriteSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Tarification */}
          <TabContent value="tarification">
            <Card size="3">
              <Flex direction="column" gap="3" align="start">
                <Heading size="4">Tarification & Restrictions</Heading>
                <Text size="2" color="gray">
                  Configurez les regles de remise par role, la protection des marges,
                  les tarifs horaires et le workflow d&apos;approbation des remises.
                </Text>
                <Button asChild>
                  <Link href="/parametres/tarification">
                    Acceder a la configuration tarifaire
                  </Link>
                </Button>
              </Flex>
            </Card>
          </TabContent>

          {/* Contenu: Donnees (import/export, remise a zero) */}
          <TabContent value="donnees">
            <Suspense fallback={<SettingsLoading />}>
              <DataSettingsLoader />
            </Suspense>
          </TabContent>

          {/* Contenu: Apparence */}
          <TabContent value="apparence">
            <AppearanceSettings />
          </TabContent>
        </ParametresTabs>
      </Flex>
    </Box>
  );
}
