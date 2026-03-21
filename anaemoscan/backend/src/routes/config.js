import { Router } from "express";

const router = Router();

const CBC_FIELDS = [
  { name: "RBC", label: "Red Blood Cell", unit: "10^6/µL", range: "4.2-5.4", step: "0.01", min: 3.6, max: 5.4 },
  { name: "HGB", label: "Hemoglobin", unit: "g/dL", range: "12.0-17.5", step: "0.1", min: 12.0, max: 17.5 },
  { name: "HCT", label: "Hematocrit", unit: "%", range: "36-53", step: "0.1", min: 36, max: 53 },
  { name: "MCV", label: "Mean Corp. Volume", unit: "fL", range: "80-100", step: "0.1", min: 80, max: 100 },
  { name: "MCH", label: "Mean Corp. Hemoglobin", unit: "pg", range: "27-33", step: "0.1", min: 27, max: 33 },
  { name: "MCHC", label: "MCH Concentration", unit: "g/dL", range: "32-36", step: "0.1", min: 32, max: 36 },
  { name: "RDW", label: "Red Cell Dist. Width", unit: "%", range: "11.5-14.5", step: "0.1", min: 11.5, max: 14.5 },
  { name: "PLT", label: "Platelet Count", unit: "10^3/µL", range: "150-400", step: "1", min: 150, max: 400 },
  { name: "MPV", label: "Mean Platelet Vol", unit: "fL", range: "7.5-12.5", step: "0.1", min: 7.5, max: 12.5 },
  { name: "PDW", label: "Platelet Dist. Width", unit: "%", range: "9-17", step: "0.1", min: 9, max: 17 },
];

const BIOMARKER_FIELDS = [
  { name: "FERRITTE", label: "Ferritin", unit: "ng/mL", range: "12-300", step: "0.1", min: 12, max: 300, required: true },
  { name: "FOLATE", label: "Folate", unit: "ng/mL", range: "2.7-17", step: "0.1", min: 2.7, max: 17, required: true },
  { name: "B12", label: "Vitamin B12", unit: "pg/mL", range: "200-900", step: "1", min: 200, max: 900, required: true },
];

const MEDICATION_SUGGESTIONS = {
  default: "No medication required; maintain balanced diet.",
  Iron: "Ferrous sulfate 325mg 2-3x daily with Vitamin C 500mg to enhance absorption.",
  Folate: "Folic acid 1mg daily for at least 4 months. Avoid alcohol.",
  "Vitamin B12": "Cyanocobalamin 1000mcg daily (oral) or IM injections if absorption is impaired.",
};

const DEMO_VALUES = {
  iron: {
    label: "Iron Deficiency",
    RBC: 3.5, HGB: 8.5, HCT: 28, MCV: 68, MCH: 22, MCHC: 30,
    RDW: 17.5, PLT: 480, MPV: 8.0, PDW: 11,
    FERRITTE: 5, FOLATE: 8, B12: 350,
  },
  folate: {
    label: "Folate Deficiency",
    RBC: 3.2, HGB: 9.0, HCT: 29, MCV: 108, MCH: 35, MCHC: 33,
    RDW: 14.0, PLT: 160, MPV: 9.5, PDW: 12,
    FERRITTE: 45, FOLATE: 2.1, B12: 320,
  },
  normal: {
    label: "Normal",
    RBC: 4.8, HGB: 14.5, HCT: 43, MCV: 90, MCH: 30, MCHC: 34,
    RDW: 13.0, PLT: 260, MPV: 9.5, PDW: 12,
    FERRITTE: 80, FOLATE: 9.0, B12: 450,
  },
  b12: {
    label: "Vitamin B12 Deficiency",
    RBC: 3.0, HGB: 8.8, HCT: 27, MCV: 112, MCH: 36, MCHC: 33,
    RDW: 13.5, PLT: 155, MPV: 9.8, PDW: 12,
    FERRITTE: 50, FOLATE: 6.5, B12: 95,
  },
};

router.get("/config", (_req, res) => {
  res.json({ cbc_fields: CBC_FIELDS, biomarker_fields: BIOMARKER_FIELDS, medication_suggestions: MEDICATION_SUGGESTIONS, demo_values: DEMO_VALUES });
});

export default router;
