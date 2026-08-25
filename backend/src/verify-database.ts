/**
 * Verify Firestore Database Structure
 * This script checks all collections and documents
 */

import 'dotenv/config'
import db from './services/db'

async function verifyDatabase() {
  console.log('🔍 Verifying Firestore Database...\n')

  try {
    // Check Users
    console.log('👥 USERS COLLECTION:')
    const users = await db.users.getAll()
    console.log(`   Found ${users.length} users:`)
    users.forEach((u: any) => console.log(`   - ${u.name} (${u.role})`))

    // Check Facilities
    console.log('\n🏥 FACILITIES COLLECTION:')
    const facilities = await db.facilities.getAll()
    console.log(`   Found ${facilities.length} facilities:`)
    facilities.forEach((f: any) => console.log(`   - ${f.name} (${f.tier})`))

    // Check Doctors
    console.log('\n👨‍⚕️ DOCTORS COLLECTION:')
    const doctors = await db.doctors.getAll()
    console.log(`   Found ${doctors.length} doctors:`)
    doctors.forEach((d: any) => console.log(`   - ${d.name} - ${d.specialty}`))

    // Check Patients
    console.log('\n🧑‍🤝‍🧑 PATIENTS COLLECTION:')
    const patients = await db.patients.search('')
    console.log(`   Found ${patients.length} patients:`)
    patients.forEach((p: any) => console.log(`   - ${p.name} (${p.healthId})`))

    // Check Appointments
    console.log('\n📅 APPOINTMENTS COLLECTION:')
    const appointments = await db.appointments.list({})
    console.log(`   Found ${appointments.length} appointments:`)
    appointments.forEach((a: any) => console.log(`   - ${a.patientName} at ${a.time} on ${a.date}`))

    // Check Inventory
    console.log('\n💊 INVENTORY COLLECTION:')
    const inventory = await db.inventory.list()
    console.log(`   Found ${inventory.length} items:`)
    inventory.forEach((i: any) => console.log(`   - ${i.name}: ${i.current} ${i.unit}`))

    // Check Chronic Patients
    console.log('\n🩺 CHRONIC PATIENTS COLLECTION:')
    const chronic = await db.chronic.list()
    console.log(`   Found ${chronic.length} chronic patients:`)
    chronic.forEach((c: any) => console.log(`   - ${c.name} (${c.conditionLabel})`))

    // Check Follow-ups
    console.log('\n📋 FOLLOW-UPS COLLECTION:')
    const followups = await db.followups.list()
    console.log(`   Found ${followups.length} follow-ups:`)
    followups.forEach((f: any) => console.log(`   - ${f.patientName} (${f.condition}) - Due: ${f.dueDate}`))

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ DATABASE VERIFICATION COMPLETE')
    console.log('='.repeat(60))
    console.log('\n📊 Collection Summary:')
    console.log(`   - users: ${users.length} documents`)
    console.log(`   - facilities: ${facilities.length} documents`)
    console.log(`   - doctors: ${doctors.length} documents`)
    console.log(`   - patients: ${patients.length} documents`)
    console.log(`   - appointments: ${appointments.length} documents`)
    console.log(`   - inventory: ${inventory.length} documents`)
    console.log(`   - chronic_patients: ${chronic.length} documents`)
    console.log(`   - followups: ${followups.length} documents`)
    
    console.log('\n🎯 Additional Collections (Created as needed):')
    console.log('   - visits (created when patients visit)')
    console.log('   - triage_sessions (created during triage)')
    console.log('   - referrals (created when referrals are made)')
    console.log('   - medical_records (created on OCR upload)')
    console.log('   - diagnostic_orders (created for lab tests)')
    console.log('   - escalations (created for emergencies)')
    console.log('   - ivr_cases (created by IVR system)')

    console.log('\n🔗 View your data in Firebase Console:')
    console.log('   https://console.firebase.google.com/project/swasthyaconnect-4bfa1/firestore\n')

  } catch (error) {
    console.error('❌ Error verifying database:', error)
    process.exit(1)
  }
}

verifyDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
