/**
 * Gemini adaptive triage — fast, short prompts, instant fallback
 */
import {
  FIRST_QUESTION,
  getFollowUpQuestions,
  getAnalysingMessage,
  type AdaptiveQuestion,
} from '../lib/adaptiveQuestions'

// NOTE: Vite exposes env vars only with VITE_ prefix
const GEMINI_API_KEY = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY ?? ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`

const MAX_Q = 6
const MIN_Q = 4
const TIMEOUT_MS = 3000  // if Gemini takes >3s, use fallback immediately

export interface Turn {
  question: string
  answer: string
}

// Short, fast prompt — no fluff
function buildPrompt(history: Turn[]): string {
  const ctx = history.map((t, i) => `Q${i+1}: ${t.question}\nA: ${t.answer}`).join('\n')
  return `You are a rural India triage assistant helping an ASHA worker assess a patient. Ask questions in THIRD PERSON, referring to "the patient" or "they/their" — never use "you/your".
Based on this patient conversation, give ONE short follow-up question in third person.
Respond ONLY with JSON: {"question":"...","hint":"...","done":false}
Set done:true if you have severity(1-10), duration, and red-flag symptoms already answered (min ${MIN_Q} turns).

${ctx}

Next question JSON (third person, about the patient):`
}

async function callGemini(prompt: string): Promise<{ question: string; hint: string; done: boolean } | null> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 120,  // keep response tiny = fast
        },
      }),
    })

    clearTimeout(timer)
    if (!res.ok) return null

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null

    const parsed = JSON.parse(match[0]) as { question?: string; hint?: string; done?: boolean }
    if (!parsed.question) return null

    return { question: parsed.question, hint: parsed.hint ?? '', done: parsed.done ?? false }
  } catch {
    clearTimeout(timer)
    return null  // timeout or error → instant fallback
  }
}

export { FIRST_QUESTION }

export async function getNextQuestion(
  history: Turn[],
  firstAnswer: string
): Promise<AdaptiveQuestion | null> {
  if (history.length >= MAX_Q) return null

  const gemini = await callGemini(buildPrompt(history))

  if (gemini) {
    if (gemini.done && history.length >= MIN_Q) return null
    return { text: gemini.question, hint: gemini.hint }
  }

  // Instant fallback — no delay
  const fallback = getFollowUpQuestions(firstAnswer)
  const idx = history.length - 1
  return idx < fallback.length ? fallback[idx] : null
}

export { getAnalysingMessage }
