"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ProductType } from "@prisma/client";
import { toast } from "sonner";
import { submitQcUtilFormAction } from "@/actions/qc";
import {
  TVU_CHECKLIST_ROWS,
  BHP_CHECKLIST_ROWS,
  CONTROL_PANEL_CHECKLIST_ROWS,
  WVU_CHECKLIST_ROWS,
  AAS_CHECKLIST_ROWS,
} from "@/lib/qc-util/checklists";
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

type BedHeadPanelBomRow = {
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

const BED_HEAD_PANEL_BOM: BedHeadPanelBomRow[] = [
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
  { sr: 2, componentName: "Alum. Profile for BHP (Matco-93)", sizeMm: "3660", qaGrnNo: "''", qtyInOnePcs: "2400 mm", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "60", remark: "" },
  { sr: 3, componentName: "Alum. Profile for BHP (Matco-94)", sizeMm: "3660", qaGrnNo: "''", qtyInOnePcs: "3600 mm", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "90", remark: "" },
  { sr: 4, componentName: "SS Pipe 20x10x18 G", sizeMm: "6096", qaGrnNo: "''", qtyInOnePcs: "900 mm", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "14", remark: "20 Feet Long" },
  { sr: 5, componentName: "SS Pipe 3/8\" x 18 G", sizeMm: "6096", qaGrnNo: "''", qtyInOnePcs: "-", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "2", remark: "20 Feet Long" },
  { sr: 6, componentName: "Electric Switch 15 A", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "7", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "630", remark: "" },
  { sr: 7, componentName: "Electric Socket 05/15 A", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "6", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "540", remark: "" },
  { sr: 8, componentName: "Blanking Plate 1 Module", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "4", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "360", remark: "" },
  { sr: 9, componentName: "Surround Plate 2 Module", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "3", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "270", remark: "" },
  { sr: 10, componentName: "Surround Plate 3 Module", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "2", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "180", remark: "" },
  { sr: 11, componentName: "Surround Plate 6 Module", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "2", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "180", remark: "" },
  { sr: 12, componentName: "RJ-45 Socket", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "1", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "90", remark: "" },
  { sr: 13, componentName: "Corrugated Box 5 Ply", sizeMm: "", qaGrnNo: "''", qtyInOnePcs: "1", qtyRequired: "90", unit: "Nos", issuedFullLength3660: "90", remark: "" },
];

const TYPE_LABEL: Record<ProductType, string> = {
  CONTROL_PANEL: "Surgeon Control Panel",
  IPS: "IPS (legacy)",
  THEATRE_VACUUM_UNIT: "Theatre Vacuum Unit (TVU)",
  BED_HEAD_PANEL: "Bed Head Panel (BHP)",
  WARD_VACUUM_UNIT: "Ward Vacuum Unit (WVU)",
  AREA_ALARM_SYSTEM: "Area Alarm System",
};

/** Product types users can choose for new submissions (excludes legacy enum values). */
const CHECK_FORM_PRODUCT_TYPES: ProductType[] = [
  ProductType.CONTROL_PANEL,
  ProductType.THEATRE_VACUUM_UNIT,
  ProductType.BED_HEAD_PANEL,
  ProductType.WARD_VACUUM_UNIT,
  ProductType.AREA_ALARM_SYSTEM,
];

export function QcWorkflow() {
  const [productType, setProductType] = useState<ProductType>(ProductType.CONTROL_PANEL);
  const [qcFields, setQcFields] = useState<{ key: string; type: "checkbox" | "textarea"; label: string }[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [finalQr, setFinalQr] = useState<{ uid: string; dataUrl: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (finalQr) return;

    if (productType === ProductType.THEATRE_VACUUM_UNIT) {
      const tvuFields = TVU_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: `${r.test} — ${r.specification}`,
      }));
      setQcFields(tvuFields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of tvuFields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.WARD_VACUUM_UNIT) {
      const wvuFields = WVU_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(wvuFields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of wvuFields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.AREA_ALARM_SYSTEM) {
      const aasFields = AAS_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(aasFields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of aasFields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.BED_HEAD_PANEL) {
      const bhpFields = BHP_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(bhpFields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of bhpFields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.CONTROL_PANEL) {
      const cpFields = CONTROL_PANEL_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(cpFields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of cpFields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    setQcFields([]);
    setChecks({});
  }, [productType, finalQr]);

  const checkboxKeys = useMemo(() => qcFields.filter((f) => f.type === "checkbox").map((f) => f.key), [qcFields]);
  const hasChecklist = checkboxKeys.length > 0;

  const computedResult = useMemo(() => {
    if (!hasChecklist) return "fail" as const;
    return checkboxKeys.every((k) => checks[k] === true) ? ("pass" as const) : ("fail" as const);
  }, [checkboxKeys, checks, hasChecklist]);

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
    if (!hasChecklist) {
      toast.error("Checklist is not configured for this product type yet.");
      return;
    }
    if (computedResult === "fail") {
      toast.error("All checklist items must pass before submission.");
      return;
    }

    const fd = new FormData();
    fd.set("productType", productType);
    fd.set("inspectorNotes", notes);
    fd.set("checklist", JSON.stringify(checks));
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
          <CardDescription>Choose the assembly type. The checklist in step 2 updates for the selected type.</CardDescription>
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
                {CHECK_FORM_PRODUCT_TYPES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {TYPE_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Use step 2 to complete the finished-goods checklist for this product type.
          </p>
          {productType === ProductType.BED_HEAD_PANEL ? (
            <div className="space-y-2 pt-3">
              <p className="text-sm font-semibold">Bill of Material (Bed Head Panel)</p>
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
                    {BED_HEAD_PANEL_BOM.map((r) => (
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
            </div>
          ) : null}
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
                {!hasChecklist && (
                  <p className="mt-1 text-xs text-muted-foreground">Select a product type to load its checklist.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Checklist</Label>
                {productType === ProductType.THEATRE_VACUUM_UNIT ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Finished Goods Test Report</h3>
                    <h4 className="text-sm">
                      Result:{" "}
                      <span className={computedResult === "pass" ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                        {computedResult.toUpperCase()}
                      </span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="border p-2 text-left text-xs">Sr. No.</th>
                            <th className="border p-2 text-left text-xs">TESTS</th>
                            <th className="border p-2 text-left text-xs">SPECIFICATION</th>
                            <th className="border p-2 text-left text-xs">OBSERVATION</th>
                            <th className="border p-2 text-left text-xs">RESULT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {TVU_CHECKLIST_ROWS.map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm">{row.srNo}</td>
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({
                                      ...prev,
                                      [row.key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.CONTROL_PANEL ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Finished Goods Test Report</h3>
                    <h4 className="text-sm">
                      Result:{" "}
                      <span
                        className={
                          computedResult === "pass"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {computedResult.toUpperCase()}
                      </span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="border p-2 text-left text-xs">Sr. No.</th>
                            <th className="border p-2 text-left text-xs">TESTS</th>
                            <th className="border p-2 text-left text-xs">SPECIFICATION</th>
                            <th className="border p-2 text-left text-xs">OBSERVATION</th>
                            <th className="border p-2 text-left text-xs">RESULT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="border p-2">
                              <b>(A) PHYSICAL TEST</b>
                            </td>
                          </tr>

                          <tr>
                            <td className="border p-2 text-sm">1</td>
                            <td className="border p-2 text-sm">
                              <b>Surgeon Control Panel</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {/* Physical test sub-items */}
                          {CONTROL_PANEL_CHECKLIST_ROWS.slice(0, 5).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({
                                      ...prev,
                                      [row.key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}

                          <tr>
                            <td colSpan={5} className="border p-2">
                              <b>(B) MICRO-BIOLOGICAL TEST</b>
                            </td>
                          </tr>

                          {/* Micro-biological */}
                          {CONTROL_PANEL_CHECKLIST_ROWS.slice(5, 6).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm">2</td>
                              <td className="border p-2 text-sm">
                                <b>{row.test}</b>
                              </td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2" />
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({
                                      ...prev,
                                      [row.key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}

                          <tr>
                            <td colSpan={5} className="border p-2">
                              <b>(D) BIOLOGICAL TEST</b>
                            </td>
                          </tr>

                          {/* Biological */}
                          {CONTROL_PANEL_CHECKLIST_ROWS.slice(6, 7).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm">3</td>
                              <td className="border p-2 text-sm">
                                <b>{row.test}</b>
                              </td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2" />
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({
                                      ...prev,
                                      [row.key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.WARD_VACUUM_UNIT ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Finished Goods Test Report</h3>
                    <h4 className="text-sm">
                      Result:{" "}
                      <span
                        className={
                          computedResult === "pass"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {computedResult.toUpperCase()}
                      </span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="border p-2 text-left text-xs">Sr. No.</th>
                            <th className="border p-2 text-left text-xs">TESTS</th>
                            <th className="border p-2 text-left text-xs">SPECIFICATION</th>
                            <th className="border p-2 text-left text-xs">OBSERVATION</th>
                            <th className="border p-2 text-left text-xs">RESULT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="border p-2">
                              <b>(A) PHYSICAL TEST</b>
                            </td>
                          </tr>

                          <tr>
                            <td className="border p-2 text-sm">1</td>
                            <td className="border p-2 text-sm">
                              <b>Suction Jar</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {WVU_CHECKLIST_ROWS.slice(0, 5).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({ ...prev, [row.key]: e.target.checked }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}

                          <tr>
                            <td className="border p-2" />
                            <td className="border p-2">
                              <b>Jar Cap</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {/* Jar Cap Material */}
                          {WVU_CHECKLIST_ROWS.slice(5, 6).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({ ...prev, [row.key]: e.target.checked }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}

                          {/* Fixture header */}
                          <tr>
                            <td className="border p-2" />
                            <td className="border p-2">
                              <b>Fixture</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {/* Fixture sub items: indexes 6..13 */}
                          {WVU_CHECKLIST_ROWS.slice(6, 14).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({ ...prev, [row.key]: e.target.checked }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}

                          <tr>
                            <td className="border p-2 text-sm">2</td>
                            <td className="border p-2 text-sm">
                              <b>Leakage</b>
                            </td>
                            <td className="border p-2 text-sm">{WVU_CHECKLIST_ROWS[14].specification}</td>
                            <td className="border p-2 text-sm">{WVU_CHECKLIST_ROWS[14].observation}</td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[WVU_CHECKLIST_ROWS[14].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({
                                    ...prev,
                                    [WVU_CHECKLIST_ROWS[14].key]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.AREA_ALARM_SYSTEM ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Finished Goods Test Report</h3>
                    <h4 className="text-sm">
                      Result:{" "}
                      <span
                        className={
                          computedResult === "pass"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {computedResult.toUpperCase()}
                      </span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="border p-2 text-left text-xs">Sr. No.</th>
                            <th className="border p-2 text-left text-xs">TESTS</th>
                            <th className="border p-2 text-left text-xs">SPECIFICATION</th>
                            <th className="border p-2 text-left text-xs">OBSERVATION</th>
                            <th className="border p-2 text-left text-xs">RESULT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2 text-sm">1</td>
                            <td className="border p-2 text-sm">
                              <b>Area Alarm System</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {AAS_CHECKLIST_ROWS.map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({
                                      ...prev,
                                      [row.key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.BED_HEAD_PANEL ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Finished Goods Test Report</h3>
                    <h4 className="text-sm">
                      Result:{" "}
                      <span
                        className={
                          computedResult === "pass"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {computedResult.toUpperCase()}
                      </span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="border p-2 text-left text-xs">Sr. No.</th>
                            <th className="border p-2 text-left text-xs">TESTS</th>
                            <th className="border p-2 text-left text-xs">SPECIFICATION</th>
                            <th className="border p-2 text-left text-xs">OBSERVATION</th>
                            <th className="border p-2 text-left text-xs">RESULT</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="border p-2">
                              <b>(A) PHYSICAL TEST</b>
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm">1</td>
                            <td className="border p-2 text-sm">
                              <b>Bed Head Panel</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {BHP_CHECKLIST_ROWS.map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">{row.specification}</td>
                              <td className="border p-2 text-sm">{row.observation}</td>
                              <td className="border p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checks[row.key] === true}
                                  onChange={(e) =>
                                    setChecks((prev) => ({
                                      ...prev,
                                      [row.key]: e.target.checked,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
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
                <Button type="submit" disabled={pending || !hasChecklist || computedResult !== "pass"}>
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
