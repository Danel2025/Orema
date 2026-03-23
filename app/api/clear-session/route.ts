import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route API pour nettoyer toutes les sessions (custom JWT + Supabase Auth)
 * POST uniquement - le GET a ete supprime pour eviter les attaques CSRF
 */

export async function POST(request: NextRequest) {
  try {
    // Verify Origin to prevent CSRF attacks
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host.split(":")[0])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cookieStore = await cookies();

    // 1. Supprimer la session custom JWT
    cookieStore.delete("orema_session");
    cookieStore.set("orema_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    // 2. Deconnecter de Supabase Auth (supprime les cookies sb-*)
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignorer les erreurs de signOut (session peut deja etre invalide)
    }

    // 3. Supprimer manuellement les cookies Supabase connus
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-")) {
        cookieStore.delete(cookie.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: "All sessions cleared successfully",
    });
  } catch (error) {
    console.error("[clear-session] Error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear session",
      },
      { status: 500 }
    );
  }
}
