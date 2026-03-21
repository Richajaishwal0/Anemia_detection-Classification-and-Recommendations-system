import { createClient } from "@libsql/client";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "anemia.db");

export const db = createClient({ url: `file:${dbPath}` });

export async function initDb() {
  // create tables first
  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT,
      contact TEXT,
      email TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      RBC REAL NOT NULL,
      HGB REAL NOT NULL,
      HCT REAL NOT NULL,
      MCV REAL NOT NULL,
      MCH REAL NOT NULL,
      MCHC REAL NOT NULL,
      RDW REAL NOT NULL,
      PLT REAL NOT NULL,
      MPV REAL NOT NULL,
      PDW REAL NOT NULL,
      FERRITTE REAL,
      FOLATE REAL,
      B12 REAL,
      anemia_detected INTEGER NOT NULL,
      anemia_type TEXT,
      risk_level TEXT NOT NULL,
      detection_probability REAL NOT NULL,
      shap_features TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // migrations — safe, ignored if column already exists
  await db.execute(`ALTER TABLE patients ADD COLUMN created_by TEXT`).catch(() => {});
  await db.execute(`ALTER TABLE test_results ADD COLUMN performed_by TEXT`).catch(() => {});
}
