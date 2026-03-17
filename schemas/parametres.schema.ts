/**
 * Schemas de validation pour les parametres
 */

import { z } from "zod";

// ============================================================================
// ETABLISSEMENT
// ============================================================================

/**
 * Schema pour les parametres de l'etablissement
 */
export const etablissementSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(100, "Le nom ne peut pas depasser 100 caracteres"),
  adresse: z.string().max(255).optional().nullable(),
  telephone: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  email: z
    .string()
    .email("Email invalide")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  nif: z
    .string()
    .max(50, "Le NIF ne peut pas depasser 50 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  rccm: z
    .string()
    .max(50, "Le RCCM ne peut pas depasser 50 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  messageTicket: z
    .string()
    .max(500, "Le message ne peut pas depasser 500 caracteres")
    .optional()
    .nullable(),
});

export type EtablissementFormData = z.infer<typeof etablissementSchema>;

// ============================================================================
// FISCALITE
// ============================================================================

/**
 * Schema pour les parametres fiscaux
 */
export const fiscalSchema = z.object({
  tauxTvaStandard: z.coerce
    .number()
    .min(0, "Le taux doit etre positif")
    .max(100, "Le taux ne peut pas depasser 100%"),
  tauxTvaReduit: z.coerce
    .number()
    .min(0, "Le taux doit etre positif")
    .max(100, "Le taux ne peut pas depasser 100%"),
  afficherTvaSurTicket: z.boolean().default(true),
});

export type FiscalFormData = z.infer<typeof fiscalSchema>;

// ============================================================================
// IMPRIMANTES
// ============================================================================

/**
 * Types de connexion imprimante
 */
export const typeConnexionOptions = [
  { value: "SYSTEME", label: "Imprimante systeme" },
  { value: "RESEAU", label: "Reseau (IP)" },
  { value: "USB", label: "USB" },
  { value: "SERIE", label: "Port Serie" },
  { value: "BLUETOOTH", label: "Bluetooth" },
] as const;

/**
 * Types d'imprimante
 */
export const typeImprimanteOptions = [
  { value: "TICKET", label: "Ticket (caisse)" },
  { value: "CUISINE", label: "Cuisine" },
  { value: "BAR", label: "Bar" },
] as const;

/**
 * Largeurs de papier disponibles
 */
export const largeurPapierOptions = [
  { value: 58, label: "58 mm" },
  { value: 80, label: "80 mm" },
] as const;

/**
 * Schema pour une imprimante
 */
export const imprimanteSchema = z
  .object({
    nom: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caracteres")
      .max(50, "Le nom ne peut pas depasser 50 caracteres"),
    type: z.enum(["TICKET", "CUISINE", "BAR"]),
    typeConnexion: z.enum(["USB", "RESEAU", "SERIE", "BLUETOOTH", "SYSTEME"]),
    adresseIp: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    port: z.coerce
      .number()
      .int()
      .min(1)
      .max(65535)
      .optional()
      .nullable(),
    pathUsb: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    largeurPapier: z.coerce.number().int().min(58).max(80).default(80),
    actif: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Si connexion reseau, IP requise
      if (data.typeConnexion === "RESEAU") {
        return !!data.adresseIp;
      }
      return true;
    },
    {
      message: "L'adresse IP est requise pour une connexion reseau",
      path: ["adresseIp"],
    }
  )
  .refine(
    (data) => {
      // Si connexion USB, path requis
      if (data.typeConnexion === "USB") {
        return !!data.pathUsb;
      }
      return true;
    },
    {
      message: "Le chemin USB est requis pour une connexion USB",
      path: ["pathUsb"],
    }
  );

export type ImprimanteFormData = z.infer<typeof imprimanteSchema>;

// ============================================================================
// ZONES DE LIVRAISON
// ============================================================================

/**
 * Schema pour une zone de livraison
 */
export const zoneLivraisonSchema = z.object({
  nom: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(100, "Le nom ne peut pas depasser 100 caracteres"),
  frais: z.coerce
    .number()
    .int()
    .min(0, "Les frais doivent etre positifs"),
  delaiEstime: z.coerce
    .number()
    .int()
    .min(0, "Le delai doit etre positif")
    .optional()
    .nullable(),
  actif: z.boolean().default(true),
});

export type ZoneLivraisonFormData = z.infer<typeof zoneLivraisonSchema>;

// ============================================================================
// APPARENCE
// ============================================================================

/**
 * Options de theme
 */
export const themeOptions = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "auto", label: "Automatique (systeme)" },
] as const;

/**
 * Couleurs d'accent disponibles
 */
export const accentColors = [
  { value: "violet", label: "Violet", hex: "#7c3aed" },
  { value: "blue", label: "Bleu", hex: "#3b82f6" },
  { value: "green", label: "Vert", hex: "#22c55e" },
  { value: "purple", label: "Pourpre", hex: "#a855f7" },
  { value: "red", label: "Rouge", hex: "#ef4444" },
  { value: "cyan", label: "Cyan", hex: "#06b6d4" },
  { value: "pink", label: "Rose", hex: "#ec4899" },
  { value: "amber", label: "Ambre", hex: "#f59e0b" },
] as const;

/**
 * Tailles de police disponibles
 */
export const fontSizeOptions = [
  { value: "small", label: "Petite", scale: 90 },
  { value: "medium", label: "Normale", scale: 100 },
  { value: "large", label: "Grande", scale: 110 },
] as const;

/**
 * Schema pour les preferences d'apparence
 */
export const apparenceSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]).default("auto"),
  accentColor: z.string().default("violet"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium"),
});

export type ApparenceFormData = z.infer<typeof apparenceSchema>;

// ============================================================================
// CAISSE & VENTES
// ============================================================================

/**
 * Options de mode de vente
 */
export const modeVenteOptions = [
  { value: "DIRECT", label: "Vente directe" },
  { value: "TABLE", label: "Service a table" },
  { value: "LIVRAISON", label: "Livraison" },
  { value: "EMPORTER", label: "A emporter" },
] as const;

/**
 * Options de mode de paiement
 */
export const modePaiementOptions = [
  { value: "ESPECES", label: "Especes" },
  { value: "CARTE_BANCAIRE", label: "Carte bancaire" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "MOOV_MONEY", label: "Moov Money" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "VIREMENT", label: "Virement" },
  { value: "COMPTE_CLIENT", label: "Compte client" },
] as const;

/**
 * Schema pour les parametres de caisse et ventes
 */
export const caisseVentesSchema = z.object({
  modeVenteDefaut: z.enum(["DIRECT", "TABLE", "LIVRAISON", "EMPORTER"]).default("DIRECT"),
  confirmationVente: z.boolean().default(false),
  montantMinimumVente: z.coerce
    .number()
    .int()
    .min(0, "Le montant doit etre positif"),
  remiseMaxAutorisee: z.coerce
    .number()
    .min(0, "La remise doit etre positive")
    .max(100, "La remise ne peut pas depasser 100%"),
  impressionAutoTicket: z.boolean().default(true),
  modesPaiementActifs: z.array(
    z.enum(["ESPECES", "CARTE_BANCAIRE", "AIRTEL_MONEY", "MOOV_MONEY", "CHEQUE", "VIREMENT", "COMPTE_CLIENT"])
  ).min(1, "Au moins un mode de paiement doit etre actif"),
});

export type CaisseVentesFormData = z.infer<typeof caisseVentesSchema>;

// ============================================================================
// GESTION DES STOCKS
// ============================================================================

/**
 * Options de methode de valuation
 */
export const methodeValuationOptions = [
  { value: "FIFO", label: "FIFO (Premier entre, premier sorti)" },
  { value: "LIFO", label: "LIFO (Dernier entre, premier sorti)" },
] as const;

/**
 * Schema pour les parametres de stock
 */
export const stockSettingsSchema = z.object({
  seuilAlerteStockBas: z.coerce
    .number()
    .int()
    .min(0, "Le seuil doit etre positif"),
  seuilCritiqueStock: z.coerce
    .number()
    .int()
    .min(0, "Le seuil doit etre positif"),
  alerteStockEmail: z.boolean().default(false),
  emailAlerteStock: z
    .string()
    .email("Email invalide")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
  methodeValuationStock: z.enum(["FIFO", "LIFO"]).default("FIFO"),
}).refine(
  (data) => data.seuilCritiqueStock <= data.seuilAlerteStockBas,
  {
    message: "Le seuil critique doit etre inferieur ou egal au seuil d'alerte",
    path: ["seuilCritiqueStock"],
  }
);

export type StockSettingsFormData = z.infer<typeof stockSettingsSchema>;

// ============================================================================
// PROGRAMME FIDELITE
// ============================================================================

/**
 * Schema pour les parametres de fidelite
 */
export const fideliteSettingsSchema = z.object({
  fideliteActif: z.boolean().default(false),
  tauxPointsFidelite: z.coerce
    .number()
    .int()
    .min(1, "Le taux doit etre au moins 1")
    .max(100, "Le taux ne peut pas depasser 100"),
  valeurPointFidelite: z.coerce
    .number()
    .int()
    .min(1, "La valeur doit etre au moins 1 FCFA"),
  creditClientActif: z.boolean().default(false),
  limiteCreditDefaut: z.coerce
    .number()
    .int()
    .min(0, "La limite doit etre positive"),
  dureeValiditeSolde: z.coerce
    .number()
    .int()
    .min(1, "La duree doit etre au moins 1 jour")
    .max(3650, "La duree ne peut pas depasser 10 ans"),
});

export type FideliteSettingsFormData = z.infer<typeof fideliteSettingsSchema>;

// ============================================================================
// SECURITE
// ============================================================================

/**
 * Options de longueur de PIN
 */
export const longueurPinOptions = [
  { value: 4, label: "4 chiffres" },
  { value: 6, label: "6 chiffres" },
  { value: 8, label: "8 chiffres" },
] as const;

/**
 * Options d'actions a logger
 */
export const actionAuditOptions = [
  { value: "CREATE", label: "Creations" },
  { value: "UPDATE", label: "Modifications" },
  { value: "DELETE", label: "Suppressions" },
  { value: "LOGIN", label: "Connexions" },
  { value: "LOGOUT", label: "Deconnexions" },
  { value: "CAISSE_OUVERTURE", label: "Ouvertures de caisse" },
  { value: "CAISSE_CLOTURE", label: "Clotures de caisse" },
  { value: "ANNULATION_VENTE", label: "Annulations de vente" },
  { value: "REMISE_APPLIQUEE", label: "Remises appliquees" },
] as const;

/**
 * Schema pour les parametres de securite
 */
export const securiteSettingsSchema = z.object({
  longueurPinMinimum: z.coerce
    .number()
    .int()
    .min(4, "Le PIN doit faire au moins 4 chiffres")
    .max(8, "Le PIN ne peut pas depasser 8 chiffres"),
  tentativesLoginMax: z.coerce
    .number()
    .int()
    .min(1, "Au moins 1 tentative")
    .max(10, "Maximum 10 tentatives"),
  dureeBlocage: z.coerce
    .number()
    .int()
    .min(1, "Minimum 1 minute")
    .max(1440, "Maximum 24 heures (1440 minutes)"),
  sessionTimeout: z.coerce
    .number()
    .int()
    .min(5, "Minimum 5 minutes")
    .max(480, "Maximum 8 heures (480 minutes)"),
  auditActif: z.boolean().default(true),
  actionsALogger: z.array(
    z.enum(["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "CAISSE_OUVERTURE", "CAISSE_CLOTURE", "ANNULATION_VENTE", "REMISE_APPLIQUEE"])
  ).min(1, "Au moins une action doit etre loggee"),
});

export type SecuriteSettingsFormData = z.infer<typeof securiteSettingsSchema>;

// ============================================================================
// PLAN DE SALLE
// ============================================================================

/**
 * Options d'affichage des tables
 */
export const affichageTableOptions = [
  { value: "NOM", label: "Nom uniquement" },
  { value: "NUMERO", label: "Numero uniquement" },
  { value: "CAPACITE", label: "Capacite uniquement" },
  { value: "NOM_NUMERO", label: "Nom + Numero" },
  { value: "NUMERO_CAPACITE", label: "Numero + Capacite" },
] as const;

/**
 * Options de taille de grille
 */
export const tailleGrilleOptions = [
  { value: 10, label: "Petite (10px)" },
  { value: 20, label: "Moyenne (20px)" },
  { value: 30, label: "Grande (30px)" },
  { value: 40, label: "Tres grande (40px)" },
] as const;

/**
 * Validation de couleur hexadecimale
 */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Schema pour les parametres du plan de salle
 */
export const planSalleSettingsSchema = z.object({
  couleurTableLibre: z.string().regex(hexColorRegex, "Couleur invalide"),
  couleurTableOccupee: z.string().regex(hexColorRegex, "Couleur invalide"),
  couleurTablePrepa: z.string().regex(hexColorRegex, "Couleur invalide"),
  couleurTableAddition: z.string().regex(hexColorRegex, "Couleur invalide"),
  couleurTableNettoyer: z.string().regex(hexColorRegex, "Couleur invalide"),
  affichageTable: z.enum(["NOM", "NUMERO", "CAPACITE", "NOM_NUMERO", "NUMERO_CAPACITE"]).default("NUMERO"),
  grilleActivee: z.boolean().default(true),
  tailleGrille: z.coerce
    .number()
    .int()
    .min(10, "Taille minimum 10px")
    .max(50, "Taille maximum 50px"),
});

export type PlanSalleSettingsFormData = z.infer<typeof planSalleSettingsSchema>;

// ============================================================================
// REMISE A ZERO DES DONNEES
// ============================================================================

/**
 * Categories de donnees pouvant etre supprimees
 */
export const resetDataCategories = [
  {
    key: "ventes",
    label: "Ventes et paiements",
    description: "Ventes, lignes de vente, paiements, sessions de caisse",
    tables: ["paiements", "lignes_vente", "ventes", "sessions_caisse"],
  },
  {
    key: "clients",
    label: "Clients",
    description: "Tous les clients et leur historique",
    tables: ["clients"],
  },
  {
    key: "produits",
    label: "Produits et categories",
    description: "Tous les produits et categories",
    tables: ["produits", "categories"],
  },
  {
    key: "stocks",
    label: "Mouvements de stock",
    description: "Historique des mouvements de stock",
    tables: ["mouvements_stock"],
  },
  {
    key: "tables",
    label: "Tables et zones de salle",
    description: "Plan de salle avec tables et zones",
    tables: ["tables", "zones"],
  },
  {
    key: "imprimantes",
    label: "Imprimantes et zones de livraison",
    description: "Configuration des imprimantes et zones de livraison",
    tables: ["imprimantes", "zones_livraison"],
  },
  {
    key: "utilisateurs",
    label: "Utilisateurs (sauf admin actuel)",
    description: "Tous les utilisateurs sauf l'administrateur connecte",
    tables: ["utilisateurs"],
  },
  {
    key: "auditLogs",
    label: "Logs d'audit",
    description: "Historique des actions du systeme",
    tables: ["audit_logs"],
  },
] as const;

export type ResetDataCategoryKey = typeof resetDataCategories[number]["key"];

/**
 * Schema pour les options de remise a zero
 */
export const resetDataOptionsSchema = z.object({
  ventes: z.boolean().default(false),
  clients: z.boolean().default(false),
  produits: z.boolean().default(false),
  stocks: z.boolean().default(false),
  tables: z.boolean().default(false),
  imprimantes: z.boolean().default(false),
  utilisateurs: z.boolean().default(false),
  auditLogs: z.boolean().default(false),
  confirmationText: z.string().refine(
    (val) => val === "CONFIRMER LA SUPPRESSION",
    { message: "Vous devez taper exactement 'CONFIRMER LA SUPPRESSION'" }
  ),
}).refine(
  (data) => {
    // Au moins une categorie doit etre selectionnee
    return data.ventes || data.clients || data.produits || data.stocks ||
           data.tables || data.imprimantes || data.utilisateurs || data.auditLogs;
  },
  {
    message: "Vous devez selectionner au moins une categorie de donnees a supprimer",
  }
);

export type ResetDataOptions = z.infer<typeof resetDataOptionsSchema>;

// ============================================================================
// PARAMETRES DE FACTURE / TICKET
// ============================================================================

/**
 * Types de facture disponibles
 */
export const typeFactureOptions = [
  { value: "TICKET_SIMPLE", label: "Ticket simple", description: "Ticket de caisse compact" },
  { value: "FACTURE_DETAILLEE", label: "Facture détaillée", description: "Facture complète avec TVA" },
  { value: "PRO_FORMA", label: "Pro-forma", description: "Devis avant achat" },
  { value: "NOTE_ADDITION", label: "Note d'addition", description: "Pré-note pour table" },
] as const;

export type TypeFacture = typeof typeFactureOptions[number]["value"];

/**
 * Styles de séparateur pour les tickets
 */
export const styleSeparateurOptions = [
  { value: "LIGNE_PLEINE", label: "Ligne pleine", char: "─" },
  { value: "TIRETS", label: "Tirets", char: "-" },
  { value: "ETOILES", label: "Étoiles", char: "*" },
  { value: "EGAL", label: "Égal", char: "=" },
  { value: "AUCUN", label: "Aucun", char: "" },
] as const;

export type StyleSeparateur = typeof styleSeparateurOptions[number]["value"];

/**
 * Options de copies (1 à 5)
 */
export const copiesOptions = [
  { value: 1, label: "1 copie" },
  { value: 2, label: "2 copies" },
  { value: 3, label: "3 copies" },
  { value: 4, label: "4 copies" },
  { value: 5, label: "5 copies" },
] as const;

/**
 * Schema pour les paramètres de facture
 */
export const parametresFactureSchema = z.object({
  // Type par défaut
  typeFactureDefaut: z.enum(["TICKET_SIMPLE", "FACTURE_DETAILLEE", "PRO_FORMA", "NOTE_ADDITION"]).default("TICKET_SIMPLE"),

  // Options globales
  afficherLogo: z.boolean().default(true),
  afficherInfosEtablissement: z.boolean().default(true),
  afficherNifRccm: z.boolean().default(false),
  afficherDetailTva: z.boolean().default(true),
  afficherQrCode: z.boolean().default(false),

  // Style
  styleSeparateur: z.enum(["LIGNE_PLEINE", "TIRETS", "ETOILES", "EGAL", "AUCUN"]).default("TIRETS"),

  // En-têtes par type
  enteteTicketSimple: z.string().max(100).optional().nullable(),
  enteteFactureDetaillee: z.string().max(100).default("FACTURE").optional().nullable(),
  enteteProForma: z.string().max(100).default("PRO-FORMA").optional().nullable(),
  enteteNoteAddition: z.string().max(100).default("ADDITION").optional().nullable(),

  // Pieds de page par type
  piedPageTicketSimple: z.string().max(200).default("Merci de votre visite !").optional().nullable(),
  piedPageFactureDetaillee: z.string().max(200).default("Conditions de paiement : comptant").optional().nullable(),
  piedPageProForma: z.string().max(200).default("Ce document n'est pas une facture").optional().nullable(),
  piedPageNoteAddition: z.string().max(200).default("Merci de régler à la caisse").optional().nullable(),

  // Nombre de copies par type
  copiesTicketSimple: z.coerce.number().int().min(1).max(5).default(1),
  copiesFactureDetaillee: z.coerce.number().int().min(1).max(5).default(2),
  copiesProForma: z.coerce.number().int().min(1).max(5).default(1),
  copiesNoteAddition: z.coerce.number().int().min(1).max(5).default(1),
});

export type ParametresFactureFormData = z.infer<typeof parametresFactureSchema>;

/**
 * Données par défaut pour les paramètres de facture
 */
export const defaultParametresFacture: ParametresFactureFormData = {
  typeFactureDefaut: "TICKET_SIMPLE",
  afficherLogo: true,
  afficherInfosEtablissement: true,
  afficherNifRccm: false,
  afficherDetailTva: true,
  afficherQrCode: false,
  styleSeparateur: "TIRETS",
  enteteTicketSimple: null,
  enteteFactureDetaillee: "FACTURE",
  enteteProForma: "PRO-FORMA",
  enteteNoteAddition: "ADDITION",
  piedPageTicketSimple: "Merci de votre visite !",
  piedPageFactureDetaillee: "Conditions de paiement : comptant",
  piedPageProForma: "Ce document n'est pas une facture",
  piedPageNoteAddition: "Merci de régler à la caisse",
  copiesTicketSimple: 1,
  copiesFactureDetaillee: 2,
  copiesProForma: 1,
  copiesNoteAddition: 1,
};
