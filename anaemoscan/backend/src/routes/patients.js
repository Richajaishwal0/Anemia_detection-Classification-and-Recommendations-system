import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const rows = search
      ? await db.execute({ sql: "SELECT * FROM patients WHERE name LIKE ? ORDER BY created_at DESC", args: [`%${search}%`] })
      : await db.execute("SELECT * FROM patients ORDER BY created_at DESC");

    const patients = await Promise.all(rows.rows.map(async (p) => {
      const tests = await db.execute({ sql: "SELECT * FROM test_results WHERE patient_id = ? ORDER BY created_at DESC", args: [p.id] });
      const last = tests.rows[0];
      return {
        ...p,
        test_count: tests.rows.length,
        last_test_date: last ? last.created_at : null,
        last_diagnosis: last ? (last.anemia_detected ? last.anemia_type || "Anemia Detected" : "Normal") : null,
      };
    }));

    res.json({ patients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, age, gender, blood_group, contact, email, notes } = req.body;
    if (!name || !age || !gender) return res.status(400).json({ error: "name, age, gender are required" });

    const result = await db.execute({
      sql: "INSERT INTO patients (name, age, gender, blood_group, contact, email, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [name, age, gender, blood_group || null, contact || null, email || null, notes || null],
    });

    const patient = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [result.lastInsertRowid] });
    res.status(201).json(patient.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patientRes = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [id] });
    if (!patientRes.rows[0]) return res.status(404).json({ error: "Patient not found" });

    const testsRes = await db.execute({ sql: "SELECT * FROM test_results WHERE patient_id = ? ORDER BY created_at DESC", args: [id] });
    const tests = testsRes.rows.map(t => ({
      ...t,
      anemia_detected: !!t.anemia_detected,
      shap_features: JSON.parse(t.shap_features),
      recommendations: JSON.parse(t.recommendations),
    }));

    res.json({ patient: patientRes.rows[0], tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
