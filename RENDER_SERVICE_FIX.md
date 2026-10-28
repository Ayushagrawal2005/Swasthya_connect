# Fix Render Services - 503 Errors

## Problem
Your deployed services on Render are returning 503 Service Unavailable errors. UptimeRobot detected this at Oct 25, 2026, 01:53 GMT+5:30.

## Root Cause
Render free tier services spin down after 15 minutes of inactivity and can fail to restart if:
1. Build failed
2. Out of memory
3. Environment variables missing
4. Dependencies issues
5. Render free tier limits exceeded

## Quick Fix Steps

### 1. Check Render Dashboard
Go to [https://dashboard.render.com](https://dashboard.render.com)

Log in and check each service:
- **swasthya-connect-backend** (Node.js)
- **swasthya-connect-ml** (Python)
- **swasthya-connect-ocr** (Python)

### 2. Check Service Status

For each service, look for:
- 🔴 **Deploy Failed** - Red status
- 🟡 **Building** - Yellow status  
- 🟢 **Live** - Green status
- ⚪ **Suspended** - Service stopped

### 3. Fix Common Issues

#### Issue: Build Failed
**Symptoms**: Red status, "Deploy failed" message

**Solution**:
1. Click on the service
2. Go to "Logs" tab
3. Look for the error (usually at the end)
4. Common errors:
   - **Module not found**: Missing dependency in requirements.txt or package.json
   - **Python version**: Wrong Python version specified
   - **Port binding**: Service not listening on correct port

**Quick fixes**:
```bash
# For Python services (ML/OCR)
# Make sure requirements.txt has all dependencies
pip freeze > requirements.txt

# For Node.js backend
# Make sure package.json is complete
npm install
```

#### Issue: Out of Memory
**Symptoms**: Service crashes, "Memory limit exceeded" in logs

**Solution**:
- Render free tier: 512MB RAM
- ML service with XGBoost model can exceed this
- **Upgrade to paid plan** ($7/month for 2GB RAM)
- Or **optimize model** (use smaller model, reduce features)

#### Issue: Environment Variables Missing
**Symptoms**: Service starts but crashes immediately, "GROQ_API_KEY not found"

**Solution**:
1. Go to service → **Environment** tab
2. Add missing variables:

**Backend** (.env variables):
```
JWT_SECRET=healthcare-secret-key-change-in-production
OCR_SERVICE_URL=https://swasthya-connect-ocr.onrender.com
GROQ_API_KEY=your_groq_api_key_here
```

**ML Service** (.env variables):
```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
FLASK_ENV=production
```

**OCR Service** (.env variables):
```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

#### Issue: Service Suspended
**Symptoms**: White/grey status, "Service suspended"

**Solution**:
- Render free tier has limits:
  - 750 hours/month per service
  - If exceeded, service is suspended
- **Upgrade to paid plan** or **use fewer services**
- Check usage: Dashboard → Service → **Metrics** tab

### 4. Manual Restart

If service is showing as "Live" but still returning 503:

1. Go to service in Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait 2-5 minutes for rebuild
4. Test health endpoint

### 5. Test Health Endpoints

After fixing, test each service:

```bash
# Backend
curl https://swasthya-connect-backend.onrender.com/health

# ML Service
curl https://swasthya-connect-ml.onrender.com/health

# OCR Service
curl https://swasthya-connect-ocr.onrender.com/health
```

Expected response (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-10-25T02:00:00Z",
  "model_loaded": true,
  "service": "swasthya-connect-ml"
}
```

## Permanent Solution: UptimeRobot

To prevent future 503 errors, set up UptimeRobot (see `UPTIME_MONITORING.md`):

1. Sign up at [https://uptimerobot.com](https://uptimerobot.com)
2. Add monitors for all 3 services
3. Set interval to 5 minutes
4. Services will stay awake 24/7

## GitHub Actions Already Active

Your GitHub Actions workflow (`keep-services-alive.yml`) is already pinging services every 5 minutes, but it may not be enough if services are already down.

To check if it's running:
1. Go to your GitHub repo
2. Click **Actions** tab
3. Look for "Keep Render Services Alive" workflow
4. Should show green checkmarks every 5 minutes

## Troubleshooting Specific Services

### Backend (Node.js)
**Port**: 4000  
**Start Command**: `npm start` or `npm run start:prod`  
**Build Command**: `npm install && npm run build`

**Common issues**:
- Missing `start:prod` script in package.json
- TypeScript compile errors
- Firebase serviceAccountKey.json missing (add to Render environment as JSON)

### ML Service (Python/Flask)
**Port**: 5000  
**Start Command**: `python app.py` or `gunicorn app:app`  
**Build Command**: `pip install -r requirements.txt`

**Common issues**:
- scikit-learn version mismatch (model trained on 1.9.0, server has 1.7.2)
- XGBoost model file missing
- Out of memory (model is ~50MB, needs 512MB+ RAM)
- GROQ_API_KEY missing

**Fix scikit-learn version**:
```txt
# In requirements.txt
scikit-learn==1.9.0
```

### OCR Service (Python/Flask)
**Port**: 8000  
**Start Command**: `python groq_ocr.py`  
**Build Command**: `pip install -r requirements.txt`

**Common issues**:
- GROQ_API_KEY missing
- Port 8000 not exposed
- Flask not binding to 0.0.0.0

**Fix port binding**:
```python
# In groq_ocr.py
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

## Check Render Logs

For each service:
1. Render Dashboard → Service → **Logs** tab
2. Look for errors (red text)
3. Common patterns:
   - `ModuleNotFoundError`: Missing dependency
   - `Address already in use`: Port conflict
   - `Out of memory`: Need more RAM
   - `Application startup failed`: Code error

## Budget Check

Render Free Tier Limits:
- **750 hours/month per service** (31.25 days if running 24/7)
- **512MB RAM** per service
- **Unlimited bandwidth**

Current usage (3 services running 24/7):
- 3 services × 720 hours = 2,160 hours/month
- **Exceeds free tier by 660 hours!**

**Solutions**:
1. **Upgrade 1 service** to paid ($7/month) - keeps other 2 free
2. **Combine services** - Run ML+OCR on one instance
3. **Use strategic monitoring** - Let services sleep, accept cold starts
4. **Deploy elsewhere** - Railway, Fly.io, Koyeb (more free tier hours)

## Alternative: Deploy to Railway

Railway offers:
- $5 free credit per month
- 500 hours execution time
- Better cold start times
- Same deployment process

## Next Steps

1. ✅ Go to Render Dashboard
2. ✅ Check each service status
3. ✅ Fix any errors in logs
4. ✅ Manually redeploy if needed
5. ✅ Test health endpoints
6. ✅ Set up UptimeRobot
7. ✅ Consider upgrading or moving services

## Update Frontend URLs (Already Done)

Your frontend (`triageApi.ts`) is already configured correctly:
```typescript
const API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'https://swasthya-connect-ml.onrender.com'
```

Once Render services are back up, your frontend will work automatically!

## Contact Support

If services won't start after trying everything:
- Render Support: support@render.com
- Check Render Status Page: https://status.render.com
