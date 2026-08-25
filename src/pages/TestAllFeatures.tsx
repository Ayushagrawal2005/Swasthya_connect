/**
 * Feature Testing Dashboard
 * Tests all major features of the healthcare platform
 */

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react'
import { 
  authApi, 
  patientsApi, 
  appointmentsApi, 
  triageApi2, 
  followupsApi, 
  inventoryApi, 
  chronicApi 
} from '../services/api'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  details?: any
}

export function TestAllFeaturesPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name)
      if (existing) {
        return prev.map(r => r.name === name ? { name, status, message, details } : r)
      }
      return [...prev, { name, status, message, details }]
    })
  }

  const runTests = async () => {
    setRunning(true)
    setResults([])

    // Test 1: Login
    updateResult('Login', 'running', 'Testing authentication...')
    try {
      const loginRes = await authApi.login('asha1', 'password')
      if (loginRes.token) {
        localStorage.setItem('swasthya_token', loginRes.token)
        updateResult('Login', 'success', `Logged in as ${loginRes.user.name}`, loginRes)
      } else {
        updateResult('Login', 'error', 'No token received', loginRes)
      }
    } catch (error: any) {
      updateResult('Login', 'error', error.message)
    }

    // Test 2: Patient Search
    updateResult('Patient Search', 'running', 'Searching patients...')
    try {
      const patients = await patientsApi.search('')
      if (patients.length > 0) {
        updateResult('Patient Search', 'success', `Found ${patients.length} patients`, patients.slice(0, 2))
      } else {
        updateResult('Patient Search', 'error', 'No patients found')
      }
    } catch (error: any) {
      updateResult('Patient Search', 'error', error.message)
    }

    // Test 3: Patient Registration
    updateResult('Patient Registration', 'running', 'Registering new patient...')
    try {
      const regData = {
        name: 'Test Patient ' + Date.now(),
        phone: '9876543210',
        age: '30',
        gender: 'F' as const,
        village: 'Test Village',
        language: 'Hindi'
      }
      const regRes = await patientsApi.register(regData)
      if (regRes.patientId && regRes.healthId) {
        updateResult('Patient Registration', 'success', `Registered: ${regRes.name}`, regRes)
      } else {
        updateResult('Patient Registration', 'error', 'Missing patientId or healthId', regRes)
      }
    } catch (error: any) {
      updateResult('Patient Registration', 'error', error.message)
    }

    // Test 4: Get Facilities
    updateResult('Get Facilities', 'running', 'Loading facilities...')
    try {
      const facilities = await appointmentsApi.facilities()
      if (facilities.length > 0) {
        updateResult('Get Facilities', 'success', `Found ${facilities.length} facilities`, facilities)
      } else {
        updateResult('Get Facilities', 'error', 'No facilities found')
      }
    } catch (error: any) {
      updateResult('Get Facilities', 'error', error.message)
    }

    // Test 5: Book Appointment
    updateResult('Book Appointment', 'running', 'Booking appointment...')
    try {
      const bookData = {
        patientName: 'Test Patient',
        patientId: 'P001',
        facilityId: 'F001',
        doctorId: 'D001',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        type: 'in-person' as const
      }
      const appt = await appointmentsApi.book(bookData)
      if (appt.id && appt.token) {
        updateResult('Book Appointment', 'success', `Booked! Token: ${appt.token}`, appt)
      } else {
        updateResult('Book Appointment', 'error', 'Missing appointment ID or token', appt)
      }
    } catch (error: any) {
      updateResult('Book Appointment', 'error', error.message)
    }

    // Test 6: List Appointments
    updateResult('List Appointments', 'running', 'Loading appointments...')
    try {
      const appts = await appointmentsApi.list()
      updateResult('List Appointments', 'success', `Found ${appts.length} appointments`, appts.slice(0, 2))
    } catch (error: any) {
      updateResult('List Appointments', 'error', error.message)
    }

    // Test 7: Triage Assessment
    updateResult('Triage Assessment', 'running', 'Running triage...')
    try {
      const triageData = {
        vitals: {
          bp_sys: '140',
          bp_dia: '90',
          temp: '98.6',
          spo2: '96',
          pulse: '80'
        },
        answers: ['yes', 'no', 'yes']
      }
      const triageRes = await triageApi2.assess(triageData)
      if (triageRes.risk_level) {
        updateResult('Triage Assessment', 'success', `Risk: ${triageRes.risk_level} (${triageRes.score}/100)`, triageRes)
      } else {
        updateResult('Triage Assessment', 'error', 'Missing risk level', triageRes)
      }
    } catch (error: any) {
      updateResult('Triage Assessment', 'error', error.message)
    }

    // Test 8: Get Follow-ups
    updateResult('Get Follow-ups', 'running', 'Loading follow-ups...')
    try {
      const followups = await followupsApi.list()
      updateResult('Get Follow-ups', 'success', `Found ${followups.length} follow-ups`, followups)
    } catch (error: any) {
      updateResult('Get Follow-ups', 'error', error.message)
    }

    // Test 9: Get Inventory
    updateResult('Get Inventory', 'running', 'Loading inventory...')
    try {
      const inventory = await inventoryApi.list()
      updateResult('Get Inventory', 'success', `Found ${inventory.length} items`, inventory)
    } catch (error: any) {
      updateResult('Get Inventory', 'error', error.message)
    }

    // Test 10: Get Chronic Patients
    updateResult('Get Chronic Patients', 'running', 'Loading chronic patients...')
    try {
      const chronic = await chronicApi.list()
      updateResult('Get Chronic Patients', 'success', `Found ${chronic.length} chronic patients`, chronic)
    } catch (error: any) {
      updateResult('Get Chronic Patients', 'error', error.message)
    }

    setRunning(false)
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C2C2A]">🧪 Feature Testing Dashboard</h1>
        <p className="text-sm text-[#5F5E5A] mt-1">Test all major features of the healthcare platform</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={runTests}
          disabled={running}
          className="btn-primary flex items-center gap-2"
        >
          {running ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play size={16} />
              Run All Tests
            </>
          )}
        </button>

        {results.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold">✓ {successCount} Passed</span>
            <span className="text-red-600 font-semibold">✗ {errorCount} Failed</span>
            <span className="text-gray-600">Total: {results.length}</span>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${
                result.status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : result.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : result.status === 'running'
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {result.status === 'success' && <CheckCircle size={20} className="text-green-600" />}
                  {result.status === 'error' && <XCircle size={20} className="text-red-600" />}
                  {result.status === 'running' && <Loader2 size={20} className="text-orange-600 animate-spin" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#2C2C2A]">{result.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        result.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : result.status === 'error'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#5F5E5A] mt-1">{result.message}</p>

                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-[#FF9933] cursor-pointer hover:underline">
                        Show details
                      </summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!running && results.length === 0 && (
        <div className="text-center py-12 text-[#9E9C94]">
          <p>Click "Run All Tests" to start testing all features</p>
        </div>
      )}
    </div>
  )
}
