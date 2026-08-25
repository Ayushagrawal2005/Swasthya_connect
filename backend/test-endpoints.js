/**
 * Test all backend endpoints
 */

const BASE_URL = 'http://localhost:4000'

async function test() {
  console.log('🧪 Testing Backend Endpoints...\n')

  // Test 1: Login
  console.log('1️⃣ Testing Login...')
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'asha1', password: 'password' })
    })
    const data = await res.json()
    if (data.token) {
      console.log('✅ Login successful')
      console.log(`   Token: ${data.token.substring(0, 20)}...`)
      globalThis.TOKEN = data.token
    } else {
      console.log('❌ Login failed:', data)
      return
    }
  } catch (error) {
    console.log('❌ Login error:', error.message)
    return
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${globalThis.TOKEN}`
  }

  // Test 2: Search Patients
  console.log('\n2️⃣ Testing Patient Search...')
  try {
    const res = await fetch(`${BASE_URL}/patients/search?q=`, { headers })
    const patients = await res.json()
    console.log(`✅ Found ${patients.length} patients`)
    if (patients[0]) {
      console.log(`   Sample: ${patients[0].name} (${patients[0].healthId})`)
      globalThis.PATIENT_ID = patients[0].id
    }
  } catch (error) {
    console.log('❌ Patient search error:', error.message)
  }

  // Test 3: Register Patient
  console.log('\n3️⃣ Testing Patient Registration...')
  try {
    const res = await fetch(`${BASE_URL}/patients/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Patient ' + Date.now(),
        phone: '9876543210',
        age: '35',
        gender: 'F',
        village: 'Test Village',
        language: 'Hindi'
      })
    })
    const result = await res.json()
    if (result.patientId) {
      console.log('✅ Patient registered successfully')
      console.log(`   Health ID: ${result.healthId}`)
      console.log(`   Name: ${result.name}`)
    } else {
      console.log('❌ Registration failed:', result)
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message)
  }

  // Test 4: Get Facilities
  console.log('\n4️⃣ Testing Get Facilities...')
  try {
    const res = await fetch(`${BASE_URL}/appointments/facilities`, { headers })
    const facilities = await res.json()
    console.log(`✅ Found ${facilities.length} facilities`)
    if (facilities[0]) {
      console.log(`   Sample: ${facilities[0].name} (${facilities[0].doctors?.length || 0} doctors)`)
      globalThis.FACILITY_ID = facilities[0].id
      globalThis.DOCTOR_ID = facilities[0].doctors?.[0]?.id
    }
  } catch (error) {
    console.log('❌ Get facilities error:', error.message)
  }

  // Test 5: Book Appointment
  console.log('\n5️⃣ Testing Book Appointment...')
  try {
    const res = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        patientName: 'Test Patient',
        patientId: globalThis.PATIENT_ID || 'P001',
        facilityId: globalThis.FACILITY_ID || 'F001',
        doctorId: globalThis.DOCTOR_ID || 'D001',
        date: '2026-08-26',
        time: '10:00',
        type: 'in-person'
      })
    })
    const appointment = await res.json()
    if (appointment.id) {
      console.log('✅ Appointment booked successfully')
      console.log(`   Token: ${appointment.token}`)
      console.log(`   Queue Position: ${appointment.queuePosition}`)
    } else {
      console.log('❌ Booking failed:', appointment)
    }
  } catch (error) {
    console.log('❌ Booking error:', error.message)
  }

  // Test 6: List Appointments
  console.log('\n6️⃣ Testing List Appointments...')
  try {
    const res = await fetch(`${BASE_URL}/appointments`, { headers })
    const appointments = await res.json()
    console.log(`✅ Found ${appointments.length} appointments`)
  } catch (error) {
    console.log('❌ List appointments error:', error.message)
  }

  // Test 7: Triage Assessment
  console.log('\n7️⃣ Testing Triage Assessment...')
  try {
    const res = await fetch(`${BASE_URL}/triage/assess`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vitals: { bp_sys: '140', bp_dia: '90', temp: '98.6', spo2: '96', pulse: '80' },
        answers: ['yes', 'no', 'yes']
      })
    })
    const result = await res.json()
    if (result.risk_level) {
      console.log('✅ Triage assessment successful')
      console.log(`   Risk Level: ${result.risk_level}`)
      console.log(`   Score: ${result.score}`)
    } else {
      console.log('❌ Assessment failed:', result)
    }
  } catch (error) {
    console.log('❌ Triage error:', error.message)
  }

  // Test 8: Get Follow-ups
  console.log('\n8️⃣ Testing Get Follow-ups...')
  try {
    const res = await fetch(`${BASE_URL}/followups`, { headers })
    const followups = await res.json()
    console.log(`✅ Found ${followups.length} follow-ups`)
  } catch (error) {
    console.log('❌ Follow-ups error:', error.message)
  }

  // Test 9: Get Inventory
  console.log('\n9️⃣ Testing Get Inventory...')
  try {
    const res = await fetch(`${BASE_URL}/inventory`, { headers })
    const items = await res.json()
    console.log(`✅ Found ${items.length} inventory items`)
  } catch (error) {
    console.log('❌ Inventory error:', error.message)
  }

  // Test 10: Get Chronic Patients
  console.log('\n🔟 Testing Get Chronic Patients...')
  try {
    const res = await fetch(`${BASE_URL}/chronic`, { headers })
    const patients = await res.json()
    console.log(`✅ Found ${patients.length} chronic patients`)
  } catch (error) {
    console.log('❌ Chronic patients error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ BACKEND ENDPOINT TESTING COMPLETE')
  console.log('='.repeat(60))
}

test().catch(console.error)
