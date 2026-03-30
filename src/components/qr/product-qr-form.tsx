"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createProductAction, getMyProductsAction, type ProductWithQr } from "@/actions/product";
import { QrResultGrid } from "@/components/qr/qr-result-grid";
import { QrDisplay } from "@/components/qr/qr-display";

type NewResult = ProductWithQr & { totalCopies: number };

export function ProductQrForm({ initialProducts }: { initialProducts: ProductWithQr[] }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<NewResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ProductWithQr[]>(initialProducts);
  const [loadingHistory, startHistoryTransition] = useTransition();

  // These three are controlled so we can auto-fill from history and keep form editable.
  const [nameValue, setNameValue] = useState("");
  const [makeValue, setMakeValue] = useState("");
  const [modelValue, setModelValue] = useState("");

  useEffect(() => {
    // Listen for selection from the sidebar.
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string; make?: string; model?: string } | undefined;
      if (!detail) return;
      if (typeof detail.name === "string") setNameValue(detail.name);
      if (typeof detail.make === "string") setMakeValue(detail.make);
      if (typeof detail.model === "string") setModelValue(detail.model);
    };
    window.addEventListener("qr-history-select", onSelect);
    return () => window.removeEventListener("qr-history-select", onSelect);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const copies = Math.max(1, Math.min(Number(fd.get("copies")) || 1, 100));
    const res = await createProductAction(fd);
    setPending(false);
    if (res.ok) {
      const newItem: NewResult = {
        productUid: res.productUid,
        qrDataUrl: res.qrDataUrl,
        name: res.product.name,
        make: res.product.make,
        model: res.product.model,
        serialNumber: res.product.serialNumber,
        quantity: res.product.quantity,
        totalCopies: copies,
      };
      setResult(newItem);
      setHistory((prev) => [newItem, ...prev]);
      toast.success(`Product ${res.productUid} created.`);

      // Notify sidebar about the new item.
      window.dispatchEvent(
        new CustomEvent("qr-history-add", {
          detail: {
            productUid: newItem.productUid,
            qrDataUrl: newItem.qrDataUrl,
            name: newItem.name,
            make: newItem.make,
            model: newItem.model,
            serialNumber: newItem.serialNumber,
            quantity: newItem.quantity,
          } satisfies ProductWithQr,
        }),
      );

      return;
    }
    toast.error(res.error);
  }

  function refreshHistory() {
    startHistoryTransition(async () => {
      const products = await getMyProductsAction();
      setHistory(products);
      setShowHistory(true);
    });
  }

  return (
    <div className="space-y-8">
      {/* Creation form */}
      <Card>
        <CardHeader>
          <CardTitle>New product</CardTitle>
          <CardDescription>Enter details and generate a unique Product UID and QR code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  name="make"
                  value={makeValue}
                  onChange={(e) => setMakeValue(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  value={modelValue}
                  onChange={(e) => setModelValue(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial number</Label>
                <Input id="serialNumber" name="serialNumber" required maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copies">Number of QR labels</Label>
                <Input id="copies" name="copies" type="number" min={1} max={100} defaultValue={1} required />
              </div>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Generate UID & QR"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Newly generated QR result with copies */}
      {result && (
        <QrResultGrid
          productUid={result.productUid}
          qrDataUrl={result.qrDataUrl}
          name={result.name}
          make={result.make}
          model={result.model}
          serialNumber={result.serialNumber}
          quantity={result.quantity}
          totalCopies={result.totalCopies}
        />
      )}

      <Separator />

      {/* Toggle for history */}
      {!showHistory ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={refreshHistory}
            disabled={loadingHistory}
          >
            {loadingHistory ? "Loading…" : `Show previous QRs (${history.length})`}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Previous QR codes ({history.length})
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
              Hide
            </Button>
          </div>
          {history.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {history.map((p) => (
                <QrDisplay
                  key={p.productUid}
                  productUid={p.productUid}
                  qrDataUrl={p.qrDataUrl}
                  name={p.name}
                  make={p.make}
                  model={p.model}
                  serialNumber={p.serialNumber}
                  quantity={p.quantity}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No products created yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
