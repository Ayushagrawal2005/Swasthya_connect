"""
Voice Triage API Integration
=============================

Flask endpoints that connect the Groq conversation engine with the ML triage model.

CRITICAL: API key stays server-side only, never exposed to frontend.
"""

import sys
import os

# Add parent directory to path to import groq_conversation_engine and app
sys.path.insert(0, os.path.dirname(__file__))

from flask import Blueprint, request, jsonify
from groq_conversation_engine import (
    GroqClient,
    ConversationTurn,
    decide_next_question,
    extract_structured_feature,
    generate_warm_closing,
    classify_chief_complaint,
    update_mandatory_checks,
    get_repeat_request_message,
    MANDATORY_CHECKS
)
from datetime import datetime
from typing import Dict, List, Any
import copy

# Create blueprint for voice triage routes
voice_triage_bp = Blueprint('voice_triage', __name__, url_prefix='/voice-triage')

# Initialize Groq client (API key from environment)
groq_client = GroqClient()

# Session storage (in production, use Redis or database)
# Format: {session_id: {conversation_history, features, mandatory_checks, etc.}}
sessions: Dict[str, Dict[str, Any]] = {}


def create_session(session_id: str, chief_complaint: str, language: str):
    """Initialize a new voice triage session"""
    category = classify_chief_complaint(chief_complaint)
    mandatory_checks = copy.deepcopy(MANDATORY_CHECKS.get(category, MANDATORY_CHECKS["general"]))
    
    sessions[session_id] = {
        "chief_complaint": chief_complaint,
        "language": language,
        "category": category,
        "conversation_history": [],
        "features": {},
        "mandatory_checks": mandatory_checks,
        "created_at": datetime.now().isoformat(),
        "clarification_count": {}  # Track clarifications per question
    }
    
    print(f"✨ Created voice triage session: {session_id} ({language}, category: {category})")


@voice_triage_bp.route('/start', methods=['POST'])
def start_session():
    """
    Start a new voice triage session
    
    Request body:
    {
      "session_id": "unique-session-id",
      "chief_complaint": "Patient's main complaint",
      "language": "en|hi|mr|pa"
    }
    
    Response:
    {
      "session_id": "...",
      "first_question": "...",
      "category": "..."
    }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        chief_complaint = data.get('chief_complaint', '')
        language = data.get('language', 'en')
        
        if not session_id or not chief_complaint:
            return jsonify({'error': 'session_id and chief_complaint required'}), 400
        
        # Create session
        create_session(session_id, chief_complaint, language)
        
        # Generate first question
        first_question = decide_next_question(
            groq_client,
            [],
            chief_complaint,
            {},
            sessions[session_id]["mandatory_checks"],
            language
        )
        
        # Fallback first question if Groq fails
        if not first_question:
            first_questions = {
                "en": f"I understand you're experiencing {chief_complaint}. Can you tell me when this started?",
                "hi": f"मैं समझता हूं कि आप {chief_complaint} का अनुभव कर रहे हैं। क्या आप बता सकते हैं कि यह कब शुरू हुआ?",
                "mr": f"मला समजले की तुम्हाला {chief_complaint} होत आहे. हे कधी सुरू झाले ते सांगू शकाल का?",
                "pa": f"ਮੈਂ ਸਮਝਦਾ ਹਾਂ ਕਿ ਤੁਹਾਨੂੰ {chief_complaint} ਹੋ ਰਿਹਾ ਹੈ। ਕੀ ਤੁਸੀਂ ਦੱਸ ਸਕਦੇ ਹੋ ਕਿ ਇਹ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਇਆ?"
            }
            first_question = first_questions.get(language, first_questions["en"])
        
        return jsonify({
            'session_id': session_id,
            'first_question': first_question,
            'category': sessions[session_id]["category"]
        })
        
    except Exception as e:
        print(f"❌ Error starting session: {e}")
        return jsonify({'error': str(e)}), 500


@voice_triage_bp.route('/next-question', methods=['POST'])
def next_question():
    """
    Get the next question based on patient's answer
    
    Request body:
    {
      "session_id": "...",
      "last_question": "...",
      "patient_answer": "...",
      "audio_confidence": 0.0-1.0 (optional, from Web Speech API)
    }
    
    Response:
    {
      "next_question": "..." or null if done,
      "needs_clarification": true/false,
      "clarification_question": "..." (if needs clarification),
      "should_repeat": true/false (if audio unclear),
      "repeat_message": "..." (if should repeat),
      "done": true/false,
      "extracted_features": {...} (current features),
      "questions_asked": number
    }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        last_question = data.get('last_question', '')
        patient_answer = data.get('patient_answer', '').strip()
        audio_confidence = data.get('audio_confidence', 1.0)
        
        if not session_id or session_id not in sessions:
            return jsonify({'error': 'Invalid or expired session'}), 404
        
        session = sessions[session_id]
        
        # Check if audio is unclear (confidence too low or answer too short)
        # DISABLED confidence check - accept all voice input to prevent repeat loops
        # Users can always use text input if voice is truly unclear
        if len(patient_answer) < 1:  # Only reject completely empty responses
            return jsonify({
                'should_repeat': True,
                'repeat_message': get_repeat_request_message(session['language']),
                'done': False
            })
        
        # Check if patient is asking to repeat
        repeat_phrases = ["repeat", "dobara", "दोबारा", "पुन्हा", "phir", "फिर", "again"]
        if any(phrase in patient_answer.lower() for phrase in repeat_phrases):
            return jsonify({
                'should_repeat': True,
                'repeat_message': last_question,  # Replay same question
                'done': False
            })
        
        # Add to conversation history
        turn = ConversationTurn(question=last_question, answer=patient_answer)
        session['conversation_history'].append(turn)
        
        # Extract structured feature from answer
        # Determine expected type based on question content
        question_lower = last_question.lower()
        if any(word in question_lower for word in ["how long", "when", "कब से", "किती दिवस"]):
            expected_type = "duration"
        elif any(word in question_lower for word in ["scale", "1-10", "severity", "गंभीर", "तीव्र"]):
            expected_type = "severity"
        elif any(word in question_lower for word in ["yes", "no", "क्या", "काय"]):
            expected_type = "boolean"
        else:
            expected_type = "numeric"
        
        feature = extract_structured_feature(
            groq_client,
            last_question,
            patient_answer,
            expected_type,
            session['language']
        )
        
        # Check if clarification needed (max 2 attempts per question)
        question_key = f"q_{len(session['conversation_history'])}"
        clarification_count = session['clarification_count'].get(question_key, 0)
        
        if feature.needs_clarification and clarification_count < 2:
            # Ask for clarification
            session['clarification_count'][question_key] = clarification_count + 1
            
            # Don't advance conversation, ask for clarification
            return jsonify({
                'needs_clarification': True,
                'clarification_question': feature.clarification_question,
                'done': False,
                'questions_asked': len(session['conversation_history'])
            })
        
        # Store feature (even if low confidence after max clarifications)
        if feature.key != "unknown":
            session['features'][feature.key] = {
                'value': feature.value,
                'confidence': feature.confidence,
                'needs_review': feature.confidence < 0.7 or (clarification_count >= 2 and feature.needs_clarification)
            }
        
        # Update mandatory checks
        session['mandatory_checks'] = update_mandatory_checks(
            session['mandatory_checks'],
            feature
        )
        
        # Decide next question
        next_q = decide_next_question(
            groq_client,
            session['conversation_history'],
            session['chief_complaint'],
            session['features'],
            session['mandatory_checks'],
            session['language']
        )
        
        if next_q is None:
            # Conversation complete
            return jsonify({
                'done': True,
                'next_question': None,
                'extracted_features': session['features'],
                'questions_asked': len(session['conversation_history'])
            })
        
        return jsonify({
            'done': False,
            'next_question': next_q,
            'extracted_features': session['features'],
            'questions_asked': len(session['conversation_history'])
        })
        
    except Exception as e:
        print(f"❌ Error getting next question: {e}")
        return jsonify({'error': str(e)}), 500


@voice_triage_bp.route('/finalize', methods=['POST'])
def finalize_triage():
    """
    Finalize triage session - call ML model and generate closing
    
    Request body:
    {
      "session_id": "...",
      "vitals": {
        "bp": "120/80",
        "temp": "98.6",
        "spo2": "98",
        "pulse": "75"
      } (optional)
    }
    
    Response:
    {
      "ml_result": {
        "urgency_level": 0-3,
        "risk_level": "low|medium|high|emergency",
        "score": 0-100,
        "confidence": 0-100,
        "flags": [...],
        "hospital_level": 1-4,
        "hospital_level_label": "...",
        "specialist": "...",
        ... (full ML model output)
      },
      "warm_closing": "Patient-facing warm message",
      "conversation_summary": {
        "chief_complaint": "...",
        "questions_asked": number,
        "features_extracted": {...},
        "language": "..."
      }
    }
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        vitals = data.get('vitals', {})
        
        if not session_id or session_id not in sessions:
            return jsonify({'error': 'Invalid or expired session'}), 404
        
        session = sessions[session_id]
        
        # Prepare input for ML model
        # Convert conversation to answers array for ML model
        answers = [turn.answer for turn in session['conversation_history']]
        
        ml_input = {
            'vitals': vitals,
            'answers': answers,
            'severity': session['features'].get('severity', {}).get('value'),
            'duration_days': session['features'].get('duration_days', {}).get('value'),
            'patient_id': session_id  # For logging
        }
        
        # Import ML prediction function from app.py
        from app import extract_features, model, scaler
        
        if model is None:
            return jsonify({'error': 'ML model not loaded. Please train the model first.'}), 503
        
        # Extract features and predict
        features_array = extract_features(ml_input)
        features_scaled = scaler.transform(features_array)
        
        urgency_level = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = float(max(probabilities))
        
        # Build ML result (matching app.py format)
        risk_mapping = {
            0: {'level': 'low', 'label': 'Low Risk'},
            1: {'level': 'medium', 'label': 'Moderate Risk'},
            2: {'level': 'high', 'label': 'High Risk'},
            3: {'level': 'emergency', 'label': 'Emergency'}
        }
        
        hospital_level_mapping = {
            0: {'hospital_level': 1, 'hospital_level_label': 'Sub-Centre / ASHA', 'hospital_level_desc': 'Manage at home with ASHA guidance'},
            1: {'hospital_level': 2, 'hospital_level_label': 'PHC / CHC', 'hospital_level_desc': 'Primary Health Centre'},
            2: {'hospital_level': 3, 'hospital_level_label': 'District Hospital', 'hospital_level_desc': 'District or Rural Hospital'},
            3: {'hospital_level': 4, 'hospital_level_label': 'Tertiary / Medical College', 'hospital_level_desc': 'Tertiary care hospital'}
        }
        
        # Generate flags
        flags = []
        f = features_array[0]
        if f[0] > 180 or f[1] > 120:  flags.append('Critical blood pressure')
        if f[2] >= 102:                flags.append('High fever')
        if f[3] < 90:                  flags.append('Low oxygen saturation')
        if f[4] > 120 or f[4] < 50:   flags.append('Abnormal pulse')
        if f[5] >= 8:                  flags.append('Severe pain reported')
        if f[7] == 1:                  flags.append('Chest pain reported')
        if f[8] == 1:                  flags.append('Breathing difficulty')
        if f[9] == 1:                  flags.append('Severe headache')
        if f[10] == 1:                 flags.append('Bleeding reported')
        if f[11] == 1:                 flags.append('Seizure / convulsion')
        
        risk = risk_mapping[urgency_level]
        hosp = hospital_level_mapping[urgency_level]
        score = int(25 * urgency_level + 12.5 + confidence * 12.5)
        
        # ⚠️ CRITICAL OVERRIDE: Chest pain = automatic high risk minimum
        if f[7] == 1:  # chest_pain feature
            if urgency_level < 2:  # If model said low or medium
                print(f"⚠️ OVERRIDE: Chest pain detected, escalating from {risk['level']} to HIGH")
                urgency_level = 2  # Force to HIGH minimum
                risk = risk_mapping[2]
                hosp = hospital_level_mapping[2]
                score = max(score, 65)  # Minimum score 65 for chest pain
        
        # ⚠️ CRITICAL OVERRIDE: Severe pain (>= 8/10) with chest pain = emergency
        if f[7] == 1 and f[5] >= 8:
            print(f"🚨 EMERGENCY OVERRIDE: Severe chest pain detected")
            urgency_level = 3  # Force to EMERGENCY
            risk = risk_mapping[3]
            hosp = hospital_level_mapping[3]
            score = max(score, 80)  # Minimum score 80 for severe chest pain
        
        ml_result = {
            'urgency_level': int(urgency_level),
            'risk_level': risk['level'],
            'risk_label': risk['label'],
            'score': score,
            'confidence': round(confidence * 100, 1),
            'auto_escalate': bool(urgency_level >= 3),
            'flags': flags,
            'hospital_level': hosp['hospital_level'],
            'hospital_level_label': hosp['hospital_level_label'],
            'hospital_level_desc': hosp['hospital_level_desc'],
            'probabilities': {
                'low': round(float(probabilities[0]) * 100, 1),
                'medium': round(float(probabilities[1]) * 100, 1),
                'high': round(float(probabilities[2]) * 100, 1),
                'emergency': round(float(probabilities[3]) * 100, 1)
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Generate warm closing message
        warm_closing, _ = generate_warm_closing(
            groq_client,
            ml_result,
            session['language']
        )
        
        # Build conversation summary
        conversation_summary = {
            'chief_complaint': session['chief_complaint'],
            'category': session['category'],
            'language': session['language'],
            'questions_asked': len(session['conversation_history']),
            'features_extracted': session['features'],
            'conversation_transcript': [
                {'question': turn.question, 'answer': turn.answer}
                for turn in session['conversation_history']
            ],
            'mandatory_checks_status': {
                'all_covered': len(session['mandatory_checks']) == 0,
                'remaining': [check.name for check in session['mandatory_checks']]
            }
        }
        
        print(f"✅ Finalized triage session {session_id}: {risk['label']} (score: {score})")
        
        return jsonify({
            'ml_result': ml_result,
            'warm_closing': warm_closing,
            'conversation_summary': conversation_summary
        })
        
    except Exception as e:
        print(f"❌ Error finalizing triage: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@voice_triage_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id: str):
    """Get current session state"""
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    session = sessions[session_id]
    return jsonify({
        'session_id': session_id,
        'chief_complaint': session['chief_complaint'],
        'language': session['language'],
        'category': session['category'],
        'questions_asked': len(session['conversation_history']),
        'features': session['features'],
        'mandatory_checks_remaining': len(session['mandatory_checks'])
    })


@voice_triage_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for voice triage service"""
    return jsonify({
        'status': 'healthy',
        'groq_available': groq_client.api_key != "",
        'active_sessions': len(sessions),
        'timestamp': datetime.now().isoformat()
    })


# Function to register blueprint with main Flask app
def register_voice_triage_routes(app):
    """Register voice triage blueprint with Flask app"""
    app.register_blueprint(voice_triage_bp)
    print("✅ Voice triage routes registered at /voice-triage/*")
