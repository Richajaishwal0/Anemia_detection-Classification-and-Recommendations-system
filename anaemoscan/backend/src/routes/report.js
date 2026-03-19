import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/:id/report", async (req, res) => {
  try {
    const { id } = req.params;
    const { testId } = req.query;

    const patientRes = await db.execute({ sql: "SELECT * FROM patients WHERE id = ?", args: [id] });
    if (!patientRes.rows[0]) return res.status(404).json({ error: "Patient not found" });

    const testsRes = await db.execute({ sql: "SELECT * FROM test_results WHERE patient_id = ? ORDER BY created_at DESC", args: [id] });
    if (!testsRes.rows.length) return res.status(404).json({ error: "No test results found" });

    const allTests = testsRes.rows.map(t => ({
      ...t,
      anemia_detected: !!t.anemia_detected,
      shap_features: JSON.parse(t.shap_features),
      recommendations: JSON.parse(t.recommendations),
    }));

    let currentTest = allTests[0];
    if (testId) {
      const found = allTests.find(t => t.id == testId);
      if (!found) return res.status(404).json({ error: "Test not found" });
      currentTest = found;
    }

    const currentIdx = allTests.findIndex(t => t.id === currentTest.id);
    const previousTest = currentIdx < allTests.length - 1 ? allTests[currentIdx + 1] : null;

    const trend = [...allTests].reverse().map(t => ({
      date: t.created_at,
      HGB: t.HGB,
      RBC: t.RBC,
      MCV: t.MCV,
      anemia_detected: t.anemia_detected,
      risk_level: t.risk_level,
    }));

    res.json({
      patient: patientRes.rows[0],
      current_test: currentTest,
      previous_test: previousTest,
      trend,
      total_tests: allTests.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
