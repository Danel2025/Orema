import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';

export const gestionStocksConfig: DocVideoConfig = {
  id: "doc-produits-gestion-stocks",
  category: "Produits & Stocks",
  categoryIcon: CATEGORY_ICON,
  title: "Gestion des stocks",
  subtitle: "Suivez vos niveaux de stock en temps réel",
  accentColor: COLORS.yellow,
  steps: [
    {
      // Step 1 : Ouvrir le menu Stocks
      screenshot: "screenshots/produits-07-step1.png",
      cursorPath: [
        { x: 4, y: 40 },
        { x: 4, y: 48 },
        { x: 4, y: 52 },
      ],
      clickAt: { x: 4, y: 52 },
      annotation: {
        text: "Ouvrez le menu Stocks",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Vue inventaire
      screenshot: "screenshots/produits-07-step2.png",
      cursorPath: [
        { x: 25, y: 25 },
        { x: 50, y: 35 },
        { x: 70, y: 40 },
      ],
      zoomTo: { x: 50, y: 35, scale: 1.6 },
      annotation: {
        text: "Vue inventaire des stocks",
        position: "bottom",
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Ajuster la quantité
      screenshot: "screenshots/produits-07-step3.png",
      cursorPath: [
        { x: 70, y: 35 },
        { x: 85, y: 38 },
        { x: 90, y: 40 },
      ],
      clickAt: { x: 90, y: 40 },
      annotation: {
        text: "Ajustez la quantité en stock",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Saisir les quantités reçues
      screenshot: "screenshots/produits-07-step4.png",
      cursorPath: [
        { x: 50, y: 40 },
        { x: 50, y: 50 },
        { x: 50, y: 60 },
      ],
      clickAt: { x: 50, y: 55 },
      annotation: {
        text: "Saisissez les quantités reçues",
        position: "bottom",
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Historique mouvements
      screenshot: "screenshots/produits-07-step5.png",
      cursorPath: [
        { x: 30, y: 20 },
        { x: 40, y: 25 },
        { x: 50, y: 30 },
      ],
      zoomTo: { x: 45, y: 25, scale: 1.8 },
      annotation: {
        text: "Consultez l'historique des mouvements",
        position: "right",
      },
      duration: FPS * 4,
    },
  ],
};
