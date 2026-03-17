"use client";

/**
 * InventaireRecap - Resume des ecarts d'inventaire et validation
 * Affiche les statistiques, la liste des ecarts et le bouton de validation
 */

import {
  Flex,
  Text,
  Box,
  Table,
  Badge,
  Button,
  Callout,
  Checkbox,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import {
  CheckCircle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Save,
  ArrowLeft,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/design-system/currency";
import type { InventaireLigne } from "./inventaire-table";

interface InventaireRecapProps {
  lignes: InventaireLigne[];
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

export function InventaireRecap({
  lignes,
  isSubmitting,
  error,
  onSubmit,
  onBack,
}: InventaireRecapProps) {
  const getEcart = (l: InventaireLigne): number | null => {
    const qty = parseInt(l.quantiteComptee, 10);
    if (isNaN(qty)) return null;
    return qty - l.stockTheorique;
  };

  const getValeurEcart = (l: InventaireLigne): number | null => {
    const ecart = getEcart(l);
    if (ecart === null) return null;
    return ecart * (l.prixAchat ?? l.prixVente);
  };

  // Lignes comptees
  const lignesComptees = lignes.filter((l) => l.quantiteComptee !== "");
  const lignesNonComptees = lignes.length - lignesComptees.length;

  // Ecarts
  const lignesAvecEcart = lignesComptees.filter((l) => {
    const ecart = getEcart(l);
    return ecart !== null && ecart !== 0;
  });

  const ecartsPositifs = lignesAvecEcart.filter((l) => {
    const ecart = getEcart(l);
    return ecart !== null && ecart > 0;
  });

  const ecartsNegatifs = lignesAvecEcart.filter((l) => {
    const ecart = getEcart(l);
    return ecart !== null && ecart < 0;
  });

  // Valorisation des ecarts
  const valeurEcartsPositifs = ecartsPositifs.reduce((sum, l) => {
    const v = getValeurEcart(l);
    return sum + (v ?? 0);
  }, 0);

  const valeurEcartsNegatifs = ecartsNegatifs.reduce((sum, l) => {
    const v = getValeurEcart(l);
    return sum + (v ?? 0);
  }, 0);

  const valeurEcartTotal = valeurEcartsPositifs + valeurEcartsNegatifs;

  const ecartTotalQte = lignesAvecEcart.reduce((sum, l) => {
    const ecart = getEcart(l);
    return sum + (ecart ?? 0);
  }, 0);

  return (
    <Flex direction="column" gap="4">
      {/* Cartes de resume */}
      <Flex gap="4" wrap="wrap">
        <Box
          style={{
            flex: "1 1 180px",
            padding: 16,
            borderRadius: 8,
            backgroundColor: "var(--gray-a3)",
          }}
        >
          <Flex align="center" gap="2" mb="1">
            <Package size={16} style={{ color: "var(--gray-11)" }} />
            <Text size="2" color="gray">
              Produits comptes
            </Text>
          </Flex>
          <Text
            size="5"
            weight="bold"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {lignesComptees.length} / {lignes.length}
          </Text>
        </Box>

        <Box
          style={{
            flex: "1 1 180px",
            padding: 16,
            borderRadius: 8,
            backgroundColor:
              lignesAvecEcart.length > 0
                ? "var(--accent-a3)"
                : "var(--green-a3)",
          }}
        >
          <Flex align="center" gap="2" mb="1">
            <AlertCircle
              size={16}
              style={{
                color:
                  lignesAvecEcart.length > 0
                    ? "var(--accent-9)"
                    : "var(--green-9)",
              }}
            />
            <Text
              size="2"
              color={lignesAvecEcart.length > 0 ? "violet" : "green"}
            >
              Ecarts detectes
            </Text>
          </Flex>
          <Text
            size="5"
            weight="bold"
            color={lignesAvecEcart.length > 0 ? "violet" : "green"}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {lignesAvecEcart.length}
          </Text>
        </Box>

        <Box
          style={{
            flex: "1 1 180px",
            padding: 16,
            borderRadius: 8,
            backgroundColor:
              ecartsPositifs.length > 0
                ? "var(--green-a3)"
                : "var(--gray-a3)",
          }}
        >
          <Flex align="center" gap="2" mb="1">
            <TrendingUp size={16} style={{ color: "var(--green-9)" }} />
            <Text size="2" color="green">
              Excedents
            </Text>
          </Flex>
          <Text
            size="5"
            weight="bold"
            color="green"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            +{formatCurrency(valeurEcartsPositifs)}
          </Text>
          <Text size="1" color="gray">
            {ecartsPositifs.length} produit(s)
          </Text>
        </Box>

        <Box
          style={{
            flex: "1 1 180px",
            padding: 16,
            borderRadius: 8,
            backgroundColor:
              ecartsNegatifs.length > 0
                ? "var(--red-a3)"
                : "var(--gray-a3)",
          }}
        >
          <Flex align="center" gap="2" mb="1">
            <TrendingDown size={16} style={{ color: "var(--red-9)" }} />
            <Text size="2" color="red">
              Manquants
            </Text>
          </Flex>
          <Text
            size="5"
            weight="bold"
            color="red"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrency(valeurEcartsNegatifs)}
          </Text>
          <Text size="1" color="gray">
            {ecartsNegatifs.length} produit(s)
          </Text>
        </Box>
      </Flex>

      {/* Bilan total */}
      <Box
        style={{
          padding: 20,
          borderRadius: 8,
          border: "1px solid var(--gray-a6)",
          backgroundColor:
            valeurEcartTotal === 0
              ? "var(--gray-a2)"
              : valeurEcartTotal > 0
              ? "var(--green-a2)"
              : "var(--red-a2)",
        }}
      >
        <Flex justify="between" align="center">
          <Box>
            <Text size="2" color="gray">
              Bilan valorise de l'inventaire
            </Text>
            <Text
              size="6"
              weight="bold"
              color={
                valeurEcartTotal === 0
                  ? "gray"
                  : valeurEcartTotal > 0
                  ? "green"
                  : "red"
              }
              style={{
                fontVariantNumeric: "tabular-nums",
                fontFamily: "var(--font-google-sans-code), monospace",
                display: "block",
              }}
            >
              {valeurEcartTotal >= 0 ? "+" : ""}
              {formatCurrency(valeurEcartTotal)}
            </Text>
          </Box>
          <Box>
            <Text size="2" color="gray">
              Ecart total (quantite)
            </Text>
            <Text
              size="5"
              weight="bold"
              color={
                ecartTotalQte === 0
                  ? "gray"
                  : ecartTotalQte > 0
                  ? "green"
                  : "red"
              }
              style={{
                fontVariantNumeric: "tabular-nums",
                display: "block",
                textAlign: "right",
              }}
            >
              {ecartTotalQte >= 0 ? "+" : ""}
              {ecartTotalQte} unites
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Avertissement produits non comptes */}
      {lignesNonComptees > 0 && (
        <Callout.Root color="violet" size="1">
          <Callout.Icon>
            <AlertCircle size={16} />
          </Callout.Icon>
          <Callout.Text>
            {lignesNonComptees} produit(s) n'ont pas ete comptes. Leur stock ne sera pas
            modifie.
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Tableau des ecarts */}
      {lignesAvecEcart.length > 0 ? (
        <>
          <Text size="3" weight="medium">
            Detail des ecarts ({lignesAvecEcart.length} produit(s))
          </Text>
          <ScrollArea style={{ maxHeight: 350 }}>
            <Box
              style={{
                border: "1px solid var(--gray-a6)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Produit</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Categorie</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Stock theorique
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Compte</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ecart</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Valeur ecart
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {lignesAvecEcart.map((ligne) => {
                    const ecart = getEcart(ligne)!;
                    const valeur = getValeurEcart(ligne)!;

                    return (
                      <Table.Row key={ligne.produitId}>
                        <Table.RowHeaderCell>
                          <Text weight="medium">{ligne.produitNom}</Text>
                        </Table.RowHeaderCell>
                        <Table.Cell>
                          <Flex align="center" gap="2">
                            <Box
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: ligne.categorie.couleur,
                              }}
                            />
                            <Text size="2">{ligne.categorie.nom}</Text>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Text style={{ fontVariantNumeric: "tabular-nums" }}>
                            {ligne.stockTheorique} {ligne.unite || ""}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            weight="medium"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {ligne.quantiteComptee} {ligne.unite || ""}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={ecart > 0 ? "green" : "red"}
                            variant="solid"
                            size="2"
                          >
                            {ecart >= 0 ? "+" : ""}
                            {ecart}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            size="2"
                            weight="medium"
                            color={valeur > 0 ? "green" : "red"}
                            style={{
                              fontVariantNumeric: "tabular-nums",
                              fontFamily:
                                "var(--font-google-sans-code), monospace",
                            }}
                          >
                            {valeur >= 0 ? "+" : ""}
                            {formatCurrency(valeur)}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Box>
          </ScrollArea>
        </>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py="6"
          gap="2"
        >
          <CheckCircle size={32} style={{ color: "var(--green-9)" }} />
          <Text color="green" weight="medium">
            Aucun ecart detecte
          </Text>
          <Text size="2" color="gray">
            Le stock physique correspond au stock theorique.
          </Text>
        </Flex>
      )}

      {/* Erreur */}
      {error ? <Callout.Root color="red" size="1">
          <Callout.Icon>
            <AlertCircle size={16} />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root> : null}

      {/* Actions */}
      <Flex gap="3" justify="between" pt="2">
        <Button
          variant="soft"
          color="gray"
          onClick={onBack}
          disabled={isSubmitting}
          style={{ minHeight: 44 }}
        >
          <ArrowLeft size={16} />
          Retour au comptage
        </Button>

        <Button
          color="green"
          onClick={onSubmit}
          disabled={isSubmitting || lignesAvecEcart.length === 0}
          style={{ minHeight: 44, minWidth: 200 }}
        >
          <Save size={16} />
          {isSubmitting
            ? "Enregistrement..."
            : lignesAvecEcart.length === 0
            ? "Aucun ecart a enregistrer"
            : `Valider l'inventaire (${lignesAvecEcart.length} ajustement(s))`}
        </Button>
      </Flex>
    </Flex>
  );
}
