from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from datetime import datetime
import os

import json

app = Flask(__name__)
CORS(app)

# Load the trained model
MODEL_PATH   = os.path.join(os.path.dirname(__file__), 'models', 'triage_model.pkl')
SCALER_PATH  = os.path.join(os.path.dirname(__file__), 'models', 'scaler.pkl')
METADATA_PATH= os.path.join(os.path.dirname(__file__), 'models', 'model_metadata.json')

try:
    model    = joblib.load(MODEL_PATH)
    scaler   = joblib.load(SCALER_PATH)
    with open(METADATA_PATH) as f:
        MODEL_META = json.load(f)
    print(f"✓ ML Model loaded  ({MODEL_META.get('model','?')}, acc={MODEL_META.get('accuracy','?')})")
except Exception as e:
    model = scaler = None
    MODEL_META = {}
    print(f"⚠ Model not found: {e}. Run train_final.py first")

# Feature order MUST match train_final.py FEATURE_COLS exactly:
# bp_sys, bp_dia, temp, spo2, pulse, severity, duration_days,
# chest_pain, breathing, headache, bleeding, seizure
FEATURE_COLS = [
    'bp_sys', 'bp_dia', 'temp', 'spo2', 'pulse',
    'severity', 'duration_days',
    'chest_pain', 'breathing', 'headache', 'bleeding', 'seizure'
]

def _safe_float(val, default):
    try:
        return float(val)
    except:
        return default

def _parse_bp(raw):
    try:
        parts = raw.split('/')
        return float(parts[0]), float(parts[1])
    except:
        return 120.0, 80.0

def _parse_severity(answers):
    import re
    for a in answers:
        m = re.search(r'\b(10|[1-9])\b', a)
        if m:
            return int(m.group(1))
    return 5

def _parse_duration(answers):
    import re
    for a in answers:
        m = re.search(r'(\d+)\s*(day|week)', a, re.I)
        if m:
            n = int(m.group(1))
            return n * 7 if 'week' in m.group(2).lower() else n
    return 1

def extract_features(data):
    """
    Extract 12 features in the exact order matching train_final.py
    """
    vitals  = data.get('vitals', {})
    answers = data.get('answers', [])
    text    = ' '.join(answers).lower()

    bp_sys, bp_dia = _parse_bp(vitals.get('bp', '120/80'))
    temp   = _safe_float(vitals.get('temp',  '98.6'), 98.6)
    spo2   = _safe_float(vitals.get('spo2',  '98'),   98.0)
    pulse  = _safe_float(vitals.get('pulse', '80'),   80.0)

    severity     = data.get('severity') or _parse_severity(answers)
    duration     = data.get('duration_days') or _parse_duration(answers)

    chest_pain   = 1 if any(k in text for k in ['chest pain', 'chest tightness', 'chest pressure']) else 0
    breathing    = 1 if any(k in text for k in ['breathe', 'breathing', 'breathless', 'shortness', 'dyspnoea']) else 0
    headache     = 1 if any(k in text for k in ['headache', 'head pain', 'head ache']) else 0
    bleeding     = 1 if any(k in text for k in ['bleed', 'bleeding', 'haemorrhage']) else 0
    seizure      = 1 if any(k in text for k in ['convuls', 'seizure', 'fitting', 'fits']) else 0

    features = [bp_sys, bp_dia, temp, spo2, pulse,
                severity, duration,
                chest_pain, breathing, headache, bleeding, seizure]

    return np.array(features, dtype=float).reshape(1, -1)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_name':   MODEL_META.get('model', 'unknown'),
        'accuracy':     MODEL_META.get('accuracy', 0),
        'cv_mean':      MODEL_META.get('cv_mean', 0),
        'total_samples':MODEL_META.get('total_samples', 0),
        'real_samples': MODEL_META.get('real_samples', 0),
        'rural_samples':MODEL_META.get('rural_samples', 0),
        'datasets_used':[
            {'name': k, 'rows': v['rows'], 'source': v['source']}
            for k, v in MODEL_META.get('datasets', {}).items()
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict_triage():
    """
    Predict triage urgency level
    Input: JSON with vitals, answers, severity, duration_days
    Output: urgency level (0-3), score, confidence, flags
    """
    if model is None:
        return jsonify({'error': 'Model not loaded. Run train_model.py first'}), 503
    
    try:
        data = request.get_json()
        
        # Extract features
        features = extract_features(data)
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Predict
        urgency_level = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = float(max(probabilities))
        
        # Map urgency level to risk category
        risk_mapping = {
            0: {'level': 'low', 'label': 'Low Risk', 'score_range': '0-39'},
            1: {'level': 'medium', 'label': 'Moderate Risk', 'score_range': '40-59'},
            2: {'level': 'high', 'label': 'High Risk', 'score_range': '60-74'},
            3: {'level': 'emergency', 'label': 'Emergency', 'score_range': '75-100'}
        }

        # Map urgency level to recommended hospital level (India public health system)
        hospital_level_mapping = {
            0: {'hospital_level': 1, 'hospital_level_label': 'Sub-Centre / ASHA',        'hospital_level_desc': 'Manage at home with ASHA guidance'},
            1: {'hospital_level': 2, 'hospital_level_label': 'PHC / CHC',                'hospital_level_desc': 'Primary Health Centre or Community Health Centre'},
            2: {'hospital_level': 3, 'hospital_level_label': 'District Hospital',         'hospital_level_desc': 'District or Rural Hospital'},
            3: {'hospital_level': 4, 'hospital_level_label': 'Tertiary / Medical College','hospital_level_desc': 'Tertiary care — Medical College or Super-Speciality Hospital'},
        }
        
        risk  = risk_mapping[urgency_level]
        hosp  = hospital_level_mapping[urgency_level]
        score = int(25 * urgency_level + 12.5 + confidence * 12.5)  # Convert to 0-100 scale
        
        # Generate flags  (indices match FEATURE_COLS order)
        # FEATURE_COLS: bp_sys[0],bp_dia[1],temp[2],spo2[3],pulse[4],severity[5],
        #               duration_days[6],chest_pain[7],breathing[8],headache[9],bleeding[10],seizure[11]
        flags = []
        f = features[0]
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
        
        response = {
            'urgency_level': int(urgency_level),
            'risk_level':    risk['level'],
            'risk_label':    risk['label'],
            'score':         score,
            'confidence':    round(confidence * 100, 1),
            'auto_escalate': bool(urgency_level >= 3),
            'flags':         flags,
            'hospital_level':       hosp['hospital_level'],
            'hospital_level_label': hosp['hospital_level_label'],
            'hospital_level_desc':  hosp['hospital_level_desc'],
            'probabilities': {
                'low':       round(float(probabilities[0]) * 100, 1),
                'medium':    round(float(probabilities[1]) * 100, 1),
                'high':      round(float(probabilities[2]) * 100, 1),
                'emergency': round(float(probabilities[3]) * 100, 1)
            },
            'model_info': {
                'algorithm':      MODEL_META.get('model', 'unknown'),
                'accuracy':       MODEL_META.get('accuracy', 0),
                'total_training': MODEL_META.get('total_samples', 0),
                'datasets': [
                    {'name': k, 'rows': v['rows'], 'source': v['source']}
                    for k, v in MODEL_META.get('datasets', {}).items()
                ]
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Process multiple triage cases at once"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    
    try:
        cases = request.get_json().get('cases', [])
        results = []
        
        for case in cases:
            features = extract_features(case)
            features_scaled = scaler.transform(features)
            urgency = model.predict(features_scaled)[0]
            prob = model.predict_proba(features_scaled)[0]
            
            results.append({
                'patient_id': case.get('patient_id'),
                'urgency_level': int(urgency),
                'confidence': round(float(max(prob)) * 100, 1)
            })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
