"use client";

/**
 * TicketPreview - Aperçu en temps réel du ticket/facture
 * Simule l'apparence du ticket imprimé selon les paramètres configurés
 */

import { Box, Flex, Text, Separator } from "@radix-ui/themes";
import { QrCode } from "@phosphor-icons/react";
import type {
  ParametresFactureFormData,
  TypeFacture,
  StyleSeparateur,
} from "@/schemas/parametres.schema";

interface TicketPreviewProps {
  settings: ParametresFactureFormData;
  typeFacture: TypeFacture;
  etablissement?: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    nif?: string | null;
    rccm?: string | null;
    logo?: string | null;
  };
}

// Données d'exemple pour la prévisualisation
const EXEMPLE_LIGNES = [
  { nom: "Poulet braisé", qte: 2, prix: 5000, total: 10000 },
  { nom: "Riz sauce arachide", qte: 2, prix: 2500, total: 5000 },
  { nom: "Bière Flag 65cl", qte: 3, prix: 1500, total: 4500 },
  { nom: "Eau minérale 1.5L", qte: 1, prix: 800, total: 800 },
];

const EXEMPLE_CLIENT = {
  nom: "Jean-Pierre MOUSSAVOU",
  telephone: "+241 77 12 34 56",
};

// Génère le caractère de séparation selon le style
function getSeparatorChar(style: StyleSeparateur): string {
  switch (style) {
    case "LIGNE_PLEINE":
      return "─";
    case "TIRETS":
      return "-";
    case "ETOILES":
      return "*";
    case "EGAL":
      return "=";
    case "AUCUN":
      return "";
    default:
      return "-";
  }
}

// Génère une ligne de séparation
function TicketSeparator({ style, width = 32 }: { style: StyleSeparateur; width?: number }) {
  const char = getSeparatorChar(style);
  if (!char) return <Box my="1" />;
  return (
    <Text
      size="1"
      style={{
        fontFamily: "monospace",
        display: "block",
        textAlign: "center",
        color: "var(--gray-11)",
        letterSpacing: "-1px",
      }}
    >
      {char.repeat(width)}
    </Text>
  );
}

// Ligne de texte alignée gauche/droite
function TicketLine({
  left,
  right,
  bold = false,
}: {
  left: string;
  right?: string;
  bold?: boolean;
}) {
  return (
    <Flex justify="between" gap="2">
      <Text size="1" weight={bold ? "bold" : "regular"} style={{ fontFamily: "monospace" }}>
        {left}
      </Text>
      {right ? (
        <Text
          size="1"
          weight={bold ? "bold" : "regular"}
          style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}
        >
          {right}
        </Text>
      ) : null}
    </Flex>
  );
}

// Texte centré
function TicketCenter({
  children,
  bold = false,
  size = "1",
}: {
  children: React.ReactNode;
  bold?: boolean;
  size?: "1" | "2" | "3";
}) {
  return (
    <Text
      size={size}
      weight={bold ? "bold" : "regular"}
      align="center"
      style={{ fontFamily: "monospace", display: "block" }}
    >
      {children}
    </Text>
  );
}

export function TicketPreview({
  settings,
  typeFacture,
  etablissement = {
    nom: "Restaurant Le Maquis",
    adresse: "Quartier Louis, Libreville",
    telephone: "+241 01 23 45 67",
    nif: "123456789",
    rccm: "GA-LBV-01-2024-B12-00123",
  },
}: TicketPreviewProps) {
  // Calculs
  const sousTotal = EXEMPLE_LIGNES.reduce((sum, l) => sum + l.total, 0);
  const tva = Math.round(sousTotal * 0.18);
  const total = sousTotal;
  const date = new Date().toLocaleDateString("fr-GA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // En-tête selon le type
  const getEntete = () => {
    switch (typeFacture) {
      case "TICKET_SIMPLE":
        return settings.enteteTicketSimple;
      case "FACTURE_DETAILLEE":
        return settings.enteteFactureDetaillee || "FACTURE";
      case "PRO_FORMA":
        return settings.enteteProForma || "PRO-FORMA";
      case "NOTE_ADDITION":
        return settings.enteteNoteAddition || "ADDITION";
      default:
        return null;
    }
  };

  // Pied de page selon le type
  const getPiedPage = () => {
    switch (typeFacture) {
      case "TICKET_SIMPLE":
        return settings.piedPageTicketSimple || "Merci de votre visite !";
      case "FACTURE_DETAILLEE":
        return settings.piedPageFactureDetaillee || "Conditions de paiement : comptant";
      case "PRO_FORMA":
        return settings.piedPageProForma || "Ce document n'est pas une facture";
      case "NOTE_ADDITION":
        return settings.piedPageNoteAddition || "Merci de régler à la caisse";
      default:
        return "";
    }
  };

  // Copies
  const getCopies = () => {
    switch (typeFacture) {
      case "TICKET_SIMPLE":
        return settings.copiesTicketSimple;
      case "FACTURE_DETAILLEE":
        return settings.copiesFactureDetaillee;
      case "PRO_FORMA":
        return settings.copiesProForma;
      case "NOTE_ADDITION":
        return settings.copiesNoteAddition;
      default:
        return 1;
    }
  };

  const entete = getEntete();
  const piedPage = getPiedPage();
  const copies = getCopies();

  return (
    <Box
      p="4"
      style={{
        backgroundColor: "#fff",
        border: "1px solid var(--gray-6)",
        borderRadius: "var(--radius-3)",
        maxWidth: "320px",
        margin: "0 auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Indicateur de copies */}
      {copies > 1 && (
        <Text
          size="1"
          color="gray"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontSize: "10px",
          }}
        >
          x{copies} copies
        </Text>
      )}

      <Flex direction="column" gap="1">
        {/* Logo */}
        {settings.afficherLogo && etablissement.logo ? (
          <Flex justify="center" mb="2">
            <Box
              style={{
                width: "80px",
                height: "40px",
                backgroundColor: "var(--gray-4)",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text size="1" color="gray">
                [LOGO]
              </Text>
            </Box>
          </Flex>
        ) : null}

        {/* Infos établissement */}
        {settings.afficherInfosEtablissement ? (
          <>
            <TicketCenter bold size="2">
              {etablissement.nom}
            </TicketCenter>
            {etablissement.adresse ? <TicketCenter>{etablissement.adresse}</TicketCenter> : null}
            {etablissement.telephone ? (
              <TicketCenter>Tél: {etablissement.telephone}</TicketCenter>
            ) : null}
          </>
        ) : null}

        {/* NIF / RCCM */}
        {settings.afficherNifRccm ? (
          <>
            {etablissement.nif ? <TicketCenter>NIF: {etablissement.nif}</TicketCenter> : null}
            {etablissement.rccm ? <TicketCenter>RCCM: {etablissement.rccm}</TicketCenter> : null}
          </>
        ) : null}

        <TicketSeparator style={settings.styleSeparateur} />

        {/* En-tête du type de document */}
        {entete ? (
          <>
            <TicketCenter bold size="2">
              {entete}
            </TicketCenter>
            <TicketSeparator style={settings.styleSeparateur} />
          </>
        ) : null}

        {/* Numéro et date */}
        <TicketLine left="N°: 20260130-00042" />
        <TicketLine left={`Date: ${date}`} />
        <TicketLine left="Caissier: Marie" />

        {/* Table (pour addition) */}
        {typeFacture === "NOTE_ADDITION" && <TicketLine left="Table: 7 (Terrasse)" />}

        {/* Client (pour facture détaillée et pro-forma) */}
        {(typeFacture === "FACTURE_DETAILLEE" || typeFacture === "PRO_FORMA") && (
          <>
            <TicketSeparator style={settings.styleSeparateur} />
            <TicketLine left="Client:" right={EXEMPLE_CLIENT.nom} />
            <TicketLine left="Tél:" right={EXEMPLE_CLIENT.telephone} />
          </>
        )}

        <TicketSeparator style={settings.styleSeparateur} />

        {/* En-tête articles */}
        <TicketLine left="Article" right="Total" bold />
        <TicketSeparator style={settings.styleSeparateur} />

        {/* Lignes de produits */}
        {EXEMPLE_LIGNES.map((ligne, idx) => (
          <Box key={idx}>
            <TicketLine
              left={`${ligne.qte}x ${ligne.nom}`}
              right={`${ligne.total.toLocaleString("fr-FR")} F`}
            />
          </Box>
        ))}

        <TicketSeparator style={settings.styleSeparateur} />

        {/* Sous-total */}
        <TicketLine left="Sous-total" right={`${sousTotal.toLocaleString("fr-FR")} F`} />

        {/* Détail TVA */}
        {settings.afficherDetailTva ? (
          <>
            <TicketLine left="TVA (18%)" right={`${tva.toLocaleString("fr-FR")} F`} />
            <TicketLine left="Total HT" right={`${(sousTotal - tva).toLocaleString("fr-FR")} F`} />
          </>
        ) : null}

        <TicketSeparator style={settings.styleSeparateur} />

        {/* Total */}
        <Flex justify="between" align="center">
          <Text size="3" weight="bold" style={{ fontFamily: "monospace" }}>
            TOTAL
          </Text>
          <Text size="3" weight="bold" style={{ fontFamily: "monospace" }}>
            {total.toLocaleString("fr-FR")} FCFA
          </Text>
        </Flex>

        {/* Mode de paiement (sauf pro-forma et addition) */}
        {typeFacture !== "PRO_FORMA" && typeFacture !== "NOTE_ADDITION" && (
          <>
            <TicketSeparator style={settings.styleSeparateur} />
            <TicketLine left="Espèces" right={`${(total + 700).toLocaleString("fr-FR")} F`} />
            <TicketLine left="Rendu" right="700 F" />
          </>
        )}

        {/* Validité pour pro-forma */}
        {typeFacture === "PRO_FORMA" && (
          <>
            <TicketSeparator style={settings.styleSeparateur} />
            <TicketCenter>Validité: 30 jours</TicketCenter>
          </>
        )}

        <TicketSeparator style={settings.styleSeparateur} />

        {/* QR Code */}
        {settings.afficherQrCode ? (
          <Flex justify="center" py="2">
            <Box
              p="2"
              style={{
                border: "1px solid var(--gray-6)",
                borderRadius: "4px",
              }}
            >
              <QrCode size={48} style={{ color: "var(--gray-11)" }} />
            </Box>
          </Flex>
        ) : null}

        {/* Pied de page */}
        {piedPage ? (
          <Box mt="2">
            <TicketCenter>{piedPage}</TicketCenter>
          </Box>
        ) : null}

        {/* Mention légale pour pro-forma */}
        {typeFacture === "PRO_FORMA" && (
          <Box
            mt="2"
            p="2"
            style={{
              backgroundColor: "var(--yellow-3)",
              borderRadius: "4px",
            }}
          >
            <Text size="1" color="yellow" align="center" style={{ display: "block" }}>
              Document non fiscal
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
}
