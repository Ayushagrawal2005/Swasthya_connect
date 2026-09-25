/**
 * Create Facility Portal Test Users
 * Run: npx tsx create-facility-users.ts
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();
const db = getFirestore();

const staffMembers = [
  // PHC Sangamner
  { email: 'admin1@facility.test', name: 'Dr. Amit Sharma', role: 'facility_admin', facilityId: 'FAC-001', phone: '+91-9001', password: 'Demo@123' },
  { email: 'queue1@facility.test', name: 'Sunita Patil', role: 'queue_desk', facilityId: 'FAC-001', phone: '+91-9002', password: 'Demo@123' },
  { email: 'lab1@facility.test', name: 'Rajesh Kumar', role: 'lab_technician', facilityId: 'FAC-001', phone: '+91-9003', password: 'Demo@123' },
  { email: 'pharma1@facility.test', name: 'Priya Deshmukh', role: 'pharmacist', facilityId: 'FAC-001', phone: '+91-9004', password: 'Demo@123' },
  
  // Rural Hospital Kopargaon
  { email: 'admin2@facility.test', name: 'Dr. Sneha Joshi', role: 'facility_admin', facilityId: 'FAC-002', phone: '+91-9005', password: 'Demo@123' },
  { email: 'queue2@facility.test', name: 'Ramesh Pawar', role: 'queue_desk', facilityId: 'FAC-002', phone: '+91-9006', password: 'Demo@123' },
  { email: 'lab2@facility.test', name: 'Kavita Singh', role: 'lab_technician', facilityId: 'FAC-002', phone: '+91-9007', password: 'Demo@123' },
  { email: 'pharma2@facility.test', name: 'Anil Yadav', role: 'pharmacist', facilityId: 'FAC-002', phone: '+91-9008', password: 'Demo@123' },
  { email: 'ambulance1@facility.test', name: 'Vijay Patil', role: 'ambulance_coordinator', facilityId: 'FAC-002', phone: '+91-9009', password: 'Demo@123' },
  
  // District Hospital
  { email: 'admin3@facility.test', name: 'Dr. Rohit Mehta', role: 'facility_admin', facilityId: 'FAC-003', phone: '+91-9010', password: 'Demo@123' },
  { email: 'queue3@facility.test', name: 'Geeta Kulkarni', role: 'queue_desk', facilityId: 'FAC-003', phone: '+91-9011', password: 'Demo@123' },
  { email: 'lab3@facility.test', name: 'Sachin More', role: 'lab_technician', facilityId: 'FAC-003', phone: '+91-9012', password: 'Demo@123' },
  { email: 'pharma3@facility.test', name: 'Madhuri Bhosale', role: 'pharmacist', facilityId: 'FAC-003', phone: '+91-9013', password: 'Demo@123' },
  { email: 'ambulance2@facility.test', name: 'Santosh Gaikwad', role: 'ambulance_coordinator', facilityId: 'FAC-003', phone: '+91-9014', password: 'Demo@123' },
  
  // District Officer
  { email: 'district@facility.test', name: 'Dr. Anjali Desai', role: 'district_officer', facilityId: null, districtId: 'DIST-AHM', phone: '+91-9015', password: 'Demo@123' }
];

async function createUsers() {
  console.log('🚀 Creating Facility Portal Users...\n');
  
  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  for (const staff of staffMembers) {
    try {
      let firebaseUser;
      let isNew = false;

      // Try to get existing user
      try {
        firebaseUser = await auth.getUserByEmail(staff.email);
        console.log(`📝 User exists: ${staff.email}`);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          // Create new user
          firebaseUser = await auth.createUser({
            email: staff.email,
            password: staff.password,
            displayName: staff.name
          });
          isNew = true;
          console.log(`✅ Created: ${staff.name} (${staff.email})`);
          successCount++;
        } else {
          throw e;
        }
      }

      // Set custom claims (for both new and existing users)
      await auth.setCustomUserClaims(firebaseUser.uid, {
        role: staff.role,
        facilityId: staff.facilityId,
        districtId: staff.districtId || null
      });

      if (!isNew) {
        console.log(`   ✓ Updated claims: ${staff.role}`);
        updateCount++;
      } else {
        console.log(`   ✓ Set claims: ${staff.role}`);
      }

      // Create/update staff record in Firestore (only if facility staff)
      if (staff.facilityId) {
        await db.collection(`facilities/${staff.facilityId}/staff`).doc(firebaseUser.uid).set({
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          active: true,
          onDutyToday: true,
          lastLogin: null,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: 'system'
        }, { merge: true });
        console.log(`   ✓ Firestore record updated\n`);
      } else {
        console.log('');
      }

    } catch (error: any) {
      console.error(`❌ Error with ${staff.email}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   ✅ New users created: ${successCount}`);
  console.log(`   📝 Existing users updated: ${updateCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('════════════════════════════════════════════════════════\n');

  if (successCount + updateCount > 0) {
    console.log('🎉 Success! You can now login with these credentials:\n');
    console.log('📝 LOGIN CREDENTIALS (Password for all: Demo@123)');
    console.log('════════════════════════════════════════════════════════\n');
    console.log('🏥 PHC Sangamner (FAC-001):');
    console.log('  Admin:      admin1@facility.test');
    console.log('  Queue Desk: queue1@facility.test');
    console.log('  Lab Tech:   lab1@facility.test');
    console.log('  Pharmacist: pharma1@facility.test\n');
    console.log('🏥 Rural Hospital Kopargaon (FAC-002):');
    console.log('  Admin:      admin2@facility.test');
    console.log('  Queue Desk: queue2@facility.test');
    console.log('  Lab Tech:   lab2@facility.test');
    console.log('  Pharmacist: pharma2@facility.test');
    console.log('  Ambulance:  ambulance1@facility.test\n');
    console.log('🏥 District Hospital Ahmednagar (FAC-003):');
    console.log('  Admin:      admin3@facility.test');
    console.log('  Queue Desk: queue3@facility.test');
    console.log('  Lab Tech:   lab3@facility.test');
    console.log('  Pharmacist: pharma3@facility.test');
    console.log('  Ambulance:  ambulance2@facility.test\n');
    console.log('🏛️  District Officer:');
    console.log('  District:   district@facility.test\n');
    console.log('════════════════════════════════════════════════════════');
    console.log('🌐 Access the Facility Portal at:');
    console.log('   http://localhost:5173/facility/login');
    console.log('════════════════════════════════════════════════════════\n');
  }
}

createUsers()
  .then(() => {
    console.log('✨ Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
