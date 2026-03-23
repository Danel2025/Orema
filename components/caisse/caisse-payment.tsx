"use client";

/**
 * CaissePayment - Modal de paiement complet
 *
 * Fonctionnalités:
 * - Tous les modes de paiement (Espèces, CB, Mobile Money, Chèque, Virement, Compte client)
 * - Mode MIXTE pour combiner plusieurs paiements
 * - Clavier numérique tactile
 * - Calcul automatique du rendu avec détail des coupures FCFA
 * - Validation du compte client (solde prépayé / crédit)
 * - Saisie référence et téléphone pour paiements électroniques
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { FocusScope } from "@radix-ui/react-focus-scope";
import {
  X,
  Money,
  CreditCard,
  DeviceMobile,
  Wallet,
  Check,
  SpinnerGap,
  Buildings,
  FileText,
  Plus,
  Trash,
  ArrowRight,
  CaretLeft,
  Phone,
  Hash,
  WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency, calculerRenduMonnaie, suggererMontantsArrondis } from "@/lib/utils";
import { useAutoPrint } from "@/lib/print/hooks";

// Types de paiement disponibles
type ModePaiement =
  | "ESPECES"
  | "CARTE_BANCAIRE"
  | "AIRTEL_MONEY"
  | "MOOV_MONEY"
  | "CHEQUE"
  | "VIREMENT"
  | "COMPTE_CLIENT"
  | "MIXTE";

interface VenteEnAttenteInfo {
  id: string;
  numeroTicket: string;
  totalFinal: number;
  type?: string;
  table?: { numero: string } | null;
  client?: { nom: string; prenom?: string | null; telephone?: string | null } | null;
}

interface CaissePaymentProps {
  onClose: () => void;
  onPaymentComplete: (data: PaymentResult) => void;
  /** Si fourni, on paie cette commande en attente au lieu du panier */
  venteEnAttente?: VenteEnAttenteInfo | null;
}

// Résultat du paiement à envoyer au serveur
interface PaymentResult {
  modePaiement: ModePaiement;
  montantRecu: number;
  montantRendu: number;
  reference?: string;
  paiements?: PaiementPartiel[]; // Pour le mode MIXTE
}

// Paiement partiel (pour le mode MIXTE)
interface PaiementPartiel {
  mode: ModePaiement;
  montant: number;
  reference?: string;
  telephone?: string;
}

// Configuration des modes de paiement
const PAYMENT_METHODS: {
  id: ModePaiement;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  needsReference?: boolean;
  needsPhone?: boolean;
  referencePlaceholder?: string;
}[] = [
  {
    id: "ESPECES",
    label: "Espèces",
    shortLabel: "Espèces",
    icon: <Money size={22} />,
    color: "green",
  },
  {
    id: "CARTE_BANCAIRE",
    label: "Carte bancaire",
    shortLabel: "CB",
    icon: <CreditCard size={22} />,
    color: "blue",
    needsReference: true,
    referencePlaceholder: "N° autorisation TPE",
  },
  {
    id: "AIRTEL_MONEY",
    label: "Airtel Money",
    shortLabel: "Airtel",
    icon: <DeviceMobile size={22} />,
    color: "red",
    needsReference: true,
    needsPhone: true,
    referencePlaceholder: "ID transaction",
  },
  {
    id: "MOOV_MONEY",
    label: "Moov Money",
    shortLabel: "Moov",
    icon: <DeviceMobile size={22} />,
    color: "cyan",
    needsReference: true,
    needsPhone: true,
    referencePlaceholder: "ID transaction",
  },
  {
    id: "CHEQUE",
    label: "Chèque",
    shortLabel: "Chèque",
    icon: <FileText size={22} />,
    color: "amber",
    needsReference: true,
    referencePlaceholder: "N° chèque / Banque",
  },
  {
    id: "VIREMENT",
    label: "Virement",
    shortLabel: "Virement",
    icon: <Buildings size={22} />,
    color: "purple",
    needsReference: true,
    referencePlaceholder: "Référence virement",
  },
  {
    id: "COMPTE_CLIENT",
    label: "Compte client",
    shortLabel: "Compte",
    icon: <Wallet size={22} />,
    color: "violet",
  },
  {
    id: "MIXTE",
    label: "Paiement mixte",
    shortLabel: "Mixte",
    icon: <Plus size={22} />,
    color: "gray",
  },
];

// Coupures pour les boutons rapides
const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000];

// Touches du clavier numérique
const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

export function CaissePayment({ onClose, onPaymentComplete, venteEnAttente }: CaissePaymentProps) {
  const { totalFinal: cartTotal, items, client: cartClient } = useCartStore();

  // Auto-impression après paiement (fire-and-forget)
  const { autoPrint } = useAutoPrint({
    onSuccess: () => toast.success("Impression envoyée"),
    onError: (errors) => toast.error("Erreur impression: " + errors.join(", ")),
  });

  // Si on paie une commande en attente, utiliser ses données, sinon utiliser le panier
  const totalFinal = venteEnAttente?.totalFinal ?? cartTotal;
  const client = venteEnAttente?.client ?? cartClient;
  const itemsCount = venteEnAttente ? 0 : items.length; // Pour les commandes en attente, on n'a pas le détail des items ici

  // État principal
  const [selectedMethod, setSelectedMethod] = useState<ModePaiement>("ESPECES");
  const [montantSaisi, setMontantSaisi] = useState("");
  const [reference, setReference] = useState("");
  const [telephone, setTelephone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // État pour le mode MIXTE
  const [paiementsPartiels, setPaiementsPartiels] = useState<PaiementPartiel[]>([]);
  const [mixteMode, setMixteMode] = useState<"select" | "amount">("select");
  const [mixteSelectedMethod, setMixteSelectedMethod] = useState<ModePaiement | null>(null);

  // Calculs
  const montantSaisiNum = parseFloat(montantSaisi) || 0;
  const totalPaiementsPartiels = paiementsPartiels.reduce((acc, p) => acc + p.montant, 0);
  const resteAPayer = totalFinal - totalPaiementsPartiels;

  // Pour le mode espèces - calcul du rendu
  const montantRendu = selectedMethod === "ESPECES" ? Math.max(0, montantSaisiNum - totalFinal) : 0;
  const coupuresRendu = calculerRenduMonnaie(montantRendu);

  // Suggestions de montants arrondis
  const montantsSuggeres = suggererMontantsArrondis(totalFinal);

  // Validation du paiement
  const canPay = (() => {
    if (selectedMethod === "MIXTE") {
      return totalPaiementsPartiels >= totalFinal;
    }
    if (selectedMethod === "ESPECES") {
      return montantSaisiNum >= totalFinal;
    }
    if (selectedMethod === "COMPTE_CLIENT") {
      // TODO: Vérifier le solde client
      return !!client;
    }
    return true;
  })();

  const currentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  // Gestion du clavier numérique
  const handleNumpadKey = useCallback((key: string) => {
    if (key === "C") {
      setMontantSaisi("");
    } else if (key === "⌫") {
      setMontantSaisi((prev) => prev.slice(0, -1));
    } else {
      setMontantSaisi((prev) => {
        // Empêcher les zéros initiaux multiples
        if (prev === "0" && key === "0") return prev;
        if (prev === "0" && key !== "0") return key;
        return prev + key;
      });
    }
  }, []);

  // Montant rapide
  const handleQuickAmount = useCallback((amount: number) => {
    setMontantSaisi((prev) => {
      const current = parseFloat(prev) || 0;
      return String(current + amount);
    });
  }, []);

  // Montant exact
  const handleExactAmount = useCallback(() => {
    setMontantSaisi(String(totalFinal));
  }, [totalFinal]);

  // Ajouter un paiement partiel (mode mixte)
  const handleAddPartialPayment = useCallback(() => {
    if (!mixteSelectedMethod || montantSaisiNum <= 0) return;

    const method = PAYMENT_METHODS.find((m) => m.id === mixteSelectedMethod);

    setPaiementsPartiels((prev) => [
      ...prev,
      {
        mode: mixteSelectedMethod,
        montant: Math.min(montantSaisiNum, resteAPayer),
        reference: method?.needsReference ? reference : undefined,
        telephone: method?.needsPhone ? telephone : undefined,
      },
    ]);

    // Reset
    setMontantSaisi("");
    setReference("");
    setTelephone("");
    setMixteSelectedMethod(null);
    setMixteMode("select");
  }, [mixteSelectedMethod, montantSaisiNum, resteAPayer, reference, telephone]);

  // Supprimer un paiement partiel
  const handleRemovePartialPayment = useCallback((index: number) => {
    setPaiementsPartiels((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Validation du paiement
  const handlePayment = async () => {
    if (!canPay) return;

    setIsProcessing(true);

    // Simuler un délai pour le traitement
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Auto-impression fire-and-forget (ne bloque pas le flux de paiement)
    if (venteEnAttente?.id) {
      autoPrint(venteEnAttente.id);
    }

    if (selectedMethod === "MIXTE") {
      onPaymentComplete({
        modePaiement: "MIXTE",
        montantRecu: totalPaiementsPartiels,
        montantRendu: 0,
        paiements: paiementsPartiels,
      });
    } else {
      onPaymentComplete({
        modePaiement: selectedMethod,
        montantRecu: selectedMethod === "ESPECES" ? montantSaisiNum : totalFinal,
        montantRendu: selectedMethod === "ESPECES" ? montantRendu : 0,
        reference: currentMethod?.needsReference ? reference : undefined,
      });
    }

    setIsProcessing(false);
  };

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Échap pour fermer
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Entrée pour valider (sauf si le focus est dans un input texte)
      if (e.key === "Enter" && canPay) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "button") return;
        handlePayment();
        return;
      }

      // Chiffres du clavier
      if (/^[0-9]$/.test(e.key)) {
        handleNumpadKey(e.key);
        return;
      }

      // Backspace
      if (e.key === "Backspace") {
        handleNumpadKey("⌫");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canPay, handleNumpadKey, onClose]);

  // Reset quand on change de mode (derived-state pattern)
  const prevMethodRef = useRef(selectedMethod);
  if (prevMethodRef.current !== selectedMethod) {
    prevMethodRef.current = selectedMethod;
    setMontantSaisi("");
    setReference("");
    setTelephone("");
    setPaiementsPartiels([]);
    setMixteMode("select");
    setMixteSelectedMethod(null);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <FocusScope trapped asChild>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        tabIndex={-1}
        style={{
          backgroundColor: "var(--color-panel-solid)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 720,
          maxHeight: "95vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          outline: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-a6)",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          <div>
            <h2
              id="payment-title"
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--gray-12)",
                margin: 0,
              }}
            >
              {venteEnAttente ? "Paiement commande" : "Encaissement"}
            </h2>
            <p style={{ fontSize: 13, color: "var(--gray-11)", margin: "4px 0 0 0" }}>
              {venteEnAttente ? (
                <>
                  #{venteEnAttente.numeroTicket}
                  {venteEnAttente.table ? ` - Table ${venteEnAttente.table.numero}` : null}
                </>
              ) : (
                `${items.length} article${items.length > 1 ? "s" : ""}`
              )}
            </p>
          </div>

          {/* Total à payer */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--gray-10)" }}>Total à payer</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--accent-11)",
                fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                lineHeight: 1,
              }}
            >
              {formatCurrency(totalFinal)}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer le paiement"
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "none",
              backgroundColor: "var(--gray-a4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gray-11)",
              marginLeft: 16,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu principal */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Colonne gauche - Modes de paiement */}
          <div
            style={{
              width: 200,
              borderRight: "1px solid var(--gray-a6)",
              padding: "12px",
              overflowY: "auto",
              backgroundColor: "var(--gray-a2)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--gray-10)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Mode de paiement
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border:
                      selectedMethod === method.id
                        ? `2px solid var(--${method.color}-9)`
                        : "1px solid transparent",
                    backgroundColor:
                      selectedMethod === method.id ? `var(--${method.color}-a3)` : "transparent",
                    color:
                      selectedMethod === method.id ? `var(--${method.color}-11)` : "var(--gray-11)",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                    textAlign: "left",
                  }}
                >
                  <span style={{ opacity: selectedMethod === method.id ? 1 : 0.7 }}>
                    {method.icon}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: selectedMethod === method.id ? 600 : 500 }}
                  >
                    {method.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colonne droite - Saisie */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
              {/* Mode ESPECES */}
              {selectedMethod === "ESPECES" && (
                <div>
                  {/* Affichage montant saisi */}
                  <div
                    style={{
                      backgroundColor: "var(--gray-a3)",
                      borderRadius: 12,
                      padding: "16px 20px",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "var(--gray-10)", marginBottom: 4 }}>
                      Montant reçu
                    </div>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 700,
                        color: montantSaisiNum >= totalFinal ? "var(--green-11)" : "var(--gray-12)",
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        minHeight: 44,
                      }}
                    >
                      {montantSaisi ? formatCurrency(montantSaisiNum) : "—"}
                    </div>
                  </div>

                  {/* Suggestions de montants */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--gray-10)", marginBottom: 8 }}>
                      Montant exact ou arrondi
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {montantsSuggeres.map((montant) => (
                        <button
                          key={montant}
                          onClick={() => setMontantSaisi(String(montant))}
                          style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            borderRadius: 6,
                            border:
                              montant === totalFinal
                                ? "2px solid var(--green-9)"
                                : "1px solid var(--gray-a6)",
                            backgroundColor:
                              montant === totalFinal
                                ? "var(--green-a3)"
                                : "var(--color-panel-solid)",
                            color: montant === totalFinal ? "var(--green-11)" : "var(--gray-12)",
                            cursor: "pointer",
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(montant)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Boutons coupures rapides */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--gray-10)", marginBottom: 8 }}>
                      Ajouter une coupure
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {QUICK_AMOUNTS.map((coupure) => (
                        <button
                          key={coupure}
                          onClick={() => handleQuickAmount(coupure)}
                          style={{
                            padding: "10px",
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 6,
                            border: "1px solid var(--gray-a6)",
                            backgroundColor: "var(--color-panel-solid)",
                            color: "var(--gray-12)",
                            cursor: "pointer",
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          +{formatCurrency(coupure)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clavier numérique */}
                  <div>
                    <div style={{ fontSize: 12, color: "var(--gray-10)", marginBottom: 8 }}>
                      Clavier
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {NUMPAD_KEYS.map((key) => (
                        <button
                          key={key}
                          onClick={() => handleNumpadKey(key)}
                          aria-label={
                            key === "C" ? "Effacer tout" : key === "⌫" ? "Effacer le dernier chiffre" : `Touche ${key}`
                          }
                          style={{
                            padding: "14px",
                            fontSize: key === "C" || key === "⌫" ? 14 : 18,
                            fontWeight: 600,
                            borderRadius: 8,
                            border: "none",
                            backgroundColor:
                              key === "C"
                                ? "var(--red-a4)"
                                : key === "⌫"
                                  ? "var(--amber-a4)"
                                  : "var(--gray-a4)",
                            color:
                              key === "C"
                                ? "var(--red-11)"
                                : key === "⌫"
                                  ? "var(--purple-11)"
                                  : "var(--gray-12)",
                            cursor: "pointer",
                          }}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monnaie à rendre */}
                  {montantSaisiNum > 0 && montantSaisiNum >= totalFinal && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        backgroundColor: "var(--green-a3)",
                        borderRadius: 12,
                        border: "1px solid var(--green-a6)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--green-11)" }}>
                          Monnaie à rendre
                        </span>
                        <span
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "var(--green-11)",
                            fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                          }}
                        >
                          {formatCurrency(montantRendu)}
                        </span>
                      </div>

                      {/* Détail des coupures */}
                      {coupuresRendu.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--green-10)",
                              marginBottom: 6,
                              textTransform: "uppercase",
                            }}
                          >
                            Détail
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {coupuresRendu.map((c, i) => (
                              <span
                                key={i}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 10px",
                                  backgroundColor: "var(--green-a4)",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: "var(--green-11)",
                                  fontFamily:
                                    "var(--font-google-sans-code), ui-monospace, monospace",
                                }}
                              >
                                {c.quantite} × {c.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modes avec référence (CB, Mobile Money, Chèque, Virement) */}
              {(selectedMethod === "CARTE_BANCAIRE" ||
                selectedMethod === "AIRTEL_MONEY" ||
                selectedMethod === "MOOV_MONEY" ||
                selectedMethod === "CHEQUE" ||
                selectedMethod === "VIREMENT") && (
                <div>
                  <div
                    style={{
                      backgroundColor: `var(--${currentMethod?.color}-a3)`,
                      borderRadius: 12,
                      padding: "20px",
                      marginBottom: 20,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>{currentMethod?.icon}</div>
                    <div
                      style={{
                        fontSize: 14,
                        color: `var(--${currentMethod?.color}-11)`,
                        marginBottom: 4,
                      }}
                    >
                      Paiement par {currentMethod?.label}
                    </div>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: `var(--${currentMethod?.color}-11)`,
                        fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                      }}
                    >
                      {formatCurrency(totalFinal)}
                    </div>
                  </div>

                  {/* Numéro de téléphone (Mobile Money) */}
                  {currentMethod?.needsPhone ? (
                    <div style={{ marginBottom: 16 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--gray-11)",
                          marginBottom: 8,
                        }}
                      >
                        <Phone
                          size={14}
                          style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
                        />
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="Ex: 077 12 34 56"
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          fontSize: 16,
                          borderRadius: 8,
                          border: "1px solid var(--gray-a6)",
                          backgroundColor: "var(--gray-a2)",
                          color: "var(--gray-12)",
                          outline: "none",
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Référence */}
                  {currentMethod?.needsReference ? (
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--gray-11)",
                          marginBottom: 8,
                        }}
                      >
                        <Hash
                          size={14}
                          style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}
                        />
                        {currentMethod.referencePlaceholder}
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={currentMethod.referencePlaceholder}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          fontSize: 16,
                          borderRadius: 8,
                          border: "1px solid var(--gray-a6)",
                          backgroundColor: "var(--gray-a2)",
                          color: "var(--gray-12)",
                          outline: "none",
                        }}
                        autoFocus
                      />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Mode COMPTE CLIENT */}
              {selectedMethod === "COMPTE_CLIENT" && (
                <div>
                  {client ? (
                    <div
                      style={{
                        backgroundColor: "var(--accent-a3)",
                        borderRadius: 12,
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >
                      <Wallet size={32} style={{ color: "var(--accent-11)", marginBottom: 8 }} />
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "var(--accent-11)",
                          marginBottom: 4,
                        }}
                      >
                        {client.nom} {client.prenom}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--accent-10)", marginBottom: 16 }}>
                        {client.telephone || "Pas de téléphone"}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: "var(--accent-11)",
                          fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                        }}
                      >
                        {formatCurrency(totalFinal)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--accent-10)", marginTop: 4 }}>
                        sera débité du compte client
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "var(--purple-a3)",
                        borderRadius: 12,
                        padding: "24px",
                        textAlign: "center",
                      }}
                    >
                      <WarningCircle
                        size={32}
                        style={{ color: "var(--purple-11)", marginBottom: 12 }}
                      />
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--purple-11)",
                          marginBottom: 8,
                        }}
                      >
                        Aucun client sélectionné
                      </div>
                      <div style={{ fontSize: 13, color: "var(--amber-10)" }}>
                        Veuillez d'abord sélectionner un client pour utiliser ce mode de paiement.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode MIXTE */}
              {selectedMethod === "MIXTE" && (
                <div>
                  {/* Résumé des paiements */}
                  <div
                    style={{
                      backgroundColor: "var(--gray-a3)",
                      borderRadius: 12,
                      padding: "16px",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 13, color: "var(--gray-10)" }}>Total à payer</span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--gray-12)",
                          fontFamily: "var(--font-google-sans-code)",
                        }}
                      >
                        {formatCurrency(totalFinal)}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 13, color: "var(--gray-10)" }}>Déjà payé</span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--green-11)",
                          fontFamily: "var(--font-google-sans-code)",
                        }}
                      >
                        {formatCurrency(totalPaiementsPartiels)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: 8,
                        borderTop: "1px solid var(--gray-a6)",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-12)" }}>
                        Reste à payer
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: resteAPayer > 0 ? "var(--accent-11)" : "var(--green-11)",
                          fontFamily: "var(--font-google-sans-code)",
                        }}
                      >
                        {formatCurrency(resteAPayer)}
                      </span>
                    </div>
                  </div>

                  {/* Liste des paiements partiels */}
                  {paiementsPartiels.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: "var(--gray-10)", marginBottom: 8 }}>
                        Paiements enregistrés
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {paiementsPartiels.map((p, index) => {
                          const method = PAYMENT_METHODS.find((m) => m.id === p.mode);
                          return (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 12px",
                                backgroundColor: `var(--${method?.color}-a3)`,
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {method?.icon}
                                <div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: `var(--${method?.color}-11)`,
                                    }}
                                  >
                                    {method?.label}
                                  </div>
                                  {p.reference ? (
                                    <div
                                      style={{ fontSize: 11, color: `var(--${method?.color}-10)` }}
                                    >
                                      Réf: {p.reference}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: `var(--${method?.color}-11)`,
                                    fontFamily: "var(--font-google-sans-code)",
                                  }}
                                >
                                  {formatCurrency(p.montant)}
                                </span>
                                <button
                                  onClick={() => handleRemovePartialPayment(index)}
                                  aria-label={`Supprimer le paiement ${method?.label}`}
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 6,
                                    border: "none",
                                    backgroundColor: "var(--red-a4)",
                                    color: "var(--red-11)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ajouter un paiement */}
                  {resteAPayer > 0 && (
                    <div>
                      {mixteMode === "select" ? (
                        <div>
                          <div style={{ fontSize: 12, color: "var(--gray-10)", marginBottom: 8 }}>
                            Ajouter un paiement
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 6,
                            }}
                          >
                            {PAYMENT_METHODS.filter((m) => m.id !== "MIXTE").map((method) => (
                              <button
                                key={method.id}
                                onClick={() => {
                                  setMixteSelectedMethod(method.id);
                                  setMixteMode("amount");
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "12px",
                                  borderRadius: 8,
                                  border: "1px solid var(--gray-a6)",
                                  backgroundColor: "var(--color-panel-solid)",
                                  color: "var(--gray-11)",
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: 500,
                                }}
                              >
                                {method.icon}
                                {method.shortLabel}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => {
                              setMixteMode("select");
                              setMixteSelectedMethod(null);
                              setMontantSaisi("");
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 12px",
                              marginBottom: 12,
                              borderRadius: 6,
                              border: "none",
                              backgroundColor: "var(--gray-a4)",
                              color: "var(--gray-11)",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <CaretLeft size={16} />
                            Retour
                          </button>

                          {/* Saisie du montant pour le paiement partiel */}
                          <div style={{ marginBottom: 12 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 500,
                                color: "var(--gray-11)",
                                marginBottom: 8,
                              }}
                            >
                              Montant (
                              {PAYMENT_METHODS.find((m) => m.id === mixteSelectedMethod)?.label})
                            </label>
                            <input
                              type="number"
                              value={montantSaisi}
                              onChange={(e) => setMontantSaisi(e.target.value)}
                              placeholder={`Max: ${formatCurrency(resteAPayer)}`}
                              style={{
                                width: "100%",
                                padding: "12px 14px",
                                fontSize: 18,
                                fontWeight: 600,
                                borderRadius: 8,
                                border: "1px solid var(--gray-a6)",
                                backgroundColor: "var(--gray-a2)",
                                color: "var(--gray-12)",
                                outline: "none",
                                textAlign: "right",
                                fontFamily: "var(--font-google-sans-code)",
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => setMontantSaisi(String(resteAPayer))}
                              style={{
                                marginTop: 8,
                                padding: "8px 16px",
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 6,
                                border: "1px solid var(--green-a6)",
                                backgroundColor: "var(--green-a3)",
                                color: "var(--green-11)",
                                cursor: "pointer",
                              }}
                            >
                              Reste à payer ({formatCurrency(resteAPayer)})
                            </button>
                          </div>

                          {/* Référence si nécessaire */}
                          {PAYMENT_METHODS.find((m) => m.id === mixteSelectedMethod)
                            ?.needsReference ? (
                            <div style={{ marginBottom: 12 }}>
                              <label
                                style={{
                                  display: "block",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "var(--gray-11)",
                                  marginBottom: 8,
                                }}
                              >
                                Référence
                              </label>
                              <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder={
                                  PAYMENT_METHODS.find((m) => m.id === mixteSelectedMethod)
                                    ?.referencePlaceholder
                                }
                                style={{
                                  width: "100%",
                                  padding: "10px 12px",
                                  fontSize: 14,
                                  borderRadius: 8,
                                  border: "1px solid var(--gray-a6)",
                                  backgroundColor: "var(--gray-a2)",
                                  color: "var(--gray-12)",
                                  outline: "none",
                                }}
                              />
                            </div>
                          ) : null}

                          <button
                            onClick={handleAddPartialPayment}
                            disabled={montantSaisiNum <= 0}
                            style={{
                              width: "100%",
                              padding: "12px",
                              fontSize: 14,
                              fontWeight: 600,
                              borderRadius: 8,
                              border: "none",
                              backgroundColor:
                                montantSaisiNum > 0 ? "var(--accent-9)" : "var(--gray-a6)",
                              color: montantSaisiNum > 0 ? "white" : "var(--gray-10)",
                              cursor: montantSaisiNum > 0 ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                            }}
                          >
                            <Plus size={18} />
                            Ajouter ce paiement
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer avec bouton de validation */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--gray-a6)",
                display: "flex",
                gap: 12,
                backgroundColor: "var(--gray-a2)",
              }}
            >
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: "1px solid var(--gray-a6)",
                  backgroundColor: "transparent",
                  color: "var(--gray-12)",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handlePayment}
                disabled={!canPay || isProcessing}
                style={{
                  flex: 2,
                  padding: "12px 20px",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: canPay ? "var(--green-9)" : "var(--gray-a6)",
                  color: canPay ? "white" : "var(--gray-10)",
                  cursor: canPay ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isProcessing ? (
                  <>
                    <SpinnerGap size={18} className="animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Valider ({formatCurrency(totalFinal)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </FocusScope>
    </div>
  );
}
