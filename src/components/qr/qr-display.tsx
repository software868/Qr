"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildQrLabelsPrintableHtmlGrid, type QrPageSize } from "@/lib/qr-print-grid";

type Props = {
  /** Label UID shown on the card and in filenames (e.g. QUT-…). */
  uid: string;
  qrDataUrl: string;
  /** Optional rows under the QR preview (e.g. product type). */
  detailRows: { label: string; value: string }[];
};

export function QrDisplay({ uid, qrDataUrl, detailRows }: Props) {
  const [copies, setCopies] = useState(1);
  const [pageSize, setPageSize] = useState<QrPageSize>("A4");

  const total = Math.max(1, Math.min(copies, 100));
  const printableHtml = useMemo(() => {
    return buildQrLabelsPrintableHtmlGrid({
      qrDataUrl,
      total,
      pageSize,
      title: `QR Labels — ${uid}`,
    });
  }, [qrDataUrl, total, pageSize, uid]);

  function printLabelsFormatted() {
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
    a.download = `${uid}-labels-${pageSize}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{uid}</CardTitle>
        <CardDescription>Download or print QR labels for the physical product.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-lg border bg-white p-3 dark:bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Entry QR" width={100} height={100} />
        </div>

        <div className="rounded-lg border p-3 text-sm">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {detailRows.map((row) => (
              <div key={row.label} className="contents">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-28 space-y-1.5">
            <Label htmlFor="copies">Copies</Label>
            <Input
              id="copies"
              type="number"
              min={1}
              max={100}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="w-32">
            <Label>Page size</Label>
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
          <p className="text-xs text-muted-foreground sm:pb-1.5">
            Each label shows <strong>1/{total}</strong>, <strong>2/{total}</strong>, …{" "}
            <strong>
              {total}/{total}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={printLabelsFormatted}>
            Print formatted ({pageSize})
          </Button>
          <Button type="button" variant="secondary" onClick={downloadFormattedHtml}>
            Download printable HTML
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
