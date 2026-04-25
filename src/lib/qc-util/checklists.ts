import type { ProductType } from "@prisma/client";

export type CheckboxRow = {
  key: string;
  srNo: number;
  test: string;
  specification: string;
  observation: string;
};

// Theatre Vacuum Unit (TVU) checklist (Finished Goods Test Report)
// Keys are stored in check form entry `formData.checklist` (QcUtilEntry JSON) and validated server-side.
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
    key: "tvu:markings-printing",
    srNo: 3,
    test: "Markings/ Printing",
    specification: "",
    observation: "",
  },
  {
    key: "tvu:scale-marking",
    srNo: 4,
    test: "Scale Marking",
    specification: "250 ML — 2000 ML",
    observation: "Printing Quality",
  },
  {
    key: "tvu:instructions",
    srNo: 5,
    test: "Instructions",
    specification: "Caution and Cleaning",
    observation: "Printing Quality",
  },
  { key: "tvu:logo-make", srNo: 6, test: "Logo/Make", specification: "Logo - Prenit World", observation: "Printing Quality" },
  { key: "tvu:jar-cap-material-finish", srNo: 7, test: "Material Finish", specification: "ABS", observation: "Finishing" },
  { key: "tvu:nozzle", srNo: 8, test: "Nozzle", specification: "2 Nos", observation: "Fixed" },
  { key: "tvu:mounting-bracket", srNo: 9, test: "Mounting Bracket", specification: "3 No", observation: "Fixed" },
  { key: "tvu:float-valve", srNo: 10, test: "Flot Valve", specification: "1 No", observation: "Fixed" },
  { key: "tvu:gasket", srNo: 11, test: "Gasket", specification: "1 No", observation: "Fixed" },
  { key: "tvu:regulator", srNo: 12, test: "Regulator", specification: "1 No", observation: "Fixed" },
  { key: "tvu:gauge", srNo: 13, test: "Gauge", specification: "1 No. Range 0- 760 mmHg", observation: "Fixed" },
  { key: "tvu:trap-bottle", srNo: 14, test: "Trap Bottle", specification: "1 No", observation: "Fixed" },
  { key: "tvu:filter", srNo: 15, test: "Filter", specification: "1 No", observation: "Fixed" },
  {
    key: "tvu:leakage",
    srNo: 16,
    test: "Leakage",
    specification: "As per Vendor Test Report",
    observation: "Vendor test Certificate",
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
    key: "cp:touch-screen-display-21-5-monitor",
    srNo: 3,
    test: "Touch Screen Display 21.5\" (Monitor)",
    specification: "Physical Check",
    observation: "Satisfactory",
  },
  {
    key: "cp:dimming-control",
    srNo: 4,
    test: "Dimming Control",
    specification: "Physical Check",
    observation: "Smooth",
  },
  {
    key: "cp:telephone",
    srNo: 5,
    test: "Telephone",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:digital-room-pressure",
    srNo: 6,
    test: "Digital Room Pressure",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:digital-clock",
    srNo: 7,
    test: "Digital Clock",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:elapsed-time",
    srNo: 8,
    test: "Elapsed Time",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:humidity-temperature-display",
    srNo: 9,
    test: "Humidity & Temperature display",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:medical-gas-alarm",
    srNo: 10,
    test: "Medical Gas Alarm",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:peripheral-light-control",
    srNo: 11,
    test: "Peripheral Light Control",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:ot-light",
    srNo: 12,
    test: "OT Light",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:hepa-indication",
    srNo: 13,
    test: "HEPA Indication",
    specification: "Physical Check",
    observation: "Proper",
  },
  {
    key: "cp:sterility-ip2018",
    srNo: 1,
    test: "Sterility (Ref. I.P. 2018)",
    specification: "N.A.",
    observation: "",
  },
  {
    key: "cp:pyrogen-bet-ip2016",
    srNo: 1,
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
  { key: "wvu:markings-printing", srNo: 3, test: "Markings/ Printing", specification: "", observation: "" },
  { key: "wvu:scale-marking", srNo: 4, test: "Scale Marking", specification: "100 ML — 1000 ML", observation: "Printing Quality" },
  { key: "wvu:instructions", srNo: 5, test: "Instructions", specification: "Caution and Cleaning", observation: "Printing Quality" },
  { key: "wvu:logo-make", srNo: 6, test: "Logo/Make", specification: "Logo - Prenit World", observation: "Printing Quality" },

  // Jar Cap
  { key: "wvu:jar-cap-material", srNo: 7, test: "Material Finish", specification: "ABS", observation: "Finishing" },

  // Fixture
  { key: "wvu:nozzle", srNo: 8, test: "Nozzle", specification: "2 Nos", observation: "Fixed" },
  { key: "wvu:mounting-bracket", srNo: 9, test: "Mounting Bracket", specification: "1 No", observation: "Fixed" },
  { key: "wvu:float-valve", srNo: 10, test: "Flot Valve", specification: "1 No", observation: "Fixed" },
  { key: "wvu:gasket", srNo: 11, test: "Gasket", specification: "1 No", observation: "Fixed" },
  { key: "wvu:regulator", srNo: 12, test: "Regulator", specification: "1 No", observation: "Fixed" },
  { key: "wvu:gauge", srNo: 13, test: "Gauge", specification: "1 No. Range 0- 760 mmHg", observation: "Fixed" },
  { key: "wvu:trap-bottle", srNo: 14, test: "Trap Bottle", specification: "1 No", observation: "Fixed" },
  { key: "wvu:filter", srNo: 15, test: "Filter", specification: "1 No.", observation: "Fixed" },

  // Leakage
  { key: "wvu:leakage", srNo: 16, test: "Leakage", specification: "As per Vendor Test Report", observation: "Vendor test Certificate" },
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

// Medical Gas Terminal Unit (Outlet Point) checklist (Finished Goods Test Report)
export const MGTU_OUTLET_POINT_CHECKLIST_ROWS: CheckboxRow[] = [
  { key: "mgtu:finishing-smoothness", srNo: 1, test: "Finishing", specification: "Smoothness", observation: "Smooth" },
  { key: "mgtu:finishing-brazing", srNo: 2, test: "Finishing", specification: "Brazing", observation: "Copper Pipe Brazed" },
  { key: "mgtu:finishing-cleaning", srNo: 3, test: "Finishing", specification: "Cleaning", observation: "Clean" },
  { key: "mgtu:probe-lock-unlock", srNo: 4, test: "Probe Lock/ Unlock", specification: "Probe Lock/ Unlock", observation: "Looking and Unlocking Smooth" },
];

// OT Light checklist (Finished Goods Test Report)
export const OT_LIGHT_CHECKLIST_ROWS: CheckboxRow[] = [
  { key: "ot:illumination-major", srNo: 1, test: "Major Dome", specification: "160000 Lux ± 1000 Lux", observation: "160000 Lux" },
  { key: "ot:illumination-minor", srNo: 2, test: "Minor Dome", specification: "160000 Lux ± 1000 Lux", observation: "159900 Lux" },
  { key: "ot:controls", srNo: 3, test: "Controls", specification: "Controller on both Dome", observation: "Fixed" },
  { key: "ot:rotation", srNo: 4, test: "Rotation", specification: "330 – 360 Degrees", observation: "330 – 360 Degrees" },
  { key: "ot:accessories", srNo: 5, test: "Accessories", specification: "Anchor Plate, Spring Arms, Main Arm, Sterilizable Handle", observation: "Anchor Plate, Spring Arms, Main Arm, Sterilizable Handle" },
  { key: "ot:supply-voltage", srNo: 6, test: "Supply Voltage", specification: "230 VAC 50 Hz", observation: "230 VAC 50 Hz" },
  { key: "ot:vendor-test-report", srNo: 7, test: "Vendor Teste Report", specification: "Vendor Teste Report", observation: "Vendor Teste Report" },
];

// Area Valve Service Unit checklist (Finished Goods Test Report)
export const AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS: CheckboxRow[] = [
  { key: "avsu:box", srNo: 1, test: "Box", specification: "MS / Alum. Powder Coated", observation: "MS Powder Coated" },
  { key: "avsu:isolation-valve", srNo: 2, test: "Isolation Valve", specification: "Lockable Valve", observation: "OK" },
  { key: "avsu:pressure-gauge", srNo: 3, test: "Pressure Gauge", specification: "0-10 Kg/cm²", observation: "OK" },
  { key: "avsu:suction-gauge", srNo: 4, test: "Suction Gauge", specification: "0-760mm/hg", observation: "OK" },
  { key: "avsu:front-door", srNo: 5, test: "Front Door", specification: "Acrylic / Glass", observation: "OK" },
];

// Isolation Valve checklist (Finished Goods Test Report)
export const ISOLATION_VALVE_CHECKLIST_ROWS: CheckboxRow[] = [
  { key: "iv:leakage-test", srNo: 1, test: "Line Isolation Valve", specification: "Leakage Test", observation: "Tested" },
  { key: "iv:visual-dimension-test", srNo: 2, test: "Visual and Dimension Test", specification: "Vernier", observation: "OK" },
  { key: "iv:degrease", srNo: 3, test: "Degrease", specification: "Checked", observation: "OK" },
  { key: "iv:brass-fittings", srNo: 4, test: "Brass Fittings", specification: "Solid Brass", observation: "OK" },
  { key: "iv:o-ring", srNo: 5, test: "O’Ring", specification: "Nylon / Teflon", observation: "OK" },
];

export function getExpectedChecklistKeys(productType: ProductType): string[] {
  switch (productType) {
    case "IPS":
      return [];
    case "MEDICAL_GAS_TERMINAL_UNIT_OUTLET_POINT":
      return MGTU_OUTLET_POINT_CHECKLIST_ROWS.map((r) => r.key);
    case "ISOLATION_VALVE":
      return ISOLATION_VALVE_CHECKLIST_ROWS.map((r) => r.key);
    case "AREA_VALVE_SERVICE_UNIT":
      return AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS.map((r) => r.key);
    case "OT_LIGHT":
      return OT_LIGHT_CHECKLIST_ROWS.map((r) => r.key);
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

const ALL_CHECKLIST_ROWS: CheckboxRow[] = [
  ...TVU_CHECKLIST_ROWS,
  ...WVU_CHECKLIST_ROWS,
  ...BHP_CHECKLIST_ROWS,
  ...CONTROL_PANEL_CHECKLIST_ROWS,
  ...AAS_CHECKLIST_ROWS,
  ...MGTU_OUTLET_POINT_CHECKLIST_ROWS,
  ...OT_LIGHT_CHECKLIST_ROWS,
  ...AREA_VALVE_SERVICE_UNIT_CHECKLIST_ROWS,
  ...ISOLATION_VALVE_CHECKLIST_ROWS,
];

/** Human-readable label for a stored checklist key in entry `formData`. */
export function labelForChecklistKey(key: string): string {
  const row = ALL_CHECKLIST_ROWS.find((r) => r.key === key);
  if (row) return `${row.test} — ${row.specification}`;
  if (key.startsWith("bomOk:")) return "Legacy line item";
  return key;
}

