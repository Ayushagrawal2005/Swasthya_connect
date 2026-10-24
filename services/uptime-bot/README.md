# Swasthya Connect Uptime Bot

Simple Node.js bot that pings all Render services every 5 minutes to prevent cold starts.

## Installation

```bash
cd services/uptime-bot
npm install
```

(Note: No dependencies needed - uses built-in Node.js `https` module)

## Usage

### Run Directly
```bash
node ping-services.js
```

### Run with PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
npm run pm2

# View logs
npm run pm2:logs

# Stop the bot
npm run pm2:stop

# Restart the bot
npm run pm2:restart
```

### Run as Background Process (Linux/Mac)
```bash
nohup node ping-services.js > uptime.log 2>&1 &
```

### Run with Docker
```bash
docker build -t uptime-bot .
docker run -d --name swasthya-uptime --restart unless-stopped uptime-bot
```

## Configuration

Edit `ping-services.js` to modify:

- **SERVICES**: Add/remove services to monitor
- **PING_INTERVAL**: Change ping frequency (default: 5 minutes)
- **timeout**: Adjust timeout per service (default: 30-60 seconds)

```javascript
const SERVICES = [
  {
    name: 'Backend API',
    url: 'https://swasthya-connect-backend.onrender.com/health',
    timeout: 30000
  },
  // Add more services here
];

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
```

## Output

The bot logs all pings to console:

```
🚀 Swasthya Connect Uptime Bot Started
⏰ Ping interval: 5 minutes
📡 Monitoring 3 services:
   - Backend API: https://swasthya-connect-backend.onrender.com/health
   - ML Service: https://swasthya-connect-ml.onrender.com/health
   - OCR Service: https://swasthya-connect-ocr.onrender.com/health

🔄 [2026-10-24T10:30:00.000Z] Pinging all services...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [2026-10-24T10:30:01.234Z] Backend API - OK (1234ms)
✅ [2026-10-24T10:30:02.456Z] ML Service - OK (2456ms)
✅ [2026-10-24T10:30:03.789Z] OCR Service - OK (3789ms)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary: 3 OK, 0 Failed
```

## Monitoring Services

The bot pings these endpoints:

1. **Backend API**: `https://swasthya-connect-backend.onrender.com/health`
2. **ML Service**: `https://swasthya-connect-ml.onrender.com/health`
3. **OCR Service**: `https://swasthya-connect-ocr.onrender.com/health`

Each endpoint returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-24T10:30:00.000Z",
  "service": "swasthya-connect-backend",
  "uptime": 3600.5
}
```

## Deployment Options

### 1. Run on Your Local Machine
- Simplest option
- Requires computer to be on 24/7
- Free

### 2. Run on Always-Free Cloud VM
- Oracle Cloud, AWS Free Tier, Google Cloud Free Tier
- 24/7 uptime
- Free

### 3. Run on Raspberry Pi
- One-time hardware cost (~$35)
- Very low power consumption
- Can run 24/7 at home

### 4. Use External Service (Recommended)
Instead of running this script, use a free monitoring service:
- **UptimeRobot** (recommended)
- **Cron-Job.org**
- **Pingdom** (paid)

See `UPTIME_MONITORING.md` in project root for details.

## Troubleshooting

### Services Not Responding
- Check Render dashboard for service status
- Verify URLs are correct
- Check Render logs for errors

### Bot Keeps Stopping
- Use PM2 for auto-restart on crashes
- Check system resources (RAM, CPU)
- Review error logs

### High Response Times
- Normal for cold starts (30-90 seconds)
- After first ping, should be < 2 seconds
- ML service can be slower (5-10 seconds)

## Why This Works

Render free tier spins down services after 15 minutes of inactivity. By pinging every 5 minutes:

1. Services never reach 15-minute idle timeout
2. They stay "warm" and respond instantly
3. Users never experience cold start delays

**Trade-off**: Render free tier has 750 hours/month per service. Running 24/7 = ~720 hours, so you'll stay within limits.

## License

MIT
