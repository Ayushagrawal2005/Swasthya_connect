"""
Regex-based structuring module — used as the OFFLINE FALLBACK when
Gemini is unavailable (no API key, no internet, or an API error).

Gemini (see gemini_ocr.py) is the primary path and does OCR +
structuring + summary in a single call. This module exists purely as
a safety net so the app doesn't break during a live demo if wifi
drops or the API has a hiccup.
"""

import re
from typing import List

from models import ExtractedMedicine, ExtractedTestValue, OCRResult

# Seed list — extend with whatever drugs appear in your demo samples.
# Matching is case-insensitive.
DRUG_NAME_LIST = [
    "amlodipine", "metformin", "atorvastatin", "losartan", "amoxicillin",
    "azithromycin", "paracetamol", "ibuprofen", "omeprazole", "pantoprazole",
    "cetirizine", "levothyroxine", "insulin", "aspirin", "clopidogrel",
    "telmisartan", "glimepiride", "metoprolol", "hydrochlorothiazide",
    "ranitidine", "domperidone", "salbutamol", "prednisolone",
]

LAB_TEST_PATTERNS = {
    "hba1c": r"hba1c[:\s]*([\d.]+)\s*%?",
    "fasting_glucose": r"(?:fasting\s+glucose|fbs)[:\s]*([\d.]+)\s*(mg/dl)?",
    "systolic_bp": r"(\d{2,3})\s*/\s*\d{2,3}\s*(?:mmhg)?",
    "diastolic_bp": r"\d{2,3}\s*/\s*(\d{2,3})\s*(?:mmhg)?",
    "cholesterol": r"cholesterol[:\s]*([\d.]+)\s*(mg/dl)?",
    "hemoglobin": r"h(?:a)?emoglobin[:\s]*([\d.]+)\s*(g/dl)?",
}

DOSAGE_PATTERN = re.compile(r"(\d+\s?(?:mg|mcg|ml|g))\b", re.IGNORECASE)

FREQUENCY_KEYWORDS = {
    "od": "once daily",
    "bd": "twice daily",
    "tds": "three times daily",
    "qid": "four times daily",
    "sos": "as needed",
    "hs": "at bedtime",
}

DATE_PATTERN = re.compile(r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b")


def classify_document_type(text: str) -> str:
    lowered = text.lower()
    if any(k in lowered for k in ["rx", "tablet", "prescribed", "dosage", "advice"]):
        return "prescription"
    if any(k in lowered for k in ["reference range", "lab report", "test result", "specimen"]):
        return "lab_report"
    if any(k in lowered for k in ["discharge summary", "admitted", "discharged on"]):
        return "discharge_summary"
    return "unknown"


def extract_medicines(text: str) -> List[ExtractedMedicine]:
    lowered = text.lower()
    found = []

    for drug in DRUG_NAME_LIST:
        idx = lowered.find(drug)
        if idx == -1:
            continue

        window = text[idx: idx + 60]

        dosage_match = DOSAGE_PATTERN.search(window)
        dosage = dosage_match.group(1) if dosage_match else None

        frequency = None
        window_lower = window.lower()
        for abbr, meaning in FREQUENCY_KEYWORDS.items():
            if re.search(rf"\b{abbr}\b", window_lower):
                frequency = meaning
                break

        confidence = 0.5
        if dosage:
            confidence += 0.25
        if frequency:
            confidence += 0.25

        found.append(ExtractedMedicine(
            name=drug.capitalize(),
            dosage=dosage,
            frequency=frequency,
            confidence=round(confidence, 2),
        ))

    return found


def extract_test_values(text: str) -> List[ExtractedTestValue]:
    lowered = text.lower()
    found = []

    for test_name, pattern in LAB_TEST_PATTERNS.items():
        match = re.search(pattern, lowered)
        if not match:
            continue
        value = match.group(1)
        unit = match.group(2) if match.lastindex and match.lastindex >= 2 else None
        found.append(ExtractedTestValue(
            test_name=test_name,
            value=value,
            unit=unit,
            reference_range=None,
            is_abnormal=None,
        ))

    return found


def extract_dates(text: str) -> List[str]:
    return [m.group(0) for m in DATE_PATTERN.finditer(text)]


def _build_fallback_summary(result: OCRResult) -> str:
    """
    Templated summary used only when Gemini is unavailable. Built
    strictly from what was actually extracted — nothing inferred.
    """
    parts = []

    if result.medicines:
        med_names = ", ".join(m.name for m in result.medicines)
        parts.append(f"This {result.document_type.replace('_', ' ')} lists: {med_names}.")
    elif result.test_values:
        test_names = ", ".join(t.test_name.replace("_", " ") for t in result.test_values)
        parts.append(f"This {result.document_type.replace('_', ' ')} includes results for: {test_names}.")
    else:
        parts.append(f"This appears to be a {result.document_type.replace('_', ' ')}.")

    if result.dates_found:
        parts.append(f"Dated: {result.dates_found[0]}.")

    parts.append("Please review the extracted fields below for accuracy.")
    return " ".join(parts)


def structure_ocr_text(raw_text: str) -> OCRResult:
    """
    Fallback entry point: takes raw OCR text (from Tesseract or mock
    data) and returns a structured OCRResult with a templated
    summary. A worker should still review/correct this before saving
    to the patient record.
    """
    result = OCRResult(
        raw_text=raw_text,
        document_type=classify_document_type(raw_text),
        medicines=extract_medicines(raw_text),
        test_values=extract_test_values(raw_text),
        dates_found=extract_dates(raw_text),
        needs_review=True,
    )
    result.summary = _build_fallback_summary(result)
    return result
