import { AdminQcUtilSearch } from "@/components/admin/admin-qc-util-search";
import { ExportCsvButton } from "@/components/admin/export-csv-button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-muted-foreground">
          Every Q-Util Check submission: date, generated entry UID, product type, full form data, images, and who
          submitted it. Open a row for details. Export CSV for reporting.
        </p>
        <ExportCsvButton />
      </div>
      <AdminQcUtilSearch />
    </div>
  );
}
