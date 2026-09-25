#!/bin/bash

# SwasthyaConnect - ML Service Deployment Script
# Deploys Python + Flask + XGBoost ML service

echo "🚀 Starting ML Service Deployment..."

# Navigate to ML directory
cd "$(dirname "$0")/../services/ml"

# Check for model file
if [ ! -f "triage_model_xgb.joblib" ]; then
    echo "⚠️  WARNING: triage_model_xgb.joblib not found!"
    echo "Please train and save the model first."
    exit 1
fi

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

echo "✅ ML Service ready for deployment!"
echo "📝 Next steps:"
echo "1. Create Hugging Face Space"
echo "2. Upload all files including model"
echo "3. Add GROQ_API_KEY secret"
echo "4. Space will auto-deploy"
