"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  function download() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${productUid}-qr.png`;
    a.click();
  }

  function printAll() {
    const w = window.open("", "_blank");
    if (!w) return;

    const pages = copies
      .map(
        (n) => `
      <div style="page-break-inside:avoid;page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center;font-family:system-ui,sans-serif;">
        <img src="${qrDataUrl}" alt="QR" width="180" height="180" style="image-rendering:pixelated;" />
        <table style="margin-top:10px;font-size:11px;border-collapse:collapse;text-align:left;">
          <tr><td style="padding:1px 10px 1px 0;color:#666;">UID</td><td style="font-weight:600;font-family:monospace;">${productUid}</td></tr>
          <tr><td style="padding:1px 10px 1px 0;color:#666;">Name</td><td>${name}</td></tr>
          <tr><td style="padding:1px 10px 1px 0;color:#666;">Make / Model</td><td>${make} ${model}</td></tr>
          <tr><td style="padding:1px 10px 1px 0;color:#666;">Serial</td><td>${serialNumber}</td></tr>
          <tr><td style="padding:1px 10px 1px 0;color:#666;">Quantity</td><td>${quantity}</td></tr>
        </table>
        <p style="margin-top:8px;font-size:13px;font-weight:600;letter-spacing:0.5px;">${n} / ${total}</p>
      </div>`,
      )
      .join("");

    w.document.write(`
      <html>
        <head><title>Print QR — ${productUid}</title>
          <style>@page{margin:10mm}@media print{body{margin:0}div:last-child{page-break-after:auto}}</style>
        </head>
        <body style="margin:0;">${pages}</body>
      </html>`);
    w.document.close();
    w.onload = () => {
      w.print();
      w.close();
    };
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
        <div className="flex gap-2">
          <Button type="button" onClick={printAll}>
            Print all {total} labels
          </Button>
          <Button type="button" variant="secondary" onClick={download}>
            Download PNG
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
