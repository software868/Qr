"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { labelForChecklistKey } from "@/lib/qc-util/checklists";

type SubmittedChecklistRow = {
  key: string;
  label?: string;
  specification?: string;
  observation?: string;
  checked?: boolean;
  custom?: boolean;
};

export type AdminQcUtilEntryViewData = {
  entryUid: string;
  productType: string;
  createdAtIso: string;
  performedBy: { name: string; email: string };
  formData: {
    passStatus?: string;
    lotNumber?: string;
    inspectorNotes?: string;
    checklist?: Record<string, boolean>;
    checklistRows?: SubmittedChecklistRow[];
    /** Older submissions only */
    bomChecks?: Record<string, boolean>;
  } | null;
  images: { id: string; url: string }[];
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function typeLabel(t: string) {
  return t.replaceAll("_", " ");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function storedChecklist(fd: AdminQcUtilEntryViewData["formData"]): Record<string, boolean> {
  if (!fd) return {};
  const raw = fd.checklist ?? fd.bomChecks;
  return raw && typeof raw === "object" ? raw : {};
}

function storedChecklistRows(fd: AdminQcUtilEntryViewData["formData"]): SubmittedChecklistRow[] {
  if (!Array.isArray(fd?.checklistRows)) return [];
  return fd.checklistRows.filter((row) => row && typeof row.key === "string");
}

function buildPrintableHtml(data: AdminQcUtilEntryViewData): string {
  const fd = data.formData;
  const checklist = storedChecklist(fd);
  const submittedRows = storedChecklistRows(fd);
  const rows = submittedRows.length > 0
    ? submittedRows.map(
        (row) =>
          `<tr><td>${escapeHtml(row.label || labelForChecklistKey(row.key))}</td><td>${escapeHtml(row.specification ?? "")}</td><td>${escapeHtml(row.observation ?? "")}</td><td>${row.checked ? "Yes" : "No"}</td></tr>`,
      )
    : Object.entries(checklist)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([k, v]) =>
            `<tr><td>${escapeHtml(labelForChecklistKey(k))}</td><td></td><td></td><td>${v ? "Yes" : "No"}</td></tr>`,
        );
  const notes = escapeHtml((fd?.inspectorNotes ?? "").trim() || "—");
  const lotNumber = escapeHtml((fd?.lotNumber ?? "").trim() || "—");
  const imgs = data.images
    .map(
      (img) =>
        `<div style="margin:8px 0"><img src="${escapeHtml(img.url)}" alt="" style="max-width:100%;max-height:280px;border:1px solid #ccc" /></div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(data.entryUid)}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#111;max-width:900px;margin:0 auto}
h1{font-size:20px;margin:0 0 8px}
.meta{font-size:13px;color:#444;margin-bottom:20px}
table{border-collapse:collapse;width:100%;margin:12px 0 20px;font-size:13px}
th,td{border:1px solid #ccc;padding:8px;text-align:left}
th{background:#f4f4f4}
.section{margin-top:20px}
</style></head><body>
<h1>Finished Goods Test Report — Submission</h1>
<div class="meta">
<div><strong>Entry UID:</strong> ${escapeHtml(data.entryUid)}</div>
<div><strong>Product type:</strong> ${escapeHtml(typeLabel(data.productType))}</div>
<div><strong>Lot number:</strong> ${lotNumber}</div>
<div><strong>Submitted:</strong> ${escapeHtml(formatDate(data.createdAtIso))}</div>
<div><strong>Submitted by:</strong> ${escapeHtml(data.performedBy.name)} (${escapeHtml(data.performedBy.email)})</div>
<div><strong>Result:</strong> ${escapeHtml(fd?.passStatus ?? "—")}</div>
</div>
<h2 style="font-size:16px;margin:0 0 8px">Submitted checklist</h2>
<table><thead><tr><th>Item</th><th>Specification</th><th>Observation</th><th>Passed</th></tr></thead><tbody>${
    rows.length ? rows.join("") : "<tr><td colspan='2'>No checklist data</td></tr>"
  }</tbody></table>
<div class="section"><h2 style="font-size:16px;margin:0 0 8px">Notes</h2><p style="white-space:pre-wrap;font-size:13px">${notes}</p></div>
<div class="section"><h2 style="font-size:16px;margin:0 0 8px">Images</h2>${imgs || "<p style='font-size:13px;color:#666'>No images</p>"}</div>
</body></html>`;
}

export function AdminQcUtilEntryView({ data }: { data: AdminQcUtilEntryViewData }) {
  const router = useRouter();
  const fd = data.formData;
  const checklistEntries = Object.entries(storedChecklist(fd)).sort(([a], [b]) => a.localeCompare(b));
  const checklistRows = storedChecklistRows(fd);

  function printAsPdf() {
    const html = buildPrintableHtml(data);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      window.setTimeout(() => {
        w.focus();
        w.print();
      }, 300);
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/admin")}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to dashboard
        </Button>
        <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={printAsPdf}>
          <FileDown className="h-4 w-4 shrink-0" aria-hidden />
          View / print as PDF
        </Button>
        <p className="text-xs text-muted-foreground">
          Opens a printable view—use your browser’s <strong>Save as PDF</strong> or print dialog.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">{data.entryUid}</CardTitle>
          <CardDescription>Submitted {formatDate(data.createdAtIso)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Product type" value={typeLabel(data.productType)} />
            <Detail label="Lot number" value={fd?.lotNumber?.trim() || "—"} />
            <Detail label="Result" value={fd?.passStatus ?? "—"} />
            <Detail label="Submitted by" value={`${data.performedBy.name} (${data.performedBy.email})`} />
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-sm font-semibold">Submitted form (checklist)</h3>
            {checklistEntries.length === 0 && checklistRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checklist data stored for this entry.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Specification</TableHead>
                      <TableHead>Observation</TableHead>
                      <TableHead className="w-[100px]">Passed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklistRows.length > 0
                      ? checklistRows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell className="text-sm">{row.label || labelForChecklistKey(row.key)}</TableCell>
                            <TableCell className="text-sm">{row.specification || "—"}</TableCell>
                            <TableCell className="text-sm">{row.observation || "—"}</TableCell>
                            <TableCell className="text-sm">{row.checked ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        ))
                      : checklistEntries.map(([key, passed]) => (
                          <TableRow key={key}>
                            <TableCell className="text-sm">{labelForChecklistKey(key)}</TableCell>
                            <TableCell className="text-sm">—</TableCell>
                            <TableCell className="text-sm">—</TableCell>
                            <TableCell className="text-sm">{passed ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Notes</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {fd?.inspectorNotes?.trim() || "—"}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Images</h3>
            {data.images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images uploaded.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      width={400}
                      height={300}
                      className="h-auto w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
