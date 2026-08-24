# SwasthyaConnect — OCR + Structuring + Summary Service

FastAPI microservice that takes a photographed medical document
(prescription, lab report, or discharge summary) and returns:
- Raw extracted text
- A plain-language 2-3 sentence summary
- Structured medicine list (name, dosage, frequency)
- Structured test values (name, value, unit)
- Any dates found on the document

Built to be handed off to a teammate for frontend integration.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and paste your Gemini API key
# get one free, no card needed, at https://aistudio.google.com
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs
Health check: http://localhost:8000/health

## Endpoint

**POST** `/ocr/extract`
Body: multipart/form-data with a `file` field (an image)

Example response:
```json
{
  "raw_text": "Dr. R. Sharma...",
  "document_type": "prescription",
  "summary": "This prescription is for Meena Devi, dated 18-08-2026. It includes Amlodipine 5mg once daily and Metformin 500mg twice daily. Advice given: low salt diet, follow up in 2 weeks.",
  "medicines": [
    {"name": "Amlodipine", "dosage": "5mg", "frequency": "once daily", "confidence": 1.0},
    {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "confidence": 1.0}
  ],
  "test_values": [],
  "dates_found": ["18-08-2026"],
  "needs_review": true
}
```

## How it works — fallback chain

1. **Gemini** (`gemini-2.0-flash`) reads the image directly and
   returns structured JSON + summary in one call. This is the
   primary path — best accuracy on messy handwriting.
2. **Tesseract fallback**: if no Gemini key is set, or the API call
   fails (e.g. no internet during a live demo), falls back to local
   OCR + regex-based structuring, with a templated (non-LLM) summary.
3. **Mock mode**: set `OCR_MOCK_MODE=true` in `.env` to skip real OCR
   entirely and get canned demo data — useful for frontend
   development before a Gemini key is available, or as a
   guaranteed-to-work fallback on demo day.

`needs_review` is always `true` — the frontend should show extracted
fields to a human for confirmation/correction before saving to a
patient record.

## Integrating from the frontend

```javascript
const formData = new FormData();
formData.append('file', imageFile); // File object from an <input type="file">

const response = await fetch('http://localhost:8000/ocr/extract', {
  method: 'POST',
  body: formData,
});
const data = await response.json();

// data.summary        -> show as the plain-language card
// data.medicines       -> render as an editable list
// data.test_values     -> render as an editable list
// data.needs_review    -> gate the "confirm & save" button
```

## Extending

Add more drug names to `DRUG_NAME_LIST` in `app/extraction.py` if you
want the offline Tesseract fallback to recognize more medicines —
this only affects the fallback path, not the primary Gemini path
(Gemini doesn't need a predefined drug list).
