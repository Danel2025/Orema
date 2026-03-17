"use client";

/**
 * CaisseProductGrid - Grille de produits pour la caisse
 * Avec support des supplements
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Package, Search, Plus as PlusIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@radix-ui/themes";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { SupplementSelector } from "./supplement-selector";

interface Supplement {
  id: string;
  nom: string;
  prix: number;
}

interface Produit {
  id: string;
  nom: string;
  prixVente: number | { toNumber?(): number };
  tauxTva: string;
  image?: string | null;
  gererStock: boolean;
  stockActuel?: number | null;
  categorieId: string;
  supplements?: Supplement[];
}

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
  icone?: string | null;
}

interface CaisseProductGridProps {
  categories: Categorie[];
  produits: Produit[];
}

// Helper pour convertir Decimal en number
function toNumber(value: number | { toNumber?(): number } | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value);
}

export function CaisseProductGrid({ categories, produits }: CaisseProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [supplementDialogOpen, setSupplementDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);

  // Navigation des catégories
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const addItemWithSupplements = useCartStore((state) => state.addItemWithSupplements);

  // Vérifier si on peut scroller
  const checkScroll = useCallback(() => {
    const el = categoriesRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, categories]);

  const scrollCategories = (direction: "left" | "right") => {
    const el = categoriesRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Filtrer les produits
  const filteredProduits = produits.filter((prod) => {
    const matchesCategory = !selectedCategory || prod.categorieId === selectedCategory;
    const matchesSearch = !searchQuery || prod.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Ajouter au panier (ouvre le dialog si supplements disponibles)
  const handleAddProduct = useCallback((prod: Produit) => {
    const prix = toNumber(prod.prixVente);
    const cat = categories.find((c) => c.id === prod.categorieId);

    // Si le produit a des supplements, ouvrir le selecteur
    if (prod.supplements && prod.supplements.length > 0) {
      setSelectedProduct(prod);
      setSupplementDialogOpen(true);
    } else {
      // Sinon, ajouter directement
      addItem({
        produitId: prod.id,
        prixUnitaire: prix,
        categorieNom: cat?.nom,
        produit: {
          nom: prod.nom,
          tauxTva: prod.tauxTva,
        },
      });
    }
  }, [addItem, categories]);

  // Confirmer l'ajout avec supplements
  const handleConfirmSupplements = useCallback((supplements: { id?: string; nom: string; prix: number }[]) => {
    if (!selectedProduct) return;

    const prix = toNumber(selectedProduct.prixVente);
    const cat = categories.find((c) => c.id === selectedProduct.categorieId);

    if (supplements.length > 0) {
      addItemWithSupplements(
        {
          produitId: selectedProduct.id,
          prixUnitaire: prix,
          categorieNom: cat?.nom,
          produit: {
            nom: selectedProduct.nom,
            tauxTva: selectedProduct.tauxTva,
          },
        },
        supplements
      );
    } else {
      addItem({
        produitId: selectedProduct.id,
        prixUnitaire: prix,
        categorieNom: cat?.nom,
        produit: {
          nom: selectedProduct.nom,
          tauxTva: selectedProduct.tauxTva,
        },
      });
    }

    setSelectedProduct(null);
  }, [selectedProduct, addItem, addItemWithSupplements, categories]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Barre de recherche */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--gray-a6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "var(--gray-a3)",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <Search size={18} style={{ color: "var(--gray-9)" }} />
          <input
            type="text"
            placeholder="Rechercher un produit... (F2)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 14,
              color: "var(--gray-12)",
            }}
          />
        </div>
      </div>

      {/* Onglets catégories */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--gray-a6)",
          position: "relative",
        }}
      >
        {/* Bouton gauche */}
        {canScrollLeft ? <button
            onClick={() => scrollCategories("left")}
            style={{
              position: "absolute",
              left: 8,
              zIndex: 2,
              width: 32,
              height: 32,
              borderRadius: 6,
              border: "none",
              outline: "none",
              background: "var(--color-background)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={18} style={{ color: "var(--gray-11)" }} />
          </button> : null}

        {/* Container des catégories */}
        <div
          ref={categoriesRef}
          onScroll={checkScroll}
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            overflowX: "auto",
            flex: 1,
            scrollbarWidth: "none", /* Firefox */
            msOverflowStyle: "none", /* IE/Edge */
          }}
          className="hide-scrollbar"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                backgroundColor: selectedCategory === cat.id ? cat.couleur : "var(--gray-a3)",
                color: selectedCategory === cat.id ? "white" : "var(--gray-12)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {cat.nom}
            </button>
          ))}
        </div>

        {/* Bouton droite */}
        {canScrollRight ? <button
            onClick={() => scrollCategories("right")}
            style={{
              position: "absolute",
              right: 8,
              zIndex: 2,
              width: 32,
              height: 32,
              borderRadius: 6,
              border: "none",
              outline: "none",
              background: "var(--color-background)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={18} style={{ color: "var(--gray-11)" }} />
          </button> : null}
      </div>

      {/* Grille de produits */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
        }}
      >
        {filteredProduits.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--gray-10)",
            }}
          >
            <Package size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {filteredProduits.map((prod) => {
              const prix = toNumber(prod.prixVente);
              const cat = categories.find((c) => c.id === prod.categorieId);
              const rupture = prod.gererStock && prod.stockActuel != null && prod.stockActuel <= 0;

              return (
                <button
                  key={prod.id}
                  onClick={() => !rupture && handleAddProduct(prod)}
                  disabled={rupture}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid var(--gray-a6)",
                    backgroundColor: "var(--color-panel-solid)",
                    cursor: rupture ? "not-allowed" : "pointer",
                    opacity: rupture ? 0.5 : 1,
                    transition: "all 0.1s ease",
                    minHeight: 120,
                  }}
                >
                  {/* Image ou placeholder */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: cat?.couleur ? cat.couleur + "20" : "var(--gray-a3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.nom}
                        style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                      />
                    ) : (
                      <Package size={24} style={{ color: cat?.couleur || "var(--gray-9)" }} />
                    )}
                  </div>

                  {/* Nom */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--gray-12)",
                      textAlign: "center",
                      lineHeight: 1.3,
                      marginBottom: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {prod.nom}
                  </span>

                  {/* Prix */}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--accent-11)",
                      fontFamily: "var(--font-google-sans-code), ui-monospace, monospace",
                    }}
                  >
                    {formatCurrency(prix)}
                  </span>

                  {/* Badge rupture */}
                  {rupture ? <span
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        backgroundColor: "var(--red-a3)",
                        color: "var(--red-11)",
                      }}
                    >
                      Rupture
                    </span> : null}

                  {/* Badge supplements disponibles */}
                  {!rupture && prod.supplements && prod.supplements.length > 0 ? <Badge
                      color="blue"
                      variant="soft"
                      size="1"
                      style={{ marginTop: 4 }}
                    >
                      <PlusIcon size={10} style={{ marginRight: 2 }} />
                      Options
                    </Badge> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de selection des supplements */}
      {selectedProduct ? <SupplementSelector
          open={supplementDialogOpen}
          onOpenChange={setSupplementDialogOpen}
          produit={{
            id: selectedProduct.id,
            nom: selectedProduct.nom,
            prixVente: toNumber(selectedProduct.prixVente),
            tauxTva: selectedProduct.tauxTva,
            supplements: selectedProduct.supplements || [],
          }}
          onConfirm={handleConfirmSupplements}
        /> : null}
    </div>
  );
}
