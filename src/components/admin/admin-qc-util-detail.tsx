"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type AdminQcUtilDetailBom = {
  lines: { id: string; partCode: string; description: string; expectedQty: number }[];
} | null;

export type AdminQcUtilDetailPayload = {
  entryUid: string;
  productType: string;
  createdAtIso: string;
  performedBy: { name: string; email: string };
  formData: {
    passStatus?: string;
    inspectorNotes?: string;
    bomChecks?: Record<string, boolean>;
  } | null;
  images: { id: string; url: string }[];
  bom: AdminQcUtilDetailBom;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function typeLabel(t: string) {
  return t.replaceAll("_", " ");
}

export function AdminQcUtilDetail({ data }: { data: AdminQcUtilDetailPayload }) {
  const { entryUid, bom, formData } = data;
  const bomChecks = formData?.bomChecks ?? {};
  const lines = bom?.lines ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/admin">
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bom">BOM template</TabsTrigger>
          <TabsTrigger value="form">Form data</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">{entryUid}</CardTitle>
              <CardDescription>Submitted {formatDate(data.createdAtIso)}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Product type" value={typeLabel(data.productType)} />
              <Detail label="Result" value={formData?.passStatus ?? "—"} />
              <Detail
                label="Submitted by"
                value={`${data.performedBy.name} (${data.performedBy.email})`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom">
          <Card>
            <CardHeader>
              <CardTitle>Bill of materials (template)</CardTitle>
              <CardDescription>Checklist labels for {typeLabel(data.productType)}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {lines.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Part</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Checked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, i) => {
                      const key = `bomOk:${line.id}`;
                      const ok = bomChecks[key] === true;
                      return (
                        <TableRow key={line.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-mono">{line.partCode}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">{line.expectedQty}</TableCell>
                          <TableCell className="text-right">{ok ? "Yes" : "No"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No BOM template for this type.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Complete form payload</CardTitle>
              <CardDescription>Inspector notes and raw checklist map</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Inspector notes</p>
                <p className="mt-1 whitespace-pre-wrap">{formData?.inspectorNotes?.trim() || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">BOM check keys</p>
                <ul className="mt-2 list-inside list-disc font-mono text-xs">
                  {Object.keys(bomChecks).length === 0 ? (
                    <li className="text-muted-foreground">No checkbox data</li>
                  ) : (
                    Object.entries(bomChecks).map(([k, v]) => (
                      <li key={k}>
                        {k}: {String(v)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">JSON</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {JSON.stringify(formData ?? {}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded images</CardTitle>
              <CardDescription>Photos captured or uploaded with this submission</CardDescription>
            </CardHeader>
            <CardContent>
              {data.images.length > 0 ? (
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
                        alt="Submission"
                        width={400}
                        height={300}
                        className="h-auto w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
