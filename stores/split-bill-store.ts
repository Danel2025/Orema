import { create } from "zustand";
import type { CartItem, ModePaiement } from "@/types";

/**
 * Mode de division de l'addition
 */
export type SplitMode = "equal" | "custom" | "items";

/**
 * Part d'une addition divisee
 */
export interface SplitPart {
  id: string;
  montant: number;
  paye: boolean;
  modePaiement?: ModePaiement;
  reference?: string;
  // Pour le mode "items" - liste des produitId attribues a cette part
  items?: string[];
  // Nom optionnel de la personne
  nom?: string;
}

/**
 * Etat du store de division d'addition
 */
interface SplitBillState {
  // Est-ce que le modal est ouvert
  isOpen: boolean;
  // ID de la vente en cours de division (si vente existante)
  venteId: string | null;
  // Mode de division
  mode: SplitMode;
  // Total a diviser
  total: number;
  // Liste des articles (pour le mode items)
  items: CartItem[];
  // Parts de l'addition
  parts: SplitPart[];
  // Nombre de personnes (pour le mode equal)
  nombrePersonnes: number;
}

/**
 * Actions du store
 */
interface SplitBillActions {
  // Ouvrir le modal de division
  openSplitBill: (total: number, items: CartItem[], venteId?: string) => void;
  // Fermer le modal
  closeSplitBill: () => void;
  // Changer le mode de division
  setMode: (mode: SplitMode) => void;
  // Definir le nombre de personnes (pour le mode equal)
  setNombrePersonnes: (nombre: number) => void;
  // Ajouter une part
  addPart: (montant?: number) => void;
  // Supprimer une part
  removePart: (partId: string) => void;
  // Mettre a jour une part
  updatePart: (partId: string, updates: Partial<Omit<SplitPart, "id">>) => void;
  // Marquer une part comme payee
  markAsPaid: (partId: string, modePaiement: ModePaiement, reference?: string) => void;
  // Attribuer un article a une part (mode items)
  assignItemToPart: (produitId: string, partId: string) => void;
  // Retirer un article d'une part (mode items)
  unassignItem: (produitId: string) => void;
  // Recalculer les parts (mode equal)
  recalculateEqualParts: () => void;
  // Reset le store
  reset: () => void;
}

type SplitBillStore = SplitBillState & SplitBillActions;

/**
 * Genere un ID unique pour une part
 */
function generatePartId(): string {
  return `part-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Etat initial
 */
const initialState: SplitBillState = {
  isOpen: false,
  venteId: null,
  mode: "equal",
  total: 0,
  items: [],
  parts: [],
  nombrePersonnes: 2,
};

/**
 * Store Zustand pour la division d'addition
 */
export const useSplitBillStore = create<SplitBillStore>()((set, get) => ({
  ...initialState,

  openSplitBill: (total, items, venteId) => {
    // Creer 2 parts par defaut en mode equal
    const montantPart = Math.round(total / 2);
    const parts: SplitPart[] = [
      { id: generatePartId(), montant: montantPart, paye: false, nom: "Personne 1" },
      { id: generatePartId(), montant: total - montantPart, paye: false, nom: "Personne 2" },
    ];

    set({
      isOpen: true,
      venteId: venteId ?? null,
      total,
      items,
      parts,
      mode: "equal",
      nombrePersonnes: 2,
    });
  },

  closeSplitBill: () => {
    set({ isOpen: false });
  },

  setMode: (mode) => {
    const { total, items, nombrePersonnes } = get();

    if (mode === "equal") {
      // Recalculer les parts egales
      const montantBase = Math.floor(total / nombrePersonnes);
      const reste = total - montantBase * nombrePersonnes;
      const parts: SplitPart[] = [];

      for (let i = 0; i < nombrePersonnes; i++) {
        // Ajouter le reste a la premiere part pour eviter les arrondis
        const montant = i === 0 ? montantBase + reste : montantBase;
        parts.push({
          id: generatePartId(),
          montant,
          paye: false,
          nom: `Personne ${i + 1}`,
        });
      }

      set({ mode, parts });
    } else if (mode === "custom") {
      // En mode custom, on garde les parts existantes ou on en cree 2
      const existingParts = get().parts;
      if (existingParts.length < 2) {
        set({
          mode,
          parts: [{ id: generatePartId(), montant: total, paye: false, nom: "Part 1" }],
        });
      } else {
        set({ mode });
      }
    } else if (mode === "items") {
      // En mode items, creer des parts vides
      const parts: SplitPart[] = [
        { id: generatePartId(), montant: 0, paye: false, items: [], nom: "Personne 1" },
        { id: generatePartId(), montant: 0, paye: false, items: [], nom: "Personne 2" },
      ];
      set({ mode, parts });
    }
  },

  setNombrePersonnes: (nombre) => {
    const { total, mode } = get();

    if (nombre < 2) nombre = 2;
    if (nombre > 20) nombre = 20;

    if (mode === "equal") {
      const montantBase = Math.floor(total / nombre);
      const reste = total - montantBase * nombre;
      const parts: SplitPart[] = [];

      for (let i = 0; i < nombre; i++) {
        const montant = i === 0 ? montantBase + reste : montantBase;
        parts.push({
          id: generatePartId(),
          montant,
          paye: false,
          nom: `Personne ${i + 1}`,
        });
      }

      set({ nombrePersonnes: nombre, parts });
    } else if (mode === "items") {
      // Ajouter ou retirer des parts
      const existingParts = get().parts;
      const newParts: SplitPart[] = [];

      for (let i = 0; i < nombre; i++) {
        if (i < existingParts.length) {
          newParts.push(existingParts[i]);
        } else {
          newParts.push({
            id: generatePartId(),
            montant: 0,
            paye: false,
            items: [],
            nom: `Personne ${i + 1}`,
          });
        }
      }

      set({ nombrePersonnes: nombre, parts: newParts });
    } else {
      set({ nombrePersonnes: nombre });
    }
  },

  addPart: (montant) => {
    const { parts, total } = get();
    const totalExistant = parts.reduce((acc, p) => acc + p.montant, 0);
    const montantDefaut = Math.max(0, total - totalExistant);

    const newPart: SplitPart = {
      id: generatePartId(),
      montant: montant ?? montantDefaut,
      paye: false,
      nom: `Part ${parts.length + 1}`,
    };

    set({ parts: [...parts, newPart] });
  },

  removePart: (partId) => {
    const { parts } = get();
    if (parts.length <= 1) return; // Garder au moins une part

    set({ parts: parts.filter((p) => p.id !== partId) });
  },

  updatePart: (partId, updates) => {
    const { parts } = get();
    set({
      parts: parts.map((p) => (p.id === partId ? { ...p, ...updates } : p)),
    });
  },

  markAsPaid: (partId, modePaiement, reference) => {
    const { parts } = get();
    set({
      parts: parts.map((p) =>
        p.id === partId ? { ...p, paye: true, modePaiement, reference } : p
      ),
    });
  },

  assignItemToPart: (produitId, partId) => {
    const { parts, items } = get();
    const item = items.find((i) => i.produitId === produitId);
    if (!item) return;

    // Retirer l'article de toute autre part
    const updatedParts = parts.map((p) => {
      if (p.id === partId) {
        // Ajouter l'article a cette part
        const currentItems = p.items ?? [];
        if (!currentItems.includes(produitId)) {
          const newItems = [...currentItems, produitId];
          // Recalculer le montant
          const montant = newItems.reduce((acc, id) => {
            const itm = items.find((i) => i.produitId === id);
            return acc + (itm?.total ?? 0);
          }, 0);
          return { ...p, items: newItems, montant };
        }
        return p;
      } else {
        // Retirer l'article de cette part si present
        const currentItems = p.items ?? [];
        if (currentItems.includes(produitId)) {
          const newItems = currentItems.filter((id) => id !== produitId);
          const montant = newItems.reduce((acc, id) => {
            const itm = items.find((i) => i.produitId === id);
            return acc + (itm?.total ?? 0);
          }, 0);
          return { ...p, items: newItems, montant };
        }
        return p;
      }
    });

    set({ parts: updatedParts });
  },

  unassignItem: (produitId) => {
    const { parts, items } = get();

    const updatedParts = parts.map((p) => {
      const currentItems = p.items ?? [];
      if (currentItems.includes(produitId)) {
        const newItems = currentItems.filter((id) => id !== produitId);
        const montant = newItems.reduce((acc, id) => {
          const itm = items.find((i) => i.produitId === id);
          return acc + (itm?.total ?? 0);
        }, 0);
        return { ...p, items: newItems, montant };
      }
      return p;
    });

    set({ parts: updatedParts });
  },

  recalculateEqualParts: () => {
    const { total, nombrePersonnes } = get();
    const montantBase = Math.floor(total / nombrePersonnes);
    const reste = total - montantBase * nombrePersonnes;
    const parts: SplitPart[] = [];

    for (let i = 0; i < nombrePersonnes; i++) {
      const montant = i === 0 ? montantBase + reste : montantBase;
      parts.push({
        id: generatePartId(),
        montant,
        paye: false,
        nom: `Personne ${i + 1}`,
      });
    }

    set({ parts });
  },

  reset: () => {
    set(initialState);
  },
}));
