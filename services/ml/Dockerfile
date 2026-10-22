# Hugging Face Spaces — SwasthyaConnect ML Service
# CPU Basic tier (free) — XGBoost triage prediction + Voice triage

FROM python:3.11-slim

# HF Spaces requires port 7860
ENV PORT=7860
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir xgboost==2.0.3

# Copy application code
COPY . .

# Expose HF Spaces port
EXPOSE 7860

# Start Flask with gunicorn on port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--timeout", "120", "--preload", "app:app"]
