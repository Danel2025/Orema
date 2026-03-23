/**
 * API Route pour envoyer des donnees ESC/POS raw a une imprimante reseau
 *
 * Utilisee par le WebPrinterManager comme fallback quand l'imprimante
 * est connectee en reseau (TCP/IP) et que l'envoi se fait via le serveur.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, createClient } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { printerId, data } = body as { printerId: string; data: string };

    if (!printerId || !data) {
      return NextResponse.json(
        { success: false, error: "printerId et data requis" },
        { status: 400 }
      );
    }

    // Recuperer la config de l'imprimante
    const supabase = await createClient();
    const printer = await db.getImprimanteById(supabase, printerId);

    if (!printer) {
      return NextResponse.json(
        { success: false, error: "Imprimante non trouvee", printerId },
        { status: 404 }
      );
    }

    if (printer.type_connexion !== "RESEAU") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cette route ne supporte que les imprimantes reseau. Utilisez Web Serial/Bluetooth pour USB/Serie/BT.",
          printerId,
        },
        { status: 400 }
      );
    }

    if (!printer.adresse_ip) {
      return NextResponse.json(
        { success: false, error: "Adresse IP non configuree", printerId },
        { status: 400 }
      );
    }

    // Decoder les donnees base64
    const buffer = Buffer.from(data, "base64");
    const port = printer.port || 9100;
    const address = printer.adresse_ip;

    // Envoyer via TCP
    const net = await import("net");

    const result = await new Promise<{ success: boolean; error?: string; message?: string }>(
      (resolve) => {
        const socket = new net.Socket();

        const timeoutId = setTimeout(() => {
          socket.destroy();
          resolve({
            success: false,
            error: `Timeout de connexion a ${address}:${port}`,
          });
        }, 5000);

        socket.connect(port, address, () => {
          socket.write(buffer, () => {
            clearTimeout(timeoutId);
            socket.end();
            resolve({
              success: true,
              message: `Impression envoyee a ${printer.nom} (${address}:${port})`,
            });
          });
        });

        socket.on("error", (err) => {
          clearTimeout(timeoutId);
          socket.destroy();
          resolve({
            success: false,
            error: `Erreur de connexion: ${err.message}`,
          });
        });
      }
    );

    return NextResponse.json({ ...result, printerId });
  } catch (error) {
    console.error("[API Send Raw] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}
