"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Props = {
  productUid: string;
  qrDataUrl: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  quantity: number;
};

export function QrDisplay({
  productUid,
  qrDataUrl,
  name,
  make,
  model,
  serialNumber,
  quantity,
}: Props) {
  const [copies, setCopies] = useState(1);

  function download() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${productUid}-qr.png`;
    a.click();
  }

  function printLabels() {
    const total = Math.max(1, Math.min(copies, 100));
    const w = window.open("", "_blank");
    if (!w) return;

    const labels = Array.from({ length: total }, (_, i) => {
      const num = `${i + 1} / ${total}`;
      return `
        <div style="page-break-inside:avoid;page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center;font-family:system-ui,sans-serif;">
          <img src="${qrDataUrl}" alt="QR" width="120" height="120" style="image-rendering:pixelated;" />
          <table style="margin-top:16px;font-size:13px;border-collapse:collapse;text-align:left;">
            <tr><td style="padding:2px 12px 2px 0;color:#666;">UID</td><td style="font-weight:600;font-family:monospace;">${productUid}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666;">Name</td><td>${name}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666;">Make / Model</td><td>${make} ${model}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666;">Serial</td><td>${serialNumber}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666;">Quantity</td><td>${quantity}</td></tr>
          </table>
          <p style="margin-top:12px;font-size:16px;font-weight:700;letter-spacing:1px;">${num}</p>
        </div>`;
    }).join("");

    w.document.write(`
      <html>
        <head><title>Print QR — ${productUid}</title>
          <style>@page{margin:10mm}@media print{body{margin:0}div:last-child{page-break-after:auto}}</style>
        </head>
        <body style="margin:0;">${labels}</body>
      </html>`);
    w.document.close();
    w.onload = () => {
      w.print();
      w.close();
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-lg">{productUid}</CardTitle>
        <CardDescription>Download or print QR labels for the physical units.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR preview */}
        <div className="flex justify-center rounded-lg border bg-white p-3 dark:bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Product QR" width={100} height={100} />
        </div>

        {/* Product details */}
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

        <Separator />

        {/* Print controls */}
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
          <p className="text-xs text-muted-foreground sm:pb-1.5">
            Each label shows <strong>1/{copies}</strong>, <strong>2/{copies}</strong>, … <strong>{copies}/{copies}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={printLabels}>
            Print {copies > 1 ? `${copies} labels` : "label"}
          </Button>
          <Button type="button" variant="secondary" onClick={download}>
            Download PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
