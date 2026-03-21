# AnaemoScan

A clinical anemia detection and classification system with a two-stage AI pipeline, multi-user authentication, and an admin dashboard. Doctors and nurses register patients, enter CBC blood test values, and the system predicts whether anemia is present, classifies the type, provides SHAP-based explanations, and recommends medications.

## How It Works

**Stage 1 — Detection (KMeans clustering)**
CBC parameters are scaled and clustered to determine whether anemia is present, producing a detection probability.

**Stage 2 — Classification (XGBoost + Clinical Rules)**
If anemia is detected, an XGBoost model classifies the type, then a clinical rule engine overrides the model output using established diagnostic thresholds:

- Ferritin < 15 ng/mL + microcytic CBC → **Iron Deficiency Anemia**
- Folate < 4.0 ng/mL (without low B12) → **Folate Deficiency Anemia**
- B12 < 200 pg/mL (without low Folate) → **Vitamin B12 Deficiency Anemia**
- Both Folate and B12 low → picks the more deficient by % below threshold
- No biomarkers provided → CBC morphology rules (MCV/MCH patterns)

SHAP values explain which features drove the prediction.

---

## Project Structure

```
anaemoscan/
├── ml-service/       # Python Flask ML API (KMeans + XGBoost + SHAP + clinical rules)
│   ├── app.py
│   ├── clinical_rules.py
│   └── *.pkl         # Trained model files
├── backend/          # Node.js Express REST API + SQLite database
│   └── src/
│       ├── index.js
│       ├── db.js
│       └── routes/
│           ├── patients.js
│           ├── tests.js
│           ├── report.js
│           ├── staff.js
│           └── config.js
└── frontend/         # React + TypeScript + Vite + Tailwind UI
    └── src/
        ├── App.tsx
        ├── auth.tsx
        ├── firebase.ts
        ├── api.ts
        └── pages/
            ├── Login.tsx
            ├── Register.tsx
            ├── PatientSelect.tsx
            ├── Home.tsx
            ├── PatientHistory.tsx
            ├── ReportView.tsx
            └── AdminDashboard.tsx
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- Firebase project (Auth + Firestore enabled)

---

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

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication (Authentication → Sign-in method)
3. Enable **Firestore Database** (start in test mode or apply the rules below)
4. Paste your Firebase config into `frontend/src/firebase.ts`

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**First Admin Setup:**
1. Register normally via `/register`
2. Go to Firestore Console → `users` collection → find your document
3. Change the `role` field from `"doctor"` to `"admin"`
4. Log out and back in — the Admin button will appear

---

## Authentication & Roles

| Role | Access |
|------|--------|
| `doctor` | Register patients, run analyses, view reports |
| `nurse` | Register patients, run analyses, view reports |
| `admin` | All of the above + Admin Dashboard |

User profiles are stored in **Firestore** (`users/{uid}`) and synced to **SQLite** (`staff` table) on every login for activity tracking.

---

## Database Schema (SQLite — `backend/anemia.db`)

**`staff`** — `uid`, `name`, `email`, `role`, `department`, `created_at`, `last_seen`

**`patients`** — `id`, `name`, `age`, `gender`, `blood_group`, `contact`, `email`, `notes`, `created_by` (staff uid), `created_at`

**`test_results`** — `id`, `patient_id`, all CBC fields (RBC, HGB, HCT, MCV, MCH, MCHC, RDW, PLT, MPV, PDW), biomarker fields (FERRITTE, FOLATE, B12), `anemia_detected`, `anemia_type`, `risk_level`, `detection_probability`, `shap_features` (JSON), `recommendations` (JSON), `summary`, `performed_by` (staff uid), `created_at`

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
  "RBC": 3.8, "HGB": 9.5, "HCT": 30, "MCV": 72,
  "MCH": 24, "MCHC": 31, "RDW": 16.5, "PLT": 450,
  "MPV": 8.2, "PDW": 10
}
```

Optional biomarker fields (required for full type classification):
```json
{ "FERRITTE": 8, "FOLATE": 2.1, "B12": 400 }
```

**Response:**
```json
{
  "anemia_detected": true,
  "detection_probability": 0.87,
  "anemia_type": "Iron Deficiency Anemia",
  "anemia_type_probabilities": { "...": 0.88 },
  "shap_features": [{ "feature": "HGB", "value": 9.5, "shap_value": 0.42, "impact": "positive" }],
  "recommendations": ["..."],
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
| POST | `/api/patients/:id/tests` | Submit CBC values → runs ML → saves result |
| GET | `/api/patients/:id/report` | Get full report (supports `?testId=`) |
| GET | `/api/patients/admin/all` | All patients with test counts (admin) |
| DELETE | `/api/patients/:id` | Delete patient + all their tests (admin) |
| DELETE | `/api/patients/:id/tests` | Clear test history only (admin) |
| POST | `/api/staff/sync` | Upsert staff profile into SQLite (called on login) |
| GET | `/api/staff` | All staff with patient/test counts (admin) |
| DELETE | `/api/staff/:uid` | Remove staff from SQLite (admin) |

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Firebase email/password login |
| `/register` | Register | Create account with role (doctor/nurse) |
| `/` | Patient Select | Search/create patients, stats overview |
| `/analyze/:patientId` | Home | Enter CBC values, run analysis, demo scenarios |
| `/patients/:id/history` | Patient History | All past tests for a patient |
| `/patients/:id/report/:testId` | Report View | Full report — SHAP chart, CBC table, trends, recommendations |
| `/admin` | Admin Dashboard | User management, staff activity, delete controls |

---

## Demo Scenarios

The analysis page includes 4 pre-filled demo scenarios accessible via dropdown:

| Scenario | Key Values |
|----------|-----------|
| Iron Deficiency | Ferritin=5, MCV=68, MCH=22 |
| Folate Deficiency | Folate=2.1, MCV=108, MCH=35 |
| Vitamin B12 Deficiency | B12=95, MCV=112, MCH=36 |
| Normal | All parameters within reference ranges |

---

## Admin Dashboard Features

- Stats overview — total users, doctors, nurses, admins, patients, tests
- **Staff Activity tab** — per-doctor/nurse patient count, test count, last active time, expandable patient list with delete controls
- **User Management tab** — role assignment (doctor/nurse/admin), delete users
- Delete patient records, clear test history, remove staff accounts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML | Python 3.11, Flask, flask-cors, scikit-learn (KMeans), XGBoost, SHAP, pandas, numpy |
| Backend | Node.js 18, Express 4, @libsql/client (SQLite), cors |
| Frontend | React 19, TypeScript 5, Vite 6, Tailwind CSS 4, TanStack Query 5, Recharts 2, Framer Motion 12, Wouter 3, Lucide React |
| Auth | Firebase Authentication (Email/Password), Firestore (user profiles + roles) |
