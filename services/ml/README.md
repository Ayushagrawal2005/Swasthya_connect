---
title: SwasthyaConnect ML Service
emoji: 🏥
colorFrom: blue
colorTo: orange
sdk: docker
pinned: false
app_port: 7860
---

# SwasthyaConnect ML Triage Service

XGBoost-powered triage risk prediction for rural India healthcare.

## Endpoints

- `GET /health` — Health check
- `POST /predict` — Triage risk prediction
- `POST /voice-triage/start` — Start voice triage session
- `POST /voice-triage/next-question` — Get next adaptive question
- `POST /voice-triage/finalize` — Finalize and get risk score

## Model

- Algorithm: XGBoost Classifier
- Training samples: 27,606 (real + augmented rural India data)
- Features: BP, temperature, SpO2, pulse, severity, duration, symptoms

## Part of Swasthya Connect — Smart India Hackathon 2026
