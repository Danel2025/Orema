import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 7 : Configuration des taxes (TVA)
 * Taux de TVA gabonais : 18% standard, 10% réduit, 0% exonéré.
 */
export const configurationTaxesConfig: DocVideoConfig = {
  id: "doc-config-07-configuration-taxes",
  category: "Configuration",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  title: "Configuration des taxes",
  subtitle: "Paramétrez la TVA selon la législation gabonaise",
  accentColor: COLORS.violet,
  steps: [
    {
      // Step 1 : Naviguer vers Paramètres > Fiscalité
      screenshot: "screenshots/config-07-step1.png",
      cursorPath: [
        { x: 3, y: 37 },
        { x: 4, y: 75 },
        { x: 15, y: 32 },
      ],
      clickAt: { x: 15, y: 32 },
      annotation: {
        text: "Ouvrez Paramètres > Fiscalité",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Vue des taux existants (18%, 10%, 0%)
      screenshot: "screenshots/config-07-step2.png",
      cursorPath: [
        { x: 35, y: 23 },
        { x: 35, y: 32 },
        { x: 35, y: 42 },
      ],
      zoomTo: { x: 40, y: 32, scale: 1.5 },
      annotation: {
        text: "Taux préconfigurés : 18%, 10%, 0%",
        position: "right",
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Sélectionner le taux par produit
      screenshot: "screenshots/config-07-step3.png",
      cursorPath: [
        { x: 35, y: 42 },
        { x: 50, y: 37 },
        { x: 63, y: 42 },
      ],
      clickAt: { x: 63, y: 42 },
      zoomTo: { x: 57, y: 40, scale: 1.6 },
      annotation: {
        text: "Sélectionnez le taux par produit",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Visualiser le calcul TVA sur un ticket
      screenshot: "screenshots/config-07-step4.png",
      cursorPath: [
        { x: 63, y: 42 },
        { x: 78, y: 56 },
      ],
      zoomTo: { x: 78, y: 60, scale: 1.8 },
      annotation: {
        text: "La TVA s'affiche sur le ticket",
        position: "left",
      },
      duration: FPS * 5,
    },
  ],
};
