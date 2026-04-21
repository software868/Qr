"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BomRow = {
  sr: number;
  componentName: string;
  sizeMm: string;
  qaGrnNo: string;
  qtyInOnePcs: string;
  qtyRequired: string;
  unit: string;
  issuedFullLength3660: string;
  remark: string;
};

const BHP_BOM: BomRow[] = [
  {
    sr: 1,
    componentName: "Alum. Profile for BHP (Matco-92)",
    sizeMm: "3660",
    qaGrnNo: "Opening Stock",
    qtyInOnePcs: "1200 mm",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "30",
    remark: "",
  },
  {
    sr: 2,
    componentName: "Alum. Profile for BHP (Matco-93)",
    sizeMm: "3660",
    qaGrnNo: "''",
    qtyInOnePcs: "2400 mm",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "60",
    remark: "",
  },
  {
    sr: 3,
    componentName: "Alum. Profile for BHP (Matco-94)",
    sizeMm: "3660",
    qaGrnNo: "''",
    qtyInOnePcs: "3600 mm",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "90",
    remark: "",
  },
  {
    sr: 4,
    componentName: "SS Pipe 20x10x18 G",
    sizeMm: "6096",
    qaGrnNo: "''",
    qtyInOnePcs: "900 mm",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "14",
    remark: "20 Feet Long",
  },
  {
    sr: 5,
    componentName: "SS Pipe 3/8\" x 18 G",
    sizeMm: "6096",
    qaGrnNo: "''",
    qtyInOnePcs: "-",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "2",
    remark: "20 Feet Long",
  },
  {
    sr: 6,
    componentName: "Electric Switch 15 A",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "7",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "630",
    remark: "",
  },
  {
    sr: 7,
    componentName: "Electric Socket 05/15 A",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "6",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "540",
    remark: "",
  },
  {
    sr: 8,
    componentName: "Blanking Plate 1 Module",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "4",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "360",
    remark: "",
  },
  {
    sr: 9,
    componentName: "Surround Plate 2 Module",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "3",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "270",
    remark: "",
  },
  {
    sr: 10,
    componentName: "Surround Plate 3 Module",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "2",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "180",
    remark: "",
  },
  {
    sr: 11,
    componentName: "Surround Plate 6 Module",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "2",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "180",
    remark: "",
  },
  {
    sr: 12,
    componentName: "RJ-45 Socket",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "1",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "90",
    remark: "",
  },
  {
    sr: 13,
    componentName: "Corrugated Box 5 Ply",
    sizeMm: "",
    qaGrnNo: "''",
    qtyInOnePcs: "1",
    qtyRequired: "90",
    unit: "Nos",
    issuedFullLength3660: "90",
    remark: "",
  },
];

export default function BedHeadPanelBomPage() {
  return (
    <div className="container mx-auto max-w-6xl space-y-4 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Bill of Material (BOM)</h1>
          <p className="text-sm text-muted-foreground">Product: Bed Head Panel</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/qc">Back to check form</Link>
          </Button>
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Prenit World LLP — Component Issue Record</CardTitle>
          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
            <div>
              <span className="font-medium text-foreground">Product code:</span> 013
            </div>
            <div>
              <span className="font-medium text-foreground">Lot no:</span> 2504013
            </div>
            <div>
              <span className="font-medium text-foreground">Total qty (pcs):</span> 90
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">S. No.</TableHead>
                  <TableHead className="min-w-[280px]">Component name</TableHead>
                  <TableHead className="w-[110px]">Size (mm)</TableHead>
                  <TableHead className="w-[140px]">QA/GRN No.</TableHead>
                  <TableHead className="w-[130px]">Qty. in one (pcs)</TableHead>
                  <TableHead className="w-[120px]">Qty. required</TableHead>
                  <TableHead className="w-[90px]">Unit</TableHead>
                  <TableHead className="w-[170px]">Issued full length (3660 mm)</TableHead>
                  <TableHead className="min-w-[160px]">Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BHP_BOM.map((r) => (
                  <TableRow key={r.sr}>
                    <TableCell>{r.sr}</TableCell>
                    <TableCell className="font-medium">{r.componentName}</TableCell>
                    <TableCell>{r.sizeMm || "—"}</TableCell>
                    <TableCell>{r.qaGrnNo || "—"}</TableCell>
                    <TableCell>{r.qtyInOnePcs || "—"}</TableCell>
                    <TableCell>{r.qtyRequired || "—"}</TableCell>
                    <TableCell>{r.unit || "—"}</TableCell>
                    <TableCell>{r.issuedFullLength3660 || "—"}</TableCell>
                    <TableCell>{r.remark || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

