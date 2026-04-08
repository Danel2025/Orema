import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';

export const importExportCsvConfig: DocVideoConfig = {
  id: "doc-produits-import-export-csv",
  category: "Produits & Stocks",
  categoryIcon: CATEGORY_ICON,
  title: "Import/Export CSV",
  subtitle: "Importez et exportez vos données en masse",
  accentColor: COLORS.yellow,
  steps: [
    {
      // Step 1 : Accéder au menu Produits > Export
      screenshot: "screenshots/produits-06-step1.png",
      cursorPath: [
        { x: 4, y: 45 },
        { x: 30, y: 15 },
        { x: 85, y: 7 },
      ],
      clickAt: { x: 85, y: 7 },
      annotation: {
        text: "Cliquez sur Exporter CSV",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Télécharger le modèle CSV
      screenshot: "screenshots/produits-06-step2.png",
      cursorPath: [
        { x: 50, y: 30 },
        { x: 50, y: 42 },
        { x: 50, y: 50 },
      ],
      clickAt: { x: 50, y: 50 },
      annotation: {
        text: "Téléchargez le modèle CSV",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Sélectionner le fichier à importer
      screenshot: "screenshots/produits-06-step3.png",
      cursorPath: [
        { x: 50, y: 50 },
        { x: 50, y: 58 },
        { x: 50, y: 65 },
      ],
      clickAt: { x: 50, y: 65 },
      zoomTo: { x: 50, y: 60, scale: 1.6 },
      annotation: {
        text: "Sélectionnez votre fichier CSV",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Prévisualiser et confirmer l'import
      screenshot: "screenshots/produits-06-step4.png",
      cursorPath: [
        { x: 50, y: 65 },
        { x: 55, y: 75 },
        { x: 60, y: 82 },
      ],
      clickAt: { x: 60, y: 82 },
      zoomTo: { x: 55, y: 78, scale: 1.5 },
      annotation: {
        text: "Confirmez l'import des données",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
