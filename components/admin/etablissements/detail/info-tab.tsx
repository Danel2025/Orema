"use client";

/**
 * Onglet Informations - Détail établissement
 * Affiche les infos générales, légales, paramètres clés et abonnement
 */

import { Box, Flex, Grid, Heading, Text, Badge, Separator } from "@radix-ui/themes";
import {
  Buildings,
  IdentificationBadge,
  ImageSquare,
  Gear,
  CreditCard,
  Storefront,
  CalendarBlank,
  Crown,
} from "@phosphor-icons/react";
import type { IconWeight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { EtablissementDetail } from "./types";

interface InfoTabProps {
  etablissement: EtablissementDetail;
}

function InfoSection({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; weight?: IconWeight; style?: React.CSSProperties }>;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Box
        p="5"
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          border: "1px solid var(--gray-a4)",
        }}
      >
        <Flex align="center" gap="2" mb="4">
          <Box
            p="2"
            style={{
              background: "var(--accent-a3)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} weight="duotone" style={{ color: "var(--accent-9)" }} />
          </Box>
          <Heading size="3" weight="medium">
            {title}
          </Heading>
        </Flex>
        {children}
      </Box>
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <Flex justify="between" align="center" py="2">
      <Text size="2" color="gray">
        {label}
      </Text>
      <Text
        size="2"
        weight="medium"
        style={mono ? { fontFamily: "var(--font-google-sans-code), ui-monospace, monospace" } : undefined}
      >
        {value || "—"}
      </Text>
    </Flex>
  );
}

export function InfoTab({ etablissement }: InfoTabProps) {
  const modesVente = etablissement.modesPaiementActifs || [];

  const modeVenteLabels: Record<string, string> = {
    ESPECES: "Especes",
    CARTE_BANCAIRE: "Carte bancaire",
    AIRTEL_MONEY: "Airtel Money",
    MOOV_MONEY: "Moov Money",
    CHEQUE: "Cheque",
    VIREMENT: "Virement",
    COMPTE_CLIENT: "Compte client",
    MIXTE: "Mixte",
  };

  const modeVenteDefautLabels: Record<string, string> = {
    DIRECT: "Vente directe",
    TABLE: "Service a table",
    LIVRAISON: "Livraison",
    EMPORTER: "A emporter",
  };

  return (
    <Grid columns={{ initial: "1", md: "2" }} gap="5">
      {/* Informations generales */}
      <InfoSection title="Informations generales" icon={Buildings} delay={0}>
        <Flex direction="column" gap="1">
          <InfoRow label="Nom" value={etablissement.nom} />
          <Separator size="4" />
          <InfoRow label="Adresse" value={etablissement.adresse} />
          <Separator size="4" />
          <InfoRow label="Téléphone" value={etablissement.telephone} />
          <Separator size="4" />
          <InfoRow label="Email" value={etablissement.email} />
        </Flex>
      </InfoSection>

      {/* Informations legales */}
      <InfoSection title="Informations legales" icon={IdentificationBadge} delay={0.05}>
        <Flex direction="column" gap="1">
          <InfoRow label="NIF" value={etablissement.nif} mono />
          <Separator size="4" />
          <InfoRow label="RCCM" value={etablissement.rccm} mono />
        </Flex>
      </InfoSection>

      {/* Logo & personnalisation */}
      <InfoSection title="Logo & personnalisation" icon={ImageSquare} delay={0.1}>
        <Flex direction="column" gap="3">
          {/* Apercu logo */}
          <Flex align="center" gap="3" py="2">
            <Text size="2" color="gray">Logo</Text>
            {etablissement.logo ? (
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid var(--gray-a4)",
                }}
              >
                <img
                  src={etablissement.logo}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            ) : (
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: "var(--gray-a3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Storefront size={24} weight="duotone" style={{ color: "var(--gray-8)" }} />
              </Box>
            )}
          </Flex>
          <Separator size="4" />
          <Box py="2">
            <Text size="2" color="gray" style={{ display: "block", marginBottom: 4 }}>
              Message ticket
            </Text>
            <Text size="2" style={{ fontStyle: etablissement.messageTicket ? "normal" : "italic" }}>
              {etablissement.messageTicket || "Aucun message configure"}
            </Text>
          </Box>
        </Flex>
      </InfoSection>

      {/* Paramètres clés */}
      <InfoSection title="Paramètres clés" icon={Gear} delay={0.15}>
        <Flex direction="column" gap="1">
          <InfoRow
            label="TVA standard"
            value={`${etablissement.tauxTvaStandard || 18}%`}
            mono
          />
          <Separator size="4" />
          <InfoRow
            label="TVA reduit"
            value={`${etablissement.tauxTvaReduit || 10}%`}
            mono
          />
          <Separator size="4" />
          <Flex justify="between" align="center" py="2">
            <Text size="2" color="gray">
              Mode de vente par defaut
            </Text>
            <Badge color="orange" variant="soft">
              {modeVenteDefautLabels[etablissement.modeVenteDefaut || "DIRECT"] || "Direct"}
            </Badge>
          </Flex>
          <Separator size="4" />
          <Box py="2">
            <Text size="2" color="gray" style={{ display: "block", marginBottom: 8 }}>
              Modes de paiement actifs
            </Text>
            <Flex gap="2" wrap="wrap">
              {modesVente.length > 0 ? (
                modesVente.map((mode) => (
                  <Badge key={mode} variant="soft" color="blue" size="1">
                    <CreditCard size={12} weight="bold" />
                    {modeVenteLabels[mode] || mode}
                  </Badge>
                ))
              ) : (
                <Text size="2" color="gray" style={{ fontStyle: "italic" }}>
                  Aucun mode configure
                </Text>
              )}
            </Flex>
          </Box>
        </Flex>
      </InfoSection>

      {/* Abonnement */}
      <InfoSection title="Abonnement" icon={Crown} delay={0.2}>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Text size="2" color="gray">Plan actuel</Text>
            <Badge
              variant="solid"
              color={
                etablissement.planAbonnement === "PREMIUM"
                  ? "orange"
                  : etablissement.planAbonnement === "PRO"
                    ? "blue"
                    : "gray"
              }
            >
              <Crown size={12} weight="fill" />
              {etablissement.planAbonnement || "GRATUIT"}
            </Badge>
          </Flex>

          {/* Quotas avec barres de progression */}
          {etablissement.quotas ? <>
              <Separator size="4" />
              <Box>
                <Text size="2" color="gray" style={{ display: "block", marginBottom: 8 }}>
                  Quotas d'utilisation
                </Text>
                <Flex direction="column" gap="3">
                  {etablissement.quotas.utilisateurs ? <QuotaBar
                      label="Utilisateurs"
                      used={etablissement.quotas.utilisateurs.used}
                      max={etablissement.quotas.utilisateurs.max}
                    /> : null}
                  {etablissement.quotas.produits ? <QuotaBar
                      label="Produits"
                      used={etablissement.quotas.produits.used}
                      max={etablissement.quotas.produits.max}
                    /> : null}
                  {etablissement.quotas.ventes ? <QuotaBar
                      label="Ventes / mois"
                      used={etablissement.quotas.ventes.used}
                      max={etablissement.quotas.ventes.max}
                    /> : null}
                </Flex>
              </Box>
            </> : null}

          {etablissement.dateExpirationAbonnement ? <>
              <Separator size="4" />
              <Flex justify="between" align="center">
                <Text size="2" color="gray">
                  <CalendarBlank size={14} weight="bold" style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Expire le
                </Text>
                <Text size="2" weight="medium">
                  {new Date(etablissement.dateExpirationAbonnement).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Flex>
            </> : null}
        </Flex>
      </InfoSection>

      {/* Date de creation */}
      <InfoSection title="Informations systeme" icon={CalendarBlank} delay={0.25}>
        <Flex direction="column" gap="1">
          <InfoRow
            label="Date de creation"
            value={new Date(etablissement.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Separator size="4" />
          <InfoRow
            label="Dernière mise à jour"
            value={new Date(etablissement.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </Flex>
      </InfoSection>
    </Grid>
  );
}

function QuotaBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const percentage = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <Box>
      <Flex justify="between" align="center" mb="1">
        <Text size="1" color="gray">{label}</Text>
        <Text
          size="1"
          weight="medium"
          style={{
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            color: isCritical
              ? "var(--red-9)"
              : isWarning
                ? "var(--amber-9)"
                : "var(--gray-11)",
          }}
        >
          {used} / {max}
        </Text>
      </Flex>
      <Box
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--gray-a3)",
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            height: "100%",
            width: `${percentage}%`,
            borderRadius: 3,
            background: isCritical
              ? "var(--red-9)"
              : isWarning
                ? "var(--amber-9)"
                : "var(--accent-9)",
            transition: "width 0.5s ease",
          }}
        />
      </Box>
    </Box>
  );
}
