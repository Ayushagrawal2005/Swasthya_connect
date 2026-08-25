# SwasthyaConnect — Rural Healthcare Platform

AI-powered healthcare coordination for rural India. Connects ASHA workers, doctors, and patients through a unified digital platform.

## Services

| Service | Port | Stack |
|---|---|---|
| Frontend | 5173 | React + TypeScript + Vite + TailwindCSS |
| Backend | 4000 | Node.js + Express + Firebase Firestore |
| OCR Service | 8000 | FastAPI + Google Gemini Vision API |
| ML Triage | 5000 | Flask + XGBoost (96.4% accuracy) |

## Quick Start

**Frontend**
```bash
npm install
npm run dev
```

**Backend**
```bash
cd backend
npm install
npm run dev
```

**OCR Service**
```bash
cd "gemini ocr - Copy"
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**ML Triage**
```bash
cd ml-backend
pip install -r requirements.txt
python app.py
```

## Login Credentials

| Role | Username | Password |
|---|---|---|
| ASHA Worker | asha1 | password |
| Doctor | doctor1 | password |
| Admin | admin1 | password |

## Features

- **Patient Registration** with ABDM Health ID generation
- **OCR Upload** — extract medicines and lab results from prescription photos using Gemini Vision
- **AI Triage** — XGBoost model classifies risk (Low / Medium / High / Emergency)
- **Teleconsult** — video consultation for medium/high risk patients
- **Referral Management** — create, accept and track referrals across facilities
- **Follow-up Board** — ASHA worker follow-up scheduling
- **Live Dashboards** — real-time data from Firestore, auto-refresh every 30s
- **Cross-portal Records** — patient records visible to ASHA, Doctor, Admin and Patient

## ML Model

- Algorithm: XGBoost
- Test Accuracy: 96.4% | Cross-validation: 96.8%
- Training samples: 27,606 (UCI Heart, Pima Diabetes, Sylhet, Rural India ICMR/WHO)
- Features: BP, temperature, SpO2, pulse, severity, duration, symptom flags

## Tech Stack

- React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- Node.js, Express, Firebase Admin SDK, Firestore
- FastAPI, Google Gemini Vision API
- Flask, XGBoost, scikit-learn, joblib
- JWT authentication, WebSocket live updates
