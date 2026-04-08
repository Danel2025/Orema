import { registerDocVideo } from "../../registry";
import {
  gestionUtilisateursConfig,
  rolesPermissionsConfig,
} from "./index";

// Enregistrement des vidéos Sécurité & Accès
registerDocVideo(gestionUtilisateursConfig);
registerDocVideo(rolesPermissionsConfig);
