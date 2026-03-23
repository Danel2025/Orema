"use client";

/**
 * CaisseCart - Panier de la caisse avec support des notes et remises par ligne
 */

import { useState } from "react";
import {
  Trash,
  Minus,
  Plus,
  Percent,
  X,
  ShoppingCart,
  ChatText,
  Tag,
  Users,
  Clock,
  CreditCard,
  PlusCircle,
} from "@phosphor-icons/react";
import { Tooltip } from "@radix-ui/themes";
import { useCartStore } from "@/stores/cart-store";
import { useSplitBillStore } from "@/stores/split-bill-store";
import { useAuth } from "@/lib/auth/context";
import { formatCurrency } from "@/lib/utils";
import { LineNotesPopover } from "./line-notes-popover";
import { DiscountModal } from "./discount-modal";
import { SplitBillModal } from "./split-bill-modal";
import { CartPrintActions } from "./cart-print-actions";
import type { CartItem } from "@/types";

interface CaisseCartProps {
  onProceedToPayment: () => void;
  onMettreEnAttente: () => void;
  onMettreEnCompte: () => void;
  onAjouterALaCommande: () => void;
  hasVenteEnAttenteTable?: boolean;
  /** Informations de l'etablissement pour l'impression */
  etablissement?: {
    nom: string;
    adresse?: string | null;
    telephone?: string | null;
    email?: string | null;
    nif?: string | null;
    rccm?: string | null;
    messageTicket?: string | null;
  };
  /** Nom du caissier/serveur pour l'impression */
  serveurNom?: string;
}

export function CaisseCart({
  onProceedToPayment,
  onMettreEnAttente,
  onMettreEnCompte,
  onAjouterALaCommande,
  hasVenteEnAttenteTable = false,
  etablissement,
  serveurNom = "Caissier",
}: CaisseCartProps) {
  // Selecteurs atomiques Zustand - evite les re-renders inutiles
  const items = useCartStore((s) => s.items);
  const sousTotal = useCartStore((s) => s.sousTotal);
  const totalTva = useCartStore((s) => s.totalTva);
  const totalRemise = useCartStore((s) => s.totalRemise);
  const totalFinal = useCartStore((s) => s.totalFinal);
  const remise = useCartStore((s) => s.remise);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearRemise = useCartStore((s) => s.clearRemise);
  const clearCart = useCartStore((s) => s.clearCart);
  const canMettreEnAttente = useCartStore((s) => s.canMettreEnAttente);
  const canMettreEnCompte = useCartStore((s) => s.canMettreEnCompte);
  const getCreditDisponible = useCartStore((s) => s.getCreditDisponible);
  const client = useCartStore((s) => s.client);

  const { openSplitBill } = useSplitBillStore();
  const { user } = useAuth();

  // Les serveurs ne peuvent pas encaisser
  const isServeur = user?.role === "SERVEUR";
  const canEncaisser = !isServeur;

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | undefined>();

  // Ouvrir le modal de remise globale
  const handleOpenGlobalDiscount = () => {
    setSelectedItemForDiscount(undefined);
    setShowDiscountModal(true);
  };

  // Ouvrir le modal de remise pour une ligne
  const handleOpenLineDiscount = (item: CartItem) => {
    setSelectedItemForDiscount(item);
    setShowDiscountModal(true);
  };

  // Ouvrir le modal de division d'addition
  const handleOpenSplitBill = () => {
    openSplitBill(totalFinal, items);
  };

  // Calculer le total des remises par ligne
  const totalRemisesLignes = items.reduce((acc, item) => acc + (item.montantRemiseLigne || 0), 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--color-panel-solid)",
        borderLeft: "1px solid var(--gray-a6)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--gray-a6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingCart size={20} style={{ color: "var(--accent-9)" }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-12)" }}>Panier</span>
          {items.length > 0 && (
            <span
              style={{
                backgroundColor: "var(--accent-9)",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {items.reduce((acc, item) => acc + item.quantite, 0)}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            aria-label="Vider le panier"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              color: "var(--red-11)",
              backgroundColor: "var(--red-a3)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Vider
          </button>
        )}
      </div>

      {/* Liste des articles */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: items.length > 0 ? "12px 16px" : "0",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--gray-10)",
              padding: 24,
              textAlign: "center",
            }}
          >
            <ShoppingCart size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ margin: 0 }}>Le panier est vide</p>
            <p style={{ margin: "8px 0 0", fontSize: 13 }}>Cliquez sur un produit pour l'ajouter</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, itemIndex) => (
              <div
                key={item.lineId || `item-${item.produitId}-${itemIndex}`}
                style={{
                  padding: 12,
                  backgroundColor: "var(--gray-a2)",
                  borderRadius: 8,
                }}
              >
                {/* Ligne produit */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--gray-12)",
                        display: "block",
                      }}
                    >
                      {item.produit.nom}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--gray-10)",
                      }}
                    >
                      {formatCurrency(item.prixUnitaire + (item.totalSupplements || 0))} x{" "}
                      {item.quantite}
                    </span>
                    {/* Afficher les supplements si presents */}
                    {item.supplements && item.supplements.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          marginTop: 4,
                          paddingLeft: 8,
                          borderLeft: "2px solid var(--blue-a6)",
                        }}
                      >
                        {item.supplements.map((sup, idx) => (
                          <span
                            key={`${item.lineId}-sup-${sup.nom}-${idx}`}
                            style={{
                              fontSize: 11,
                              color: "var(--blue-11)",
                            }}
                          >
                            + {sup.nom}: {formatCurrency(sup.prix)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {/* Afficher la remise par ligne si presente */}
                    {item.remiseLigne ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--green-11)",
                          marginTop: 2,
                        }}
                      >
                        Remise:{" "}
                        {item.remiseLigne.type === "POURCENTAGE"
                          ? `${item.remiseLigne.valeur}%`
                          : formatCurrency(item.remiseLigne.valeur)}
                        {item.montantRemiseLigne
                          ? ` (-${formatCurrency(item.montantRemiseLigne)})`
                          : ""}
                      </span>
                    ) : null}
                    {/* Afficher les notes si presentes */}
                    {item.notes ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--accent-11)",
                          marginTop: 2,
                          fontStyle: "italic",
                        }}
                      >
                        Note: {item.notes}
                      </span>
                    ) : null}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--gray-12)",
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(item.total)}
                  </span>
                </div>

                {/* Controles quantite et actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => updateQuantity(item.lineId, item.quantite - 1)}
                    aria-label="Diminuer la quantité"
                    style={{
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: 6,
                      border: "1px solid var(--gray-a6)",
                      backgroundColor: "var(--color-panel-solid)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gray-11)",
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <span
                    style={{
                      minWidth: 32,
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {item.quantite}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.lineId, item.quantite + 1)}
                    aria-label="Augmenter la quantité"
                    style={{
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: 6,
                      border: "1px solid var(--gray-a6)",
                      backgroundColor: "var(--color-panel-solid)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gray-11)",
                    }}
                  >
                    <Plus size={14} />
                  </button>

                  <div style={{ flex: 1 }} />

                  {/* Bouton Notes */}
                  <LineNotesPopover item={item}>
                    <Tooltip content="Ajouter une note">
                      <button
                        aria-label="Ajouter une note"
                        style={{
                          minWidth: 44,
                          minHeight: 44,
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: item.notes ? "var(--accent-a3)" : "var(--gray-a3)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: item.notes ? "var(--accent-11)" : "var(--gray-11)",
                        }}
                      >
                        <ChatText size={14} />
                      </button>
                    </Tooltip>
                  </LineNotesPopover>

                  {/* Bouton Remise ligne */}
                  <Tooltip content="Remise sur cette ligne">
                    <button
                      onClick={() => handleOpenLineDiscount(item)}
                      aria-label="Remise sur cette ligne"
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: item.remiseLigne ? "var(--green-a3)" : "var(--gray-a3)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.remiseLigne ? "var(--green-11)" : "var(--gray-11)",
                      }}
                    >
                      <Tag size={14} />
                    </button>
                  </Tooltip>

                  {/* Bouton Supprimer */}
                  <Tooltip content="Supprimer">
                    <button
                      onClick={() => removeItem(item.lineId)}
                      aria-label="Supprimer l'article"
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "var(--red-a3)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--red-11)",
                      }}
                    >
                      <Trash size={14} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totaux et actions */}
      {items.length > 0 && (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--gray-a6)",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          {/* Remise globale */}
          <div style={{ marginBottom: 12 }}>
            {remise ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: "var(--green-a3)",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--green-11)" }}>
                  Remise globale:{" "}
                  {remise.type === "POURCENTAGE"
                    ? `${remise.valeur}%`
                    : formatCurrency(remise.valeur)}
                </span>
                <button
                  onClick={clearRemise}
                  aria-label="Supprimer la remise globale"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--green-11)",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenGlobalDiscount}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--gray-11)",
                  backgroundColor: "transparent",
                  border: "1px dashed var(--gray-a6)",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Percent size={14} />
                Ajouter une remise globale
              </button>
            )}
          </div>

          {/* Resume */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--gray-11)" }}>Sous-total</span>
              <span
                style={{
                  color: "var(--gray-12)",
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {formatCurrency(sousTotal)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--gray-11)" }}>TVA</span>
              <span
                style={{
                  color: "var(--gray-12)",
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {formatCurrency(totalTva)}
              </span>
            </div>
            {totalRemisesLignes > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--green-11)" }}>Remises lignes</span>
                <span
                  style={{
                    color: "var(--green-11)",
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  (incluses)
                </span>
              </div>
            )}
            {totalRemise > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--green-11)" }}>Remise globale</span>
                <span
                  style={{
                    color: "var(--green-11)",
                    fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                  }}
                >
                  -{formatCurrency(totalRemise)}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTop: "1px solid var(--gray-a6)",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-12)" }}>Total</span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--accent-11)",
                  fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                }}
              >
                {formatCurrency(totalFinal)}
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Boutons d'impression */}
            {etablissement ? (
              <CartPrintActions etablissement={etablissement} serveurNom={serveurNom} />
            ) : null}

            {/* Bouton Diviser l'addition */}
            <button
              onClick={handleOpenSplitBill}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--blue-11)",
                backgroundColor: "var(--blue-a3)",
                border: "1px solid var(--blue-a6)",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Users size={16} />
              Diviser l'addition
            </button>

            {/* Bouton Mettre en attente / Ajouter à la commande */}
            {canMettreEnAttente() && (
              <button
                onClick={hasVenteEnAttenteTable ? onAjouterALaCommande : onMettreEnAttente}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: hasVenteEnAttenteTable ? "var(--blue-11)" : "var(--purple-11)",
                  backgroundColor: hasVenteEnAttenteTable ? "var(--blue-a3)" : "var(--purple-a3)",
                  border: `1px solid ${hasVenteEnAttenteTable ? "var(--blue-a6)" : "var(--purple-a6)"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {hasVenteEnAttenteTable ? (
                  <>
                    <PlusCircle size={16} />
                    Ajouter à la commande
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    Mettre en attente (F6)
                  </>
                )}
              </button>
            )}

            {/* Bouton Mettre en compte - désactivé pour les serveurs */}
            {client && client.creditAutorise ? (
              <Tooltip
                content={
                  isServeur
                    ? "Les serveurs ne peuvent pas mettre en compte"
                    : canMettreEnCompte()
                      ? `Crédit disponible: ${formatCurrency(getCreditDisponible() || 0)}`
                      : `Crédit insuffisant. Disponible: ${formatCurrency(getCreditDisponible() || 0)}`
                }
              >
                <button
                  onClick={canEncaisser ? onMettreEnCompte : undefined}
                  disabled={!canMettreEnCompte() || !canEncaisser}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: canMettreEnCompte() ? "var(--purple-11)" : "var(--gray-9)",
                    backgroundColor: canMettreEnCompte() ? "var(--purple-a3)" : "var(--gray-a3)",
                    border: `1px solid ${canMettreEnCompte() ? "var(--purple-a6)" : "var(--gray-a6)"}`,
                    borderRadius: 8,
                    cursor: canMettreEnCompte() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: canMettreEnCompte() ? 1 : 0.6,
                  }}
                >
                  <CreditCard size={16} />
                  Mettre en compte
                </button>
              </Tooltip>
            ) : null}

            {/* Bouton paiement */}
            <Tooltip content={isServeur ? "Les serveurs ne peuvent pas encaisser" : undefined}>
              <button
                onClick={canEncaisser ? onProceedToPayment : undefined}
                disabled={!canEncaisser}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  fontSize: 16,
                  fontWeight: 600,
                  color: canEncaisser ? "white" : "var(--gray-9)",
                  backgroundColor: canEncaisser ? "var(--accent-9)" : "var(--gray-a4)",
                  border: "none",
                  borderRadius: 8,
                  cursor: canEncaisser ? "pointer" : "not-allowed",
                  opacity: canEncaisser ? 1 : 0.6,
                }}
              >
                {isServeur ? "Encaisser (reservé aux caissiers)" : "Encaisser (F5)"}
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Modal Remise (globale ou par ligne) */}
      <DiscountModal
        open={showDiscountModal}
        onOpenChange={setShowDiscountModal}
        selectedItem={selectedItemForDiscount}
      />

      {/* Modal Division d'addition */}
      <SplitBillModal />
    </div>
  );
}
