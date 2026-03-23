import { SalleContent } from "./content";
import { getTables, getZonesWithTableCount, getTablesStats, getTableById } from "@/actions/tables";

export default async function SallePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; zone?: string }>;
}) {
  const params = await searchParams;
  const selectedTableId = params.table;
  const zoneFilter = params.zone; // zoneId

  // Charger les donnees en parallele
  const [tables, zones, stats, selectedTable] = await Promise.all([
    getTables({ zoneId: zoneFilter }),
    getZonesWithTableCount(),
    getTablesStats(),
    selectedTableId ? getTableById(selectedTableId) : null,
  ]);

  return (
    <SalleContent
      tables={tables as never}
      zones={zones as never}
      stats={stats}
      selectedTable={selectedTable as never}
      selectedTableId={selectedTableId}
      zoneFilter={zoneFilter}
    />
  );
}
