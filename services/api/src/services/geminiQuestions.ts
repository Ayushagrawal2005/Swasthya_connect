/**
 * Groq-powered Question Generation Service
 * Generates dynamic disease-specific questions and keyword suggestions
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

if (!GROQ_API_KEY) {
  console.warn('⚠️  Groq API key not found. Question generation will use fallback mode.')
}

async function callGroq(prompt: string, maxTokens: number = 1000): Promise<string | null> {
  if (!GROQ_API_KEY) return null

  try {
    const response = await fetch(GROQ_API_URL, {
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
            content: 'You are a medical triage assistant helping rural healthcare workers. Respond only with valid JSON.'
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
      console.error('Groq API error:', response.status)
      return null
    }

    const data: any = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.error('Error calling Groq API:', error)
    return null
  }
}

// Import question bank (we'll copy the relevant parts here for backend use)
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

// Simplified question bank (full version is in frontend)
const triageQuestionBank: TriageQuestion[] = []

interface TriageQuestionResponse {
  questionId: string
  answer: string | string[] | number | boolean
  answeredAt: string
}

/**
 * Get questions for a specific condition from question bank
 * This is a simplified version - frontend has full question bank
 */
function getQuestionsForCondition(condition: string, maxQuestions: number = 7): TriageQuestion[] {
  return []  // Backend will use Gemini to select questions
}

/**
 * Generate dynamic questions based on condition and chief complaint
 * Uses Gemini to generate relevant questions
 */
export async function generateDynamicQuestions(
  condition: string,
  chiefComplaint: string,
  existingAnswers: TriageQuestionResponse[] = [],
  maxQuestions: number = 7,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<any[]> {
  try {
    const languageInstruction = language === 'hi'
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
2. Identify red flags (life-threatening conditions)
3. Check vital signs if relevant
4. Explore medical history relevance
5. Are appropriate for rural healthcare workers to ask

Return ONLY a JSON array with this structure:
[
  {
    "id": "unique-question-id",
    "question": "Question text in English",
    "type": "yes-no" | "single" | "multi" | "text" | "number",
    "options": ["option1", "option2"] (if type is single or multi),
    "required": true | false,
    "redFlag": true | false,
    "priority": 1-10 (higher = more important)
  }
]

Focus on clinically relevant questions. Keep language simple.`

    const response = await callGroq(prompt, 2000)
    if (!response) {
      console.warn('Groq API unavailable')
      return []
    }
    
    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) {
      console.warn('Groq did not return valid JSON')
      return []
    }
    
    const questions = JSON.parse(jsonMatch[0])
    return questions.slice(0, maxQuestions)
  } catch (error) {
    console.error('Error generating dynamic questions:', error)
    return []
  }
}

/**
 * Generate keyword suggestions for symptom assessment
 * Helps patient/ASHA describe symptoms with medical terminology
 */
export async function generateKeywordSuggestions(
  condition: string,
  chiefComplaint: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<{ keywords: string[], relatedTerms: string[], suggestedQuestions: string[] }> {
  try {
    const languageInstruction = language === 'hi' 
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
  "keywords": ["keyword1", "keyword2", ...],
  "relatedTerms": ["term1", "term2", ...],
  "suggestedQuestions": ["question1", "question2", ...]
}

Keywords should be common symptom descriptors. Related terms should be layman's language. Questions should be open-ended.`

    const response = await callGroq(prompt, 1500)
    if (!response) {
      return getFallbackKeywords(condition, language)
    }
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.warn('Groq did not return valid JSON for keywords')
      return getFallbackKeywords(condition, language)
    }
    
    return JSON.parse(jsonMatch[0])
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
): Promise<{ summaryText: string, keyFindings: string[], redFlags: string[], confidence: number }> {
  try {
    const languageInstruction = language === 'hi'
      ? 'Write the summary in Hindi (Devanagari script)'
      : language === 'mr'
      ? 'Write the summary in Marathi (Devanagari script)'
      : 'Write the summary in English'
    
    // Format answers
    const formattedAnswers = answers.map(a => {
      return `Q: ${a.questionId} - A: ${JSON.stringify(a.answer)}`
    }).join('\n')
    
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
${allergies?.length ? `Allergies: ${allergies.map((a: any) => a.name).join(', ')}` : 'No known allergies'}
${medications?.length ? `Current Medications: ${medications.map((m: any) => m.medicineName).join(', ')}` : 'Not taking any medication'}

Generate a summary in this JSON format:
{
  "summaryText": "2-3 sentence clinical summary for doctor",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "redFlags": ["flag1", "flag2"],
  "confidence": 0.85
}

The summary should be:
- Professional and concise (max 3-4 sentences)
- Highlight red flags prominently
- Mention relevant history and current medications
- Suitable for quick doctor review
- NOT a diagnosis (assistive only)

Mark confidence lower if information is incomplete or contradictory.`

    const response = await callGroq(prompt, 1500)
    if (!response) {
      return generateRuleBasedSummary(patientAge, patientGender, chiefComplaint, selectedConditions, answers, history, allergies, medications, vitals)
    }
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.warn('Groq did not return valid JSON for summary')
      return generateRuleBasedSummary(patientAge, patientGender, chiefComplaint, selectedConditions, answers, history, allergies, medications, vitals)
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error generating triage summary:', error)
    return generateRuleBasedSummary(patientAge, patientGender, chiefComplaint, selectedConditions, answers, history, allergies, medications, vitals)
  }
}

/**
 * Fallback keyword suggestions when Gemini is unavailable
 */
function getFallbackKeywords(condition: string, language: 'en' | 'hi' | 'mr' = 'en'): { keywords: string[], relatedTerms: string[], suggestedQuestions: string[] } {
  const fallbacks: Record<string, any> = {
    hypertension: {
      en: {
        keywords: ['headache', 'dizziness', 'blurred vision', 'nosebleed', 'chest pain', 'palpitations', 'fatigue', 'shortness of breath'],
        relatedTerms: ['high BP', 'blood pressure problem', 'head feels heavy', 'seeing spots', 'tired easily', 'heart beating fast'],
        suggestedQuestions: ['When did the symptoms start?', 'Have you checked your blood pressure recently?', 'Are you taking your medication regularly?', 'Do you feel worse at any particular time?']
      },
      hi: {
        keywords: ['सिरदर्द', 'चक्कर', 'धुंधली दृष्टि', 'नाक से खून', 'सीने में दर्द', 'धड़कन', 'थकान', 'सांस फूलना'],
        relatedTerms: ['उच्च बीपी', 'रक्तचाप की समस्या', 'सिर भारी लगना', 'धब्बे दिखना', 'जल्दी थकना', 'दिल तेज धड़कना'],
        suggestedQuestions: ['लक्षण कब शुरू हुए?', 'क्या आपने हाल में रक्तचाप जांचा है?', 'क्या आप नियमित रूप से दवा ले रहे हैं?', 'क्या किसी विशेष समय पर ज्यादा परेशानी होती है?']
      }
    },
    diabetes: {
      en: {
        keywords: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision', 'slow healing', 'numbness', 'weight loss', 'increased hunger'],
        relatedTerms: ['sugar problem', 'urinating a lot', 'always thirsty', 'wounds not healing', 'feet feel numb', 'losing weight'],
        suggestedQuestions: ['When did you last check your blood sugar?', 'Are you following your diet plan?', 'Have you noticed any wounds or cuts?', 'Do you have tingling in your hands or feet?']
      },
      hi: {
        keywords: ['बार-बार पेशाब', 'अत्यधिक प्यास', 'थकान', 'धुंधली दृष्टि', 'घाव धीरे ठीक होना', 'सुन्नता', 'वजन घटना', 'भूख बढ़ना'],
        relatedTerms: ['शुगर की समस्या', 'बहुत पेशाब आना', 'हमेशा प्यास लगना', 'घाव नहीं भरना', 'पैर सुन्न होना', 'वजन कम होना'],
        suggestedQuestions: ['आपने आखिरी बार रक्त शर्करा कब जांची?', 'क्या आप अपने आहार योजना का पालन कर रहे हैं?', 'क्या आपने कोई घाव या कट देखा है?', 'क्या आपके हाथ या पैर में झुनझुनी है?']
      }
    },
    pregnancy: {
      en: {
        keywords: ['bleeding', 'cramping', 'swelling', 'headache', 'fetal movement', 'contractions', 'water breaking', 'high BP'],
        relatedTerms: ['spotting', 'baby not moving', 'feet swollen', 'stomach pain', 'water leak', 'labor pains'],
        suggestedQuestions: ['How many weeks pregnant are you?', 'Have you felt the baby move today?', 'Do you have any bleeding or discharge?', 'Is this your first pregnancy?']
      },
      hi: {
        keywords: ['रक्तस्राव', 'दर्द', 'सूजन', 'सिरदर्द', 'भ्रूण की गति', 'संकुचन', 'पानी टूटना', 'उच्च बीपी'],
        relatedTerms: ['धब्बे', 'बच्चा नहीं हिल रहा', 'पैर सूजे हुए', 'पेट दर्द', 'पानी रिसना', 'प्रसव पीड़ा'],
        suggestedQuestions: ['आप कितने सप्ताह की गर्भवती हैं?', 'क्या आपने आज बच्चे को हिलते महसूस किया?', 'क्या कोई रक्तस्राव या स्राव है?', 'क्या यह आपकी पहली गर्भावस्था है?']
      }
    },
    respiratory: {
      en: {
        keywords: ['cough', 'fever', 'breathlessness', 'chest pain', 'sputum', 'wheezing', 'sore throat', 'body ache'],
        relatedTerms: ['difficulty breathing', 'can\'t catch breath', 'coughing up mucus', 'chest feels tight', 'running fever', 'throat pain'],
        suggestedQuestions: ['How long have you had these symptoms?', 'Do you have difficulty breathing?', 'What color is your sputum?', 'Have you been in contact with anyone sick?']
      },
      hi: {
        keywords: ['खांसी', 'बुखार', 'सांस फूलना', 'सीने में दर्द', 'बलगम', 'घरघराहट', 'गले में खराश', 'शरीर दर्द'],
        relatedTerms: ['सांस लेने में कठिनाई', 'सांस नहीं आ रही', 'बलगम निकल रहा', 'सीने में जकड़न', 'बुखार आ रहा', 'गला दुख रहा'],
        suggestedQuestions: ['आपको ये लक्षण कब से हैं?', 'क्या सांस लेने में कठिनाई है?', 'आपका बलगम किस रंग का है?', 'क्या आप किसी बीमार व्यक्ति के संपर्क में रहे हैं?']
      }
    }
  }
  
  return fallbacks[condition]?.[language] || fallbacks[condition]?.en || {
    keywords: [],
    relatedTerms: [],
    suggestedQuestions: []
  }
}

/**
 * Rule-based summary generation (fallback when Gemini unavailable)
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
): { summaryText: string, keyFindings: string[], redFlags: string[], confidence: number } {
  const keyFindings: string[] = []
  const redFlags: string[] = []
  
  // Extract key vitals
  if (vitals) {
    if (vitals.temperature && vitals.temperature > 100) keyFindings.push(`Fever: ${vitals.temperature}°F`)
    if (vitals.bloodPressure) keyFindings.push(`BP: ${vitals.bloodPressure}`)
    if (vitals.spO2 && vitals.spO2 < 95) keyFindings.push(`SpO2: ${vitals.spO2}%`)
    if (vitals.bloodSugar && vitals.bloodSugar > 200) keyFindings.push(`Blood Sugar: ${vitals.bloodSugar} mg/dL`)
  }
  
  // Extract key history
  if (history?.medical?.length) keyFindings.push(`Medical history: ${history.medical.slice(0, 3).join(', ')}`)
  if (medications?.length) keyFindings.push(`Current medications: ${medications.length} active`)
  if (allergies?.length) keyFindings.push(`Allergies: ${allergies.map((a: any) => a.name).join(', ')}`)
  
  // Check for yes answers to questions (potential red flags)
  answers.forEach(a => {
    if (a.answer === true || a.answer === 'yes' || (typeof a.answer === 'string' && a.answer.toLowerCase().includes('severe'))) {
      redFlags.push(`Concerning symptom reported`)
    }
  })
  
  const summaryText = `${patientAge}-year-old ${patientGender} reports ${chiefComplaint}. ${
    selectedConditions.length ? `Suspected: ${selectedConditions.join(', ')}. ` : ''
  }${
    redFlags.length ? `⚠️ Red flags: ${redFlags.length} identified. ` : ''
  }${
    history?.medical?.length ? `History includes ${history.medical.slice(0, 2).join(', ')}. ` : ''
  }${
    medications?.length ? `Currently on ${medications.length} medication(s). ` : 'Not on medication. '
  }${
    allergies?.length ? `Known allergies: ${allergies.map((a: any) => a.name).join(', ')}.` : 'No known allergies.'
  }`
  
  return {
    summaryText,
    keyFindings,
    redFlags,
    confidence: redFlags.length > 0 ? 0.7 : 0.8
  }
}
