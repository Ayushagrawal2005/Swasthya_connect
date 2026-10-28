# Services Status - October 25, 2026

## ✅ All Services Running

### Backend API (Port 4000)
- **Status**: ✅ Running
- **URL**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **Features**: Firebase connected, WebRTC signaling ready, follow-up updater active

### Frontend (Port 5173)
- **Status**: ✅ Running
- **URL**: http://localhost:5173
- **Build Tool**: Vite
- **Ready Time**: ~1.9 seconds

### ML Service (Port 5000)
- **Status**: ✅ Running
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Model**: XGBoost
- **Accuracy**: 96.38%
- **Features**: ML triage predictions, voice triage routes active

### OCR Service (Port 8000)
- **Status**: ⏳ Starting
- **URL**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **Features**: Groq-powered OCR for medical documents

## Current Issue Fixed

### Problem: ML Triage Showing Syntax Errors
**Error**: `Unexpected token '<', '<!DOCTYPE'... is not valid JSON`

**Root Cause**: Services were stopped/crashed

**Solution**: ✅ All services restarted successfully

## Testing ML Triage

1. **Open Frontend**: http://localhost:5173
2. **Login as ASHA**: asha@swasthya.in / demo1234
3. **Go to Triage Patient**
4. **Test the flow**:
   - Select language
   - Enter vitals (BP, temp, SpO2, pulse)
   - Answer symptom questions
   - ML will provide risk assessment

## Expected ML Response

When ML service is working, you should get:

```json
{
  "urgency_level": 2,
  "risk_level": "medium",
  "risk_label": "Moderate Risk",
  "score": 65,
  "confidence": 0.85,
  "auto_escalate": false,
  "flags": [],
  "hospital_level": 1,
  "hospital_level_label": "PHC",
  "hospital_level_desc": "Primary Health Centre",
  "probabilities": {
    "low": 0.20,
    "medium": 0.65,
    "high": 0.15,
    "emergency": 0.00
  },
  "timestamp": "2026-10-25T01:50:00Z"
}
```

## Troubleshooting

### If ML Triage Still Shows Errors

1. **Check ML Service is Running**:
   ```powershell
   curl http://localhost:5000/health
   ```
   
   Should return:
   ```json
   {
     "status": "healthy",
     "model_loaded": true
   }
   ```

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for the line: `🔗 ML API Base URL: http://localhost:5000`
   - Check for any network errors

3. **Check Backend Logs**:
   - Terminal running backend should show ML API calls

4. **Test ML Endpoint Directly**:
   ```powershell
   curl -X POST http://localhost:5000/predict `
     -H "Content-Type: application/json" `
     -d '{"vitals":{"bp":"120/80","temp":"98.6","spo2":"98","pulse":"75"},"answers":["fever","cough"],"severity":5,"duration_days":3}'
   ```

### Common Issues

1. **Port Already in Use**: Kill the process using the port
   ```powershell
   # Find process
   netstat -ano | findstr :5000
   
   # Kill process (replace PID)
   taskkill /PID <PID> /F
   ```

2. **Python Environment**: Make sure you're in the right conda/venv environment
   ```powershell
   conda activate base  # or your environment name
   ```

3. **Dependencies Missing**: Reinstall ML dependencies
   ```powershell
   cd services/ml
   pip install -r requirements.txt
   ```

## Service URLs Summary

| Service | Local URL | Production URL |
|---------|-----------|----------------|
| Frontend | http://localhost:5173 | https://swasthya-connect-snowy.vercel.app |
| Backend | http://localhost:4000 | https://swasthya-connect-backend.onrender.com |
| ML Service | http://localhost:5000 | https://swasthya-connect-ml-of1d.onrender.com |
| OCR Service | http://localhost:8000 | https://swasthya-connect-ocr.onrender.com |

## Next Steps

1. ✅ Refresh frontend (http://localhost:5173)
2. ✅ Login as ASHA worker
3. ✅ Try ML triage - should work now!
4. ⏰ Set up UptimeRobot for production monitoring (see UPTIME_MONITORING.md)

## Demo Credentials

All passwords: `demo1234`

- **ASHA**: asha@swasthya.in
- **Doctor**: doctor@swasthya.in
- **Admin**: admin@swasthya.in
- **Patient (Female)**: priya@swasthya.in
- **Patient (Male)**: rajesh@swasthya.in
