# Deploy ML Service to Render

## Quick Start (5 minutes)

### Step 1: Go to Render Dashboard
https://dashboard.render.com

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub: Select **"Ayushagrawal2005/Swasthya_connect"** repo
3. Fill in details:

**Service Configuration:**
```
Name: swasthya-connect-ml
Region: Frankfurt (closest to India) or Singapore
Branch: main
Root Directory: services/ml
```

**Build & Deploy:**
```
Environment: Python 3
Python Version: 3.11.0
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
```

**Instance Type:**
```
Free (512 MB RAM, sleeps after 15 min)
```

### Step 3: Add Environment Variables
Go to **Environment** tab and add:

```
GROQ_API_KEY = your_groq_api_key_here
GROQ_MODEL = llama-3.3-70b-versatile
FLASK_ENV = production
```

**Get your GROQ API Key**: https://console.groq.com/keys

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build to complete
3. Check logs for: `✓ ML Model loaded`

### Step 5: Get Your URL
After deployment succeeds, you'll get a URL like:
```
https://swasthya-connect-ml-xxxx.onrender.com
```

### Step 6: Test Health Endpoint
```bash
curl https://swasthya-connect-ml-xxxx.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "XGBoost",
  "accuracy": 0.9638
}
```

### Step 7: Update Frontend (If Needed)
If your URL is different, update `.env`:
```
VITE_ML_API_URL=https://swasthya-connect-ml-xxxx.onrender.com
```

## Troubleshooting

### Build Fails
**Error**: `ModuleNotFoundError: No module named 'xgboost'`

**Fix**: Make sure `requirements.txt` is complete:
```txt
flask==3.0.0
flask-cors==4.0.0
gunicorn==21.2.0
groq==0.4.0
scikit-learn==1.5.2
numpy==1.26.4
pandas==2.2.2
joblib==1.4.2
python-dotenv==1.0.1
requests==2.32.3
xgboost==2.1.1
```

### Out of Memory
**Error**: `Memory limit exceeded (512MB)`

**Cause**: XGBoost model + scikit-learn requires more RAM

**Fix**: 
1. Upgrade to paid tier ($7/month for 2GB RAM)
2. Or optimize model (reduce features, use smaller model)

### Model Not Found
**Error**: `⚠ Model not found: [Errno 2] No such file or directory`

**Cause**: `models/` folder not in GitHub (gitignored)

**Fix**: 
1. Remove `models/` from `.gitignore`
2. Commit and push model files:
```bash
cd services/ml
git add models/
git commit -m "Add trained ML models"
git push
```

**Note**: Models are large (~50MB). Consider using Git LFS or hosting separately.

### Service Keeps Crashing
**Check Render Logs**:
1. Dashboard → Your Service → **Logs** tab
2. Look for Python errors
3. Common issues:
   - Missing GROQ_API_KEY
   - Import errors
   - Port binding issues

### Cold Start Takes Too Long
**Symptom**: First request takes 60-90 seconds

**Cause**: Render free tier spins down after 15 minutes

**Fix**: Set up UptimeRobot to ping every 5 minutes (see `UPTIME_MONITORING.md`)

## Alternative: Deploy to Railway

Railway offers better cold starts and more generous free tier:

1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Select `services/ml` folder
4. Railway auto-detects Python and requirements.txt
5. Add environment variables
6. Deploy!

## Cost Comparison

| Service | Free Tier | Cold Starts | Cost (Paid) |
|---------|-----------|-------------|-------------|
| **Render** | 750 hrs/month, 512MB | 30-90s | $7/month |
| **Railway** | $5 credit/month | 10-20s | Pay-as-you-go |
| **Fly.io** | 3 shared VMs | 5-15s | $1.94/month |

## Production Checklist

- [ ] Service deployed and healthy
- [ ] Environment variables set
- [ ] Health endpoint returns 200 OK
- [ ] Test predict endpoint with sample data
- [ ] Set up UptimeRobot monitoring
- [ ] Update frontend VITE_ML_API_URL
- [ ] Test end-to-end triage flow
- [ ] Monitor Render logs for errors
- [ ] Set up alerts for downtime

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Support: support@render.com
