import type { DocVideoConfig } from "../../types";
import { COLORS } from "../../types";

const FPS = 30;

const CATEGORY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

export const gestionUtilisateursConfig: DocVideoConfig = {
  id: "doc-securite-gestion-utilisateurs",
  category: "Sécurité & Accès",
  categoryIcon: CATEGORY_ICON,
  title: "Gestion des utilisateurs",
  subtitle: "Créez et gérez les comptes de votre équipe",
  accentColor: COLORS.violet,
  steps: [
    {
      // Step 1 : Ouvrir le menu Employés
      screenshot: "screenshots/users-menu-employes.png",
      cursorPath: [
        { x: 4, y: 50 },
        { x: 4, y: 56 },
        { x: 4, y: 62 },
      ],
      clickAt: { x: 4, y: 62 },
      annotation: {
        text: "Ouvrez le menu Employés",
        position: "right",
        arrow: true,
      },
      duration: FPS * 4,
    },
    {
      // Step 2 : Remplir le formulaire
      screenshot: "screenshots/users-formulaire.png",
      cursorPath: [
        { x: 42, y: 28 },
        { x: 48, y: 40 },
        { x: 55, y: 52 },
      ],
      clickAt: { x: 55, y: 52 },
      zoomTo: { x: 50, y: 40, scale: 1.4 },
      annotation: {
        text: "Remplissez nom, email et téléphone",
        position: "left",
        arrow: true,
      },
      duration: FPS * 6,
    },
    {
      // Step 3 : Choisir le rôle
      screenshot: "screenshots/users-roles.png",
      cursorPath: [
        { x: 50, y: 52 },
        { x: 55, y: 56 },
        { x: 60, y: 60 },
      ],
      clickAt: { x: 60, y: 60 },
      zoomTo: { x: 58, y: 58, scale: 1.5 },
      annotation: {
        text: "Attribuez un rôle à l'employé",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 4 : Définir le code PIN
      screenshot: "screenshots/users-liste.png",
      cursorPath: [
        { x: 55, y: 62 },
        { x: 60, y: 68 },
        { x: 65, y: 75 },
      ],
      clickAt: { x: 65, y: 75 },
      annotation: {
        text: "Définissez le code PIN d'accès",
        position: "left",
        arrow: true,
      },
      duration: FPS * 5,
    },
    {
      // Step 5 : Enregistrer l'employé
      screenshot: "screenshots/users-desactiver.png",
      cursorPath: [
        { x: 60, y: 78 },
        { x: 70, y: 82 },
        { x: 80, y: 88 },
      ],
      clickAt: { x: 80, y: 88 },
      annotation: {
        text: "Enregistrez le nouvel employé",
        position: "top",
        arrow: true,
      },
      duration: FPS * 5,
    },
  ],
};
