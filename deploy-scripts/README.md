# Deployment Scripts

Quick deployment scripts for SwasthyaConnect platform.

## Usage

### 1. Setup Firebase (First Time Only)

```bash
bash deploy-scripts/setup-firebase.sh
```

### 2. Deploy Frontend

```bash
bash deploy-scripts/deploy-frontend.sh
```

### 3. Deploy Backend API

```bash
bash deploy-scripts/deploy-backend.sh
```

### 4. Deploy ML Service

```bash
bash deploy-scripts/deploy-ml.sh
```

### 5. Deploy OCR Service

```bash
bash deploy-scripts/deploy-ocr.sh
```

## On Windows

Use Git Bash or run PowerShell versions:

```powershell
# Deploy Frontend
cd healthcare-platform
npm install
npm run build
firebase deploy --only hosting
```

## Full Deployment Guide

See `DEPLOYMENT_GUIDE.md` for comprehensive instructions.
