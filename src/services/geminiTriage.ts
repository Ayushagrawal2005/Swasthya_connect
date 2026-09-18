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
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const MAX_Q = 6
const MIN_Q = 4
const TIMEOUT_MS = 8000  // if Groq takes >8s, use fallback immediately

console.log('🔧 Groq Triage Service Initialized')
console.log('📍 API URL:', GROQ_URL)
console.log('🔑 API Key present:', !!GROQ_API_KEY && GROQ_API_KEY.length > 10)
console.log('🔑 API Key preview:', GROQ_API_KEY ? GROQ_API_KEY.substring(0, 15) + '...' : 'MISSING')

export interface Turn {
  question: string
  answer: string
}

// Language-specific system prompts
const LANGUAGE_PROMPTS = {
  en: {
    system: `You are an expert medical triage assistant helping an ASHA worker in rural India assess a patient.

RULES:
1. Ask questions in THIRD PERSON (refer to "the patient", "they", "their" - NEVER "you/your")
2. Generate ONE specific follow-up question based on the patient's LATEST answer
3. Adapt your question to the conversation context - don't repeat patterns
4. Keep questions SHORT and CLEAR (10-15 words max)
5. Respond ONLY with valid JSON

WHAT TO ASK:
- Q1: Duration/timeline (how long, when started)
- Q2: Severity/intensity (mild/moderate/severe, pain scale)  
- Q3: Associated symptoms (what else they feel)
- Q4: Triggers/patterns (what makes it worse/better)
- Q5: Red flags (danger signs like bleeding, difficulty breathing)
- Q6: Impact on daily life (can they eat, work, sleep)

Vary your approach based on their chief complaint.`,
    instruction: 'Based on the conversation above, ask ONE specific follow-up question in English (third person). Respond with JSON: {"question":"...","hint":"...","done":false}'
  },
  hi: {
    system: `आप ग्रामीण भारत में एक आशा कार्यकर्ता की मदद करने वाले एक विशेषज्ञ चिकित्सा ट्राइएज सहायक हैं।

नियम:
1. प्रश्न तीसरे व्यक्ति में पूछें ("रोगी", "वे", "उनका" - कभी "आप" नहीं)
2. रोगी के नवीनतम उत्तर के आधार पर एक विशिष्ट अनुवर्ती प्रश्न बनाएं
3. बातचीत के संदर्भ में अपने प्रश्न को अनुकूलित करें - पैटर्न दोहराएं नहीं
4. प्रश्न छोटे और स्पष्ट रखें (10-15 शब्द अधिकतम)
5. केवल वैध JSON के साथ उत्तर दें

क्या पूछें:
- प्र1: अवधि/समयरेखा (कब से, कितने दिन)
- प्र2: गंभीरता/तीव्रता (हल्का/मध्यम/गंभीर, दर्द पैमाना)
- प्र3: संबद्ध लक्षण (और क्या महसूस होता है)
- प्र4: ट्रिगर/पैटर्न (क्या बदतर/बेहतर बनाता है)
- प्र5: खतरे के संकेत (रक्तस्राव, सांस लेने में कठिनाई)
- प्र6: दैनिक जीवन पर प्रभाव (खा सकते हैं, काम कर सकते हैं)

मुख्य शिकायत के आधार पर अपना दृष्टिकोण बदलें।`,
    instruction: 'ऊपर की बातचीत के आधार पर, हिंदी में एक विशिष्ट अनुवर्ती प्रश्न पूछें (तीसरे व्यक्ति में)। JSON के साथ उत्तर दें: {"question":"...","hint":"...","done":false}'
  },
  mr: {
    system: `तुम्ही ग्रामीण भारतातील आशा कार्यकर्त्याला रुग्णाचे मूल्यमापन करण्यात मदत करणारे तज्ञ वैद्यकीय ट्रायएज सहाय्यक आहात.

नियम:
1. प्रश्न तृतीय व्यक्तीत विचारा ("रुग्ण", "ते", "त्यांचे" - कधीच "तुम्ही" नाही)
2. रुग्णाच्या नवीनतम उत्तरावर आधारित एक विशिष्ट पुढील प्रश्न तयार करा
3. संभाषणाच्या संदर्भात तुमचा प्रश्न जुळवा - पॅटर्न पुनरावृत्ती करू नका
4. प्रश्न लहान आणि स्पष्ट ठेवा (जास्तीत जास्त 10-15 शब्द)
5. फक्त वैध JSON सह उत्तर द्या

काय विचारायचे:
- प्र1: कालावधी/वेळरेखा (किती दिवस, केव्हा सुरू झाले)
- प्र2: तीव्रता (सौम्य/मध्यम/गंभीर, वेदना स्केल)
- प्र3: संबंधित लक्षणे (आणखी काय जाणवते)
- प्र4: ट्रिगर/पॅटर्न (काय वाईट/चांगले करते)
- प्र5: धोक्याची चिन्हे (रक्तस्त्राव, श्वास घेण्यास त्रास)
- प्र6: दैनंदिन जीवनावर परिणाम (खाऊ शकतात, काम करू शकतात)

मुख्य तक्रारीवर आधारित तुमचा दृष्टीकोन बदला.`,
    instruction: 'वरील संभाषणावर आधारित, मराठीत एक विशिष्ट पुढील प्रश्न विचारा (तृतीय व्यक्तीत). JSON सह उत्तर द्या: {"question":"...","hint":"...","done":false}'
  }
}

// Build dynamic prompt with conversation context
function buildPrompt(history: Turn[], language: 'en' | 'hi' | 'mr' = 'en'): string {
  const langPrompt = LANGUAGE_PROMPTS[language]
  
  // Format conversation history
  const conversation = history.map((t, i) => 
    `Turn ${i+1}:\nQuestion: ${t.question}\nAnswer: ${t.answer}`
  ).join('\n\n')
  
  // Determine what's been asked so far
  const turnCount = history.length
  const guidance = turnCount === 1 ? 'Ask about DURATION (how long)' :
                   turnCount === 2 ? 'Ask about SEVERITY (how bad/intense)' :
                   turnCount === 3 ? 'Ask about ASSOCIATED SYMPTOMS (what else)' :
                   turnCount === 4 ? 'Ask about TRIGGERS or PATTERNS' :
                   turnCount === 5 ? 'Ask about RED FLAG symptoms' :
                   'Ask about IMPACT on daily activities'
  
  return `${langPrompt.instruction}

CONVERSATION SO FAR:
${conversation}

GUIDANCE: ${guidance}

Generate next question (third person, JSON only):`
}

async function callGroq(prompt: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<{ question: string; hint: string; done: boolean } | null> {
  console.log('🔄 callGroq() started')
  console.log('🌐 Language:', language)
  console.log('🔑 API Key check:', !!GROQ_API_KEY, 'Length:', GROQ_API_KEY?.length || 0)
  
  if (!GROQ_API_KEY || GROQ_API_KEY.length < 10) {
    console.warn('⚠️ No valid Groq API key - using fallback')
    return null
  }

  const controller = new AbortController()
  const timer = setTimeout(() => {
    console.warn('⏱️ Groq timeout - aborting')
    controller.abort()
  }, TIMEOUT_MS)

  const langPrompt = LANGUAGE_PROMPTS[language]

  try {
    console.log('📡 Calling Groq API...', GROQ_URL)
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
            content: langPrompt.system
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,  // Higher for more variety and creativity
        max_tokens: 250    // Enough for complete JSON response
      }),
    })

    clearTimeout(timer)
    console.log('📊 Groq response status:', res.status, res.statusText)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('❌ Groq API error:', res.status, errorText)
      return null
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    
    console.log('📦 Groq raw response:', data)
    const raw = data.choices?.[0]?.message?.content ?? ''
    console.log('📝 Groq content:', raw)
    
    // Try to extract JSON - be more flexible with matching
    // First try to find a complete JSON object
    let match = raw.match(/\{[\s\S]*?\}/)
    if (!match) {
      console.warn('⚠️ No complete JSON found in Groq response')
      console.log('🔍 Raw content length:', raw.length)
      return null
    }

    let parsed: { question?: string; hint?: string; done?: boolean }
    try {
      // Clean up the JSON string - remove any trailing commas before closing braces
      let jsonStr = match[0]
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/\n/g, ' ')             // Replace newlines with spaces
        .trim()
      
      parsed = JSON.parse(jsonStr)
      console.log('✅ Parsed Groq response:', parsed)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.log('🔍 Attempted to parse:', match[0].substring(0, 200))
      
      // Try a more aggressive cleanup
      try {
        // Extract just question and hint fields manually as fallback
        const questionMatch = raw.match(/"question"\s*:\s*"([^"]+)"/)
        const hintMatch = raw.match(/"hint"\s*:\s*"([^"]*)"/)
        const doneMatch = raw.match(/"done"\s*:\s*(true|false)/)
        
        if (questionMatch) {
          parsed = {
            question: questionMatch[1],
            hint: hintMatch?.[1] || '',
            done: doneMatch?.[1] === 'true'
          }
          console.log('✅ Manually extracted:', parsed)
        } else {
          return null
        }
      } catch {
        return null
      }
    }
    
    if (!parsed.question || parsed.question.length < 5) {
      console.warn('⚠️ Invalid or too short question in parsed response:', parsed.question)
      return null
    }

    return { question: parsed.question, hint: parsed.hint ?? '', done: parsed.done ?? false }
  } catch (err) {
    clearTimeout(timer)
    console.error('❌ Groq error:', err)
    return null  // timeout or error → instant fallback
  }
}

export { FIRST_QUESTION }

export async function getNextQuestion(
  history: Turn[],
  firstAnswer: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<AdaptiveQuestion | null> {
  console.log('🎯 getNextQuestion() called')
  console.log('📊 History length:', history.length, '/', MAX_Q)
  console.log('📝 First answer:', firstAnswer)
  console.log('🌐 Language:', language)
  
  if (history.length >= MAX_Q) {
    console.log('⏹️ Max questions reached')
    return null
  }

  console.log('🚀 Attempting Groq API call...')
  const groq = await callGroq(buildPrompt(history, language), language)

  if (groq) {
    console.log('✅ Groq returned:', groq)
    if (groq.done && history.length >= MIN_Q) {
      console.log('✅ Groq says done, ending questions')
      return null
    }
    return { text: groq.question, hint: groq.hint }
  }

  // Instant fallback — no delay
  console.log('🔄 Using fallback questions')
  const fallback = getFollowUpQuestions(firstAnswer)
  const idx = history.length - 1
  console.log('📋 Fallback index:', idx, '/', fallback.length)
  
  const result = idx < fallback.length ? fallback[idx] : null
  console.log('📤 Returning:', result)
  return result
}

export { getAnalysingMessage }
