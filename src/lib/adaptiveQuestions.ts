/**
 * Adaptive Question Engine
 * Generates dynamic follow-up questions based on patient's complaint
 * Covers common rural India disease patterns
 */

export interface AdaptiveQuestion {
  text: string
  hint: string
  extractsFeature?: 'severity' | 'duration' | 'chest_pain' | 'breathing' | 'headache' | 'bleeding' | 'seizure'
}

// ─── Complaint classifier ──────────────────────────────────────────────────────
type ComplaintCategory =
  | 'fever'
  | 'chest'
  | 'breathing'
  | 'head'
  | 'stomach'
  | 'pregnancy'
  | 'injury_bite'
  | 'diabetes'
  | 'weakness'
  | 'general'

export function classifyComplaint(complaint: string): ComplaintCategory {
  const c = complaint.toLowerCase()

  if (/chest pain|chest tight|heart|palpitation/.test(c))        return 'chest'
  if (/breath|breathing|breathless|shortness|dyspnoea|asthma/.test(c)) return 'breathing'
  if (/headache|head pain|migraine|head ache|dizziness|giddy/.test(c)) return 'head'
  if (/pregnant|pregnancy|delivery|labour|labor|baby|antenatal/.test(c)) return 'pregnancy'
  if (/snake|bite|scorpion|poison|accident|fall|wound|injury|cut|burn/.test(c)) return 'injury_bite'
  if (/sugar|diabetes|insulin|glucose|sweet urine/.test(c))      return 'diabetes'
  if (/vomit|loose motion|diarrhea|stomach|abdomen|nausea|gastro/.test(c)) return 'stomach'
  if (/fever|temperature|malaria|dengue|typhoid|chills|shivering/.test(c)) return 'fever'
  if (/weak|fatigue|tired|exhausted|anaemia|pale|breathless|no energy/.test(c)) return 'weakness'

  return 'general'
}

// ─── Question trees per category ──────────────────────────────────────────────
const QUESTION_TREES: Record<ComplaintCategory, AdaptiveQuestion[]> = {

  fever: [
    { text: 'How many days has the patient had the fever?', hint: 'e.g. 1 day, 3 days, 1 week', extractsFeature: 'duration' },
    { text: 'How high is the fever? Does the patient feel very cold or shiver at any point?', hint: 'Shivering with high fever can suggest malaria or dengue' },
    { text: 'On a scale of 1–10, how severe is the patient\'s overall discomfort?', hint: '1 = mild   10 = unbearable', extractsFeature: 'severity' },
    { text: 'Does the patient have any rash, red spots, bleeding from the nose or gums, or severe body pain?', hint: 'These are warning signs for dengue', extractsFeature: 'bleeding' },
    { text: 'Does the patient have any known conditions — diabetes, pregnancy, TB, or recent travel to a forest area?', hint: 'This helps identify malaria risk or complications' },
  ],

  chest: [
    { text: 'How long has the patient had this chest pain? Did it start suddenly?', hint: 'Sudden onset chest pain is a red flag', extractsFeature: 'duration' },
    { text: 'Does the pain spread to the patient\'s left arm, jaw, or back?', hint: 'This is an important sign of a heart attack', extractsFeature: 'chest_pain' },
    { text: 'On a scale of 1–10, how severe is the chest pain right now?', hint: '8 or above needs immediate attention', extractsFeature: 'severity' },
    { text: 'Is the patient sweating heavily, feeling very dizzy, or finding it hard to breathe?', hint: 'These are signs of a cardiac emergency', extractsFeature: 'breathing' },
    { text: 'Does the patient have a history of heart disease, high blood pressure, or diabetes?', hint: 'These increase cardiac risk significantly' },
  ],

  breathing: [
    { text: 'How long has the patient had breathing difficulty? Is it getting worse?', hint: 'Rapid worsening means higher urgency', extractsFeature: 'duration' },
    { text: 'Can the patient speak a full sentence without stopping to breathe?', hint: 'If no, this is an emergency', extractsFeature: 'breathing' },
    { text: 'On a scale of 1–10, how difficult is breathing for the patient right now?', hint: '7 or above needs urgent attention', extractsFeature: 'severity' },
    { text: 'Is there a wheezing sound when the patient breathes? Any cough with yellow or bloody mucus?', hint: 'Helps identify asthma, pneumonia, or TB' },
    { text: 'Does the patient have known asthma, TB, or a lung condition? Do they smoke?', hint: 'Risk factors for severe breathing problems' },
  ],

  head: [
    { text: 'How long has the patient had this headache or dizziness?', hint: 'Sudden worst-ever headache is a red flag', extractsFeature: 'duration' },
    { text: 'Is this the worst headache the patient has ever had? Or did it come on suddenly like a thunderclap?', hint: 'Thunderclap headache can be a brain emergency', extractsFeature: 'headache' },
    { text: 'On a scale of 1–10, how severe is the pain?', hint: '1 = mild  10 = worst possible', extractsFeature: 'severity' },
    { text: 'Is there any weakness in the patient\'s face, arm, or leg on one side? Slurred speech or confusion?', hint: 'These are stroke warning signs — urgent!' },
    { text: 'Has the patient had any fits or convulsions? Are they conscious and responding?', hint: 'Loss of consciousness or seizure is an emergency', extractsFeature: 'seizure' },
  ],

  pregnancy: [
    { text: 'How many months pregnant is the patient? Have they been attending antenatal checkups?', hint: 'Third trimester complications are more serious', extractsFeature: 'duration' },
    { text: 'Is the patient experiencing any bleeding, leaking fluid, or severe abdominal cramps?', hint: 'These are signs of a pregnancy emergency', extractsFeature: 'bleeding' },
    { text: 'On a scale of 1–10, how severe is the patient\'s pain or discomfort?', hint: '1 = mild  10 = very severe', extractsFeature: 'severity' },
    { text: 'Does the patient have blurred vision, severe headache, or swelling in the face and hands?', hint: 'These are signs of pre-eclampsia — dangerous!', extractsFeature: 'headache' },
    { text: 'Does the patient have a history of high blood pressure, diabetes, or a previous complicated delivery?', hint: 'Known risk factors that increase urgency' },
  ],

  injury_bite: [
    { text: 'What happened — was it a snake bite, animal bite, fall, or accident? How long ago did this occur?', hint: 'Snake bites need treatment within 1–2 hours', extractsFeature: 'duration' },
    { text: 'Is there swelling, bleeding, or numbness spreading from the site?', hint: 'Spreading symptoms suggest venom or infection', extractsFeature: 'bleeding' },
    { text: 'On a scale of 1–10, how severe is the patient\'s pain?', hint: '1 = mild  10 = unbearable', extractsFeature: 'severity' },
    { text: 'Is the patient having any difficulty breathing, drooping eyelids, or muscle weakness?', hint: 'These signs mean the venom is affecting the nervous system', extractsFeature: 'breathing' },
    { text: 'Has the patient had any fits, loss of consciousness, or confusion since the injury?', hint: 'Head injuries or neurotoxic bites need immediate care', extractsFeature: 'seizure' },
  ],

  diabetes: [
    { text: 'Is the patient on insulin or diabetes medicines? Have they taken their dose today?', hint: 'Missed insulin can cause a diabetic emergency', extractsFeature: 'duration' },
    { text: 'Is the patient feeling very confused, shaky, sweating, or seeing double?', hint: 'These are signs of dangerously low blood sugar', extractsFeature: 'seizure' },
    { text: 'On a scale of 1–10, how unwell does the patient feel right now?', hint: '1 = slightly off  10 = very sick', extractsFeature: 'severity' },
    { text: 'Does the patient have any chest pain, breathing difficulty, or a fruity smell on their breath?', hint: 'Fruity breath can mean diabetic ketoacidosis — emergency', extractsFeature: 'chest_pain' },
    { text: 'Does the patient have any wounds that are not healing, or pain or numbness in the legs and feet?', hint: 'Diabetic complications that affect urgency' },
  ],

  stomach: [
    { text: 'How many days has the patient had vomiting or loose motions?', hint: 'More than 2 days risks dehydration', extractsFeature: 'duration' },
    { text: 'Can the patient keep water down? Are they passing very little urine?', hint: 'Not urinating is a sign of dangerous dehydration' },
    { text: 'On a scale of 1–10, how severe is the patient\'s stomach pain?', hint: '1 = mild cramps  10 = unbearable pain', extractsFeature: 'severity' },
    { text: 'Is there any blood in the patient\'s vomit or stools? Are their eyes or skin yellowish?', hint: 'Yellow eyes suggest jaundice; blood is an emergency', extractsFeature: 'bleeding' },
    { text: 'Does the patient have known stomach ulcers or liver disease? Are they elderly or a young child?', hint: 'Increases dehydration and complication risk' },
  ],

  weakness: [
    { text: 'How long has the patient been feeling weak or tired? Did it come on suddenly?', hint: 'Sudden weakness is more urgent than gradual', extractsFeature: 'duration' },
    { text: 'Are the patient\'s eyelids pale? Do they feel dizzy when standing up?', hint: 'Pale eyelids suggest anaemia' },
    { text: 'On a scale of 1–10, how much is this affecting the patient\'s daily activities?', hint: '1 = slight fatigue  10 = cannot get out of bed', extractsFeature: 'severity' },
    { text: 'Does the patient have any chest pain, breathlessness, or fainting?', hint: 'Weakness with these signs needs urgent attention', extractsFeature: 'chest_pain' },
    { text: 'Does the patient have heavy periods, a recent delivery, poor diet, or TB treatment?', hint: 'Common causes of anaemia in rural women' },
  ],

  general: [
    { text: 'How long has the patient had this problem?', hint: 'e.g. 1 day, 3 days, 1 week', extractsFeature: 'duration' },
    { text: 'On a scale of 1–10, how severe is the patient\'s discomfort or pain?', hint: '1 = barely noticeable  10 = unbearable', extractsFeature: 'severity' },
    { text: 'Does the patient have any chest pain or difficulty breathing?', hint: 'Mention if yes and describe briefly', extractsFeature: 'chest_pain' },
    { text: 'Does the patient have a severe headache, heavy bleeding, or fits?', hint: 'These need urgent attention', extractsFeature: 'headache' },
    { text: 'Does the patient have any known conditions? (diabetes, hypertension, pregnancy, TB, or none)', hint: 'Helps the model adjust risk correctly' },
  ],
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** First question is always the same */
export const FIRST_QUESTION: AdaptiveQuestion = {
  text: 'What is the patient\'s main symptom or complaint today?',
  hint: 'Describe what is bothering them most — e.g. fever, chest pain, difficulty breathing, headache…',
}

/**
 * Given the first answer, return 4 follow-up questions tailored to that complaint.
 * Total = 1 opening + 4 follow-ups = 5 questions (same as before, but dynamic).
 */
export function getFollowUpQuestions(firstAnswer: string): AdaptiveQuestion[] {
  const category = classifyComplaint(firstAnswer)
  return QUESTION_TREES[category]
}

/** Returns a contextual "analysing" message based on complaint */
export function getAnalysingMessage(complaint: string): string {
  const cat = classifyComplaint(complaint)
  const msgs: Record<ComplaintCategory, string> = {
    fever:       '🧠 Analysing fever pattern — checking for malaria, dengue, typhoid indicators…',
    chest:       '🧠 Analysing chest symptoms — evaluating cardiac risk…',
    breathing:   '🧠 Analysing respiratory symptoms — checking oxygen and airway indicators…',
    head:        '🧠 Analysing neurological symptoms — checking stroke and seizure risk…',
    pregnancy:   '🧠 Analysing maternal symptoms — evaluating obstetric risk…',
    injury_bite: '🧠 Analysing injury/bite — checking for toxin and trauma indicators…',
    diabetes:    '🧠 Analysing diabetes emergency indicators…',
    stomach:     '🧠 Analysing gastrointestinal symptoms — checking dehydration and bleeding risk…',
    weakness:    '🧠 Analysing weakness and fatigue — checking for anaemia and cardiac causes…',
    general:     '🧠 Running ML model analysis…',
  }
  return msgs[cat]
}
