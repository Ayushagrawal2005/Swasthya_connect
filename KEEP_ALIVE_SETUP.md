# Keep Render Backend Alive - UptimeRobot Setup

## Problem
Render free tier puts inactive services to sleep after 15 minutes, causing:
- ❌ 60-90 second cold start delays
- ❌ Poor demo experience
- ❌ Timeout errors on first request

## Solution
Use **UptimeRobot** (free service) to ping your backend every 5 minutes, keeping it warm.

---

## ✅ Step-by-Step Setup

### 1. Deploy Backend to Render (if not already)

Your backend is already deployed at: **https://swasthya-connect-backend.onrender.com**

Test the health endpoint:
```bash
curl https://swasthya-connect-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-22T10:30:00.000Z",
  "service": "swasthya-connect-backend",
  "uptime": 1234.56
}
```

---

### 2. Create UptimeRobot Account

1. Go to: **https://uptimerobot.com/**
2. Click **"Sign Up Free"**
3. Enter your email and create password
4. Verify your email

**Free Plan includes:**
- ✅ 50 monitors
- ✅ 5-minute check intervals
- ✅ Email alerts
- ✅ No credit card required

---

### 3. Create Monitor for Backend

1. **Login to UptimeRobot Dashboard**

2. **Click "+ Add New Monitor"**

3. **Configure Monitor:**
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Swasthya Backend Keep-Alive`
   - **URL (or IP):** `https://swasthya-connect-1x6r.onrender.com/health`
   - **Monitoring Interval:** `5 minutes` (default)
   - **Monitor Timeout:** `30 seconds`
   - **HTTP Method:** `GET` (important!)

4. **Click "Create Monitor"**

---

### 4. Optional: Add ML & OCR Services

If you also have ML and OCR services on Render, add monitors for them too:

**ML Service Monitor:**
- URL: `https://swasthya-connect-ml.onrender.com/health`
- Name: `Swasthya ML Keep-Alive`
- HTTP Method: `GET`

**OCR Service Monitor:**
- URL: `https://swasthya-connect-ocr.onrender.com/health`
- Name: `Swasthya OCR Keep-Alive`
- HTTP Method: `GET`

**⚠️ Important:** Make sure to select **GET** method, not HEAD, as FastAPI/Flask endpoints require GET.

---

### 5. Verify It's Working

**Check UptimeRobot Dashboard:**
- Status should show: ✅ **Up**
- Response time: ~200-500ms
- Uptime: 100%

**Check Render Logs:**
1. Go to your Render dashboard
2. Open your backend service
3. Click "Logs"
4. You should see health check requests every 5 minutes:

```
GET /health 200 - 12.345 ms
GET /health 200 - 11.234 ms
```

---

## 📊 Expected Results

### Before UptimeRobot:
- First request: **60-90 seconds** (cold start)
- Subsequent requests: Fast
- Inactive after 15 min: Service sleeps again

### After UptimeRobot:
- **ALL requests: Fast** (1-2 seconds max)
- No cold starts during demo
- Service stays warm 24/7

---

## 🎯 For Your Demo

1. **Set up monitors at least 1 hour before demo**
2. **Test your frontend login** - should be fast
3. **Keep UptimeRobot dashboard open** during demo to show monitoring

---

## Alternative: cron-job.org

If you prefer another service:

1. Go to: **https://cron-job.org/en/**
2. Create free account
3. Add cron job:
   - URL: `https://swasthya-connect-backend.onrender.com/health`
   - Interval: `*/5 * * * *` (every 5 minutes)

---

## Troubleshooting

### Monitor shows "Down"
- Check if Render service is running
- Verify the health endpoint URL is correct
- Check Render logs for errors

### Still experiencing delays
- Verify monitor interval is 5 minutes (not longer)
- Check if Render service restarted recently
- Wait 30 minutes for service to stabilize

### Multiple monitors needed
- Backend API: Most important (keeps data access fast)
- ML Service: Only if doing triage predictions
- OCR Service: Only if uploading medical records

---

## 💰 Cost: $0

- ✅ UptimeRobot: Free (50 monitors)
- ✅ Render: Free tier
- ✅ No credit card required
- ✅ Perfect for hackathon demos

---

## Summary

✅ Health endpoint added to backend  
✅ UptimeRobot pings every 5 minutes  
✅ Render stays warm  
✅ No more cold starts  
✅ Fast demo experience  

**Demo-ready backend with zero cost!** 🚀
