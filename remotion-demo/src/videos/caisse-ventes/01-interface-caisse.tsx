import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 9 : Interface de caisse
 * Vue globale de la caisse : catégories, produits, panier, encaissement.
 */
export const interfaceCaisseConfig: DocVideoConfig = {
  id: "doc-caisse-interface",
  category: "Caisse & Ventes",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M2 7V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/><rect x="2" y="7" width="20" height="10" rx="1"/><path d="M12 12h.01"/><path d="M7 12h.01"/><path d="M17 12h.01"/></svg>',
  title: "Interface de caisse",
  subtitle: "Maîtrisez l'interface de vente pour des transactions rapides",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Vue d'ensemble de l'interface caisse
      screenshot: "screenshots/caisse-01-step1.png",
      cursorPath: [
        { x: 50, y: 18 },
        { x: 15, y: 50 },
        { x: 50, y: 50 },
        { x: 85, y: 50 },
      ],
      annotation: {
        text: "Vue d'ensemble de la caisse",
        position: "top",
      },
      duration: FPS * 5,
    },
    {
      // Step 2 : Sélectionner une catégorie
      screenshot: "screenshots/caisse-01-step2.png",
      cursorPath: [
        { x: 15, y: 9 },
        { x: 30, y: 9 },
      ],
      clickAt: { x: 30, y: 9 },
      annotation: {
        text: "Sélectionnez une catégorie",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Cliquer sur un produit
      screenshot: "screenshots/caisse-01-step3.png",
      cursorPath: [
        { x: 25, y: 30 },
        { x: 35, y: 40 },
      ],
      clickAt: { x: 35, y: 40 },
      annotation: {
        text: "Cliquez sur un produit",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Panier avec total en FCFA
      screenshot: "screenshots/caisse-01-step4.png",
      cursorPath: [
        { x: 75, y: 28 },
        { x: 85, y: 50 },
      ],
      zoomTo: { x: 85, y: 50, scale: 1.8 },
      annotation: {
        text: "Panier avec total en FCFA",
        position: "left",
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Bouton Encaisser
      screenshot: "screenshots/caisse-01-step5.png",
      cursorPath: [
        { x: 85, y: 80 },
        { x: 87, y: 93 },
      ],
      clickAt: { x: 87, y: 93 },
      zoomTo: { x: 87, y: 93, scale: 1.6 },
      annotation: {
        text: "Bouton Encaisser",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
