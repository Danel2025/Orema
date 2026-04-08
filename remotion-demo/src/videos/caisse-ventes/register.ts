import { registerDocVideo } from "../../registry";
import {
  interfaceCaisseConfig,
  modesVenteConfig,
  paiementsMultiplesConfig,
  gestionRemisesConfig,
} from "./index";

// Enregistrement des vidéos Caisse & Ventes
registerDocVideo(interfaceCaisseConfig);
registerDocVideo(modesVenteConfig);
registerDocVideo(paiementsMultiplesConfig);
registerDocVideo(gestionRemisesConfig);
