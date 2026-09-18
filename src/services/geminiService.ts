/**
 * Frontend Groq Service
 * Calls Groq REST API directly from the browser.
 * Fast, reliable AI for medical triage.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'You are a medical triage assistant. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

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
  const languageInstructions = {
    en: 'Generate questions in English only.',
    hi: 'Generate questions in Hindi (Devanagari script). Keep medical terms simple and understandable.',
    mr: 'Generate questions in Marathi (Devanagari script). Keep medical terms simple and understandable.'
  }

  const prompt = `You are a medical triage assistant for a rural healthcare platform in India.

A patient reports: "${chiefComplaint}"
Suspected condition: ${condition}
Language: ${language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Marathi'}

${languageInstructions[language]}

Generate exactly ${maxQuestions} concise medical assessment questions tailored to this specific complaint.

Rules:
- Questions must be directly relevant to "${chiefComplaint}"
- Include 1–2 red flag questions (life-threatening symptoms)
- Mix question types: yes-no, single choice, scale, number, text
- Keep language simple (patient-facing)
- Each question must have a unique id like "q1", "q2", etc.
${language !== 'en' ? '- Options should also be in ' + (language === 'hi' ? 'Hindi' : 'Marathi') : ''}

Return ONLY valid JSON array, no explanation:
[
  {
    "id": "q1",
    "question": "...",
    "type": "yes-no",
    "required": true,
    "redFlag": false
  },
  {
    "id": "q2",
    "question": "...",
    "type": "single",
    "options": ["option1", "option2", "option3"],
    "required": true,
    "redFlag": false
  },
  {
    "id": "q3",
    "question": "Rate your pain level",
    "type": "scale",
    "required": true,
    "redFlag": false
  }
]`

  const text = await callGroq(prompt)

  // Extract JSON array from response (handle markdown code blocks)
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Groq returned no JSON array')

  const questions: GeminiQuestion[] = JSON.parse(match[0])
  return questions.slice(0, maxQuestions)
}

// ─── Keyword Suggestions ─────────────────────────────────────────────────────

export async function generateKeywordsFromGemini(
  chiefComplaint: string,
  condition: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<string[]> {
  const languageInstructions = {
    en: 'in English',
    hi: 'in Hindi (Devanagari script)',
    mr: 'in Marathi (Devanagari script)'
  }

  const prompt = `Patient complaint: "${chiefComplaint}", condition: ${condition}.
List 10 short symptom keywords ${languageInstructions[language]} that a patient might add to describe this better.
Return ONLY a JSON array of strings, e.g. ["keyword1","keyword2",...]. No explanation.`

  const text = await callGroq(prompt)
  const match = text.match(/\[[\s\S]*?\]/)
  if (!match) return []
  return JSON.parse(match[0])
}
