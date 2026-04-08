import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 12 : Gestion des remises
 * Appliquer des réductions en % ou montant fixe sur le panier.
 */
export const gestionRemisesConfig: DocVideoConfig = {
  id: "doc-caisse-gestion-remises",
  category: "Caisse & Ventes",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M2 7V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/><rect x="2" y="7" width="20" height="10" rx="1"/><path d="M12 12h.01"/><path d="M7 12h.01"/><path d="M17 12h.01"/></svg>',
  title: "Gestion des remises",
  subtitle: "Appliquez des réductions et promotions facilement",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Sélectionner un produit du panier
      screenshot: "screenshots/caisse-04-step1.png",
      cursorPath: [
        { x: 75, y: 28 },
        { x: 80, y: 35 },
      ],
      clickAt: { x: 80, y: 35 },
      annotation: {
        text: "Sélectionnez un produit du panier",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Cliquer sur Remise
      screenshot: "screenshots/caisse-04-step2.png",
      cursorPath: [
        { x: 80, y: 35 },
        { x: 83, y: 39 },
      ],
      clickAt: { x: 83, y: 39 },
      zoomTo: { x: 82, y: 37, scale: 1.8 },
      annotation: {
        text: "Cliquez sur Remise",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Choisir type de remise (% ou montant fixe)
      screenshot: "screenshots/caisse-04-step3.png",
      cursorPath: [
        { x: 50, y: 37 },
        { x: 50, y: 43 },
      ],
      clickAt: { x: 50, y: 43 },
      annotation: {
        text: "Choisissez % ou montant fixe",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Remise globale sur la commande
      screenshot: "screenshots/caisse-04-step4.png",
      cursorPath: [
        { x: 75, y: 80 },
        { x: 80, y: 83 },
      ],
      clickAt: { x: 80, y: 83 },
      annotation: {
        text: "Remise globale sur la commande",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Total mis à jour avec remise
      screenshot: "screenshots/caisse-04-step5.png",
      cursorPath: [
        { x: 78, y: 70 },
        { x: 85, y: 75 },
      ],
      zoomTo: { x: 85, y: 73, scale: 1.6 },
      annotation: {
        text: "Total mis à jour avec remise",
        position: "left",
      },
      duration: FPS * 4,
    },
  ],
};
