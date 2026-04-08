import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

/**
 * Video 2 : Créer votre premier établissement
 * Guide la création et configuration de l'établissement.
 */
export const premierEtablissementConfig: DocVideoConfig = {
  id: "doc-demarrage-02-premier-etablissement",
  category: "Démarrage rapide",
  categoryIcon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="36" height="36"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  title: "Créer votre établissement",
  subtitle: "Configurez les informations de votre commerce",
  accentColor: COLORS.mint,
  steps: [
    {
      // Step 1 : Accéder aux paramètres via le menu latéral
      screenshot: "screenshots/demarrage-02-step1.png",
      cursorPath: [
        { x: 3, y: 37 },
        { x: 4, y: 75 },
      ],
      clickAt: { x: 4, y: 75 },
      annotation: {
        text: "Ouvrez les Paramètres",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Cliquer sur Établissement
      screenshot: "screenshots/demarrage-02-step2.png",
      cursorPath: [
        { x: 4, y: 75 },
        { x: 20, y: 28 },
      ],
      clickAt: { x: 20, y: 28 },
      annotation: {
        text: "Sélectionnez Établissement",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 3 : Remplir le formulaire (nom, adresse, NIF, RCCM)
      screenshot: "screenshots/demarrage-02-step3.png",
      cursorPath: [
        { x: 40, y: 23 },
        { x: 40, y: 31 },
        { x: 40, y: 40 },
        { x: 40, y: 48 },
        { x: 40, y: 56 },
      ],
      zoomTo: { x: 40, y: 40, scale: 1.5 },
      annotation: {
        text: "Remplissez les informations légales",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 4 : Uploader le logo
      screenshot: "screenshots/demarrage-02-step4.png",
      cursorPath: [
        { x: 40, y: 56 },
        { x: 60, y: 28 },
      ],
      clickAt: { x: 60, y: 28 },
      zoomTo: { x: 60, y: 28, scale: 1.8 },
      annotation: {
        text: "Ajoutez votre logo",
        position: "left",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 5 : Enregistrer
      screenshot: "screenshots/demarrage-02-step5.png",
      cursorPath: [
        { x: 60, y: 28 },
        { x: 50, y: 85 },
      ],
      clickAt: { x: 50, y: 85 },
      annotation: {
        text: "Enregistrez vos modifications",
        position: "top",
        arrow: true,
      },
      duration: FPS * 4,
    },
  ],
};
