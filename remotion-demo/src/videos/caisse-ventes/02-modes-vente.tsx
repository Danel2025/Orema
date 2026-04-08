import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 10 : Modes de vente
 * Sur place, à emporter, livraison : tous les scénarios.
 */
export const modesVenteConfig: DocVideoConfig = {
  id: "doc-caisse-modes-vente",
  category: "Caisse & Ventes",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M2 7V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/><rect x="2" y="7" width="20" height="10" rx="1"/><path d="M12 12h.01"/><path d="M7 12h.01"/><path d="M17 12h.01"/></svg>',
  title: "Modes de vente",
  subtitle: "Sur place, à emporter, livraison : tous les scénarios",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Repérer le sélecteur de mode de vente
      screenshot: "screenshots/caisse-02-step1.png",
      cursorPath: [
        { x: 50, y: 3 },
        { x: 40, y: 3 },
      ],
      clickAt: { x: 40, y: 3 },
      zoomTo: { x: 40, y: 3, scale: 2.0 },
      annotation: {
        text: "Sélecteur de mode de vente",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 2 : Mode Sur place
      screenshot: "screenshots/caisse-02-step2.png",
      cursorPath: [
        { x: 40, y: 8 },
        { x: 40, y: 12 },
      ],
      clickAt: { x: 40, y: 12 },
      annotation: {
        text: "Mode Sur place avec table",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Mode À emporter
      screenshot: "screenshots/caisse-02-step3.png",
      cursorPath: [
        { x: 40, y: 12 },
        { x: 40, y: 18 },
      ],
      clickAt: { x: 40, y: 18 },
      annotation: {
        text: "Mode À emporter rapide",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Mode Livraison
      screenshot: "screenshots/caisse-02-step4.png",
      cursorPath: [
        { x: 40, y: 18 },
        { x: 40, y: 24 },
      ],
      clickAt: { x: 40, y: 24 },
      annotation: {
        text: "Mode Livraison avec adresse",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Formulaire livraison client
      screenshot: "screenshots/caisse-02-step5.png",
      cursorPath: [
        { x: 50, y: 37 },
        { x: 50, y: 56 },
      ],
      zoomTo: { x: 50, y: 46, scale: 1.5 },
      annotation: {
        text: "Formulaire livraison client",
        position: "top",
      },
      duration: FPS * 5,
    },
  ],
};
