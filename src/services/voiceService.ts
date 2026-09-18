/**
 * Voice Service
 * Handles voice input (Speech Recognition) and text-to-speech (TTS) for multiple languages
 */

type SupportedLanguage = 'en-IN' | 'hi-IN' | 'mr-IN' | 'bn-IN' | 'ta-IN' | 'te-IN'

interface VoiceCommand {
  command: string
  callback: () => void
  language?: SupportedLanguage
}

class VoiceService {
  private recognition: any = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private currentLanguage: SupportedLanguage = 'en-IN'
  private voiceCommands: VoiceCommand[] = []

  constructor() {
    this.initializeSpeechRecognition()
    this.initializeSpeechSynthesis()
  }

  /**
   * Initialize Speech Recognition (Voice Input)
   */
  private initializeSpeechRecognition(): void {
    // Check browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('⚠️ Speech Recognition not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = this.currentLanguage

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      console.log(`🎤 Voice input: "${transcript}" (confidence: ${confidence.toFixed(2)})`)
      
      // Check for voice commands
      this.processVoiceCommand(transcript)
    }

    this.recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('🎤 Speech recognition ended')
    }
  }

  /**
   * Initialize Speech Synthesis (Text-to-Speech)
   */
  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      console.log('✅ Text-to-Speech initialized')
    } else {
      console.warn('⚠️ Text-to-Speech not supported in this browser')
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(lang: SupportedLanguage = 'en-IN'): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported')
    }

    if (this.isListening) {
      console.warn('Already listening...')
      return ''
    }

    this.currentLanguage = lang
    this.recognition.lang = lang
    this.isListening = true

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        console.log(`🎤 Captured: "${transcript}" (${confidence.toFixed(2)})`)
        this.isListening = false
        resolve(transcript)
      }

      this.recognition.onerror = (event: any) => {
        console.error('❌ Recognition error:', event.error)
        this.isListening = false
        reject(new Error(event.error))
      }

      try {
        this.recognition.start()
        console.log(`🎤 Listening in ${lang}...`)
      } catch (error) {
        this.isListening = false
        reject(error)
      }
    })
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
      console.log('🛑 Stopped listening')
    }
  }

  /**
   * Speak text using TTS
   */
  speak(text: string, lang: string = 'en-IN'): Promise<void> {
    if (!this.synthesis) {
      console.warn('⚠️ Text-to-Speech not available')
      return Promise.resolve()
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => {
        console.log('🔊 Speech finished')
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event)
        reject(event)
      }

      this.synthesis.speak(utterance)
      console.log(`🔊 Speaking: "${text}" in ${lang}`)
    })
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      console.log('🛑 Stopped speaking')
    }
  }

  /**
   * Register a voice command
   */
  registerVoiceCommand(
    command: string,
    callback: () => void,
    language?: SupportedLanguage
  ): void {
    this.voiceCommands.push({
      command: command.toLowerCase(),
      callback,
      language,
    })
    console.log(`📝 Registered voice command: "${command}"`)
  }

  /**
   * Process voice command
   */
  private processVoiceCommand(transcript: string): void {
    const lowerTranscript = transcript.toLowerCase()

    for (const cmd of this.voiceCommands) {
      // Check if command matches (exact or contains)
      if (
        lowerTranscript === cmd.command ||
        lowerTranscript.includes(cmd.command)
      ) {
        // Check language match (if specified)
        if (!cmd.language || cmd.language === this.currentLanguage) {
          console.log(`✅ Voice command matched: "${cmd.command}"`)
          cmd.callback()
          return
        }
      }
    }

    console.log('❓ No matching voice command found')
  }

  /**
   * Get available voices for a language
   */
  getVoicesForLanguage(lang: string): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    
    const voices = this.synthesis.getVoices()
    return voices.filter(voice => voice.lang.startsWith(lang.split('-')[0]))
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return !!this.recognition
  }

  /**
   * Check if text-to-speech is supported
   */
  isTextToSpeechSupported(): boolean {
    return !!this.synthesis
  }

  /**
   * Get current listening status
   */
  getListeningStatus(): boolean {
    return this.isListening
  }

  /**
   * Set language
   */
  setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang
    if (this.recognition) {
      this.recognition.lang = lang
    }
    console.log(`🌐 Language set to: ${lang}`)
  }

  /**
   * Translate voice command keywords
   */
  private getCommandKeywords(lang: SupportedLanguage): Record<string, string> {
    const keywords: Record<SupportedLanguage, Record<string, string>> = {
      'en-IN': {
        register: 'register',
        patient: 'patient',
        triage: 'triage',
        save: 'save',
        cancel: 'cancel',
        search: 'search',
        start: 'start',
        stop: 'stop',
      },
      'hi-IN': {
        register: 'पंजीकरण',
        patient: 'मरीज',
        triage: 'ट्राइएज',
        save: 'सेव',
        cancel: 'रद्द',
        search: 'खोज',
        start: 'शुरू',
        stop: 'बंद',
      },
      'mr-IN': {
        register: 'नोंदणी',
        patient: 'रुग्ण',
        triage: 'ट्रायेज',
        save: 'जतन',
        cancel: 'रद्द',
        search: 'शोध',
        start: 'सुरू',
        stop: 'थांबा',
      },
      'bn-IN': {
        register: 'নিবন্ধন',
        patient: 'রোগী',
        triage: 'ট্রায়াজ',
        save: 'সংরক্ষণ',
        cancel: 'বাতিল',
        search: 'অনুসন্ধান',
        start: 'শুরু',
        stop: 'থামা',
      },
      'ta-IN': {
        register: 'பதிவு',
        patient: 'நோயாளி',
        triage: 'ட்ரையேஜ்',
        save: 'சேமி',
        cancel: 'ரத்து',
        search: 'தேடு',
        start: 'தொடங்கு',
        stop: 'நிறுத்து',
      },
      'te-IN': {
        register: 'నమోదు',
        patient: 'రోగి',
        triage: 'ట్రయాజ్',
        save: 'సేవ్',
        cancel: 'రద్దు',
        search: 'వెతుకు',
        start: 'ప్రారంభం',
        stop: 'ఆపు',
      },
    }

    return keywords[lang] || keywords['en-IN']
  }

  /**
   * Get greeting message for language
   */
  getGreeting(lang: SupportedLanguage): string {
    const greetings: Record<SupportedLanguage, string> = {
      'en-IN': 'Welcome! How can I help you today?',
      'hi-IN': 'स्वागत है! आज मैं आपकी कैसे मदद कर सकता हूं?',
      'mr-IN': 'स्वागत आहे! आज मी तुम्हाला कशी मदत करू शकतो?',
      'bn-IN': 'স্বাগতম! আজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?',
      'ta-IN': 'வரவேற்கிறோம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      'te-IN': 'స్వాగతం! ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
    }

    return greetings[lang] || greetings['en-IN']
  }
}

// Export singleton instance
export const voiceService = new VoiceService()

// Export types
export type { SupportedLanguage }
