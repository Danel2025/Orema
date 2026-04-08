import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

export const rolesPermissionsConfig: DocVideoConfig = {
  id: "doc-securite-roles-permissions",
  category: "Sécurité & Accès",
  categoryIcon: CATEGORY_ICON,
  title: "Rôles et permissions",
  subtitle: "Définissez finement les droits d'accès de chaque membre",
  accentColor: COLORS.violet,
  steps: [
    {
      // Step 1 : Accéder à Employés > Rôles
      screenshot: "screenshots/roles-parametres.png",
      cursorPath: [
        { x: 4, y: 58 },
        { x: 4, y: 64 },
        { x: 12, y: 68 },
      ],
      clickAt: { x: 12, y: 68 },
      annotation: {
        text: "Ouvrez Employés puis Rôles",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Matrice des permissions
      screenshot: "screenshots/roles-matrice.png",
      cursorPath: [
        { x: 25, y: 28 },
        { x: 50, y: 42 },
        { x: 72, y: 52 },
      ],
      zoomTo: { x: 50, y: 40, scale: 1.3 },
      annotation: {
        text: "Matrice des permissions par module",
        position: "bottom",
      },
      duration: FPS * 6,
    },
    {
      // Step 3 : Créer un rôle personnalisé
      screenshot: "screenshots/roles-nouveau.png",
      cursorPath: [
        { x: 60, y: 8 },
        { x: 75, y: 7 },
        { x: 88, y: 7 },
      ],
      clickAt: { x: 88, y: 7 },
      zoomTo: { x: 85, y: 7, scale: 1.5 },
      annotation: {
        text: "Créez un rôle personnalisé",
        position: "bottom",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Configurer les permissions
      screenshot: "screenshots/roles-permissions-detail.png",
      cursorPath: [
        { x: 40, y: 38 },
        { x: 48, y: 48 },
        { x: 55, y: 58 },
      ],
      clickAt: { x: 55, y: 58 },
      zoomTo: { x: 50, y: 48, scale: 1.4 },
      annotation: {
        text: "Cochez les permissions par module",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 5 : Appliquer les permissions
      screenshot: "screenshots/roles-actions-sensibles.png",
      cursorPath: [
        { x: 50, y: 68 },
        { x: 60, y: 75 },
        { x: 70, y: 82 },
      ],
      clickAt: { x: 70, y: 82 },
      annotation: {
        text: "Appliquez les rôles aux employés",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
