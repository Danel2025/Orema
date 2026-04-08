import { registerDocVideo } from "../../registry";
import {
  creerModifierProduitsConfig,
  importExportCsvConfig,
  gestionStocksConfig,
  produitsComposesConfig,
} from "./index";

// Enregistrement des vidéos Produits & Stocks
registerDocVideo(creerModifierProduitsConfig);
registerDocVideo(importExportCsvConfig);
registerDocVideo(gestionStocksConfig);
registerDocVideo(produitsComposesConfig);
