/**
 * API Route - Recuperer l'utilisateur courant
 *
 * GET /api/auth/me
 *
 * Retourne les donnees de l'utilisateur authentifie
 * ou null si non connecte.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[API /auth/me] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de l'utilisateur" },
      { status: 500 }
    );
  }
}
