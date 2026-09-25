"""
Groq Conversation Engine for Voice Triage
==========================================

This module handles dynamic, doctor-like questioning using Groq's LLM API.

CRITICAL ARCHITECTURE:
1. Groq decides WHAT to ask and HOW to say it (in any language)
2. Structured extraction converts answers to language-agnostic features
3. ML model (app.py) decides urgency level - NEVER Groq

This separation is non-negotiable - Groq handles conversation, ML handles medical decisions.
"""

import os
import json
import re
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import requests
from datetime import datetime


@dataclass
class ConversationTurn:
    """A single question-answer exchange"""
    question: str
    answer: str


@dataclass
class StructuredFeature:
    """A clinical feature extracted from natural language"""
    key: str  # English key matching ML model features
    value: Any  # Numeric or boolean value
    confidence: float  # 0.0 to 1.0
    needs_clarification: bool = False
    clarification_question: Optional[str] = None


@dataclass
class MandatoryCheck:
    """A red-flag check that must be covered before ending conversation"""
    name: str
    covered: bool = False
    feature_key: Optional[str] = None


class GroqClient:
    """
    Wrapper for Groq API with retry logic and fallback handling
    """
    
    def __init__(
        self, 
        api_key: Optional[str] = None,
        model: str = "openai/gpt-oss-120b",
        timeout: int = 15,
        max_retries: int = 2
    ):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
        if not self.api_key:
            print("⚠️  WARNING: GROQ_API_KEY not set - fallback mode will be used")
    
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 500,
        json_mode: bool = False
    ) -> Optional[str]:
        """
        Call Groq chat completion API with retry logic
        Returns response text or None on failure
        """
        if not self.api_key:
            return None
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    self.base_url,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return content
                else:
                    print(f"⚠️  Groq API error (attempt {attempt + 1}): {response.status_code}")
                    if attempt < self.max_retries - 1:
                        continue
                    
            except requests.Timeout:
                print(f"⚠️  Groq API timeout (attempt {attempt + 1})")
                if attempt < self.max_retries - 1:
                    continue
            except Exception as e:
                print(f"⚠️  Groq API exception: {e}")
                break
        
        return None


# Mandatory red-flag checks per chief complaint category
MANDATORY_CHECKS = {
    "chest_pain": [
        MandatoryCheck("radiating_pain", feature_key="chest_pain"),
        MandatoryCheck("sweating"),
        MandatoryCheck("severity", feature_key="severity"),
    ],
    "breathing": [
        MandatoryCheck("breathing_at_rest", feature_key="breathing"),
        MandatoryCheck("bluish_lips"),
        MandatoryCheck("severity", feature_key="severity"),
    ],
    "fever": [
        MandatoryCheck("temperature", feature_key="temp"),
        MandatoryCheck("breathing_difficulty", feature_key="breathing"),
        MandatoryCheck("consciousness_level"),
    ],
    "headache": [
        MandatoryCheck("sudden_onset"),
        MandatoryCheck("worst_headache_ever", feature_key="headache"),
        MandatoryCheck("vision_changes"),
    ],
    "bleeding": [
        MandatoryCheck("amount_of_bleeding", feature_key="bleeding"),
        MandatoryCheck("bleeding_stopped"),
        MandatoryCheck("trauma_history"),
    ],
    "seizure": [
        MandatoryCheck("seizure_duration", feature_key="seizure"),
        MandatoryCheck("first_seizure"),
        MandatoryCheck("consciousness_after"),
    ],
    "abdominal_pain": [
        MandatoryCheck("pain_location"),
        MandatoryCheck("severity", feature_key="severity"),
        MandatoryCheck("vomiting_blood"),
    ],
    "general": [
        MandatoryCheck("severity", feature_key="severity"),
        MandatoryCheck("duration", feature_key="duration_days"),
    ]
}


def classify_chief_complaint(complaint: str) -> str:
    """Classify chief complaint into a category for mandatory checks"""
    complaint_lower = complaint.lower()
    
    # Check for specific categories
    if any(k in complaint_lower for k in ["chest pain", "chest tightness", "heart", "cardiac", "सीने में दर्द", "छाती दर्द"]):
        return "chest_pain"
    if any(k in complaint_lower for k in ["breath", "breathing", "shortness", "dyspnoea", "साँस", "सांस लेने में"]):
        return "breathing"
    if any(k in complaint_lower for k in ["fever", "temperature", "bukhar", "बुखार", "ताप"]):
        return "fever"
    if any(k in complaint_lower for k in ["headache", "head pain", "सिरदर्द", "डोकेदुखी"]):
        return "headache"
    if any(k in complaint_lower for k in ["bleed", "bleeding", "blood", "रक्तस्राव", "रक्त", "खून"]):
        return "bleeding"
    if any(k in complaint_lower for k in ["seizure", "convuls", "fitting", "fits", "दौरा", "मूर्छा"]):
        return "seizure"
    if any(k in complaint_lower for k in ["stomach", "abdominal", "belly", "पेट दर्द", "उदर"]):
        return "abdominal_pain"
    
    return "general"


def get_system_prompt(language: str, category: str) -> str:
    """Generate system prompt for Groq based on language and complaint category"""
    
    lang_instructions = {
        "en": "Respond only in English, using warm natural spoken language like a caring doctor.",
        "hi": "केवल हिंदी में जवाब दें, एक देखभाल करने वाले डॉक्टर की तरह गर्म प्राकृतिक बोली जाने वाली भाषा का उपयोग करें।",
        "mr": "फक्त मराठीमध्ये उत्तर द्या, काळजी घेणाऱ्या डॉक्टरांप्रमाणे उबदार नैसर्गिक बोलली जाणारी भाषा वापरून.",
        "pa": "ਸਿਰਫ਼ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ, ਇੱਕ ਦੇਖਭਾਲ ਕਰਨ ਵਾਲੇ ਡਾਕਟਰ ਵਾਂਗ ਗਰਮ ਕੁਦਰਤੀ ਬੋਲੀ ਜਾਣ ਵਾਲੀ ਭਾਸ਼ਾ ਦੀ ਵਰਤੋਂ ਕਰਦੇ ਹੋਏ।"
    }
    
    lang_instruction = lang_instructions.get(language, lang_instructions["en"])
    
    mandatory_checks_text = ""
    checks = MANDATORY_CHECKS.get(category, MANDATORY_CHECKS["general"])
    if checks:
        check_names = [check.name.replace("_", " ") for check in checks]
        mandatory_checks_text = f"\n\nMANDATORY RED-FLAG CHECKS (must cover before ending): {', '.join(check_names)}"
    
    return f"""You are a warm, empathetic doctor conducting a triage assessment via voice. Your role is to:

1. Ask the NEXT most clinically relevant question based on what you know so far
2. Acknowledge the patient's previous answer warmly before asking the next question
3. If a patient expresses distress, acknowledge it emotionally before continuing
4. If an answer is ambiguous, ask ONE clarifying follow-up (max 2 clarifications per question)
5. Keep questions natural and conversational, not robotic or checklist-like
6. {lang_instruction}

CRITICAL RULES:
- You decide WHAT to ask, the ML model decides urgency - NEVER suggest a triage level
- Ask questions adaptively like a real doctor would reason through symptoms
- Be brief (1-2 sentences per question){mandatory_checks_text}
- If you've covered the mandatory checks or asked 8-10 questions, you can indicate completion
- Never diagnose or suggest urgency/triage level - only gather information

Current complaint category: {category}"""


def decide_next_question(
    client: GroqClient,
    conversation_history: List[ConversationTurn],
    chief_complaint: str,
    features_so_far: Dict[str, Any],
    mandatory_checks_remaining: List[MandatoryCheck],
    language: str,
    max_questions: int = 5  # Reduced from 10 to 5
) -> Optional[str]:
    """
    Decide the next question to ask using Groq LLM
    
    Returns:
        - Question text if conversation should continue
        - None if enough information gathered (and mandatory checks done)
    """
    
    # HARD LIMIT: Stop after 5 questions regardless
    if len(conversation_history) >= max_questions:
        print(f"✋ Stopping: reached max questions ({max_questions})")
        return None
    
    # EARLY EXIT: If no mandatory checks and we have 3+ questions, we're done
    if len(conversation_history) >= 3 and len(mandatory_checks_remaining) == 0:
        print(f"✅ Stopping: {len(conversation_history)} questions asked, mandatory checks complete")
        return None
    
    category = classify_chief_complaint(chief_complaint)
    
    # Build conversation context
    context = f"Chief complaint: {chief_complaint}\n\n"
    context += "Conversation so far:\n"
    for i, turn in enumerate(conversation_history):
        context += f"Doctor Q{i+1}: {turn.question}\n"
        context += f"Patient A{i+1}: {turn.answer}\n"
    
    context += f"\n\nFeatures extracted so far: {json.dumps(features_so_far, indent=2)}\n"
    
    if mandatory_checks_remaining:
        remaining_names = [check.name.replace("_", " ") for check in mandatory_checks_remaining]
        context += f"\nStill need to check: {', '.join(remaining_names)}\n"
    
    context += f"\n\nBased on this, what is the NEXT question to ask? Be warm, natural, and brief."
    if len(mandatory_checks_remaining) == 0:
        context += " If you have enough information, respond with: DONE"
    
    messages = [
        {"role": "system", "content": get_system_prompt(language, category)},
        {"role": "user", "content": context}
    ]
    
    response = client.chat_completion(messages, temperature=0.7)
    
    if response is None:
        # Fallback to simple question
        return _get_fallback_question(conversation_history, mandatory_checks_remaining, language)
    
    # Check if Groq indicates we're done
    if "DONE" in response.upper() or "ENOUGH INFORMATION" in response.upper():
        print(f"✅ Stopping: Groq indicated completion")
        return None
    
    # Safety: If response is very short or looks like a conclusion, end
    if len(response.strip()) < 10 and len(conversation_history) >= 3:
        print(f"✅ Stopping: Response too short, likely done")
        return None
    
    return response.strip()


def _get_fallback_question(
    history: List[ConversationTurn],
    remaining_checks: List[MandatoryCheck],
    language: str
) -> Optional[str]:
    """Fallback questions when Groq is unavailable"""
    
    fallback_questions = {
        "en": [
            "How long have you had these symptoms?",
            "On a scale of 1-10, how severe is the pain or discomfort?",
            "Are there any other symptoms you're experiencing?",
            "Have you taken any medication for this?",
            "Is this getting better, worse, or staying the same?"
        ],
        "hi": [
            "ये लक्षण आपको कब से हैं?",
            "1-10 के पैमाने पर, दर्द या परेशानी कितनी गंभीर है?",
            "क्या कोई अन्य लक्षण हैं जो आप महसूस कर रहे हैं?",
            "क्या आपने इसके लिए कोई दवा ली है?",
            "क्या यह बेहतर हो रहा है, खराब हो रहा है, या वैसा ही है?"
        ]
    }
    
    questions = fallback_questions.get(language, fallback_questions["en"])
    
    if len(history) < len(questions):
        return questions[len(history)]
    
    return None


def extract_structured_feature(
    client: GroqClient,
    question_asked: str,
    patient_answer: str,
    expected_type: str,  # 'numeric', 'boolean', 'duration', 'severity'
    language: str
) -> StructuredFeature:
    """
    Extract a structured, language-agnostic clinical feature from natural language answer
    
    Args:
        question_asked: The question that was asked
        patient_answer: Patient's natural language answer (any language)
        expected_type: Type of feature to extract
        language: Language of the answer
    
    Returns:
        StructuredFeature with key, value, and confidence
    """
    
    # Try rule-based extraction first (faster and more reliable for common patterns)
    rule_based_result = _extract_with_rules(patient_answer, expected_type)
    if rule_based_result and rule_based_result.confidence > 0.7:
        return rule_based_result
    
    # Use Groq for complex extraction
    extraction_prompt = f"""Extract a structured clinical value from this patient answer.

Question asked: {question_asked}
Patient answer: {patient_answer}
Expected type: {expected_type}

Task: Extract the clinical value in a structured format.

Respond with JSON:
{{
  "key": "feature_name_in_english",
  "value": <extracted_value>,
  "confidence": <0.0_to_1.0>,
  "needs_clarification": <true_or_false>,
  "clarification_question": "question to ask if unclear (in {language})"
}}

Examples:
- "तीन दिन से बुखार है" → {{"key": "fever_duration_days", "value": 3, "confidence": 0.95}}
- "थोड़ा दर्द है" → {{"key": "severity", "value": 4, "confidence": 0.5, "needs_clarification": true}}
- "बहुत तेज़ दर्द" → {{"key": "severity", "value": 9, "confidence": 0.9}}"""

    messages = [
        {"role": "system", "content": "You are a medical data extraction system. Extract structured values from natural language, regardless of language."},
        {"role": "user", "content": extraction_prompt}
    ]
    
    response = client.chat_completion(messages, temperature=0.3, json_mode=True)
    
    if response:
        try:
            data = json.loads(response)
            return StructuredFeature(
                key=data.get("key", "unknown"),
                value=data.get("value"),
                confidence=data.get("confidence", 0.5),
                needs_clarification=data.get("needs_clarification", False),
                clarification_question=data.get("clarification_question")
            )
        except json.JSONDecodeError:
            pass
    
    # Fallback to rule-based or default
    return rule_based_result or StructuredFeature(
        key="unknown",
        value=patient_answer,
        confidence=0.3,
        needs_clarification=True,
        clarification_question=_get_clarification_in_language(language)
    )


def _extract_with_rules(answer: str, expected_type: str) -> Optional[StructuredFeature]:
    """Rule-based extraction for common patterns"""
    
    answer_lower = answer.lower()
    
    # Extract duration in days
    if expected_type == "duration":
        # Match patterns like "3 days", "teen din", "तीन दिन", "2 weeks"
        match = re.search(r'(\d+)\s*(day|days|din|दिन|divas|दिवस)', answer_lower)
        if match:
            return StructuredFeature("duration_days", int(match.group(1)), 0.9)
        
        match = re.search(r'(\d+)\s*(week|weeks|hafte|हफ्ते|आठवडे)', answer_lower)
        if match:
            return StructuredFeature("duration_days", int(match.group(1)) * 7, 0.9)
        
        # Word-based numbers in Hindi/Marathi
        number_words = {
            "ek": 1, "एक": 1, "do": 2, "दो": 2, "teen": 3, "तीन": 3,
            "char": 4, "चार": 4, "paanch": 5, "पांच": 5, "panch": 5,
            "chhe": 6, "सहा": 6, "saat": 7, "सात": 7, "aath": 8, "आठ": 8
        }
        for word, num in number_words.items():
            if word in answer_lower:
                return StructuredFeature("duration_days", num, 0.85)
    
    # Extract severity (1-10 scale)
    if expected_type == "severity":
        match = re.search(r'\b(10|[1-9])\b', answer_lower)
        if match:
            return StructuredFeature("severity", int(match.group(1)), 0.95)
        
        # Qualitative severity
        if any(word in answer_lower for word in ["severe", "unbearable", "worst", "bahut", "बहुत", "खूप"]):
            return StructuredFeature("severity", 9, 0.8)
        if any(word in answer_lower for word in ["moderate", "medium", "thoda", "थोड़ा", "मध्यम"]):
            return StructuredFeature("severity", 5, 0.75)
        if any(word in answer_lower for word in ["mild", "slight", "little", "kam", "कम", "थोडे"]):
            return StructuredFeature("severity", 3, 0.75)
    
    # Extract boolean (yes/no)
    if expected_type == "boolean":
        yes_words = ["yes", "haan", "हां", "हाँ", "ho", "होय", "aha", "आहे"]
        no_words = ["no", "nahi", "नहीं", "नाही"]
        
        if any(word in answer_lower for word in yes_words):
            return StructuredFeature("boolean_response", 1, 0.9)
        if any(word in answer_lower for word in no_words):
            return StructuredFeature("boolean_response", 0, 0.9)
    
    return None


def _get_clarification_in_language(language: str) -> str:
    """Get clarification question in specified language"""
    clarifications = {
        "en": "Could you please be more specific about that?",
        "hi": "क्या आप इसके बारे में और स्पष्ट बता सकते हैं?",
        "mr": "तुम्ही त्याबद्दल अधिक स्पष्ट सांगू शकाल का?",
        "pa": "ਕੀ ਤੁਸੀਂ ਇਸ ਬਾਰੇ ਹੋਰ ਸਪੱਸ਼ਟ ਹੋ ਸਕਦੇ ਹੋ?"
    }
    return clarifications.get(language, clarifications["en"])


def generate_warm_closing(
    client: GroqClient,
    ml_triage_result: Dict[str, Any],
    language: str,
    patient_name: Optional[str] = None
) -> Tuple[str, Dict[str, Any]]:
    """
    Generate a warm, reassuring closing message based on ML triage result
    
    CRITICAL: This does NOT alter the ML result - it only generates patient-facing text
    The structured ML result is returned unchanged for doctor's view
    
    Args:
        ml_triage_result: The structured output from ML model (app.py)
        language: Language for the closing message
        patient_name: Optional patient name for personalization
    
    Returns:
        Tuple of (warm_message_for_patient, unmodified_ml_result_for_doctor)
    """
    
    risk_level = ml_triage_result.get("risk_level", "medium")
    hospital_level = ml_triage_result.get("hospital_level_label", "PHC")
    
    # Build prompt for warm closing
    prompt = f"""Generate a warm, reassuring closing message for a patient who just completed triage.

Triage result (DO NOT share urgency level directly, just explain next steps):
- Recommended care level: {hospital_level}
- Risk category: {risk_level}

Task: Create a warm 2-3 sentence closing that:
1. Thanks the patient for sharing their symptoms
2. Briefly explains where they should seek care (e.g., "PHC visit recommended")
3. Reassures them they're in good hands
4. Use simple, warm language in {language}
5. DO NOT mention technical terms like "triage score" or specific urgency levels

{"Patient name: " + patient_name if patient_name else ""}"""

    messages = [
        {"role": "system", "content": f"You are a caring doctor providing reassurance. Respond only in {language}."},
        {"role": "user", "content": prompt}
    ]
    
    closing_message = client.chat_completion(messages, temperature=0.8, max_tokens=200)
    
    if not closing_message:
        # Fallback closing messages
        fallback_messages = {
            "en": f"Thank you for sharing your symptoms with me. Based on what you've told me, I recommend visiting the {hospital_level} for proper care. You're in good hands.",
            "hi": f"अपने लक्षण साझा करने के लिए धन्यवाद। आपने जो बताया उसके आधार पर, मैं उचित देखभाल के लिए {hospital_level} जाने की सलाह देता हूं। आप अच्छे हाथों में हैं।",
            "mr": f"तुमची लक्षणे शेअर केल्याबद्दल धन्यवाद। तुम्ही सांगितलेल्या गोष्टींच्या आधारे, मी योग्य काळजीसाठी {hospital_level} ला भेट देण्याचा सल्ला देतो। तुम्ही चांगल्या हातात आहात।",
            "pa": f"ਆਪਣੇ ਲੱਛਣ ਸਾਂਝੇ ਕਰਨ ਲਈ ਤੁਹਾਡਾ ਧੰਨਵਾਦ। ਤੁਸੀਂ ਜੋ ਦੱਸਿਆ ਉਸ ਦੇ ਆਧਾਰ 'ਤੇ, ਮੈਂ ਸਹੀ ਦੇਖਭਾਲ ਲਈ {hospital_level} ਜਾਣ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦਾ ਹਾਂ। ਤੁਸੀਂ ਚੰਗੇ ਹੱਥਾਂ ਵਿੱਚ ਹੋ।"
        }
        closing_message = fallback_messages.get(language, fallback_messages["en"])
    
    # Return both the warm message AND the unmodified ML result
    return closing_message.strip(), ml_triage_result


def update_mandatory_checks(
    mandatory_checks: List[MandatoryCheck],
    extracted_feature: StructuredFeature
) -> List[MandatoryCheck]:
    """
    Update mandatory checks based on extracted feature
    Marks a check as covered if the feature matches its key
    """
    for check in mandatory_checks:
        if check.feature_key and check.feature_key in extracted_feature.key:
            check.covered = True
    
    return [check for check in mandatory_checks if not check.covered]


def get_repeat_request_message(language: str) -> str:
    """Get 'please repeat' message in specified language"""
    messages = {
        "en": "I'm sorry, I didn't catch that. Could you please repeat?",
        "hi": "माफ़ कीजिये, मैं समझ नहीं पाया। क्या आप दोबारा बोल सकते हैं?",
        "mr": "माफ करा, मला ते समजले नाही। तुम्ही पुन्हा बोलू शकता का?",
        "pa": "ਮਾਫ਼ ਕਰਨਾ, ਮੈਂ ਸਮਝ ਨਹੀਂ ਸਕਿਆ। ਕੀ ਤੁਸੀਂ ਦੁਬਾਰਾ ਬੋਲ ਸਕਦੇ ਹੋ?"
    }
    return messages.get(language, messages["en"])


# Export main functions
__all__ = [
    "GroqClient",
    "ConversationTurn",
    "StructuredFeature",
    "MandatoryCheck",
    "decide_next_question",
    "extract_structured_feature",
    "generate_warm_closing",
    "classify_chief_complaint",
    "update_mandatory_checks",
    "get_repeat_request_message",
    "MANDATORY_CHECKS"
]
