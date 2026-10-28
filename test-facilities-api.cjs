/**
 * Test Facilities API endpoint
 * Tests that facilities are now available through the backend
 */

const https = require('https');

const BACKEND_URL = 'https://swasthya-connect-backend.onrender.com';

// Demo credentials
const credentials = {
  username: 'priya@swasthya.in',
  password: 'demo1234'
};

console.log('🔐 Step 1: Logging in...');

// Login first to get token
const loginData = JSON.stringify(credentials);

const loginOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = https.request(BACKEND_URL + '/auth/login', loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('❌ Login failed:', res.statusCode, data);
      process.exit(1);
    }
    
    const response = JSON.parse(data);
    const token = response.token;
    
    console.log('✅ Login successful! Token received.');
    console.log(`   User: ${response.user.name} (${response.user.role})\n`);
    
    console.log('🏥 Step 2: Fetching facilities...');
    
    // Now fetch facilities with token
    const facilitiesOptions = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    https.get(BACKEND_URL + '/appointments/facilities', facilitiesOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('❌ Facilities fetch failed:', res.statusCode, data);
          process.exit(1);
        }
        
        const facilities = JSON.parse(data);
        console.log(`✅ Facilities fetched successfully! Found ${facilities.length} facilities:\n`);
        
        facilities.forEach((f, i) => {
          console.log(`${i + 1}. ${f.name} (${f.tier})`);
          console.log(`   Address: ${f.address}`);
          console.log(`   Phone: ${f.phone}`);
          console.log(`   Distance: ${f.distance}`);
          console.log(`   Doctors: ${f.doctors.length}`);
          f.doctors.forEach(d => {
            console.log(`      - ${d.name} (${d.specialty}) ${d.available ? '✓ Available' : '✗ Unavailable'} - ${d.slotsToday} slots`);
          });
          console.log('');
        });
        
        console.log('✅ Test complete! Appointment booking should now work.');
      });
    }).on('error', (err) => {
      console.error('❌ Error fetching facilities:', err);
      process.exit(1);
    });
  });
});

loginReq.on('error', (err) => {
  console.error('❌ Error during login:', err);
  process.exit(1);
});

loginReq.write(loginData);
loginReq.end();
