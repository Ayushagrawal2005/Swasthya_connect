/**
 * Simple AI-Based Government Scheme Checker
 * Uses Groq AI directly - No database required
 */

import { Router } from 'express'
import axios from 'axios'

const router = Router()

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

/**
 * POST /schemes/ai-check
 * Simple AI-based scheme eligibility check
 * NOTE: Authentication optional for testing - works without login
 */
router.post('/ai-check', async (req: any, res) => {
  try {
    const { age, state, conditions } = req.body

    // Validate
    if (!age || !state) {
      return res.status(400).json({ error: 'Age and state are required' })
    }

    // Check if Groq API key is configured
    if (!GROQ_API_KEY) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please add GROQ_API_KEY to backend .env file' 
      })
    }

    // Build prompt for AI
    const conditionsText = conditions && conditions.length > 0 
      ? conditions.join(', ') 
      : 'None specified'

    const prompt = `You are an expert on Indian government healthcare schemes. 

User Profile:
- Age: ${age} years
- State: ${state}
- Conditions: ${conditionsText}

List ALL relevant government healthcare schemes this person is eligible for. For each scheme provide:
1. Scheme Name (in English and Hindi)
2. Brief Description
3. Eligibility Criteria
4. Benefits
5. How to Apply
6. Required Documents

Focus on REAL government schemes like:
- Ayushman Bharat
- Pradhan Mantri Matru Vandana Yojana (for pregnant women)
- National Social Assistance Programme (for elderly/disabled/BPL)
- State-specific schemes for ${state}

Provide the response in JSON format as an array of schemes:
[
  {
    "schemeName": "Scheme Name",
    "description": "Brief description",
    "eligibility": "Who is eligible",
    "benefits": ["Benefit 1", "Benefit 2"],
    "howToApply": "Application process",
    "documents": ["Document 1", "Document 2"]
  }
]

Return ONLY the JSON array, no additional text.`

    // Call Groq AI
    console.log('🤖 Calling Groq AI for scheme check...')
    
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'openai/gpt-oss-120b', 
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert on Indian government healthcare schemes. Always respond with valid JSON arrays.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const aiResponse = groqResponse.data.choices[0]?.message?.content || '[]'
    console.log('✅ Groq AI Response received')

    // Parse AI response
    let schemes = []
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        schemes = JSON.parse(jsonMatch[0])
      } else {
        schemes = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Return empty array if parsing fails
      schemes = []
    }

    // Ensure schemes is an array
    if (!Array.isArray(schemes)) {
      schemes = []
    }

    console.log(`📋 Found ${schemes.length} schemes`)

    res.json({
      success: true,
      schemes,
      message: schemes.length > 0 
        ? `Found ${schemes.length} eligible schemes` 
        : 'No schemes found matching your criteria',
    })

  } catch (error: any) {
    console.error('❌ Scheme check error:', error.message)
    
    if (error.response) {
      console.error('Error response:', error.response.data)
      console.error('Error status:', error.response.status)
    }
    
    if (error.response?.status === 401) {
      return res.status(503).json({ 
        error: 'AI service authentication failed. Invalid GROQ_API_KEY' 
      })
    }

    if (error.response?.status === 400) {
      return res.status(503).json({ 
        error: 'AI service request invalid. Check Groq API key or request format.',
        details: error.response?.data?.error?.message || error.message
      })
    }

    res.status(500).json({ 
      error: 'Failed to check schemes',
      details: error.message 
    })
  }
})

export default router
