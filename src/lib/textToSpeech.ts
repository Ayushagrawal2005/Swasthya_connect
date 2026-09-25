/**
 * Text-to-Speech Utility
 * Wrapper around Web Speech Synthesis API for consistent voice output
 */

type Language = 'en' | 'hi' | 'mr'

const LANGUAGE_CODES: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
}

class TextToSpeechManager {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
    }
  }

  /**
   * Check if TTS is supported in the browser
   */
  isSupported(): boolean {
    return this.synthesis !== null
  }

  /**
   * Speak the given text in the specified language
   */
  speak(text: string, language: Language = 'en', options?: {
    rate?: number
    pitch?: number
    volume?: number
    onEnd?: () => void
    onError?: (error: any) => void
  }) {
    console.log('[TTS] speak() called:', { text, language, enabled: this.enabled, supported: this.isSupported() })
    
    if (!this.isSupported()) {
      console.warn('[TTS] Speech synthesis not supported in this browser')
      return
    }
    
    if (!this.enabled) {
      console.log('[TTS] TTS is disabled')
      return
    }
    
    if (!text.trim()) {
      console.warn('[TTS] Empty text provided')
      return
    }

    // Cancel any ongoing speech
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANGUAGE_CODES[language]
    utterance.rate = options?.rate ?? 0.85 // Slightly slower for clarity
    utterance.pitch = options?.pitch ?? 1.0
    utterance.volume = options?.volume ?? 1.0

    // Try to find a voice for the language
    const voices = this.synthesis!.getVoices()
    console.log('[TTS] Available voices:', voices.length, voices.map(v => ({ name: v.name, lang: v.lang })))
    
    const preferredVoice = voices.find(v => 
      v.lang === LANGUAGE_CODES[language] || 
      v.lang.startsWith(language)
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
      console.log('[TTS] Using voice:', preferredVoice.name, preferredVoice.lang)
    } else {
      console.warn('[TTS] No preferred voice found for', language, 'using default')
    }

    // Event handlers
    utterance.onstart = () => {
      console.log('[TTS] Started speaking:', text.substring(0, 50))
    }
    
    utterance.onend = () => {
      console.log('[TTS] Finished speaking')
      if (options?.onEnd) options.onEnd()
    }
    
    utterance.onerror = (event) => {
      console.error('[TTS] Error:', event)
      if (options?.onError) options.onError(event)
    }

    this.currentUtterance = utterance
    console.log('[TTS] Calling synthesis.speak()')
    this.synthesis!.speak(utterance)
  }

  /**
   * Stop any ongoing speech
   */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.currentUtterance = null
    }
  }

  /**
   * Pause ongoing speech
   */
  pause() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause()
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false
  }

  /**
   * Enable/disable TTS
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  /**
   * Check if TTS is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Load voices (some browsers require this)
   */
  loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve([])
        return
      }

      const voices = this.synthesis.getVoices()
      if (voices.length > 0) {
        resolve(voices)
        return
      }

      // Some browsers load voices async
      this.synthesis.onvoiceschanged = () => {
        const loadedVoices = this.synthesis!.getVoices()
        resolve(loadedVoices)
      }

      // Fallback timeout
      setTimeout(() => {
        resolve(this.synthesis!.getVoices())
      }, 1000)
    })
  }
}

// Singleton instance
const tts = new TextToSpeechManager()

export default tts

// Convenience functions
export const speak = (text: string, language: Language = 'en', options?: Parameters<typeof tts.speak>[2]) => {
  tts.speak(text, language, options)
}

export const stopSpeaking = () => {
  tts.stop()
}

export const pauseSpeaking = () => {
  tts.pause()
}

export const resumeSpeaking = () => {
  tts.resume()
}

export const isSpeaking = () => {
  tts.isSpeaking()
}

export const setTTSEnabled = (enabled: boolean) => {
  tts.setEnabled(enabled)
}

export const isTTSSupported = () => {
  tts.isSupported()
}
