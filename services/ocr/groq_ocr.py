"""
OCR + structuring + summary — using Groq Vision API.

Uses Groq's vision capability to read medical documents and return
structured JSON (extracted fields + plain-language summary).

Setup:
1. Go to https://console.groq.com/keys to get an API key (free tier available)
2. Set GROQ_API_KEY in your .env file.

Fallback chain:
  1. Groq Vision API (fast, accurate)
  2. Local Tesseract OCR + regex structuring (offline fallback)
  3. Canned mock data (if OCR_MOCK_MODE=true)
"""

import os
import json
import base64
from dotenv import load_dotenv
import requests

from models import OCRResult, ExtractedMedicine, ExtractedTestValue
from extraction import structure_ocr_text  # regex fallback

load_dotenv()

OCR_MOCK_MODE = os.getenv("OCR_MOCK_MODE", "false").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

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
  "summary": "<a 2-3 sentence plain-language summary a patient could understand>",
  "medicines": [
    {"name": "<drug name>", "dosage": "<e.g. 5mg or null>", "frequency": "<e.g. once daily or null>", "confidence": <0.0-1.0>}
  ],
  "test_values": [
    {"test_name": "<e.g. hba1c>", "value": "<numeric string or null>", "unit": "<e.g. mg/dL or null>", "reference_range": null, "is_abnormal": null}
  ],
  "dates_found": ["<any dates you see, as written>"]
}

Only include medicines/tests you can actually see in the image.
If handwriting is illegible, use null. Only restate what's written."""


def _mock_result() -> OCRResult:
    return structure_ocr_text(_MOCK_OCR_TEXT)


def _groq_extract(image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
    """Extract using Groq Vision API"""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set")
    
    # Convert image to base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    image_url = f"data:{mime_type};base64,{image_b64}"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.2-90b-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    },
                    {
                        "type": "text",
                        "text": EXTRACTION_PROMPT
                    }
                ]
            }
        ],
        "temperature": 0.2,
        "max_tokens": 2000
    }
    
    response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    
    result = response.json()
    text_response = result["choices"][0]["message"]["content"]
    
    # Extract JSON from response (handle markdown code blocks)
    json_match = text_response
    if "```json" in text_response:
        json_match = text_response.split("```json")[1].split("```")[0].strip()
    elif "```" in text_response:
        json_match = text_response.split("```")[1].split("```")[0].strip()
    
    data = json.loads(json_match)
    
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
    """Local, offline OCR fallback."""
    import pytesseract
    from PIL import Image
    from io import BytesIO

    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    image = Image.open(BytesIO(image_bytes))
    raw_text = pytesseract.image_to_string(image)
    return structure_ocr_text(raw_text)


def extract_document(image_bytes: bytes, mime_type: str = "image/jpeg") -> OCRResult:
    """
    Main entry point. Tries Groq first, falls back to Tesseract,
    then mock data.
    """
    if OCR_MOCK_MODE:
        return _mock_result()

    if GROQ_API_KEY:
        try:
            return _groq_extract(image_bytes, mime_type)
        except Exception as e:
            print(f"[warn] Groq OCR failed, falling back to Tesseract: {e}")

    try:
        return _tesseract_fallback(image_bytes)
    except Exception as e:
        print(f"[warn] Tesseract fallback failed, returning mock data: {e}")
        return _mock_result()
