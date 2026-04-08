import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 3 : Ajouter vos produits
 * Guide la création de catégories puis l'ajout de produits.
 */
export const ajouterProduitsConfig: DocVideoConfig = {
  id: "doc-demarrage-03-ajouter-produits",
  category: "Démarrage rapide",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  title: "Ajouter vos produits",
  subtitle: "Créez votre catalogue de produits et services",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Naviguer vers Produits dans le menu
      screenshot: "screenshots/demarrage-03-step1.png",
      cursorPath: [
        { x: 3, y: 28 },
        { x: 4, y: 32 },
        { x: 15, y: 23 },
      ],
      clickAt: { x: 15, y: 23 },
      annotation: {
        text: "Allez dans Produits",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Cliquer sur Nouveau produit
      screenshot: "screenshots/demarrage-03-step2.png",
      cursorPath: [
        { x: 80, y: 6 },
        { x: 90, y: 6 },
      ],
      clickAt: { x: 90, y: 6 },
      zoomTo: { x: 90, y: 6, scale: 1.6 },
      annotation: {
        text: "Cliquez sur Nouveau produit",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 3 : Remplir les informations produit
      screenshot: "screenshots/demarrage-03-step3.png",
      cursorPath: [
        { x: 40, y: 23 },
        { x: 40, y: 32 },
        { x: 40, y: 42 },
        { x: 40, y: 51 },
      ],
      zoomTo: { x: 40, y: 37, scale: 1.5 },
      annotation: {
        text: "Remplissez nom, prix et catégorie",
        position: "right",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Sauvegarder le produit
      screenshot: "screenshots/demarrage-03-step4.png",
      cursorPath: [
        { x: 40, y: 51 },
        { x: 50, y: 85 },
      ],
      clickAt: { x: 50, y: 85 },
      annotation: {
        text: "Enregistrez le produit",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 5 : Import CSV pour ajout massif
      screenshot: "screenshots/demarrage-03-step5.png",
      cursorPath: [
        { x: 80, y: 6 },
        { x: 92, y: 6 },
      ],
      clickAt: { x: 92, y: 6 },
      annotation: {
        text: "Ou importez via fichier CSV",
        position: "left",
      },
      duration: FPS * 4,
    },
  ],
};
