"use client";

/**
 * Module Web Bluetooth API pour imprimantes thermiques ESC/POS
 *
 * Permet la communication directe navigateur → imprimante Bluetooth
 * via la Web Bluetooth API (Chrome 56+).
 *
 * Compatible avec les imprimantes thermiques BLE qui utilisent
 * le profil SPP (Serial Port Profile) ou un service GATT custom.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
 */

import type { PrintResult } from "./types";

// UUIDs de services Bluetooth pour imprimantes thermiques
// Les imprimantes BLE exposent generalement un service SPP emule
const PRINTER_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Generic Printer Service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Custom BLE printer service (courant)
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Microchip ISSC SPP-like
  "0000ff00-0000-1000-8000-00805f9b34fb", // Custom 0xFF00 (Goojprt, Peripage, etc.)
  "0000fee7-0000-1000-8000-00805f9b34fb", // Tencent service (certaines imprimantes chinoises)
];

// UUIDs de characteristiques d'ecriture courantes
const PRINTER_WRITE_CHAR_UUIDS = [
  "00002af1-0000-1000-8000-00805f9b34fb", // Generic Write
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f", // Custom BLE write
  "49535343-8841-43f4-a8d4-ecbe34729bb3", // Microchip ISSC TX
  "0000ff02-0000-1000-8000-00805f9b34fb", // Custom 0xFF02 write
];

/**
 * Taille max d'un paquet BLE (la plupart des imprimantes acceptent 20 bytes)
 * Certaines modernes acceptent jusqu'a 512 bytes via MTU negociation
 */
const BLE_MAX_CHUNK_SIZE = 100;

/**
 * Delai entre les chunks pour eviter la saturation du buffer BLE
 */
const BLE_CHUNK_DELAY_MS = 25;

/**
 * Informations sur un peripherique Bluetooth detecte
 */
export interface WebBluetoothDeviceInfo {
  device: BluetoothDevice;
  name: string;
  id: string;
  connected: boolean;
  server?: BluetoothRemoteGATTServer;
  writeCharacteristic?: BluetoothRemoteGATTCharacteristic;
}

/**
 * Verifie si le navigateur supporte la Web Bluetooth API
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Demande a l'utilisateur de selectionner une imprimante Bluetooth
 * Requiert un geste utilisateur (clic)
 */
export async function requestBluetoothPrinter(): Promise<WebBluetoothDeviceInfo | null> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "Web Bluetooth API non supportee. Utilisez Chrome 56+ avec le Bluetooth active."
    );
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      // Accepter tout peripherique avec un nom (la plupart des imprimantes)
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS,
    });

    return {
      device,
      name: device.name || "Imprimante Bluetooth",
      id: device.id,
      connected: false,
    };
  } catch (error) {
    // L'utilisateur a annule
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null;
    }
    throw error;
  }
}

/**
 * Se connecte a un peripherique Bluetooth et decouvre le service d'impression
 */
export async function connectBluetoothPrinter(
  deviceInfo: WebBluetoothDeviceInfo
): Promise<WebBluetoothDeviceInfo> {
  const { device } = deviceInfo;

  if (!device.gatt) {
    throw new Error("GATT non disponible sur ce peripherique");
  }

  // Connexion au serveur GATT
  const server = await device.gatt.connect();

  // Chercher le service d'impression parmi les services connus
  let writeCharacteristic: BluetoothRemoteGATTCharacteristic | undefined;

  for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid);

      // Chercher la characteristique d'ecriture
      for (const charUuid of PRINTER_WRITE_CHAR_UUIDS) {
        try {
          const char = await service.getCharacteristic(charUuid);
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        } catch {
          // Ce UUID n'existe pas dans ce service, continuer
        }
      }

      // Si pas trouve par UUID, chercher toute characteristique ecrivable
      if (!writeCharacteristic) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        }
      }

      if (writeCharacteristic) break;
    } catch {
      // Ce service n'existe pas, essayer le suivant
    }
  }

  if (!writeCharacteristic) {
    // Dernier recours : scanner tous les services
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        }
        if (writeCharacteristic) break;
      }
    } catch {
      // Impossible de lister tous les services
    }
  }

  if (!writeCharacteristic) {
    server.disconnect();
    throw new Error(
      "Aucune characteristique d'ecriture trouvee. Cette imprimante n'est peut-etre pas compatible."
    );
  }

  return {
    ...deviceInfo,
    connected: true,
    server,
    writeCharacteristic,
  };
}

/**
 * Deconnecte une imprimante Bluetooth
 */
export function disconnectBluetoothPrinter(deviceInfo: WebBluetoothDeviceInfo): void {
  if (deviceInfo.server?.connected) {
    deviceInfo.server.disconnect();
  }
}

/**
 * Envoie des donnees ESC/POS via Bluetooth
 * Les donnees sont decoupees en chunks car BLE a une taille max de paquet
 */
export async function writeToBluetoothPrinter(
  deviceInfo: WebBluetoothDeviceInfo,
  data: Uint8Array | string
): Promise<void> {
  if (!deviceInfo.writeCharacteristic) {
    throw new Error("Imprimante non connectee ou characteristique non trouvee");
  }

  const buffer = typeof data === "string" ? new TextEncoder().encode(data) : data;

  const char = deviceInfo.writeCharacteristic;
  const useWriteWithoutResponse = char.properties.writeWithoutResponse;

  // Decouper en chunks
  for (let offset = 0; offset < buffer.length; offset += BLE_MAX_CHUNK_SIZE) {
    const chunk = buffer.slice(offset, offset + BLE_MAX_CHUNK_SIZE);

    if (useWriteWithoutResponse) {
      await char.writeValueWithoutResponse(chunk);
    } else {
      await char.writeValueWithResponse(chunk);
    }

    // Petit delai entre les chunks pour eviter la saturation
    if (offset + BLE_MAX_CHUNK_SIZE < buffer.length) {
      await new Promise((resolve) => setTimeout(resolve, BLE_CHUNK_DELAY_MS));
    }
  }
}

/**
 * Envoie des commandes ESC/POS a une imprimante Bluetooth
 * Gere la connexion, l'envoi et les erreurs
 */
export async function sendViaWebBluetooth(
  deviceInfo: WebBluetoothDeviceInfo,
  data: Uint8Array | string
): Promise<PrintResult> {
  try {
    // Se connecter si necessaire
    let connectedDevice = deviceInfo;
    if (!deviceInfo.connected || !deviceInfo.writeCharacteristic) {
      connectedDevice = await connectBluetoothPrinter(deviceInfo);
    }

    // Envoyer les donnees
    await writeToBluetoothPrinter(connectedDevice, data);

    return {
      success: true,
      message: `Impression envoyee via Bluetooth a "${connectedDevice.name}"`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur Bluetooth inconnue";
    return {
      success: false,
      error: `Erreur d'impression Bluetooth: ${errorMsg}`,
    };
  }
}

/**
 * Teste la connexion Bluetooth en envoyant un INIT ESC/POS
 */
export async function testBluetoothConnection(
  deviceInfo: WebBluetoothDeviceInfo
): Promise<PrintResult> {
  try {
    let connectedDevice = deviceInfo;
    if (!deviceInfo.connected || !deviceInfo.writeCharacteristic) {
      connectedDevice = await connectBluetoothPrinter(deviceInfo);
    }

    // Envoyer ESC @ (reset)
    const INIT_COMMAND = new Uint8Array([0x1b, 0x40]);
    await writeToBluetoothPrinter(connectedDevice, INIT_COMMAND);

    return {
      success: true,
      message: `Connexion Bluetooth a "${connectedDevice.name}" reussie`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      error: `Test Bluetooth echoue: ${errorMsg}`,
    };
  }
}

/**
 * Ecoute les evenements de deconnexion d'un peripherique Bluetooth
 */
export function onBluetoothDisconnect(device: BluetoothDevice, callback: () => void): () => void {
  const handler = () => callback();
  device.addEventListener("gattserverdisconnected", handler);
  return () => {
    device.removeEventListener("gattserverdisconnected", handler);
  };
}
