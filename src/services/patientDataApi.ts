/**
 * Patient Data API Service
 * Fetches patient longitudinal records and summaries
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export interface LongitudinalRecord {
  id: string
  patientId: string
  recordType: 'consultation' | 'triage' | 'prescription' | 'lab' | 'vaccination' | 'admission'
  recordDate: string
  title: string
  summary: string
  diagnosis?: string
  medications?: string[]
  labResults?: any[]
  vitals?: {
    bp?: string
    temp?: string
    pulse?: string
    spo2?: string
    weight?: string
  }
  provider?: string
  facility?: string
  tier?: string
  severity?: number
  outcome?: string
}

export interface PatientSummary {
  demographics: {
    id: string
    name: string
    age: number
    gender: string
    bloodGroup?: string
    phone?: string
    healthId?: string
  }
  medicalHistory: {
    allergies: string[]
    chronicConditions: string[]
    pastSurgeries: string[]
    familyHistory: string[]
  }
  currentMedications: Array<{
    name: string
    dosage: string
    frequency: string
    startDate: string
  }>
  recentVisits: LongitudinalRecord[]
  vitalsTrend: Array<{
    date: string
    bp?: string
    temp?: string
    pulse?: string
    spo2?: string
    weight?: string
  }>
}

/**
 * Fetch patient longitudinal records
 */
export async function getPatientLongitudinalRecords(
  patientId: string,
  options?: {
    recordType?: string
    fromDate?: string
    toDate?: string
    limit?: number
  }
): Promise<LongitudinalRecord[]> {
  try {
    const params = new URLSearchParams()
    if (options?.recordType) params.set('recordType', options.recordType)
    if (options?.fromDate) params.set('fromDate', options.fromDate)
    if (options?.toDate) params.set('toDate', options.toDate)
    if (options?.limit) params.set('limit', options.limit.toString())

    const url = `${API_BASE}/longitudinal/patients/${patientId}?${params}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch longitudinal records')
    }

    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error('Error fetching longitudinal records:', error)
    return []
  }
}

/**
 * Get comprehensive patient summary for teleconsult
 */
export async function getPatientSummaryForTeleconsult(
  patientId: string
): Promise<PatientSummary | null> {
  try {
    // Fetch patient details
    const patientResponse = await fetch(`${API_BASE}/patients/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!patientResponse.ok) {
      throw new Error('Failed to fetch patient')
    }

    const patient = await patientResponse.json()

    // Fetch recent longitudinal records (last 6 months, limit 10)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const records = await getPatientLongitudinalRecords(patientId, {
      fromDate: sixMonthsAgo.toISOString(),
      limit: 10
    })

    // Extract vitals trend from recent records
    const vitalsTrend = records
      .filter(r => r.vitals)
      .map(r => ({
        date: r.recordDate,
        ...r.vitals
      }))
      .slice(0, 5)

    // Build comprehensive summary
    const summary: PatientSummary = {
      demographics: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        healthId: patient.healthId
      },
      medicalHistory: {
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
        pastSurgeries: patient.pastSurgeries || [],
        familyHistory: patient.familyHistory || []
      },
      currentMedications: patient.currentMedications || [],
      recentVisits: records,
      vitalsTrend
    }

    return summary
  } catch (error) {
    console.error('Error fetching patient summary:', error)
    return null
  }
}

/**
 * Get patient's active chronic conditions
 */
export async function getPatientChronicConditions(patientId: string) {
  try {
    const response = await fetch(`${API_BASE}/chronic/patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.conditions || []
  } catch (error) {
    console.error('Error fetching chronic conditions:', error)
    return []
  }
}
