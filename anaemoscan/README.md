# AnaemoScan

Anemia detection and classification system using a two-stage AI model.

## Project Structure

```
anaemoscan/
├── ml-service/   # Python Flask ML API (KMeans + XGBoost models)
├── backend/      # Node.js Express API + SQLite database
└── frontend/     # React + Vite + Tailwind UI
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Setup & Run

### 1. ML Service
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```
Runs on http://localhost:5001

### 2. Backend
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:3000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173
