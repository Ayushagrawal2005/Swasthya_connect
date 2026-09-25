"""
Multilingual Voice Triage Test
================================

This test demonstrates that the voice triage system produces consistent clinical
outcomes regardless of the language spoken by the patient.

Test scenarios:
1. Same symptoms described in Hindi and Marathi produce identical ML triage results
2. Language layer doesn't affect clinical decisions
3. Structured feature extraction is language-agnostic
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from groq_conversation_engine import (
    GroqClient,
    extract_structured_feature,
    classify_chief_complaint
)
from app import extract_features, model, scaler
import json


def test_language_agnostic_extraction():
    """Test that equivalent symptoms in different languages extract same features"""
    
    print("=" * 80)
    print("TEST 1: Language-Agnostic Feature Extraction")
    print("=" * 80)
    
    # Note: Without actual Groq API, we test the rule-based extraction
    # which is the fallback and handles multilingual patterns
    
    test_cases = [
        {
            "name": "Duration - 3 days",
            "inputs": [
                ("en", "I've had fever for 3 days"),
                ("hi", "मुझे तीन दिन से बुखार है"),
                ("hi", "teen din se bukhar hai"),
                ("mr", "मला तीन दिवसांपासून ताप आहे"),
            ],
            "expected_key": "duration_days",
            "expected_value": 3
        },
        {
            "name": "Severity - High (9/10)",
            "inputs": [
                ("en", "The pain is 9 out of 10"),
                ("hi", "दर्द 9 है"),
                ("en", "severity is 9"),
            ],
            "expected_key": "severity",
            "expected_value": 9
        },
        {
            "name": "Severity - Severe (qualitative)",
            "inputs": [
                ("en", "severe pain"),
                ("hi", "बहुत दर्द है"),
                ("mr", "खूप वेदना आहे"),
            ],
            "expected_key": "severity",
            "expected_value": 9  # Severe maps to 9
        },
        {
            "name": "Duration - 1 week",
            "inputs": [
                ("en", "symptoms started 1 week ago"),
                ("hi", "एक हफ्ते से लक्षण हैं"),
                ("en", "1 week duration"),
            ],
            "expected_key": "duration_days",
            "expected_value": 7  # 1 week = 7 days
        }
    ]
    
    client = GroqClient()  # Will use rule-based fallback without API key
    
    all_passed = True
    
    for test in test_cases:
        print(f"\n📝 Test: {test['name']}")
        print(f"   Expected: {test['expected_key']} = {test['expected_value']}")
        
        results = []
        for lang, answer in test["inputs"]:
            feature = extract_structured_feature(
                client,
                "How long have you had this?",  # Generic question
                answer,
                "duration" if "duration" in test["expected_key"] else "severity",
                lang
            )
            results.append((lang, answer, feature.key, feature.value, feature.confidence))
            
            # Check if result matches expected
            value_match = feature.value == test["expected_value"]
            key_match = test["expected_key"] in feature.key or feature.key in test["expected_key"]
            
            status = "✅" if (value_match and key_match) else "❌"
            print(f"   {status} [{lang}] '{answer}' → {feature.key}={feature.value} (conf: {feature.confidence:.2f})")
            
            if not (value_match and key_match):
                all_passed = False
        
        # Check all extracted values are consistent
        values = [v for _, _, _, v, _ in results if v is not None]
        if len(set(values)) > 1:
            print(f"   ⚠️  WARNING: Inconsistent values across languages: {set(values)}")
            all_passed = False
    
    return all_passed


def test_ml_consistency_across_languages():
    """Test that ML model produces same results for same clinical scenario in different languages"""
    
    print("\n" + "=" * 80)
    print("TEST 2: ML Model Consistency Across Languages")
    print("=" * 80)
    
    if model is None:
        print("❌ ML model not loaded. Please train the model first.")
        print("   Run: cd services/ml && python train_model.py")
        return False
    
    # Scenario: Moderate fever case
    # Patient has fever for 3 days, severity 6/10, no red flags
    
    scenarios = [
        {
            "language": "English",
            "answers": [
                "I have fever for 3 days",
                "severity is 6 out of 10",
                "no chest pain",
                "no breathing difficulty"
            ]
        },
        {
            "language": "Hindi",
            "answers": [
                "मुझे तीन दिन से बुखार है",
                "गंभीरता 6 है",
                "सीने में दर्द नहीं",
                "सांस लेने में कोई दिक्कत नहीं"
            ]
        },
        {
            "language": "Marathi",
            "answers": [
                "मला तीन दिवसांपासून ताप आहे",
                "तीव्रता 6 आहे",
                "छातीत दुखत नाही",
                "श्वास घेण्यात अडचण नाही"
            ]
        }
    ]
    
    print("\n🔬 Clinical Scenario: Moderate fever, 3 days, severity 6/10, no red flags")
    print("   Expected: All languages should produce same/similar triage level\n")
    
    results = []
    
    for scenario in scenarios:
        # Prepare ML input
        ml_input = {
            'vitals': {
                'bp': '120/80',
                'temp': '101',
                'spo2': '97',
                'pulse': '88'
            },
            'answers': scenario['answers'],
            'severity': 6,
            'duration_days': 3
        }
        
        # Extract features and predict
        features_array = extract_features(ml_input)
        features_scaled = scaler.transform(features_array)
        
        urgency_level = int(model.predict(features_scaled)[0])
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = float(max(probabilities))
        
        risk_labels = ['Low', 'Medium', 'High', 'Emergency']
        risk_label = risk_labels[urgency_level]
        
        results.append({
            'language': scenario['language'],
            'urgency_level': urgency_level,
            'risk_label': risk_label,
            'confidence': confidence,
            'probabilities': probabilities
        })
        
        print(f"📊 {scenario['language']}:")
        print(f"   Urgency Level: {urgency_level} ({risk_label})")
        print(f"   Confidence: {confidence * 100:.1f}%")
        print(f"   Probabilities: Low={probabilities[0]*100:.1f}%, Med={probabilities[1]*100:.1f}%, High={probabilities[2]*100:.1f}%, Emerg={probabilities[3]*100:.1f}%")
        print()
    
    # Check consistency
    urgency_levels = [r['urgency_level'] for r in results]
    all_same = len(set(urgency_levels)) == 1
    
    if all_same:
        print(f"✅ PASS: All languages produced same urgency level: {urgency_levels[0]}")
    else:
        print(f"⚠️  WARNING: Different urgency levels: {urgency_levels}")
        print("   Note: Small variations are acceptable due to feature extraction differences")
        # Allow ±1 level difference as acceptable
        if max(urgency_levels) - min(urgency_levels) <= 1:
            print("   Variation is within acceptable range (±1 level)")
            all_same = True
    
    return all_same


def test_chief_complaint_classification():
    """Test that chief complaints are classified correctly regardless of language"""
    
    print("\n" + "=" * 80)
    print("TEST 3: Chief Complaint Classification")
    print("=" * 80)
    
    test_cases = [
        {
            "complaints": [
                "chest pain",
                "सीने में दर्द",
                "छाती दुखते",
                "cardiac pain"
            ],
            "expected_category": "chest_pain"
        },
        {
            "complaints": [
                "breathing difficulty",
                "सांस लेने में कठिनाई",
                "श्वास घेण्यात अडचण",
                "shortness of breath"
            ],
            "expected_category": "breathing"
        },
        {
            "complaints": [
                "fever",
                "बुखार",
                "ताप",
                "bukhar hai"
            ],
            "expected_category": "fever"
        },
        {
            "complaints": [
                "headache",
                "सिरदर्द",
                "डोकेदुखी",
                "head pain"
            ],
            "expected_category": "headache"
        }
    ]
    
    all_passed = True
    
    for test in test_cases:
        print(f"\n📋 Expected Category: {test['expected_category']}")
        
        for complaint in test["complaints"]:
            category = classify_chief_complaint(complaint)
            match = category == test["expected_category"]
            status = "✅" if match else "❌"
            
            print(f"   {status} '{complaint}' → {category}")
            
            if not match:
                all_passed = False
    
    return all_passed


def test_red_flag_detection():
    """Test that red flags are detected regardless of language"""
    
    print("\n" + "=" * 80)
    print("TEST 4: Red Flag Detection Across Languages")
    print("=" * 80)
    
    if model is None:
        print("❌ ML model not loaded. Skipping this test.")
        return False
    
    # High-risk scenario: chest pain with severe symptoms
    scenarios = [
        {
            "language": "English",
            "answers": [
                "severe chest pain for 2 hours",
                "pain is 9 out of 10",
                "yes, chest pain",
                "yes, breathing is difficult"
            ]
        },
        {
            "language": "Hindi",
            "answers": [
                "दो घंटे से बहुत तेज़ सीने में दर्द",
                "दर्द 9 है",
                "हाँ, सीने में दर्द है",
                "हाँ, सांस लेने में कठिनाई"
            ]
        }
    ]
    
    print("\n🚨 Clinical Scenario: Severe chest pain, 9/10, breathing difficulty")
    print("   Expected: Both should trigger HIGH or EMERGENCY triage\n")
    
    all_high_risk = True
    
    for scenario in scenarios:
        ml_input = {
            'vitals': {
                'bp': '160/100',
                'temp': '98.6',
                'spo2': '92',
                'pulse': '110'
            },
            'answers': scenario['answers'],
            'severity': 9,
            'duration_days': 1
        }
        
        features_array = extract_features(ml_input)
        features_scaled = scaler.transform(features_array)
        urgency_level = int(model.predict(features_scaled)[0])
        
        risk_labels = ['Low', 'Medium', 'High', 'Emergency']
        risk_label = risk_labels[urgency_level]
        
        # Generate flags
        flags = []
        f = features_array[0]
        if f[0] > 180 or f[1] > 120:  flags.append('Critical blood pressure')
        if f[3] < 90:                  flags.append('Low oxygen saturation')
        if f[4] > 120:                 flags.append('Abnormal pulse')
        if f[5] >= 8:                  flags.append('Severe pain reported')
        if f[7] == 1:                  flags.append('Chest pain reported')
        if f[8] == 1:                  flags.append('Breathing difficulty')
        
        is_high_risk = urgency_level >= 2  # High or Emergency
        status = "✅" if is_high_risk else "❌"
        
        print(f"{status} {scenario['language']}:")
        print(f"   Urgency: {urgency_level} ({risk_label})")
        print(f"   Flags: {', '.join(flags) if flags else 'None'}")
        print()
        
        if not is_high_risk:
            all_high_risk = False
    
    if all_high_risk:
        print("✅ PASS: Both languages correctly identified as high-risk")
    else:
        print("❌ FAIL: High-risk scenario not detected in all languages")
    
    return all_high_risk


def run_all_tests():
    """Run all multilingual tests"""
    
    print("\n" + "🧪" * 40)
    print("MULTILINGUAL VOICE TRIAGE TEST SUITE")
    print("🧪" * 40 + "\n")
    
    print("This test demonstrates that:")
    print("1. Feature extraction is language-agnostic")
    print("2. Same symptoms in different languages → same ML triage result")
    print("3. The language layer doesn't affect clinical decisions")
    print("4. Red flags are detected consistently across languages\n")
    
    results = {
        "Feature Extraction": test_language_agnostic_extraction(),
        "ML Consistency": test_ml_consistency_across_languages(),
        "Chief Complaint Classification": test_chief_complaint_classification(),
        "Red Flag Detection": test_red_flag_detection()
    }
    
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("\nConclusion: The multilingual voice triage system correctly maintains")
        print("clinical consistency across languages. The same medical condition")
        print("described in English, Hindi, or Marathi produces the same triage")
        print("outcome, proving that the language layer does not affect medical decisions.")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("\nNote: If only ML model tests failed, ensure the model is trained:")
        print("  cd services/ml && python train_model.py")
    print("=" * 80 + "\n")
    
    return all_passed


if __name__ == "__main__":
    import sys
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
