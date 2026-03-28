import { AdminSearch } from "@/components/admin/admin-search";
import { ExportCsvButton } from "@/components/admin/export-csv-button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-muted-foreground">
          Filter by UID, serial, or name. Switch between table and card views. Open a row or card for full details,
          BOM, QC data, and images.
        </p>
        <ExportCsvButton />
      </div>
      <AdminSearch />
    </div>
  );
}
