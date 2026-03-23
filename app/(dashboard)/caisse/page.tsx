"use client";

/**
 * Page Caisse - Point de vente avec gestion de session
 * Integre le module Session Caisse pour bloquer les ventes sans session ouverte
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ShoppingCart, ForkKnife, Truck, Bag, MagnifyingGlass, Clock } from "@phosphor-icons/react";
import { useBarcodeScan } from "@/lib/hooks/use-barcode-scan";
import {
  CaisseProductGrid,
  CaisseCart,
  CaissePayment,
  ModePanel,
  CaisseFloorPlan,
  ProductSearchModal,
  QuantityInput,
  PendingOrdersModal,
  OrderDetailsModal,
} from "@/components/caisse";
import { SessionStatus } from "@/components/caisse/session-status";
import { OpenSessionDialog } from "@/components/caisse/open-session-dialog";
import { CloseSessionDialog } from "@/components/caisse/close-session-dialog";
import { SessionRequired } from "@/components/caisse/session-required";
import { loadCaissePage, getCaisseStats } from "@/actions/caisse";
import {
  createVente,
  createVenteEnAttente,
  createVenteEnCompte,
  getVentesEnAttente,
  getVenteEnAttenteByTable,
  addToVenteEnAttente,
  annulerVenteEnAttente,
  payerVenteEnAttente,
} from "@/actions/ventes";
import { useCartStore } from "@/stores/cart-store";
import { useAutoPrint } from "@/lib/print/hooks";
import { calculerTVA } from "@/lib/utils";
import type { CartItem } from "@/types";
import type { SessionActive } from "@/actions/sessions";

type TypeVente = "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";

const venteTypes: { id: TypeVente; label: string; icon: React.ReactNode }[] = [
  { id: "DIRECT", label: "Vente directe", icon: <ShoppingCart size={18} /> },
  { id: "TABLE", label: "Service a table", icon: <ForkKnife size={18} /> },
  { id: "LIVRAISON", label: "Livraison", icon: <Truck size={18} /> },
  { id: "EMPORTER", label: "A emporter", icon: <Bag size={18} /> },
];

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
  icone: string | null;
}

interface Produit {
  id: string;
  nom: string;
  prixVente: number;
  tauxTva: string;
  image: string | null;
  gererStock: boolean;
  stockActuel: number | null;
  categorieId: string;
  actif: boolean;
  disponibleDirect: boolean;
  disponibleTable: boolean;
  disponibleLivraison: boolean;
  disponibleEmporter: boolean;
  codeBarre?: string | null;
  reference?: string | null;
  supplements?: {
    id: string;
    nom: string;
    prix: number;
  }[];
}

interface Stats {
  totalVentes: number;
  chiffreAffaires: number;
  articlesVendus: number;
  panierMoyen: number;
}

interface Etablissement {
  id: string;
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  nif?: string | null;
  rccm?: string | null;
  impressionAutoTicket?: boolean;
}

export default function CaissePage() {
  const [session, setSession] = useState<SessionActive | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // États pour les commandes en attente
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [ventesEnAttente, setVentesEnAttente] = useState<
    Awaited<ReturnType<typeof getVentesEnAttente>>
  >([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [venteEnAttenteTable, setVenteEnAttenteTable] = useState<Awaited<
    ReturnType<typeof getVenteEnAttenteByTable>
  > | null>(null);
  // Vente en attente sélectionnée pour paiement
  const [venteAPayer, setVenteAPayer] = useState<
    Awaited<ReturnType<typeof getVentesEnAttente>>[0] | null
  >(null);
  // Vente sélectionnée pour voir les détails
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<
    Awaited<ReturnType<typeof getVentesEnAttente>>[0] | null
  >(null);

  const typeVente = useCartStore((s) => s.typeVente);
  const setTypeVente = useCartStore((s) => s.setTypeVente);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const tableId = useCartStore((s) => s.tableId);
  const setStoreVenteEnAttente = useCartStore((s) => s.setVenteEnAttenteTable);

  // Ref pour tracker les lineIds de la commande existante (vs nouveaux articles)
  const existingLineIdsRef = useRef<Set<string>>(new Set());
  // Refs pour accéder à produits/categories dans le useEffect sans les ajouter comme dépendances
  const produitsRef = useRef(produits);
  produitsRef.current = produits;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  // Scanner code-barres USB : recherche et ajout automatique au panier
  useBarcodeScan({
    onScan: (barcode) => {
      if (!session) {
        toast.error("Ouvrez une session caisse avant de scanner");
        return;
      }

      const produit = produits.find((p) => p.codeBarre === barcode);

      if (produit) {
        if (!produit.actif) {
          toast.error(`${produit.nom} est inactif`);
          return;
        }

        const cat = categories.find((c) => c.id === produit.categorieId);

        addItem({
          produitId: produit.id,
          prixUnitaire: produit.prixVente,
          categorieNom: cat?.nom,
          produit: {
            nom: produit.nom,
            tauxTva: produit.tauxTva,
          },
        });
        toast.success(`${produit.nom} ajouté au panier`);
      } else {
        toast.error(`Produit non trouvé pour le code-barres : ${barcode}`);
      }
    },
    enabled: !!session && !showPayment && !isProcessing,
  });

  // Charger toutes les données de la caisse en une seule requête
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsLoadingSession(true);

      const data = await loadCaissePage();

      setCategories(data.categories as Categorie[]);
      setProduits(data.produits as Produit[]);
      setStats({
        totalVentes: data.stats.totalVentes,
        chiffreAffaires: data.stats.chiffreAffaires,
        articlesVendus: 0, // Calculé séparément si nécessaire
        panierMoyen:
          data.stats.totalVentes > 0
            ? Math.round(data.stats.chiffreAffaires / data.stats.totalVentes)
            : 0,
      });
      setPendingOrdersCount(data.stats.pendingCount);
      setSession(data.session as SessionActive | null);
      setEtablissement(data.etablissement as Etablissement);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
      setIsLoadingSession(false);
    }
  }, []);

  // Rafraîchir uniquement les stats (après une vente)
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await getCaisseStats();
      setStats({
        totalVentes: statsData.totalVentes,
        chiffreAffaires: statsData.chiffreAffaires,
        articlesVendus: 0,
        panierMoyen:
          statsData.totalVentes > 0
            ? Math.round(statsData.chiffreAffaires / statsData.totalVentes)
            : 0,
      });
      setPendingOrdersCount(statsData.pendingCount);
    } catch (error) {
      console.error("Erreur refresh stats:", error);
    }
  }, []);

  // Charger les commandes en attente
  const loadPendingOrders = useCallback(async () => {
    try {
      const ventes = await getVentesEnAttente();
      setVentesEnAttente(ventes);
      setPendingOrdersCount(ventes.length);
    } catch (error) {
      console.error("Erreur chargement commandes en attente:", error);
    }
  }, []);

  /**
   * Hook useAutoPrint pour l'impression automatique apres paiement
   * Route vers ticket client + bons cuisine + bons bar via /api/print/auto-route
   */
  const { autoPrint: autoPrintFull } = useAutoPrint({
    printTicket: true,
    printKitchen: true,
    printBar: true,
    onSuccess: () => {
      toast.success("Impression envoyee");
    },
    onError: (errors) => {
      for (const err of errors) {
        toast.error(`Impression: ${err}`);
      }
    },
  });

  /**
   * Hook useAutoPrint pour les bons cuisine/bar uniquement (mise en attente)
   * Pas de ticket client car la commande n'est pas encore payee
   */
  const { autoPrint: autoPrintKitchenOnly } = useAutoPrint({
    printTicket: false,
    printKitchen: true,
    printBar: true,
    onError: (errors) => {
      for (const err of errors) {
        console.warn("Impression bon:", err);
      }
    },
  });

  /**
   * Impression des bons cuisine/bar pour une commande en attente
   */
  const printKitchenBons = useCallback(
    async (venteId: string) => {
      try {
        await autoPrintKitchenOnly(venteId);
      } catch (error) {
        console.error("Erreur impression bons:", error);
      }
    },
    [autoPrintKitchenOnly]
  );

  /**
   * Impression automatique apres paiement
   * Utilise le routage automatique via /api/print/auto-route
   * Respecte le reglage impressionAutoTicket de l'etablissement
   */
  const printAfterPayment = useCallback(
    async (venteId: string) => {
      // Verifier si l'impression automatique est activee
      const autoEnabled = etablissement?.impressionAutoTicket !== false;
      if (!autoEnabled) {
        return; // L'impression automatique est desactivee dans les parametres
      }

      try {
        const result = await autoPrintFull(venteId);
        if (result.partialSuccess) {
          toast.info("Impression partielle : certains documents n'ont pas pu etre imprimes");
        }
      } catch (error) {
        console.error("Erreur impression apres paiement:", error);
        // Ne pas bloquer la vente si l'impression echoue
      }
    },
    [autoPrintFull, etablissement?.impressionAutoTicket]
  );

  // Vérifier si la table sélectionnée a une commande en attente + hydrater le panier
  useEffect(() => {
    let cancelled = false;

    const checkTablePendingOrder = async () => {
      if (typeVente === "TABLE" && tableId) {
        const vente = await getVenteEnAttenteByTable(tableId);
        if (cancelled) return;
        setVenteEnAttenteTable(vente);
        if (vente) {
          setStoreVenteEnAttente({
            id: vente.id,
            numeroTicket: vente.numeroTicket,
            totalFinal: Number(vente.totalFinal),
            lignesCount: vente.lignes.length,
          });

          // Hydrater le panier avec les articles existants de la commande
          const lineIds = new Set<string>();
          const cartItems: CartItem[] = vente.lignes.map((ligne: {
            id: unknown;
            quantite: unknown;
            prixUnitaire: number;
            produitId: unknown;
            produit: { id: string; nom: string } | null;
            notes: unknown;
            supplements: Array<{ id: string; nom: string; prix: number }> | null;
          }) => {
            const prod = produitsRef.current.find((p) => p.id === ligne.produitId);
            const lineId = String(ligne.id);
            lineIds.add(lineId);

            const totalSupplements = (ligne.supplements || []).reduce(
              (acc: number, s: { prix: number }) => acc + s.prix,
              0
            );
            const prixAvecSupplements = ligne.prixUnitaire + totalSupplements;
            const quantite = Number(ligne.quantite);
            const sousTotal = prixAvecSupplements * quantite;
            const tauxTva = prod?.tauxTva || "STANDARD";
            const montantTva = calculerTVA(sousTotal, tauxTva);

            return {
              lineId,
              produitId: ligne.produitId as string,
              produit: {
                nom: (ligne.produit as { nom: string } | null)?.nom || "Produit",
                tauxTva,
              },
              categorieNom: prod
                ? categoriesRef.current.find((c) => c.id === prod.categorieId)?.nom
                : undefined,
              quantite,
              prixUnitaire: ligne.prixUnitaire,
              sousTotal,
              montantTva,
              total: sousTotal + montantTva,
              notes: ligne.notes as string | undefined,
              supplements:
                ligne.supplements && ligne.supplements.length > 0
                  ? ligne.supplements.map((s: { nom: string; prix: number }) => ({
                      nom: s.nom,
                      prix: s.prix,
                    }))
                  : undefined,
              totalSupplements: totalSupplements > 0 ? totalSupplements : undefined,
            };
          });

          existingLineIdsRef.current = lineIds;
          useCartStore.setState({ items: cartItems });
          useCartStore.getState().calculateTotals();
        } else {
          setStoreVenteEnAttente(null);
          existingLineIdsRef.current = new Set();
        }
      } else {
        setVenteEnAttenteTable(null);
        setStoreVenteEnAttente(null);
        existingLineIdsRef.current = new Set();
      }
    };
    checkTablePendingOrder();

    return () => {
      cancelled = true;
    };
  }, [typeVente, tableId, setStoreVenteEnAttente]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Rafraichir après ouverture/fermeture de session
  const handleSessionChange = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler pour mise en attente
  const handleMettreEnAttente = useCallback(async () => {
    try {
      if (!session) {
        toast.error("Aucune session de caisse ouverte");
        return;
      }

      const cartState = useCartStore.getState();

      if (cartState.typeVente === "LIVRAISON" && !cartState.adresseLivraison) {
        toast.error("L'adresse de livraison est requise");
        return;
      }

      setIsProcessing(true);
      const result = await createVenteEnAttente({
        typeVente: cartState.typeVente as "TABLE" | "LIVRAISON" | "EMPORTER",
        sessionCaisseId: session.id,
        lignes: cartState.items.map((item) => ({
          produitId: item.produitId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          tauxTva: item.produit.tauxTva,
          notes: item.notes,
          supplements: item.supplements,
          totalSupplements: item.totalSupplements,
        })),
        remise: cartState.remise,
        tableId: cartState.tableId,
        clientId: cartState.clientId,
        adresseLivraison: cartState.adresseLivraison,
        telephoneLivraison: cartState.telephoneLivraison,
        notesLivraison: cartState.notesLivraison,
      });

      if (result.success) {
        toast.success(`Commande #${result.data?.numeroTicket} mise en attente`);
        const currentMode = cartState.typeVente;
        clearCart();
        setTypeVente(currentMode);
        refreshStats();

        // Imprimer les bons cuisine/bar
        if (result.data?.id) {
          printKitchenBons(result.data.id);
        }
      } else {
        toast.error(result.error || "Erreur lors de la mise en attente");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsProcessing(false);
    }
  }, [session, clearCart, setTypeVente, refreshStats, printKitchenBons]);

  // Handler pour ajouter à une commande existante
  const handleAjouterALaCommande = useCallback(async () => {
    try {
      if (!venteEnAttenteTable) {
        toast.error("Aucune commande en attente sur cette table");
        return;
      }

      const cartState = useCartStore.getState();

      // Ne garder que les NOUVEAUX articles (pas ceux déjà dans la commande)
      const newItems = cartState.items.filter(
        (item) => !existingLineIdsRef.current.has(item.lineId)
      );

      if (newItems.length === 0) {
        toast.info("Aucun nouvel article à ajouter");
        return;
      }

      setIsProcessing(true);
      const result = await addToVenteEnAttente(
        venteEnAttenteTable.id,
        newItems.map((item) => ({
          produitId: item.produitId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          tauxTva: item.produit.tauxTva,
          notes: item.notes,
          supplements: item.supplements,
          totalSupplements: item.totalSupplements,
        }))
      );

      if (result.success) {
        toast.success("Articles ajoutés à la commande");
        const currentMode = useCartStore.getState().typeVente;
        clearCart();
        setTypeVente(currentMode);
        refreshStats();

        // Imprimer les bons cuisine/bar pour les nouveaux articles
        printKitchenBons(venteEnAttenteTable.id);
      } else {
        toast.error(result.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsProcessing(false);
    }
  }, [venteEnAttenteTable, clearCart, setTypeVente, refreshStats, printKitchenBons]);

  // Handler pour mise en compte
  const handleMettreEnCompte = useCallback(async () => {
    try {
      if (!session) {
        toast.error("Aucune session de caisse ouverte");
        return;
      }

      const cartState = useCartStore.getState();

      if (!cartState.clientId) {
        toast.error("Veuillez sélectionner un client");
        return;
      }

      setIsProcessing(true);
      const result = await createVenteEnCompte({
        typeVente: cartState.typeVente,
        sessionCaisseId: session.id,
        clientId: cartState.clientId,
        lignes: cartState.items.map((item) => ({
          produitId: item.produitId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          tauxTva: item.produit.tauxTva,
          notes: item.notes,
          supplements: item.supplements,
          totalSupplements: item.totalSupplements,
        })),
        remise: cartState.remise,
        tableId: cartState.tableId,
        adresseLivraison: cartState.adresseLivraison,
        notesLivraison: cartState.notesLivraison,
      });

      if (result.success) {
        toast.success(`Vente #${result.data?.numeroTicket} mise en compte`);
        const currentMode = cartState.typeVente;
        clearCart();
        setTypeVente(currentMode);
        refreshStats();
      } else {
        toast.error(result.error || "Erreur lors de la mise en compte");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsProcessing(false);
    }
  }, [session, clearCart, setTypeVente, refreshStats]);

  // Handler pour payer une commande en attente
  const handlePayerVenteEnAttente = useCallback((vente: (typeof ventesEnAttente)[0]) => {
    // Fermer le modal des commandes en attente
    setShowPendingOrders(false);
    // Stocker la vente à payer
    setVenteAPayer(vente);
    // Ouvrir le modal de paiement
    setShowPayment(true);
  }, []);

  // Handler pour annuler une commande en attente
  const handleAnnulerVenteEnAttente = useCallback(async (venteId: string) => {
    const result = await annulerVenteEnAttente(venteId);
    if (result.success) {
      toast.success("Commande annulée");
      loadPendingOrders();
      refreshStats();
    } else {
      toast.error(result.error || "Erreur lors de l'annulation");
    }
  }, [loadPendingOrders, refreshStats]);

  // Filtrer les produits selon le mode de vente
  const filteredProduits = useMemo(() => produits.filter((prod) => {
    if (!prod.actif) return false;
    switch (typeVente) {
      case "DIRECT":
        return prod.disponibleDirect;
      case "TABLE":
        return prod.disponibleTable;
      case "LIVRAISON":
        return prod.disponibleLivraison;
      case "EMPORTER":
        return prod.disponibleEmporter;
      default:
        return true;
    }
  }), [produits, typeVente]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Nouvelle vente
      if (e.key === "F1") {
        e.preventDefault();
        clearCart();
        toast.info("Nouvelle vente");
      }

      // F2 - Recherche produit
      if (e.key === "F2") {
        e.preventDefault();
        setShowSearch(true);
      }

      // F5 - Encaisser (uniquement si session ouverte)
      if (e.key === "F5" && items.length > 0 && session) {
        e.preventDefault();
        setShowPayment(true);
      }

      // F6 - Mettre en attente
      if (e.key === "F6" && items.length > 0 && session) {
        e.preventDefault();
        const cartState = useCartStore.getState();
        if (cartState.typeVente !== "DIRECT") {
          if (venteEnAttenteTable) {
            handleAjouterALaCommande();
          } else {
            handleMettreEnAttente();
          }
        }
      }

      // F7 - Ouvrir les commandes en attente
      if (e.key === "F7") {
        e.preventDefault();
        loadPendingOrders();
        setShowPendingOrders(true);
      }

      // F10 - Annuler
      if (e.key === "F10") {
        e.preventDefault();
        clearCart();
        toast.info("Vente annulee");
      }

      // Echap - Fermer modal
      if (e.key === "Escape") {
        if (showPayment) {
          setShowPayment(false);
        } else if (showSearch) {
          setShowSearch(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length, showPayment, showSearch, clearCart, session, handleMettreEnAttente, handleAjouterALaCommande, venteEnAttenteTable, loadPendingOrders]);

  // Traitement du paiement
  const handlePaymentComplete = useCallback(async (paymentData: {
    modePaiement: string;
    montantRecu: number;
    montantRendu: number;
    reference?: string;
    paiements?: { mode: string; montant: number; reference?: string; telephone?: string }[];
  }) => {
    // Verifier que la session est ouverte
    if (!session) {
      toast.error("Aucune session de caisse ouverte");
      return;
    }

    // Cas 1: Paiement d'une commande en attente
    if (venteAPayer) {
      const result = await payerVenteEnAttente({
        venteId: venteAPayer.id,
        modePaiement: paymentData.modePaiement as
          | "ESPECES"
          | "CARTE_BANCAIRE"
          | "AIRTEL_MONEY"
          | "MOOV_MONEY"
          | "CHEQUE"
          | "VIREMENT"
          | "COMPTE_CLIENT"
          | "MIXTE",
        montantRecu: paymentData.montantRecu,
        montantRendu: paymentData.montantRendu,
        reference: paymentData.reference,
        paiements: paymentData.paiements?.map((p) => ({
          mode: p.mode as
            | "ESPECES"
            | "CARTE_BANCAIRE"
            | "AIRTEL_MONEY"
            | "MOOV_MONEY"
            | "CHEQUE"
            | "VIREMENT"
            | "COMPTE_CLIENT",
          montant: p.montant,
          reference: p.reference,
          telephone: p.telephone,
        })),
        sessionCaisseId: session.id,
      });

      if (result.success) {
        toast.success(`Vente #${result.data?.numeroTicket} payée`);
        setVenteAPayer(null);
        setShowPayment(false);
        refreshStats();
        loadPendingOrders();

        // Impression automatique du ticket et des bons
        if (result.data?.id) {
          printAfterPayment(result.data.id);
        }
      } else {
        toast.error(result.error || "Erreur lors du paiement");
      }
      return;
    }

    // Cas 2: Nouvelle vente depuis le panier
    const cartState = useCartStore.getState();

    // Validation pour le mode livraison
    if (cartState.typeVente === "LIVRAISON" && !cartState.adresseLivraison) {
      toast.error("L'adresse de livraison est requise");
      return;
    }

    const result = await createVente({
      typeVente: cartState.typeVente,
      sessionCaisseId: session.id,
      lignes: cartState.items.map((item) => ({
        produitId: item.produitId,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
        tauxTva: item.produit.tauxTva,
        notes: item.notes,
        remise: item.remiseLigne,
        supplements: item.supplements,
        totalSupplements: item.totalSupplements,
      })),
      modePaiement: paymentData.modePaiement as
        | "ESPECES"
        | "CARTE_BANCAIRE"
        | "AIRTEL_MONEY"
        | "MOOV_MONEY"
        | "CHEQUE"
        | "VIREMENT"
        | "COMPTE_CLIENT"
        | "MIXTE",
      montantRecu: paymentData.montantRecu,
      montantRendu: paymentData.montantRendu,
      reference: paymentData.reference,
      paiements: paymentData.paiements?.map((p) => ({
        mode: p.mode as
          | "ESPECES"
          | "CARTE_BANCAIRE"
          | "AIRTEL_MONEY"
          | "MOOV_MONEY"
          | "CHEQUE"
          | "VIREMENT"
          | "COMPTE_CLIENT",
        montant: p.montant,
        reference: p.reference,
        telephone: p.telephone,
      })),
      remise: cartState.remise,
      tableId: cartState.tableId,
      clientId: cartState.clientId,
      adresseLivraison: cartState.adresseLivraison,
      notesLivraison: cartState.notesLivraison,
    });

    if (result.success) {
      toast.success(`Vente #${result.data?.numeroTicket} enregistrée`);
      const currentMode = cartState.typeVente;
      clearCart();
      setTypeVente(currentMode);
      setShowPayment(false);
      await refreshStats();

      // Impression automatique du ticket et des bons
      if (result.data?.id) {
        printAfterPayment(result.data.id);
      }
    } else {
      toast.error(result.error || "Erreur lors de la vente");
    }
  }, [session, venteAPayer, clearCart, setTypeVente, refreshStats, loadPendingOrders, printAfterPayment]);

  // Loading state
  if (isLoadingSession) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--gray-11)",
        }}
      >
        Chargement de la session...
      </div>
    );
  }

  return (
    <SessionRequired onSessionChange={setSession}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 64px)",
          margin: "-24px -32px",
        }}
      >
        {/* Barre superieure - Design epure */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "8px 16px",
            backgroundColor: "var(--color-panel-solid)",
            borderBottom: "1px solid var(--gray-a5)",
          }}
        >
          {/* Mode de vente - Tabs compacts */}
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--gray-a3)",
              borderRadius: 8,
              padding: 3,
            }}
          >
            {venteTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setTypeVente(type.id)}
                title={type.label}
                aria-label={type.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor:
                    typeVente === type.id ? "var(--color-panel-solid)" : "transparent",
                  color: typeVente === type.id ? "var(--accent-11)" : "var(--gray-11)",
                  fontSize: 13,
                  fontWeight: typeVente === type.id ? 600 : 400,
                  cursor: "pointer",
                  boxShadow: typeVente === type.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {type.icon}
                <span style={{ display: typeVente === type.id ? "inline" : "none" }}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          {/* Separateur */}
          <div style={{ width: 1, height: 24, backgroundColor: "var(--gray-a5)" }} />

          {/* Session status - Compact */}
          <SessionStatus
            session={session}
            onOpenSession={() => setShowOpenSession(true)}
            onCloseSession={() => setShowCloseSession(true)}
          />

          {/* Espace flexible */}
          <div style={{ flex: 1 }} />

          {/* Actions - Minimal */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <QuantityInput compact />

            <button
              onClick={() => setShowSearch(true)}
              title="Rechercher un produit (F2)"
              aria-label="Rechercher un produit"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 8,
                border: "1px solid var(--gray-a5)",
                backgroundColor: "transparent",
                color: "var(--gray-11)",
                cursor: "pointer",
              }}
            >
              <MagnifyingGlass size={18} />
            </button>

            {/* Bouton commandes en attente */}
            <button
              onClick={() => {
                loadPendingOrders();
                setShowPendingOrders(true);
              }}
              title="Commandes en attente (F7)"
              aria-label="Commandes en attente"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0 12px",
                height: 44,
                borderRadius: 8,
                border: "1px solid var(--purple-a6)",
                backgroundColor: pendingOrdersCount > 0 ? "var(--purple-a3)" : "transparent",
                color: pendingOrdersCount > 0 ? "var(--purple-11)" : "var(--gray-11)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Clock size={16} />
              {pendingOrdersCount > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--purple-9)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 10,
                  }}
                >
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Panneau mode de vente (Table/Livraison/Emporter) */}
        <ModePanel />

        {/* Zone principale */}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "var(--gray-11)",
            }}
          >
            Chargement des produits...
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            {/* Zone principale : plan de salle (mode TABLE) ou grille produits */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              {typeVente === "TABLE" && !tableId ? (
                <CaisseFloorPlan />
              ) : (
                <CaisseProductGrid categories={categories} produits={filteredProduits} />
              )}
            </div>

            {/* Panier */}
            <div style={{ width: 360, flexShrink: 0 }}>
              <CaisseCart
                onProceedToPayment={() => setShowPayment(true)}
                onMettreEnAttente={handleMettreEnAttente}
                onMettreEnCompte={handleMettreEnCompte}
                onAjouterALaCommande={handleAjouterALaCommande}
                hasVenteEnAttenteTable={!!venteEnAttenteTable}
                etablissement={etablissement || undefined}
                serveurNom={
                  session
                    ? `${session.utilisateur.nom}${session.utilisateur.prenom ? " " + session.utilisateur.prenom : ""}`
                    : "Caissier"
                }
              />
            </div>
          </div>
        )}

        {/* Modal de recherche (F2) */}
        <ProductSearchModal
          open={showSearch}
          onOpenChange={setShowSearch}
          produits={produits}
          categories={categories}
        />

        {/* Modal de paiement */}
        {showPayment ? (
          <CaissePayment
            onClose={() => {
              setShowPayment(false);
              setVenteAPayer(null);
            }}
            onPaymentComplete={handlePaymentComplete}
            venteEnAttente={
              venteAPayer
                ? {
                    id: venteAPayer.id,
                    numeroTicket: venteAPayer.numeroTicket,
                    totalFinal: Number(venteAPayer.totalFinal),
                    type: venteAPayer.type,
                    table: venteAPayer.table ? { numero: venteAPayer.table.numero } : null,
                    client: venteAPayer.client
                      ? {
                          nom: venteAPayer.client.nom,
                          prenom: venteAPayer.client.prenom,
                          telephone: venteAPayer.client.telephone,
                        }
                      : null,
                  }
                : null
            }
          />
        ) : null}

        {/* Dialog ouverture session */}
        <OpenSessionDialog
          open={showOpenSession}
          onOpenChange={setShowOpenSession}
          onSuccess={handleSessionChange}
        />

        {/* Dialog cloture session */}
        {session ? (
          <CloseSessionDialog
            open={showCloseSession}
            onOpenChange={setShowCloseSession}
            session={session}
            onSuccess={handleSessionChange}
          />
        ) : null}

        {/* Modal commandes en attente */}
        <PendingOrdersModal
          open={showPendingOrders}
          onOpenChange={setShowPendingOrders}
          ventesEnAttente={
            ventesEnAttente as Parameters<typeof PendingOrdersModal>[0]["ventesEnAttente"]
          }
          onPayer={(vente) => handlePayerVenteEnAttente(vente as (typeof ventesEnAttente)[0])}
          onAnnuler={handleAnnulerVenteEnAttente}
          onVoirDetails={(vente) => {
            // Trouver la vente complète avec tous les détails
            const venteComplete = ventesEnAttente.find((v) => v.id === vente.id);
            if (venteComplete) {
              setSelectedOrderDetails(venteComplete);
            }
          }}
        />

        {/* Modal de détails de commande */}
        <OrderDetailsModal
          open={!!selectedOrderDetails}
          onOpenChange={(open) => {
            if (!open) setSelectedOrderDetails(null);
          }}
          order={
            selectedOrderDetails
              ? {
                  ...selectedOrderDetails,
                  type: selectedOrderDetails.type as "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER",
                  typeRemise: selectedOrderDetails.typeRemise as
                    | "POURCENTAGE"
                    | "MONTANT_FIXE"
                    | null,
                  sousTotal: Number(selectedOrderDetails.sousTotal),
                  totalTva: Number(selectedOrderDetails.totalTva),
                  totalRemise: Number(selectedOrderDetails.totalRemise),
                  totalFinal: Number(selectedOrderDetails.totalFinal),
                  valeurRemise: selectedOrderDetails.valeurRemise
                    ? Number(selectedOrderDetails.valeurRemise)
                    : null,
                  lignes: selectedOrderDetails.lignes.map(
                    (l: {
                      id: unknown;
                      quantite: unknown;
                      prixUnitaire: number;
                      total: number;
                      notes: unknown;
                      produit: unknown;
                      supplements: Array<{ id: unknown; nom: unknown; prix: number }>;
                    }) => ({
                      id: String(l.id),
                      quantite: Number(l.quantite),
                      prixUnitaire: Number(l.prixUnitaire),
                      total: Number(l.total),
                      notes: l.notes as string | null | undefined,
                      produit: l.produit as { id: string; nom: string },
                      supplements: (l.supplements || []).map((s) => ({
                        id: String(s.id),
                        nom: String(s.nom),
                        prix: Number(s.prix),
                      })),
                    })
                  ),
                }
              : null
          }
          onPayer={() => {
            if (selectedOrderDetails) {
              setSelectedOrderDetails(null);
              setShowPendingOrders(false);
              handlePayerVenteEnAttente(selectedOrderDetails);
            }
          }}
        />
      </div>
    </SessionRequired>
  );
}
