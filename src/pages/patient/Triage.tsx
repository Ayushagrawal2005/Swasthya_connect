// Patient self-serve triage — Groq adaptive questions + XGBoost ML scoring
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, RotateCcw, AlertTriangle, Siren, Brain, CheckCircle2, Loader2, ChevronRight, Video } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { LanguageSelector } from '../../components/triage/LanguageSelector'
import { triageEngine } from '../../lib/triageEngine'
import type { HybridTriageResult } from '../../lib/triageEngine'
import { getNextQuestion, getAnalysingMessage, FIRST_QUESTION } from '../../services/geminiTriage'
import type { Turn } from '../../services/geminiTriage'
import type { RiskLevel } from '../../lib/riskScoring'

interface Msg { role: 'ai' | 'user'; text: string; hint?: string }

const RISK_CFG: Record<RiskLevel, { label: string; textColor: string; bgColor: string; border: string; barColor: string; badgeBg: string }> = {
  low:       { label: 'Low Risk',      textColor: 'text-emerald-800', bgColor: 'bg-emerald-50', border: 'border-emerald-200',      barColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
  medium:    { label: 'Moderate Risk', textColor: 'text-amber-800',   bgColor: 'bg-amber-50',   border: 'border-amber-200',        barColor: 'bg-amber-400',   badgeBg: 'bg-amber-100 text-amber-800' },
  high:      { label: 'High Risk',     textColor: 'text-orange-800',  bgColor: 'bg-orange-50',  border: 'border-orange-300',       barColor: 'bg-orange-500',  badgeBg: 'bg-orange-100 text-orange-800' },
  emergency: { label: 'Emergency',     textColor: 'text-red-900',     bgColor: 'bg-red-50',     border: 'border-red-400 border-2', barColor: 'bg-red-600',     badgeBg: 'bg-red-100 text-red-900' },
}

const NEXT_STEP: Record<RiskLevel, { advice: string; cta: string; route: string }> = {
  low:       { advice: 'Self-care is appropriate. Rest, hydrate, monitor. Visit a sub-centre if symptoms worsen in 2 days.', cta: 'Book PHC visit',    route: '/patient/appointments' },
  medium:    { advice: 'Visit your nearest PHC within 24 hours. Carry this report with you.',                               cta: 'Book appointment', route: '/patient/appointments' },
  high:      { advice: 'Go to your nearest Rural Hospital or PHC today. Urgent referral prepared.',                         cta: 'View referral',    route: '/patient/referrals' },
  emergency: { advice: 'CRITICAL — Auto-escalation sent to nearest facility. Call 104 immediately.',                        cta: 'Call 104 now',     route: '/patient/referrals' },
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

export function TriagePage() {
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: FIRST_QUESTION.text, hint: FIRST_QUESTION.hint }
  ])
  const [input, setInput]         = useState('')
  const [history, setHistory]     = useState<Turn[]>([])
  const [answers, setAnswers]     = useState<string[]>([])
  const [firstAnswer, setFirstAnswer] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<HybridTriageResult | null>(null)
  const [questionCount, setQuestionCount] = useState(1)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const newAnswers = [...answers, text]
    setAnswers(newAnswers)
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')

    // Build new history entry
    const currentQuestion = messages.filter(m => m.role === 'ai').slice(-1)[0]?.text ?? ''
    const fa = firstAnswer || text
    if (!firstAnswer) setFirstAnswer(text)

    const newHistory: Turn[] = [...history, { question: currentQuestion, answer: text }]
    setHistory(newHistory)

    setLoading(true)

    // Ask Groq for next question with selected language
    const nextQ = await getNextQuestion(newHistory, fa, language)

    if (nextQ) {
      setQuestionCount(c => c + 1)
      setMessages(p => [...p, { role: 'ai', text: nextQ.text, hint: nextQ.hint }])
      setLoading(false)
    } else {
      // Done — run ML model
      const analysingMsg = getAnalysingMessage(fa)
      setMessages(p => [...p, { role: 'ai', text: analysingMsg }])

      try {
        const res = await triageEngine.assessTriage({ answers: newAnswers })
        setResult(res)
        
        // Map level to color description
        const colorDesc = res.level === 'low' ? '🟢 Green (Low Risk)' 
                        : res.level === 'medium' ? '🟡 Yellow (Moderate Risk)'
                        : res.level === 'high' ? '🟠 Orange (High Risk)'
                        : '🔴 Red (Emergency)'
        
        setMessages(p => [...p, {
          role: 'ai',
          text: res.autoEscalate
            ? `Assessment complete. ${colorDesc} — EMERGENCY detected. Auto-escalation triggered.`
            : `Assessment complete. Risk level: ${colorDesc}`
        }])
      } catch (_e) {
        setMessages(p => [...p, { role: 'ai', text: 'Assessment failed. Please try again.' }])
      } finally {
        setLoading(false)
      }
    }
  }

  function reset() {
    setMessages([{ role: 'ai', text: FIRST_QUESTION.text, hint: FIRST_QUESTION.hint }])
    setInput(''); setHistory([]); setAnswers([]); setFirstAnswer(''); setResult(null); setLoading(false); setQuestionCount(1)
  }

  const cfg  = result ? RISK_CFG[result.level]  : null
  const next = result ? NEXT_STEP[result.level] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Brain size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Symptom Checker</h1>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                  <Brain size={14} className="text-teal-300" />
                  Groq adaptive questions · XGBoost ML scoring · 96.4% accuracy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector value={language} onChange={setLanguage} />
              <span className="text-sm text-white bg-white/20 px-4 py-2 rounded-xl font-bold backdrop-blur-sm">Q{questionCount}</span>
              <AIPill />
              <button onClick={reset} className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all" aria-label="Restart">
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col max-w-5xl mx-auto h-[calc(100vh-10rem)]">

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-base leading-relaxed shadow-lg
                ${m.role === 'user'
                  ? 'bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-br-sm'
                  : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                {m.text}
                {m.hint && m.role === 'ai' && !result && i === messages.length - 1 && (
                  <p className="text-sm text-gray-500 mt-2 italic">{m.hint}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3 text-base text-gray-700 shadow-lg">
              <Loader2 size={20} className="animate-spin text-teal-500" />
              {answers.length > 3 ? 'Analysing with ML model…' : 'Generating next question…'}
            </div>
          </div>
        )}

        {/* Result card */}
        {result && cfg && next && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-2xl border-4 p-8 space-y-6 shadow-2xl ${cfg.bgColor} ${cfg.border}`} role="alert">

            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-lg font-bold ${cfg.badgeBg} border-2`}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-3">
                {/* Color indicator circles */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-md
                    ${result.level === 'low' ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-300'}`}>
                    {result.level === 'low' && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                  <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-md
                    ${result.level === 'medium' ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-200 border-gray-300'}`}>
                    {result.level === 'medium' && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                  <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-md
                    ${result.level === 'high' || result.level === 'emergency' ? 'bg-red-500 border-red-600' : 'bg-gray-200 border-gray-300'}`}>
                    {(result.level === 'high' || result.level === 'emergency') && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                </div>
                <span className={`text-base font-bold text-gray-700 ml-2`}>({result.score}/100)</span>
              </div>
            </div>

            <div>
              <div className="h-5 bg-white/70 rounded-full overflow-hidden border-2 border-white/50 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${cfg.barColor}`} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                <span>🟢 0-40 Green (Low)</span>
                <span>🟡 40-60 Yellow</span>
                <span>🟠 60-75 Orange</span>
                <span className="text-red-500 font-bold">🔴 75+ Red</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/70 rounded-2xl px-6 py-4 border-2 border-white/50 shadow-md">
              <span className="text-3xl leading-none">🏥</span>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Recommended facility</p>
                <p className={`text-lg font-bold ${cfg.textColor} mt-1`}>Level {result.hospitalLevel} — {result.hospitalLevelLabel}</p>
                <p className="text-sm text-gray-600 mt-1">{result.hospitalLevelDesc}</p>
              </div>
            </div>

            {result.autoEscalate && (
              <div className="flex items-start gap-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl px-6 py-4 shadow-xl animate-pulse" role="alert">
                <Siren size={24} className="shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-lg">Auto-escalation triggered</p>
                  <p className="text-base text-red-100 mt-2">Score {result.score}/100 exceeded threshold. Nearest facility notified automatically.</p>
                </div>
              </div>
            )}

            {result.triggeredFlags.length > 0 && (
              <div className="space-y-2">
                <p className={`text-base font-bold ${cfg.textColor}`}>Risk factors detected:</p>
                {result.triggeredFlags.map(flag => (
                  <div key={flag} className={`flex items-center gap-2 text-base ${cfg.textColor}`}>
                    <AlertTriangle size={16} /> {flag}
                  </div>
                ))}
              </div>
            )}

            {result.probabilities && (
              <div className="bg-white/70 rounded-2xl p-5 space-y-3 border-2 border-white/50 shadow-md">
                <p className={`text-sm font-bold mb-3 ${cfg.textColor}`}>ML Probability Breakdown</p>
                <ProbBar label="Low"       pct={result.probabilities.low}       color="bg-emerald-500" />
                <ProbBar label="Medium"    pct={result.probabilities.medium}    color="bg-amber-400"   />
                <ProbBar label="High"      pct={result.probabilities.high}      color="bg-orange-500"  />
                <ProbBar label="Emergency" pct={result.probabilities.emergency} color="bg-red-600"     />
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 text-sm bg-white/70 border-2 border-white/50 rounded-xl px-4 py-2 text-gray-700 font-medium">
                <Brain size={14} className="text-teal-500" />
                {result.mlUsed ? `XGBoost · ${result.confidence?.toFixed(1)}% confidence` : 'Rule-based'}
              </span>
              <span className="inline-flex items-center gap-2 text-sm bg-purple-50 border-2 border-purple-300 rounded-xl px-4 py-2 text-purple-700 font-bold">
                ✨ {questionCount} Gemini questions
              </span>
              {(result.confidence ?? 0) >= 90 && (
                <span className="inline-flex items-center gap-2 text-sm bg-white/70 border-2 border-white/50 rounded-xl px-4 py-2 text-emerald-700 font-bold">
                  <CheckCircle2 size={14} /> High confidence
                </span>
              )}
              <AIPill />
            </div>

            <p className={`text-base leading-relaxed font-medium ${cfg.textColor}`}>{next.advice}</p>

            <div className="flex gap-3 flex-wrap pt-2">
              {result.autoEscalate ? (
                <>
                  <a href="tel:104" className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl px-8 py-4 text-lg font-bold transition-all duration-200 shadow-xl hover:shadow-2xl">
                    <Siren size={20} /> Call 104 now
                  </a>
                  <button onClick={() => navigate('/patient/referrals')} className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white font-bold py-4 px-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-base">View escalation</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate(next.route)}
                    className={`${result.level === 'high' ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-[#E85D04] to-[#d94f03]'} text-white font-bold py-4 px-8 rounded-2xl hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-base`}>
                    {next.cta} <ChevronRight size={18} />
                  </button>
                  <button onClick={() => navigate('/patient/teleconsult')}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 border-2 border-teal-300 text-teal-700 rounded-2xl px-6 py-4 text-base font-bold transition-all duration-200 shadow-md">
                    <Video size={18} /> Teleconsult
                  </button>
                  <button onClick={reset} className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white font-bold py-4 px-6 rounded-2xl hover:shadow-xl transition-all duration-200 text-base">Start over</button>
                </>
              )}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!result && (
        <div className="px-4 sm:px-6 py-4 border-t-2 border-gray-200 bg-white shadow-lg flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
              placeholder="Type your answer…" rows={1} disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#123B6D] focus:border-[#123B6D] resize-none min-h-[50px] disabled:opacity-50 text-base"
              aria-label="Your answer" />
            <button type="button" className="p-3 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition-all" aria-label="Voice input">
              <Mic size={20} />
            </button>
            <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white font-bold p-3 rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-40" aria-label="Send">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
