"""
OCR + structuring + summary — primary pipeline.

Uses Gemini's multimodal capability to read a photographed medical
document and return structured JSON (extracted fields + a
plain-language summary) in a single call.

Setup:
1. Go to https://aistudio.google.com -> "Get API key" (free, no
   credit card required for the free tier).
2. Set GEMINI_API_KEY in your .env file.

Fallback chain (so a live demo never hard-fails):
  1. Gemini (best accuracy, includes summary generation)
  2. Local Tesseract OCR + regex structuring (offline-safe, templated summary)
  3. Canned mock data (if OCR_MOCK_MODE=true, or everything else fails)
"""

import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

from models import OCRResult, ExtractedMedicine, ExtractedTestValue
from extraction import structure_ocr_text  # regex fallback

# Load .env so the key is available whether this module is run
# directly or imported by main.py
load_dotenv()

OCR_MOCK_MODE = os.getenv("OCR_MOCK_MODE", "false").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

_MOCK_OCR_TEXT = """Dr. R. Sharma, MBBS MD
City Clinic, Mankapur

Patient: Meena Devi   Age: 52   Date: 18-08-2026

Rx
1. Amlodipine 5mg - 1 tablet OD (morning)
2. Metformin 500mg - 1 tablet BD (morning, evening)

Advice: Low salt diet, follow up in 2 weeks
BP recorded: 168/104 mmHg
"""

EXTRACTION_PROMPT = """You are reading a photographed Indian medical document
(prescription, lab report, or discharge summary). Extract the following as
strict JSON, with no extra commentary or markdown formatting:

{
  "raw_text": "<the full text you can read from the image>",
  "document_type": "<one of: prescription, lab_report, discharge_summary, unknown>",
  "summary": "<a 2-3 sentence plain-language summary a patient could understand: what this document is, what was prescribed or found, and any follow-up advice mentioned. Do not add medical opinions or diagnoses beyond what is written.>",
  "medicines": [
    {"name": "<drug name>", "dosage": "<e.g. 5mg or null>", "frequency": "<e.g. once daily or null>", "confidence": <0.0-1.0>}
  ],
  "test_values": [
    {"test_name": "<e.g. hba1c>", "value": "<numeric string or null>", "unit": "<e.g. mg/dL or null>", "reference_range": null, "is_abnormal": null}
  ],
  "dates_found": ["<any dates you see, as written>"]
}

If the handwriting is illegible for a field, use null rather than guessing.
Only include medicines/tests you can actually see evidence for in the image.
The summary must only restate what is written in the document — never infer
a diagnosis or add clinical judgment that isn't explicitly on the page."""


def _mock_result() -> OCRResult:
    return structure_ocr_text(_MOCK_OCR_TEXT)


def _gemini_extract(image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            EXTRACTION_PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    data = json.loads(response.text)

    return OCRResult(
        raw_text=data.get("raw_text", ""),
        document_type=data.get("document_type", "unknown"),
        summary=data.get("summary", ""),
        medicines=[ExtractedMedicine(**m) for m in data.get("medicines", [])],
        test_values=[ExtractedTestValue(**t) for t in data.get("test_values", [])],
        dates_found=data.get("dates_found", []),
        needs_review=True,
    )


def _tesseract_fallback(image_bytes: bytes) -> OCRResult:
    """Local, offline OCR fallback. Lower accuracy than Gemini on
    messy handwriting, but keeps the app working with no internet."""
    import pytesseract
    from PIL import Image
    from io import BytesIO

    # Set Tesseract path for Windows
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    image = Image.open(BytesIO(image_bytes))
    raw_text = pytesseract.image_to_string(image)
    return structure_ocr_text(raw_text)


def extract_document(image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
    """
    Main entry point. Tries Gemini first, falls back to Tesseract,
    falls back to mock data — in that order — so the endpoint never
    hard-fails during a demo.
    """
    if OCR_MOCK_MODE:
        return _mock_result()

    if os.getenv("GEMINI_API_KEY"):
        try:
            return _gemini_extract(image_bytes, mime_type)
        except Exception as e:
            print(f"[warn] Gemini OCR failed, falling back to Tesseract: {e}")

    try:
        return _tesseract_fallback(image_bytes)
    except Exception as e:
        print(f"[warn] Tesseract fallback failed, returning mock data: {e}")
        return _mock_result()
