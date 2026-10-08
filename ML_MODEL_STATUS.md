# ML Model Integration Status

## ✅ Configuration Summary

Both ASHA and Patient Portal are configured to use the **SAME ML model**:

### ML Service URL:
```
https://swasthya-connect-ml.onrender.com
```

### Model Details:
- **Algorithm**: XGBoost Classifier
- **Accuracy**: 96.4%
- **Endpoint**: `/predict`
- **Health Check**: `/health`

---

## 🔄 How Each Portal Uses the ML Model:

### ASHA Portal (`/asha/triage`):
1. Uses voice triage API endpoints
2. Calls `/voice-triage/finalize` which internally calls `/predict`
3. Same XGBoost model, same accuracy

### Patient Portal (`/patient/triage`):
1. Uses `triageEngine.assessTriage()`  
2. Calls `/predict` endpoint directly
3. **Same XGBoost model, same accuracy**

---

## 🎯 Code Flow:

```
Patient Portal
  ↓
triageEngine.assessTriage()
  ↓
triageApi.predict()
  ↓
POST https://swasthya-connect-ml.onrender.com/predict
  ↓
XGBoost Model (96.4% accuracy)
  ↓
Returns: { urgency_level, risk_level, score, confidence, probabilities, hospital_level, specialist }
```

---

## ✅ Environment Variables:

Your `.env` file is correctly configured:

```bash
VITE_API_URL=https://swasthya-connect-1x6r.onrender.com
VITE_ML_API_URL=https://swasthya-connect-ml.onrender.com
VITE_OCR_API_URL=https://swasthya-connect-ocr.onrender.com
```

---

## 🔍 Verify ML Model is Working:

### Test ML Service Health:
```bash
curl https://swasthya-connect-ml.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "XGBoost",
  "accuracy": 96.4,
  "timestamp": "..."
}
```

### Test Prediction:
```bash
curl -X POST https://swasthya-connect-ml.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "vitals": {"bp": "140/90", "temp": "101", "spo2": "95", "pulse": "85"},
    "answers": ["chest pain", "3 days", "yes"],
    "severity": 7,
    "duration_days": 3
  }'
```

---

## ⚠️ If Patient Portal Triage Is Not Working:

### Possible Issues:

1. **Vercel Build Didn't Pick Up Environment Variables**
   - Solution: Force rebuild on Vercel dashboard
   - Or: Commit a small change to trigger auto-deploy

2. **ML Service Asleep (Cold Start)**
   - Solution: UptimeRobot pinging every 5 minutes keeps it warm
   - First request after sleep takes 60-90 seconds

3. **Browser Cache**
   - Solution: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Or: Clear browser cache

4. **CORS Issue**
   - Solution: Already configured in ML service (`services/ml/app.py`)
   - Allows all Vercel domains

---

## 🚀 Force Frontend Rebuild:

If patient portal still shows "ML not working", trigger a Vercel rebuild:

### Option 1: Empty Commit
```bash
git commit --allow-empty -m "Trigger Vercel rebuild for ML integration"
git push origin main
```

### Option 2: Add Comment to Trigger Rebuild
```bash
# Add a comment to any file and commit
echo "# ML integration verified" >> README.md
git add README.md
git commit -m "Verify ML integration"
git push origin main
```

---

## ✅ Expected Behavior After Fix:

### Patient Portal Triage Should Show:
- ✅ "XGBoost ML scoring · 96.4% accuracy" badge
- ✅ ML confidence percentage
- ✅ Probability breakdown (Low/Medium/High/Emergency)
- ✅ Hospital level recommendation
- ✅ Specialist recommendation
- ✅ "XGBoost · XX% confidence" in result card

---

## 📊 Comparison:

| Feature | ASHA Triage | Patient Triage | Status |
|---------|-------------|----------------|--------|
| ML Model | XGBoost 96.4% | XGBoost 96.4% | ✅ Same |
| ML Service URL | swasthya-connect-ml.onrender.com | swasthya-connect-ml.onrender.com | ✅ Same |
| Prediction Endpoint | /predict | /predict | ✅ Same |
| Fallback Scoring | Rule-based | Rule-based | ✅ Same |
| Hospital Level | Yes | Yes | ✅ Same |
| Specialist Recommendation | Yes | Yes | ✅ Same |

---

## 🎯 Conclusion:

**The patient portal symptom checker DOES use the same ML model as ASHA triage.** 

Both services call the same XGBoost model hosted at `https://swasthya-connect-ml.onrender.com`.

If it's not working, the issue is likely:
1. Frontend needs rebuild on Vercel
2. Browser cache
3. ML service cold start (first request slow)

**Solution**: Wait for Vercel auto-deploy (~2 min) or force rebuild with empty commit.
