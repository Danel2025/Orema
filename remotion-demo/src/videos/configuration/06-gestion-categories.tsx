import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 6 : Gestion des catégories
 * Créer des catégories, assigner couleurs et imprimantes.
 */
export const gestionCategoriesConfig: DocVideoConfig = {
  id: "doc-config-06-gestion-categories",
  category: "Configuration",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
  title: "Gestion des catégories",
  subtitle: "Organisez vos produits avec couleurs et imprimantes",
  accentColor: COLORS.violet,
  steps: [
    {
      // Step 1 : Naviguer vers Produits > Catégories
      screenshot: "screenshots/config-06-step1.png",
      cursorPath: [
        { x: 3, y: 28 },
        { x: 4, y: 32 },
        { x: 15, y: 23 },
      ],
      clickAt: { x: 15, y: 23 },
      annotation: {
        text: "Allez dans Produits > Catégories",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Cliquer sur Nouvelle catégorie
      screenshot: "screenshots/config-06-step2.png",
      cursorPath: [
        { x: 80, y: 6 },
        { x: 90, y: 6 },
      ],
      clickAt: { x: 90, y: 6 },
      annotation: {
        text: "Nouvelle catégorie",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 3 : Formulaire : nom + choix de couleur
      screenshot: "screenshots/config-06-step3.png",
      cursorPath: [
        { x: 40, y: 26 },
        { x: 40, y: 35 },
        { x: 48, y: 35 },
      ],
      clickAt: { x: 48, y: 35 },
      zoomTo: { x: 42, y: 32, scale: 1.6 },
      annotation: {
        text: "Choisissez nom et couleur",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Assigner une imprimante (cuisine, bar)
      screenshot: "screenshots/config-06-step4.png",
      cursorPath: [
        { x: 40, y: 44 },
        { x: 55, y: 44 },
      ],
      clickAt: { x: 55, y: 44 },
      zoomTo: { x: 47, y: 44, scale: 1.5 },
      annotation: {
        text: "Assignez une imprimante",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Réorganiser par glisser-déposer
      screenshot: "screenshots/config-06-step5.png",
      cursorPath: [
        { x: 30, y: 37 },
        { x: 31, y: 35 },
        { x: 30, y: 28 },
      ],
      annotation: {
        text: "Glissez pour réorganiser",
        position: "right",
      },
      duration: FPS * 4,
    },
  ],
};
