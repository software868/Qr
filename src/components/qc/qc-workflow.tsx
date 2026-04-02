"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ProductType } from "@prisma/client";
import { toast } from "sonner";
import { getBomTemplateAction, submitQcUtilFormAction } from "@/actions/qc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [qcFields, setQcFields] = useState<{ key: string; type: "checkbox" | "textarea"; label: string }[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
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

  useEffect(() => {
    if (finalQr) return;
    startTransition(async () => {
      const res = await fetch(`/api/qc-form?productType=${encodeURIComponent(String(productType))}`);
      const json: unknown = await res.json();
      if (typeof json === "object" && json !== null && (json as { ok?: unknown }).ok === true) {
        const maybeFields = (json as { fields?: unknown }).fields;
        const fields = Array.isArray(maybeFields)
          ? (maybeFields as { key: string; type: "checkbox" | "textarea"; label: string }[])
          : [];
        setQcFields(fields);
        const nextChecks: Record<string, boolean> = {};
        for (const f of fields) if (f.type === "checkbox") nextChecks[f.key] = false;
        setChecks(nextChecks);
      } else {
        setQcFields([]);
        setChecks({});
      }
    });
  }, [productType, finalQr]);

  const computedResult = useMemo(() => {
    const checkboxKeys = qcFields.filter((f) => f.type === "checkbox").map((f) => f.key);
    if (checkboxKeys.length === 0) return "pass" as const;
    return checkboxKeys.every((k) => checks[k] === true) ? ("pass" as const) : ("fail" as const);
  }, [qcFields, checks]);

  const resetSession = useCallback(() => {
    for (const u of previews) URL.revokeObjectURL(u);
    setNotes("");
    setFiles([]);
    setPreviews([]);
    setFinalQr(null);
    setQcFields([]);
    setChecks({});
  }, [previews]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (computedResult === "fail") {
      toast.error("All checklist items must pass before submission.");
      return;
    }

    const fd = new FormData();
    fd.set("productType", productType);
    fd.set("inspectorNotes", notes);
    fd.set("bomChecks", JSON.stringify(checks));
    for (const f of files) fd.append("images", f);

    startTransition(async () => {
      const res = await submitQcUtilFormAction(fd);
      if (res.ok) {
        setFinalQr({ uid: res.entryUid, dataUrl: res.qrDataUrl });
        toast.success("Saved. Your entry UID and QR are ready.");
        return;
      }
      toast.error("error" in res ? res.error : "Failed");
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>1. Product type</CardTitle>
          <CardDescription>Choose the assembly type. The checklist and BOM reference update automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Type</Label>
            <Select
              value={productType}
              onValueChange={(v) => setProductType(v as ProductType)}
              disabled={!!finalQr}
            >
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
          <CardTitle>2. Dynamic checklist</CardTitle>
          <CardDescription>
            Confirm each line item. Result must be Pass before you can submit and receive a UID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {finalQr ? (
            <p className="text-sm text-muted-foreground">This session is complete. Start a new submission to edit.</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Result:</span>{" "}
                  <span
                    className={
                      computedResult === "pass"
                        ? "font-semibold text-green-600"
                        : "font-semibold text-destructive"
                    }
                  >
                    {computedResult.toUpperCase()}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Checklist</Label>
                <div className="space-y-2">
                  {qcFields
                    .filter((f) => f.type === "checkbox")
                    .map((f) => (
                      <label key={f.key} className="flex items-start gap-2 rounded-md border p-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checks[f.key] === true}
                          onChange={(e) => setChecks((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        />
                        <span className="text-sm">{f.label}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
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
                      setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
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
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") fileInputRef.current?.click();
                    }}
                    className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <span className="text-sm font-medium text-muted-foreground">Upload file</span>
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
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending || computedResult !== "pass"}>
                  {pending ? "Saving…" : "Submit & generate UID + QR"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {finalQr && (
        <div className="space-y-4">
          <QrDisplay
            uid={finalQr.uid}
            qrDataUrl={finalQr.dataUrl}
            detailRows={[{ label: "Product type", value: TYPE_LABEL[productType] }]}
          />
          <Button type="button" variant="secondary" onClick={resetSession}>
            New submission
          </Button>
        </div>
      )}
    </div>
  );
}
