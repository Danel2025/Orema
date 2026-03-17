/**
 * Index des données de seed
 * Oréma N+ POS System - Gabon
 */

// Catégories
// Tous les produits regroupés
import { bieres, sodas, jus, eaux, alcoolmix } from './produits-boissons';
import { vins, champagnes, spiritueux, liqueurs } from './produits-alcools';
import { cocktails, boissonsChaudes } from './produits-bar';
import { entrees, platsViandes, platsPoissons, accompagnements, pizzas, burgers, desserts, petitDejeuner } from './produits-cuisine';

export { categories, type CategorieData } from './categories';

// Produits - Boissons
export {
  bieres,
  sodas,
  jus,
  eaux,
  alcoolmix,
  type ProduitData
} from './produits-boissons';

// Produits - Alcools
export {
  vins,
  champagnes,
  spiritueux,
  liqueurs
} from './produits-alcools';

// Produits - Bar
export {
  cocktails,
  boissonsChaudes
} from './produits-bar';

// Produits - Cuisine
export {
  entrees,
  platsViandes,
  platsPoissons,
  accompagnements,
  pizzas,
  burgers,
  desserts,
  petitDejeuner
} from './produits-cuisine';

export const allProduits = [
  ...bieres,
  ...sodas,
  ...jus,
  ...eaux,
  ...alcoolmix,
  ...vins,
  ...champagnes,
  ...spiritueux,
  ...liqueurs,
  ...cocktails,
  ...boissonsChaudes,
  ...entrees,
  ...platsViandes,
  ...platsPoissons,
  ...accompagnements,
  ...pizzas,
  ...burgers,
  ...desserts,
  ...petitDejeuner,
];
