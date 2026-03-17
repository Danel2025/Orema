/**
 * API Route pour tester la connexion à une imprimante
 */

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

interface TestConnectionBody {
  typeConnexion: "USB" | "RESEAU" | "SERIE" | "BLUETOOTH";
  adresseIp?: string;
  port?: number;
  pathUsb?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
    }

    const body = (await request.json()) as TestConnectionBody;
    const { typeConnexion, adresseIp, port, pathUsb } = body;

    switch (typeConnexion) {
      case "RESEAU":
        return testNetworkConnection(adresseIp, port || 9100);
      case "USB":
        return testUSBConnection(pathUsb);
      case "SERIE":
        return NextResponse.json({
          success: false,
          error: "La connexion série n'est pas encore supportée",
        });
      case "BLUETOOTH":
        return NextResponse.json({
          success: false,
          error: "La connexion Bluetooth n'est pas encore supportée",
        });
      default:
        return NextResponse.json({
          success: false,
          error: "Type de connexion non reconnu",
        }, { status: 400 });
    }
  } catch (error) {
    console.error("[API Test Connection] Erreur:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne",
    }, { status: 500 });
  }
}

async function testNetworkConnection(
  ip: string | undefined,
  port: number
): Promise<NextResponse> {
  if (!ip) {
    return NextResponse.json({
      success: false,
      error: "Adresse IP requise",
    }, { status: 400 });
  }

  // Valider le format de l'IP
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return NextResponse.json({
      success: false,
      error: "Format d'adresse IP invalide",
    });
  }

  try {
    const net = await import("net");
    const timeout = 3000;

    const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const socket = new net.Socket();

      const timeoutId = setTimeout(() => {
        socket.destroy();
        resolve({
          success: false,
          error: `Timeout: l'imprimante ne répond pas (${ip}:${port})`,
        });
      }, timeout);

      socket.connect(port, ip, () => {
        clearTimeout(timeoutId);
        socket.destroy();
        resolve({ success: true });
      });

      socket.on("error", (err) => {
        clearTimeout(timeoutId);
        socket.destroy();

        let errorMessage = `Connexion impossible à ${ip}:${port}`;
        if (err.message.includes("ECONNREFUSED")) {
          errorMessage = `Port ${port} fermé ou imprimante éteinte`;
        } else if (err.message.includes("ETIMEDOUT")) {
          errorMessage = `Timeout: vérifiez que l'IP ${ip} est correcte`;
        } else if (err.message.includes("ENETUNREACH")) {
          errorMessage = `Réseau inaccessible: vérifiez votre connexion`;
        }

        resolve({ success: false, error: errorMessage });
      });
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Connexion réussie à ${ip}:${port}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Erreur: ${error instanceof Error ? error.message : "Inconnue"}`,
    });
  }
}

async function testUSBConnection(
  path: string | undefined
): Promise<NextResponse> {
  if (!path) {
    return NextResponse.json({
      success: false,
      error: "Chemin USB requis",
    }, { status: 400 });
  }

  try {
    const fs = await import("fs/promises");
    await fs.access(path);

    return NextResponse.json({
      success: true,
      message: `Périphérique ${path} accessible`,
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: `Périphérique USB non trouvé: ${path}`,
    });
  }
}
