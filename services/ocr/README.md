---
title: SwasthyaConnect OCR Service
emoji: 📄
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# SwasthyaConnect OCR Service

Groq Vision-powered medical document extraction for rural India healthcare.

## Endpoints

- `GET /health` — Health check
- `POST /ocr/extract` — Extract structured data from medical document image

## Features

- Extracts medicines, dosages, frequencies
- Extracts lab test values and results
- Generates plain-language summaries
- Supports prescriptions, lab reports, discharge summaries
- Fallback to Tesseract OCR when needed

## Part of Swasthya Connect — Smart India Hackathon 2026
