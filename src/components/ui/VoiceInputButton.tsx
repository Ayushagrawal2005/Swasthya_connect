/**
 * Voice Input Button Component
 * Microphone button with recording animation and voice input
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react'
import { voiceService, type SupportedLanguage } from '../../services/voiceService'
import { useTranslation } from 'react-i18next'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  language?: SupportedLanguage
  placeholder?: string
  className?: string
  variant?: 'icon' | 'button' | 'fab'
  showTranscript?: boolean
}

export function VoiceInputButton({
  onTranscript,
  language,
  placeholder = 'Tap to speak...',
  className = '',
  variant = 'icon',
  showTranscript = true,
}: VoiceInputButtonProps) {
  const { t, i18n } = useTranslation()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Get language from i18n if not provided
  const getLang = (): SupportedLanguage => {
    if (language) return language
    
    const currentLang = i18n.language
    const langMap: Record<string, SupportedLanguage> = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN',
      'ta': 'ta-IN',
    }
    
    return langMap[currentLang] || 'en-IN'
  }

  const handleVoiceInput = async () => {
    // Check browser support
    if (!voiceService.isSpeechRecognitionSupported()) {
      setError(t('voice.notSupported'))
      return
    }

    if (isListening) {
      // Stop listening
      voiceService.stopListening()
      setIsListening(false)
      return
    }

    try {
      setIsListening(true)
      setError(null)
      setTranscript('')

      // Start listening
      const result = await voiceService.startListening(getLang())
      
      setTranscript(result)
      onTranscript(result)
      
      // Optional: Read back the transcript
      if (result) {
        voiceService.speak(result, getLang())
      }

    } catch (error: any) {
      console.error('Voice input error:', error)
      setError(error.message || 'Voice input failed')
    } finally {
      setIsListening(false)
    }
  }

  // Render based on variant
  const renderButton = () => {
    const baseClasses = `
      relative flex items-center justify-center gap-2
      transition-all duration-200 active:scale-95
      ${className}
    `

    if (variant === 'icon') {
      return (
        <button
          onClick={handleVoiceInput}
          className={`
            ${baseClasses}
            w-10 h-10 rounded-full
            ${isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
            }
            text-white shadow-lg hover:shadow-xl
          `}
          title={isListening ? 'Stop recording' : placeholder}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          
          {/* Pulse Animation */}
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </button>
      )
    }

    if (variant === 'button') {
      return (
        <button
          onClick={handleVoiceInput}
          className={`
            ${baseClasses}
            px-4 py-2 rounded-lg font-medium text-sm
            ${isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'
            }
          `}
        >
          {isListening ? (
            <>
              <MicOff size={18} />
              <span>{t('voice.listening')}</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-white rounded-full"
              />
            </>
          ) : (
            <>
              <Mic size={18} />
              <span>{t('voice.tapToSpeak')}</span>
            </>
          )}
        </button>
      )
    }

    if (variant === 'fab') {
      return (
        <button
          onClick={handleVoiceInput}
          className={`
            ${baseClasses}
            w-14 h-14 rounded-full shadow-2xl
            ${isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }
            text-white
          `}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          
          {/* Ripple Effect */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-red-400"
                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-red-300"
                animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </button>
      )
    }

    return null
  }

  return (
    <div className="relative">
      {renderButton()}

      {/* Transcript Display */}
      <AnimatePresence>
        {showTranscript && transcript && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl px-4 py-3 max-w-xs">
              <div className="flex items-start gap-2">
                <Volume2 size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-xl px-4 py-3 max-w-xs">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening Indicator (Global) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={() => {
              voiceService.stopListening()
              setIsListening(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                {/* Animated Microphone */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto"
                >
                  <Mic size={40} className="text-white" />
                </motion.div>

                {/* Text */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {t('voice.listening')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('voice.speakCommand')}
                  </p>
                </div>

                {/* Sound Wave Animation */}
                <div className="flex items-center justify-center gap-1 h-16">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [20, 40, 20],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-red-500 rounded-full"
                    />
                  ))}
                </div>

                {/* Stop Button */}
                <button
                  onClick={() => {
                    voiceService.stopListening()
                    setIsListening(false)
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
