/**
 * ML-powered Triage API Service
 * Connects to Flask backend for ML predictions
 */

const API_BASE_URL = 'http://localhost:5000'

export interface TriageInput {
  vitals?: {
    bp?: string
    temp?: string
    spo2?: string
    pulse?: string
  }
  answers?: string[]
  severity?: number
  duration_days?: number
  patient_id?: string
}

export interface TriagePrediction {
  urgency_level: number
  risk_level: 'low' | 'medium' | 'high' | 'emergency'
  risk_label: string
  score: number
  confidence: number
  auto_escalate: boolean
  flags: string[]
  hospital_level: number
  hospital_level_label: string
  hospital_level_desc: string
  probabilities: {
    low: number
    medium: number
    high: number
    emergency: number
  }
  timestamp: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

class TriageApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Check if the ML API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      return data.status === 'healthy' && data.model_loaded
    } catch (error) {
      console.error('ML API health check failed:', error)
      return false
    }
  }

  /**
   * Get ML prediction for triage case
   */
  async predict(input: TriageInput): Promise<ApiResponse<TriagePrediction>> {    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        return { error: error.error || 'Prediction failed' }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('ML prediction error:', error)
      return { error: error instanceof Error ? error.message : 'Network error' }
    }
  }

}

export const triageApi = new TriageApiService()
