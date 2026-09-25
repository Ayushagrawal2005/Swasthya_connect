/**
 * Facility Portal Seed Data Script
 * Generates demo data for testing all modules
 * 
 * Run: node seed-facility.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function seedFacilityData() {
console.log('🚀 Starting Facility Portal Seed Data Generation...\n');

// ========== STEP 1: Create Facilities ==========
console.log('📍 Step 1: Creating Facilities...');

const facilities = [
  {
    id: 'FAC-001',
    name: 'PHC Sangamner',
    type: 'phc',
    address: 'Sangamner, Ahmednagar District, Maharashtra',
    geo: { lat: 19.5708, lng: 74.2115 },
    districtId: 'DIST-AHM',
    services: ['OPD', 'Lab', 'Pharmacy', 'Emergency'],
    testsOffered: ['Blood Test', 'Urine Test', 'ECG'],
    capacity: {
      beds: 30,
      doctors: 5,
      ambulances: 2
    },
    contact: {
      phone: '+91-9876543210',
      email: 'phc.sangamner@gov.in'
    }
  },
  {
    id: 'FAC-002',
    name: 'Rural Hospital Kopargaon',
    type: 'rural-hospital',
    address: 'Kopargaon, Ahmednagar District, Maharashtra',
    geo: { lat: 19.8825, lng: 74.4761 },
    districtId: 'DIST-AHM',
    services: ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Emergency', 'Surgery'],
    testsOffered: ['Blood Test', 'Urine Test', 'X-Ray', 'ECG', 'Ultrasound'],
    capacity: {
      beds: 100,
      doctors: 15,
      ambulances: 4
    },
    contact: {
      phone: '+91-9876543211',
      email: 'rh.kopargaon@gov.in'
    }
  },
  {
    id: 'FAC-003',
    name: 'District Hospital Ahmednagar',
    type: 'district-hospital',
    address: 'Ahmednagar City, Maharashtra',
    geo: { lat: 19.0948, lng: 74.7480 },
    districtId: 'DIST-AHM',
    services: ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Emergency', 'Surgery', 'ICU', 'NICU'],
    testsOffered: ['Blood Test', 'Urine Test', 'X-Ray', 'ECG', 'Ultrasound', 'CT Scan', 'MRI'],
    capacity: {
      beds: 300,
      doctors: 50,
      ambulances: 8
    },
    contact: {
      phone: '+91-9876543212',
      email: 'dh.ahmednagar@gov.in'
    }
  }
];

for (const facility of facilities) {
  await db.collection('facilities').doc(facility.id).set({
    ...facility,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  console.log(`✓ Created: ${facility.name}`);
}

// ========== STEP 2: Create Staff Users ==========
console.log('\n👥 Step 2: Creating Staff Users...');

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

for (const staff of staffMembers) {
  try {
    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(staff.email);
      console.log(`  User ${staff.email} already exists, updating...`);
    } catch (e) {
      firebaseUser = await auth.createUser({
        email: staff.email,
        password: staff.password,
        displayName: staff.name
      });
      console.log(`✓ Created Auth user: ${staff.name} (${staff.email})`);
    }

    // Set custom claims
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: staff.role,
      facilityId: staff.facilityId,
      districtId: staff.districtId || null
    });

    // Create staff record in Firestore (only if facility staff)
    if (staff.facilityId) {
      await db.collection(`facilities/${staff.facilityId}/staff`).doc(firebaseUser.uid).set({
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        active: true,
        onDutyToday: Math.random() > 0.3, // 70% on duty
        lastLogin: null,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'system'
      });
    }

    console.log(`✓ Staff: ${staff.name} - ${staff.role}`);
  } catch (error) {
    console.error(`✗ Error creating ${staff.email}:`, error.message);
  }
}

// ========== STEP 3: Seed Data for Each Module ==========

// QUEUE DATA
console.log('\n📋 Step 3: Creating Queue Entries...');
const triageColors = ['green', 'yellow', 'red'];
const departments = ['General', 'Pediatrics', 'Gynecology'];
for (let i = 0; i < 15; i++) {
  const facilityId = facilities[Math.floor(Math.random() * facilities.length)].id;
  await db.collection(`facilities/${facilityId}/queue`).add({
    tokenNumber: `T${String(i + 1).padStart(3, '0')}`,
    patientId: `PAT-${Math.floor(Math.random() * 1000)}`,
    patientName: `Patient ${i + 1}`,
    patientIdentifier: `ABHA-${Math.random().toString().slice(2, 14)}`,
    triageColour: triageColors[Math.floor(Math.random() * 3)],
    department: departments[Math.floor(Math.random() * 3)],
    doctorId: null,
    doctorName: null,
    status: i < 5 ? 'waiting' : (i < 8 ? 'in-consultation' : 'completed'),
    priority: i < 3 ? 1 : (i < 8 ? 2 : 3),
    manualPriorityOverride: false,
    overrideReason: null,
    createdAt: Timestamp.now(),
    calledAt: i >= 5 ? Timestamp.now() : null,
    completedAt: i >= 8 ? Timestamp.now() : null,
    waitTimeMinutes: Math.floor(Math.random() * 60),
    estimatedWaitMinutes: Math.floor(Math.random() * 30),
    notificationSent: false,
    source: 'walk-in',
    appointmentId: null
  });
}
console.log('✓ Created 15 queue entries across facilities');

// MEDICINE INVENTORY
console.log('\n💊 Step 4: Creating Medicine Inventory...');
const medicines = [
  { name: 'Paracetamol', strength: '500mg', form: 'Tablet', qty: 500, reorder: 100 },
  { name: 'Amoxicillin', strength: '250mg', form: 'Capsule', qty: 200, reorder: 50 },
  { name: 'Ibuprofen', strength: '400mg', form: 'Tablet', qty: 5, reorder: 100 }, // Low stock
  { name: 'Metformin', strength: '500mg', form: 'Tablet', qty: 0, reorder: 100 }, // Stock out
  { name: 'Aspirin', strength: '75mg', form: 'Tablet', qty: 350, reorder: 100 },
  { name: 'Omeprazole', strength: '20mg', form: 'Capsule', qty: 150, reorder: 50 },
  { name: 'Ciprofloxacin', strength: '500mg', form: 'Tablet', qty: 80, reorder: 50 },
  { name: 'Azithromycin', strength: '250mg', form: 'Tablet', qty: 120, reorder: 50 },
];

for (const facility of facilities) {
  for (const med of medicines) {
    const nearExpiry = Math.random() > 0.8;
    await db.collection(`facilities/${facility.id}/inventory`).add({
      genericName: med.name,
      strength: med.strength,
      form: med.form,
      batches: [{
        batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
        expiryDate: nearExpiry ? '2025-01-15' : '2026-12-31',
        quantity: med.qty
      }],
      totalQuantity: med.qty,
      reorderLevel: med.reorder,
      unit: 'units',
      category: 'essential',
      lastVerifiedAt: null,
      lastVerifiedBy: null,
      lowStock: med.qty > 0 && med.qty < med.reorder,
      stockOut: med.qty === 0,
      nearExpiry: nearExpiry ? [{
        batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
        daysUntilExpiry: 30
      }] : [],
      updatedAt: FieldValue.serverTimestamp()
    });
  }
}
console.log('✓ Created medicine inventory for all facilities');

// DIAGNOSTICS
console.log('\n🔬 Step 5: Creating Diagnostic Tests...');
const testTypes = ['blood', 'urine', 'xray', 'ecg'];
const testNames = ['CBC', 'Urine R/M', 'Chest X-Ray', 'ECG 12-Lead'];
for (let i = 0; i < 10; i++) {
  const facilityId = facilities[Math.floor(Math.random() * facilities.length)].id;
  const typeIdx = Math.floor(Math.random() * 4);
  await db.collection(`facilities/${facilityId}/diagnostics`).add({
    patientId: `PAT-${Math.floor(Math.random() * 1000)}`,
    patientName: `Patient ${i + 1}`,
    patientAge: 20 + Math.floor(Math.random() * 50),
    patientGender: Math.random() > 0.5 ? 'M' : 'F',
    testType: testTypes[typeIdx],
    testName: testNames[typeIdx],
    priority: i < 2 ? 'stat' : (i < 5 ? 'urgent' : 'routine'),
    status: i < 3 ? 'pending' : (i < 6 ? 'in-progress' : 'completed'),
    orderedBy: 'DOC-001',
    orderedByName: 'Dr. Singh',
    orderedAt: Timestamp.now(),
    createdAt: Timestamp.now()
  });
}
console.log('✓ Created 10 diagnostic tests');

// AMBULANCES
console.log('\n🚑 Step 6: Creating Ambulances...');
for (const facility of facilities) {
  const ambulanceCount = facility.capacity.ambulances;
  for (let i = 0; i < ambulanceCount; i++) {
    await db.collection(`facilities/${facility.id}/ambulances`).add({
      vehicleNumber: `MH-${Math.floor(Math.random() * 100)}-${String.fromCharCode(65 + i)}${Math.floor(Math.random() * 10000)}`,
      type: i % 2 === 0 ? 'bls' : 'als',
      driver: {
        name: `Driver ${i + 1}`,
        phone: `+91-900${i}`
      },
      status: i === 0 ? 'available' : (i === 1 ? 'dispatched' : 'available'),
      currentEmergencyId: null,
      lastLocation: null,
      maintenanceDue: null,
      facilityId: facility.id
    });
  }
}
console.log('✓ Created ambulances for all facilities');

// EMERGENCIES
console.log('\n🚨 Step 7: Creating Emergencies...');
for (let i = 0; i < 5; i++) {
  const facilityId = facilities[1 + Math.floor(Math.random() * 2)].id; // Rural or District hospital
  await db.collection('emergencies').add({
    patientId: `PAT-${Math.floor(Math.random() * 1000)}`,
    patientName: `Emergency Patient ${i + 1}`,
    patientAge: 25 + Math.floor(Math.random() * 40),
    patientGender: Math.random() > 0.5 ? 'M' : 'F',
    chiefComplaint: 'Severe chest pain and difficulty breathing',
    vitals: {
      heartRate: 90 + Math.floor(Math.random() * 30),
      bloodPressure: '140/90',
      temperature: 98 + Math.random() * 2,
      oxygenSaturation: 92 + Math.floor(Math.random() * 8)
    },
    location: {
      address: 'Village Road, Maharashtra',
      lat: 19.5 + Math.random(),
      lng: 74.2 + Math.random()
    },
    source: 'asha',
    sourceUserId: 'ASHA-001',
    aiGenerated: i < 2,
    confirmedByHuman: i >= 2,
    confirmedBy: i >= 2 ? 'USER-001' : null,
    confirmedAt: i >= 2 ? Timestamp.now() : null,
    downgraded: false,
    downgradeReason: null,
    status: i === 0 ? 'pending-confirmation' : (i < 3 ? 'confirmed' : 'dispatched'),
    assignedVehicleId: i >= 3 ? 'VEH-001' : null,
    assignedVehicleNumber: i >= 3 ? 'MH-12-AB-1234' : null,
    destinationFacilityId: facilityId,
    destinationFacilityName: facilities.find(f => f.id === facilityId)?.name || '',
    timeline: [],
    receivedAt: Timestamp.now(),
    dispatchedAt: i >= 3 ? Timestamp.now() : null,
    arrivedAt: null,
    handedOverAt: null,
    responseTimeMinutes: null
  });
}
console.log('✓ Created 5 emergencies');

// REFERRALS
console.log('\n🔄 Step 8: Creating Referrals...');
for (let i = 0; i < 8; i++) {
  const fromFacility = facilities[i % 2]; // PHC or Rural
  const toFacility = facilities[1 + (i % 2)]; // Rural or District
  await db.collection('referrals').add({
    fromFacilityId: fromFacility.id,
    fromFacilityName: fromFacility.name,
    toFacilityId: toFacility.id,
    toFacilityName: toFacility.name,
    patientId: `PAT-${Math.floor(Math.random() * 1000)}`,
    patientName: `Patient ${i + 1}`,
    patientAge: 30 + Math.floor(Math.random() * 40),
    patientGender: Math.random() > 0.5 ? 'M' : 'F',
    reason: 'Requires specialist consultation',
    clinicalSummary: 'Patient with suspected cardiac condition requiring cardiologist review',
    urgency: i < 2 ? 'emergency' : (i < 5 ? 'urgent' : 'routine'),
    status: i === 0 ? 'created' : (i < 3 ? 'accepted' : (i < 6 ? 'patient-arrived' : 'outcome')),
    rejectionReason: null,
    rejectionCategory: null,
    alternativeFacilities: null,
    acceptedBy: i >= 1 ? 'USER-002' : null,
    acceptedAt: i >= 1 ? Timestamp.now() : null,
    patientArrivedAt: i >= 3 ? Timestamp.now() : null,
    consultedAt: i >= 6 ? Timestamp.now() : null,
    outcome: null,
    stalled: i === 2, // One stalled referral
    stalledAt: i === 2 ? Timestamp.now() : null,
    stalledReason: i === 2 ? 'Patient has not arrived within 24 hours' : null,
    transportRequired: Math.random() > 0.5,
    ambulanceAssigned: null,
    createdBy: 'DOC-001',
    createdByName: 'Dr. Sharma',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    acceptanceDeadline: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    stallThreshold: 48
  });
}
console.log('✓ Created 8 referrals');

// ========== COMPLETION ==========
console.log('\n✅ Seed data generation complete!\n');
console.log('════════════════════════════════════════════════════════');
console.log('📝 LOGIN CREDENTIALS (Password for all: Demo@123)');
console.log('════════════════════════════════════════════════════════');
console.log('\n🏥 PHC Sangamner (FAC-001):');
console.log('  Admin:      admin1@facility.test');
console.log('  Queue Desk: queue1@facility.test');
console.log('  Lab Tech:   lab1@facility.test');
console.log('  Pharmacist: pharma1@facility.test');
console.log('\n🏥 Rural Hospital Kopargaon (FAC-002):');
console.log('  Admin:      admin2@facility.test');
console.log('  Queue Desk: queue2@facility.test');
console.log('  Lab Tech:   lab2@facility.test');
console.log('  Pharmacist: pharma2@facility.test');
console.log('  Ambulance:  ambulance1@facility.test');
console.log('\n🏥 District Hospital Ahmednagar (FAC-003):');
console.log('  Admin:      admin3@facility.test');
console.log('  Queue Desk: queue3@facility.test');
console.log('  Lab Tech:   lab3@facility.test');
console.log('  Pharmacist: pharma3@facility.test');
console.log('  Ambulance:  ambulance2@facility.test');
console.log('\n🏛️  District Officer:');
console.log('  District:   district@facility.test');
console.log('\n════════════════════════════════════════════════════════');
console.log('🚀 Start the app and login with any of the above credentials!');
console.log('════════════════════════════════════════════════════════\n');
}

seedFacilityData()
  .then(() => {
    console.log('Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
