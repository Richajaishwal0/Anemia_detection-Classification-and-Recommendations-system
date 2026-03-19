# AnaemoScan

A clinical anemia detection and classification system using a two-stage AI pipeline. Patients are registered, CBC blood test values are entered, and the system predicts whether anemia is present and — if so — classifies the type with SHAP-based explanations and recommends the medications.

## How It Works

**Stage 1 — Detection (KMeans clustering):** CBC parameters are scaled and clustered to determine whether anemia is present, producing a detection probability.

**Stage 2 — Classification (XGBoost):** If anemia is detected and biomarker values (Ferritin, Folate, B12) are provided, an XGBoost model classifies the anemia type:
- Iron Deficiency Anemia
- Folate / Vitamin B12 Deficiency Anemia

SHAP values are computed to explain which features drove the prediction.
## Project Structure

```
anaemoscan/
├── ml-service/     # Python Flask ML API (KMeans + XGBoost + SHAP)
├── backend/        # Node.js Express REST API + SQLite database
└── frontend/       # React + TypeScript + Vite + Tailwind UI
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Setup & Run

### 1. ML Service
```bash
cd anaemoscan/ml-service
pip install -r requirements.txt
python app.py
```
Runs on `http://localhost:5001`

### 2. Backend
```bash
cd anaemoscan/backend
npm install
npm run dev
```
Runs on `http://localhost:3000`

### 3. Frontend
```bash
cd anaemoscan/frontend
npm install
npm run dev
```
Open `http://localhost:5173`

> The frontend proxies `/api` requests to the backend. The backend forwards ML prediction requests to the ML service.

---

## API Reference

### ML Service (`localhost:5001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/predict` | Run anemia prediction |
| GET | `/api/ml/health` | Health check |

**POST `/api/ml/predict` — Request body:**

Required CBC fields:
```json
{
  "RBC": 3.8,
  "HGB": 9.5,
  "HCT": 30,
  "MCV": 72,
  "MCH": 24,
  "MCHC": 31,
  "RDW": 16.5,
  "PLT": 450,
  "MPV": 8.2,
  "PDW": 10
}
```

Optional biomarker fields (required for full type classification):
```json
{
  "FERRITTE": 8,
  "FOLATE": 10,
  "B12": 400
}
```

**Response:**
```json
{
  "anemia_detected": true,
  "detection_probability": 0.87,
  "anemia_type": "Iron Deficiency Anemia",
  "anemia_type_probabilities": { ... },
  "shap_features": [ { "feature": "HGB", "value": 9.5, "shap_value": 0.42, "impact": "positive" } ],
  "recommendations": [ "..." ],
  "risk_level": "High Risk",
  "summary": "..."
}
```

---

### Backend (`localhost:3000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | CBC/biomarker field definitions and demo values |
| GET | `/api/patients` | List all patients (supports `?search=name`) |
| POST | `/api/patients` | Create a patient |
| GET | `/api/patients/:id` | Get patient + all test history |
| POST | `/api/patients/:id/tests` | Submit CBC values → runs ML prediction → saves result |
| GET | `/api/patients/:id/report` | Get full report (supports `?testId=` for specific test) |

**POST `/api/patients` — Request body:**
```json
{
  "name": "John Doe",
  "age": 35,
  "gender": "Male",
  "blood_group": "O+",
  "contact": "...",
  "email": "...",
  "notes": "..."
}
```
`name`, `age`, `gender` are required.

---

## Database Schema

SQLite database (`backend/anemia.db`) with two tables:

**`patients`** — `id`, `name`, `age`, `gender`, `blood_group`, `contact`, `email`, `notes`, `created_at`

**`test_results`** — `id`, `patient_id`, all CBC + biomarker fields, `anemia_detected`, `anemia_type`, `risk_level`, `detection_probability`, `shap_features` (JSON), `recommendations` (JSON), `summary`, `created_at`

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Patient Select | Search/create patients |
| `/analyze/:patientId` | Home | Enter CBC values and run analysis |
| `/patients/:id/history` | Patient History | View all past tests for a patient |
| `/patients/:id/report/:testId` | Report View | Detailed report with SHAP chart and trend graphs |


## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML | Python, Flask, flask-cors, gunicorn, scikit-learn (KMeans), XGBoost, SHAP, pandas, numpy, openpyxl |
| Backend | Node.js, Express 4, @libsql/client 0.14 (SQLite), cors |
| Frontend | React 19.1, TypeScript 5.9, Vite 6, Tailwind CSS 4.1, TanStack Query 5, Recharts 2, Framer Motion 12, Wouter 3, Lucide React |

