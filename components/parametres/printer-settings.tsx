"use client";

/**
 * PrinterSettings - Gestion des imprimantes
 * Avec test de connexion et affichage des catégories associées
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Card,
  Flex,
  Text,
  TextField,
  Select,
  Switch,
  Button,
  Dialog,
  Table,
  Badge,
  IconButton,
  Callout,
  Tooltip,
} from "@radix-ui/themes";
import {
  Printer,
  Plus,
  Pencil,
  Trash2,
  Wifi,
  Usb,
  Bluetooth,
  Cable,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TestTube,
  X,
  Zap,
  Search,
  Tag,
  Unplug,
  Link2,
  MonitorSmartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useWebPrinter } from "@/hooks/useWebPrinter";
import type { WebSerialPortInfo } from "@/lib/print/web-serial";
import type { WebBluetoothDeviceInfo } from "@/lib/print/web-bluetooth";

import {
  createImprimante,
  updateImprimante,
  deleteImprimante,
  toggleImprimanteActif,
} from "@/actions/parametres";
import {
  imprimanteSchema,
  typeConnexionOptions,
  typeImprimanteOptions,
  largeurPapierOptions,
  type ImprimanteFormData,
} from "@/schemas/parametres.schema";

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
}

interface Imprimante {
  id: string;
  nom: string;
  type: "TICKET" | "CUISINE" | "BAR";
  typeConnexion: "USB" | "RESEAU" | "SERIE" | "BLUETOOTH" | "SYSTEME";
  adresseIp?: string | null;
  port?: number | null;
  pathUsb?: string | null;
  largeurPapier: number;
  actif: boolean;
  categories?: Categorie[];
}

interface PrinterSettingsProps {
  initialData: Imprimante[];
}

// Icone de connexion selon le type
const getConnexionIcon = (type: string) => {
  switch (type) {
    case "RESEAU":
      return <Wifi size={14} />;
    case "USB":
      return <Usb size={14} />;
    case "BLUETOOTH":
      return <Bluetooth size={14} />;
    case "SERIE":
      return <Cable size={14} />;
    case "SYSTEME":
      return <MonitorSmartphone size={14} />;
    default:
      return null;
  }
};

// Couleur du badge selon le type d'imprimante
const getTypeBadgeColor = (type: string): "violet" | "blue" | "purple" => {
  switch (type) {
    case "TICKET":
      return "violet";
    case "CUISINE":
      return "blue";
    case "BAR":
      return "purple";
    default:
      return "violet";
  }
};

export function PrinterSettings({ initialData }: PrinterSettingsProps) {
  const [imprimantes, setImprimantes] = useState<Imprimante[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Imprimante | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [scanDetails, setScanDetails] = useState<{ ip: string; port: number; protocol: string }[]>([]);
  const [showScanDialog, setShowScanDialog] = useState(false);

  // --- Web Printer (USB/Bluetooth via navigateur) ---
  const webPrinter = useWebPrinter();
  const [showPairDialog, setShowPairDialog] = useState(false);
  const [pairingPrinterId, setPairingPrinterId] = useState<string | null>(null);
  const [pendingSerialPort, setPendingSerialPort] = useState<WebSerialPortInfo | null>(null);
  const [pendingBTDevice, setPendingBTDevice] = useState<WebBluetoothDeviceInfo | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [serialBaudRate, setSerialBaudRate] = useState(9600);

  // Detecter une imprimante USB via Web Serial API
  const handleDetectUSB = async (printerId: string) => {
    try {
      const port = await webPrinter.requestUSBPrinter(false);
      if (port) {
        setPairingPrinterId(printerId);
        setPendingSerialPort(port);
        setPendingBTDevice(null);
        setShowPairDialog(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur detection USB"
      );
    }
  };

  // Detecter une imprimante Bluetooth via Web Bluetooth API
  const handleDetectBluetooth = async (printerId: string) => {
    try {
      const device = await webPrinter.requestBTDevice();
      if (device) {
        setPairingPrinterId(printerId);
        setPendingBTDevice(device);
        setPendingSerialPort(null);
        setShowPairDialog(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur detection Bluetooth"
      );
    }
  };

  // Confirmer l'appairage
  const handleConfirmPairing = async () => {
    if (!pairingPrinterId) return;
    setIsPairing(true);

    try {
      if (pendingSerialPort) {
        await webPrinter.pairUSBPrinter(pairingPrinterId, pendingSerialPort, {
          baudRate: serialBaudRate,
        });
        toast.success(`Imprimante USB appairee : ${pendingSerialPort.label}`);
      } else if (pendingBTDevice) {
        await webPrinter.pairBTPrinter(pairingPrinterId, pendingBTDevice);
        toast.success(`Imprimante Bluetooth appairee : ${pendingBTDevice.name}`);
      }
      setShowPairDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur d'appairage"
      );
    } finally {
      setIsPairing(false);
    }
  };

  // Tester la connexion via Web APIs
  const handleWebTest = async (printerId: string) => {
    setIsTesting(printerId);
    try {
      const result = await webPrinter.test(printerId);
      if (result.success) {
        toast.success(result.message || "Connexion reussie");
      } else {
        toast.error(result.error || "Test echoue");
      }
    } catch {
      toast.error("Erreur lors du test");
    } finally {
      setIsTesting(null);
    }
  };

  // Connecter/deconnecter via Web APIs
  const handleWebConnect = async (printerId: string) => {
    const managed = webPrinter.managedPrinters.find(
      (p) => p.printerId === printerId
    );
    if (managed?.connected) {
      await webPrinter.disconnect(printerId);
      toast.info("Imprimante deconnectee");
    } else {
      const result = await webPrinter.connect(printerId);
      if (result.success) {
        toast.success(result.message || "Connecte");
      } else {
        toast.error(result.error || "Connexion echouee");
      }
    }
  };

  // Dissocier une imprimante web
  const handleUnpair = (printerId: string) => {
    webPrinter.unpairPrinter(printerId);
    toast.info("Association supprimee");
  };

  // Helper : trouver l'imprimante web associee
  const getManagedPrinter = (printerId: string) =>
    webPrinter.managedPrinters.find((p) => p.printerId === printerId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
   
  } = useForm<ImprimanteFormData>({
    resolver: zodResolver(imprimanteSchema) as any,
    defaultValues: {
      nom: "",
      type: "TICKET",
      typeConnexion: "RESEAU",
      adresseIp: "",
      port: 9100,
      pathUsb: "",
      largeurPapier: 80,
      actif: true,
    },
  });

  const typeConnexion = watch("typeConnexion");

  const openCreateDialog = () => {
    setEditingPrinter(null);
    setConnectionStatus("idle");
    setConnectionMessage("");
    reset({
      nom: "",
      type: "TICKET",
      typeConnexion: "RESEAU",
      adresseIp: "",
      port: 9100,
      pathUsb: "",
      largeurPapier: 80,
      actif: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (printer: Imprimante) => {
    setEditingPrinter(printer);
    setConnectionStatus("idle");
    setConnectionMessage("");
    reset({
      nom: printer.nom,
      type: printer.type,
      typeConnexion: printer.typeConnexion,
      adresseIp: printer.adresseIp || "",
      port: printer.port || 9100,
      pathUsb: printer.pathUsb || "",
      largeurPapier: printer.largeurPapier,
      actif: printer.actif,
    });
    setIsDialogOpen(true);
  };

  // Tester la connexion avant sauvegarde
  const handleTestConnection = async () => {
    const values = getValues();
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    setConnectionMessage("");

    try {
      const response = await fetch("/api/print/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeConnexion: values.typeConnexion,
          adresseIp: values.adresseIp,
          port: values.port,
          pathUsb: values.pathUsb,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus("success");
        setConnectionMessage(result.message || "Connexion réussie");
      } else {
        setConnectionStatus("error");
        setConnectionMessage(result.error || "Échec de la connexion");
      }
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage("Erreur lors du test de connexion");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Scanner le réseau pour trouver des imprimantes (multi-ports)
  const handleScanNetwork = async (extended: boolean = false) => {
    setIsScanning(true);
    setScanResults([]);
    setScanDetails([]);
    setShowScanDialog(true);

    try {
      const response = await fetch("/api/print/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extended }),
      });

      const result = await response.json();

      if (result.success) {
        setScanResults(result.printers || []);
        setScanDetails(result.detectedPrinters || []);
        const count = result.detectedPrinters?.length || result.printers?.length || 0;
        if (count === 0) {
          toast.info("Aucune imprimante detectee sur le reseau");
        } else {
          toast.success(`${count} imprimante(s) detectee(s)`);
        }
      } else {
        toast.error(result.error || "Erreur lors du scan");
      }
    } catch {
      toast.error("Erreur lors du scan reseau");
    } finally {
      setIsScanning(false);
    }
  };

  // Utiliser une IP/port detectee
  const handleUseDetectedIP = (ip: string, port: number = 9100) => {
    setValue("adresseIp", ip);
    setValue("port", port);
    setValue("typeConnexion", "RESEAU");
    setShowScanDialog(false);
    setIsDialogOpen(true);
    toast.success(`${ip}:${port} selectionnee`);
  };

  const onSubmit = async (data: ImprimanteFormData) => {
    setIsLoading(true);

    try {
      let result;
      if (editingPrinter) {
        result = await updateImprimante(editingPrinter.id, data);
      } else {
        result = await createImprimante(data);
      }

      if (result.success && result.data) {
        const rawData = result.data as Record<string, unknown>;
        const newPrinter: Imprimante = {
          id: rawData.id as string,
          nom: rawData.nom as string,
          type: rawData.type as "TICKET" | "CUISINE" | "BAR",
          typeConnexion: rawData.type_connexion as "USB" | "RESEAU" | "SERIE" | "BLUETOOTH" | "SYSTEME",
          adresseIp: rawData.adresse_ip as string | null,
          port: rawData.port as number | null,
          pathUsb: rawData.path_usb as string | null,
          largeurPapier: rawData.largeur_papier as number,
          actif: rawData.actif as boolean,
          categories: editingPrinter?.categories || [],
        };

        if (editingPrinter) {
          setImprimantes((prev) =>
            prev.map((p) => (p.id === editingPrinter.id ? newPrinter : p))
          );
          toast.success("Imprimante modifiée avec succès");
        } else {
          setImprimantes((prev) => [...prev, newPrinter]);
          toast.success("Imprimante ajoutée avec succès");
        }
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette imprimante ?")) {
      return;
    }

    setIsDeleting(id);

    try {
      const result = await deleteImprimante(id);

      if (result.success) {
        setImprimantes((prev) => prev.filter((p) => p.id !== id));
        toast.success("Imprimante supprimée");
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActif = async (id: string) => {
    try {
      const result = await toggleImprimanteActif(id);

      if (result.success && result.data) {
        setImprimantes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, actif: result.data!.actif } : p))
        );
        toast.success(
          result.data.actif ? "Imprimante activée" : "Imprimante désactivée"
        );
      } else {
        toast.error(result.error || "Erreur lors du changement d'état");
      }
    } catch (error) {
      toast.error("Erreur lors du changement d'état");
    }
  };

  const handleTestPrint = async (printer: Imprimante) => {
    setIsTesting(printer.id);

    try {
      const response = await fetch("/api/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "test",
          printerId: printer.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Test d'impression envoyé à "${printer.nom}"`);
      } else {
        toast.error(result.error || "Erreur lors du test d'impression");
      }
    } catch (error) {
      toast.error("Erreur de communication avec l'imprimante");
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <Flex direction="column" gap="5">
      {/* En-tête */}
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Flex direction="column" gap="1">
          <Text size="4" weight="bold">
            Imprimantes configurées
          </Text>
          <Text size="2" color="gray">
            {imprimantes.length} imprimante{imprimantes.length > 1 ? "s" : ""} configurée{imprimantes.length > 1 ? "s" : ""}
          </Text>
        </Flex>
        <Flex gap="2" wrap="wrap">
          <Button size="3" variant="soft" onClick={() => handleScanNetwork()} disabled={isScanning}>
            {isScanning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wifi size={16} />
            )}
            Reseau
          </Button>
          {webPrinter.capabilities.webSerial ? <Tooltip content="Detecter une imprimante USB connectee a cet ordinateur">
              <Button
                size="3"
                variant="soft"
                color="blue"
                onClick={async () => {
                  try {
                    const port = await webPrinter.requestUSBPrinter(false);
                    if (port) {
                      setPendingSerialPort(port);
                      setPendingBTDevice(null);
                      setPairingPrinterId(null);
                      setShowPairDialog(true);
                    }
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Erreur detection USB"
                    );
                  }
                }}
              >
                <Usb size={16} />
                USB
              </Button>
            </Tooltip> : null}
          {webPrinter.capabilities.webBluetooth ? <Tooltip content="Detecter une imprimante Bluetooth a proximite">
              <Button
                size="3"
                variant="soft"
                color="violet"
                onClick={async () => {
                  try {
                    const device = await webPrinter.requestBTDevice();
                    if (device) {
                      setPendingBTDevice(device);
                      setPendingSerialPort(null);
                      setPairingPrinterId(null);
                      setShowPairDialog(true);
                    }
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Erreur detection Bluetooth"
                    );
                  }
                }}
              >
                <Bluetooth size={16} />
                Bluetooth
              </Button>
            </Tooltip> : null}
          <Button size="3" onClick={openCreateDialog}>
            <Plus size={16} />
            Ajouter
          </Button>
        </Flex>
      </Flex>

      {/* Liste des imprimantes */}
      {imprimantes.length === 0 ? (
        <Card size="3">
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="3"
            py="6"
          >
            <Printer size={48} className="text-gray-400" />
            <Text size="3" color="gray">
              Aucune imprimante configurée
            </Text>
            <Text size="2" color="gray">
              Ajoutez votre première imprimante pour commencer à imprimer vos tickets
            </Text>
            <Flex gap="2">
              <Button size="2" variant="soft" onClick={() => handleScanNetwork()}>
                <Search size={14} />
                Detecter automatiquement
              </Button>
              <Button size="2" onClick={openCreateDialog}>
                <Plus size={14} />
                Ajouter manuellement
              </Button>
            </Flex>
          </Flex>
        </Card>
      ) : (
        <Card size="2">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Connexion</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Catégories</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {imprimantes.map((printer) => (
                <Table.Row key={printer.id}>
                  <Table.RowHeaderCell>
                    <Flex align="center" gap="2">
                      <Printer size={16} />
                      <Flex direction="column">
                        <Text weight="medium">{printer.nom}</Text>
                        <Text size="1" color="gray">{printer.largeurPapier}mm</Text>
                      </Flex>
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell>
                    <Badge color={getTypeBadgeColor(printer.type)} size="1">
                      {typeImprimanteOptions.find((t) => t.value === printer.type)?.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      {getConnexionIcon(printer.typeConnexion)}
                      <Text size="2">
                        {printer.typeConnexion === "RESEAU"
                          ? `${printer.adresseIp}:${printer.port}`
                          : printer.typeConnexion === "USB"
                          ? printer.pathUsb
                          : printer.typeConnexion === "SYSTEME"
                          ? "Via systeme"
                          : printer.typeConnexion}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {printer.categories && printer.categories.length > 0 ? (
                      <Flex gap="1" wrap="wrap" style={{ maxWidth: 200 }}>
                        {printer.categories.slice(0, 3).map((cat) => (
                          <Badge
                            key={cat.id}
                            size="1"
                            variant="soft"
                            style={{ backgroundColor: cat.couleur + "20", color: cat.couleur }}
                          >
                            {cat.nom}
                          </Badge>
                        ))}
                        {printer.categories.length > 3 && (
                          <Badge size="1" variant="soft" color="gray">
                            +{printer.categories.length - 3}
                          </Badge>
                        )}
                      </Flex>
                    ) : (
                      <Text size="1" color="gray">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      size="1"
                      checked={printer.actif}
                      onCheckedChange={() => handleToggleActif(printer.id)}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" wrap="wrap">
                      {/* Boutons Web USB/BT : appairage ou connexion */}
                      {(() => {
                        const managed = getManagedPrinter(printer.id);
                        if (managed) {
                          return (
                            <>
                              <Tooltip content={managed.connected ? "Deconnecter" : "Connecter"}>
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color={managed.connected ? "green" : "orange"}
                                  onClick={() => handleWebConnect(printer.id)}
                                  title={managed.connected ? "Connecte - Cliquer pour deconnecter" : "Deconnecte - Cliquer pour connecter"}
                                >
                                  {managed.connected ? <Link2 size={14} /> : <Unplug size={14} />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Tester via Web">
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color="cyan"
                                  onClick={() => handleWebTest(printer.id)}
                                  disabled={isTesting === printer.id}
                                >
                                  {isTesting === printer.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Zap size={14} />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Dissocier le peripherique">
                                <IconButton
                                  size="1"
                                  variant="ghost"
                                  color="gray"
                                  onClick={() => handleUnpair(printer.id)}
                                >
                                  <X size={14} />
                                </IconButton>
                              </Tooltip>
                            </>
                          );
                        }
                        // Pas encore appairee : proposer l'appairage USB/BT
                        if (
                          (printer.typeConnexion === "USB" && webPrinter.capabilities.webSerial) ||
                          (printer.typeConnexion === "SERIE" && webPrinter.capabilities.webSerial)
                        ) {
                          return (
                            <Tooltip content="Appairer via USB (Web Serial)">
                              <IconButton
                                size="1"
                                variant="soft"
                                color="blue"
                                onClick={() => handleDetectUSB(printer.id)}
                              >
                                <Usb size={14} />
                              </IconButton>
                            </Tooltip>
                          );
                        }
                        if (
                          printer.typeConnexion === "BLUETOOTH" &&
                          webPrinter.capabilities.webBluetooth
                        ) {
                          return (
                            <Tooltip content="Appairer via Bluetooth">
                              <IconButton
                                size="1"
                                variant="soft"
                                color="violet"
                                onClick={() => handleDetectBluetooth(printer.id)}
                              >
                                <Bluetooth size={14} />
                              </IconButton>
                            </Tooltip>
                          );
                        }
                        return null;
                      })()}
                      <IconButton
                        size="1"
                        variant="soft"
                        color="blue"
                        onClick={() => handleTestPrint(printer)}
                        disabled={isTesting === printer.id || !printer.actif}
                        title="Imprimer une page de test"
                      >
                        {isTesting === printer.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <TestTube size={14} />
                        )}
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="soft"
                        onClick={() => openEditDialog(printer)}
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={() => handleDelete(printer.id)}
                        disabled={isDeleting === printer.id}
                        title="Supprimer"
                      >
                        {isDeleting === printer.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Card>
      )}

      {/* Information categories */}
      <Callout.Root color="violet" size="1">
        <Callout.Icon>
          <Tag size={16} />
        </Callout.Icon>
        <Callout.Text>
          Pour associer des catégories à une imprimante, modifiez la catégorie dans
          <strong> Produits → Catégories</strong> et sélectionnez l'imprimante souhaitée.
        </Callout.Text>
      </Callout.Root>

      {/* Informations sur les capacites du navigateur */}
      <Card size="1">
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <MonitorSmartphone size={16} />
            <Text size="2" weight="medium">
              Capacites du navigateur
            </Text>
          </Flex>
          <Flex gap="3" wrap="wrap">
            <Badge
              size="1"
              color={webPrinter.capabilities.webSerial ? "green" : "gray"}
              variant={webPrinter.capabilities.webSerial ? "soft" : "outline"}
            >
              <Usb size={12} />
              USB (Web Serial){" "}
              {webPrinter.capabilities.webSerial ? "OK" : "Non supporte"}
            </Badge>
            <Badge
              size="1"
              color={webPrinter.capabilities.webBluetooth ? "green" : "gray"}
              variant={webPrinter.capabilities.webBluetooth ? "soft" : "outline"}
            >
              <Bluetooth size={12} />
              Bluetooth{" "}
              {webPrinter.capabilities.webBluetooth ? "OK" : "Non supporte"}
            </Badge>
            <Badge size="1" color="green" variant="soft">
              <Wifi size={12} />
              Reseau OK
            </Badge>
          </Flex>
          {!webPrinter.capabilities.webSerial && !webPrinter.capabilities.webBluetooth && (
            <Text size="1" color="gray">
              Pour l'impression USB/Bluetooth directe, utilisez Chrome 89+ ou Edge 89+.
              Activez les flags chrome://flags/#enable-experimental-web-platform-features si necessaire.
            </Text>
          )}
          {webPrinter.managedPrinters.length > 0 && (
            <Flex direction="column" gap="1" mt="1">
              <Text size="1" weight="medium" color="gray">
                Peripheriques appairies ({webPrinter.managedPrinters.length})
              </Text>
              {webPrinter.managedPrinters.map((mp) => (
                <Flex key={mp.printerId} align="center" gap="2">
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: mp.connected
                        ? "var(--green-9)"
                        : "var(--gray-8)",
                    }}
                  />
                  <Text size="1">
                    {mp.label} ({mp.connectionType === "web-serial" ? "USB" : "Bluetooth"})
                    {mp.connected ? " - Connecte" : " - Deconnecte"}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Flex>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>
            {editingPrinter ? "Modifier l'imprimante" : "Nouvelle imprimante"}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {editingPrinter
              ? "Modifiez les paramètres de l'imprimante"
              : "Configurez une nouvelle imprimante thermique"}
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="4">
              {/* Nom */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Nom de l'imprimante *
                </Text>
                <TextField.Root
                  {...register("nom")}
                  placeholder="Ex: Imprimante Caisse 1"
                  size="3"
                />
                {errors.nom ? <Text size="1" color="red" mt="1">
                    {errors.nom.message}
                  </Text> : null}
              </Box>

              {/* Type et Connexion */}
              <Flex gap="4">
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Type *
                  </Text>
                  <Select.Root
                    defaultValue={editingPrinter?.type || "TICKET"}
                    onValueChange={(value) =>
                      setValue("type", value as "TICKET" | "CUISINE" | "BAR")
                    }
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {typeImprimanteOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Connexion *
                  </Text>
                  <Select.Root
                    defaultValue={editingPrinter?.typeConnexion || "RESEAU"}
                    onValueChange={(value) => {
                      setValue("typeConnexion", value as "USB" | "RESEAU" | "SERIE" | "BLUETOOTH" | "SYSTEME");
                      setConnectionStatus("idle");
                      setConnectionMessage("");
                    }}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {typeConnexionOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Flex>

              {/* Champs conditionnels selon le type de connexion */}
              {typeConnexion === "RESEAU" && (
                <Flex gap="4">
                  <Box style={{ flex: 2 }}>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Adresse IP *
                    </Text>
                    <TextField.Root
                      {...register("adresseIp")}
                      placeholder="192.168.1.100"
                      size="3"
                    />
                    {errors.adresseIp ? <Text size="1" color="red" mt="1">
                        {errors.adresseIp.message}
                      </Text> : null}
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2" weight="medium" mb="1">
                      Port
                    </Text>
                    <TextField.Root
                      {...register("port")}
                      type="number"
                      placeholder="9100"
                      size="3"
                    />
                  </Box>
                </Flex>
              )}

              {typeConnexion === "USB" && (
                <Box>
                  <Text as="label" size="2" weight="medium" mb="1">
                    Chemin USB *
                  </Text>
                  <TextField.Root
                    {...register("pathUsb")}
                    placeholder="/dev/usb/lp0 ou COM3"
                    size="3"
                  />
                  {errors.pathUsb ? <Text size="1" color="red" mt="1">
                      {errors.pathUsb.message}
                    </Text> : null}
                  <Text size="1" color="gray" mt="1">
                    Sous Linux: /dev/usb/lp0 | Sous Windows: COM3, COM4, etc.
                  </Text>
                </Box>
              )}

              {typeConnexion === "SERIE" && (
                <Callout.Root
                  color={webPrinter.capabilities.webSerial ? "blue" : "yellow"}
                  size="1"
                >
                  <Callout.Icon>
                    {webPrinter.capabilities.webSerial ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                  </Callout.Icon>
                  <Callout.Text>
                    {webPrinter.capabilities.webSerial
                      ? "La connexion serie est supportee via Web Serial API. Apres sauvegarde, utilisez le bouton USB dans les actions pour appairer le peripherique."
                      : "La connexion serie necessite Chrome 89+. Utilisez une connexion reseau comme alternative."}
                  </Callout.Text>
                </Callout.Root>
              )}
              {typeConnexion === "BLUETOOTH" && (
                <Callout.Root
                  color={webPrinter.capabilities.webBluetooth ? "blue" : "yellow"}
                  size="1"
                >
                  <Callout.Icon>
                    {webPrinter.capabilities.webBluetooth ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                  </Callout.Icon>
                  <Callout.Text>
                    {webPrinter.capabilities.webBluetooth
                      ? "La connexion Bluetooth est supportee via Web Bluetooth API. Apres sauvegarde, utilisez le bouton Bluetooth dans les actions pour appairer le peripherique."
                      : "La connexion Bluetooth necessite Chrome 56+ avec le Bluetooth active sur l'appareil."}
                  </Callout.Text>
                </Callout.Root>
              )}

              {typeConnexion === "SYSTEME" && (
                <Callout.Root color="green" size="1">
                  <Callout.Icon>
                    <CheckCircle2 size={16} />
                  </Callout.Icon>
                  <Callout.Text>
                    Utilise les imprimantes deja installees sur cet ordinateur.
                    Lors de l'impression, le dialogue systeme s'ouvrira pour choisir l'imprimante.
                    Aucune configuration supplementaire necessaire.
                  </Callout.Text>
                </Callout.Root>
              )}

              {/* Bouton de test de connexion */}
              {(typeConnexion === "RESEAU" || typeConnexion === "USB") && (
                <Box>
                  <Button
                    type="button"
                    variant="soft"
                    size="2"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    style={{ width: "100%" }}
                  >
                    {isTestingConnection ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Zap size={14} />
                    )}
                    Tester la connexion
                  </Button>

                  {connectionStatus !== "idle" && (
                    <Callout.Root
                      color={connectionStatus === "success" ? "green" : "red"}
                      size="1"
                      mt="2"
                    >
                      <Callout.Icon>
                        {connectionStatus === "success" ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                      </Callout.Icon>
                      <Callout.Text>{connectionMessage}</Callout.Text>
                    </Callout.Root>
                  )}
                </Box>
              )}

              {/* Largeur papier */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Largeur du papier
                </Text>
                <Select.Root
                  defaultValue={String(editingPrinter?.largeurPapier || 80)}
                  onValueChange={(value) => setValue("largeurPapier", Number(value))}
                >
                  <Select.Trigger />
                  <Select.Content>
                    {largeurPapierOptions.map((option) => (
                      <Select.Item key={option.value} value={String(option.value)}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Boutons */}
            <Flex gap="3" mt="5" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {editingPrinter ? "Enregistrer" : "Ajouter"}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      {/* Dialog d'appairage USB/Bluetooth */}
      <Dialog.Root open={showPairDialog} onOpenChange={setShowPairDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              {pendingSerialPort ? <Usb size={20} /> : <Bluetooth size={20} />}
              Appairer un peripherique
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {pendingSerialPort
              ? `Peripherique USB detecte : ${pendingSerialPort.label}`
              : pendingBTDevice
              ? `Peripherique Bluetooth detecte : ${pendingBTDevice.name}`
              : "Aucun peripherique detecte"}
          </Dialog.Description>

          <Flex direction="column" gap="4">
            {/* Info du peripherique */}
            <Card size="1">
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  {pendingSerialPort ? (
                    <>
                      <Usb size={16} style={{ color: "var(--blue-9)" }} />
                      <Text size="2" weight="medium">
                        {pendingSerialPort.label}
                      </Text>
                    </>
                  ) : pendingBTDevice ? (
                    <>
                      <Bluetooth size={16} style={{ color: "var(--violet-9)" }} />
                      <Text size="2" weight="medium">
                        {pendingBTDevice.name}
                      </Text>
                    </>
                  ) : null}
                </Flex>
                {pendingSerialPort?.info.usbVendorId ? <Text size="1" color="gray">
                    Vendor ID: 0x{pendingSerialPort.info.usbVendorId.toString(16).padStart(4, "0")}
                    {pendingSerialPort.info.usbProductId ? ` | Product ID: 0x${pendingSerialPort.info.usbProductId.toString(16).padStart(4, "0")}` : null}
                  </Text> : null}
              </Flex>
            </Card>

            {/* Baud rate pour serie */}
            {pendingSerialPort ? <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Vitesse (Baud Rate)
                </Text>
                <Select.Root
                  defaultValue={String(serialBaudRate)}
                  onValueChange={(v) => setSerialBaudRate(Number(v))}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="9600">9600 (standard)</Select.Item>
                    <Select.Item value="19200">19200</Select.Item>
                    <Select.Item value="38400">38400</Select.Item>
                    <Select.Item value="57600">57600</Select.Item>
                    <Select.Item value="115200">115200</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Text size="1" color="gray" mt="1">
                  La plupart des imprimantes thermiques utilisent 9600 ou 115200
                </Text>
              </Box> : null}

            {/* Selecteur d'imprimante a associer */}
            {!pairingPrinterId && imprimantes.length > 0 && (
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Associer a l'imprimante
                </Text>
                <Select.Root
                  onValueChange={(v) => setPairingPrinterId(v)}
                >
                  <Select.Trigger placeholder="Choisir une imprimante..." />
                  <Select.Content>
                    {imprimantes.map((imp) => (
                      <Select.Item key={imp.id} value={imp.id}>
                        {imp.nom} ({imp.type})
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            )}

            {pairingPrinterId ? <Callout.Root color="blue" size="1">
                <Callout.Icon>
                  <Link2 size={16} />
                </Callout.Icon>
                <Callout.Text>
                  Sera associe a :{" "}
                  <strong>
                    {imprimantes.find((i) => i.id === pairingPrinterId)?.nom || pairingPrinterId}
                  </strong>
                </Callout.Text>
              </Callout.Root> : null}
          </Flex>

          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleConfirmPairing}
              disabled={isPairing || !pairingPrinterId}
            >
              {isPairing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Link2 size={16} />
              )}
              Appairer
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Dialog de scan réseau */}
      <Dialog.Root open={showScanDialog} onOpenChange={setShowScanDialog}>
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Search size={20} />
              Détection des imprimantes
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Scan du réseau local pour trouver les imprimantes thermiques
          </Dialog.Description>

          <Box>
            {isScanning ? (
              <Flex direction="column" align="center" justify="center" py="6" gap="3">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-9)" }} />
                <Text size="2" color="gray">Scan en cours (ports 9100, 515, 631)...</Text>
                <Text size="1" color="gray">Cela peut prendre quelques secondes</Text>
              </Flex>
            ) : scanDetails.length === 0 && scanResults.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py="6" gap="3">
                <Printer size={32} style={{ color: "var(--gray-8)" }} />
                <Text size="2" color="gray">Aucune imprimante detectee</Text>
                <Text size="1" color="gray">Verifiez que l'imprimante est allumee et connectee au reseau</Text>
                <Flex gap="2" wrap="wrap">
                  <Button size="2" variant="soft" onClick={() => handleScanNetwork(false)}>
                    <Search size={14} />
                    Relancer
                  </Button>
                  <Button size="2" variant="soft" color="blue" onClick={() => handleScanNetwork(true)}>
                    <Search size={14} />
                    Scan etendu (+ ports 80, 8008)
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium" mb="2">
                  {scanDetails.length || scanResults.length} point(s) d'impression trouve(s)
                </Text>
                {/* Affichage detaille si disponible */}
                {scanDetails.length > 0
                  ? scanDetails.map((det, idx) => (
                      <Flex
                        key={`${det.ip}:${det.port}-${idx}`}
                        align="center"
                        justify="between"
                        p="3"
                        style={{
                          backgroundColor: "var(--gray-a2)",
                          borderRadius: 8,
                          border: "1px solid var(--gray-a6)",
                        }}
                      >
                        <Flex direction="column" gap="1">
                          <Flex align="center" gap="2">
                            <Wifi size={16} style={{ color: "var(--green-9)" }} />
                            <Text size="2" weight="medium">
                              {det.ip}:{det.port}
                            </Text>
                          </Flex>
                          <Text size="1" color="gray">
                            {det.protocol}
                          </Text>
                        </Flex>
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => handleUseDetectedIP(det.ip, det.port)}
                        >
                          <Plus size={12} />
                          Utiliser
                        </Button>
                      </Flex>
                    ))
                  : scanResults.map((ip) => (
                      <Flex
                        key={ip}
                        align="center"
                        justify="between"
                        p="3"
                        style={{
                          backgroundColor: "var(--gray-a2)",
                          borderRadius: 8,
                          border: "1px solid var(--gray-a6)",
                        }}
                      >
                        <Flex align="center" gap="2">
                          <Wifi size={16} style={{ color: "var(--green-9)" }} />
                          <Text size="2" weight="medium">
                            {ip}
                          </Text>
                        </Flex>
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => handleUseDetectedIP(ip)}
                        >
                          <Plus size={12} />
                          Utiliser
                        </Button>
                      </Flex>
                    ))}
                {/* Bouton scan etendu */}
                <Flex justify="center" mt="2">
                  <Button
                    size="1"
                    variant="ghost"
                    color="gray"
                    onClick={() => handleScanNetwork(true)}
                    disabled={isScanning}
                  >
                    <Search size={12} />
                    Scanner d'autres ports (80, 8008)
                  </Button>
                </Flex>
              </Flex>
            )}
          </Box>

          <Flex justify="end" mt="4">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Fermer
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
