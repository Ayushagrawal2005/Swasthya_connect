#!/bin/bash

# SwasthyaConnect - OCR Service Deployment Script
# Deploys Python + FastAPI + Gemini OCR service

echo "🚀 Starting OCR Service Deployment..."

# Navigate to OCR directory
cd "$(dirname "$0")/../services/ocr"

# Create virtual environment (optional for local testing)
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || venv\\Scripts\\activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ OCR Service ready for deployment!"
echo "📝 Next steps:"
echo "1. Create Hugging Face Space (select Gradio SDK)"
echo "2. Upload main.py and requirements.txt"
echo "3. Add GEMINI_API_KEY secret"
echo "4. Space will auto-deploy"
