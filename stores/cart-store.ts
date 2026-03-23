import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState, CartClient, CartTable, CartItemRemise } from "@/types";
import { calculerTVA, calculerTTC } from "@/lib/utils";
import {
  type ReglesUtilisateur,
  verifierRemiseAutorisee,
} from "@/lib/tarification/client-validation";

// Type pour les supplements selectionnes
interface CartSupplement {
  id?: string;
  nom: string;
  prix: number;
}

// Type pour une vente en attente sur table
interface VenteEnAttenteInfo {
  id: string;
  numeroTicket: string;
  totalFinal: number;
  lignesCount: number;
}

// Résultat de tentative d'application de remise
export interface RemiseResult {
  success: boolean;
  raison?: string;
  necessiteApprobation?: boolean;
}

// Résultat de validation du panier
export interface CartValidation {
  valide: boolean;
  erreurs: string[];
}

interface CartStore extends CartState {
  // Actions
  addItem: (
    item: Omit<CartItem, "sousTotal" | "montantTva" | "total" | "quantite" | "lineId">,
    quantity?: number
  ) => void;
  addItemWithSupplements: (
    item: Omit<
      CartItem,
      | "sousTotal"
      | "montantTva"
      | "total"
      | "quantite"
      | "lineId"
      | "supplements"
      | "totalSupplements"
    >,
    supplements: CartSupplement[],
    quantity?: number
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantite: number) => void;
  updateNotes: (lineId: string, notes: string) => void;
  applyItemRemise: (lineId: string, remise: CartItemRemise | undefined) => RemiseResult;
  applyRemise: (type: "POURCENTAGE" | "MONTANT_FIXE", valeur: number) => RemiseResult;
  clearRemise: () => void;
  setTypeVente: (type: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER") => void;
  setTable: (tableId: string | undefined, table?: CartTable, couverts?: number) => void;
  setClient: (clientId: string | undefined, client?: CartClient) => void;
  setDeliveryInfo: (info: {
    adresseLivraison?: string;
    telephoneLivraison?: string;
    notesLivraison?: string;
  }) => void;
  clearDeliveryInfo: () => void;
  clearCart: () => void;
  calculateTotals: () => void;
  // Quantite pre-selectionnee
  pendingQuantity: number | null;
  setPendingQuantity: (qty: number | null) => void;
  // Mise en attente / Mise en compte
  venteEnAttenteTable: VenteEnAttenteInfo | null;
  setVenteEnAttenteTable: (vente: VenteEnAttenteInfo | null) => void;
  canMettreEnAttente: () => boolean;
  canMettreEnCompte: () => boolean;
  getCreditDisponible: () => number | null;
  // Tarification
  reglesTarification: ReglesUtilisateur | null;
  setReglesTarification: (regles: ReglesUtilisateur | null) => void;
  validateCart: (montantMinimumVente?: number) => CartValidation;
}

const initialState: CartState & {
  pendingQuantity: number | null;
  venteEnAttenteTable: VenteEnAttenteInfo | null;
} = {
  items: [],
  sousTotal: 0,
  totalTva: 0,
  totalRemise: 0,
  totalFinal: 0,
  typeVente: "DIRECT",
  pendingQuantity: null,
  venteEnAttenteTable: null,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addItem: (item, quantity) => {
        const items = get().items;
        const pendingQty = get().pendingQuantity;
        const qtyToAdd = quantity ?? pendingQty ?? 1;

        // Reset pending quantity after use
        if (pendingQty !== null) {
          set({ pendingQuantity: null });
        }

        // Chercher un item existant SANS supplements
        const existingItemIndex = items.findIndex(
          (i) => i.produitId === item.produitId && (!i.supplements || i.supplements.length === 0)
        );

        if (existingItemIndex >= 0) {
          // Si le produit existe deja sans supplements, on augmente la quantite
          const existingLineId = items[existingItemIndex].lineId;
          if (existingLineId) {
            get().updateQuantity(existingLineId, items[existingItemIndex].quantite + qtyToAdd);
          }
        } else {
          // Sinon, on ajoute le nouveau produit
          const baseTotal = item.prixUnitaire * qtyToAdd;
          const newItem: CartItem = {
            ...item,
            lineId: crypto.randomUUID(),
            quantite: qtyToAdd,
            sousTotal: baseTotal,
            montantTva: calculerTVA(baseTotal, item.produit.tauxTva),
            total: calculerTTC(baseTotal, item.produit.tauxTva),
          };

          set({ items: [...items, newItem] });
          get().calculateTotals();
        }
      },

      addItemWithSupplements: (item, supplements, quantity) => {
        const items = get().items;
        const pendingQty = get().pendingQuantity;
        const qtyToAdd = quantity ?? pendingQty ?? 1;

        // Reset pending quantity after use
        if (pendingQty !== null) {
          set({ pendingQuantity: null });
        }

        // Calculer le total des supplements
        const totalSupplements = supplements.reduce((acc, s) => acc + s.prix, 0);

        // Prix unitaire avec supplements
        const prixAvecSupplements = item.prixUnitaire + totalSupplements;
        const baseTotal = prixAvecSupplements * qtyToAdd;

        const newItem: CartItem = {
          ...item,
          lineId: crypto.randomUUID(),
          quantite: qtyToAdd,
          supplements: supplements.map((s) => ({ nom: s.nom, prix: s.prix })),
          totalSupplements,
          sousTotal: baseTotal,
          montantTva: calculerTVA(baseTotal, item.produit.tauxTva),
          total: calculerTTC(baseTotal, item.produit.tauxTva),
        };

        set({ items: [...items, newItem] });
        get().calculateTotals();
      },

      removeItem: (lineId) => {
        set({ items: get().items.filter((item) => item.lineId !== lineId) });
        get().calculateTotals();
      },

      updateQuantity: (lineId, quantite) => {
        if (quantite <= 0) {
          get().removeItem(lineId);
          return;
        }

        const items = get().items.map((item) => {
          if (item.lineId === lineId) {
            // Calculer le prix unitaire avec supplements
            const prixAvecSupplements = item.prixUnitaire + (item.totalSupplements || 0);
            const sousTotalBrut = prixAvecSupplements * quantite;

            // Calculer la remise par ligne si elle existe
            let remiseLigne = 0;
            if (item.remiseLigne) {
              if (item.remiseLigne.type === "POURCENTAGE") {
                remiseLigne = Math.round((sousTotalBrut * item.remiseLigne.valeur) / 100);
              } else {
                remiseLigne = item.remiseLigne.valeur;
              }
            }

            const sousTotal = sousTotalBrut - remiseLigne;
            const montantTva = calculerTVA(sousTotal, item.produit.tauxTva);
            const total = sousTotal + montantTva;

            return {
              ...item,
              quantite,
              sousTotal,
              montantTva,
              total,
              montantRemiseLigne: remiseLigne,
            };
          }
          return item;
        });

        set({ items });
        get().calculateTotals();
      },

      updateNotes: (lineId, notes) => {
        set({
          items: get().items.map((item) => (item.lineId === lineId ? { ...item, notes } : item)),
        });
      },

      applyItemRemise: (lineId, remise) => {
        // Validation tarifaire si une remise est appliquée (pas pour la suppression)
        if (remise) {
          const regles = get().reglesTarification;
          if (regles) {
            // Trouver l'item pour calculer le montant de remise
            const targetItem = get().items.find((i) => i.lineId === lineId);
            if (targetItem) {
              const prixAvecSupplements =
                targetItem.prixUnitaire + (targetItem.totalSupplements || 0);
              const sousTotalBrut = prixAvecSupplements * targetItem.quantite;
              const pourcentage =
                remise.type === "POURCENTAGE"
                  ? remise.valeur
                  : sousTotalBrut > 0
                    ? (remise.valeur / sousTotalBrut) * 100
                    : 0;
              const montant =
                remise.type === "POURCENTAGE"
                  ? Math.round((sousTotalBrut * remise.valeur) / 100)
                  : remise.valeur;

              const resultat = verifierRemiseAutorisee(regles, pourcentage, montant);
              if (!resultat.autorise) {
                return {
                  success: false,
                  raison: resultat.raison,
                  necessiteApprobation: resultat.necessiteApprobation,
                };
              }
            }
          }
        }

        const items = get().items.map((item) => {
          if (item.lineId === lineId) {
            // Calculer le prix unitaire avec supplements
            const prixAvecSupplements = item.prixUnitaire + (item.totalSupplements || 0);
            const sousTotalBrut = prixAvecSupplements * item.quantite;

            // Calculer la remise par ligne
            let remiseLigne = 0;
            if (remise) {
              if (remise.type === "POURCENTAGE") {
                remiseLigne = Math.round((sousTotalBrut * remise.valeur) / 100);
              } else {
                remiseLigne = remise.valeur;
              }
            }

            const sousTotal = sousTotalBrut - remiseLigne;
            const montantTva = calculerTVA(sousTotal, item.produit.tauxTva);
            const total = sousTotal + montantTva;

            return {
              ...item,
              remiseLigne: remise,
              montantRemiseLigne: remiseLigne,
              sousTotal,
              montantTva,
              total,
            };
          }
          return item;
        });

        set({ items });
        get().calculateTotals();
        return { success: true };
      },

      setPendingQuantity: (qty) => {
        set({ pendingQuantity: qty });
      },

      applyRemise: (type, valeur) => {
        // Validation tarifaire
        const regles = get().reglesTarification;
        if (regles) {
          const { sousTotal } = get();
          const pourcentage =
            type === "POURCENTAGE"
              ? valeur
              : sousTotal > 0
                ? (valeur / sousTotal) * 100
                : 0;
          const montant =
            type === "POURCENTAGE"
              ? Math.round((sousTotal * valeur) / 100)
              : valeur;

          const resultat = verifierRemiseAutorisee(regles, pourcentage, montant);
          if (!resultat.autorise) {
            return {
              success: false,
              raison: resultat.raison,
              necessiteApprobation: resultat.necessiteApprobation,
            };
          }
        }

        set({ remise: { type, valeur } });
        get().calculateTotals();
        return { success: true };
      },

      clearRemise: () => {
        set({ remise: undefined, totalRemise: 0 });
        get().calculateTotals();
      },

      setTypeVente: (type) => {
        set({ typeVente: type });
        // Clear mode-specific data when changing type
        if (type !== "TABLE") {
          set({ tableId: undefined, table: undefined });
        }
        if (type !== "LIVRAISON") {
          set({
            adresseLivraison: undefined,
            telephoneLivraison: undefined,
            notesLivraison: undefined,
          });
        }
      },

      setTable: (tableId, table, couverts) => {
        set({
          tableId,
          table: table ? { ...table, couverts } : undefined,
        });
      },

      setClient: (clientId, client) => {
        set({ clientId, client });
      },

      setDeliveryInfo: (info) => {
        set({
          adresseLivraison: info.adresseLivraison,
          telephoneLivraison: info.telephoneLivraison,
          notesLivraison: info.notesLivraison,
        });
      },

      clearDeliveryInfo: () => {
        set({
          adresseLivraison: undefined,
          telephoneLivraison: undefined,
          notesLivraison: undefined,
        });
      },

      clearCart: () => {
        set(initialState);
      },

      calculateTotals: () => {
        const { items, remise } = get();

        // Calcul du sous-total et TVA
        const sousTotal = items.reduce((acc, item) => acc + item.sousTotal, 0);
        const totalTva = items.reduce((acc, item) => acc + item.montantTva, 0);

        // Calcul de la remise
        let totalRemise = 0;
        if (remise) {
          if (remise.type === "POURCENTAGE") {
            totalRemise = Math.round((sousTotal * remise.valeur) / 100);
          } else {
            totalRemise = remise.valeur;
          }
        }

        // Total final
        const totalFinal = sousTotal + totalTva - totalRemise;

        set({
          sousTotal,
          totalTva,
          totalRemise,
          totalFinal: Math.max(0, totalFinal), // Ne peut pas être négatif
        });
      },

      // Mise en attente / Mise en compte
      setVenteEnAttenteTable: (vente) => {
        set({ venteEnAttenteTable: vente });
      },

      canMettreEnAttente: () => {
        const { typeVente, items, tableId } = get();
        // Disponible pour TABLE, LIVRAISON, EMPORTER (pas DIRECT)
        if (typeVente === "DIRECT") return false;
        // Doit avoir des articles
        if (items.length === 0) return false;
        // Pour TABLE, une table doit être sélectionnée
        if (typeVente === "TABLE" && !tableId) return false;
        return true;
      },

      canMettreEnCompte: () => {
        const { client, totalFinal } = get();
        // Doit avoir un client
        if (!client) return false;
        // Le client doit avoir le crédit autorisé
        if (!client.creditAutorise) return false;
        // Vérifier le crédit disponible
        const limiteCredit = client.limitCredit ?? 0;
        const soldeActuel = client.soldeCredit ?? 0;
        const creditDisponible = limiteCredit - soldeActuel;
        return creditDisponible >= totalFinal;
      },

      getCreditDisponible: () => {
        const { client } = get();
        if (!client || !client.creditAutorise) return null;
        const limiteCredit = client.limitCredit ?? 0;
        const soldeActuel = client.soldeCredit ?? 0;
        return limiteCredit - soldeActuel;
      },

      // Tarification
      reglesTarification: null,

      setReglesTarification: (regles) => {
        set({ reglesTarification: regles });
      },

      validateCart: (montantMinimumVente) => {
        const { items, totalFinal, reglesTarification } = get();
        const erreurs: string[] = [];

        if (items.length === 0) {
          erreurs.push("Le panier est vide.");
        }

        // Vérifier montant minimum
        if (montantMinimumVente && montantMinimumVente > 0 && totalFinal < montantMinimumVente) {
          erreurs.push(
            `Le montant minimum de vente est de ${montantMinimumVente} FCFA. Total actuel : ${totalFinal} FCFA.`
          );
        }

        // Vérifier les marges si la protection est active
        if (reglesTarification?.protectionMargeActive) {
          const margeMin = reglesTarification.margeMinimumGlobale;
          for (const item of items) {
            // On vérifie la marge uniquement si le produit a un prix d'achat
            // Le CartProduit ne contient pas le prixAchat, la validation complète se fait côté serveur
            // Ici on vérifie les remises qui pourraient faire passer sous la marge
            if (item.remiseLigne && item.montantRemiseLigne) {
              const prixAvecSupplements = item.prixUnitaire + (item.totalSupplements || 0);
              const sousTotalBrut = prixAvecSupplements * item.quantite;
              const pourcentageRemise =
                sousTotalBrut > 0
                  ? (item.montantRemiseLigne / sousTotalBrut) * 100
                  : 0;
              if (pourcentageRemise > margeMin) {
                erreurs.push(
                  `La remise sur "${item.produit.nom}" (${Math.round(pourcentageRemise)}%) dépasse la marge minimum de ${margeMin}%.`
                );
              }
            }
          }
        }

        return { valide: erreurs.length === 0, erreurs };
      },
    }),
    {
      name: "cart-storage",
      version: 2,
      // Ne persister que l'etat UI necessaire - PAS de donnees financieres sensibles
      // SECURITY: Ne pas persister :
      // - client (contient soldeCredit, limitCredit, creditAutorise - donnees financieres)
      // - clientId (reference vers donnees sensibles, sera re-selectionne)
      // - remise avec montants (recalcule cote serveur)
      // - paiements (jamais persister de donnees de paiement)
      partialize: (state) => ({
        items: state.items,
        typeVente: state.typeVente,
        tableId: state.tableId,
        table: state.table,
        adresseLivraison: state.adresseLivraison,
        telephoneLivraison: state.telephoneLivraison,
        notesLivraison: state.notesLivraison,
      }),
      // Migration pour garantir que tous les items ont un lineId
      // SECURITY: version bump to 2 to force clearing persisted client/remise data
      migrate: (persistedState, version) => {
        const state = persistedState as CartState & { pendingQuantity?: number | null };
        if (state.items) {
          state.items = state.items.map((item) => ({
            ...item,
            lineId: item.lineId || crypto.randomUUID(),
          }));
        }
        // Return only safe-to-persist fields, strip sensitive data from old versions
        return {
          items: state.items || [],
          typeVente: state.typeVente || "DIRECT",
          tableId: state.tableId,
          table: state.table,
          adresseLivraison: state.adresseLivraison,
          telephoneLivraison: state.telephoneLivraison,
          notesLivraison: state.notesLivraison,
        };
      },
    }
  )
);
