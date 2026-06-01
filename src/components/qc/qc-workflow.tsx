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
  MGTU_OUTLET_POINT_CHECKLIST_ROWS,
  OT_LIGHT_CHECKLIST_ROWS,
  AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS,
  ISOLATION_VALVE_CHECKLIST_ROWS,
} from "@/lib/qc-util/checklists";
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
import { Separator } from "@/components/ui/separator";
import { CameraCaptureButton } from "@/components/qc/camera-capture";
import { QrDisplay } from "@/components/qr/qr-display";

const TYPE_LABEL: Record<ProductType, string> = {
  CONTROL_PANEL: "Surgeon Control Panel",
  IPS: "IPS (legacy)",
  THEATRE_VACUUM_UNIT: "Theatre Vacuum Unit (TVU)",
  BED_HEAD_PANEL: "Bed Head Panel (BHP)",
  WARD_VACUUM_UNIT: "Ward Vacuum Unit (WVU)",
  AREA_ALARM_SYSTEM: "Area Alarm System",
  MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT: "Medical Gas Terminal Unit (Outlet Point)",
  ISOLATION_VALVE: "Isolation Valve",
  AREA_VALVE_SERVICE_UNIT: "Area Valve Service Unit",
  OT_LIGHT: "OT Light",
};

/** Product types users can choose for new submissions (excludes legacy enum values). */
const CHECK_FORM_PRODUCT_TYPES: ProductType[] = [
  ProductType.CONTROL_PANEL,
  ProductType.THEATRE_VACUUM_UNIT,
  ProductType.BED_HEAD_PANEL,
  ProductType.WARD_VACUUM_UNIT,
  ProductType.AREA_ALARM_SYSTEM,
  ProductType.MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT,
  ProductType.ISOLATION_VALVE,
  ProductType.AREA_VALVE_SERVICE_UNIT,
  ProductType.OT_LIGHT,
];

type ChecklistRowLike = {
  key: string;
  srNo?: number;
  test: string;
  specification: string;
  observation: string;
};

const CHECKLIST_ROWS_BY_TYPE: Partial<Record<ProductType, ChecklistRowLike[]>> = {
  [ProductType.CONTROL_PANEL]: CONTROL_PANEL_CHECKLIST_ROWS,
  [ProductType.THEATRE_VACUUM_UNIT]: TVU_CHECKLIST_ROWS,
  [ProductType.BED_HEAD_PANEL]: BHP_CHECKLIST_ROWS,
  [ProductType.WARD_VACUUM_UNIT]: WVU_CHECKLIST_ROWS,
  [ProductType.AREA_ALARM_SYSTEM]: AAS_CHECKLIST_ROWS,
  [ProductType.MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT]: MGTU_OUTLET_POINT_CHECKLIST_ROWS,
  [ProductType.ISOLATION_VALVE]: ISOLATION_VALVE_CHECKLIST_ROWS,
  [ProductType.AREA_VALVE_SERVICE_UNIT]: AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS,
  [ProductType.OT_LIGHT]: OT_LIGHT_CHECKLIST_ROWS,
};

const CHECKLIST_SECTION_COUNT_BY_TYPE: Partial<Record<ProductType, number>> = {
  [ProductType.CONTROL_PANEL]: 3,
  [ProductType.THEATRE_VACUUM_UNIT]: 0,
  [ProductType.BED_HEAD_PANEL]: 1,
  [ProductType.WARD_VACUUM_UNIT]: 1,
  [ProductType.AREA_ALARM_SYSTEM]: 1,
  [ProductType.MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT]: 1,
  [ProductType.ISOLATION_VALVE]: 1,
  [ProductType.AREA_VALVE_SERVICE_UNIT]: 1,
  [ProductType.OT_LIGHT]: 1,
};

type RowEdit = {
  specification: string;
  observation: string;
};

export function QcWorkflow() {
  const [productType, setProductType] = useState<ProductType>(ProductType.CONTROL_PANEL);
  const [lotNumber, setLotNumber] = useState("");
  const [rowEdits, setRowEdits] = useState<Record<string, RowEdit>>({});
  const [customRowsByType, setCustomRowsByType] = useState<Partial<Record<ProductType, ChecklistRowLike[]>>>({});
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

    if (productType === ProductType.MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT) {
      const fields = MGTU_OUTLET_POINT_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(fields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of fields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.OT_LIGHT) {
      const fields = OT_LIGHT_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(fields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of fields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.AREA_VALVE_SERVICE_UNIT) {
      const fields = AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(fields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of fields) nextChecks[f.key] = false;
      setChecks(nextChecks);
      return;
    }

    if (productType === ProductType.ISOLATION_VALVE) {
      const fields = ISOLATION_VALVE_CHECKLIST_ROWS.map((r) => ({
        key: r.key,
        type: "checkbox" as const,
        label: r.test,
      }));
      setQcFields(fields);

      const nextChecks: Record<string, boolean> = {};
      for (const f of fields) nextChecks[f.key] = false;
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

  const customRows = useMemo(
    () => customRowsByType[productType] ?? [],
    [customRowsByType, productType],
  );
  const checkboxKeys = useMemo(
    () => [
      ...qcFields.filter((f) => f.type === "checkbox").map((f) => f.key),
      ...customRows.map((row) => row.key),
    ],
    [customRows, qcFields],
  );
  const hasChecklist = checkboxKeys.length > 0;

  const computedResult = useMemo(() => {
    if (!hasChecklist) return "fail" as const;
    return checkboxKeys.every((k) => checks[k] === true) ? ("pass" as const) : ("fail" as const);
  }, [checkboxKeys, checks, hasChecklist]);

  const resetSession = useCallback(() => {
    for (const u of previews) URL.revokeObjectURL(u);
    setLotNumber("");
    setRowEdits({});
    setCustomRowsByType({});
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
    const cleanLotNumber = lotNumber.trim();
    if (!cleanLotNumber) {
      toast.error("Please enter the lot number.");
      return;
    }

    const fd = new FormData();
    fd.set("productType", productType);
    fd.set("lotNumber", cleanLotNumber);
    fd.set("inspectorNotes", notes);
    fd.set("checklist", JSON.stringify(checks));
    fd.set("checklistRows", JSON.stringify(buildSubmittedRows()));
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

  function rowText(row: ChecklistRowLike, field: keyof RowEdit) {
    return rowEdits[row.key]?.[field] ?? row[field];
  }

  function setRowText(row: ChecklistRowLike, field: keyof RowEdit, value: string) {
    setRowEdits((prev) => ({
      ...prev,
      [row.key]: {
        specification: prev[row.key]?.specification ?? row.specification,
        observation: prev[row.key]?.observation ?? row.observation,
        [field]: value,
      },
    }));
  }

  function addCustomRow() {
    const key = `custom:${productType}:${Date.now()}`;
    const row: ChecklistRowLike = {
      key,
      test: "",
      specification: "",
      observation: "",
    };
    setCustomRowsByType((prev) => ({
      ...prev,
      [productType]: [...(prev[productType] ?? []), row],
    }));
    setChecks((prev) => ({ ...prev, [key]: false }));
  }

  function updateCustomRow(rowKey: string, field: keyof Omit<ChecklistRowLike, "key" | "srNo">, value: string) {
    setCustomRowsByType((prev) => ({
      ...prev,
      [productType]: (prev[productType] ?? []).map((row) =>
        row.key === rowKey ? { ...row, [field]: value } : row,
      ),
    }));
  }

  function removeCustomRow(rowKey: string) {
    setCustomRowsByType((prev) => ({
      ...prev,
      [productType]: (prev[productType] ?? []).filter((row) => row.key !== rowKey),
    }));
    setChecks((prev) => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });
  }

  function buildSubmittedRows() {
    const baseRows = (CHECKLIST_ROWS_BY_TYPE[productType] ?? []).map((row) => ({
      key: row.key,
      label: row.test,
      specification: rowText(row, "specification"),
      observation: rowText(row, "observation"),
      checked: checks[row.key] === true,
      custom: false,
    }));
    const extraRows = customRows.map((row) => ({
      key: row.key,
      label: row.test,
      specification: row.specification,
      observation: row.observation,
      checked: checks[row.key] === true,
      custom: true,
    }));
    return [...baseRows, ...extraRows];
  }

  function renderEditableCell({
    row,
    field,
    placeholder,
  }: {
    row: ChecklistRowLike;
    field: keyof RowEdit;
    placeholder?: string;
  }) {
    return (
      <Textarea
        value={rowText(row, field)}
        onChange={(e) => setRowText(row, field, e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="min-h-14 resize-y border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
      />
    );
  }

  function renderCustomRows() {
    if (customRows.length === 0) return null;
    const sectionLetter = String.fromCharCode(65 + (CHECKLIST_SECTION_COUNT_BY_TYPE[productType] ?? 0));

    return (
      <>
        <tr>
          <td colSpan={5} className="border p-2">
            <b>({sectionLetter}) NEW TEST ADDED BY USER</b>
          </td>
        </tr>
        {customRows.map((row, index) => (
          <tr key={row.key}>
            <td className="border p-2 text-sm">{index + 1}</td>
            <td className="border p-2">
              <Input
                value={row.test}
                onChange={(e) => updateCustomRow(row.key, "test", e.target.value)}
                placeholder="Test name"
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </td>
            <td className="border p-2">
              <Textarea
                value={row.specification}
                onChange={(e) => updateCustomRow(row.key, "specification", e.target.value)}
                rows={2}
                placeholder="Specification"
                className="min-h-14 resize-y border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </td>
            <td className="border p-2">
              <Textarea
                value={row.observation}
                onChange={(e) => updateCustomRow(row.key, "observation", e.target.value)}
                rows={2}
                placeholder="Observation"
                className="min-h-14 resize-y border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              />
            </td>
            <td className="border p-2 text-center">
              <div className="flex items-center justify-center gap-2">
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
                <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomRow(row.key)}>
                  Remove
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </>
    );
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
          <div className="max-w-xs space-y-2">
            <Label htmlFor="lotNumber">Lot number</Label>
            <Input
              id="lotNumber"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              disabled={!!finalQr}
              maxLength={120}
              placeholder="Enter lot number"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Use step 2 to complete the finished-goods checklist for this product type.
          </p>
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
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {renderCustomRows()}
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
                          {CONTROL_PANEL_CHECKLIST_ROWS.slice(0, 13).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {CONTROL_PANEL_CHECKLIST_ROWS.slice(13, 14).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm">2</td>
                              <td className="border p-2 text-sm">
                                <b>{row.test}</b>
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
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
                              <b>(C) BIOLOGICAL TEST</b>
                            </td>
                          </tr>

                          {/* Biological */}
                          {CONTROL_PANEL_CHECKLIST_ROWS.slice(14, 15).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm">3</td>
                              <td className="border p-2 text-sm">
                                <b>{row.test}</b>
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
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
                          {renderCustomRows()}
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

                          {WVU_CHECKLIST_ROWS.slice(0, 6).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {WVU_CHECKLIST_ROWS.slice(6, 7).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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

                          {/* Fixture sub items */}
                          {WVU_CHECKLIST_ROWS.slice(7, 15).map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: WVU_CHECKLIST_ROWS[15], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: WVU_CHECKLIST_ROWS[15], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[WVU_CHECKLIST_ROWS[15].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({
                                    ...prev,
                                    [WVU_CHECKLIST_ROWS[15].key]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                          {renderCustomRows()}
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
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {renderCustomRows()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT ? (
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
                              <b>Medical Gas Terminal Unit</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          <tr>
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm" rowSpan={3}>
                              Finishing
                            </td>
                            <td className="border p-2 text-sm">Smoothness</td>
                            <td className="border p-2 text-sm">Smooth</td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks["mgtu:finishing-smoothness"] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({
                                    ...prev,
                                    ["mgtu:finishing-smoothness"]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm">Brazing</td>
                            <td className="border p-2 text-sm">Copper Pipe Brazed</td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks["mgtu:finishing-brazing"] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({
                                    ...prev,
                                    ["mgtu:finishing-brazing"]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm">Cleaning</td>
                            <td className="border p-2 text-sm">Clean</td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks["mgtu:finishing-cleaning"] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({
                                    ...prev,
                                    ["mgtu:finishing-cleaning"]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                          </tr>

                          <tr>
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm">Probe Lock/ Unlock</td>
                            <td className="border p-2 text-sm">Looking and Unlocking Smooth</td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks["mgtu:probe-lock-unlock"] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({
                                    ...prev,
                                    ["mgtu:probe-lock-unlock"]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                          {renderCustomRows()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.OT_LIGHT ? (
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
                            <td className="border p-2 text-sm" rowSpan={2}>
                              Illumination Level
                            </td>
                            <td className="border p-2 text-sm">
                              <div className="font-medium">Major Dome</div>
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[0], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[0], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[0].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[0].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm">
                              <div className="font-medium">Minor Dome</div>
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[1], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[1], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[1].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[1].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>

                          <tr>
                            <td className="border p-2 text-sm">2</td>
                            <td className="border p-2 text-sm">{OT_LIGHT_CHECKLIST_ROWS[2].test}</td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[2], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[2], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[2].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[2].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm">3</td>
                            <td className="border p-2 text-sm">{OT_LIGHT_CHECKLIST_ROWS[3].test}</td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[3], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[3], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[3].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[3].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm">4</td>
                            <td className="border p-2 text-sm">{OT_LIGHT_CHECKLIST_ROWS[4].test}</td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[4], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[4], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[4].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[4].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm">5</td>
                            <td className="border p-2 text-sm">{OT_LIGHT_CHECKLIST_ROWS[5].test}</td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[5], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[5], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[5].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[5].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm" />
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[6], field: "specification" })}
                            </td>
                            <td className="border p-2 text-sm">
                              {renderEditableCell({ row: OT_LIGHT_CHECKLIST_ROWS[6], field: "observation" })}
                            </td>
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                checked={checks[OT_LIGHT_CHECKLIST_ROWS[6].key] === true}
                                onChange={(e) =>
                                  setChecks((prev) => ({ ...prev, [OT_LIGHT_CHECKLIST_ROWS[6].key]: e.target.checked }))
                                }
                              />
                            </td>
                          </tr>
                          {renderCustomRows()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.AREA_VALVE_SERVICE_UNIT ? (
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
                              <b>Area Valve Service Unit</b>
                            </td>
                            <td className="border p-2" />
                            <td className="border p-2" />
                            <td className="border p-2" />
                          </tr>

                          {AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS.map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm" />
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {renderCustomRows()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : productType === ProductType.ISOLATION_VALVE ? (
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

                          {ISOLATION_VALVE_CHECKLIST_ROWS.map((row) => (
                            <tr key={row.key}>
                              <td className="border p-2 text-sm">{row.srNo}</td>
                              <td className="border p-2 text-sm">{row.test}</td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {renderCustomRows()}
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
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "specification" })}
                              </td>
                              <td className="border p-2 text-sm">
                                {renderEditableCell({ row: row, field: "observation" })}
                              </td>
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
                          {renderCustomRows()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                {hasChecklist && (
                  <Button type="button" variant="outline" size="sm" onClick={addCustomRow}>
                    Add row
                  </Button>
                )}
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
            detailRows={[
              { label: "Product type", value: TYPE_LABEL[productType] },
              { label: "Lot number", value: lotNumber.trim() },
            ]}
          />
          <Button type="button" variant="secondary" onClick={resetSession}>
            New submission
          </Button>
        </div>
      )}
    </div>
  );
}
