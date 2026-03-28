import { AdminSearch } from "@/components/admin/admin-search";
import { ExportCsvButton } from "@/components/admin/export-csv-button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-muted-foreground">
          Search by product UID, serial number, or name. Open a product for BOM, QC data, and uploaded images.
        </p>
        <ExportCsvButton />
      </div>
      <AdminSearch />
    </div>
  );
}
