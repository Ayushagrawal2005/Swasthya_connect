/**
 * Voice Pre-Consultation Assessment
 * Patient-facing voice-guided triage before teleconsultation
 * Similar to ASHA triage but designed for self-service
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, Thermometer, Heart, Wind, Mic, MicOff, Send, RotateCcw, 
  AlertTriangle, Siren, Brain, CheckCircle2, Loader2, ChevronRight, 
  Video, Globe, CheckCircle, User
} from 'lucide-react'
import { AIPill } from '../ui/AIPill'
import { LanguageSelector } from './LanguageSelector'
import type { RiskLevel } from '../../lib/riskScoring'

type Step = 'language' | 'vitals' | 'symptoms' | 'done'
interface Msg { role: 'ai' | 'user'; text: string; hint?: string }

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'https://swasthya-connect-ml.onrender.com'
console.log('✅ Voice Triage ML API URL:', ML_API_URL)

// Language code mapping for Web Speech API
const LANGUAGE_CODES: Record<'en' | 'hi' | 'mr', string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
}

const VITAL_FIELDS = [
  { id: 'bp',    label: 'Blood pressure', placeholder: '120/80', unit: 'mmHg', icon: Activity,    normal: '90/60-140/90' },
  { id: 'temp',  label: 'Temperature',    placeholder: '98.6',   unit: 'F',    icon: Thermometer, normal: '97-99.5' },
  { id: 'spo2',  label: 'SpO2',           placeholder: '98',     unit: '%',    icon: Wind,        normal: '95-100' },
  { id: 'pulse', label: 'Pulse',          placeholder: '80',     unit: 'bpm',  icon: Heart,       normal: '60-100' },
] as const

const RISK_CFG: Record<RiskLevel, { label: string; textColor: string; bgColor: string; border: string; barColor: string; badgeBg: string }> = {
  low:       { label: 'Low Risk',      textColor: 'text-emerald-800', bgColor: 'bg-emerald-50', border: 'border-emerald-200',      barColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
  medium:    { label: 'Moderate Risk', textColor: 'text-amber-800',   bgColor: 'bg-amber-50',   border: 'border-amber-200',        barColor: 'bg-amber-400',   badgeBg: 'bg-amber-100 text-amber-800' },
  high:      { label: 'High Risk',     textColor: 'text-orange-800',  bgColor: 'bg-orange-50',  border: 'border-orange-300',       barColor: 'bg-orange-500',  badgeBg: 'bg-orange-100 text-orange-800' },
  emergency: { label: 'Emergency',     textColor: 'text-red-900',     bgColor: 'bg-red-50',     border: 'border-red-400 border-2', barColor: 'bg-red-600',     badgeBg: 'bg-red-100 text-red-900' },
}

const VOICE_INTRO = {
  en: 'Welcome to voice health assessment. I will ask you a few questions about your symptoms.',
  hi: 'वॉइस स्वास्थ्य मूल्यांकन में आपका स्वागत है। मैं आपसे आपके लक्षणों के बारे में कुछ प्रश्न पूछूंगा।',
  mr: 'व्हॉइस आरोग्य मूल्यांकनात आपले स्वागत आहे. मी तुम्हाला तुमच्या लक्षणांबद्दल काही प्रश्न विचारेन.'
}

const FIRST_QUESTION = {
  en: 'What brings you here today? Please describe your main complaint.',
  hi: 'आज आप यहाँ क्यों आए हैं? कृपया अपनी मुख्य समस्या बताएं।',
  mr: 'आज तुम्ही येथे का आला आहात? कृपया तुमची मुख्य तक्रार सांगा.'
}

interface Props {
  patientId?: string
  onComplete: (result: any) => void
  onCancel: () => void
}

export function VoicePreConsult({ patientId, onComplete, onCancel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  
  // Core state
  const [language, setLanguage]   = useState<'en' | 'hi' | 'mr'>('en')
  const [vitals, setVitals]       = useState<Record<string, string>>({})
  const [step, setStep]           = useState<Step>('language')
  const [messages, setMessages]   = useState<Msg[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<any>(null)
  const [qCount, setQCount]       = useState(1)
  
  // Voice state
  const [isListening, setIsListening] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [voiceStarted, setVoiceStarted] = useState(false)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // ── Web Speech API setup ──
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // Update language for speech recognition
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = LANGUAGE_CODES[language]
    }
  }, [language])

  // Voice helper functions
  function speakText(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = LANGUAGE_CODES[language]
      utterance.rate = 0.85
      utterance.volume = 1.0
      
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.lang === LANGUAGE_CODES[language]) || voices[0]
      if (preferredVoice) utterance.voice = preferredVoice
      
      window.speechSynthesis.speak(utterance)
    }
  }

  function startListening() {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = LANGUAGE_CODES[language]
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  function stopListening() {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Start voice assessment
  function startVoiceAssessment() {
    setStep('vitals')
    // Speak intro
    speakText(VOICE_INTRO[language])
  }

  // Start symptom questions
  function startSymptoms() {
    setStep('symptoms')
    const firstQ = FIRST_QUESTION[language]
    setMessages([{ role: 'ai', text: firstQ }])
    setCurrentQuestion(firstQ)
    setVoiceStarted(true)
    speakText(firstQ)
  }

  // Voice triage API functions
  async function startVoiceTriageSession(chiefComplaint: string) {
    try {
      const response = await fetch(`${ML_API_URL}/voice-triage/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          chief_complaint: chiefComplaint,
          language: language
        })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to start voice triage:', error)
      return null
    }
  }

  async function getNextVoiceQuestion(answer: string) {
    try {
      const response = await fetch(`${ML_API_URL}/voice-triage/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          last_question: currentQuestion,
          patient_answer: answer,
          audio_confidence: 1.0
        })
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get next question:', error)
      return null
    }
  }

  async function finalizeVoiceTriage() {
    try {
      const response = await fetch(`${ML_API_URL}/voice-triage/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          vitals: {
            bp: vitals['bp'] || null,
            temp: vitals['temp'] || null,
            spo2: vitals['spo2'] || null,
            pulse: vitals['pulse'] || null
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Finalize error:', errorData)
        throw new Error(errorData.error || 'Failed to finalize triage')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to finalize triage:', error)
      throw error
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')
    setLoading(true)

    // First answer is the chief complaint - start session
    if (messages.length === 1) {
      const sessionData = await startVoiceTriageSession(text)
      
      if (sessionData && sessionData.first_question) {
        setQCount(2)
        setCurrentQuestion(sessionData.first_question)
        setMessages(p => [...p, { role: 'ai', text: sessionData.first_question }])
        setLoading(false)
        speakText(sessionData.first_question)
        return
      }
    }

    // Subsequent answers - get next question
    const nextQ = await getNextVoiceQuestion(text)

    if (nextQ && nextQ.next_question && !nextQ.done) {
      setQCount(c => c + 1)
      setCurrentQuestion(nextQ.next_question)
      setMessages(p => [...p, { role: 'ai', text: nextQ.next_question }])
      setLoading(false)
      speakText(nextQ.next_question)
    } else {
      // Finalize and get ML result
      const analysingMsg = language === 'hi' 
        ? 'मूल्यांकन पूर्ण हो रहा है...'
        : language === 'mr'
        ? 'मूल्यमापन पूर्ण होत आहे...'
        : 'Completing assessment...'
      setMessages(p => [...p, { role: 'ai', text: analysingMsg }])
      
      try {
        const finalData = await finalizeVoiceTriage()
        
        if (finalData && finalData.ml_result) {
          const mlResult = finalData.ml_result
          
          const riskLevelMap: Record<string, RiskLevel> = {
            'emergency': 'emergency',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
          }
          
          const riskLevel = riskLevelMap[mlResult.risk_level] || 'low'
          const score = mlResult.score || 30
          
          const res = {
            level: riskLevel,
            score: score,
            autoEscalate: mlResult.auto_escalate || false,
            specialist: mlResult.recommended_specialist || 'General Physician',
            hospitalLevel: mlResult.hospital_level || 1,
            hospitalLevelLabel: mlResult.hospital_level_label || 'PHC',
            hospitalLevelDesc: mlResult.hospital_level_desc || 'Primary Health Centre',
            triggeredFlags: mlResult.flags || [],
            confidence: mlResult.confidence || 85,
            probabilities: mlResult.probabilities || { low: 50, medium: 30, high: 15, emergency: 5 }
          }
          
          setResult(res)
          setStep('done')
          
          // Speak result in patient-friendly way
          let voiceMsg = ''
          if (res.autoEscalate) {
            voiceMsg = language === 'hi'
              ? 'यह एक आपातकालीन स्थिति है। कृपया तुरंत चिकित्सा सहायता लें।'
              : language === 'mr'
              ? 'ही आणीबाणीची परिस्थिती आहे। कृपया ताबडतोब वैद्यकीय मदत घ्या।'
              : 'This is an emergency situation. Please seek immediate medical attention.'
          } else if (res.score >= 60) {
            voiceMsg = language === 'hi'
              ? 'मूल्यांकन पूर्ण हुआ। आपको डॉक्टर से परामर्श की आवश्यकता है।'
              : language === 'mr'
              ? 'मूल्यमापन पूर्ण झाले. तुम्हाला डॉक्टरांचा सल्ला आवश्यक आहे।'
              : 'Assessment complete. You should proceed with teleconsultation.'
          } else {
            voiceMsg = language === 'hi'
              ? 'मूल्यांकन पूर्ण हुआ। आप टेलीकंसल्टेशन के लिए तैयार हैं।'
              : language === 'mr'
              ? 'मूल्यमापन पूर्ण झाले. तुम्ही टेलीकन्सल्टेशनसाठी तयार आहात।'
              : 'Assessment complete. You are ready for teleconsultation.'
          }
          
          const resultMsg = `Assessment complete. Score: ${res.score}/100`
          setMessages(p => [...p, { role: 'ai', text: resultMsg }])
          speakText(voiceMsg)
        }
      } catch (error) {
        console.error('ML assessment error:', error)
        const errorMsg = 'Assessment failed. Please retry.'
        setMessages(p => [...p, { role: 'ai', text: errorMsg }])
      } finally {
        setLoading(false)
      }
    }
  }

  function reset() {
    setVitals({})
    setStep('language')
    setMessages([])
    setInput('')
    setResult(null)
    setLoading(false)
    setQCount(1)
    setVoiceStarted(false)
    setCurrentQuestion('')
    setIsListening(false)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const cfg = result ? RISK_CFG[result.level] : null
  const STEPS: Step[] = ['language', 'vitals', 'symptoms', 'done']
  const stepLabels: Record<Step, string> = { 
    language: 'Language', 
    vitals: 'Vitals', 
    symptoms: 'Symptoms', 
    done: 'Result' 
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D3D1C7] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-semibold text-[#2C2C2A] text-sm">Voice Health Assessment</h1>
          <p className="text-[11px] text-[#5F5E5A] flex items-center gap-1.5 mt-0.5">
            <Brain size={11} className="text-teal-500" />
            Pre-consultation check · AI-powered triage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={setLanguage} />
          {step === 'symptoms' && (
            <span className="text-[10px] text-[#9E9C94] bg-gray-100 px-2 py-0.5 rounded-full">Q{qCount}</span>
          )}
          <AIPill />
          <button onClick={onCancel} className="p-1.5 rounded-lg text-[#5F5E5A] hover:bg-gray-100" aria-label="Cancel">
            ✕
          </button>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex border-b border-[#D3D1C7] bg-gray-50 flex-shrink-0">
        {STEPS.map((s, i) => {
          const curIdx = STEPS.indexOf(step)
          return (
            <div key={s} className={`flex-1 py-2 text-center text-[11px] font-medium flex items-center justify-center gap-1 ${step === s ? 'text-teal-600 border-b-2 border-teal-500 bg-white' : 'text-[#9E9C94]'}`}>
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${step === s ? 'bg-teal-500 text-white' : i < curIdx ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
              {stepLabels[s]}
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Language Selection step ── */}
        {step === 'language' && (
          <div className="p-4 sm:p-6 max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                <Globe size={40} className="text-teal-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-[#2C2C2A] mb-2">Select Language</h2>
                <p className="text-sm text-[#5F5E5A]">Choose your preferred language for voice-guided assessment</p>
              </div>

              <div className="space-y-3">
                {(['en', 'hi', 'mr'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang)
                      startVoiceAssessment()
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                      language === lang
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-[#D3D1C7] hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-[#2C2C2A]">
                        {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'मराठी (Marathi)'}
                      </p>
                      <p className="text-xs text-[#5F5E5A] mt-0.5">
                        {lang === 'en' ? 'Voice and text support' : lang === 'hi' ? 'आवाज और टेक्स्ट समर्थन' : 'आवाज आणि मजकूर समर्थन'}
                      </p>
                    </div>
                    {language === lang && (
                      <CheckCircle size={24} className="text-teal-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Vitals step ── */}
        {step === 'vitals' && (
          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-[#5F5E5A]">Record available vitals. Leave blank if unavailable.</p>
            <div className="grid grid-cols-2 gap-3">
              {VITAL_FIELDS.map(f => {
                const Icon = f.icon
                return (
                  <div key={f.id}>
                    <label htmlFor={`v-${f.id}`} className="flex items-center gap-1.5 text-xs font-medium text-[#2C2C2A] mb-1">
                      <span className="text-teal-500"><Icon size={14} /></span>{f.label}
                    </label>
                    <div className="relative">
                      <input 
                        id={`v-${f.id}`} 
                        type="text" 
                        value={vitals[f.id] ?? ''}
                        onChange={e => setVitals(p => ({ ...p, [f.id]: e.target.value }))}
                        placeholder={f.placeholder} 
                        className="input-field text-sm pr-10 w-full" 
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#9E9C94] pointer-events-none">{f.unit}</span>
                    </div>
                    <p className="text-[10px] text-[#9E9C94] mt-0.5">Normal: {f.normal}</p>
                  </div>
                )
              })}
            </div>

            <button onClick={startSymptoms} className="btn-primary w-full justify-center text-sm py-3 flex items-center gap-1.5 mt-6">
              Continue to Voice Questions <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Symptoms step (Chat Interface) ── */}
        {step === 'symptoms' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${m.role === 'user'
                        ? 'bg-teal-500 text-white rounded-br-sm'
                        : 'bg-white border border-[#D3D1C7] text-[#2C2C2A] rounded-bl-sm shadow-sm'}`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#D3D1C7] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-[#5F5E5A]">
                    <Loader2 size={14} className="animate-spin text-teal-500" />
                    Processing...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            {!result && (
              <div className="px-4 sm:px-6 py-3 border-t border-[#D3D1C7] bg-white">
                <div className="flex gap-2 items-end">
                  <textarea 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
                    placeholder="Type your answer or use voice..." 
                    rows={1} 
                    disabled={loading}
                    className="input-field resize-none flex-1 min-h-[44px] disabled:opacity-50"
                  />
                  <button 
                    type="button" 
                    onClick={() => isListening ? stopListening() : startListening()} 
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'border border-[#D3D1C7] text-teal-600 hover:bg-teal-50'
                    }`}
                    disabled={loading}
                  >
                    {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => void handleSend()} 
                    disabled={!input.trim() || loading}
                    className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
                  >
                    {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Results step ── */}
        {step === 'done' && result && cfg && (
          <div className="p-4 sm:p-6 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 space-y-4 ${cfg.bgColor} ${cfg.border}`}
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.badgeBg}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-gray-500">Score: {result.score}/100</span>
              </div>

              <div>
                <div className="h-3 bg-white/70 rounded-full overflow-hidden border border-white/50">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }} 
                    className={`h-full rounded-full ${cfg.barColor}`} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-2.5 border border-white/50">
                <span className="text-xl leading-none">🏥</span>
                <div>
                  <p className="text-[10px] text-[#9E9C94] font-medium uppercase tracking-wide">Recommended facility</p>
                  <p className={`text-sm font-semibold ${cfg.textColor}`}>Level {result.hospitalLevel} — {result.hospitalLevelLabel}</p>
                </div>
              </div>

              {result.autoEscalate && (
                <div className="flex items-start gap-3 bg-red-600 text-white rounded-xl px-4 py-3">
                  <Siren size={18} className="shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-semibold text-sm">Emergency Detected</p>
                    <p className="text-xs text-red-100 mt-0.5">Call 104 or seek immediate medical attention</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => onComplete(result)} 
                  className="btn-primary flex-1 justify-center"
                >
                  Proceed to Consultation <Video size={16} />
                </button>
                <button onClick={reset} className="btn-secondary">
                  <RotateCcw size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  )
}
