import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Thermometer, Heart, Wind, Mic, MicOff, Send, RotateCcw, AlertTriangle, Siren, Brain, CheckCircle2, Loader2, ChevronRight, Video, ArrowRight, User, CheckCircle, ClipboardCheck, Globe } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { LanguageSelector } from '../../components/triage/LanguageSelector'
import { triageEngine } from '../../lib/triageEngine'
import type { HybridTriageResult } from '../../lib/triageEngine'
import { getNextQuestion, getAnalysingMessage, FIRST_QUESTION } from '../../services/geminiTriage'
import type { Turn } from '../../services/geminiTriage'
import { useNavigate, useLocation } from 'react-router-dom'
import type { RiskLevel } from '../../lib/riskScoring'
import { referralsApi, patientsApi, type PatientRecord } from '../../services/api'
import { useApp } from '../../context/AppContext'

type Step = 'language' | 'vitals' | 'symptoms' | 'done'
interface Msg { role: 'ai' | 'user'; text: string; hint?: string }

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'https://swasthya-connect-ml.onrender.com'
console.log('✅ ASHA Voice Triage ML API URL:', ML_API_URL)

// Language code mapping for Web Speech API
const LANGUAGE_CODES: Record<'en' | 'hi' | 'mr', string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
}

// Voice guidance for vitals
const VITAL_VOICE_GUIDANCE: Record<string, Record<'en' | 'hi' | 'mr', string>> = {
  bp: {
    en: 'Please enter blood pressure reading',
    hi: 'कृपया रक्तचाप दर्ज करें',
    mr: 'कृपया रक्तदाब नोंदवा'
  },
  temp: {
    en: 'Please enter temperature',
    hi: 'कृपया तापमान दर्ज करें',
    mr: 'कृपया तापमान नोंदवा'
  },
  spo2: {
    en: 'Please enter oxygen saturation level',
    hi: 'कृपया ऑक्सीजन स्तर दर्ज करें',
    mr: 'कृपया ऑक्सिजन पातळी नोंदवा'
  },
  pulse: {
    en: 'Please enter pulse rate',
    hi: 'कृपया नाड़ी दर दर्ज करें',
    mr: 'कृपया नाडी दर नोंदवा'
  }
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

const NEXT_STEP: Record<RiskLevel, { advice: string; cta: string }> = {
  low:       { advice: 'Provide home-care guidance. Schedule follow-up in 7 days.',           cta: 'Record & close' },
  medium:    { advice: 'Moderate risk — start teleconsult with a PHC doctor to assess further.', cta: 'Book appointment' },
  high:      { advice: 'High risk — initiate teleconsultation immediately. Prepare referral.', cta: 'Create referral' },
  emergency: { advice: 'CRITICAL — Auto-escalation triggered. Arrange emergency transport.',   cta: 'Call 104' },
}

function ProbBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-right text-[#5F5E5A] shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${color}`} />
      </div>
      <span className="w-10 tabular-nums font-medium text-[#2C2C2A]">{pct.toFixed(1)}%</span>
    </div>
  )
}

export function AshaTriage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userName } = useApp()
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  
  // Core state
  const [language, setLanguage]   = useState<'en' | 'hi' | 'mr'>('en')
  const [vitals, setVitals]       = useState<Record<string, string>>({})
  const [step, setStep]           = useState<Step>('language') // Start with language selection
  const [messages, setMessages]   = useState<Msg[]>([])
  const [input, setInput]         = useState('')
  const [history, setHistory]     = useState<Turn[]>([])
  const [answers, setAnswers]     = useState<string[]>([])
  const [firstAnswer, setFirstAnswer] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<HybridTriageResult | null>(null)
  const [qCount, setQCount]       = useState(1)
  
  // Voice state
  const [isListening, setIsListening] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [voiceStarted, setVoiceStarted] = useState(false) // Track if voice has been initiated

  // Pre-fill banner state — set when navigated from PatientFullRecord
  const [prefillBanner, setPrefillBanner] = useState<{ vitalsDate: string; expiresAt: string | null } | null>(null)

  // Patient selection (for auto-referral)
  const [patientQuery, setPatientQuery] = useState('')
  const [patientSearching, setPatientSearching] = useState(false)
  const [patientResults, setPatientResults] = useState<PatientRecord[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)

  // Auto-referral state
  const [autoReferralId, setAutoReferralId] = useState<string | null>(null)
  const [autoReferralDone, setAutoReferralDone] = useState(false)
  const [autoReferralError, setAutoReferralError] = useState('')

  // ── Pre-fill vitals + patient from router state (passed by PatientFullRecord) ──
  useEffect(() => {
    const state = location.state as {
      prefillVitals?:  Record<string, string>
      prefillPatient?: { id: string; name: string; healthId: string; age: number; village: string }
      vitalsDate?:     string
      expiresAt?:      string | null
    } | null

    if (!state?.prefillVitals) return

    // Hydrate vitals fields
    setVitals(state.prefillVitals)

    // Hydrate patient selection so auto-referral picks it up
    if (state.prefillPatient) {
      setSelectedPatient({
        id:         state.prefillPatient.id,
        name:       state.prefillPatient.name,
        healthId:   state.prefillPatient.healthId,
        age:        state.prefillPatient.age,
        village:    state.prefillPatient.village,
      } as PatientRecord)
    }

    // Show info banner
    setPrefillBanner({
      vitalsDate: state.vitalsDate ?? 'last visit',
      expiresAt:  state.expiresAt ?? null,
    })

    // Clear router state so a refresh doesn't re-apply stale data
    window.history.replaceState({}, '')
  }, [])   // runs once on mount only

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
      window.speechSynthesis.cancel() // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = LANGUAGE_CODES[language]
      utterance.rate = 0.85
      utterance.volume = 1.0
      
      // Try to get better voices
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

  async function searchPatient(q: string) {
    if (!q.trim()) return
    setPatientSearching(true)
    try {
      const results = await patientsApi.search(q)
      setPatientResults(results.slice(0, 5))
    } catch { setPatientResults([]) }
    finally { setPatientSearching(false) }
  }

  // Auto-creates a referral when score >= 60
  async function autoCreateReferral(res: HybridTriageResult, pat: PatientRecord | null) {
    if (res.score < 60) return
    setAutoReferralDone(false)
    setAutoReferralError('')

    const urgency = res.score >= 75 ? 'emergency' : 'urgent'
    const facilityName = res.hospitalLevelLabel   // e.g. "District Hospital" or "Tertiary / Medical College"

    // Build a rich reason string with triage report + flags
    const flagsText = res.triggeredFlags.length > 0
      ? `\nRisk flags: ${res.triggeredFlags.join(', ')}`
      : ''
    const reason =
      `Auto-referral — Triage score ${res.score}/100 (${res.level.toUpperCase()}).\n` +
      `Recommended specialist: ${res.specialist}.\n` +
      `${res.specialistDesc}.` +
      flagsText +
      `\nML confidence: ${res.confidence?.toFixed(1) ?? '—'}%` +
      (pat ? `\nPrevious conditions: ${pat.conditions?.join(', ') || 'none recorded'}.` : '')

    try {
      const referral = await referralsApi.create({
        patientId:      pat?.id,
        patientName:    pat?.name ?? 'Unknown patient',
        toFacilityName: facilityName,
        reason,
        urgency,
      })
      setAutoReferralId(referral.id)
      setAutoReferralDone(true)
    } catch (e: any) {
      console.error('Auto-referral failed:', e)
      setAutoReferralError(e?.message || 'Auto-referral creation failed')
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
      } else {
        // Fallback if session start fails
        const fallbackQ = language === 'hi' 
          ? 'यह कब शुरू हुआ?' 
          : language === 'mr' 
          ? 'हे कधी सुरू झाले?' 
          : 'When did this start?'
        setQCount(2)
        setMessages(p => [...p, { role: 'ai', text: fallbackQ }])
        setLoading(false)
        speakText(fallbackQ)
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
      
      // Speak the next question
      speakText(nextQ.next_question)
    } else {
      // Finalize and get ML result
      const analysingMsg = getAnalysingMessage(text)
      setMessages(p => [...p, { role: 'ai', text: analysingMsg }])
      // Don't speak technical messages like "Running ML model analysis..."
      
      try {
        const finalData = await finalizeVoiceTriage()
        
        if (finalData && finalData.ml_result) {
          // Convert voice triage result to our format
          const mlResult = finalData.ml_result
          
          // Map risk_level to RiskLevel type
          const riskLevelMap: Record<string, RiskLevel> = {
            'emergency': 'emergency',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
          }
          
          const riskLevel = riskLevelMap[mlResult.risk_level] || 'low'
          const score = mlResult.score || 30
          
          const res: HybridTriageResult = {
            level: riskLevel,
            score: score,
            autoEscalate: mlResult.auto_escalate || false,
            breakdown: {
              vitalsScore: Math.round(score * 0.4),
              symptomsScore: Math.round(score * 0.35),
              severityScore: Math.round(score * 0.25)
            },
            specialist: 'General Physician', // Will be enhanced later
            specialistDesc: mlResult.hospital_level_desc || 'Medical consultation recommended',
            hospitalLevel: mlResult.hospital_level || 1,
            hospitalLevelLabel: mlResult.hospital_level_label || 'PHC',
            hospitalLevelDesc: mlResult.hospital_level_desc || 'Primary Health Centre',
            triggeredFlags: mlResult.flags || [],
            confidence: mlResult.confidence || 85,
            mlUsed: true,
            probabilities: mlResult.probabilities || { low: 50, medium: 30, high: 15, emergency: 5 }
          }
          
          setResult(res)
          setStep('done')
          
          // Create patient-friendly result message for voice
          let resultMsg = ''
          let voiceMsg = ''
          
          if (res.autoEscalate) {
            resultMsg = `EMERGENCY — Score ${res.score}/100. Auto-escalation triggered.`
            voiceMsg = language === 'hi'
              ? 'यह एक आपातकालीन स्थिति है। कृपया तुरंत चिकित्सा सहायता लें।'
              : language === 'mr'
              ? 'ही आणीबाणीची परिस्थिती आहे। कृपया ताबडतोब वैद्यकीय मदत घ्या।'
              : 'This is an emergency situation. Please seek immediate medical attention.'
          } else if (res.score >= 60) {
            resultMsg = `Assessment complete. Score: ${res.score}/100.`
            voiceMsg = language === 'hi'
              ? 'मूल्यांकन पूर्ण हुआ। आपको डॉक्टर से परामर्श की आवश्यकता है।'
              : language === 'mr'
              ? 'मूल्यमापन पूर्ण झाले. तुम्हाला डॉक्टरांचा सल्ला आवश्यक आहे।'
              : 'Assessment complete. You need to consult with a doctor.'
          } else {
            resultMsg = `Assessment complete. Score: ${res.score}/100.`
            voiceMsg = language === 'hi'
              ? 'मूल्यांकन पूर्ण हुआ। आपकी स्थिति स्थिर है।'
              : language === 'mr'
              ? 'मूल्यमापन पूर्ण झाले. तुमची स्थिती स्थिर आहे।'
              : 'Assessment complete. Your condition is stable.'
          }
          
          setMessages(p => [...p, { role: 'ai', text: resultMsg }])
          speakText(voiceMsg) // Speak patient-friendly message only
          
          // Auto-create referral when score >= 60
          if (res.score >= 60) {
            autoCreateReferral(res, selectedPatient)
          }
        } else {
          console.error('Invalid response from ML backend:', finalData)
          throw new Error('Invalid response structure from ML backend')
        }
      } catch (error) {
        console.error('ML assessment error:', error)
        const errorMsg = 'Assessment failed. Please retry.'
        const voiceErrorMsg = language === 'hi'
          ? 'मूल्यांकन विफल रहा। कृपया पुनः प्रयास करें।'
          : language === 'mr'
          ? 'मूल्यमापन अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा।'
          : 'Assessment failed. Please try again.'
        
        setMessages(p => [...p, { role: 'ai', text: errorMsg }])
        speakText(voiceErrorMsg)
      } finally {
        setLoading(false)
      }
    }
  }

  function reset() {
    setVitals({}); setStep('language') // Reset to language selection
    setMessages([])
    setInput(''); setHistory([]); setAnswers([]); setFirstAnswer(''); setResult(null); setLoading(false); setQCount(1)
    setAutoReferralId(null); setAutoReferralDone(false); setAutoReferralError('')
    setPatientQuery(''); setPatientResults([]); setSelectedPatient(null)
    setPrefillBanner(null)
    setVoiceStarted(false)
    setCurrentQuestion('')
    setIsListening(false)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const cfg  = result ? RISK_CFG[result.level]  : null
  const next = result ? NEXT_STEP[result.level] : null
  const STEPS: Step[] = ['language', 'vitals', 'symptoms', 'done']
  const stepLabels: Record<Step, string> = { language: 'Language', vitals: 'Vitals', symptoms: 'Symptoms', done: 'Result' }

  // Show teleconsult button when score is between 40 and 74 (medium/high, not emergency)
  const showTeleconsult = result !== null && result.score >= 40 && result.score < 75

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-[#D3D1C7] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-semibold text-[#2C2C2A] text-sm">ASHA Patient Triage</h1>
          <p className="text-[11px] text-[#5F5E5A] flex items-center gap-1.5 mt-0.5">
            <Brain size={11} className="text-teal-500" />
            Groq adaptive questions · XGBoost ML scoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={setLanguage} />
          {step === 'symptoms' && (
            <span className="text-[10px] text-[#9E9C94] bg-gray-100 px-2 py-0.5 rounded-full">Q{qCount}</span>
          )}
          <AIPill />
          <button onClick={reset} className="p-1.5 rounded-lg text-[#5F5E5A] hover:bg-gray-100" aria-label="Restart">
            <RotateCcw size={14} />
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
                <p className="text-sm text-[#5F5E5A]">Choose your preferred language for voice-guided triage</p>
              </div>

              <div className="space-y-3">
                {(['en', 'hi', 'mr'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang)
                      setStep('vitals')
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

              <button
                onClick={() => setStep('vitals')}
                className="btn-primary w-full py-3 justify-center text-sm flex items-center gap-1.5"
              >
                Continue <ChevronRight size={16} />
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Vitals step ── */}
        {step === 'vitals' && (
          <div className="p-4 sm:p-5 space-y-4">

            {/* Pre-fill banner — shown when vitals were loaded from a previous visit */}
            {prefillBanner && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3"
              >
                <ClipboardCheck size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-teal-800">
                    Vitals auto-filled from last visit
                  </p>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    Recorded: {prefillBanner.vitalsDate}
                    {prefillBanner.expiresAt && (
                      <> · Valid until{' '}
                        <span className="font-semibold">
                          {new Date(prefillBanner.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-teal-600 mt-1">
                    Review and edit if anything has changed before continuing.
                  </p>
                </div>
                <button
                  onClick={() => { setVitals({}); setPrefillBanner(null) }}
                  className="text-[10px] text-teal-700 hover:text-red-600 font-medium flex-shrink-0 mt-0.5 transition-colors"
                  title="Clear pre-filled vitals"
                >
                  Clear
                </button>
              </motion.div>
            )}

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
                        onFocus={() => {
                          // Speak guidance when field is focused
                          const guidance = VITAL_VOICE_GUIDANCE[f.id]?.[language]
                          if (guidance) speakText(guidance)
                        }}
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
            {/* Optional: link triage to a patient for auto-referral */}
            <div className="border-t border-[#D3D1C7] pt-3">
              <p className="text-xs font-medium text-[#2C2C2A] mb-2 flex items-center gap-1.5">
                <User size={13} className="text-teal-500" />
                Link to patient <span className="text-[#9E9C94] font-normal">(optional — needed for auto-referral)</span>
              </p>
              {selectedPatient ? (
                <div className="flex items-center gap-3 p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C2C2A]">{selectedPatient.name}</p>
                    <p className="text-[10px] text-[#5F5E5A]">{selectedPatient.age}y · {selectedPatient.village} · {selectedPatient.healthId}</p>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setPatientQuery('') }}
                    className="text-[10px] text-teal-700 hover:text-red-600 font-medium">Change</button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input type="text" value={patientQuery}
                      onChange={e => setPatientQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchPatient(patientQuery)}
                      placeholder="Search by name, phone or Health ID…"
                      className="input-field text-xs flex-1" />
                    <button onClick={() => searchPatient(patientQuery)} disabled={patientSearching}
                      className="btn-secondary text-xs px-3 py-2">
                      {patientSearching ? <Loader2 size={12} className="animate-spin" /> : 'Search'}
                    </button>
                  </div>
                  {patientResults.length > 0 && (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {patientResults.map(p => (
                        <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientResults([]) }}
                          className="w-full text-left p-2 border border-[#D3D1C7] rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all text-xs flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                            {p.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[#2C2C2A]">{p.name}</span>
                            <span className="text-[#5F5E5A] ml-1">{p.age}y · {p.village}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={async () => {
                setStep('symptoms')
                // Ask for chief complaint first
                const chiefComplaintQuestion = language === 'hi' 
                  ? 'आपकी मुख्य शिकायत क्या है? कृपया अपनी समस्या बताएं।' 
                  : language === 'mr' 
                  ? 'तुमची मुख्य तक्रार काय आहे? कृपया तुमची समस्या सांगा।' 
                  : 'What is your main complaint? Please tell me about your problem.'
                
                setMessages([{ role: 'ai', text: chiefComplaintQuestion }])
                setCurrentQuestion(chiefComplaintQuestion)
                speakText(chiefComplaintQuestion)
              }} 
              className="btn-primary w-full py-3 justify-center text-sm flex items-center gap-1.5"
            >
              Continue to symptom check <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* ── Symptoms + Result step ── */}
        {(step === 'symptoms' || step === 'done') && (
          <div className="flex flex-col">
            <div className="px-4 py-4 space-y-3" aria-live="polite">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-white border border-[#D3D1C7] text-[#2C2C2A] rounded-bl-sm shadow-sm'}`}>
                      {m.text}
                      {m.hint && m.role === 'ai' && !result && i === messages.length - 1 && (
                        <p className="text-[10px] text-[#9E9C94] mt-1">{m.hint}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#D3D1C7] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-[#5F5E5A]">
                    <Loader2 size={14} className="animate-spin text-teal-500" />
                    {answers.length > 3 ? 'Analysing with ML model...' : 'Generating next question...'}
                  </div>
                </div>
              )}

              {/* ── Result card ── */}
              {result && cfg && next && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                  className={`rounded-2xl border p-5 space-y-4 ${cfg.bgColor} ${cfg.border}`} role="alert">

                  {/* Score header */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.badgeBg}`}>{cfg.label}</span>
                    <div className="flex items-center gap-2">
                      {/* Color indicator circles */}
                      <div className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${result.level === 'low' ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-300'}`}>
                          {result.level === 'low' && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${result.level === 'medium' ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-200 border-gray-300'}`}>
                          {result.level === 'medium' && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${result.level === 'high' || result.level === 'emergency' ? 'bg-red-500 border-red-600' : 'bg-gray-200 border-gray-300'}`}>
                          {(result.level === 'high' || result.level === 'emergency') && <span className="text-white text-xs">✓</span>}
                        </div>
                      </div>
                      <span className={`text-xs text-gray-500 ml-1`}>({result.score}/100)</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div>
                    <div className="h-3 bg-white/70 rounded-full overflow-hidden border border-white/50">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${cfg.barColor}`} />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>🟢 0-40 Green</span><span>🟡 40-60 Yellow</span><span>🟠 60-75 Orange</span><span className="text-red-400 font-semibold">🔴 75+ Red</span>
                    </div>
                  </div>

                  {/* Emergency banner */}
                  {result.autoEscalate && (
                    <div className="flex items-start gap-3 bg-red-600 text-white rounded-xl px-4 py-3" role="alert">
                      <Siren size={18} className="shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-semibold text-sm">Auto-escalation triggered</p>
                        <p className="text-xs text-red-100 mt-0.5">🔴 Red level (Emergency) — Nearest facility notified.</p>
                      </div>
                    </div>
                  )}

                  {/* Teleconsult recommendation banner — score 40–74 */}
                  {showTeleconsult && (
                    <div className="flex items-start gap-3 bg-green-700 text-white rounded-xl px-4 py-3">
                      <Video size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Teleconsultation recommended</p>
                        <p className="text-xs text-green-100 mt-0.5">{result.level === 'medium' ? '🟡' : '🟠'} {result.level === 'medium' ? 'Yellow' : 'Orange'} level — connect the patient with a PHC doctor now.</p>
                      </div>
                    </div>
                  )}

                  {/* Risk flags */}
                  {result.triggeredFlags.length > 0 && (
                    <div className="space-y-1">
                      <p className={`text-xs font-semibold ${cfg.textColor}`}>Risk factors:</p>
                      {result.triggeredFlags.map(flag => (
                        <div key={flag} className={`flex items-center gap-1.5 text-xs ${cfg.textColor}`}>
                          <AlertTriangle size={11} /> {flag}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hospital level + Specialist recommendation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Hospital level */}
                    <div className="bg-white/70 rounded-xl p-3 border border-white/60">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                          ${result.hospitalLevel === 4 ? 'bg-red-100 text-red-700' :
                            result.hospitalLevel === 3 ? 'bg-orange-100 text-orange-700' :
                            result.hospitalLevel === 2 ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'}`}>
                          Level {result.hospitalLevel}
                        </span>
                        <p className="text-xs font-semibold text-[#2C2C2A]">Refer to</p>
                      </div>
                      <p className={`text-sm font-bold
                        ${result.hospitalLevel === 4 ? 'text-red-700' :
                          result.hospitalLevel === 3 ? 'text-orange-700' :
                          result.hospitalLevel === 2 ? 'text-amber-700' :
                          'text-green-700'}`}>
                        {result.hospitalLevelLabel}
                      </p>
                      <p className="text-[10px] text-[#5F5E5A] mt-0.5 leading-relaxed">{result.hospitalLevelDesc}</p>
                    </div>

                    {/* Specialist */}
                    <div className="bg-white/70 rounded-xl p-3 border border-white/60">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          Specialist
                        </span>
                      </div>
                      <p className="text-sm font-bold text-indigo-700">{result.specialist}</p>
                      <p className="text-[10px] text-[#5F5E5A] mt-0.5 leading-relaxed">{result.specialistDesc}</p>
                    </div>
                  </div>

                  {/* ML probability breakdown */}
                  {result.probabilities && (
                    <div className="bg-white/60 rounded-xl p-3 space-y-1.5">
                      <p className={`text-[11px] font-semibold mb-2 ${cfg.textColor}`}>ML Probability Breakdown</p>
                      <ProbBar label="Low"       pct={result.probabilities.low}       color="bg-emerald-500" />
                      <ProbBar label="Medium"    pct={result.probabilities.medium}    color="bg-amber-400"   />
                      <ProbBar label="High"      pct={result.probabilities.high}      color="bg-orange-500"  />
                      <ProbBar label="Emergency" pct={result.probabilities.emergency} color="bg-red-600"     />
                    </div>
                  )}

                  {/* Model info pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-white/70 border border-white/50 rounded-full px-2 py-0.5 text-[#5F5E5A]">
                      <Brain size={9} className="text-teal-500" />
                      {result.mlUsed ? `XGBoost — ${result.confidence?.toFixed(1)}% confidence` : 'Rule-based fallback'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 text-purple-700">
                      ✨ {qCount} Gemini questions
                    </span>
                    {(result.confidence ?? 0) >= 90 && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-white/70 border border-white/50 rounded-full px-2 py-0.5 text-emerald-700">
                        <CheckCircle2 size={9} /> High confidence
                      </span>
                    )}
                    <AIPill />
                  </div>

                  <p className={`text-sm leading-relaxed ${cfg.textColor}`}>{next.advice}</p>

                  {/* ── Auto-referral status card (score >= 60) ── */}
                  {result.score >= 60 && (
                    <div className={`rounded-xl border p-3 space-y-1.5 ${
                      autoReferralDone  ? 'bg-green-50 border-green-300' :
                      autoReferralError ? 'bg-red-50 border-red-300' :
                                          'bg-white/60 border-white/50 animate-pulse'
                    }`}>
                      <div className="flex items-center gap-2">
                        {autoReferralDone ? (
                          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                        ) : autoReferralError ? (
                          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        ) : (
                          <Loader2 size={14} className="animate-spin text-teal-500 flex-shrink-0" />
                        )}
                        <p className="text-xs font-semibold text-[#2C2C2A]">
                          {autoReferralDone  ? 'Auto-referral created' :
                           autoReferralError ? 'Auto-referral failed' :
                                               'Creating auto-referral…'}
                        </p>
                        {autoReferralDone && (
                          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${result.score >= 75 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {result.score >= 75 ? 'Emergency' : 'Urgent'}
                          </span>
                        )}
                      </div>
                      {autoReferralDone && (
                        <>
                          <p className="text-[11px] text-[#5F5E5A]">
                            Patient: <span className="font-medium text-[#2C2C2A]">{selectedPatient?.name ?? 'Unknown'}</span>
                            &nbsp;→ <span className="font-medium text-[#2C2C2A]">{result.hospitalLevelLabel}</span>
                          </p>
                          <p className="text-[11px] text-[#5F5E5A]">
                            Specialist: <span className="font-medium text-indigo-700">{result.specialist}</span>
                          </p>
                          <button onClick={() => navigate('/asha/referrals')}
                            className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold hover:underline mt-0.5">
                            View in referrals <ArrowRight size={11} />
                          </button>
                        </>
                      )}
                      {autoReferralError && (
                        <p className="text-[11px] text-red-600">{autoReferralError} — create manually from Referrals.</p>
                      )}
                    </div>
                  )}

                  {/* ── Action buttons ── */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {result.autoEscalate ? (
                      /* score ≥ 75 — Emergency only */
                      <>
                        <a href="tel:104"
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors">
                          <Siren size={14} /> Call 104
                        </a>
                        <button onClick={() => navigate('/asha/referrals')}
                          className="btn-secondary text-sm py-2.5 px-4">
                          View escalation
                        </button>
                        <button onClick={reset} className="btn-secondary text-sm py-2.5 px-4">New triage</button>
                      </>
                    ) : showTeleconsult ? (
                      /* score 40–74 — Teleconsult is the primary CTA */
                      <>
                        <button
                          onClick={() => navigate('/asha/teleconsult', {
                            state: {
                              patientId: selectedPatient?.id,
                              triageData: {
                                chiefComplaint: firstAnswer,
                                answers: answers,
                                history: history,
                                riskScore: result.score,
                                riskLevel: result.level,
                                flags: result.triggeredFlags,
                                sessionId: `triage-${Date.now()}`
                              }
                            }
                          })}
                          className="flex items-center gap-2 bg-[#138808] hover:bg-green-800 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors shadow-sm"
                        >
                          <Video size={15} /> Start teleconsult
                        </button>
                        <button
                          onClick={() => navigate(result.level === 'high' ? '/asha/referrals' : '/asha/followup')}
                          className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-1.5"
                        >
                          {next.cta} <ChevronRight size={14} />
                        </button>
                        <button onClick={reset} className="btn-secondary text-sm py-2.5 px-4">New triage</button>
                      </>
                    ) : (
                      /* score < 40 — Low risk */
                      <>
                        <button onClick={() => navigate('/asha/followup')}
                          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-1.5">
                          {next.cta} <ChevronRight size={14} />
                        </button>
                        <button onClick={reset} className="btn-secondary text-sm py-2.5 px-4">New triage</button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            {step === 'symptoms' && (
              <div className="px-4 pb-4 pt-3 border-t border-[#D3D1C7] bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <textarea 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
                    placeholder={
                      language === 'hi' 
                        ? 'रोगी का जवाब टाइप करें या माइक बोलें...' 
                        : language === 'mr' 
                        ? 'रुग्णाचे उत्तर टाइप करा किंवा माईक बोला...' 
                        : 'Type or speak patient\'s answer...'
                    }
                    rows={1} 
                    disabled={loading}
                    className="input-field resize-none flex-1 min-h-[44px] disabled:opacity-50" 
                    aria-label="Patient answer" 
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (isListening) {
                        stopListening()
                      } else {
                        startListening()
                      }
                    }}
                    disabled={loading}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isListening 
                        ? 'bg-red-500 border-red-600 text-white animate-pulse' 
                        : 'border-[#D3D1C7] text-[#5F5E5A] hover:bg-teal-50'
                    }`}
                    aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => void handleSend()} 
                    disabled={!input.trim() || loading}
                    className="btn-primary p-2.5 rounded-xl disabled:opacity-40" 
                    aria-label="Send answer"
                  >
                    {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
