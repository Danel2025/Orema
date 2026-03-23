/**
 * Types Supabase auto-generés (stub)
 *
 * Ce fichier est normalement généré via `pnpm db:types`.
 * Ce stub fournit les types de base pour que le build passe
 * en l'absence de connexion au projet Supabase.
 *
 * IMPORTANT : Exécuter `pnpm db:types` pour générer les vrais types
 * depuis le schéma Supabase en production.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Generic table shape used as a fallback for all tables.
 * The real generated file defines every table explicitly;
 * this stub uses a permissive index signature so the rest
 * of the codebase compiles without "never" errors.
 */
interface GenericTable {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: any[];
}

export type Database = {
  public: {
    Tables: {
      [key: string]: GenericTable;
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
        Relationships: any[];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      Role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CAISSIER" | "SERVEUR";
      TypeVente: "DIRECT" | "TABLE" | "LIVRAISON" | "EMPORTER";
      StatutVente: "EN_COURS" | "PAYEE" | "ANNULEE";
      StatutTable: "LIBRE" | "OCCUPEE" | "EN_PREPARATION" | "ADDITION" | "A_NETTOYER";
      ModePaiement:
        | "ESPECES"
        | "CARTE_BANCAIRE"
        | "AIRTEL_MONEY"
        | "MOOV_MONEY"
        | "CHEQUE"
        | "VIREMENT"
        | "COMPTE_CLIENT"
        | "MIXTE";
      TypeMouvement: "ENTREE" | "SORTIE" | "AJUSTEMENT" | "PERTE" | "INVENTAIRE";
      TypeImprimante: "TICKET" | "CUISINE" | "BAR";
      TypeConnexion: "USB" | "RESEAU" | "SERIE" | "BLUETOOTH" | "SYSTEME";
      FormeTable: "RONDE" | "CARREE" | "RECTANGULAIRE";
      StatutPreparation: "EN_ATTENTE" | "EN_PREPARATION" | "PRETE" | "SERVIE";
      TypeRemise: "POURCENTAGE" | "MONTANT_FIXE";
      TauxTva: "STANDARD" | "REDUIT" | "EXONERE";
      ActionAudit:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "LOGIN"
        | "LOGOUT"
        | "CAISSE_OUVERTURE"
        | "CAISSE_CLOTURE"
        | "ANNULATION_VENTE"
        | "REMISE_APPLIQUEE";
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
