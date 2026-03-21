import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import patientsRouter from "./routes/patients.js";
import testsRouter from "./routes/tests.js";
import reportRouter from "./routes/report.js";
import configRouter from "./routes/config.js";

import staffRouter from "./routes/staff.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/patients", patientsRouter);
app.use("/api/patients", testsRouter);
app.use("/api/patients", reportRouter);
app.use("/api/staff",    staffRouter);
app.use("/api",          configRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("Failed to init DB:", err);
  process.exit(1);
});
