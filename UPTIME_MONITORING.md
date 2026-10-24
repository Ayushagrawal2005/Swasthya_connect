# Uptime Monitoring Setup for Swasthya Connect

## Problem
Render free tier spins down services after 15 minutes of inactivity, causing 30-90 second cold starts on the first request.

## Solution
Set up automated health checks to keep services awake by pinging them every 5-10 minutes.

## Services to Monitor

| Service | URL | Endpoint |
|---------|-----|----------|
| Backend API | https://swasthya-connect-backend.onrender.com | /health |
| ML Service | https://swasthya-connect-ml.onrender.com | /health |
| OCR Service | https://swasthya-connect-ocr.onrender.com | /health |

## Method 1: UptimeRobot (Recommended - Free & Easy)

### Setup Steps:
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up for a free account (allows 50 monitors)
3. Click "Add New Monitor"
4. Configure each service:

**Backend API Monitor**
- Monitor Type: HTTP(s)
- Friendly Name: Swasthya Backend
- URL: `https://swasthya-connect-backend.onrender.com/health`
- Monitoring Interval: 5 minutes (free tier minimum)
- Monitor Timeout: 30 seconds
- HTTP Method: GET
- Alert Contacts: Your email

**ML Service Monitor**
- Monitor Type: HTTP(s)
- Friendly Name: Swasthya ML
- URL: `https://swasthya-connect-ml.onrender.com/health`
- Monitoring Interval: 5 minutes
- Monitor Timeout: 30 seconds

**OCR Service Monitor**
- Monitor Type: HTTP(s)
- Friendly Name: Swasthya OCR
- URL: `https://swasthya-connect-ocr.onrender.com/health`
- Monitoring Interval: 5 minutes
- Monitor Timeout: 30 seconds

### Benefits:
- ✅ Free for up to 50 monitors
- ✅ 5-minute check intervals
- ✅ Email/SMS alerts on downtime
- ✅ Web dashboard with uptime stats
- ✅ No code needed

### Limitations:
- ⏱️ Services may still sleep for up to 5 minutes between pings
- 📊 Render free tier has 750 hours/month (31.25 days) - this keeps them awake 24/7

## Method 2: GitHub Actions (Free for Public Repos)

### Setup:
Create `.github/workflows/uptime-check.yml`:

```yaml
name: Keep Services Alive

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  ping-services:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl -f https://swasthya-connect-backend.onrender.com/health || exit 0
      
      - name: Ping ML Service
        run: curl -f https://swasthya-connect-ml.onrender.com/health || exit 0
      
      - name: Ping OCR Service
        run: curl -f https://swasthya-connect-ocr.onrender.com/health || exit 0
```

### Pros:
- ✅ Completely free for public repos
- ✅ No external service needed
- ✅ Runs automatically every 5 minutes

### Cons:
- ❌ Limited to public repositories
- ❌ GitHub Actions can be delayed
- ❌ Less reliable than dedicated monitoring services

## Method 3: Cron-Job.org (Alternative Free Service)

### Setup:
1. Go to [Cron-Job.org](https://cron-job.org)
2. Sign up (free, unlimited cron jobs)
3. Create a job for each service:
   - URL: Your health endpoint
   - Schedule: Every 5 minutes
   - Execution: HTTP GET

## Method 4: Self-Hosted Ping Script (Node.js)

We've included a simple script in `services/uptime-bot/ping-services.js` that you can run on any server with Node.js:

```bash
cd services/uptime-bot
npm install
node ping-services.js
```

Or run with PM2 for auto-restart:
```bash
npm install -g pm2
pm2 start ping-services.js --name uptime-bot
pm2 save
```

## Method 5: Render Cron Job (Paid Feature)

Render offers cron jobs on paid plans ($7/month) that can ping your services internally.

## Recommended Setup

**For Development/Demo:**
- Use **UptimeRobot** (easiest, no code)
- Set 5-minute intervals
- Monitor all 3 services

**For Production:**
- Use **UptimeRobot** or **Pingdom** (more features)
- Add alerting to Slack/Discord
- Set up status page for users
- Consider upgrading Render to prevent cold starts entirely

## Health Check Endpoints

All services have `/health` endpoints that return:

```json
{
  "status": "healthy",
  "timestamp": "2026-10-24T10:30:00.000Z",
  "service": "swasthya-connect-backend",
  "uptime": 3600.5
}
```

### Backend API
- URL: `https://swasthya-connect-backend.onrender.com/health`
- Port: 4000
- Response Time: < 500ms (when warm)

### ML Service
- URL: `https://swasthya-connect-ml.onrender.com/health`
- Port: 5000
- Response Time: < 1000ms (when warm)

### OCR Service
- URL: `https://swasthya-connect-ocr.onrender.com/health`
- Port: 8000
- Response Time: < 800ms (when warm)

## Monitoring Dashboard

After setup, you'll have:
- ✅ Real-time uptime percentage
- ✅ Response time graphs
- ✅ Incident timeline
- ✅ Email alerts on downtime
- ✅ Public status page (optional)

## Cost Analysis

### Render Free Tier
- 750 hours/month per service
- With 3 services running 24/7: 2,160 hours needed
- **Cost to keep all awake 24/7**: ~$21/month ($7 per service upgrade)

### Alternative: Strategic Monitoring
- Use UptimeRobot free tier (every 5 minutes)
- Services sleep maximum 5 minutes between pings
- **Cost**: $0
- **Trade-off**: Occasional 30-60s cold start if user hits during sleep window

## Quick Start (Recommended)

1. **Sign up to UptimeRobot** (2 minutes)
2. **Add 3 monitors** (3 minutes):
   - Backend: https://swasthya-connect-backend.onrender.com/health
   - ML: https://swasthya-connect-ml.onrender.com/health
   - OCR: https://swasthya-connect-ocr.onrender.com/health
3. **Set interval to 5 minutes**
4. **Done!** Services will stay warm

## Verification

Test that health checks work:

```bash
# Test backend
curl https://swasthya-connect-backend.onrender.com/health

# Test ML
curl https://swasthya-connect-ml.onrender.com/health

# Test OCR
curl https://swasthya-connect-ocr.onrender.com/health
```

All should return 200 OK with JSON response.

## Troubleshooting

### Service Still Sleeping
- Check UptimeRobot logs - is it actually pinging?
- Verify URL is correct (no trailing slash)
- Check Render logs for incoming requests
- Ensure health endpoint returns 200 status

### Too Many Requests
- Render free tier has no request limit on health checks
- UptimeRobot free tier: 50 monitors, 5-minute intervals = fine

### Service Down
- Check Render dashboard for errors
- View logs in Render console
- Check if deployment failed
- Verify environment variables are set

## Next Steps

1. Set up UptimeRobot monitors (recommended)
2. Optionally add GitHub Actions as backup
3. Configure email alerts
4. Share status page with team
5. Monitor for a week and adjust intervals if needed

## Status Page (Optional)

UptimeRobot provides a free public status page:
- Shows all services uptime
- Historical data
- Incident reports
- Custom domain support

Example: `https://status.yourapp.com`
