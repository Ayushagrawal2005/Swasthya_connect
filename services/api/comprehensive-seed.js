/**
 * Comprehensive Seed Script for Swasthya Connect
 * Populates all Firebase collections with demo data for showcasing
 * 
 * Run: node comprehensive-seed.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to create dates
const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

async function comprehensiveSeed() {
  console.log('🌱 Starting comprehensive seed for Swasthya Connect...\n');

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. CREATE PATIENTS
    // ═══════════════════════════════════════════════════════════════
    console.log('👥 Creating patients...');

    const patients = [
      {
        healthId: '91-1234-5678-9001',
        name: 'Priya Sharma',
        age: 32,
        gender: 'F',
        dob: '1992-03-15',
        village: 'Beed',
        phone: '9876543210',
        language: 'hi',
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
        conditions: ['Anemia', 'Pregnancy'],
        diseaseHistory: [],
        medications: [
          { drug: 'Iron + Folic Acid', dose: '100mg', frequency: 'Daily', since: daysAgo(30), prescribedBy: 'Dr. Ramesh Patil', status: 'active', source: 'prescription' }
        ],
        noShowCount: 0,
        totalFollowUps: 2,
        distanceKmFromPHC: 5.2,
        registeredBy: 'asha@swasthya.in',
        createdAt: daysAgo(90)
      },
      {
        healthId: '91-1234-5678-9002',
        name: 'Rajesh Patil',
        age: 35,
        gender: 'M',
        dob: '1989-07-22',
        village: 'Beed',
        phone: '9876543211',
        language: 'mr',
        bloodGroup: 'O+',
        allergies: [],
        conditions: ['Hypertension'],
        diseaseHistory: [],
        medications: [
          { drug: 'Amlodipine', dose: '5mg', frequency: 'Daily', since: daysAgo(60), prescribedBy: 'Dr. Ramesh Patil', status: 'active', source: 'prescription' }
        ],
        noShowCount: 0,
        totalFollowUps: 1,
        distanceKmFromPHC: 3.8,
        registeredBy: 'asha@swasthya.in',
        createdAt: daysAgo(120)
      },
      {
        healthId: '91-1234-5678-9003',
        name: 'Rajesh Kumar',
        age: 45,
        gender: 'M',
        dob: '1979-11-10',
        village: 'Mandav',
        phone: '9876543212',
        language: 'hi',
        bloodGroup: 'A+',
        allergies: [],
        conditions: ['Diabetes Type 2'],
        diseaseHistory: [],
        medications: [
          { drug: 'Metformin', dose: '500mg', frequency: 'Twice daily', since: daysAgo(180), prescribedBy: 'Dr. Ramesh Patil', status: 'active', source: 'prescription' }
        ],
        noShowCount: 1,
        totalFollowUps: 3,
        distanceKmFromPHC: 8.5,
        registeredBy: 'asha@swasthya.in',
        createdAt: daysAgo(200)
      },
      {
        healthId: '91-1234-5678-9004',
        name: 'Sunita Deshmukh',
        age: 28,
        gender: 'F',
        dob: '1996-04-18',
        village: 'Mandav',
        phone: '9876543213',
        language: 'mr',
        bloodGroup: 'B-',
        allergies: ['Sulfa drugs'],
        conditions: [],
        diseaseHistory: [],
        medications: [],
        noShowCount: 0,
        totalFollowUps: 0,
        distanceKmFromPHC: 4.2,
        registeredBy: 'asha@swasthya.in',
        createdAt: daysAgo(45)
      },
      {
        healthId: '91-1234-5678-9005',
        name: 'Amit Singh',
        age: 22,
        gender: 'M',
        dob: '2002-09-05',
        village: 'Beed',
        phone: '9876543214',
        language: 'hi',
        bloodGroup: 'O-',
        allergies: [],
        conditions: [],
        diseaseHistory: [],
        medications: [],
        noShowCount: 0,
        totalFollowUps: 0,
        distanceKmFromPHC: 6.1,
        registeredBy: 'asha@swasthya.in',
        createdAt: daysAgo(15)
      }
    ];

    const patientRefs = {};
    for (const patient of patients) {
      const ref = await db.collection('patients').add(patient);
      patientRefs[patient.healthId] = ref.id;
      console.log(`  ✅ ${patient.name} (${patient.gender}, ${patient.age}y)`);
    }
    
    // DEBUG: Log patientRefs to verify mapping
    console.log('\n📝 Patient ID mapping:');
    for (const [healthId, docId] of Object.entries(patientRefs)) {
      console.log(`  ${healthId} → ${docId}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. CREATE USER ACCOUNTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔐 Creating user accounts...');

    const users = [
      // Staff
      { 
        username: 'asha@swasthya.in', 
        email: 'asha@swasthya.in',
        password: 'demo1234', 
        role: 'asha', 
        name: 'ANM Kavita Shinde',
        phone: '9876543210',
        village: 'Mandav',
        facilityId: 'F001'
      },
      { 
        username: 'doctor@swasthya.in', 
        email: 'doctor@swasthya.in',
        password: 'demo1234', 
        role: 'doctor', 
        name: 'Dr. Ramesh Patil',
        phone: '9876543220',
        specialty: 'General Medicine',
        facilityId: 'F002'
      },
      { 
        username: 'admin@swasthya.in', 
        email: 'admin@swasthya.in',
        password: 'demo1234', 
        role: 'admin', 
        name: 'Admin Ravi Bhosale',
        phone: '9876543230',
        facilityId: 'F004'
      },
      // Patients
      { 
        username: 'priya@swasthya.in', 
        email: 'priya@swasthya.in',
        password: 'demo1234', 
        role: 'patient', 
        name: 'Priya Sharma',
        phone: '9876543210',
        patientId: patientRefs['91-1234-5678-9001'],
        facilityId: 'patient-portal'
      },
      { 
        username: 'rajesh@swasthya.in', 
        email: 'rajesh@swasthya.in',
        password: 'demo1234', 
        role: 'patient', 
        name: 'Rajesh Patil',
        phone: '9876543211',
        patientId: patientRefs['91-1234-5678-9002'],
        facilityId: 'patient-portal'
      }
    ];

    for (const user of users) {
      const userDoc = {
        ...user,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await db.collection('users').add(userDoc);
      console.log(`  ✅ ${user.name} (${user.role})${user.patientId ? ` [Patient ID: ${user.patientId}]` : ''}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. CREATE APPOINTMENTS (Doctor Queue)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📅 Creating appointments (doctor queue)...');

    const appointments = [
      {
        patientId: patientRefs['91-1234-5678-9003'],
        patientName: 'Rajesh Kumar',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        doctorId: 'doctor@swasthya.in',
        doctorName: 'Dr. Ramesh Patil',
        bookedBy: 'asha@swasthya.in',
        date: new Date().toISOString().split('T')[0],
        time: '09:30 AM',
        type: 'consultation',
        status: 'scheduled',
        queuePosition: 1,
        estimatedWait: 15,
        token: 'T001',
        createdAt: daysAgo(1)
      },
      {
        patientId: patientRefs['91-1234-5678-9001'],
        patientName: 'Priya Sharma',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        doctorId: 'doctor@swasthya.in',
        doctorName: 'Dr. Ramesh Patil',
        bookedBy: 'asha@swasthya.in',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        type: 'anc_checkup',
        status: 'scheduled',
        queuePosition: 2,
        estimatedWait: 45,
        token: 'T002',
        createdAt: daysAgo(2)
      },
      {
        patientId: patientRefs['91-1234-5678-9004'],
        patientName: 'Sunita Deshmukh',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        doctorId: 'doctor@swasthya.in',
        doctorName: 'Dr. Ramesh Patil',
        bookedBy: 'patient',
        date: new Date().toISOString().split('T')[0],
        time: '11:00 AM',
        type: 'consultation',
        status: 'scheduled',
        queuePosition: 3,
        estimatedWait: 75,
        token: 'T003',
        createdAt: daysAgo(1)
      },
      {
        patientId: patientRefs['91-1234-5678-9002'],
        patientName: 'Rajesh Patil',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        doctorId: 'doctor@swasthya.in',
        doctorName: 'Dr. Ramesh Patil',
        bookedBy: 'patient',
        date: daysFromNow(2).split('T')[0],
        time: '09:00 AM',
        type: 'followup',
        status: 'scheduled',
        queuePosition: null,
        estimatedWait: null,
        token: 'T104',
        createdAt: daysAgo(1)
      }
    ];

    for (const appt of appointments) {
      await db.collection('appointments').add(appt);
      console.log(`  ✅ ${appt.patientName} - ${appt.date} ${appt.time} (Token: ${appt.token})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CREATE FOLLOW-UPS (ASHA & Doctor Portal)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n⏰ Creating follow-ups...');

    const followups = [
      {
        patientId: patientRefs['91-1234-5678-9003'],
        patientName: 'Rajesh Kumar',
        age: 45,
        phone: '9876543212',
        condition: 'Diabetes Type 2 - Blood sugar monitoring',
        risk: 'high',
        dueDate: daysFromNow(3).split('T')[0],
        status: 'pending',
        notes: 'Check fasting blood sugar levels. Patient missed last appointment.',
        lastVisit: daysAgo(45).split('T')[0],
        nextStep: 'Blood test + doctor consultation',
        assignedTo: 'asha@swasthya.in',
        assignedToName: 'ANM Kavita Shinde',
        sourcePortal: 'doctor',
        sourceId: 'doctor@swasthya.in',
        createdAt: daysAgo(10)
      },
      {
        patientId: patientRefs['91-1234-5678-9001'],
        patientName: 'Priya Sharma',
        age: 32,
        phone: '9876543210',
        condition: 'Pregnancy - ANC Visit',
        risk: 'medium',
        dueDate: daysFromNow(1).split('T')[0],
        status: 'pending',
        notes: 'Second trimester checkup. Check hemoglobin levels.',
        lastVisit: daysAgo(30).split('T')[0],
        nextStep: 'ANC checkup + iron supplement refill',
        assignedTo: 'asha@swasthya.in',
        assignedToName: 'ANM Kavita Shinde',
        sourcePortal: 'asha',
        sourceId: 'asha@swasthya.in',
        createdAt: daysAgo(5)
      },
      {
        patientId: patientRefs['91-1234-5678-9002'],
        patientName: 'Rajesh Patil',
        age: 35,
        phone: '9876543211',
        condition: 'Hypertension - BP monitoring',
        risk: 'medium',
        dueDate: daysFromNow(7).split('T')[0],
        status: 'pending',
        notes: 'Monthly BP check. Patient on Amlodipine 5mg.',
        lastVisit: daysAgo(25).split('T')[0],
        nextStep: 'BP measurement + medication review',
        assignedTo: 'asha@swasthya.in',
        assignedToName: 'ANM Kavita Shinde',
        sourcePortal: 'doctor',
        sourceId: 'doctor@swasthya.in',
        createdAt: daysAgo(3)
      }
    ];

    for (const followup of followups) {
      await db.collection('followups').add(followup);
      console.log(`  ✅ ${followup.patientName} - ${followup.condition} (Due: ${followup.dueDate})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CREATE REFERRALS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📤 Creating referrals...');

    const referrals = [
      {
        patientId: patientRefs['91-1234-5678-9003'],
        patientName: 'Rajesh Kumar',
        fromFacilityId: 'F001',
        fromFacilityName: 'PHC Beed',
        toFacilityId: 'F003',
        toFacilityName: 'CHC Osmanabad',
        reason: 'Uncontrolled diabetes - specialist consultation needed',
        urgency: 'urgent',
        status: 'pending',
        createdBy: 'doctor@swasthya.in',
        createdByName: 'Dr. Ramesh Patil',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        patientId: patientRefs['91-1234-5678-9004'],
        patientName: 'Sunita Deshmukh',
        fromFacilityId: 'F001',
        fromFacilityName: 'PHC Beed',
        toFacilityId: 'F002',
        toFacilityName: 'PHC Mandav',
        reason: 'Suspected appendicitis - urgent evaluation',
        urgency: 'emergency',
        status: 'accepted',
        createdBy: 'asha@swasthya.in',
        createdByName: 'ANM Kavita Shinde',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      }
    ];

    for (const referral of referrals) {
      await db.collection('referrals').add(referral);
      console.log(`  ✅ ${referral.patientName} → ${referral.toFacilityName} (${referral.urgency})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CREATE INVENTORY (Admin Portal)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 Creating inventory items...');

    const inventory = [
      { facilityId: 'F002', name: 'Paracetamol 500mg', category: 'Medicine', current: 45, threshold: 100, unit: 'strips', lastRestocked: daysAgo(15), critical: true },
      { facilityId: 'F002', name: 'Iron + Folic Acid', category: 'Medicine', current: 250, threshold: 200, unit: 'strips', lastRestocked: daysAgo(5), critical: false },
      { facilityId: 'F002', name: 'ORS Sachets', category: 'Medicine', current: 85, threshold: 150, unit: 'sachets', lastRestocked: daysAgo(20), critical: true },
      { facilityId: 'F002', name: 'Amlodipine 5mg', category: 'Medicine', current: 180, threshold: 100, unit: 'strips', lastRestocked: daysAgo(10), critical: false },
      { facilityId: 'F002', name: 'Metformin 500mg', category: 'Medicine', current: 320, threshold: 200, unit: 'strips', lastRestocked: daysAgo(7), critical: false },
      { facilityId: 'F002', name: 'Disposable Syringes', category: 'Supplies', current: 55, threshold: 200, unit: 'pieces', lastRestocked: daysAgo(25), critical: true },
      { facilityId: 'F002', name: 'Gloves (Latex)', category: 'Supplies', current: 450, threshold: 300, unit: 'pairs', lastRestocked: daysAgo(3), critical: false },
      { facilityId: 'F002', name: 'Blood Sugar Test Strips', category: 'Diagnostic', current: 120, threshold: 150, unit: 'strips', lastRestocked: daysAgo(12), critical: true }
    ];

    for (const item of inventory) {
      await db.collection('inventory').add(item);
      console.log(`  ✅ ${item.name} - ${item.current}/${item.threshold} ${item.unit}${item.critical ? ' ⚠️' : ''}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. CREATE DIAGNOSTIC ORDERS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔬 Creating diagnostic orders...');

    const diagnostics = [
      {
        patientId: patientRefs['91-1234-5678-9003'],
        patientName: 'Rajesh Kumar',
        test: 'HbA1c Test',
        orderedBy: 'doctor@swasthya.in',
        orderedByName: 'Dr. Ramesh Patil',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        date: daysAgo(1),
        status: 'pending',
        available: true,
        result: null,
        flagged: false
      },
      {
        patientId: patientRefs['91-1234-5678-9001'],
        patientName: 'Priya Sharma',
        test: 'Complete Blood Count (CBC)',
        orderedBy: 'doctor@swasthya.in',
        orderedByName: 'Dr. Ramesh Patil',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        date: daysAgo(3),
        status: 'completed',
        available: true,
        result: 'Hemoglobin: 10.8 g/dL (Low)',
        flagged: true
      },
      {
        patientId: patientRefs['91-1234-5678-9002'],
        patientName: 'Rajesh Patil',
        test: 'Lipid Profile',
        orderedBy: 'doctor@swasthya.in',
        orderedByName: 'Dr. Ramesh Patil',
        facilityId: 'F002',
        facilityName: 'PHC Beed',
        date: daysAgo(5),
        status: 'completed',
        available: true,
        result: 'Total Cholesterol: 195 mg/dL (Normal)',
        flagged: false
      }
    ];

    for (const diag of diagnostics) {
      await db.collection('diagnostics').add(diag);
      console.log(`  ✅ ${diag.patientName} - ${diag.test} (${diag.status})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. CREATE FAMILY MEMBERS (For Priya)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👨‍👩‍👧‍👦 Creating family members...');

    const familyMembers = [
      {
        guardianPatientId: patientRefs['91-1234-5678-9001'],
        name: 'Aarav Sharma',
        relationship: 'child',
        gender: 'M',
        dob: '2018-09-10',
        age: 6,
        bloodGroup: 'B+',
        allergies: [],
        createdAt: daysAgo(90)
      },
      {
        guardianPatientId: patientRefs['91-1234-5678-9001'],
        name: 'Diya Sharma',
        relationship: 'child',
        gender: 'F',
        dob: '2020-05-20',
        age: 4,
        bloodGroup: 'O+',
        allergies: [],
        createdAt: daysAgo(90)
      }
    ];

    const familyMemberRefs = {};
    for (const member of familyMembers) {
      const ref = await db.collection('family_members').add(member);
      familyMemberRefs[member.name] = ref.id;
      console.log(`  ✅ ${member.name} (${member.relationship}, ${member.age}y)`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. CREATE MENSTRUAL CYCLES (For Priya)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🩸 Creating menstrual cycles...');

    const cycles = [
      {
        patientId: patientRefs['91-1234-5678-9001'],
        startDate: daysAgo(33).split('T')[0],
        endDate: daysAgo(28).split('T')[0],
        cycleLength: 28,
        flowIntensity: 'moderate',
        symptoms: ['cramps', 'mood swings'],
        notes: 'Normal cycle',
        createdAt: daysAgo(33)
      },
      {
        patientId: patientRefs['91-1234-5678-9001'],
        startDate: daysAgo(61).split('T')[0],
        endDate: daysAgo(56).split('T')[0],
        cycleLength: 29,
        flowIntensity: 'heavy',
        symptoms: ['cramps', 'headache', 'fatigue'],
        notes: 'Slightly heavier flow',
        createdAt: daysAgo(61)
      }
    ];

    for (const cycle of cycles) {
      await db.collection('menstrual_cycles').add(cycle);
      console.log(`  ✅ Cycle: ${cycle.startDate} to ${cycle.endDate} (${cycle.flowIntensity})`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 10. CREATE VACCINATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n💉 Creating vaccinations...');

    const vaccinations = [
      {
        patientId: patientRefs['91-1234-5678-9001'],
        familyMemberId: null, // For parent (Priya herself)
        vaccineName: 'Tetanus Toxoid',
        scheduledDate: daysAgo(10).split('T')[0],
        administeredDate: daysAgo(10).split('T')[0],
        dueDate: daysAgo(10).split('T')[0],
        status: 'completed',
        administeredBy: 'ANM Kavita Shinde',
        notes: 'Annual booster',
        createdAt: daysAgo(10)
      },
      {
        patientId: null,
        familyMemberId: familyMemberRefs['Aarav Sharma'], // For child 1
        vaccineName: 'MMR Vaccine',
        scheduledDate: daysAgo(20).split('T')[0],
        administeredDate: daysAgo(20).split('T')[0],
        dueDate: daysAgo(20).split('T')[0],
        status: 'completed',
        administeredBy: 'Dr. Ramesh Patil',
        notes: 'No side effects observed',
        createdAt: daysAgo(20)
      },
      {
        patientId: null,
        familyMemberId: familyMemberRefs['Diya Sharma'], // For child 2
        vaccineName: 'DTP Booster',
        scheduledDate: daysFromNow(7).split('T')[0],
        dueDate: daysFromNow(7).split('T')[0],
        status: 'upcoming',
        notes: 'Due next week',
        createdAt: daysAgo(5)
      }
    ];

    for (const vax of vaccinations) {
      await db.collection('vaccinations').add(vax);
      console.log(`  ✅ ${vax.vaccineName} - ${vax.status}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 11. CREATE CHRONIC CARE PATIENTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Creating chronic care records...');

    const chronicPatients = [
      {
        patientId: patientRefs['91-1234-5678-9003'],
        name: 'Rajesh Kumar',
        age: 45,
        gender: 'M',
        village: 'Mandav',
        phone: '9876543212',
        worker: 'ANM Kavita Shinde',
        condition: 'diabetes',
        conditionLabel: 'Diabetes Type 2',
        since: daysAgo(180).split('T')[0],
        progressionStatus: 'stable',
        alertLevel: 'medium',
        readings: [
          { date: daysAgo(7).split('T')[0], value: '145 mg/dL', numeric: 145, note: 'Fasting', recordedBy: 'asha@swasthya.in' },
          { date: daysAgo(14).split('T')[0], value: '138 mg/dL', numeric: 138, note: 'Fasting', recordedBy: 'asha@swasthya.in' },
          { date: daysAgo(21).split('T')[0], value: '152 mg/dL', numeric: 152, note: 'Fasting', recordedBy: 'asha@swasthya.in' }
        ],
        checkups: [],
        alerts: [],
        medications: ['Metformin 500mg twice daily'],
        missedCheckups: 1,
        totalCheckups: 6,
        lastContactDate: daysAgo(7).split('T')[0],
        nextCheckupDate: daysFromNow(14).split('T')[0],
        notes: 'Patient needs better diet control',
        createdAt: daysAgo(180)
      },
      {
        patientId: patientRefs['91-1234-5678-9002'],
        name: 'Rajesh Patil',
        age: 35,
        gender: 'M',
        village: 'Beed',
        phone: '9876543211',
        worker: 'ANM Kavita Shinde',
        condition: 'hypertension',
        conditionLabel: 'Hypertension',
        since: daysAgo(60).split('T')[0],
        progressionStatus: 'improving',
        alertLevel: 'low',
        readings: [
          { date: daysAgo(5).split('T')[0], value: '130/85', numeric: 130, note: 'Morning reading', recordedBy: 'asha@swasthya.in' },
          { date: daysAgo(12).split('T')[0], value: '135/88', numeric: 135, note: 'Morning reading', recordedBy: 'asha@swasthya.in' },
          { date: daysAgo(19).split('T')[0], value: '128/82', numeric: 128, note: 'Morning reading', recordedBy: 'asha@swasthya.in' }
        ],
        checkups: [],
        alerts: [],
        medications: ['Amlodipine 5mg daily'],
        missedCheckups: 0,
        totalCheckups: 3,
        lastContactDate: daysAgo(5).split('T')[0],
        nextCheckupDate: daysFromNow(25).split('T')[0],
        notes: 'Good compliance with medication',
        createdAt: daysAgo(60)
      }
    ];

    for (const chronic of chronicPatients) {
      await db.collection('chronic_patients').add(chronic);
      console.log(`  ✅ ${chronic.name} - ${chronic.conditionLabel} (${chronic.alertLevel} alert)`);
    }

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('✅ COMPREHENSIVE SEED COMPLETE!');
    console.log('═'.repeat(60));
    console.log('\n📊 Data Created:');
    console.log(`   • ${patients.length} Patients`);
    console.log(`   • ${users.length} User Accounts`);
    console.log(`   • ${appointments.length} Appointments`);
    console.log(`   • ${followups.length} Follow-ups`);
    console.log(`   • ${referrals.length} Referrals`);
    console.log(`   • ${inventory.length} Inventory Items`);
    console.log(`   • ${diagnostics.length} Diagnostic Orders`);
    console.log(`   • ${familyMembers.length} Family Members`);
    console.log(`   • ${cycles.length} Menstrual Cycles`);
    console.log(`   • ${vaccinations.length} Vaccinations`);
    console.log(`   • ${chronicPatients.length} Chronic Care Records`);
    
    console.log('\n🔐 Demo Credentials (Password: demo1234):');
    console.log('   • ASHA Worker: asha@swasthya.in');
    console.log('   • Doctor: doctor@swasthya.in');
    console.log('   • Admin: admin@swasthya.in');
    console.log('   • Patient (Female): priya@swasthya.in');
    console.log('   • Patient (Male): rajesh@swasthya.in');
    
    console.log('\n✨ All portals now have demo data!');
    console.log('═'.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed error:', error);
    process.exit(1);
  }
}

comprehensiveSeed();
