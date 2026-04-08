import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';

export const gestionTablesConfig: DocVideoConfig = {
  id: "doc-plan-salle-gestion-tables",
  category: "Plan de salle",
  categoryIcon: CATEGORY_ICON,
  title: "Gestion des tables",
  subtitle: "Suivez l'occupation et le statut de vos tables en temps réel",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Vue d'ensemble des tables
      screenshot: "screenshots/tables-vue-globale.png",
      cursorPath: [
        { x: 25, y: 30 },
        { x: 45, y: 45 },
        { x: 65, y: 55 },
      ],
      annotation: {
        text: "Vue des statuts par couleur",
        position: "bottom",
      },
      duration: FPS * 6,
    },
    {
      // Step 2 : Cliquer sur une table
      screenshot: "screenshots/tables-ouvrir.png",
      cursorPath: [
        { x: 50, y: 40 },
        { x: 42, y: 48 },
        { x: 38, y: 52 },
      ],
      clickAt: { x: 38, y: 52 },
      zoomTo: { x: 38, y: 50, scale: 1.6 },
      annotation: {
        text: "Cliquez sur une table libre",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 3 : Nombre de couverts et commande
      screenshot: "screenshots/tables-couverts.png",
      cursorPath: [
        { x: 45, y: 40 },
        { x: 50, y: 48 },
        { x: 55, y: 55 },
      ],
      clickAt: { x: 55, y: 55 },
      annotation: {
        text: "Indiquez les couverts et commandez",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Changer le statut
      screenshot: "screenshots/tables-statut.png",
      cursorPath: [
        { x: 60, y: 30 },
        { x: 68, y: 40 },
        { x: 75, y: 48 },
      ],
      clickAt: { x: 75, y: 48 },
      zoomTo: { x: 72, y: 44, scale: 1.5 },
      annotation: {
        text: "Changez le statut de la table",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 5 : Informations affichées sur la table
      screenshot: "screenshots/tables-infos.png",
      cursorPath: [
        { x: 40, y: 50 },
        { x: 45, y: 55 },
        { x: 48, y: 60 },
      ],
      zoomTo: { x: 45, y: 58, scale: 1.8 },
      annotation: {
        text: "Détails : couverts, montant, durée",
        position: "top",
      },
      duration: FPS * 5,
    },
  ],
};
