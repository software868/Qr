"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type AdminProductDetailBom = {
  lines: { id: string; partCode: string; description: string; expectedQty: number }[];
} | null;

export type AdminProductDetailPayload = {
  productUid: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  quantity: number;
  status: string;
  createdAtIso: string;
  dateIso: string;
  createdBy: { name: string; email: string };
  qcRecord: null | {
    finalProductUid: string;
    productType: string;
    createdAtIso: string;
    scannedItemUids: string[];
    formData: { passStatus?: string; inspectorNotes?: string } | null;
    performedBy: { name: string; email: string };
    images: { id: string; url: string }[];
  };
  bom: AdminProductDetailBom;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function AdminProductDetail({ data }: { data: AdminProductDetailPayload }) {
  const { productUid, status, bom } = data;
  const qc = data.qcRecord;
  const formData = qc?.formData ?? null;
  const scanned = Array.isArray(qc?.scannedItemUids) ? qc.scannedItemUids : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/admin">
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to dashboard
          </Link>
        </Button>
        <Badge variant={status === "QC_COMPLETE" ? "default" : "secondary"}>{status}</Badge>
      </div>

      <Tabs defaultValue="product" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="product">Product</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="qc">QC</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">{productUid}</CardTitle>
              <CardDescription>Created {formatDate(data.createdAtIso)}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Name" value={data.name} />
              <Detail label="Make" value={data.make} />
              <Detail label="Model" value={data.model} />
              <Detail label="Serial" value={data.serialNumber} />
              <Detail label="Quantity" value={String(data.quantity)} />
              <Detail label="Date" value={formatDateOnly(data.dateIso)} />
              <Detail label="Created by" value={`${data.createdBy.name} (${data.createdBy.email})`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom">
          <Card>
            <CardHeader>
              <CardTitle>Bill of materials</CardTitle>
              <CardDescription>
                {qc
                  ? `Template for ${String(qc.productType).replaceAll("_", " ")}`
                  : "QC has not been completed — BOM appears after QC selects a product type."}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {bom?.lines?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Part</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bom.lines.map((line, i) => (
                      <TableRow key={line.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono">{line.partCode}</TableCell>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right">{line.expectedQty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No BOM data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qc">
          <Card>
            <CardHeader>
              <CardTitle>Quality check</CardTitle>
              <CardDescription>
                {qc
                  ? `Final UID: ${qc.finalProductUid} · ${formatDate(qc.createdAtIso)}`
                  : "No QC record yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {qc ? (
                <>
                  <p>
                    <span className="text-muted-foreground">Performed by:</span>{" "}
                    {qc.performedBy.name} ({qc.performedBy.email})
                  </p>
                  <p>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {String(qc.productType).replaceAll("_", " ")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Result:</span> {formData?.passStatus ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Notes:</span> {formData?.inspectorNotes || "—"}
                  </p>
                  <div>
                    <p className="text-muted-foreground">Scanned item UIDs</p>
                    <ul className="mt-1 list-inside list-disc font-mono text-xs">
                      {scanned.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">QC not submitted for this product.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>QC images</CardTitle>
              <CardDescription>Images uploaded during quality check.</CardDescription>
            </CardHeader>
            <CardContent>
              {qc?.images && qc.images.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {qc.images.map((img) => (
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
                        alt="QC"
                        width={400}
                        height={300}
                        className="h-auto w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images uploaded.</p>
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
