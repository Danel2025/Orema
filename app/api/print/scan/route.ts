/**
 * API Route pour scanner le réseau et détecter les imprimantes
 *
 * Scanne les adresses IP du réseau local sur plusieurs ports courants
 * pour imprimantes thermiques et réseau.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as os from "os";
import { getCurrentUser } from "@/lib/auth";

/**
 * Ports courants pour imprimantes réseau :
 * - 9100 : Raw/JetDirect (ESC/POS, la majorite des imprimantes thermiques)
 * - 515  : LPD/LPR (Line Printer Daemon)
 * - 631  : IPP (Internet Printing Protocol / CUPS)
 * - 80   : HTTP (imprimantes avec interface web, Star Cloud, etc.)
 * - 443  : HTTPS (imprimantes avec interface web securisee)
 * - 8008 : HTTP alternatif (certaines imprimantes Star, Epson)
 * - 8043 : HTTPS alternatif
 */
const DEFAULT_PRINTER_PORTS = [9100, 631, 515];
const EXTENDED_PRINTER_PORTS = [9100, 631, 515, 80, 443, 8008, 8043];
const SCAN_TIMEOUT = 500; // 500ms par IP/port
const MAX_PARALLEL_SCANS = 50; // Limiter les connexions parallèles

interface DetectedPrinter {
  ip: string;
  port: number;
  /** Label lisible du protocole */
  protocol: string;
}

interface ScanResult {
  success: boolean;
  /** Liste simple d'IPs (retro-compatible) */
  printers?: string[];
  /** Liste detaillee avec port et protocole */
  detectedPrinters?: DetectedPrinter[];
  error?: string;
  scannedCount?: number;
  duration?: number;
  portsScanned?: number[];
}

export async function POST(request: NextRequest): Promise<NextResponse<ScanResult>> {
  const startTime = Date.now();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
    }

    // Network scan is restricted to ADMIN, MANAGER, and SUPER_ADMIN roles
    const allowedRoles = ["ADMIN", "MANAGER", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 });
    }

    // Lire les options du body (optionnel)
    let portsToScan = DEFAULT_PRINTER_PORTS;
    let extendedScan = false;
    try {
      const body = await request.json();
      if (body?.ports && Array.isArray(body.ports)) {
        // Ports custom fournis par le client
        portsToScan = body.ports
          .filter((p: unknown) => typeof p === "number" && p > 0 && p <= 65535)
          .slice(0, 10); // Max 10 ports pour limiter le temps
      }
      if (body?.extended) {
        portsToScan = EXTENDED_PRINTER_PORTS;
        extendedScan = true;
      }
    } catch {
      // Pas de body ou body invalide → utiliser les ports par defaut
    }

    // Obtenir les interfaces réseau
    const networkInfo = getLocalNetworkInfo();

    if (!networkInfo) {
      return NextResponse.json({
        success: false,
        error: "Impossible de détecter le réseau local",
      });
    }

    const { baseIP, startRange, endRange } = networkInfo;

    // Générer les IPs à scanner
    const ipsToScan: string[] = [];
    for (let i = startRange; i <= endRange; i++) {
      ipsToScan.push(`${baseIP}.${i}`);
    }

    // Scanner les IPs sur tous les ports en parallèle (par lots)
    const detectedPrinters: DetectedPrinter[] = [];
    const foundIPs = new Set<string>();
    let scannedCount = 0;

    // Generer toutes les combinaisons IP:port
    const scanTasks: { ip: string; port: number }[] = [];
    for (const ip of ipsToScan) {
      for (const port of portsToScan) {
        scanTasks.push({ ip, port });
      }
    }

    for (let i = 0; i < scanTasks.length; i += MAX_PARALLEL_SCANS) {
      const batch = scanTasks.slice(i, i + MAX_PARALLEL_SCANS);
      const results = await Promise.all(
        batch.map(async ({ ip, port }) => {
          const isOpen = await testPort(ip, port, SCAN_TIMEOUT);
          scannedCount++;
          return { ip, port, isOpen };
        })
      );

      for (const result of results) {
        if (result.isOpen) {
          foundIPs.add(result.ip);
          detectedPrinters.push({
            ip: result.ip,
            port: result.port,
            protocol: getProtocolLabel(result.port),
          });
        }
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      // Retro-compatible : liste d'IPs uniques
      printers: Array.from(foundIPs),
      // Nouveau : details complets
      detectedPrinters,
      scannedCount,
      duration,
      portsScanned: portsToScan,
    });
  } catch (error) {
    console.error("[API Scan] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors du scan",
      },
      { status: 500 }
    );
  }
}

/**
 * Retourne un label lisible pour un port d'impression
 */
function getProtocolLabel(port: number): string {
  switch (port) {
    case 9100:
      return "RAW/JetDirect (impression directe ESC/POS)";
    case 515:
      return "LPD/LPR (impression reseau classique)";
    case 631:
      return "IPP/CUPS (Canon, HP, Epson, Brother, etc.)";
    case 80:
      return "HTTP (interface web imprimante)";
    case 443:
      return "HTTPS (interface web securisee)";
    case 8008:
      return "HTTP alt (Star, Epson Cloud)";
    case 8043:
      return "HTTPS alt (Star, Epson Cloud)";
    default:
      return `Port ${port}`;
  }
}

/**
 * Obtenir les informations du réseau local
 */
function getLocalNetworkInfo(): { baseIP: string; startRange: number; endRange: number } | null {
  const interfaces = os.networkInterfaces();

  for (const [, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue;

    for (const addr of addresses) {
      // Ignorer les adresses IPv6 et loopback
      if (addr.family === "IPv4" && !addr.internal) {
        const ip = addr.address;
        const netmask = addr.netmask;

        // Pour un masque /24 typique (255.255.255.0)
        if (netmask === "255.255.255.0") {
          const parts = ip.split(".");
          const baseIP = `${parts[0]}.${parts[1]}.${parts[2]}`;

          return {
            baseIP,
            startRange: 1,
            endRange: 254,
          };
        }

        // Pour d'autres masques, utiliser une plage réduite
        const parts = ip.split(".");
        const baseIP = `${parts[0]}.${parts[1]}.${parts[2]}`;
        const currentOctet = parseInt(parts[3], 10);

        return {
          baseIP,
          startRange: Math.max(1, currentOctet - 50),
          endRange: Math.min(254, currentOctet + 50),
        };
      }
    }
  }

  return null;
}

/**
 * Tester si un port est ouvert sur une IP
 */
async function testPort(ip: string, port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Import dynamique pour éviter les erreurs côté client
    import("net")
      .then((net) => {
        const socket = new net.Socket();

        const timeoutId = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, timeout);

        socket.connect(port, ip, () => {
          clearTimeout(timeoutId);
          socket.destroy();
          resolve(true);
        });

        socket.on("error", () => {
          clearTimeout(timeoutId);
          socket.destroy();
          resolve(false);
        });
      })
      .catch(() => {
        resolve(false);
      });
  });
}
