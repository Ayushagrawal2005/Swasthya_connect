/**
 * Triage Sessions API Client
 * Communicates with backend triage sessions endpoints
 */

import axios from 'axios'
import type {
  TriageSession,
  TriageSummary,
  CreateTriageSessionRequest,
  SaveTriageAnswersRequest,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  SubmitTriageRequest,
  SubmitTriageResponse,
  GeminiQuestionResponse,
  GeminiKeywordResponse,
} from '../types/teleconsult'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Get auth token
function getAuthHeaders() {
  const token = localStorage.getItem('swasthya_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const triageSessionsApi = {
  /**
   * Create a new triage session
   */
  async create(data: CreateTriageSessionRequest): Promise<TriageSession> {
    const response = await axios.post(
      `${API_BASE}/triage-sessions/sessions`,
      data,
      { headers: getAuthHeaders() }
    )
    return response.data.session
  },

  /**
   * Get triage session by ID
   */
  async get(sessionId: string): Promise<TriageSession> {
    const response = await axios.get(
      `${API_BASE}/triage-sessions/sessions/${sessionId}`,
      { headers: getAuthHeaders() }
    )
    return response.data.session
  },

  /**
   * Update triage session (save draft)
   */
  async update(sessionId: string, updates: Partial<SaveTriageAnswersRequest>): Promise<TriageSession> {
    const response = await axios.patch(
      `${API_BASE}/triage-sessions/sessions/${sessionId}`,
      updates,
      { headers: getAuthHeaders() }
    )
    return response.data.session
  },

  /**
   * Get dynamic questions using Gemini AI
   */
  async getQuestions(
    sessionId: string,
    condition: string,
    chiefComplaint: string,
    existingAnswers: any[] = [],
    maxQuestions: number = 7,
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<any[]> {
    const response = await axios.post(
      `${API_BASE}/triage-sessions/sessions/${sessionId}/questions`,
      {
        condition,
        chiefComplaint,
        existingAnswers,
        maxQuestions,
        language,
      },
      { headers: getAuthHeaders() }
    )
    return response.data.questions
  },

  /**
   * Get keyword suggestions using Gemini AI
   */
  async getKeywords(
    sessionId: string,
    condition: string,
    chiefComplaint: string,
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<GeminiKeywordResponse> {
    const response = await axios.post(
      `${API_BASE}/triage-sessions/sessions/${sessionId}/keywords`,
      {
        condition,
        chiefComplaint,
        language,
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Generate AI-assisted summary
   */
  async generateSummary(
    sessionId: string,
    useAI: boolean = true,
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<GenerateSummaryResponse> {
    const response = await axios.post(
      `${API_BASE}/triage-sessions/sessions/${sessionId}/summary`,
      {
        useAI,
        language,
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Submit triage and enter teleconsult queue
   */
  async submit(
    sessionId: string,
    summaryId: string,
    confirmed: boolean
  ): Promise<SubmitTriageResponse> {
    const response = await axios.post(
      `${API_BASE}/triage-sessions/sessions/${sessionId}/submit`,
      {
        summaryId,
        confirmed,
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Get patient triage history
   */
  async getPatientHistory(patientId: string): Promise<TriageSession[]> {
    const response = await axios.get(
      `${API_BASE}/triage-sessions/patients/${patientId}/history`,
      { headers: getAuthHeaders() }
    )
    return response.data.sessions
  },
}
