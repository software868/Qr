"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportProductsCsvAction } from "@/actions/admin";

export function ExportCsvButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const r = await exportProductsCsvAction();
      if (!r.ok || !("csv" in r)) {
        toast.error("Export failed");
        return;
      }
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    });
  }

  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={pending}>
      {pending ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
