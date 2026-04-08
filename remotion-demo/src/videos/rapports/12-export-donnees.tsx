import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';

export const exportDonneesConfig: DocVideoConfig = {
  id: "doc-rapports-export-donnees",
  category: "Rapports & Statistiques",
  categoryIcon: CATEGORY_ICON,
  title: "Export des données",
  subtitle: "Exportez vos données pour analyse, comptabilité ou archivage",
  accentColor: COLORS.orange,
  steps: [
    {
      // Step 1 : Accéder à Rapports > Exporter
      screenshot: "screenshots/export-rapports-ventes.png",
      cursorPath: [
        { x: 4, y: 60 },
        { x: 12, y: 65 },
        { x: 18, y: 70 },
      ],
      clickAt: { x: 18, y: 70 },
      annotation: {
        text: "Ouvrez Rapports puis Exporter",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Sélectionner la période
      screenshot: "screenshots/export-filtres.png",
      cursorPath: [
        { x: 42, y: 12 },
        { x: 52, y: 15 },
        { x: 62, y: 18 },
      ],
      clickAt: { x: 62, y: 18 },
      zoomTo: { x: 55, y: 15, scale: 1.5 },
      annotation: {
        text: "Sélectionnez la période à exporter",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Choisir le format
      screenshot: "screenshots/export-format.png",
      cursorPath: [
        { x: 72, y: 12 },
        { x: 80, y: 15 },
        { x: 88, y: 18 },
      ],
      clickAt: { x: 88, y: 18 },
      zoomTo: { x: 85, y: 16, scale: 1.6 },
      annotation: {
        text: "Choisissez PDF, Excel ou CSV",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Télécharger le fichier
      screenshot: "screenshots/export-comptable.png",
      cursorPath: [
        { x: 50, y: 50 },
        { x: 58, y: 58 },
        { x: 65, y: 65 },
      ],
      clickAt: { x: 65, y: 65 },
      annotation: {
        text: "Téléchargez le fichier exporté",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
