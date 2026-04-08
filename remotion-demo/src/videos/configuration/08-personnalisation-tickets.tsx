import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 8 : Personnalisation des tickets
 * Customiser en-tête, pied de page, logo et messages.
 */
export const personnalisationTicketsConfig: DocVideoConfig = {
  id: "doc-config-08-personnalisation-tickets",
  category: "Configuration",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 13H8"/><path d="M16 17H8"/><path d="M16 13h-2"/></svg>',
  title: "Personnaliser les tickets",
  subtitle: "Logo, en-tête et messages sur vos tickets de caisse",
  accentColor: COLORS.violet,
  steps: [
    {
      // Step 1 : Ouvrir Paramètres > Impression
      screenshot: "screenshots/config-08-step1.png",
      cursorPath: [
        { x: 3, y: 37 },
        { x: 4, y: 75 },
        { x: 15, y: 42 },
      ],
      clickAt: { x: 15, y: 42 },
      annotation: {
        text: "Ouvrez Paramètres > Impression",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Section En-tête - uploader logo
      screenshot: "screenshots/config-08-step2.png",
      cursorPath: [
        { x: 35, y: 23 },
        { x: 47, y: 26 },
      ],
      clickAt: { x: 47, y: 26 },
      zoomTo: { x: 42, y: 26, scale: 1.6 },
      annotation: {
        text: "Uploadez votre logo",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Ajouter un message personnalisé en pied de page
      screenshot: "screenshots/config-08-step3.png",
      cursorPath: [
        { x: 40, y: 37 },
        { x: 40, y: 51 },
        { x: 57, y: 51 },
      ],
      clickAt: { x: 57, y: 51 },
      zoomTo: { x: 47, y: 48, scale: 1.5 },
      annotation: {
        text: "Ajoutez un message personnalisé",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Aperçu du ticket
      screenshot: "screenshots/config-08-step4.png",
      cursorPath: [
        { x: 57, y: 51 },
        { x: 75, y: 37 },
      ],
      clickAt: { x: 75, y: 37 },
      zoomTo: { x: 75, y: 42, scale: 1.8 },
      annotation: {
        text: "Prévisualisez le ticket",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Imprimer un test
      screenshot: "screenshots/config-08-step5.png",
      cursorPath: [
        { x: 75, y: 37 },
        { x: 75, y: 65 },
      ],
      clickAt: { x: 75, y: 65 },
      annotation: {
        text: "Lancez une impression test",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
