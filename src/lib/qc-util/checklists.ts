import type { ProductType } from "@prisma/client";

export type CheckboxRow = {
  key: string;
  srNo: number;
  test: string;
  specification: string;
  observation: string;
};

// Theatre Vacuum Unit (TVU) checklist (Finished Goods Test Report)
// Keys are stored in `QcUtilEntry.formData.bomChecks` and validated server-side.
export const TVU_CHECKLIST_ROWS: CheckboxRow[] = [
  {
    key: "tvu:material-finish",
    srNo: 1,
    test: "Material Finish",
    specification: "Polycarbonate Jar",
    observation: "Finishing",
  },
  { key: "tvu:capacity", srNo: 2, test: "Capacity", specification: "2000 ML", observation: "Marking" },
  {
    key: "tvu:scale-marking",
    srNo: 3,
    test: "Scale Marking",
    specification: "250–2000 ML",
    observation: "Printing Quality",
  },
  {
    key: "tvu:instructions",
    srNo: 4,
    test: "Instructions",
    specification: "Caution & Cleaning",
    observation: "Printing Quality",
  },
  { key: "tvu:logo", srNo: 5, test: "Logo", specification: "Prenit World", observation: "Printing Quality" },
  { key: "tvu:jar-cap-material", srNo: 6, test: "Jar Cap Material", specification: "ABS", observation: "Finishing" },
  { key: "tvu:nozzle", srNo: 7, test: "Nozzle", specification: "2 Nos", observation: "Fixed" },
  { key: "tvu:mounting-bracket", srNo: 8, test: "Mounting Bracket", specification: "3 Nos", observation: "Fixed" },
  { key: "tvu:float-valve", srNo: 9, test: "Float Valve", specification: "1 No", observation: "Fixed" },
  { key: "tvu:gasket", srNo: 10, test: "Gasket", specification: "1 No", observation: "Fixed" },
  { key: "tvu:regulator", srNo: 11, test: "Regulator", specification: "1 No", observation: "Fixed" },
  { key: "tvu:gauge", srNo: 12, test: "Gauge", specification: "0–760 mmHg", observation: "Fixed" },
  { key: "tvu:trap-bottle", srNo: 13, test: "Trap Bottle", specification: "1 No", observation: "Fixed" },
  { key: "tvu:filter", srNo: 14, test: "Filter", specification: "1 No", observation: "Fixed" },
  {
    key: "tvu:leakage",
    srNo: 15,
    test: "Leakage",
    specification: "As per Vendor Test Report",
    observation: "Vendor Certificate",
  },
];

// Bed Head Panel (BHP) checklist (Finished Goods Test Report)
export const BHP_CHECKLIST_ROWS: CheckboxRow[] = [
  {
    key: "bhp:size-lxwxh",
    srNo: 1,
    test: "Size (LxWxH)",
    specification: "1500 x 315 x 100 mm (+2mm)",
    observation: "1200 x 315 x 100 mm",
  },
  {
    key: "bhp:electrical-fittings",
    srNo: 2,
    test: "Electrical Fittings",
    specification: "Switch (16A) – 9, Socket – 8, Dummy – 3",
    observation: "Switch (16A) – 7, Socket – 6, Dummy – 3",
  },
  {
    key: "bhp:communication-socket",
    srNo: 3,
    test: "Communication Socket",
    specification: "RJ45 – 1 No",
    observation: "RJ45 – 1 No",
  },
  {
    key: "bhp:nurse-call",
    srNo: 4,
    test: "Provision for Nurse Call",
    specification: "1 No",
    observation: "Cutout with cover",
  },
  {
    key: "bhp:gas-terminal-unit",
    srNo: 5,
    test: "Provision for Gas Terminal Unit",
    specification: "6 Nos",
    observation: "3 Nos",
  },
  {
    key: "bhp:reading-light",
    srNo: 6,
    test: "Reading Light",
    specification: "LED – 1 No",
    observation: "LED – 1 No",
  },
  {
    key: "bhp:mounting-rail",
    srNo: 7,
    test: "Mounting Rail",
    specification: "SS – 1 No",
    observation: "SS – 1 No",
  },
  {
    key: "bhp:front-frame",
    srNo: 8,
    test: "Front Frame",
    specification: "Aluminium",
    observation: "Aluminium",
  },
];

export function getExpectedChecklistKeys(productType: ProductType): string[] {
  switch (productType) {
    case "THEATRE_VACUUM_UNIT":
      return TVU_CHECKLIST_ROWS.map((r) => r.key);
    case "BED_HEAD_PANEL":
      return BHP_CHECKLIST_ROWS.map((r) => r.key);
    default:
      return [];
  }
}

