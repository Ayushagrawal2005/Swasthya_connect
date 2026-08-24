"""
SwasthyaConnect OCR service — extraction + structuring + summary.

Run locally:
    uvicorn app.main:app --reload --port 8000

Then point the frontend's OCR upload feature at:
    http://localhost:8000/ocr/extract

Endpoint:
    POST /ocr/extract  -> upload an image, get structured + summarized data back
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from gemini_ocr import extract_document
from models import OCRResult

app = FastAPI(title="SwasthyaConnect OCR Service")

# Allow the frontend dev server (and any origin) to call this API.
# Tighten allow_origins before a real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/ocr/extract", response_model=OCRResult)
async def ocr_extract(file: UploadFile = File(...)):
    """
    Accepts an uploaded prescription / lab report / discharge summary
    image. Returns structured (but unverified) data, including a
    plain-language summary. The frontend should show this to the
    worker for correction before saving it to the patient record
    (human-in-the-loop).
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    try:
        return extract_document(image_bytes, mime_type=file.content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OCR failed: {e}")
