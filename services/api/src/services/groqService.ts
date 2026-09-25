/**
 * Groq AI Service (Server-Side)
 * 
 * SECURITY: API key is stored on backend only, never exposed to frontend
 * PURPOSE: Generate explanations and personalize scheme information
 * LIMITATION: AI does NOT determine eligibility - only explains results
 */

import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface SchemeExplanationRequest {
  schemeName: string
  schemeDescription: string
  benefits: string[]
  matchedCriteria: string[]
  missingCriteria?: string[]
  requiredDocuments: string[]
  // Minimal patient context (NO sensitive data)
  patientAge?: number
  patientState?: string
  isRural?: boolean
  annualIncome?: number
}

export interface SchemeExplanationResponse {
  summary: string
  whyRelevant: string[]
  documents: string[]
  nextSteps: string[]
  disclaimer: string
  language?: 'en' | 'hi'
}

export const groqService = {
  /**
   * Generate AI explanation for a government scheme match
   * Uses structured prompting to ensure factual, helpful output
   */
  async explainSchemeMatch(
    request: SchemeExplanationRequest,
    language: 'en' | 'hi' = 'en'
  ): Promise<SchemeExplanationResponse> {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured')
    }

    try {
      const prompt = this.buildSchemeExplanationPrompt(request, language)

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'openai/gpt-oss-120b', 
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful government scheme advisor for healthcare programs in India. ' +
                'Your role is to EXPLAIN eligibility results in simple language, NOT to determine eligibility. ' +
                'Be factual, concise, and helpful. Always remind users that final eligibility is determined by government authorities.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more factual responses
          max_tokens: 1000,
          response_format: { type: 'json_object' }, // Request JSON response
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout
        }
      )

      const content = response.data.choices[0]?.message?.content

      if (!content) {
        throw new Error('Empty response from AI')
      }

      // Parse JSON response
      const parsed = JSON.parse(content) as SchemeExplanationResponse

      // Ensure disclaimer is present
      if (!parsed.disclaimer) {
        parsed.disclaimer =
          'Final eligibility is determined by the concerned government authority. Please verify all details with official sources.'
      }

      return parsed
    } catch (error: any) {
      console.error('Groq AI error:', error.message)

      // Return fallback response on AI failure
      return this.getFallbackExplanation(request, language)
    }
  },

  /**
   * Build a structured prompt for scheme explanation
   * Includes only minimal, non-sensitive patient context
   */
  buildSchemeExplanationPrompt(
    request: SchemeExplanationRequest,
    language: 'en' | 'hi'
  ): string {
    const lang = language === 'hi' ? 'Hindi' : 'English'

    return `
You are explaining a government healthcare scheme to a patient.

Scheme Name: ${request.schemeName}
Description: ${request.schemeDescription}
Benefits: ${request.benefits.join(', ')}

Eligibility Check Results:
- Criteria Matched: ${request.matchedCriteria.join(', ')}
${request.missingCriteria && request.missingCriteria.length > 0 ? `- Criteria Not Yet Verified: ${request.missingCriteria.join(', ')}` : ''}

Required Documents: ${request.requiredDocuments.join(', ')}

Patient Context (minimal, for explanation only):
- Age: ${request.patientAge || 'Not provided'}
- State: ${request.patientState || 'Not provided'}
- Location: ${request.isRural ? 'Rural' : 'Urban'}
${request.annualIncome ? `- Annual Income: ₹${request.annualIncome}` : ''}

Task:
Explain this scheme match in simple ${lang}. Return a JSON object with:
{
  "summary": "Brief 2-sentence summary of the scheme and why it appears relevant",
  "whyRelevant": ["Reason 1", "Reason 2", "Reason 3"],
  "documents": ["Document 1 needed", "Document 2 needed"],
  "nextSteps": ["Step 1", "Step 2", "Step 3"],
  "disclaimer": "Final eligibility disclaimer"
}

Important:
- Be helpful and encouraging
- Use simple language
- Do NOT make guarantees about eligibility
- Remind the user to verify with official sources
- Keep it concise
`.trim()
  },

  /**
   * Fallback explanation when AI is unavailable
   * Ensures the feature still works without AI
   */
  getFallbackExplanation(
    request: SchemeExplanationRequest,
    language: 'en' | 'hi'
  ): SchemeExplanationResponse {
    const isHindi = language === 'hi'

    return {
      summary: isHindi
        ? `${request.schemeName} - यह योजना आपकी दी गई जानकारी के आधार पर प्रासंगिक प्रतीत होती है।`
        : `${request.schemeName} appears relevant based on the information provided.`,
      whyRelevant: request.matchedCriteria.map(
        c =>
          isHindi
            ? `आप ${c} की आवश्यकता को पूरा करते हैं`
            : `You meet the ${c} requirement`
      ),
      documents: request.requiredDocuments,
      nextSteps: isHindi
        ? [
            'आवश्यक दस्तावेज़ एकत्र करें',
            'निकटतम सरकारी कार्यालय में जाएं',
            'आधिकारिक वेबसाइट पर आवेदन पत्र जांचें',
          ]
        : [
            'Collect required documents',
            'Visit nearest government office',
            'Check application form on official website',
          ],
      disclaimer: isHindi
        ? 'अंतिम पात्रता संबंधित सरकारी प्राधिकरण द्वारा निर्धारित की जाती है। कृपया सभी विवरण आधिकारिक स्रोतों से सत्यापित करें।'
        : 'Final eligibility is determined by the concerned government authority. Please verify all details with official sources.',
      language,
    }
  },

  /**
   * Compare multiple schemes and provide recommendations
   */
  async compareSchemes(
    schemes: SchemeExplanationRequest[],
    language: 'en' | 'hi' = 'en'
  ): Promise<string> {
    if (!GROQ_API_KEY || schemes.length === 0) {
      return language === 'hi'
        ? 'कई योजनाएं उपलब्ध हैं। विवरण के लिए प्रत्येक योजना की जांच करें।'
        : 'Multiple schemes are available. Check each scheme for details.'
    }

    try {
      const prompt = `
Compare these ${schemes.length} government healthcare schemes for a patient.
Provide a brief recommendation in ${language === 'hi' ? 'Hindi' : 'English'} (max 200 words):

${schemes.map((s, i) => `${i + 1}. ${s.schemeName} - Matched: ${s.matchedCriteria.join(', ')}`).join('\n')}

Which scheme(s) should they prioritize and why?
`.trim()

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.3-70b-versatile', // Updated to supported model
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful advisor comparing government schemes. Be concise and practical.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )

      return response.data.choices[0]?.message?.content || 'Unable to compare schemes at this time.'
    } catch (error) {
      console.error('Scheme comparison error:', error)
      return language === 'hi'
        ? 'योजनाओं की तुलना करने में असमर्थ। कृपया प्रत्येक योजना को व्यक्तिगत रूप से देखें।'
        : 'Unable to compare schemes. Please review each scheme individually.'
    }
  },
}

export default groqService
