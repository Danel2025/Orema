"use server";

/**
 * Server Actions pour l'export de données d'un établissement (SUPER_ADMIN)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/lib/auth";
import { exportDataSchema, type ExportDataInput } from "@/schemas/admin-etablissement.schema";

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Exporte les données d'un établissement en CSV ou JSON
 */
export async function exportEtablissementData(
  etablissementId: string,
  input: ExportDataInput
): Promise<ActionResult<{ content: string; filename: string; mimeType: string }>> {
  try {
    await requireAnyRole(["SUPER_ADMIN"]);
    const supabase = createServiceClient();

    // Validation
    const validated = exportDataSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: "Paramètres d'export invalides" };
    }

    // Vérifier que l'établissement existe
    const { data: etab } = await supabase
      .from("etablissements")
      .select("id, nom")
      .eq("id", etablissementId)
      .single();

    if (!etab) {
      return { success: false, error: "Établissement non trouvé" };
    }

    const exportData: Record<string, unknown[]> = {};

    // Récupérer les données demandées
    for (const section of validated.data.sections) {
      switch (section) {
        case "produits": {
          const { data } = await supabase
            .from("produits")
            .select("nom, description, prix_vente, prix_achat, stock_actuel, taux_tva, actif, created_at")
            .eq("etablissement_id", etablissementId)
            .order("nom");
          exportData.produits = data ?? [];
          break;
        }
        case "ventes": {
          const { data } = await supabase
            .from("ventes")
            .select("numero_ticket, type_vente, statut, sous_total, total_tva, total_final, mode_paiement, created_at")
            .eq("etablissement_id", etablissementId)
            .order("created_at", { ascending: false })
            .limit(10000);
          exportData.ventes = data ?? [];
          break;
        }
        case "clients": {
          const { data } = await supabase
            .from("clients")
            .select("nom, prenom, telephone, email, solde_prepaye, points_fidelite, created_at")
            .eq("etablissement_id", etablissementId)
            .order("nom");
          exportData.clients = data ?? [];
          break;
        }
        case "utilisateurs": {
          const { data } = await supabase
            .from("utilisateurs")
            .select("nom, prenom, email, role, actif, created_at")
            .eq("etablissement_id", etablissementId)
            .order("nom");
          exportData.utilisateurs = data ?? [];
          break;
        }
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = etab.nom.toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (validated.data.format === "json") {
      return {
        success: true,
        data: {
          content: JSON.stringify(exportData, null, 2),
          filename: `export-${slug}-${dateStr}.json`,
          mimeType: "application/json",
        },
      };
    }

    // Format CSV : on concatène toutes les sections
    const csvParts: string[] = [];

    for (const [sectionName, rows] of Object.entries(exportData)) {
      if (rows.length === 0) continue;

      csvParts.push(`--- ${sectionName.toUpperCase()} ---`);

      // En-têtes
      const headers = Object.keys(rows[0] as Record<string, unknown>);
      csvParts.push(headers.join(";"));

      // Lignes
      for (const row of rows) {
        const values = headers.map((h) => {
          const val = (row as Record<string, unknown>)[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          // Échapper les valeurs contenant des points-virgules ou guillemets
          if (str.includes(";") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvParts.push(values.join(";"));
      }

      csvParts.push(""); // Ligne vide entre sections
    }

    return {
      success: true,
      data: {
        content: csvParts.join("\n"),
        filename: `export-${slug}-${dateStr}.csv`,
        mimeType: "text/csv",
      },
    };
  } catch (error) {
    console.error("Erreur exportEtablissementData:", error);
    return { success: false, error: "Erreur lors de l'export des données" };
  }
}
