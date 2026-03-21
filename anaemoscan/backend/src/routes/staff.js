import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// Called on every login — upserts staff profile into local DB
router.post("/sync", async (req, res) => {
  try {
    const { uid, name, email, role, department } = req.body;
    if (!uid || !name || !email || !role) return res.status(400).json({ error: "uid, name, email, role required" });

    await db.execute({
      sql: `INSERT INTO staff (uid, name, email, role, department, last_seen)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(uid) DO UPDATE SET
              name=excluded.name, email=excluded.email,
              role=excluded.role, department=excluded.department,
              last_seen=datetime('now')`,
      args: [uid, name, email, role, department || ""],
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all staff with their patient + test counts
router.get("/", async (req, res) => {
  try {
    const rows = await db.execute(`
      SELECT s.*,
        COUNT(DISTINCT p.id)  as patient_count,
        COUNT(DISTINCT t.id)  as test_count
      FROM staff s
      LEFT JOIN patients     p ON p.created_by  = s.uid
      LEFT JOIN test_results t ON t.performed_by = s.uid
      GROUP BY s.uid
      ORDER BY s.last_seen DESC
    `);
    res.json({ staff: rows.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:uid", async (req, res) => {
  try {
    await db.execute({ sql: "DELETE FROM staff WHERE uid = ?", args: [req.params.uid] });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
