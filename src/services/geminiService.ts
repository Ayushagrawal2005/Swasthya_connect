/**
 * Frontend Service for Backend AI APIs
 * Calls backend endpoints for Groq AI features
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'

console.log('✅ Gemini Service API URL:', API_URL)

// ─── Question Generation ──────────────────────────────────────────────────────

export interface GeminiQuestion {
  id: string
  question: string
  type: 'yes-no' | 'single' | 'multi' | 'text' | 'number' | 'scale'
  options?: string[]
  required: boolean
  redFlag?: boolean
  unit?: string
  minValue?: number
  maxValue?: number
}

export async function generateQuestionsFromGemini(
  chiefComplaint: string,
  condition: string,
  maxQuestions = 7,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<GeminiQuestion[]> {
  try {
    console.log('🔄 Calling backend for dynamic questions...')
    const response = await axios.post(`${API_URL}/triage/generate-dynamic-questions`, {
      chiefComplaint,
      condition,
      maxQuestions,
      language
    })
    
    console.log('✅ Dynamic questions received:', response.data.questions?.length || 0)
    return response.data.questions || []
  } catch (error: any) {
    console.error('Error generating questions:', error.message)
    return []
  }
}

// ─── Keyword Suggestions ─────────────────────────────────────────────────────

export async function generateKeywordsFromGemini(
  chiefComplaint: string,
  condition: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<string[]> {
  try {
    // For now, return empty array as this functionality needs backend endpoint
    // TODO: Create /triage/generate-keywords endpoint in backend
    console.log('Keyword generation not yet implemented via backend')
    return []
  } catch (error) {
    console.error('Error generating keywords:', error)
    return []
  }
}
