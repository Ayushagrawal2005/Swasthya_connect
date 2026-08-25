/**
 * Firebase Firestore Database Seed Script
 * Populates the database with initial test data
 * 
 * Run with: npx tsx src/seed.ts
 */

import 'dotenv/config'
import db from './services/db'

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. SEED USERS
    // ═══════════════════════════════════════════════════════════════
    console.log('👥 Creating users...')
    
    const users = [
      { username: 'asha1', password: 'password', role: 'asha', name: 'ASHA Kavita Sharma', email: 'asha1@swasthya.gov.in', phone: '9876543210', village: 'Mandav' },
      { username: 'asha2', password: 'password', role: 'asha', name: 'ASHA Sunita Patil', email: 'asha2@swasthya.gov.in', phone: '9876543211', village: 'Parli' },
      { username: 'doctor1', password: 'password', role: 'doctor', name: 'Dr. Ramesh Patil', email: 'dr.patil@swasthya.gov.in', phone: '9876543220', specialty: 'General Medicine' },
      { username: 'doctor2', password: 'password', role: 'doctor', name: 'Dr. Priya Deshmukh', email: 'dr.priya@swasthya.gov.in', phone: '9876543221', specialty: 'Pediatrics' },
      { username: 'admin1', password: 'password', role: 'admin', name: 'Admin Rajesh Kumar', email: 'admin@swasthya.gov.in', phone: '9876543230' },
      { username: 'patient1', password: 'password', role: 'patient', name: 'Meena Jadhav', email: 'meena@example.com', phone: '9876543240' }
    ]

    const createdUsers = []
    for (const user of users) {
      const created = await db.users.create(user)
      createdUsers.push(created)
      console.log(`   ✓ Created user: ${user.name} (${user.role})`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. SEED FACILITIES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🏥 Creating facilities...')
    
    const facilities = [
      {
        name: 'PHC Beed',
        tier: 'phc',
        distance: '2.3 km',
        phone: '+91 2441 234567',
        address: 'Main Road, Beed, Maharashtra 431122',
        beds: 10,
        ambulances: 1
      },
      {
        name: 'District Hospital Beed',
        tier: 'district',
        distance: '12.7 km',
        phone: '+91 2441 234890',
        address: 'Civil Lines, Beed, Maharashtra 431122',
        beds: 100,
        ambulances: 3
      },
      {
        name: 'Sub-District Hospital Parli',
        tier: 'sub-district',
        distance: '18.5 km',
        phone: '+91 2441 245678',
        address: 'Hospital Road, Parli, Maharashtra 431515',
        beds: 50,
        ambulances: 2
      },
      {
        name: 'Sub-Centre Mandav',
        tier: 'sub-centre',
        distance: '0.5 km',
        phone: '+91 2441 256789',
        address: 'Village Center, Mandav, Maharashtra 431122',
        beds: 2,
        ambulances: 0
      }
    ]

    const createdFacilities = []
    for (const facility of facilities) {
      const created = await db.facilities.create(facility)
      createdFacilities.push(created)
      console.log(`   ✓ Created facility: ${facility.name}`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. SEED DOCTORS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👨‍⚕️ Creating doctors...')
    
    const doctors = [
      { facilityId: createdFacilities[0].id, name: 'Dr. Ramesh Patil', specialty: 'General Medicine', available: true, slotsToday: 8, phone: '9876543220' },
      { facilityId: createdFacilities[0].id, name: 'Dr. Priya Deshmukh', specialty: 'Pediatrics', available: true, slotsToday: 5, phone: '9876543221' },
      { facilityId: createdFacilities[1].id, name: 'Dr. Suresh Kumar', specialty: 'Cardiology', available: true, slotsToday: 12, phone: '9876543222' },
      { facilityId: createdFacilities[1].id, name: 'Dr. Anjali Sharma', specialty: 'Gynecology', available: true, slotsToday: 10, phone: '9876543223' },
      { facilityId: createdFacilities[1].id, name: 'Dr. Vikram Singh', specialty: 'Orthopedics', available: false, slotsToday: 0, phone: '9876543224' },
      { facilityId: createdFacilities[2].id, name: 'Dr. Amit Joshi', specialty: 'General Surgery', available: true, slotsToday: 6, phone: '9876543225' },
      { facilityId: createdFacilities[2].id, name: 'Dr. Meera Kulkarni', specialty: 'Internal Medicine', available: true, slotsToday: 7, phone: '9876543226' }
    ]

    const createdDoctors = []
    for (const doctor of doctors) {
      const created = await db.doctors.create(doctor)
      createdDoctors.push(created)
      console.log(`   ✓ Created doctor: ${doctor.name} - ${doctor.specialty}`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. SEED PATIENTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🧑‍🤝‍🧑 Creating patients...')
    
    const patients = [
      {
        name: 'Meena Jadhav',
        healthId: '91-7842-3301-6629',
        age: 24,
        gender: 'F',
        dob: '1999-03-15',
        phone: '9876543240',
        village: 'Mandav',
        language: 'Marathi',
        bloodGroup: 'O+',
        allergies: [],
        conditions: ['Anemia'],
        noShowCount: 0,
        totalFollowUps: 3,
        distanceKmFromPHC: 2.3
      },
      {
        name: 'Ramesh Kale',
        healthId: '91-7842-3301-7730',
        age: 58,
        gender: 'M',
        dob: '1965-07-22',
        phone: '9876543241',
        village: 'Beed',
        language: 'Marathi',
        bloodGroup: 'A+',
        allergies: ['Penicillin'],
        conditions: ['Diabetes Type 2', 'Hypertension'],
        noShowCount: 1,
        totalFollowUps: 12,
        distanceKmFromPHC: 5.1
      },
      {
        name: 'Sunita Patil',
        healthId: '91-7842-3301-8841',
        age: 35,
        gender: 'F',
        dob: '1988-11-10',
        phone: '9876543242',
        village: 'Parli',
        language: 'Marathi',
        bloodGroup: 'B+',
        allergies: [],
        conditions: [],
        noShowCount: 0,
        totalFollowUps: 1,
        distanceKmFromPHC: 18.5
      },
      {
        name: 'Ganesh Shinde',
        healthId: '91-7842-3301-9952',
        age: 42,
        gender: 'M',
        dob: '1981-05-18',
        phone: '9876543243',
        village: 'Mandav',
        language: 'Marathi',
        bloodGroup: 'AB+',
        allergies: [],
        conditions: ['Hypertension'],
        noShowCount: 0,
        totalFollowUps: 5,
        distanceKmFromPHC: 2.8
      },
      {
        name: 'Lata Desai',
        healthId: '91-7842-3302-0063',
        age: 29,
        gender: 'F',
        dob: '1994-12-05',
        phone: '9876543244',
        village: 'Beed',
        language: 'Marathi',
        bloodGroup: 'O-',
        allergies: ['Sulfa drugs'],
        conditions: [],
        noShowCount: 0,
        totalFollowUps: 2,
        distanceKmFromPHC: 6.2
      }
    ]

    const createdPatients = []
    for (const patient of patients) {
      const created = await db.patients.create(patient)
      createdPatients.push(created)
      console.log(`   ✓ Created patient: ${patient.name} (${patient.healthId})`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. SEED APPOINTMENTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📅 Creating appointments...')
    
    const today = new Date().toISOString().split('T')[0]
    const appointments = [
      {
        patientId: createdPatients[0].id,
        patientName: createdPatients[0].name,
        facilityId: createdFacilities[0].id,
        doctorId: createdDoctors[0].id,
        bookedBy: 'asha1',
        date: today,
        time: '10:00',
        type: 'in-person',
        status: 'scheduled',
        queuePosition: 1,
        estimatedWait: 15,
        token: 'T101'
      },
      {
        patientId: createdPatients[1].id,
        patientName: createdPatients[1].name,
        facilityId: createdFacilities[1].id,
        doctorId: createdDoctors[2].id,
        bookedBy: 'asha1',
        date: today,
        time: '11:30',
        type: 'in-person',
        status: 'scheduled',
        queuePosition: 2,
        estimatedWait: 30,
        token: 'T102'
      },
      {
        patientId: createdPatients[2].id,
        patientName: createdPatients[2].name,
        facilityId: createdFacilities[0].id,
        doctorId: createdDoctors[1].id,
        bookedBy: 'asha2',
        date: today,
        time: '14:00',
        type: 'teleconsult',
        status: 'scheduled',
        queuePosition: 1,
        estimatedWait: 10,
        token: 'T103'
      }
    ]

    for (const appointment of appointments) {
      await db.appointments.create(appointment)
      console.log(`   ✓ Created appointment: ${appointment.patientName} at ${appointment.time}`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. SEED INVENTORY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n💊 Creating inventory items...')
    
    const inventory = [
      { facilityId: createdFacilities[0].id, name: 'Paracetamol 500mg', category: 'Pain Relief', current: 850, threshold: 500, unit: 'tablets', lastRestocked: '2024-02-10', critical: false },
      { facilityId: createdFacilities[0].id, name: 'Amoxicillin 250mg', category: 'Antibiotics', current: 320, threshold: 400, unit: 'capsules', lastRestocked: '2024-02-05', critical: true },
      { facilityId: createdFacilities[0].id, name: 'Metformin 500mg', category: 'Diabetes', current: 1200, threshold: 600, unit: 'tablets', lastRestocked: '2024-02-12', critical: false },
      { facilityId: createdFacilities[0].id, name: 'ORS Sachets', category: 'Rehydration', current: 45, threshold: 100, unit: 'sachets', lastRestocked: '2024-01-28', critical: true },
      { facilityId: createdFacilities[1].id, name: 'Insulin (Vials)', category: 'Diabetes', current: 28, threshold: 20, unit: 'vials', lastRestocked: '2024-02-14', critical: false },
      { facilityId: createdFacilities[1].id, name: 'Atenolol 50mg', category: 'Cardiovascular', current: 580, threshold: 400, unit: 'tablets', lastRestocked: '2024-02-08', critical: false }
    ]

    for (const item of inventory) {
      await db.inventory.create(item)
      console.log(`   ✓ Created inventory: ${item.name} (${item.current} ${item.unit})`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. SEED CHRONIC PATIENTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🩺 Creating chronic disease patients...')
    
    const chronicPatients = [
      {
        patientId: createdPatients[1].id,
        name: createdPatients[1].name,
        age: createdPatients[1].age,
        gender: createdPatients[1].gender,
        village: createdPatients[1].village,
        phone: createdPatients[1].phone,
        worker: 'ASHA Kavita',
        condition: 'diabetes',
        conditionLabel: 'Diabetes Type 2',
        since: '2020-03-15',
        progressionStatus: 'stable',
        alertLevel: 'normal',
        readings: [
          { date: '2024-02-20', value: '145 mg/dL', numeric: 145, note: 'Fasting', recordedBy: 'asha1' },
          { date: '2024-02-15', value: '138 mg/dL', numeric: 138, note: 'Fasting', recordedBy: 'asha1' },
          { date: '2024-02-10', value: '152 mg/dL', numeric: 152, note: 'Random', recordedBy: 'asha1' }
        ],
        checkups: [],
        alerts: [],
        medications: ['Metformin 500mg BD', 'Glimepiride 2mg OD'],
        missedCheckups: 0,
        totalCheckups: 8,
        lastContactDate: '2024-02-20',
        nextCheckupDate: '2024-03-05',
        notes: 'Patient compliant with medication. Diet control improving.'
      },
      {
        patientId: createdPatients[3].id,
        name: createdPatients[3].name,
        age: createdPatients[3].age,
        gender: createdPatients[3].gender,
        village: createdPatients[3].village,
        phone: createdPatients[3].phone,
        worker: 'ASHA Kavita',
        condition: 'hypertension',
        conditionLabel: 'Essential Hypertension',
        since: '2019-08-22',
        progressionStatus: 'stable',
        alertLevel: 'warning',
        readings: [
          { date: '2024-02-21', value: '150/95 mmHg', numeric: 150, note: 'Morning reading', recordedBy: 'asha1' },
          { date: '2024-02-14', value: '145/90 mmHg', numeric: 145, note: 'Evening', recordedBy: 'asha1' },
          { date: '2024-02-07', value: '148/92 mmHg', numeric: 148, note: 'Routine', recordedBy: 'asha1' }
        ],
        checkups: [],
        alerts: [
          { id: 'A1', chronicPatientId: '', level: 'warning', message: 'BP elevated above target', action: 'Follow up in 1 week', triggeredBy: 'auto', createdAt: '2024-02-21T10:30:00Z', acknowledged: false }
        ],
        medications: ['Atenolol 50mg OD', 'Amlodipine 5mg OD'],
        missedCheckups: 1,
        totalCheckups: 12,
        lastContactDate: '2024-02-21',
        nextCheckupDate: '2024-02-28',
        notes: 'BP slightly elevated. Advised salt restriction and regular walking.'
      }
    ]

    for (const chronic of chronicPatients) {
      await db.chronic.create(chronic)
      console.log(`   ✓ Created chronic patient: ${chronic.name} (${chronic.conditionLabel})`)
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. SEED FOLLOW-UPS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 Creating follow-up tasks...')
    
    const followups = [
      {
        patientId: createdPatients[0].id,
        patientName: createdPatients[0].name,
        age: createdPatients[0].age,
        condition: 'Anemia',
        risk: 'moderate',
        dueDate: '2024-02-28',
        status: 'pending',
        phone: createdPatients[0].phone,
        notes: 'Check Hb levels after iron supplementation',
        lastVisit: '2024-02-14',
        nextStep: 'Blood test for Hb',
        assignedTo: 'asha1'
      },
      {
        patientId: createdPatients[1].id,
        patientName: createdPatients[1].name,
        age: createdPatients[1].age,
        condition: 'Diabetes',
        risk: 'high',
        dueDate: '2024-03-05',
        status: 'pending',
        phone: createdPatients[1].phone,
        notes: 'Monthly diabetes check-up and HbA1c test',
        lastVisit: '2024-02-05',
        nextStep: 'Fasting blood sugar + HbA1c',
        assignedTo: 'asha1'
      }
    ]

    for (const followup of followups) {
      await db.followups.create(followup)
      console.log(`   ✓ Created follow-up: ${followup.patientName} - ${followup.condition}`)
    }

    // ═══════════════════════════════════════════════════════════════
    // DONE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Facilities: ${facilities.length}`)
    console.log(`   - Doctors: ${doctors.length}`)
    console.log(`   - Patients: ${patients.length}`)
    console.log(`   - Appointments: ${appointments.length}`)
    console.log(`   - Inventory items: ${inventory.length}`)
    console.log(`   - Chronic patients: ${chronicPatients.length}`)
    console.log(`   - Follow-ups: ${followups.length}`)
    
    console.log('\n🎉 You can now:')
    console.log('   1. Login with: asha1/password, doctor1/password, admin1/password, patient1/password')
    console.log('   2. View data in Firebase Console: https://console.firebase.google.com/')
    console.log('   3. Start the backend: npm run dev')
    console.log('   4. Start the frontend: npm run dev\n')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
