/**
 * Groq adaptive triage — fast, short prompts, instant fallback
 */
import {
  FIRST_QUESTION,
  getFollowUpQuestions,
  getAnalysingMessage,
  type AdaptiveQuestion,
} from '../lib/adaptiveQuestions'

// NOTE: Vite exposes env vars only with VITE_ prefix
const GROQ_API_KEY = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GROQ_API_KEY ?? ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const MAX_Q = 6
const MIN_Q = 4
const TIMEOUT_MS = 3000  // if Groq takes >3s, use fallback immediately

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

async function callGroq(prompt: string): Promise<{ question: string; hint: string; done: boolean } | null> {
  if (!GROQ_API_KEY || GROQ_API_KEY.length < 10) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a rural India triage assistant helping an ASHA worker assess a patient. Ask questions in THIRD PERSON, referring to "the patient" or "they/their" — never use "you/your". Respond ONLY with JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 120
      }),
    })

    clearTimeout(timer)
    if (!res.ok) return null

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw = data.choices?.[0]?.message?.content ?? ''
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

  const groq = await callGroq(buildPrompt(history))

  if (groq) {
    if (groq.done && history.length >= MIN_Q) return null
    return { text: groq.question, hint: groq.hint }
  }

  // Instant fallback — no delay
  const fallback = getFollowUpQuestions(firstAnswer)
  const idx = history.length - 1
  return idx < fallback.length ? fallback[idx] : null
}

export { getAnalysingMessage }
