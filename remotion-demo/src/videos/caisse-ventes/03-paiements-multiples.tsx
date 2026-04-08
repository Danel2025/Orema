import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 11 : Paiements multiples
 * Gérez les paiements mixtes : espèces + mobile money.
 */
export const paiementsMultiplesConfig: DocVideoConfig = {
  id: "doc-caisse-paiements-multiples",
  category: "Caisse & Ventes",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M2 7V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/><rect x="2" y="7" width="20" height="10" rx="1"/><path d="M12 12h.01"/><path d="M7 12h.01"/><path d="M17 12h.01"/></svg>',
  title: "Paiements multiples",
  subtitle: "Gérez les paiements mixtes et fractionnés",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Cliquer sur Encaisser dans le panier
      screenshot: "screenshots/caisse-03-step1.png",
      cursorPath: [
        { x: 85, y: 85 },
        { x: 87, y: 93 },
      ],
      clickAt: { x: 87, y: 93 },
      annotation: {
        text: "Cliquez sur Encaisser",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Sélectionner Paiement multiple
      screenshot: "screenshots/caisse-03-step2.png",
      cursorPath: [
        { x: 50, y: 32 },
        { x: 50, y: 39 },
      ],
      clickAt: { x: 50, y: 39 },
      zoomTo: { x: 50, y: 37, scale: 1.6 },
      annotation: {
        text: "Sélectionnez Paiement multiple",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Ajouter espèces
      screenshot: "screenshots/caisse-03-step3.png",
      cursorPath: [
        { x: 42, y: 37 },
        { x: 42, y: 44 },
      ],
      clickAt: { x: 42, y: 44 },
      annotation: {
        text: "Espèces : 50 000 FCFA",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Ajouter mobile money
      screenshot: "screenshots/caisse-03-step4.png",
      cursorPath: [
        { x: 42, y: 44 },
        { x: 42, y: 52 },
      ],
      clickAt: { x: 42, y: 52 },
      annotation: {
        text: "Airtel Money : 25 000 FCFA",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Valider le paiement
      screenshot: "screenshots/caisse-03-step5.png",
      cursorPath: [
        { x: 50, y: 60 },
        { x: 50, y: 65 },
      ],
      clickAt: { x: 50, y: 65 },
      zoomTo: { x: 50, y: 63, scale: 1.5 },
      annotation: {
        text: "Validez le paiement",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
