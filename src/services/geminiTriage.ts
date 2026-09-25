/**
 * Groq adaptive triage — Backend API integration
 * Calls backend /triage/generate-question endpoint
 */
import {
  FIRST_QUESTION,
  getAnalysingMessage,
  type AdaptiveQuestion,
} from '../lib/adaptiveQuestions'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://swasthya-connect-1x6r.onrender.com'

console.log('🔧 Triage Service Initialized - Using Backend API')
console.log('✅ Gemini Triage API URL:', API_URL)
console.log('📍 API URL:', API_URL)

export interface Turn {
  question: string
  answer: string
}

export { FIRST_QUESTION }

export async function getNextQuestion(
  history: Turn[],
  firstAnswer: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<AdaptiveQuestion | null> {
  console.log('🎯 getNextQuestion() called')
  console.log('📊 History length:', history.length)
  console.log('📝 First answer:', firstAnswer)
  console.log('🌐 Language:', language)
  
  try {
    console.log('🚀 Calling backend API for question generation...')
    const response = await axios.post(`${API_URL}/triage/generate-question`, {
      history,
      firstAnswer,
      language
    })

    console.log('📦 Backend response:', response.data)

    if (response.data.done) {
      console.log('✅ Backend says we are done with questions')
      return null
    }

    if (response.data.question) {
      return {
        text: response.data.question,
        hint: response.data.hint || ''
      }
    }

    return null
  } catch (error: any) {
    console.error('❌ Error calling backend:', error.message)
    // Return null to end questions on error
    return null
  }
}

export { getAnalysingMessage }