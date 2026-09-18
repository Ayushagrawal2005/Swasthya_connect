"""
Data models for the OCR + structuring + summary pipeline.
Defines the JSON shape the frontend sends and receives.
"""

from pydantic import BaseModel
from typing import List, Optional


class ExtractedMedicine(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    confidence: float  # 0.0-1.0, how sure the extraction is


class ExtractedTestValue(BaseModel):
    test_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: Optional[bool] = None


class OCRResult(BaseModel):
    raw_text: str
    document_type: str  # "prescription" | "lab_report" | "discharge_summary" | "unknown"
    summary: str = ""    # plain-language 2-3 sentence summary of the document
    medicines: List[ExtractedMedicine] = []
    test_values: List[ExtractedTestValue] = []
    dates_found: List[str] = []
    needs_review: bool = True  # always true until a human worker confirms/corrects
