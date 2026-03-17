/**
 * Données des produits - Vins, Champagnes, Spiritueux, Liqueurs
 * Oréma N+ POS System - Gabon
 * Prix en FCFA (XAF)
 */

import type { ProduitData } from './produits-boissons';

// =============================================================================
// VINS
// =============================================================================

export const vins: ProduitData[] = [
  // Vins Rouges
  { nom: 'Vin Rouge Maison (75cl)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 20, stockMin: 5 },
  { nom: 'Côtes du Rhône Rouge', prixVente: 8000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 15, stockMin: 4 },
  { nom: 'Bordeaux Supérieur', prixVente: 10000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 12, stockMin: 4 },
  { nom: 'Saint-Émilion', prixVente: 18000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Médoc', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Pomerol', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Chianti Classico', prixVente: 12000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Rioja Reserva', prixVente: 14000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  // Vins Blancs
  { nom: 'Vin Blanc Maison (75cl)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 20, stockMin: 5 },
  { nom: 'Chablis', prixVente: 12000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 10, stockMin: 3 },
  { nom: 'Sancerre', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Pouilly-Fumé', prixVente: 16000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Chardonnay', prixVente: 10000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 12, stockMin: 4 },
  { nom: 'Gewurztraminer', prixVente: 14000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Riesling', prixVente: 12000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  // Vins Rosés
  { nom: 'Vin Rosé Maison (75cl)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 20, stockMin: 5 },
  { nom: 'Côtes de Provence Rosé', prixVente: 10000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 12, stockMin: 4 },
  { nom: 'Tavel Rosé', prixVente: 12000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: true, stockActuel: 8, stockMin: 2 },
  // Vins au verre
  { nom: 'Verre Vin Rouge', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: false },
  { nom: 'Verre Vin Blanc', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: false },
  { nom: 'Verre Vin Rosé', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Vins', gererStock: false },
];

// =============================================================================
// CHAMPAGNES
// =============================================================================

export const champagnes: ProduitData[] = [
  // Champagnes Brut
  { nom: 'Champagne Brut Maison', prixVente: 35000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 10, stockMin: 3 },
  { nom: 'Nicolas Feuillatte Brut', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Piper-Heidsieck Brut', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Taittinger Brut Réserve', prixVente: 60000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Moët & Chandon Brut Impérial', prixVente: 75000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Veuve Clicquot Brut', prixVente: 85000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 8, stockMin: 2 },
  { nom: 'Laurent-Perrier Brut', prixVente: 70000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Mumm Cordon Rouge', prixVente: 65000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Pol Roger Brut', prixVente: 70000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Bollinger Spécial Cuvée', prixVente: 90000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 4, stockMin: 1 },
  // Champagnes Rosés
  { nom: 'Moët & Chandon Rosé', prixVente: 95000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Veuve Clicquot Rosé', prixVente: 110000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Laurent-Perrier Cuvée Rosé', prixVente: 120000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Ruinart Rosé', prixVente: 130000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 3, stockMin: 1 },
  // Champagnes Prestige
  { nom: 'Dom Pérignon', prixVente: 250000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Dom Pérignon Rosé', prixVente: 450000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Cristal Roederer', prixVente: 350000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Krug Grande Cuvée', prixVente: 280000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Ruinart Blanc de Blancs', prixVente: 100000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Perrier-Jouët Belle Époque', prixVente: 220000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 2, stockMin: 1 },
  // Crémants & Mousseux
  { nom: 'Crémant de Bourgogne', prixVente: 18000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 10, stockMin: 3 },
  { nom: 'Crémant d\'Alsace', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 10, stockMin: 3 },
  { nom: 'Prosecco DOC', prixVente: 12000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 12, stockMin: 4 },
  { nom: 'Cava Brut', prixVente: 10000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 10, stockMin: 3 },
  { nom: 'Asti Spumante', prixVente: 10000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: true, stockActuel: 10, stockMin: 3 },
  // Coupes
  { nom: 'Coupe Champagne', prixVente: 8000, tauxTva: 'STANDARD', categorie: 'Champagnes', gererStock: false },
];

// =============================================================================
// SPIRITUEUX
// =============================================================================

export const spiritueux: ProduitData[] = [
  // WHISKIES ÉCOSSAIS
  { nom: 'Johnnie Walker Red Label (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Johnnie Walker Red Label (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 6, stockMin: 2 },
  { nom: 'Johnnie Walker Black Label (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Johnnie Walker Black Label (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 5, stockMin: 2 },
  { nom: 'Johnnie Walker Double Black (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Johnnie Walker Double Black (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Johnnie Walker Gold Label (dose)', prixVente: 7000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Johnnie Walker Gold Label (bouteille)', prixVente: 80000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Johnnie Walker Blue Label (dose)', prixVente: 20000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Johnnie Walker Blue Label (bouteille)', prixVente: 250000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Chivas Regal 12 ans (dose)', prixVente: 4500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Chivas Regal 12 ans (bouteille)', prixVente: 50000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Chivas Regal 18 ans (dose)', prixVente: 8000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Chivas Regal 18 ans (bouteille)', prixVente: 95000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Ballantine\'s Finest (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Ballantine\'s Finest (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Glenfiddich 12 ans (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Glenfiddich 12 ans (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Glenfiddich 18 ans (dose)', prixVente: 10000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Glenfiddich 18 ans (bouteille)', prixVente: 120000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'The Macallan 12 ans (dose)', prixVente: 8000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'The Macallan 12 ans (bouteille)', prixVente: 90000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Glenlivet 12 ans (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Glenlivet 12 ans (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },

  // WHISKIES AMÉRICAINS
  { nom: 'Jack Daniel\'s (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Jack Daniel\'s (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 5, stockMin: 2 },
  { nom: 'Jack Daniel\'s Single Barrel (dose)', prixVente: 6000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Jack Daniel\'s Single Barrel (bouteille)', prixVente: 70000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Jim Beam White (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Jim Beam White (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Maker\'s Mark (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Maker\'s Mark (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Woodford Reserve (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Woodford Reserve (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Buffalo Trace (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Buffalo Trace (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },

  // WHISKIES IRLANDAIS
  { nom: 'Jameson (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Jameson (bouteille)', prixVente: 32000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Jameson Black Barrel (dose)', prixVente: 4500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Jameson Black Barrel (bouteille)', prixVente: 50000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Bushmills Original (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Bushmills Original (bouteille)', prixVente: 32000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Tullamore Dew (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Tullamore Dew (bouteille)', prixVente: 32000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },

  // COGNACS
  { nom: 'Hennessy VS (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Hennessy VS (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 5, stockMin: 2 },
  { nom: 'Hennessy VSOP (dose)', prixVente: 6000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Hennessy VSOP (bouteille)', prixVente: 70000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Hennessy XO (dose)', prixVente: 18000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Hennessy XO (bouteille)', prixVente: 220000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Rémy Martin VS (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Rémy Martin VS (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Rémy Martin VSOP (dose)', prixVente: 5500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Rémy Martin VSOP (bouteille)', prixVente: 65000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Rémy Martin XO (dose)', prixVente: 17000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Rémy Martin XO (bouteille)', prixVente: 200000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Martell VS (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Martell VS (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Martell VSOP (dose)', prixVente: 5500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Martell VSOP (bouteille)', prixVente: 65000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Martell XO (dose)', prixVente: 16000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Martell XO (bouteille)', prixVente: 190000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Martell Cordon Bleu (dose)', prixVente: 12000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Martell Cordon Bleu (bouteille)', prixVente: 140000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Courvoisier VS (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Courvoisier VS (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Courvoisier VSOP (dose)', prixVente: 5500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Courvoisier VSOP (bouteille)', prixVente: 65000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Courvoisier XO (dose)', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Courvoisier XO (bouteille)', prixVente: 180000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },

  // VODKAS
  { nom: 'Smirnoff Red (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Smirnoff Red (bouteille)', prixVente: 18000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 5, stockMin: 2 },
  { nom: 'Absolut (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Absolut (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Absolut Citron (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Absolut Citron (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Grey Goose (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Grey Goose (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Belvedere (dose)', prixVente: 4500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Belvedere (bouteille)', prixVente: 50000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Cîroc (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Cîroc (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Ketel One (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Ketel One (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Stolichnaya (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Stolichnaya (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Tito\'s (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Tito\'s (bouteille)', prixVente: 32000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },

  // GINS
  { nom: 'Gordon\'s (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Gordon\'s (bouteille)', prixVente: 18000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Beefeater (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Beefeater (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Tanqueray (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Tanqueray (bouteille)', prixVente: 32000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Tanqueray Ten (dose)', prixVente: 4500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Tanqueray Ten (bouteille)', prixVente: 50000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Bombay Sapphire (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Bombay Sapphire (bouteille)', prixVente: 38000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Hendrick\'s (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Hendrick\'s (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Monkey 47 (dose)', prixVente: 7000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Monkey 47 (bouteille)', prixVente: 80000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },

  // RHUMS
  { nom: 'Bacardi Carta Blanca (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Bacardi Carta Blanca (bouteille)', prixVente: 18000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Bacardi Carta Oro (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Bacardi Carta Oro (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Havana Club 3 Años (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Havana Club 3 Años (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Havana Club 7 Años (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Havana Club 7 Años (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Captain Morgan Original (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Captain Morgan Original (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Diplomatico Reserva (dose)', prixVente: 6000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Diplomatico Reserva (bouteille)', prixVente: 70000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Zacapa 23 (dose)', prixVente: 8000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Zacapa 23 (bouteille)', prixVente: 95000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },

  // TEQUILAS
  { nom: 'Jose Cuervo Especial (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Jose Cuervo Especial (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Patron Silver (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Patron Silver (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Patron Reposado (dose)', prixVente: 6000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Patron Reposado (bouteille)', prixVente: 70000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Don Julio Blanco (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Don Julio Blanco (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Don Julio 1942 (dose)', prixVente: 20000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Don Julio 1942 (bouteille)', prixVente: 250000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 1, stockMin: 1 },
  { nom: 'Casamigos Blanco (dose)', prixVente: 5000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: false },
  { nom: 'Casamigos Blanco (bouteille)', prixVente: 55000, tauxTva: 'STANDARD', categorie: 'Spiritueux', gererStock: true, stockActuel: 2, stockMin: 1 },
];

// =============================================================================
// LIQUEURS & DIGESTIFS
// =============================================================================

export const liqueurs: ProduitData[] = [
  // Liqueurs de Crème
  { nom: 'Baileys Original (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Baileys Original (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Kahlúa (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Kahlúa (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },

  // Liqueurs d'Orange
  { nom: 'Cointreau (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Cointreau (bouteille)', prixVente: 28000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Grand Marnier (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Grand Marnier (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Curaçao Bleu (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Curaçao Bleu (bouteille)', prixVente: 20000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Triple Sec (dose)', prixVente: 1500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Triple Sec (bouteille)', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },

  // Liqueurs aux Fruits
  { nom: 'Amaretto Disaronno (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Amaretto Disaronno (bouteille)', prixVente: 28000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Limoncello (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Limoncello (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Chambord (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Chambord (bouteille)', prixVente: 35000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Midori Melon (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Midori Melon (bouteille)', prixVente: 28000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Passoa (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Passoa (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Malibu (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Malibu (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },

  // Liqueurs aux Herbes
  { nom: 'Jägermeister (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Jägermeister (bouteille)', prixVente: 25000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Chartreuse Verte (dose)', prixVente: 4000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Chartreuse Verte (bouteille)', prixVente: 45000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Bénédictine (dose)', prixVente: 3500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Bénédictine (bouteille)', prixVente: 40000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Fernet Branca (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Fernet Branca (bouteille)', prixVente: 28000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },

  // Anisés
  { nom: 'Ricard (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Ricard (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Pastis 51 (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Pastis 51 (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Sambuca (dose)', prixVente: 2500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Sambuca (bouteille)', prixVente: 28000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },

  // Amers & Apéritifs
  { nom: 'Campari (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Campari (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Aperol (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Aperol (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 4, stockMin: 1 },
  { nom: 'Martini Rosso (dose)', prixVente: 1500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Martini Rosso (bouteille)', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Martini Bianco (dose)', prixVente: 1500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Martini Bianco (bouteille)', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },
  { nom: 'Martini Extra Dry (dose)', prixVente: 1500, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Martini Extra Dry (bouteille)', prixVente: 15000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 3, stockMin: 1 },

  // Digestifs
  { nom: 'Get 27 (dose)', prixVente: 2000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Get 27 (bouteille)', prixVente: 22000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Grappa (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Grappa (bouteille)', prixVente: 35000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
  { nom: 'Calvados (dose)', prixVente: 3000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: false },
  { nom: 'Calvados (bouteille)', prixVente: 35000, tauxTva: 'STANDARD', categorie: 'Liqueurs', gererStock: true, stockActuel: 2, stockMin: 1 },
];
