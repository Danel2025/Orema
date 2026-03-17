"use client";

/**
 * CSVImportExport - Interface d'import/export CSV
 */

import { useState, useRef } from "react";
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Tabs,
  Table,
  Badge,
  Callout,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileDown,
  Users,
  ShoppingCart,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import {
  importProductsFromCSV,
  exportProducts,
  exportVentes,
  exportClients,
} from "@/actions/csv";
import {
  getProductsTemplate,
  getProductsExampleCSV,
  PRODUCT_COLUMNS_DESCRIPTION,
} from "@/lib/csv/templates";
import { downloadCSV, generateFilename } from "@/lib/csv/exporter";

export function CSVImportExport() {
  return (
    <Tabs.Root defaultValue="import">
      <Tabs.List mb="4">
        <Tabs.Trigger value="import">
          <Flex align="center" gap="2">
            <Upload size={16} />
            Importer
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="export">
          <Flex align="center" gap="2">
            <Download size={16} />
            Exporter
          </Flex>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="import">
        <ImportSection />
      </Tabs.Content>

      <Tabs.Content value="export">
        <ExportSection />
      </Tabs.Content>
    </Tabs.Root>
  );
}

/**
 * Section Import
 */
function ImportSection() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    importes: number;
    ignores: number;
    erreurs: { ligne: number; message: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Veuillez selectionner un fichier CSV");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await importProductsFromCSV(formData);
      setImportResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de l'import");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadTemplate = () => {
    const csv = getProductsTemplate();
    downloadCSV(csv, "template_produits.csv");
    toast.success("Template telecharge");
  };

  const handleDownloadExample = () => {
    const csv = getProductsExampleCSV();
    downloadCSV(csv, "exemple_produits.csv");
    toast.success("Exemple telecharge");
  };

  return (
    <Flex direction="column" gap="4">
      {/* Zone d'import */}
      <Card size="3">
        <Flex direction="column" gap="4" align="center" py="6">
          <FileSpreadsheet size={48} style={{ color: "var(--accent-9)" }} />
          <Text size="4" weight="medium">
            Importer des produits
          </Text>
          <Text size="2" color="gray" align="center">
            Selectionnez un fichier CSV contenant vos produits
          </Text>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-import"
          />

          <Flex gap="3">
            <Button
              size="3"
             
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {isImporting ? "Import en cours..." : "Choisir un fichier"}
            </Button>
          </Flex>

          <Flex gap="2" mt="2">
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={handleDownloadTemplate}
            >
              <FileDown size={14} />
              Template vide
            </Button>
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={handleDownloadExample}
            >
              <FileDown size={14} />
              Exemple avec donnees
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Resultat de l'import */}
      {importResult ? <Card>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              {importResult.success ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <AlertCircle size={20} className="text-red-500" />
              )}
              <Text size="3" weight="medium">
                {importResult.message}
              </Text>
            </Flex>

            <Flex gap="4">
              <Badge color="green" size="2">
                {importResult.importes} importe(s)
              </Badge>
              {importResult.ignores > 0 && (
                <Badge size="2">
                  {importResult.ignores} ignore(s)
                </Badge>
              )}
            </Flex>

            {importResult.erreurs.length > 0 && (
              <Box>
                <Text size="2" weight="medium" mb="2">
                  Erreurs:
                </Text>
                <Box
                  className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2"
                >
                  {importResult.erreurs.slice(0, 10).map((err, i) => (
                    <Text key={i} size="1" color="red" as="p">
                      Ligne {err.ligne}: {err.message}
                    </Text>
                  ))}
                  {importResult.erreurs.length > 10 && (
                    <Text size="1" color="gray">
                      ... et {importResult.erreurs.length - 10} autres erreurs
                    </Text>
                  )}
                </Box>
              </Box>
            )}
          </Flex>
        </Card> : null}

      {/* Aide sur le format */}
      <Card>
        <Text size="3" weight="medium" mb="3">
          Format du fichier CSV
        </Text>
        <Text size="2" color="gray" mb="3">
          Le fichier doit utiliser le point-virgule (;) comme separateur et
          l'encodage UTF-8.
        </Text>

        <Table.Root size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Colonne</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Requis</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {PRODUCT_COLUMNS_DESCRIPTION.slice(0, 8).map((col) => (
              <Table.Row key={col.name}>
                <Table.RowHeaderCell>
                  <code className="text-xs">{col.name}</code>
                </Table.RowHeaderCell>
                <Table.Cell>
                  {col.required ? (
                    <Badge color="red" size="1">
                      Oui
                    </Badge>
                  ) : (
                    <Badge color="gray" size="1">
                      Non
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Text size="1">{col.description}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
    </Flex>
  );
}

/**
 * Section Export
 */
function ExportSection() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleExportProducts = async () => {
    setIsExporting("products");
    try {
      const result = await exportProducts();
      if (result.success && result.data) {
        downloadCSV(result.data, generateFilename("produits"));
        toast.success("Export des produits termine");
      } else {
        toast.error(result.error || "Erreur d'export");
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportVentes = async () => {
    setIsExporting("ventes");
    try {
      const result = await exportVentes(
        new Date(dateDebut),
        new Date(dateFin + "T23:59:59")
      );
      if (result.success && result.data) {
        downloadCSV(result.data, generateFilename("ventes"));
        toast.success(`${result.count} vente(s) exportee(s)`);
      } else {
        toast.error(result.error || "Erreur d'export");
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportClients = async () => {
    setIsExporting("clients");
    try {
      const result = await exportClients();
      if (result.success && result.data) {
        downloadCSV(result.data, generateFilename("clients"));
        toast.success(`${result.count} client(s) exporte(s)`);
      } else {
        toast.error(result.error || "Erreur d'export");
      }
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Flex direction="column" gap="4">
      {/* Export Produits */}
      <Card>
        <Flex justify="between" align="center">
          <Flex align="center" gap="3">
            <Box style={{ padding: 8, backgroundColor: "var(--accent-a3)", borderRadius: 8 }}>
              <Package size={24} style={{ color: "var(--accent-10)" }} />
            </Box>
            <Box>
              <Text size="3" weight="medium">
                Produits
              </Text>
              <Text size="2" color="gray">
                Exporter tous les produits du catalogue
              </Text>
            </Box>
          </Flex>
          <Button
            size="2"
           
            onClick={handleExportProducts}
            disabled={isExporting !== null}
          >
            {isExporting === "products" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Exporter
          </Button>
        </Flex>
      </Card>

      {/* Export Ventes */}
      <Card>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Flex align="center" gap="3">
              <Box className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart size={24} className="text-blue-600" />
              </Box>
              <Box>
                <Text size="3" weight="medium">
                  Ventes
                </Text>
                <Text size="2" color="gray">
                  Exporter les ventes sur une periode
                </Text>
              </Box>
            </Flex>
            <Button
              size="2"
              color="blue"
              onClick={handleExportVentes}
              disabled={isExporting !== null}
            >
              {isExporting === "ventes" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Exporter
            </Button>
          </Flex>

          <Flex gap="3" align="end">
            <Box style={{ flex: 1 }}>
              <Text as="label" size="1" weight="medium">
                Date debut
              </Text>
              <TextField.Root
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                size="2"
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="1" weight="medium">
                Date fin
              </Text>
              <TextField.Root
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                size="2"
              />
            </Box>
          </Flex>
        </Flex>
      </Card>

      {/* Export Clients */}
      <Card>
        <Flex justify="between" align="center">
          <Flex align="center" gap="3">
            <Box className="p-2 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </Box>
            <Box>
              <Text size="3" weight="medium">
                Clients
              </Text>
              <Text size="2" color="gray">
                Exporter la liste des clients
              </Text>
            </Box>
          </Flex>
          <Button
            size="2"
            color="green"
            onClick={handleExportClients}
            disabled={isExporting !== null}
          >
            {isExporting === "clients" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Exporter
          </Button>
        </Flex>
      </Card>

      {/* Information */}
      <Callout.Root color="gray" size="1">
        <Callout.Icon>
          <AlertCircle size={16} />
        </Callout.Icon>
        <Callout.Text>
          Les fichiers exportes sont au format CSV (UTF-8) compatible avec Excel
          et Google Sheets.
        </Callout.Text>
      </Callout.Root>
    </Flex>
  );
}
