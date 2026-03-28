"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ProductType } from "@prisma/client";
import { toast } from "sonner";
import { getBomTemplateAction, lookupProductForQcAction, submitQcFormAction } from "@/actions/qc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { QrScannerButton } from "@/components/qc/qr-scanner";
import { CameraCaptureButton } from "@/components/qc/camera-capture";
import { QrDisplay } from "@/components/qr/qr-display";

const TYPE_LABEL: Record<ProductType, string> = {
  CONTROL_PANEL: "Control Panel",
  IPS: "IPS",
  AVS: "AVS",
};

export function QcWorkflow() {
  const [productType, setProductType] = useState<ProductType>(ProductType.CONTROL_PANEL);
  const [bom, setBom] = useState<{
    lines: { id: string; partCode: string; description: string; expectedQty: number }[];
  } | null>(null);
  const [lookup, setLookup] = useState("");
  const [product, setProduct] = useState<{
    id: string;
    productUid: string;
    name: string;
    make: string;
    model: string;
    serialNumber: string;
    quantity: number;
    date: string;
  } | null>(null);
  const [items, setItems] = useState<string[]>([""]);
  const [passStatus, setPassStatus] = useState<"pass" | "fail" | "conditional">("pass");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [finalQr, setFinalQr] = useState<{ uid: string; dataUrl: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getBomTemplateAction(productType);
      if (res.ok && res.bom) setBom(res.bom);
      else setBom(null);
    });
  }, [productType]);

  const loadProduct = useCallback(() => {
    startTransition(async () => {
      const res = await lookupProductForQcAction({ productUid: lookup.trim() });
      if (!res.ok) {
        toast.error("error" in res ? res.error : "Lookup failed");
        setProduct(null);
        return;
      }
      if ("product" in res) setProduct(res.product);
    });
  }, [lookup]);

  function addItemRow() {
    setItems((prev) => [...prev, ""]);
  }

  function setItem(i: number, v: string) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) {
      toast.error("Load a product first.");
      return;
    }
    const scanned = items.map((s) => s.trim()).filter(Boolean);
    if (scanned.length < 1) {
      toast.error("Add at least one item UID.");
      return;
    }

    const fd = new FormData();
    fd.set("productId", product.id);
    fd.set("productType", productType);
    fd.set("scannedItemUids", JSON.stringify(scanned));
    fd.set("passStatus", passStatus);
    fd.set("inspectorNotes", notes);
    for (const f of files) {
      fd.append("images", f);
    }

    startTransition(async () => {
      const res = await submitQcFormAction(fd);
      if (res.ok) {
        setFinalQr({ uid: res.finalProductUid, dataUrl: res.finalQrDataUrl });
        toast.success("QC saved.");
        return;
      }
      toast.error("error" in res ? res.error : "Failed");
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>1. Product type & BOM</CardTitle>
          <CardDescription>Select the assembly type to load the matching BOM template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Type</Label>
            <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABEL) as ProductType[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {TYPE_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {bom?.lines?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Expected qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bom.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono">{line.partCode}</TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">{line.expectedQty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Loading BOM…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Product</CardTitle>
          <CardDescription>Enter or scan the Product UID from the manufacturing QR label.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="lookup">Product UID</Label>
              <Input
                id="lookup"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="PRD-…"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <QrScannerButton
                onScan={(text) => {
                  setLookup(text.trim());
                  toast.message("Scanned", { description: text });
                }}
              />
              <Button type="button" onClick={loadProduct} disabled={pending}>
                Load
              </Button>
            </div>
          </div>
          {product && (
            <div className="rounded-lg border p-4 text-sm">
              <p>
                <span className="text-muted-foreground">UID:</span>{" "}
                <span className="font-mono">{product.productUid}</span>
              </p>
              <p>
                {product.name} — {product.make} {product.model}
              </p>
              <p className="text-muted-foreground">SN {product.serialNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Item UIDs & QC</CardTitle>
          <CardDescription>Record sub-component or line-item UIDs, result, notes, and photos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Item / component UIDs</Label>
              {items.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={row}
                    onChange={(e) => setItem(i, e.target.value)}
                    className="font-mono"
                    placeholder="Scan or type UID"
                  />
                  <QrScannerButton
                    onScan={(text) => {
                      setItem(i, text.trim());
                    }}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                Add row
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Result</Label>
                <Select value={passStatus} onValueChange={(v) => setPassStatus(v as typeof passStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Inspector notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Images</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      setFiles((prev) => [...prev, ...newFiles]);
                      setPreviews((prev) => [
                        ...prev,
                        ...newFiles.map((f) => URL.createObjectURL(f)),
                      ]);
                    }
                    e.target.value = "";
                  }}
                />
                <div className="flex gap-3">
                  <CameraCaptureButton
                    onCapture={(file) => {
                      setFiles((prev) => [...prev, file]);
                      setPreviews((prev) => [...prev, URL.createObjectURL(file)]);
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                    className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <span className="text-sm font-medium text-muted-foreground">
                      Upload file
                    </span>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="group relative overflow-hidden rounded-md border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previews[i]}
                          alt={f.name}
                          className="aspect-square w-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            URL.revokeObjectURL(previews[i]);
                            setFiles((prev) => prev.filter((_, idx) => idx !== i));
                            setPreviews((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <Button type="submit" disabled={pending || !product}>
              {pending ? "Saving…" : "Complete QC & generate final QR"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {finalQr && product && (
        <QrDisplay
          productUid={finalQr.uid}
          qrDataUrl={finalQr.dataUrl}
          name={product.name}
          make={product.make}
          model={product.model}
          serialNumber={product.serialNumber}
          quantity={product.quantity}
        />
      )}
    </div>
  );
}
