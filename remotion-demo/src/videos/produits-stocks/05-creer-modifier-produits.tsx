import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';

export const creerModifierProduitsConfig: DocVideoConfig = {
  id: "doc-produits-creer-modifier",
  category: "Produits & Stocks",
  categoryIcon: CATEGORY_ICON,
  title: "Créer et modifier des produits",
  subtitle: "Guide complet de gestion du catalogue produits",
  accentColor: COLORS.yellow,
  steps: [
    {
      // Step 1 : Ouvrir le menu Produits dans la sidebar
      screenshot: "screenshots/produits-05-step1.png",
      cursorPath: [
        { x: 4, y: 30 },
        { x: 4, y: 38 },
        { x: 4, y: 45 },
      ],
      clickAt: { x: 4, y: 45 },
      annotation: {
        text: "Ouvrez le menu Produits",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Cliquer sur Nouveau produit
      screenshot: "screenshots/produits-05-step2.png",
      cursorPath: [
        { x: 30, y: 15 },
        { x: 60, y: 10 },
        { x: 88, y: 7 },
      ],
      clickAt: { x: 88, y: 7 },
      zoomTo: { x: 88, y: 7, scale: 1.8 },
      annotation: {
        text: "Cliquez sur Nouveau produit",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Remplir le formulaire produit
      screenshot: "screenshots/produits-05-step3.png",
      cursorPath: [
        { x: 50, y: 25 },
        { x: 50, y: 40 },
        { x: 50, y: 55 },
      ],
      clickAt: { x: 50, y: 45 },
      annotation: {
        text: "Remplissez nom, prix, catégorie",
        position: "right",
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Enregistrer le produit
      screenshot: "screenshots/produits-05-step4.png",
      cursorPath: [
        { x: 50, y: 65 },
        { x: 55, y: 75 },
        { x: 60, y: 82 },
      ],
      clickAt: { x: 60, y: 82 },
      zoomTo: { x: 60, y: 80, scale: 1.5 },
      annotation: {
        text: "Enregistrez le produit",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
