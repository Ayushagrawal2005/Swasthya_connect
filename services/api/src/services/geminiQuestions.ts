/**
 * Groq-powered Question Generation Service
 * Generates dynamic disease-specific questions and keyword suggestions
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'

if (!GROQ_API_KEY) {
  console.warn(
    '⚠️ Groq API key not found. Question generation will use fallback mode.'
  )
}

async function callGroq(
  prompt: string,
  maxTokens: number = 1000
): Promise<string | null> {
  if (!GROQ_API_KEY) return null

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a medical triage assistant helping rural healthcare workers. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', response.status, errorText)
      return null
    }

    const data: any = await response.json()

    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.error('Error calling Groq API:', error)
    return null
  }
}

// Language-specific system prompts for adaptive triage
const LANGUAGE_PROMPTS: Record<
  'en' | 'hi' | 'mr',
  { system: string; instruction: string }
> = {
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

    instruction:
      'Based on the conversation above, ask ONE specific follow-up question in English (third person). Respond with JSON: {"question":"...","hint":"...","done":false}'
  },

  hi: {
    system: `आप ग्रामीण भारत में एक आशा कार्यकर्ता की मदद करने वाले एक विशेषज्ञ चिकित्सा ट्राइएज सहायक हैं।

नियम:
1. प्रश्न तीसरे व्यक्ति में पूछें ("रोगी", "वे", "उनका" - कभी "आप" नहीं)
2. रोगी के नवीनतम उत्तर के आधार पर एक विशिष्ट अनुवर्ती प्रश्न बनाएं
3. बातचीत के संदर्भ में अपने प्रश्न को अनुकूलित करें - पैटर्न दोहराएं नहीं
4. प्रश्न छोटे और स्पष्ट रखें (10-15 शब्द अधिकतम)
5. केवल वैध JSON के साथ उत्तर दें`,

    instruction:
      'ऊपर की बातचीत के आधार पर, हिंदी में एक विशिष्ट अनुवर्ती प्रश्न पूछें (तीसरे व्यक्ति में)। JSON के साथ उत्तर दें: {"question":"...","hint":"...","done":false}'
  },

  mr: {
    system: `तुम्ही ग्रामीण भारतातील आशा कार्यकर्त्याला रुग्णाचे मूल्यमापन करण्यात मदत करणारे तज्ञ वैद्यकीय ट्रायएज सहाय्यक आहात.

नियम:
1. प्रश्न तृतीय व्यक्तीत विचारा ("रुग्ण", "ते", "त्यांचे" - कधीच "तुम्ही" नाही)
2. रुग्णाच्या नवीनतम उत्तरावर आधारित एक विशिष्ट पुढील प्रश्न तयार करा
3. संभाषणाच्या संदर्भात तुमचा प्रश्न जुळवा
4. प्रश्न लहान आणि स्पष्ट ठेवा (जास्तीत जास्त 10-15 शब्द)
5. फक्त वैध JSON सह उत्तर द्या`,

    instruction:
      'वरील संभाषणावर आधारित, मराठीत एक विशिष्ट पुढील प्रश्न विचारा (तृतीय व्यक्तीत). JSON सह उत्तर द्या: {"question":"...","hint":"...","done":false}'
  }
}

interface Turn {
  question: string
  answer: string
}

interface AdaptiveQuestion {
  text: string
  hint?: string
}

const MAX_QUESTIONS = 6
const MIN_QUESTIONS = 4

// Fallback questions if Groq is unavailable
const FALLBACK_QUESTIONS: AdaptiveQuestion[] = [
  {
    text: 'How long has the patient been experiencing these symptoms?',
    hint: 'Duration is important for urgency assessment'
  },
  {
    text: 'On a scale of 1-10, how severe is the discomfort?',
    hint: '1 = mild, 10 = unbearable'
  },
  {
    text: 'Are there any other symptoms the patient is experiencing?',
    hint: 'Associated symptoms help identify the condition'
  },
  {
    text: 'What makes the symptoms better or worse?',
    hint: 'Triggers and relief factors'
  },
  {
    text: 'Has the patient noticed any warning signs like bleeding or difficulty breathing?',
    hint: 'Red flags that need immediate attention'
  },
  {
    text: "How are these symptoms affecting the patient's daily activities?",
    hint: 'Impact on quality of life'
  }
]

/**
 * Generate adaptive triage question using Groq AI.
 * Falls back to predefined questions if AI is unavailable.
 */
export async function generateAdaptiveTriageQuestion(
  history: Turn[],
  firstAnswer: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<AdaptiveQuestion | null> {
  console.log(
    `🎯 Generating adaptive triage question (language: ${language}, history: ${history.length} turns)`
  )

  // Check if we have reached the maximum number of questions
  if (history.length >= MAX_QUESTIONS) {
    console.log('⏹️ Max questions reached')
    return null
  }

  try {
    const langPrompt = LANGUAGE_PROMPTS[language]

    const conversation = history
      .map(
        (turn, index) =>
          `Turn ${index + 1}:\nQuestion: ${turn.question}\nAnswer: ${turn.answer}`
      )
      .join('\n\n')

    const turnCount = history.length

    const guidance =
      turnCount === 1
        ? 'Ask about DURATION (how long)'
        : turnCount === 2
          ? 'Ask about SEVERITY (how bad/intense)'
          : turnCount === 3
            ? 'Ask about ASSOCIATED SYMPTOMS (what else)'
            : turnCount === 4
              ? 'Ask about TRIGGERS or PATTERNS'
              : turnCount === 5
                ? 'Ask about RED FLAG symptoms'
                : 'Ask about IMPACT on daily activities'

    const prompt = `${langPrompt.instruction}

CONVERSATION SO FAR:
${conversation}

LATEST ANSWER:
${firstAnswer}

GUIDANCE: ${guidance}

Generate the next question in third person and return JSON only.`

    const response = await callGroq(prompt, 250)

    if (response) {
      console.log('📝 Groq raw response:', response)

      const jsonMatch = response.match(/\{[\s\S]*?\}/)

      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0]
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/\n/g, ' ')
            .trim()

          const parsed = JSON.parse(jsonStr) as {
            question?: string
            hint?: string
            done?: boolean
          }

          if (parsed.question && parsed.question.length >= 5) {
            console.log('✅ Groq question generated:', parsed.question)

            if (parsed.done && history.length >= MIN_QUESTIONS) {
              console.log('✅ Groq indicates completion')
              return null
            }

            return {
              text: parsed.question,
              hint: parsed.hint || ''
            }
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError)
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error calling Groq:', error?.message || error)
  }

  // Fallback to predefined questions
  console.log('🔄 Using fallback questions')

  const index = history.length - 1
  const result =
    index >= 0 && index < FALLBACK_QUESTIONS.length
      ? FALLBACK_QUESTIONS[index]
      : null

  console.log('📤 Returning fallback:', result)

  return result
}

/**
 * Get analyzing message based on language.
 */
export function getAnalyzingMessage(
  language: 'en' | 'hi' | 'mr' = 'en'
): string {
  const messages = {
    en: 'Analyzing responses...',
    hi: 'उत्तरों का विश्लेषण किया जा रहा है...',
    mr: 'उत्तरांचे विश्लेषण करत आहे...'
  }

  return messages[language]
}

interface TriageQuestion {
  id: string
  condition: string | 'general'
  category: string
  question: string
  questionHi?: string
  questionMr?: string
  type: string
  options?: string[]
  optionsHi?: string[]
  optionsMr?: string[]
  required: boolean
  order: number
  redFlag?: boolean
  minValue?: number
  maxValue?: number
  unit?: string
}

// Simplified question bank.
// The full version is available in the frontend.
const triageQuestionBank: TriageQuestion[] = []

interface TriageQuestionResponse {
  questionId: string
  answer: string | string[] | number | boolean
  answeredAt: string
}

/**
 * Get questions for a specific condition from the question bank.
 */
function getQuestionsForCondition(
  condition: string,
  maxQuestions: number = 7
): TriageQuestion[] {
  void condition
  void maxQuestions
  void triageQuestionBank

  // Backend will use Groq to select questions.
  return []
}

/**
 * Generate dynamic questions based on condition and chief complaint.
 */
export async function generateDynamicQuestions(
  condition: string,
  chiefComplaint: string,
  existingAnswers: TriageQuestionResponse[] = [],
  maxQuestions: number = 7,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<any[]> {
  void existingAnswers
  void getQuestionsForCondition

  try {
    const languageInstruction =
      language === 'hi'
        ? 'Provide questions in both English and Hindi (Devanagari script)'
        : language === 'mr'
          ? 'Provide questions in both English and Marathi (Devanagari script)'
          : 'Provide questions in English'

    const prompt = `You are a medical triage assistant. Generate ${maxQuestions} relevant medical assessment questions for:

Condition: ${condition}
Chief Complaint: ${chiefComplaint}
${languageInstruction}

Generate questions that:
1. Assess symptom severity and duration
2. Identify red flags and life-threatening conditions
3. Check vital signs if relevant
4. Explore relevant medical history
5. Are appropriate for rural healthcare workers to ask

Return ONLY a JSON array with this structure:
[
  {
    "id": "unique-question-id",
    "question": "Question text in English",
    "type": "yes-no",
    "options": ["option1", "option2"],
    "required": true,
    "redFlag": false,
    "priority": 1
  }
]

The type must be one of:
"yes-no", "single", "multi", "text", or "number".

Only include options when the type is "single" or "multi".
Priority must be a number from 1 to 10.
Focus on clinically relevant questions.
Keep the language simple.`

    const response = await callGroq(prompt, 2000)

    if (!response) {
      console.warn('Groq API unavailable')
      return []
    }

    const jsonMatch = response.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      console.warn('Groq did not return valid JSON')
      return []
    }

    const questions = JSON.parse(jsonMatch[0])

    if (!Array.isArray(questions)) {
      console.warn('Groq response is not an array')
      return []
    }

    return questions.slice(0, maxQuestions)
  } catch (error) {
    console.error('Error generating dynamic questions:', error)
    return []
  }
}

/**
 * Generate keyword suggestions for symptom assessment.
 */
export async function generateKeywordSuggestions(
  condition: string,
  chiefComplaint: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<{
  keywords: string[]
  relatedTerms: string[]
  suggestedQuestions: string[]
}> {
  try {
    const languageInstruction =
      language === 'hi'
        ? 'Provide responses in Hindi (Devanagari script)'
        : language === 'mr'
          ? 'Provide responses in Marathi (Devanagari script)'
          : 'Provide responses in English'

    const prompt = `You are a medical terminology assistant for a rural health worker conducting patient triage.

Condition: ${condition}
Chief Complaint: ${chiefComplaint}
${languageInstruction}

Generate:
1. 8-10 medical keywords related to this condition that a health worker should look for
2. 6-8 related terms patients might use to describe symptoms
3. 4-5 follow-up questions a health worker should ask

Respond ONLY in this JSON format:
{
  "keywords": ["keyword1", "keyword2"],
  "relatedTerms": ["term1", "term2"],
  "suggestedQuestions": ["question1", "question2"]
}

Keywords should be common symptom descriptors.
Related terms should be layman's language.
Questions should be open-ended.`

    const response = await callGroq(prompt, 1500)

    if (!response) {
      return getFallbackKeywords(condition, language)
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.warn('Groq did not return valid JSON for keywords')
      return getFallbackKeywords(condition, language)
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      relatedTerms: Array.isArray(parsed.relatedTerms)
        ? parsed.relatedTerms
        : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions
        : []
    }
  } catch (error) {
    console.error('Error generating keywords:', error)
    return getFallbackKeywords(condition, language)
  }
}

export async function generateTriageSummary(
  patientAge: number,
  patientGender: string,
  chiefComplaint: string,
  selectedConditions: string[],
  answers: TriageQuestionResponse[],
  history: any,
  allergies: any[],
  medications: any[],
  vitals: any,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<{
  summaryText: string
  keyFindings: string[]
  redFlags: string[]
  confidence: number
}> {
  try {
    const languageInstruction =
      language === 'hi'
        ? 'Write the summary in Hindi (Devanagari script)'
        : language === 'mr'
          ? 'Write the summary in Marathi (Devanagari script)'
          : 'Write the summary in English'

    const formattedAnswers = answers
      .map((answer) => {
        return `Q: ${answer.questionId} - A: ${JSON.stringify(answer.answer)}`
      })
      .join('\n')

    const prompt = `You are a medical triage assistant. Generate a concise clinical summary for a doctor.
${languageInstruction}

Patient: ${patientAge}-year-old ${patientGender}
Chief Complaint: ${chiefComplaint}
Suspected Conditions: ${selectedConditions.join(', ')}

Triage Answers:
${formattedAnswers}

${vitals ? `Vitals: ${JSON.stringify(vitals)}` : ''}
${history?.medical?.length ? `Medical History: ${history.medical.join(', ')}` : ''}
${history?.personal?.length ? `Personal History: ${history.personal.join(', ')}` : ''}
${history?.family?.length ? `Family History: ${history.family.join(', ')}` : ''}
${
  allergies?.length
    ? `Allergies: ${allergies.map((allergy: any) => allergy.name).join(', ')}`
    : 'No known allergies'
}
${
  medications?.length
    ? `Current Medications: ${medications.map((medication: any) => medication.medicineName).join(', ')}`
    : 'Not taking any medication'
}

Generate a summary in this JSON format:
{
  "summaryText": "2-3 sentence clinical summary for doctor",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "redFlags": ["flag1", "flag2"],
  "confidence": 0.85
}

The summary should be:
- Professional and concise, with a maximum of 3-4 sentences
- Highlight red flags prominently
- Mention relevant history and current medications
- Suitable for quick doctor review
- NOT a diagnosis; it is assistive only

Mark confidence lower if information is incomplete or contradictory.`

    const response = await callGroq(prompt, 1500)

    if (!response) {
      return generateRuleBasedSummary(
        patientAge,
        patientGender,
        chiefComplaint,
        selectedConditions,
        answers,
        history,
        allergies,
        medications,
        vitals
      )
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.warn('Groq did not return valid JSON for summary')

      return generateRuleBasedSummary(
        patientAge,
        patientGender,
        chiefComplaint,
        selectedConditions,
        answers,
        history,
        allergies,
        medications,
        vitals
      )
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      summaryText: parsed.summaryText || '',
      keyFindings: Array.isArray(parsed.keyFindings)
        ? parsed.keyFindings
        : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      confidence:
        typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    }
  } catch (error) {
    console.error('Error generating triage summary:', error)

    return generateRuleBasedSummary(
      patientAge,
      patientGender,
      chiefComplaint,
      selectedConditions,
      answers,
      history,
      allergies,
      medications,
      vitals
    )
  }
}

/**
 * Fallback keyword suggestions when Groq is unavailable.
 */
function getFallbackKeywords(
  condition: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): {
  keywords: string[]
  relatedTerms: string[]
  suggestedQuestions: string[]
} {
  const fallbacks: Record<string, any> = {
    hypertension: {
      en: {
        keywords: [
          'headache',
          'dizziness',
          'blurred vision',
          'nosebleed',
          'chest pain',
          'palpitations',
          'fatigue',
          'shortness of breath'
        ],
        relatedTerms: [
          'high BP',
          'blood pressure problem',
          'head feels heavy',
          'seeing spots',
          'tired easily',
          'heart beating fast'
        ],
        suggestedQuestions: [
          'When did the symptoms start?',
          'Has the patient checked their blood pressure recently?',
          'Is the patient taking medication regularly?',
          'Does the patient feel worse at any particular time?'
        ]
      },
      hi: {
        keywords: [
          'सिरदर्द',
          'चक्कर',
          'धुंधली दृष्टि',
          'नाक से खून',
          'सीने में दर्द',
          'धड़कन',
          'थकान',
          'सांस फूलना'
        ],
        relatedTerms: [
          'उच्च बीपी',
          'रक्तचाप की समस्या',
          'सिर भारी लगना',
          'धब्बे दिखना',
          'जल्दी थकना',
          'दिल तेज धड़कना'
        ],
        suggestedQuestions: [
          'लक्षण कब शुरू हुए?',
          'क्या रोगी ने हाल में रक्तचाप जांचा है?',
          'क्या रोगी नियमित रूप से दवा ले रहा है?',
          'क्या किसी विशेष समय पर ज्यादा परेशानी होती है?'
        ]
      }
    },

    diabetes: {
      en: {
        keywords: [
          'frequent urination',
          'excessive thirst',
          'fatigue',
          'blurred vision',
          'slow healing',
          'numbness',
          'weight loss',
          'increased hunger'
        ],
        relatedTerms: [
          'sugar problem',
          'urinating a lot',
          'always thirsty',
          'wounds not healing',
          'feet feel numb',
          'losing weight'
        ],
        suggestedQuestions: [
          'When did the patient last check their blood sugar?',
          'Is the patient following their diet plan?',
          'Has the patient noticed any wounds or cuts?',
          'Does the patient have tingling in their hands or feet?'
        ]
      },
      hi: {
        keywords: [
          'बार-बार पेशाब',
          'अत्यधिक प्यास',
          'थकान',
          'धुंधली दृष्टि',
          'घाव धीरे ठीक होना',
          'सुन्नता',
          'वजन घटना',
          'भूख बढ़ना'
        ],
        relatedTerms: [
          'शुगर की समस्या',
          'बहुत पेशाब आना',
          'हमेशा प्यास लगना',
          'घाव नहीं भरना',
          'पैर सुन्न होना',
          'वजन कम होना'
        ],
        suggestedQuestions: [
          'रोगी ने आखिरी बार रक्त शर्करा कब जांची?',
          'क्या रोगी अपने आहार योजना का पालन कर रहा है?',
          'क्या रोगी ने कोई घाव या कट देखा है?',
          'क्या रोगी के हाथ या पैर में झुनझुनी है?'
        ]
      }
    },

    pregnancy: {
      en: {
        keywords: [
          'bleeding',
          'cramping',
          'swelling',
          'headache',
          'fetal movement',
          'contractions',
          'water breaking',
          'high BP'
        ],
        relatedTerms: [
          'spotting',
          'baby not moving',
          'feet swollen',
          'stomach pain',
          'water leak',
          'labor pains'
        ],
        suggestedQuestions: [
          'How many weeks pregnant is the patient?',
          'Has the patient felt the baby move today?',
          'Does the patient have any bleeding or discharge?',
          'Is this the patient’s first pregnancy?'
        ]
      },
      hi: {
        keywords: [
          'रक्तस्राव',
          'दर्द',
          'सूजन',
          'सिरदर्द',
          'भ्रूण की गति',
          'संकुचन',
          'पानी टूटना',
          'उच्च बीपी'
        ],
        relatedTerms: [
          'धब्बे',
          'बच्चा नहीं हिल रहा',
          'पैर सूजे हुए',
          'पेट दर्द',
          'पानी रिसना',
          'प्रसव पीड़ा'
        ],
        suggestedQuestions: [
          'रोगी कितने सप्ताह की गर्भवती है?',
          'क्या रोगी ने आज बच्चे को हिलते महसूस किया?',
          'क्या कोई रक्तस्राव या स्राव है?',
          'क्या यह रोगी की पहली गर्भावस्था है?'
        ]
      }
    },

    respiratory: {
      en: {
        keywords: [
          'cough',
          'fever',
          'breathlessness',
          'chest pain',
          'sputum',
          'wheezing',
          'sore throat',
          'body ache'
        ],
        relatedTerms: [
          'difficulty breathing',
          "can't catch breath",
          'coughing up mucus',
          'chest feels tight',
          'running fever',
          'throat pain'
        ],
        suggestedQuestions: [
          'How long has the patient had these symptoms?',
          'Does the patient have difficulty breathing?',
          'What color is the patient’s sputum?',
          'Has the patient been in contact with anyone sick?'
        ]
      },
      hi: {
        keywords: [
          'खांसी',
          'बुखार',
          'सांस फूलना',
          'सीने में दर्द',
          'बलगम',
          'घरघराहट',
          'गले में खराश',
          'शरीर दर्द'
        ],
        relatedTerms: [
          'सांस लेने में कठिनाई',
          'सांस नहीं आ रही',
          'बलगम निकल रहा',
          'सीने में जकड़न',
          'बुखार आ रहा',
          'गला दुख रहा'
        ],
        suggestedQuestions: [
          'रोगी को ये लक्षण कब से हैं?',
          'क्या सांस लेने में कठिनाई है?',
          'रोगी का बलगम किस रंग का है?',
          'क्या रोगी किसी बीमार व्यक्ति के संपर्क में रहा है?'
        ]
      }
    }
  }

  return (
    fallbacks[condition]?.[language] ||
    fallbacks[condition]?.en || {
      keywords: [],
      relatedTerms: [],
      suggestedQuestions: []
    }
  )
}

/**
 * Rule-based summary generation when Groq is unavailable.
 */
function generateRuleBasedSummary(
  patientAge: number,
  patientGender: string,
  chiefComplaint: string,
  selectedConditions: string[],
  answers: TriageQuestionResponse[],
  history: any,
  allergies: any[],
  medications: any[],
  vitals: any
): {
  summaryText: string
  keyFindings: string[]
  redFlags: string[]
  confidence: number
} {
  const keyFindings: string[] = []
  const redFlags: string[] = []

  // Extract key vitals
  if (vitals) {
    if (vitals.temperature && vitals.temperature > 100) {
      keyFindings.push(`Fever: ${vitals.temperature}°F`)
    }

    if (vitals.bloodPressure) {
      keyFindings.push(`BP: ${vitals.bloodPressure}`)
    }

    if (vitals.spO2 && vitals.spO2 < 95) {
      keyFindings.push(`SpO2: ${vitals.spO2}%`)
    }

    if (vitals.bloodSugar && vitals.bloodSugar > 200) {
      keyFindings.push(`Blood Sugar: ${vitals.bloodSugar} mg/dL`)
    }
  }

  // Extract key history
  if (history?.medical?.length) {
    keyFindings.push(
      `Medical history: ${history.medical.slice(0, 3).join(', ')}`
    )
  }

  if (medications?.length) {
    keyFindings.push(`Current medications: ${medications.length} active`)
  }

  if (allergies?.length) {
    keyFindings.push(
      `Allergies: ${allergies.map((allergy: any) => allergy.name).join(', ')}`
    )
  }

  // Check for potentially concerning answers
  answers.forEach((answer) => {
    const answerValue = answer.answer

    if (
      answerValue === true ||
      answerValue === 'yes' ||
      (typeof answerValue === 'string' &&
        answerValue.toLowerCase().includes('severe'))
    ) {
      redFlags.push('Concerning symptom reported')
    }
  })

  const summaryText = `${patientAge}-year-old ${patientGender} reports ${chiefComplaint}. ${
    selectedConditions.length
      ? `Suspected: ${selectedConditions.join(', ')}. `
      : ''
  }${
    redFlags.length
      ? `⚠️ Red flags: ${redFlags.length} identified. `
      : ''
  }${
    history?.medical?.length
      ? `History includes ${history.medical.slice(0, 2).join(', ')}. `
      : ''
  }${
    medications?.length
      ? `Currently on ${medications.length} medication(s). `
      : 'Not on medication. '
  }${
    allergies?.length
      ? `Known allergies: ${allergies
          .map((allergy: any) => allergy.name)
          .join(', ')}.`
      : 'No known allergies.'
  }`

  return {
    summaryText,
    keyFindings,
    redFlags,
    confidence: redFlags.length > 0 ? 0.7 : 0.8
  }
}