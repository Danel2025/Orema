"use client";

/**
 * SplitBillModal - Modal de division d'addition
 *
 * Permet de diviser une note entre plusieurs personnes avec 3 modes:
 * - Par nombre de personnes (division egale)
 * - Par montant personnalise
 * - Par produits (chaque personne choisit ses articles)
 */

import { useState, useCallback, useEffect } from "react";
import {
  X,
  Users,
  Edit3,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  FileText,
  Building2,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  Box,
  Flex,
  Text,
  Button,
  Badge,
  Tabs,
  TextField,
  Checkbox,
  Select,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { useSplitBillStore, type SplitMode, type SplitPart } from "@/stores/split-bill-store";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { createSplitVente } from "@/actions/split-bill";
import { useSessionStore } from "@/stores/session-store";
import type { CartItem, ModePaiement } from "@/types";

/**
 * Configuration des modes de paiement avec icones
 */
const PAYMENT_METHODS: {
  id: ModePaiement;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { id: "ESPECES", label: "Especes", icon: <Banknote size={16} />, color: "green" },
  { id: "CARTE_BANCAIRE", label: "CB", icon: <CreditCard size={16} />, color: "blue" },
  { id: "AIRTEL_MONEY", label: "Airtel", icon: <Smartphone size={16} />, color: "red" },
  { id: "MOOV_MONEY", label: "Moov", icon: <Smartphone size={16} />, color: "cyan" },
  { id: "CHEQUE", label: "Cheque", icon: <FileText size={16} />, color: "amber" },
  { id: "VIREMENT", label: "Virement", icon: <Building2 size={16} />, color: "purple" },
  { id: "COMPTE_CLIENT", label: "Compte", icon: <Wallet size={16} />, color: "violet" },
];

interface SplitBillModalProps {
  onComplete?: (venteId: string, numeroTicket: string) => void;
}

export function SplitBillModal({ onComplete }: SplitBillModalProps) {
  const {
    isOpen,
    closeSplitBill,
    mode,
    setMode,
    total,
    items,
    parts,
    nombrePersonnes,
    setNombrePersonnes,
    addPart,
    removePart,
    updatePart,
    markAsPaid,
    assignItemToPart,
    unassignItem,
    reset,
  } = useSplitBillStore();

  const {
    items: cartItems,
    typeVente,
    tableId,
    clientId,
    remise,
    clearCart,
    adresseLivraison,
    notesLivraison,
  } = useCartStore();

  const { sessionCaisse } = useSessionStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingPartId, setPayingPartId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<ModePaiement>("ESPECES");

  // Reset l'erreur quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPayingPartId(null);
    }
  }, [isOpen]);

  // Calculer le total des parts payees
  const totalPaye = parts.reduce((acc, p) => (p.paye ? acc + p.montant : acc), 0);
  const resteAPayer = total - totalPaye;
  const toutesPayees = parts.every((p) => p.paye);

  // Verifier si la somme des parts correspond au total (mode custom)
  const totalParts = parts.reduce((acc, p) => acc + p.montant, 0);
  const ecart = total - totalParts;

  // Articles non attribues (mode items)
  const itemsNonAttribues = items.filter((item) => {
    return !parts.some((p) => p.items?.includes(item.produitId));
  });

  /**
   * Gerer le changement de mode
   */
  const handleModeChange = (newMode: string) => {
    setMode(newMode as SplitMode);
    setError(null);
  };

  /**
   * Payer une part
   */
  const handlePayPart = (partId: string) => {
    setPayingPartId(partId);
  };

  /**
   * Confirmer le paiement d'une part
   */
  const handleConfirmPayment = (partId: string) => {
    markAsPaid(partId, selectedPaymentMethod);
    setPayingPartId(null);
    setSelectedPaymentMethod("ESPECES");
  };

  /**
   * Finaliser la vente avec les parts payees
   */
  const handleComplete = async () => {
    if (!toutesPayees) {
      setError("Toutes les parts doivent etre payees");
      return;
    }

    if (mode === "custom" && ecart !== 0) {
      setError(`La somme des parts ne correspond pas au total (ecart: ${formatCurrency(ecart)})`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Preparer les lignes de vente
      const lignes = cartItems.map((item) => ({
        produitId: item.produitId,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
        tauxTva: item.produit.tauxTva,
        notes: item.notes,
      }));

      // Preparer les parts payees
      const partsPaiement = parts.map((p) => ({
        id: p.id,
        montant: p.montant,
        modePaiement: p.modePaiement ?? ("ESPECES" as ModePaiement),
        reference: p.reference,
      }));

      const result = await createSplitVente({
        typeVente,
        lignes,
        parts: partsPaiement,
        remise: remise ? { type: remise.type, valeur: remise.valeur } : undefined,
        tableId,
        clientId,
        sessionCaisseId: sessionCaisse?.id,
        adresseLivraison,
        notesLivraison,
      });

      if (result.success && result.data) {
        // Vider le panier
        clearCart();
        // Fermer le modal
        closeSplitBill();
        reset();
        // Callback optionnel
        onComplete?.(result.data.venteId, result.data.numeroTicket);
      } else {
        setError(result.error ?? "Erreur lors de la creation de la vente");
      }
    } catch (err) {
      console.error("Erreur lors de la finalisation:", err);
      setError("Erreur inattendue");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Mettre a jour le montant d'une part (mode custom)
   */
  const handleUpdatePartAmount = (partId: string, value: string) => {
    const montant = parseInt(value, 10) || 0;
    updatePart(partId, { montant });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeSplitBill()}>
      <Dialog.Content
        maxWidth="700px"
        style={{
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Dialog.Title>
          <Flex justify="between" align="center">
            <Flex align="center" gap="2">
              <Users size={20} style={{ color: "var(--accent-9)" }} />
              <span>Diviser l'addition</span>
            </Flex>
            <Text
              size="5"
              weight="bold"
              style={{
                color: "var(--accent-11)",
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              {formatCurrency(total)}
            </Text>
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" color="gray" mb="4">
          Choisissez comment diviser la note entre les convives.
        </Dialog.Description>

        {/* Onglets de mode */}
        <Tabs.Root value={mode} onValueChange={handleModeChange}>
          <Tabs.List>
            <Tabs.Trigger value="equal">
              <Flex align="center" gap="2">
                <Users size={16} />
                <span>Par personnes</span>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="custom">
              <Flex align="center" gap="2">
                <Edit3 size={16} />
                <span>Montants libres</span>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="items">
              <Flex align="center" gap="2">
                <ShoppingBag size={16} />
                <span>Par articles</span>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <ScrollArea style={{ flex: 1 }}>
            {/* Mode: Division egale */}
            <Tabs.Content value="equal">
              <Flex direction="column" gap="4">
                {/* Selecteur du nombre de personnes */}
                <Flex align="center" gap="3" justify="center" py="3">
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setNombrePersonnes(nombrePersonnes - 1)}
                    disabled={nombrePersonnes <= 2}
                  >
                    <Minus size={16} />
                  </Button>
                  <Box style={{ textAlign: "center", minWidth: 100 }}>
                    <Text size="6" weight="bold" style={{ color: "var(--gray-12)" }}>
                      {nombrePersonnes}
                    </Text>
                    <Text size="2" color="gray" as="div">
                      personnes
                    </Text>
                  </Box>
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setNombrePersonnes(nombrePersonnes + 1)}
                    disabled={nombrePersonnes >= 20}
                  >
                    <Plus size={16} />
                  </Button>
                </Flex>

                {/* Liste des parts */}
                <ScrollArea style={{ maxHeight: 300 }}>
                  <Flex direction="column" gap="2">
                    {parts.map((part, index) => (
                      <PartCard
                        key={part.id}
                        part={part}
                        index={index}
                        isPayingPart={payingPartId === part.id}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onSelectPaymentMethod={setSelectedPaymentMethod}
                        onPayClick={() => handlePayPart(part.id)}
                        onConfirmPayment={() => handleConfirmPayment(part.id)}
                        onCancelPayment={() => setPayingPartId(null)}
                      />
                    ))}
                  </Flex>
                </ScrollArea>
              </Flex>
            </Tabs.Content>

            {/* Mode: Montants personnalises */}
            <Tabs.Content value="custom">
              <Flex direction="column" gap="4">
                {/* Indicateur d'ecart */}
                {ecart !== 0 && (
                  <Box
                    p="3"
                    style={{
                      backgroundColor: ecart > 0 ? "var(--purple-a3)" : "var(--red-a3)",
                      borderRadius: 8,
                    }}
                  >
                    <Text size="2" style={{ color: ecart > 0 ? "var(--purple-11)" : "var(--red-11)" }}>
                      {ecart > 0
                        ? `Il reste ${formatCurrency(ecart)} a attribuer`
                        : `La somme depasse le total de ${formatCurrency(Math.abs(ecart))}`}
                    </Text>
                  </Box>
                )}

                {/* Liste des parts */}
                <ScrollArea style={{ maxHeight: 300 }}>
                  <Flex direction="column" gap="2">
                    {parts.map((part, index) => (
                      <CustomPartCard
                        key={part.id}
                        part={part}
                        index={index}
                        isPayingPart={payingPartId === part.id}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onSelectPaymentMethod={setSelectedPaymentMethod}
                        onPayClick={() => handlePayPart(part.id)}
                        onConfirmPayment={() => handleConfirmPayment(part.id)}
                        onCancelPayment={() => setPayingPartId(null)}
                        onUpdateAmount={(value) => handleUpdatePartAmount(part.id, value)}
                        onRemove={() => removePart(part.id)}
                        canRemove={parts.length > 1}
                      />
                    ))}
                  </Flex>
                </ScrollArea>

                {/* Bouton ajouter une part */}
                <Button variant="soft" color="gray" onClick={() => addPart()}>
                  <Plus size={16} />
                  Ajouter une part
                </Button>
              </Flex>
            </Tabs.Content>

            {/* Mode: Par articles */}
            <Tabs.Content value="items">
              <Flex direction="column" gap="4">
                {/* Selecteur du nombre de personnes */}
                <Flex align="center" gap="3" py="2">
                  <Text size="2" color="gray">
                    Nombre de personnes:
                  </Text>
                  <Flex align="center" gap="2">
                    <Button
                      size="1"
                      variant="soft"
                      color="gray"
                      onClick={() => setNombrePersonnes(nombrePersonnes - 1)}
                      disabled={nombrePersonnes <= 2}
                    >
                      <Minus size={14} />
                    </Button>
                    <Text size="3" weight="bold" style={{ minWidth: 24, textAlign: "center" }}>
                      {nombrePersonnes}
                    </Text>
                    <Button
                      size="1"
                      variant="soft"
                      color="gray"
                      onClick={() => setNombrePersonnes(nombrePersonnes + 1)}
                      disabled={nombrePersonnes >= 20}
                    >
                      <Plus size={14} />
                    </Button>
                  </Flex>
                </Flex>

                {/* Articles non attribues */}
                {itemsNonAttribues.length > 0 && (
                  <Box
                    p="3"
                    style={{
                      backgroundColor: "var(--purple-a3)",
                      borderRadius: 8,
                    }}
                  >
                    <Text size="2" weight="medium" style={{ color: "var(--purple-11)" }} mb="2" as="div">
                      Articles non attribues ({itemsNonAttribues.length})
                    </Text>
                    <Flex gap="2" wrap="wrap">
                      {itemsNonAttribues.map((item) => (
                        <Badge key={item.produitId} variant="surface" color="amber" size="1">
                          {item.produit.nom} ({formatCurrency(item.total)})
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}

                {/* Parts avec leurs articles */}
                <ScrollArea style={{ maxHeight: 280 }}>
                  <Flex direction="column" gap="3">
                    {parts.map((part, index) => (
                      <ItemsPartCard
                        key={part.id}
                        part={part}
                        index={index}
                        items={items}
                        isPayingPart={payingPartId === part.id}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onSelectPaymentMethod={setSelectedPaymentMethod}
                        onPayClick={() => handlePayPart(part.id)}
                        onConfirmPayment={() => handleConfirmPayment(part.id)}
                        onCancelPayment={() => setPayingPartId(null)}
                        onAssignItem={(produitId) => assignItemToPart(produitId, part.id)}
                        onUnassignItem={unassignItem}
                        availableItems={itemsNonAttribues}
                      />
                    ))}
                  </Flex>
                </ScrollArea>
              </Flex>
            </Tabs.Content>
          </ScrollArea>
        </Tabs.Root>

        {/* Resume et actions */}
        <Box pt="4" mt="4" style={{ borderTop: "1px solid var(--gray-a6)" }}>
          {/* Resume des paiements */}
          <Flex justify="between" align="center" mb="3">
            <Flex direction="column" gap="1">
              <Text size="2" color="gray">
                Paye: {formatCurrency(totalPaye)} / {formatCurrency(total)}
              </Text>
              {resteAPayer > 0 && (
                <Text size="2" style={{ color: "var(--purple-11)" }}>
                  Reste: {formatCurrency(resteAPayer)}
                </Text>
              )}
            </Flex>
            <Flex gap="2">
              {parts.map((p, i) => (
                <Badge
                  key={p.id}
                  variant={p.paye ? "solid" : "soft"}
                  color={p.paye ? "green" : "gray"}
                  size="1"
                >
                  P{i + 1}
                </Badge>
              ))}
            </Flex>
          </Flex>

          {/* Erreur */}
          {error ? <Box
              p="3"
              mb="3"
              style={{
                backgroundColor: "var(--red-a3)",
                borderRadius: 8,
              }}
            >
              <Text size="2" style={{ color: "var(--red-11)" }}>
                {error}
              </Text>
            </Box> : null}

          {/* Boutons */}
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isProcessing}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              color="green"
              disabled={!toutesPayees || isProcessing || (mode === "custom" && ecart !== 0)}
              onClick={handleComplete}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Valider la vente
                </>
              )}
            </Button>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

interface PartCardProps {
  part: SplitPart;
  index: number;
  isPayingPart: boolean;
  selectedPaymentMethod: ModePaiement;
  onSelectPaymentMethod: (method: ModePaiement) => void;
  onPayClick: () => void;
  onConfirmPayment: () => void;
  onCancelPayment: () => void;
}

/**
 * Carte pour une part en mode division egale
 */
function PartCard({
  part,
  index,
  isPayingPart,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPayClick,
  onConfirmPayment,
  onCancelPayment,
}: PartCardProps) {
  if (isPayingPart) {
    return (
      <PaymentSelector
        part={part}
        index={index}
        selectedMethod={selectedPaymentMethod}
        onSelectMethod={onSelectPaymentMethod}
        onConfirm={onConfirmPayment}
        onCancel={onCancelPayment}
      />
    );
  }

  return (
    <Flex
      align="center"
      justify="between"
      p="3"
      style={{
        backgroundColor: part.paye ? "var(--green-a2)" : "var(--gray-a2)",
        borderRadius: 8,
        border: part.paye ? "1px solid var(--green-a6)" : "1px solid var(--gray-a6)",
      }}
    >
      <Flex align="center" gap="3">
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: part.paye ? "var(--green-9)" : "var(--accent-9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {part.paye ? <Check size={16} /> : index + 1}
        </Box>
        <Box>
          <Text size="2" weight="medium" style={{ color: "var(--gray-12)" }}>
            {part.nom ?? `Personne ${index + 1}`}
          </Text>
          {part.paye && part.modePaiement ? <Text size="1" color="gray">
              {PAYMENT_METHODS.find((m) => m.id === part.modePaiement)?.label}
            </Text> : null}
        </Box>
      </Flex>

      <Flex align="center" gap="3">
        <Text
          size="4"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            color: part.paye ? "var(--green-11)" : "var(--gray-12)",
          }}
        >
          {formatCurrency(part.montant)}
        </Text>
        {!part.paye && (
          <Button size="2" variant="soft" onClick={onPayClick}>
            Payer
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

interface CustomPartCardProps extends PartCardProps {
  onUpdateAmount: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

/**
 * Carte pour une part en mode montant personnalise
 */
function CustomPartCard({
  part,
  index,
  isPayingPart,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPayClick,
  onConfirmPayment,
  onCancelPayment,
  onUpdateAmount,
  onRemove,
  canRemove,
}: CustomPartCardProps) {
  if (isPayingPart) {
    return (
      <PaymentSelector
        part={part}
        index={index}
        selectedMethod={selectedPaymentMethod}
        onSelectMethod={onSelectPaymentMethod}
        onConfirm={onConfirmPayment}
        onCancel={onCancelPayment}
      />
    );
  }

  return (
    <Flex
      align="center"
      justify="between"
      gap="3"
      p="3"
      style={{
        backgroundColor: part.paye ? "var(--green-a2)" : "var(--gray-a2)",
        borderRadius: 8,
        border: part.paye ? "1px solid var(--green-a6)" : "1px solid var(--gray-a6)",
      }}
    >
      <Flex align="center" gap="3" style={{ flex: 1 }}>
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: part.paye ? "var(--green-9)" : "var(--accent-9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {part.paye ? <Check size={16} /> : index + 1}
        </Box>

        {part.paye ? (
          <Box>
            <Text size="2" weight="medium" style={{ color: "var(--gray-12)" }}>
              Part {index + 1}
            </Text>
            <Text size="1" color="gray">
              {PAYMENT_METHODS.find((m) => m.id === part.modePaiement)?.label}
            </Text>
          </Box>
        ) : (
          <Box style={{ flex: 1, maxWidth: 150 }}>
            <TextField.Root
              type="number"
              value={part.montant.toString()}
              onChange={(e) => onUpdateAmount(e.target.value)}
              placeholder="Montant"
              style={{
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              }}
            >
              <TextField.Slot side="right">
                <Text size="1" color="gray">
                  FCFA
                </Text>
              </TextField.Slot>
            </TextField.Root>
          </Box>
        )}
      </Flex>

      <Flex align="center" gap="2">
        {part.paye ? (
          <Text
            size="4"
            weight="bold"
            style={{
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              color: "var(--green-11)",
            }}
          >
            {formatCurrency(part.montant)}
          </Text>
        ) : (
          <>
            {canRemove ? <Button size="1" variant="ghost" color="red" onClick={onRemove}>
                <Trash2 size={14} />
              </Button> : null}
            <Button size="2" variant="soft" onClick={onPayClick} disabled={part.montant <= 0}>
              Payer
            </Button>
          </>
        )}
      </Flex>
    </Flex>
  );
}

interface ItemsPartCardProps extends PartCardProps {
  items: CartItem[];
  onAssignItem: (produitId: string) => void;
  onUnassignItem: (produitId: string) => void;
  availableItems: CartItem[];
}

/**
 * Carte pour une part en mode par articles
 */
function ItemsPartCard({
  part,
  index,
  items,
  isPayingPart,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPayClick,
  onConfirmPayment,
  onCancelPayment,
  onAssignItem,
  onUnassignItem,
  availableItems,
}: ItemsPartCardProps) {
  const partItems = part.items ?? [];
  const assignedItems = items.filter((item) => partItems.includes(item.produitId));

  if (isPayingPart) {
    return (
      <PaymentSelector
        part={part}
        index={index}
        selectedMethod={selectedPaymentMethod}
        onSelectMethod={onSelectPaymentMethod}
        onConfirm={onConfirmPayment}
        onCancel={onCancelPayment}
      />
    );
  }

  return (
    <Box
      p="3"
      style={{
        backgroundColor: part.paye ? "var(--green-a2)" : "var(--gray-a2)",
        borderRadius: 8,
        border: part.paye ? "1px solid var(--green-a6)" : "1px solid var(--gray-a6)",
      }}
    >
      <Flex align="center" justify="between" mb="2">
        <Flex align="center" gap="2">
          <Box
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: part.paye ? "var(--green-9)" : "var(--accent-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {part.paye ? <Check size={14} /> : index + 1}
          </Box>
          <Text size="2" weight="medium">
            {part.nom ?? `Personne ${index + 1}`}
          </Text>
        </Flex>
        <Flex align="center" gap="2">
          <Text
            size="3"
            weight="bold"
            style={{
              fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
              color: part.paye ? "var(--green-11)" : "var(--gray-12)",
            }}
          >
            {formatCurrency(part.montant)}
          </Text>
          {!part.paye && part.montant > 0 && (
            <Button size="1" variant="soft" onClick={onPayClick}>
              Payer
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Articles attribues */}
      {assignedItems.length > 0 && (
        <Flex gap="1" wrap="wrap" mb="2">
          {assignedItems.map((item) => (
            <Badge
              key={item.produitId}
              variant="surface"
              color={part.paye ? "green" : "violet"}
              size="1"
              style={{ cursor: part.paye ? "default" : "pointer" }}
              onClick={() => !part.paye && onUnassignItem(item.produitId)}
            >
              {item.produit.nom}
              {!part.paye && <X size={10} style={{ marginLeft: 4 }} />}
            </Badge>
          ))}
        </Flex>
      )}

      {/* Selecteur d'articles disponibles */}
      {!part.paye && availableItems.length > 0 && (
        <Select.Root onValueChange={onAssignItem}>
          <Select.Trigger placeholder="Ajouter un article..." variant="soft" />
          <Select.Content>
            {availableItems.map((item) => (
              <Select.Item key={item.produitId} value={item.produitId}>
                {item.produit.nom} - {formatCurrency(item.total)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      )}
    </Box>
  );
}

interface PaymentSelectorProps {
  part: SplitPart;
  index: number;
  selectedMethod: ModePaiement;
  onSelectMethod: (method: ModePaiement) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Selecteur de mode de paiement pour une part
 */
function PaymentSelector({
  part,
  index,
  selectedMethod,
  onSelectMethod,
  onConfirm,
  onCancel,
}: PaymentSelectorProps) {
  return (
    <Box
      p="3"
      style={{
        backgroundColor: "var(--accent-a2)",
        borderRadius: 8,
        border: "2px solid var(--accent-6)",
      }}
    >
      <Flex align="center" justify="between" mb="3">
        <Flex align="center" gap="2">
          <Box
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "var(--accent-9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {index + 1}
          </Box>
          <Text size="2" weight="medium">
            Paiement pour {part.nom ?? `Personne ${index + 1}`}
          </Text>
        </Flex>
        <Text
          size="3"
          weight="bold"
          style={{
            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
            color: "var(--accent-11)",
          }}
        >
          {formatCurrency(part.montant)}
        </Text>
      </Flex>

      {/* Grille des modes de paiement */}
      <Box
        mb="3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
        }}
      >
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 4px",
              borderRadius: 8,
              border:
                selectedMethod === method.id
                  ? `2px solid var(--${method.color}-9)`
                  : "1px solid var(--gray-a6)",
              backgroundColor:
                selectedMethod === method.id
                  ? `var(--${method.color}-a3)`
                  : "var(--color-panel-solid)",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                color: selectedMethod === method.id ? `var(--${method.color}-11)` : "var(--gray-11)",
              }}
            >
              {method.icon}
            </span>
            <Text
              size="1"
              weight={selectedMethod === method.id ? "bold" : "regular"}
              style={{
                color: selectedMethod === method.id ? `var(--${method.color}-11)` : "var(--gray-11)",
              }}
            >
              {method.label}
            </Text>
          </button>
        ))}
      </Box>

      {/* Boutons */}
      <Flex gap="2" justify="end">
        <Button size="2" variant="soft" color="gray" onClick={onCancel}>
          Annuler
        </Button>
        <Button size="2" color="green" onClick={onConfirm}>
          <Check size={16} />
          Confirmer
        </Button>
      </Flex>
    </Box>
  );
}
