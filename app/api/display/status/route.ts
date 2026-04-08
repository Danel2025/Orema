/**
 * API Route pour mettre a jour le statut de preparation depuis un ecran d'affichage
 * POST /api/display/status
 * Body: { token, ligneVenteIds, statut }
 *
 * Pas de session utilisateur - valide le token de l'ecran
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { StatutPreparation } from "@/lib/db/types";
import { z } from "zod";

const VALID_STATUTS = ["EN_ATTENTE", "EN_PREPARATION", "PRETE", "SERVIE"] as const;

const VALID_TRANSITIONS: Record<StatutPreparation, StatutPreparation[]> = {
  EN_ATTENTE: ["EN_PREPARATION"],
  EN_PREPARATION: ["PRETE", "EN_ATTENTE"],
  PRETE: ["SERVIE", "EN_ATTENTE"],
  SERVIE: ["EN_ATTENTE"],
};

const StatusUpdateSchema = z.object({
  token: z.string().min(1, "Token manquant"),
  ligneVenteIds: z.array(z.string().uuid("ID de ligne invalide")).min(1).max(100),
  statut: z.enum(VALID_STATUTS),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = StatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const { token, ligneVenteIds, statut } = parsed.data;

    const supabase = createServiceClient();

    // Valider le token
    const { data: tokenResult, error: tokenError } = await supabase.rpc(
      "validate_display_token",
      { p_token: token }
    );

    if (tokenError) {
      console.error("[display/status] RPC Error:", tokenError);
      return NextResponse.json({ error: "Erreur de validation" }, { status: 500 });
    }

    const validation = tokenResult as {
      valid: boolean;
      error?: string;
      etablissement_id?: string;
    };

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Token invalide" }, { status: 401 });
    }

    const etablissementId = validation.etablissement_id!;
    const newStatut = statut as StatutPreparation;

    // Recuperer les lignes pour verifier l'appartenance et les transitions
    const { data: lignes, error: fetchError } = await supabase
      .from("lignes_vente")
      .select("id, statut_preparation, vente_id, ventes!inner(etablissement_id)")
      .in("id", ligneVenteIds);

    if (fetchError) {
      console.error("[display/status] Fetch error:", fetchError);
      return NextResponse.json({ error: "Erreur de recuperation" }, { status: 500 });
    }

    if (!lignes || lignes.length === 0) {
      return NextResponse.json({ error: "Aucune ligne trouvee" }, { status: 404 });
    }

    // Verifier l'appartenance a l'etablissement
    const invalidLines = lignes.filter((l) => {
      const vente = l.ventes as unknown as { etablissement_id: string };
      return vente.etablissement_id !== etablissementId;
    });

    if (invalidLines.length > 0) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Verifier les transitions valides
    const invalidTransitions = lignes.filter(
      (l) => !VALID_TRANSITIONS[l.statut_preparation as StatutPreparation]?.includes(newStatut)
    );

    if (invalidTransitions.length > 0) {
      return NextResponse.json(
        {
          error: `Transition invalide pour ${invalidTransitions.length} ligne(s)`,
        },
        { status: 400 }
      );
    }

    // Mettre a jour les lignes
    const validIds = lignes.map((l) => l.id);
    const { error: updateError } = await supabase
      .from("lignes_vente")
      .update({
        statut_preparation: newStatut,
        updated_at: new Date().toISOString(),
      })
      .in("id", validIds);

    if (updateError) {
      console.error("[display/status] Update error:", updateError);
      return NextResponse.json({ error: "Erreur de mise a jour" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { count: validIds.length } });
  } catch (error) {
    console.error("[display/status] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
