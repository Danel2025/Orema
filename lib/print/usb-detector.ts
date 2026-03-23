/**
 * Module de detection automatique d'imprimantes USB
 * Detecte les ports COM/USB disponibles sous Windows et Linux
 *
 * SECURITE : Utilise execFileSync au lieu de execSync pour eviter
 * l'interpretation shell et les injections de commande.
 * Tous les inputs sont valides par regex stricte avant utilisation.
 *
 * @module lib/print/usb-detector
 */

import { execFileSync } from "child_process";
import { promises as fs } from "fs";

/**
 * Regex de validation stricte pour les chemins de peripheriques
 */
const COM_PORT_REGEX = /^COM\d{1,3}$/i;
const DEV_PATH_REGEX =
  /^\/dev\/(ttyUSB\d{1,3}|ttyACM\d{1,3}|usb\/lp\d{1,3}|cu\.(usbserial|usbmodem)[\w.-]*)$/;

/**
 * Peripherique USB detecte
 */
export interface DetectedUSBDevice {
  /** Chemin du peripherique (COM3, /dev/ttyUSB0, etc.) */
  path: string;
  /** Nom du fabricant si disponible */
  manufacturer?: string;
  /** Description du peripherique */
  description?: string;
  /** Type de connexion detecte */
  type: "COM" | "ttyUSB" | "ttyACM" | "lp";
}

/**
 * Resultat du scan USB
 */
export interface USBScanResult {
  success: boolean;
  devices: DetectedUSBDevice[];
  platform: string;
  error?: string;
  duration?: number;
}

/**
 * Detecte les peripheriques USB selon la plateforme
 */
export async function detectUSBDevices(): Promise<USBScanResult> {
  const startTime = Date.now();
  const platform = process.platform;

  try {
    let devices: DetectedUSBDevice[] = [];

    if (platform === "win32") {
      devices = await detectCOMPortsWindows();
    } else if (platform === "linux") {
      devices = await detectUSBPortsLinux();
    } else if (platform === "darwin") {
      devices = await detectUSBPortsMacOS();
    } else {
      return {
        success: false,
        devices: [],
        platform,
        error: `Plateforme non supportee: ${platform}`,
      };
    }

    return {
      success: true,
      devices,
      platform,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      devices: [],
      platform,
      error: error instanceof Error ? error.message : "Erreur lors du scan USB",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Detecte les ports COM sous Windows via PowerShell
 *
 * SECURITE : Utilise execFileSync avec les arguments en tableau
 * pour eviter l'injection de commande via le shell.
 * Le nom du port est valide par COM_PORT_REGEX avant utilisation.
 */
async function detectCOMPortsWindows(): Promise<DetectedUSBDevice[]> {
  const devices: DetectedUSBDevice[] = [];

  try {
    // execFileSync avec arguments en tableau : pas d'interpretation shell
    const portsOutput = execFileSync(
      "powershell",
      ["-NoProfile", "-Command", "[System.IO.Ports.SerialPort]::GetPortNames()"],
      { encoding: "utf-8", timeout: 5000, windowsHide: true }
    );

    const ports = portsOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => COM_PORT_REGEX.test(line));

    // Pour chaque port valide, essayer d'obtenir plus d'infos
    for (const port of ports) {
      const device: DetectedUSBDevice = {
        path: port.toUpperCase(),
        type: "COM",
      };

      // Obtenir la description via WMI avec execFileSync (pas d'injection)
      try {
        // Le port est valide par COM_PORT_REGEX, mais on utilise execFileSync
        // avec arguments en tableau pour defense en profondeur
        const wmiCommand = `Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -like '*${port}*' } | Select-Object -First 1 -ExpandProperty Name`;
        const wmiOutput = execFileSync("powershell", ["-NoProfile", "-Command", wmiCommand], {
          encoding: "utf-8",
          timeout: 5000,
          windowsHide: true,
        });
        const description = wmiOutput.trim();
        if (description) {
          device.description = description;
          // Extraire le fabricant du nom si possible
          const match = description.match(/^(.+?)\s+\(/);
          if (match) {
            device.manufacturer = match[1];
          }
        }
      } catch {
        // Pas grave si on n'obtient pas la description
      }

      devices.push(device);
    }
  } catch (error) {
    console.error("[USB Detection Windows] Erreur PowerShell:", error);

    // Fallback: utiliser mode.com via execFileSync
    try {
      const modeOutput = execFileSync("mode", [], {
        encoding: "utf-8",
        timeout: 5000,
        windowsHide: true,
      });

      const comMatches = modeOutput.match(/COM\d+/gi);
      if (comMatches) {
        const uniquePorts = [...new Set(comMatches)];
        for (const port of uniquePorts) {
          if (COM_PORT_REGEX.test(port)) {
            devices.push({
              path: port.toUpperCase(),
              type: "COM",
            });
          }
        }
      }
    } catch {
      console.error("[USB Detection Windows] Fallback mode.com echoue");
    }
  }

  return devices;
}

/**
 * Detecte les peripheriques USB sous Linux
 *
 * SECURITE : Les chemins proviennent de readdir filtre par regex.
 * udevadm est appele via execFileSync avec arguments en tableau.
 */
async function detectUSBPortsLinux(): Promise<DetectedUSBDevice[]> {
  const devices: DetectedUSBDevice[] = [];

  // 1. Scanner /dev/ttyUSB* (adaptateurs USB-Serie comme PL2303, CH340)
  try {
    const devFiles = await fs.readdir("/dev");
    const ttyUSBDevices = devFiles
      .filter((name) => /^ttyUSB\d+$/.test(name))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/${name}`,
          type: "ttyUSB",
          description: "Adaptateur USB-Serie",
        })
      );
    devices.push(...ttyUSBDevices);
  } catch {
    // /dev non lisible ou pas de ttyUSB
  }

  // 2. Scanner /dev/ttyACM* (CDC-ACM comme Arduino)
  try {
    const devFiles = await fs.readdir("/dev");
    const ttyACMDevices = devFiles
      .filter((name) => /^ttyACM\d+$/.test(name))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/${name}`,
          type: "ttyACM",
          description: "Peripherique USB CDC-ACM",
        })
      );
    devices.push(...ttyACMDevices);
  } catch {
    // Pas de ttyACM
  }

  // 3. Scanner /dev/usb/lp* (imprimantes USB directes)
  try {
    const usbFiles = await fs.readdir("/dev/usb");
    const lpDevices = usbFiles
      .filter((name) => /^lp\d+$/.test(name))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/usb/${name}`,
          type: "lp",
          description: "Imprimante USB",
        })
      );
    devices.push(...lpDevices);
  } catch {
    // /dev/usb n'existe pas ou pas d'imprimantes
  }

  // 4. Enrichir avec udevadm si disponible
  //    SECURITE : execFileSync avec arguments en tableau + validation du chemin
  for (const device of devices) {
    // Valider le chemin du peripherique par regex avant de le passer a udevadm
    if (!DEV_PATH_REGEX.test(device.path)) {
      continue;
    }

    try {
      const udevOutput = execFileSync(
        "udevadm",
        ["info", "--query=property", `--name=${device.path}`],
        { encoding: "utf-8", timeout: 5000 }
      );

      const vendorMatch = udevOutput.match(/ID_VENDOR=(.+)/);
      const modelMatch = udevOutput.match(/ID_MODEL=(.+)/);

      if (vendorMatch) {
        device.manufacturer = vendorMatch[1].replace(/_/g, " ");
      }
      if (modelMatch) {
        device.description = modelMatch[1].replace(/_/g, " ");
      }
    } catch {
      // udevadm non disponible ou erreur
    }
  }

  return devices;
}

/**
 * Detecte les peripheriques USB sous macOS
 */
async function detectUSBPortsMacOS(): Promise<DetectedUSBDevice[]> {
  const devices: DetectedUSBDevice[] = [];

  // Scanner /dev/cu.* (ports serie callout)
  try {
    const devFiles = await fs.readdir("/dev");
    const cuDevices = devFiles
      .filter((name) => /^cu\.(usbserial|usbmodem)/i.test(name))
      .map(
        (name): DetectedUSBDevice => ({
          path: `/dev/${name}`,
          type: "ttyUSB",
          description: "Port serie USB",
        })
      );
    devices.push(...cuDevices);
  } catch {
    // Erreur de lecture
  }

  return devices;
}

/**
 * Verifie si un peripherique USB est accessible
 *
 * SECURITE : Valide le chemin par regex avant de tester l'acces.
 * Seuls les chemins de peripheriques connus sont acceptes.
 */
export async function testUSBDevice(devicePath: string): Promise<boolean> {
  // Valider que le chemin correspond a un peripherique connu
  if (!devicePath || typeof devicePath !== "string") {
    return false;
  }

  // Verifier que le chemin est un peripherique autorise (COM sous Windows, /dev/ sous Linux/macOS)
  const isValidDevicePath = COM_PORT_REGEX.test(devicePath) || DEV_PATH_REGEX.test(devicePath);

  if (!isValidDevicePath) {
    return false;
  }

  try {
    await fs.access(devicePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
