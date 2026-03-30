"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildQrLabelsPrintableHtmlGrid, type QrPageSize } from "@/lib/qr-print-grid";

type Props = {
  productUid: string;
  qrDataUrl: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  quantity: number;
  totalCopies: number;
};

export function QrResultGrid({
  productUid,
  qrDataUrl,
  name,
  make,
  model,
  serialNumber,
  quantity,
  totalCopies,
}: Props) {
  const total = Math.max(1, Math.min(totalCopies, 100));
  const copies = Array.from({ length: total }, (_, i) => i + 1);

  const [pageSize, setPageSize] = useState<QrPageSize>("A4");
  const printableHtml = useMemo(() => {
    return buildQrLabelsPrintableHtmlGrid({
      qrDataUrl,
      total,
      pageSize,
      title: `QR Labels — ${productUid}`,
    });
  }, [qrDataUrl, total, pageSize, productUid]);

  function printFormattedAll() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(printableHtml);
    w.document.close();
    w.onload = () => {
      window.setTimeout(() => {
        w.focus();
        w.print();
        w.close();
      }, 700);
    };
  }

  function downloadFormattedHtml() {
    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productUid}-labels-${pageSize}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Generated: <span className="font-mono">{productUid}</span>{" "}
          <span className="text-muted-foreground font-normal">
            ({total} {total === 1 ? "label" : "labels"})
          </span>
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-32">
            <Select value={pageSize} onValueChange={(v) => setPageSize(v as QrPageSize)}>
              <SelectTrigger>
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A3">A3</SelectItem>
                <SelectItem value="A5">A5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={printFormattedAll}>
            Print formatted ({pageSize})
          </Button>
          <Button type="button" variant="secondary" onClick={downloadFormattedHtml}>
            Download printable HTML
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {copies.map((n) => (
          <Card key={n} className="overflow-hidden">
            <div className="flex justify-center bg-white p-2 dark:bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR ${n}/${total}`} width={110} height={110} />
            </div>
            <CardContent className="p-2 text-center">
              <p className="font-mono text-[10px] text-muted-foreground truncate">{productUid}</p>
              <p className="mt-0.5 text-xs font-semibold">
                {n} / {total}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border p-3 text-sm">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground">Make / Model</span>
          <span className="font-medium">{make} {model}</span>
          <span className="text-muted-foreground">Serial</span>
          <span className="font-mono font-medium">{serialNumber}</span>
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-medium">{quantity}</span>
        </div>
      </div>
    </div>
  );
}
