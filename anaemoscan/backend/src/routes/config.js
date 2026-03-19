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
  Iron: "Ferrous sulfate 325mg 2-3x daily, Vitamin C 500mg with each dose.",
  "Folate": "Folic acid 1mg daily, Cyanocobalamin 1000mcg daily or B12 injections.",
  "B12": "Folic acid 1mg daily, Cyanocobalamin 1000mcg daily or B12 injections.",
  Other: "Consult hematologist; may require erythropoietin or other targeted therapy.",
};

const DEMO_VALUES = {
  RBC: 3.8, HGB: 9.5, HCT: 30, MCV: 72, MCH: 24, MCHC: 31,
  RDW: 16.5, PLT: 450, MPV: 8.2, PDW: 10,
  FERRITTE: 8, FOLATE: 10, B12: 400,
};

router.get("/config", (_req, res) => {
  res.json({ cbc_fields: CBC_FIELDS, biomarker_fields: BIOMARKER_FIELDS, medication_suggestions: MEDICATION_SUGGESTIONS, demo_values: DEMO_VALUES });
});

export default router;
