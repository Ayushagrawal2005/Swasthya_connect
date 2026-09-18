/**
 * Triage Question Bank
 * Configurable disease-specific questions for structured patient assessment
 */

export interface TriageQuestion {
  id: string
  condition: string | 'general' // 'general' applies to all conditions
  category: 'symptom' | 'history' | 'severity' | 'duration' | 'vital' | 'red-flag' | 'pregnancy' | 'medication'
  question: string
  questionHi?: string  // Hindi translation
  questionMr?: string  // Marathi translation
  type: 'single' | 'multi' | 'text' | 'number' | 'yes-no' | 'date' | 'scale'
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

export const triageQuestionBank: TriageQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // GENERAL RED FLAGS (shown for all conditions)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'general-chest-pain',
    condition: 'general',
    category: 'red-flag',
    question: 'Are you experiencing severe chest pain or tightness?',
    questionHi: 'क्या आपको सीने में तेज दर्द या जकड़न है?',
    questionMr: 'तुम्हाला छातीत तीव्र वेदना किंवा घट्टपणा जाणवतो का?',
    type: 'yes-no',
    required: true,
    order: 1,
    redFlag: true,
  },
  {
    id: 'general-breathing',
    condition: 'general',
    category: 'red-flag',
    question: 'Are you having difficulty breathing or feeling breathless?',
    questionHi: 'क्या आपको सांस लेने में कठिनाई हो रही है?',
    questionMr: 'तुम्हाला श्वास घेण्यात अडचण येत आहे का?',
    type: 'yes-no',
    required: true,
    order: 2,
    redFlag: true,
  },
  {
    id: 'general-consciousness',
    condition: 'general',
    category: 'red-flag',
    question: 'Have you experienced loss of consciousness, confusion, or severe dizziness?',
    questionHi: 'क्या आपको बेहोशी, भ्रम, या गंभीर चक्कर आया है?',
    type: 'yes-no',
    required: true,
    order: 3,
    redFlag: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // HYPERTENSION
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'hypertension-headache',
    condition: 'hypertension',
    category: 'symptom',
    question: 'Are you experiencing severe headache or blurred vision?',
    questionHi: 'क्या आपको गंभीर सिरदर्द या धुंधली दृष्टि है?',
    type: 'yes-no',
    required: true,
    order: 1,
    redFlag: true,
  },
  {
    id: 'hypertension-bp-reading',
    condition: 'hypertension',
    category: 'vital',
    question: 'What was your most recent blood pressure reading?',
    questionHi: 'आपका हाल का रक्तचाप क्या था?',
    type: 'text',
    required: false,
    order: 2,
  },
  {
    id: 'hypertension-medication',
    condition: 'hypertension',
    category: 'medication',
    question: 'Are you currently taking blood pressure medication?',
    questionHi: 'क्या आप वर्तमान में रक्तचाप की दवा ले रहे हैं?',
    type: 'yes-no',
    required: true,
    order: 3,
  },
  {
    id: 'hypertension-adherence',
    condition: 'hypertension',
    category: 'medication',
    question: 'Have you missed any doses of your medication in the last week?',
    questionHi: 'क्या आपने पिछले सप्ताह अपनी दवा की कोई खुराक छोड़ी है?',
    type: 'yes-no',
    required: true,
    order: 4,
  },
  {
    id: 'hypertension-symptoms',
    condition: 'hypertension',
    category: 'symptom',
    question: 'Select any symptoms you are experiencing:',
    questionHi: 'अपने लक्षण चुनें:',
    type: 'multi',
    options: ['Headache', 'Dizziness', 'Nausea', 'Nosebleed', 'Chest discomfort', 'Fatigue', 'None'],
    optionsHi: ['सिरदर्द', 'चक्कर', 'जी मिचलाना', 'नाक से खून', 'छाती में बेचैनी', 'थकान', 'कोई नहीं'],
    required: true,
    order: 5,
  },
  {
    id: 'hypertension-duration',
    condition: 'hypertension',
    category: 'duration',
    question: 'How long have you had elevated blood pressure?',
    questionHi: 'आपका रक्तचाप कब से बढ़ा हुआ है?',
    type: 'single',
    options: ['Less than 1 week', '1-2 weeks', '2-4 weeks', 'More than 1 month', 'Newly diagnosed'],
    optionsHi: ['1 सप्ताह से कम', '1-2 सप्ताह', '2-4 सप्ताह', '1 महीने से अधिक', 'नया निदान'],
    required: true,
    order: 6,
  },

  // ═══════════════════════════════════════════════════════════════
  // DIABETES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'diabetes-blood-sugar',
    condition: 'diabetes',
    category: 'vital',
    question: 'What was your most recent blood sugar reading?',
    questionHi: 'आपकी हाल की रक्त शर्करा रीडिंग क्या थी?',
    type: 'number',
    required: false,
    order: 1,
    unit: 'mg/dL',
    minValue: 50,
    maxValue: 600,
  },
  {
    id: 'diabetes-symptoms',
    condition: 'diabetes',
    category: 'symptom',
    question: 'Select any symptoms you are experiencing:',
    questionHi: 'अपने लक्षण चुनें:',
    type: 'multi',
    options: ['Frequent urination', 'Excessive thirst', 'Fatigue', 'Blurred vision', 'Slow healing wounds', 'Numbness in hands/feet', 'None'],
    optionsHi: ['बार-बार पेशाब', 'अत्यधिक प्यास', 'थकान', 'धुंधली दृष्टि', 'घाव धीरे ठीक होना', 'हाथ/पैर में सुन्नता', 'कोई नहीं'],
    required: true,
    order: 2,
  },
  {
    id: 'diabetes-diet',
    condition: 'diabetes',
    category: 'history',
    question: 'Are you following a diabetic diet plan?',
    questionHi: 'क्या आप मधुमेह आहार योजना का पालन कर रहे हैं?',
    type: 'single',
    options: ['Yes, strictly', 'Yes, mostly', 'Sometimes', 'No'],
    optionsHi: ['हां, सख्ती से', 'हां, ज्यादातर', 'कभी-कभी', 'नहीं'],
    required: true,
    order: 3,
  },
  {
    id: 'diabetes-medication',
    condition: 'diabetes',
    category: 'medication',
    question: 'What diabetes medication are you currently taking?',
    questionHi: 'आप वर्तमान में कौन सी मधुमेह की दवा ले रहे हैं?',
    type: 'multi',
    options: ['Metformin', 'Insulin', 'Glipizide', 'Glimepiride', 'Other oral medication', 'Not taking any'],
    optionsHi: ['मेटफॉर्मिन', 'इंसुलिन', 'ग्लिपिज़ाइड', 'ग्लिमेपिराइड', 'अन्य मौखिक दवा', 'कोई नहीं ले रहा'],
    required: true,
    order: 4,
  },
  {
    id: 'diabetes-hypo',
    condition: 'diabetes',
    category: 'red-flag',
    question: 'Have you experienced severe low blood sugar (shakiness, confusion, sweating) recently?',
    questionHi: 'क्या आपको हाल ही में गंभीर निम्न रक्त शर्करा (कंपकंपी, भ्रम, पसीना) हुई है?',
    type: 'yes-no',
    required: true,
    order: 5,
    redFlag: true,
  },
  {
    id: 'diabetes-foot',
    condition: 'diabetes',
    category: 'symptom',
    question: 'Do you have any foot wounds, ulcers, or infections?',
    questionHi: 'क्या आपके पैर में कोई घाव, अल्सर, या संक्रमण है?',
    type: 'yes-no',
    required: true,
    order: 6,
  },

  // ═══════════════════════════════════════════════════════════════
  // PREGNANCY / OBSTETRIC
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pregnancy-weeks',
    condition: 'pregnancy',
    category: 'pregnancy',
    question: 'How many weeks pregnant are you?',
    questionHi: 'आप कितने सप्ताह की गर्भवती हैं?',
    type: 'number',
    required: true,
    order: 1,
    minValue: 1,
    maxValue: 42,
    unit: 'weeks',
  },
  {
    id: 'pregnancy-bleeding',
    condition: 'pregnancy',
    category: 'red-flag',
    question: 'Are you experiencing any vaginal bleeding?',
    questionHi: 'क्या आपको योनि से रक्तस्राव हो रहा है?',
    type: 'yes-no',
    required: true,
    order: 2,
    redFlag: true,
  },
  {
    id: 'pregnancy-movement',
    condition: 'pregnancy',
    category: 'red-flag',
    question: 'Have you noticed decreased fetal movement?',
    questionHi: 'क्या आपने भ्रूण की गतिविधि में कमी देखी है?',
    type: 'yes-no',
    required: true,
    order: 3,
    redFlag: true,
  },
  {
    id: 'pregnancy-bp',
    condition: 'pregnancy',
    category: 'vital',
    question: 'Do you have high blood pressure during pregnancy?',
    questionHi: 'क्या गर्भावस्था में आपका रक्तचाप उच्च है?',
    type: 'yes-no',
    required: true,
    order: 4,
  },
  {
    id: 'pregnancy-swelling',
    condition: 'pregnancy',
    category: 'symptom',
    question: 'Are you experiencing severe swelling in hands, feet, or face?',
    questionHi: 'क्या आपको हाथ, पैर या चेहरे में गंभीर सूजन है?',
    type: 'yes-no',
    required: true,
    order: 5,
  },
  {
    id: 'pregnancy-pain',
    condition: 'pregnancy',
    category: 'symptom',
    question: 'Are you experiencing abdominal or pelvic pain?',
    questionHi: 'क्या आपको पेट या श्रोणि में दर्द है?',
    type: 'single',
    options: ['No pain', 'Mild discomfort', 'Moderate pain', 'Severe pain'],
    optionsHi: ['कोई दर्द नहीं', 'हल्की बेचैनी', 'मध्यम दर्द', 'गंभीर दर्द'],
    required: true,
    order: 6,
  },

  // ═══════════════════════════════════════════════════════════════
  // RESPIRATORY / FEVER
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'respiratory-cough',
    condition: 'respiratory',
    category: 'symptom',
    question: 'Do you have a cough?',
    questionHi: 'क्या आपको खांसी है?',
    type: 'single',
    options: ['No cough', 'Dry cough', 'Productive cough (with mucus)', 'Cough with blood'],
    optionsHi: ['खांसी नहीं', 'सूखी खांसी', 'बलगम वाली खांसी', 'खून के साथ खांसी'],
    required: true,
    order: 1,
  },
  {
    id: 'respiratory-fever',
    condition: 'respiratory',
    category: 'vital',
    question: 'Do you have fever? If yes, what is your temperature?',
    questionHi: 'क्या आपको बुखार है? यदि हां, तो आपका तापमान क्या है?',
    type: 'number',
    required: false,
    order: 2,
    unit: '°F',
    minValue: 95,
    maxValue: 110,
  },
  {
    id: 'respiratory-breathlessness',
    condition: 'respiratory',
    category: 'red-flag',
    question: 'Rate your breathing difficulty:',
    questionHi: 'अपनी सांस लेने की कठिनाई को रेट करें:',
    type: 'single',
    options: ['No difficulty', 'Mild - only with exertion', 'Moderate - at rest', 'Severe - cannot speak full sentences'],
    optionsHi: ['कोई कठिनाई नहीं', 'हल्की - केवल परिश्रम के साथ', 'मध्यम - आराम के समय', 'गंभीर - पूरे वाक्य नहीं बोल सकते'],
    required: true,
    order: 3,
    redFlag: true,
  },
  {
    id: 'respiratory-duration',
    condition: 'respiratory',
    category: 'duration',
    question: 'How long have you had these symptoms?',
    questionHi: 'आपको ये लक्षण कब से हैं?',
    type: 'single',
    options: ['Less than 3 days', '3-7 days', '1-2 weeks', 'More than 2 weeks'],
    optionsHi: ['3 दिन से कम', '3-7 दिन', '1-2 सप्ताह', '2 सप्ताह से अधिक'],
    required: true,
    order: 4,
  },
  {
    id: 'respiratory-spo2',
    condition: 'respiratory',
    category: 'vital',
    question: 'If you have measured, what is your oxygen saturation (SpO2)?',
    questionHi: 'यदि आपने मापा है, तो आपकी ऑक्सीजन संतृप्ति (SpO2) क्या है?',
    type: 'number',
    required: false,
    order: 5,
    unit: '%',
    minValue: 70,
    maxValue: 100,
  },
  {
    id: 'respiratory-contact',
    condition: 'respiratory',
    category: 'history',
    question: 'Have you been in contact with anyone diagnosed with TB or COVID-19?',
    questionHi: 'क्या आप टीबी या कोविड-19 से पीड़ित किसी व्यक्ति के संपर्क में रहे हैं?',
    type: 'yes-no',
    required: true,
    order: 6,
  },

  // ═══════════════════════════════════════════════════════════════
  // MENTAL HEALTH
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'mental-mood',
    condition: 'mental',
    category: 'symptom',
    question: 'How would you describe your mood over the past 2 weeks?',
    questionHi: 'पिछले 2 सप्ताह में आप अपने मूड को कैसे वर्णित करेंगे?',
    type: 'single',
    options: ['Normal', 'Occasionally sad', 'Frequently sad or anxious', 'Constantly low or hopeless'],
    optionsHi: ['सामान्य', 'कभी-कभी उदास', 'अक्सर उदास या चिंतित', 'लगातार निराश'],
    required: true,
    order: 1,
  },
  {
    id: 'mental-sleep',
    condition: 'mental',
    category: 'symptom',
    question: 'How is your sleep pattern?',
    questionHi: 'आपकी नींद का पैटर्न कैसा है?',
    type: 'single',
    options: ['Normal', 'Difficulty falling asleep', 'Frequent waking', 'Sleeping too much', 'Severe insomnia'],
    optionsHi: ['सामान्य', 'सोने में कठिनाई', 'बार-बार जागना', 'बहुत अधिक सोना', 'गंभीर अनिद्रा'],
    required: true,
    order: 2,
  },
  {
    id: 'mental-appetite',
    condition: 'mental',
    category: 'symptom',
    question: 'Have you noticed changes in your appetite or weight?',
    questionHi: 'क्या आपने अपनी भूख या वजन में बदलाव देखा है?',
    type: 'single',
    options: ['No change', 'Decreased appetite', 'Increased appetite', 'Significant weight loss', 'Significant weight gain'],
    optionsHi: ['कोई बदलाव नहीं', 'भूख में कमी', 'भूख में वृद्धि', 'महत्वपूर्ण वजन घटना', 'महत्वपूर्ण वजन बढ़ना'],
    required: true,
    order: 3,
  },
  {
    id: 'mental-interest',
    condition: 'mental',
    category: 'symptom',
    question: 'Have you lost interest in activities you usually enjoy?',
    questionHi: 'क्या आपने उन गतिविधियों में रुचि खो दी है जो आप आमतौर पर पसंद करते हैं?',
    type: 'yes-no',
    required: true,
    order: 4,
  },
  {
    id: 'mental-harm',
    condition: 'mental',
    category: 'red-flag',
    question: 'Have you had thoughts of harming yourself or others?',
    questionHi: 'क्या आपने खुद को या दूसरों को नुकसान पहुंचाने के विचार किए हैं?',
    type: 'yes-no',
    required: true,
    order: 5,
    redFlag: true,
  },
  {
    id: 'mental-support',
    condition: 'mental',
    category: 'history',
    question: 'Do you have family or social support?',
    questionHi: 'क्या आपके पास पारिवारिक या सामाजिक समर्थन है?',
    type: 'single',
    options: ['Strong support system', 'Some support', 'Limited support', 'No support'],
    optionsHi: ['मजबूत समर्थन प्रणाली', 'कुछ समर्थन', 'सीमित समर्थन', 'कोई समर्थन नहीं'],
    required: true,
    order: 6,
  },

  // ═══════════════════════════════════════════════════════════════
  // CARDIOVASCULAR
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cardio-chest-pain',
    condition: 'cardiovascular',
    category: 'red-flag',
    question: 'Are you experiencing chest pain or discomfort?',
    questionHi: 'क्या आपको सीने में दर्द या बेचैनी है?',
    type: 'single',
    options: ['No', 'Mild discomfort', 'Moderate pain', 'Severe crushing pain'],
    optionsHi: ['नहीं', 'हल्की बेचैनी', 'मध्यम दर्द', 'गंभीर दबाव वाला दर्द'],
    required: true,
    order: 1,
    redFlag: true,
  },
  {
    id: 'cardio-radiation',
    condition: 'cardiovascular',
    category: 'red-flag',
    question: 'Does the pain radiate to your arm, jaw, or back?',
    questionHi: 'क्या दर्द आपकी बांह, जबड़े या पीठ में फैलता है?',
    type: 'yes-no',
    required: true,
    order: 2,
    redFlag: true,
  },
  {
    id: 'cardio-palpitations',
    condition: 'cardiovascular',
    category: 'symptom',
    question: 'Are you experiencing palpitations or irregular heartbeat?',
    questionHi: 'क्या आपको धड़कन या अनियमित दिल की धड़कन है?',
    type: 'yes-no',
    required: true,
    order: 3,
  },
  {
    id: 'cardio-swelling',
    condition: 'cardiovascular',
    category: 'symptom',
    question: 'Do you have swelling in your legs or ankles?',
    questionHi: 'क्या आपके पैरों या टखनों में सूजन है?',
    type: 'single',
    options: ['No swelling', 'Mild swelling', 'Moderate swelling', 'Severe swelling'],
    optionsHi: ['कोई सूजन नहीं', 'हल्की सूजन', 'मध्यम सूजन', 'गंभीर सूजन'],
    required: true,
    order: 4,
  },
  {
    id: 'cardio-exertion',
    condition: 'cardiovascular',
    category: 'symptom',
    question: 'Do symptoms worsen with physical activity?',
    questionHi: 'क्या शारीरिक गतिविधि से लक्षण बिगड़ते हैं?',
    type: 'yes-no',
    required: true,
    order: 5,
  },
  {
    id: 'cardio-family',
    condition: 'cardiovascular',
    category: 'history',
    question: 'Do you have a family history of heart disease?',
    questionHi: 'क्या आपके परिवार में हृदय रोग का इतिहास है?',
    type: 'yes-no',
    required: true,
    order: 6,
  },
]

/**
 * Get questions for a specific condition
 * Returns general red flags + condition-specific questions
 * Limit to approximately 6-7 questions
 */
export function getQuestionsForCondition(condition: string, maxQuestions: number = 7): TriageQuestion[] {
  // Get general red flags (always shown)
  const generalQuestions = triageQuestionBank
    .filter(q => q.condition === 'general')
    .slice(0, 2) // Limit general to 2 questions

  // Get condition-specific questions
  const conditionQuestions = triageQuestionBank
    .filter(q => q.condition === condition)
    .sort((a, b) => {
      // Prioritize red flags
      if (a.redFlag && !b.redFlag) return -1
      if (!a.redFlag && b.redFlag) return 1
      return a.order - b.order
    })
    .slice(0, maxQuestions - generalQuestions.length)

  return [...generalQuestions, ...conditionQuestions]
}

/**
 * Get question by ID
 */
export function getQuestionById(id: string): TriageQuestion | undefined {
  return triageQuestionBank.find(q => q.id === id)
}

/**
 * Get all supported conditions
 */
export function getSupportedConditions(): string[] {
  const conditions = new Set(triageQuestionBank.map(q => q.condition))
  conditions.delete('general') // Remove 'general' from list
  return Array.from(conditions).sort()
}

/**
 * Medical conditions with display names
 */
export const medicalConditions = [
  { id: 'hypertension', name: 'Hypertension / High Blood Pressure', nameHi: 'उच्च रक्तचाप', nameMr: 'उच्च रक्तदाब' },
  { id: 'diabetes', name: 'Diabetes', nameHi: 'मधुमेह', nameMr: 'मधुमेह' },
  { id: 'pregnancy', name: 'Pregnancy / Obstetric', nameHi: 'गर्भावस्था', nameMr: 'गर्भधारणा' },
  { id: 'respiratory', name: 'Respiratory / Fever / Infection', nameHi: 'श्वसन / बुखार / संक्रमण', nameMr: 'श्वसन / ताप / संसर्ग' },
  { id: 'mental', name: 'Mental Health / Depression / Anxiety', nameHi: 'मानसिक स्वास्थ्य', nameMr: 'मानसिक आरोग्य' },
  { id: 'cardiovascular', name: 'Cardiovascular / Heart Disease', nameHi: 'हृदय रोग', nameMr: 'हृदयरोग' },
  { id: 'endocrine', name: 'Endocrine / Thyroid / Metabolic', nameHi: 'अंतःस्रावी / थायराइड', nameMr: 'अंतःस्रावी' },
  { id: 'stroke', name: 'Stroke / Neurological', nameHi: 'स्ट्रोक / न्यूरोलॉजिकल', nameMr: 'पक्षाघात / मज्जासंस्थेचे' },
  { id: 'surgery', name: 'Post-Surgery Follow-up', nameHi: 'सर्जरी के बाद फॉलो-अप', nameMr: 'शस्त्रक्रियानंतर फॉलोअप' },
]
