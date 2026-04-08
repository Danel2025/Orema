import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';

export const produitsComposesConfig: DocVideoConfig = {
  id: "doc-produits-composes-supplements",
  category: "Produits & Stocks",
  categoryIcon: CATEGORY_ICON,
  title: "Produits composés",
  subtitle: "Créez des menus, formules et options de personnalisation",
  accentColor: COLORS.yellow,
  steps: [
    {
      // Step 1 : Nouveau produit composé
      screenshot: "screenshots/produits-08-step1.png",
      cursorPath: [
        { x: 30, y: 12 },
        { x: 60, y: 8 },
        { x: 88, y: 7 },
      ],
      clickAt: { x: 88, y: 7 },
      annotation: {
        text: "Créez un nouveau produit composé",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Définir nom et prix
      screenshot: "screenshots/produits-08-step2.png",
      cursorPath: [
        { x: 50, y: 25 },
        { x: 50, y: 35 },
        { x: 50, y: 45 },
      ],
      clickAt: { x: 50, y: 40 },
      annotation: {
        text: "Définissez le nom et le prix",
        position: "right",
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Ajouter les ingrédients
      screenshot: "screenshots/produits-08-step3.png",
      cursorPath: [
        { x: 50, y: 50 },
        { x: 50, y: 58 },
        { x: 50, y: 65 },
      ],
      clickAt: { x: 50, y: 62 },
      zoomTo: { x: 50, y: 58, scale: 1.6 },
      annotation: {
        text: "Ajoutez les ingrédients du menu",
        position: "right",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Configurer les suppléments
      screenshot: "screenshots/produits-08-step4.png",
      cursorPath: [
        { x: 50, y: 65 },
        { x: 60, y: 72 },
        { x: 65, y: 78 },
      ],
      clickAt: { x: 65, y: 75 },
      annotation: {
        text: "Configurez les suppléments",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Prix automatique en caisse
      screenshot: "screenshots/produits-08-step5.png",
      cursorPath: [
        { x: 65, y: 40 },
        { x: 75, y: 45 },
        { x: 80, y: 50 },
      ],
      zoomTo: { x: 75, y: 48, scale: 1.5 },
      annotation: {
        text: "Le prix se calcule automatiquement",
        position: "left",
      },
      duration: FPS * 5,
    },
  ],
};
