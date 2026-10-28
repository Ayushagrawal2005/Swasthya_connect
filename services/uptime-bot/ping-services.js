/**
 * Uptime Bot for Swasthya Connect
 * Pings all Render services every 5 minutes to prevent cold starts
 * 
 * Usage:
 *   node ping-services.js
 * 
 * Or with PM2:
 *   pm2 start ping-services.js --name uptime-bot
 */

const https = require('https');

const SERVICES = [
  {
    name: 'Backend API',
    url: 'https://swasthya-connect-backend.onrender.com/health',
    timeout: 30000 // 30 seconds
  },
  {
    name: 'ML Service',
    url: 'https://swasthya-connect-ml-of1d.onrender.com/health',
    timeout: 60000 // 60 seconds (ML can be slower)
  },
  {
    name: 'OCR Service',
    url: 'https://swasthya-connect-ocr.onrender.com/health',
    timeout: 45000 // 45 seconds
  }
];

// Ping interval (5 minutes in milliseconds)
const PING_INTERVAL = 5 * 60 * 1000;

/**
 * Ping a service and return response time
 */
async function pingService(service) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(service.url, { timeout: service.timeout }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        const timestamp = new Date().toISOString();
        
        if (res.statusCode === 200) {
          console.log(`✅ [${timestamp}] ${service.name} - OK (${responseTime}ms)`);
          resolve({ success: true, responseTime, service: service.name });
        } else {
          console.log(`⚠️  [${timestamp}] ${service.name} - Status ${res.statusCode} (${responseTime}ms)`);
          resolve({ success: false, responseTime, service: service.name, status: res.statusCode });
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const timestamp = new Date().toISOString();
      console.log(`⏱️  [${timestamp}] ${service.name} - TIMEOUT (>${service.timeout}ms)`);
      resolve({ success: false, service: service.name, error: 'timeout' });
    });
    
    req.on('error', (err) => {
      const timestamp = new Date().toISOString();
      console.log(`❌ [${timestamp}] ${service.name} - ERROR: ${err.message}`);
      resolve({ success: false, service: service.name, error: err.message });
    });
  });
}

/**
 * Ping all services
 */
async function pingAllServices() {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 [${timestamp}] Pinging all services...`);
  console.log('━'.repeat(60));
  
  const results = await Promise.all(SERVICES.map(service => pingService(service)));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('━'.repeat(60));
  console.log(`📊 Summary: ${successful} OK, ${failed} Failed`);
  
  if (failed > 0) {
    console.log('⚠️  Some services are down or unreachable!');
  }
  
  return results;
}

/**
 * Main loop
 */
async function main() {
  console.log('🚀 Swasthya Connect Uptime Bot Started');
  console.log(`⏰ Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);
  console.log(`📡 Monitoring ${SERVICES.length} services:`);
  SERVICES.forEach(s => console.log(`   - ${s.name}: ${s.url}`));
  console.log('');
  
  // Initial ping
  await pingAllServices();
  
  // Set up interval
  setInterval(async () => {
    await pingAllServices();
  }, PING_INTERVAL);
  
  // Keep process alive
  console.log('\n✨ Bot is running... Press Ctrl+C to stop.');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Uptime bot stopped gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Uptime bot stopped gracefully');
  process.exit(0);
});

// Start the bot
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
