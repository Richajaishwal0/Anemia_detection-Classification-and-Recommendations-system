import { Router } from "express";
import { db } from "../db.js";

const router = Router();
const ML_URL = process.env.ML_URL || "http://localhost:5001";

router.post("/:id/tests", async (req, res) => {
  try {
    const { id } = req.params;
    const patientRes = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [id] });
    if (!patientRes.rows[0]) return res.status(404).json({ error: "Patient not found" });

    const mlRes = await fetch(`${ML_URL}/api/ml/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!mlRes.ok) {
      const err = await mlRes.json().catch(() => ({ error: "ML service error" }));
      return res.status(mlRes.status).json(err);
    }

    const prediction = await mlRes.json();
    const body = req.body;
    const performed_by = req.headers["x-user-id"] || null;

    const result = await db.execute({
      sql: `INSERT INTO test_results 
        (patient_id, RBC, HGB, HCT, MCV, MCH, MCHC, RDW, PLT, MPV, PDW, FERRITTE, FOLATE, B12,
         anemia_detected, anemia_type, risk_level, detection_probability, shap_features, recommendations, summary, performed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, body.RBC, body.HGB, body.HCT, body.MCV, body.MCH, body.MCHC,
        body.RDW, body.PLT, body.MPV, body.PDW,
        body.FERRITTE ?? null, body.FOLATE ?? null, body.B12 ?? null,
        prediction.anemia_detected ? 1 : 0,
        prediction.anemia_type ?? null,
        prediction.risk_level,
        prediction.detection_probability,
        JSON.stringify(prediction.shap_features),
        JSON.stringify(prediction.recommendations),
        prediction.summary,
        performed_by,
      ],
    });

    const saved = await db.execute({ sql: "SELECT * FROM test_results WHERE id = ?", args: [result.lastInsertRowid] });
    const row = saved.rows[0];
    res.status(201).json({
      ...row,
      anemia_detected: !!row.anemia_detected,
      shap_features: JSON.parse(row.shap_features),
      recommendations: JSON.parse(row.recommendations),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
