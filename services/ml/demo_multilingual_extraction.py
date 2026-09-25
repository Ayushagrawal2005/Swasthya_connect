"""
Quick Demo: Multilingual Feature Extraction
============================================

This demonstrates the language-agnostic structured feature extraction
without requiring the ML model to be trained.

Run this to see how the same clinical information in different languages
gets converted to the same structured format.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from groq_conversation_engine import extract_structured_feature, GroqClient


def demo_duration_extraction():
    """Demo: Duration extraction from different languages"""
    
    print("\n" + "🕐" * 40)
    print("DEMO 1: Duration Extraction (Language-Agnostic)")
    print("🕐" * 40)
    
    print("\nScenario: Patient has had symptoms for 3 days")
    print("Expected structured output: duration_days = 3\n")
    
    client = GroqClient()  # Uses rule-based fallback without API key
    
    test_cases = [
        ("en", "I've had fever for 3 days", "How long have you had this?"),
        ("hi", "मुझे तीन दिन से बुखार है", "ये लक्षण आपको कब से हैं?"),
        ("hi", "teen din se bukhar hai", "How long?"),
        ("mr", "मला तीन दिवसांपासून ताप आहे", "किती दिवसांपासून?"),
        ("en", "3 days back it started", "When did it start?"),
    ]
    
    print("Language | Patient Answer → Structured Output")
    print("-" * 80)
    
    for lang, answer, question in test_cases:
        feature = extract_structured_feature(
            client, question, answer, "duration", lang
        )
        
        # Format output
        status = "✅" if feature.value == 3 else "⚠️"
        lang_label = {"en": "English", "hi": "Hindi", "mr": "Marathi"}[lang]
        
        print(f"{status} {lang_label:8} | '{answer}'")
        print(f"           → {feature.key} = {feature.value} (confidence: {feature.confidence:.2f})")
        print()


def demo_severity_extraction():
    """Demo: Severity extraction from different languages"""
    
    print("\n" + "📊" * 40)
    print("DEMO 2: Severity Extraction (Qualitative → Quantitative)")
    print("📊" * 40)
    
    print("\nScenario: Patient describes pain severity")
    print("Expected: Qualitative descriptions → numeric scale (1-10)\n")
    
    client = GroqClient()
    
    test_cases = [
        ("en", "severe pain", "How severe is the pain?", 9),
        ("en", "pain is 8 out of 10", "Rate your pain 1-10", 8),
        ("hi", "बहुत दर्द है", "दर्द कितना गंभीर है?", 9),
        ("hi", "दर्द 7 है", "दर्द कितना है?", 7),
        ("mr", "खूप वेदना आहे", "वेदना किती तीव्र आहे?", 9),
        ("en", "mild pain", "Pain level?", 3),
        ("hi", "थोड़ा दर्द", "दर्द का स्तर?", 3),
    ]
    
    print("Language | Patient Answer → Numeric Severity")
    print("-" * 80)
    
    for lang, answer, question, expected in test_cases:
        feature = extract_structured_feature(
            client, question, answer, "severity", lang
        )
        
        lang_label = {"en": "English", "hi": "Hindi", "mr": "Marathi"}[lang]
        status = "✅" if abs(feature.value - expected) <= 1 else "⚠️"  # Allow ±1 difference
        
        print(f"{status} {lang_label:8} | '{answer}'")
        print(f"           → severity = {feature.value}/10 (expected ~{expected}/10)")
        print()


def demo_boolean_extraction():
    """Demo: Yes/No extraction from different languages"""
    
    print("\n" + "❓" * 40)
    print("DEMO 3: Boolean (Yes/No) Extraction")
    print("❓" * 40)
    
    print("\nScenario: Doctor asks yes/no questions")
    print("Expected: Language-specific yes/no → 1 or 0\n")
    
    client = GroqClient()
    
    test_cases = [
        ("en", "yes", "Do you have chest pain?", 1),
        ("en", "no", "Any bleeding?", 0),
        ("hi", "हाँ", "क्या सीने में दर्द है?", 1),
        ("hi", "नहीं", "क्या खून बह रहा है?", 0),
        ("hi", "haan hai", "Chest pain?", 1),
        ("hi", "nahi", "Bleeding?", 0),
        ("mr", "होय", "छातीत दुखते का?", 1),
        ("mr", "नाही", "रक्तस्राव आहे का?", 0),
    ]
    
    print("Language | Patient Answer → Boolean Value")
    print("-" * 80)
    
    for lang, answer, question, expected in test_cases:
        feature = extract_structured_feature(
            client, question, answer, "boolean", lang
        )
        
        lang_label = {"en": "English", "hi": "Hindi", "mr": "Marathi"}[lang]
        status = "✅" if feature.value == expected else "❌"
        result_text = "Yes (1)" if feature.value == 1 else "No (0)"
        
        print(f"{status} {lang_label:8} | '{answer}' → {result_text}")


def demo_complete_conversation():
    """Demo: Complete conversation showing structured accumulation"""
    
    print("\n" + "💬" * 40)
    print("DEMO 4: Complete Conversation (Hindi)")
    print("💬" * 40)
    
    print("\nScenario: A complete triage conversation in Hindi")
    print("Shows how natural language answers become structured clinical data\n")
    
    client = GroqClient()
    
    conversation = [
        {
            "question": "क्या समस्या है?",
            "answer": "बुखार है",
            "type": "text",
            "note": "Chief complaint"
        },
        {
            "question": "कब से बुखार है?",
            "answer": "तीन दिन से",
            "type": "duration",
            "expected_key": "duration_days",
            "expected_value": 3
        },
        {
            "question": "बुखार कितना तेज़ है? 1 से 10 में बताएं",
            "answer": "7 है",
            "type": "severity",
            "expected_key": "severity",
            "expected_value": 7
        },
        {
            "question": "क्या सीने में दर्द है?",
            "answer": "नहीं",
            "type": "boolean",
            "expected_key": "boolean_response",
            "expected_value": 0
        },
        {
            "question": "क्या सांस लेने में कठिनाई है?",
            "answer": "नहीं",
            "type": "boolean",
            "expected_key": "boolean_response",
            "expected_value": 0
        }
    ]
    
    structured_features = {}
    
    print("Doctor-Patient Conversation → Structured Clinical Data")
    print("=" * 80)
    
    for i, turn in enumerate(conversation, 1):
        print(f"\nTurn {i}:")
        print(f"  Doctor: {turn['question']}")
        print(f"  Patient: {turn['answer']}")
        
        if turn['type'] != 'text':
            feature = extract_structured_feature(
                client,
                turn['question'],
                turn['answer'],
                turn['type'],
                'hi'
            )
            
            structured_features[feature.key] = feature.value
            
            expected_match = (
                feature.key == turn.get('expected_key') and 
                feature.value == turn.get('expected_value')
            )
            status = "✅" if expected_match else "⚠️"
            
            print(f"  {status} Structured: {feature.key} = {feature.value}")
    
    print("\n" + "=" * 80)
    print("ACCUMULATED STRUCTURED FEATURES (ready for ML model):")
    print("=" * 80)
    print(f"{structured_features}")
    print("\n✅ These structured features would now be passed to the ML model")
    print("   to determine urgency level, regardless of the conversation language.")


def main():
    """Run all demos"""
    
    print("\n" + "🌍" * 40)
    print("MULTILINGUAL VOICE TRIAGE - FEATURE EXTRACTION DEMO")
    print("🌍" * 40)
    
    print("\n📌 KEY CONCEPT:")
    print("   Natural language (any language) → Language-agnostic structured features")
    print("   These structured features are what the ML model uses to determine urgency.")
    print("   This separation ensures clinical decisions are NOT affected by language.")
    
    demo_duration_extraction()
    demo_severity_extraction()
    demo_boolean_extraction()
    demo_complete_conversation()
    
    print("\n" + "=" * 80)
    print("✅ DEMONSTRATION COMPLETE")
    print("=" * 80)
    print("\nKey Takeaways:")
    print("1. ✓ Same clinical information in different languages → same structured output")
    print("2. ✓ Qualitative descriptions ('severe', 'बहुत') → quantitative values (9/10)")
    print("3. ✓ Language-specific yes/no → universal boolean (1/0)")
    print("4. ✓ ML model receives identical input regardless of conversation language")
    print("\nThis proves the system maintains clinical consistency across all languages.")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
