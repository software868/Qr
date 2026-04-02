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

// Control Panel (Surgeon Control Panel) checklist (Finished Goods Test Report)
export const CONTROL_PANEL_CHECKLIST_ROWS: CheckboxRow[] = [
  {
    key: "cp:ms-box",
    srNo: 1,
    test: "MS Box",
    specification: "As per Drawing",
    observation: "OK",
  },
  {
    key: "cp:powder-coating",
    srNo: 2,
    test: "Powder Coating",
    specification: "Smooth Finish",
    observation: "OK",
  },
  {
    key: "cp:touch-screen-display-21-5",
    srNo: 3,
    test: "Touch Screen Display (21.5\")",
    specification: "Working",
    observation: "Satisfactory",
  },
  {
    key: "cp:dimming-control",
    srNo: 4,
    test: "Dimming Control",
    specification: "Working",
    observation: "Smooth",
  },
  {
    key: "cp:telephone",
    srNo: 5,
    test: "Telephone",
    specification: "Working",
    observation: "Proper",
  },
  {
    key: "cp:sterility-ip2018",
    srNo: 6,
    test: "Sterility (Ref. I.P. 2018)",
    specification: "N.A.",
    observation: "",
  },
  {
    key: "cp:pyrogen-bet-ip2016",
    srNo: 7,
    test: "Pyrogen/BET (Ref. I.P. 2016)",
    specification: "N.A.",
    observation: "",
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

// Ward Vacuum Unit (WVU) checklist (Finished Goods Test Report)
export const WVU_CHECKLIST_ROWS: CheckboxRow[] = [
  // Suction Jar
  { key: "wvu:material-finish", srNo: 1, test: "Material Finish", specification: "Polycarbonate Jar", observation: "Finishing" },
  { key: "wvu:capacity", srNo: 2, test: "Capacity", specification: "1000 ML", observation: "Marking" },
  { key: "wvu:scale-marking", srNo: 3, test: "Scale Marking", specification: "100 ML – 1000 ML", observation: "Printing Quality" },
  { key: "wvu:instructions", srNo: 4, test: "Instructions", specification: "Caution and Cleaning", observation: "Printing Quality" },
  { key: "wvu:logo-make", srNo: 5, test: "Logo/Make", specification: "Logo – Prenit World", observation: "Printing Quality" },

  // Jar Cap
  { key: "wvu:jar-cap-material", srNo: 6, test: "Material Finish", specification: "ABS", observation: "Finishing" },

  // Fixture
  { key: "wvu:nozzle", srNo: 7, test: "Nozzle", specification: "2 Nos", observation: "Fixed" },
  { key: "wvu:mounting-bracket", srNo: 8, test: "Mounting Bracket", specification: "1 No", observation: "Fixed" },
  { key: "wvu:float-valve", srNo: 9, test: "Float Valve", specification: "1 No", observation: "Fixed" },
  { key: "wvu:gasket", srNo: 10, test: "Gasket", specification: "1 No", observation: "Fixed" },
  { key: "wvu:regulator", srNo: 11, test: "Regulator", specification: "1 No", observation: "Fixed" },
  { key: "wvu:gauge", srNo: 12, test: "Gauge", specification: "0–760 mmHg", observation: "Fixed" },
  { key: "wvu:trap-bottle", srNo: 13, test: "Trap Bottle", specification: "1 No", observation: "Fixed" },
  { key: "wvu:filter", srNo: 14, test: "Filter", specification: "1 No", observation: "Fixed" },

  // Leakage
  { key: "wvu:leakage", srNo: 15, test: "Leakage", specification: "As per Vendor Test Report", observation: "Vendor Test Certificate" },
];

// Area Alarm System (AAS) checklist (Finished Goods Test Report)
export const AAS_CHECKLIST_ROWS: CheckboxRow[] = [
  // Main item 1: Area Alarm System
  { key: "aas:leak-test", srNo: 1, test: "Leak Test", specification: "Leak Test", observation: "Checked" },
  { key: "aas:display", srNo: 2, test: "Display", specification: "Digital Display", observation: "Readable" },
  {
    key: "aas:working-pressure",
    srNo: 3,
    test: "Working Pressure Test",
    specification: "Gases: 4.2 / Vacuum: 0–760",
    observation: "OK",
  },
  {
    key: "aas:testing-pressure",
    srNo: 4,
    test: "Testing Pressure Test",
    specification: "Gases: 4.2 / Vacuum: 0–760",
    observation: "OK",
  },
  {
    key: "aas:brass",
    srNo: 5,
    test: "Brass",
    specification: "Extruded Brass Rod",
    observation: "OK",
  },
];

export function getExpectedChecklistKeys(productType: ProductType): string[] {
  switch (productType) {
    case "CONTROL_PANEL":
      return CONTROL_PANEL_CHECKLIST_ROWS.map((r) => r.key);
    case "THEATRE_VACUUM_UNIT":
      return TVU_CHECKLIST_ROWS.map((r) => r.key);
    // Same as Control Panel as requested.
    case "BED_HEAD_PANEL":
      return BHP_CHECKLIST_ROWS.map((r) => r.key);
    case "WARD_VACUUM_UNIT":
      return WVU_CHECKLIST_ROWS.map((r) => r.key);
    case "AREA_ALARM_SYSTEM":
      return AAS_CHECKLIST_ROWS.map((r) => r.key);
    default:
      return [];
  }
}

