"use client";

/**
 * PrepaidAccount - Composant pour afficher et gérer le compte prépayé
 */

import { useState } from "react";
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  TextArea,
  Card,
  Badge,
  Separator,
} from "@radix-ui/themes";
import { ScrollArea } from "@/components/ui";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Receipt, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rechargerComptePrepaye } from "@/actions/clients";
import { toast } from "sonner";

interface PrepaidTransaction {
  id: string;
  type: "RECHARGE" | "DEBIT";
  montant: number;
  venteId?: string;
  numeroTicket?: string;
  createdAt: Date;
}

interface PrepaidAccountProps {
  clientId: string;
  clientNom: string;
  soldePrepaye: number;
  transactions?: PrepaidTransaction[];
  onRechargeSuccess?: () => void;
}

export function PrepaidAccount({
  clientId,
  clientNom,
  soldePrepaye,
  transactions = [],
  onRechargeSuccess,
}: PrepaidAccountProps) {
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Montants de recharge rapide
  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  const handleRecharge = async () => {
    const montantNum = parseInt(montant);
    if (!montantNum || montantNum <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    setIsLoading(true);
    try {
      const result = await rechargerComptePrepaye({
        clientId,
        montant: montantNum,
        reference: reference || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success(
          `Compte rechargé de ${formatCurrency(montantNum)}. Nouveau solde: ${formatCurrency(result.data?.nouveauSolde || 0)}`
        );
        setMontant("");
        setReference("");
        setNotes("");
        setIsRechargeModalOpen(false);
        onRechargeSuccess?.();
      } else {
        toast.error(result.error || "Erreur lors du rechargement");
      }
    } catch (error) {
      toast.error("Erreur lors du rechargement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header avec solde */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Wallet size={20} style={{ color: "var(--accent-9)" }} />
            <Text size="3" weight="medium">
              Compte prépayé
            </Text>
          </Flex>
          <Badge size="2" color={soldePrepaye > 0 ? "green" : "gray"} variant="soft">
            {formatCurrency(soldePrepaye)}
          </Badge>
        </Flex>

        {/* Bouton de rechargement */}
        <Button onClick={() => setIsRechargeModalOpen(true)} variant="soft">
          <Plus size={16} />
          Recharger le compte
        </Button>

        {/* Historique des transactions */}
        {transactions.length > 0 && (
          <>
            <Separator size="4" />
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium" color="gray">
                Dernières transactions
              </Text>
              <ScrollArea style={{ maxHeight: 200 }}>
                <Flex direction="column" gap="2">
                  {transactions.slice(0, 10).map((tx) => (
                    <Flex
                      key={tx.id}
                      justify="between"
                      align="center"
                      py="2"
                      style={{
                        borderBottom: "1px solid var(--gray-a4)",
                      }}
                    >
                      <Flex align="center" gap="2">
                        {tx.type === "RECHARGE" ? (
                          <ArrowDownLeft size={16} className="text-green-500" />
                        ) : (
                          <ArrowUpRight size={16} className="text-red-500" />
                        )}
                        <Flex direction="column">
                          <Text size="2">{tx.type === "RECHARGE" ? "Rechargement" : "Débit"}</Text>
                          {tx.numeroTicket ? (
                            <Text size="1" color="gray">
                              Ticket #{tx.numeroTicket}
                            </Text>
                          ) : null}
                        </Flex>
                      </Flex>
                      <Flex direction="column" align="end">
                        <Text
                          size="2"
                          weight="medium"
                          color={tx.type === "RECHARGE" ? "green" : "red"}
                        >
                          {tx.type === "RECHARGE" ? "+" : "-"}
                          {formatCurrency(tx.montant)}
                        </Text>
                        <Text size="1" color="gray">
                          {formatDate(tx.createdAt)}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
              </ScrollArea>
            </Flex>
          </>
        )}

        {transactions.length === 0 && (
          <Flex direction="column" align="center" gap="2" py="4" style={{ color: "var(--gray-9)" }}>
            <Receipt size={24} />
            <Text size="2" color="gray">
              Aucune transaction
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Modal de rechargement */}
      <Dialog.Root open={isRechargeModalOpen} onOpenChange={setIsRechargeModalOpen}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>Recharger le compte</Dialog.Title>
          <Dialog.Description size="2" color="gray" mb="4">
            Recharger le compte prépayé de {clientNom}
          </Dialog.Description>

          <Flex direction="column" gap="4">
            {/* Solde actuel */}
            <Card variant="surface">
              <Flex justify="between" align="center">
                <Text size="2" color="gray">
                  Solde actuel
                </Text>
                <Text size="3" weight="bold">
                  {formatCurrency(soldePrepaye)}
                </Text>
              </Flex>
            </Card>

            {/* Montants rapides */}
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Montant rapide
              </Text>
              <Flex gap="2" wrap="wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={parseInt(montant) === amount ? "solid" : "outline"}
                    size="1"
                    onClick={() => setMontant(amount.toString())}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </Flex>
            </Flex>

            {/* Montant personnalisé */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Montant (FCFA) *
              </Text>
              <TextField.Root
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                type="number"
                placeholder="Entrez le montant"
                min={0}
                step={1000}
              />
            </Flex>

            {/* Référence */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Référence (optionnel)
              </Text>
              <TextField.Root
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Numéro de reçu, transaction..."
              />
            </Flex>

            {/* Notes */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Notes (optionnel)
              </Text>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes supplémentaires..."
                rows={2}
              />
            </Flex>

            {/* Aperçu */}
            {montant && parseInt(montant) > 0 ? (
              <Card variant="surface" style={{ backgroundColor: "var(--green-a2)" }}>
                <Flex justify="between" align="center">
                  <Text size="2">Nouveau solde après rechargement</Text>
                  <Text size="3" weight="bold" color="green">
                    {formatCurrency(soldePrepaye + parseInt(montant))}
                  </Text>
                </Flex>
              </Card>
            ) : null}
          </Flex>

          {/* Actions */}
          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isLoading}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleRecharge}
              disabled={isLoading || !montant || parseInt(montant) <= 0}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              Recharger
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
}
