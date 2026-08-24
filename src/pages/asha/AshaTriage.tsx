import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Thermometer, Heart, Wind, Mic, Send, RotateCcw, AlertTriangle, Siren, Brain, CheckCircle2, Loader2, ChevronRight } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { triageEngine } from '../../lib/triageEngine'
import type { HybridTriageResult } from '../../lib/triageEngine'
import { getNextQuestion, getAnalysingMessage, FIRST_QUESTION } from '../../services/geminiTriage'
import type { Turn } from '../../services/geminiTriage'
import { useNavigate } from 'react-router-dom'
import type { RiskLevel } from '../../lib/riskScoring'

type Step = 'vitals' | 'symptoms' | 'done'
interface Msg { role: 'ai' | 'user'; text: string; hint?: string }

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
  low:       { advice: 'Provide home-care guidance. Schedule follow-up in 7 days.',               cta: 'Record & close' },
  medium:    { advice: 'Book PHC appointment within 24 hours. Continue monitoring.',              cta: 'Book appointment' },
  high:      { advice: 'Initiate teleconsultation with PHC doctor. Prepare urgent referral.',     cta: 'Start teleconsult' },
  emergency: { advice: 'CRITICAL - Auto-escalation triggered. Arrange emergency transport.',      cta: 'Call 104' },
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const [vitals, setVitals]       = useState<Record<string, string>>({})
  const [step, setStep]           = useState<Step>('vitals')
  const [messages, setMessages]   = useState<Msg[]>([{ role: 'ai', text: FIRST_QUESTION.text, hint: FIRST_QUESTION.hint }])
  const [input, setInput]         = useState('')
  const [history, setHistory]     = useState<Turn[]>([])
  const [answers, setAnswers]     = useState<string[]>([])
  const [firstAnswer, setFirstAnswer] = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<HybridTriageResult | null>(null)
  const [qCount, setQCount]       = useState(1)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    const newAnswers = [...answers, text]
    setAnswers(newAnswers)
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')

    const currentQ = messages.filter(m => m.role === 'ai').slice(-1)[0]?.text ?? ''
    const fa = firstAnswer || text
    if (!firstAnswer) setFirstAnswer(text)
    const newHistory: Turn[] = [...history, { question: currentQ, answer: text }]
    setHistory(newHistory)

    setLoading(true)
    const nextQ = await getNextQuestion(newHistory, fa)

    if (nextQ) {
      setQCount(c => c + 1)
      setMessages(p => [...p, { role: 'ai', text: nextQ.text, hint: nextQ.hint }])
      setLoading(false)
    } else {
      const analysingMsg = getAnalysingMessage(fa)
      setMessages(p => [...p, { role: 'ai', text: analysingMsg }])
      try {
        const res = await triageEngine.assessTriage({
          vitals: { bp: vitals['bp'], temp: vitals['temp'], spo2: vitals['spo2'], pulse: vitals['pulse'] },
          answers: newAnswers,
        })
        setResult(res)
        setStep('done')
        setMessages(p => [...p, {
          role: 'ai',
          text: res.autoEscalate
            ? `EMERGENCY - Score ${res.score}/100. Auto-escalation triggered.`
            : `Assessment complete. Score: ${res.score}/100.`
        }])
      } catch (_e) {
        setMessages(p => [...p, { role: 'ai', text: 'Assessment failed. Please retry.' }])
      } finally {
        setLoading(false)
      }
    }
  }

  function reset() {
    setVitals({}); setStep('vitals')
    setMessages([{ role: 'ai', text: FIRST_QUESTION.text, hint: FIRST_QUESTION.hint }])
    setInput(''); setHistory([]); setAnswers([]); setFirstAnswer(''); setResult(null); setLoading(false); setQCount(1)
  }

  const cfg  = result ? RISK_CFG[result.level]  : null
  const next = result ? NEXT_STEP[result.level] : null
  const STEPS: Step[] = ['vitals', 'symptoms', 'done']
  const stepLabels: Record<Step, string> = { vitals: 'Vitals', symptoms: 'Symptoms', done: 'Result' }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">

      <div className="px-4 sm:px-6 py-3 border-b border-[#D3D1C7] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-semibold text-[#2C2C2A] text-sm">ASHA Patient Triage</h1>
          <p className="text-[11px] text-[#5F5E5A] flex items-center gap-1.5 mt-0.5">
            <Brain size={11} className="text-teal-500" />
            Gemini adaptive questions · XGBoost ML scoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {step === 'symptoms' && (
            <span className="text-[10px] text-[#9E9C94] bg-gray-100 px-2 py-0.5 rounded-full">Q{qCount}</span>
          )}
          <AIPill />
          <button onClick={reset} className="p-1.5 rounded-lg text-[#5F5E5A] hover:bg-gray-100" aria-label="Restart">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

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
                      <input id={`v-${f.id}`} type="text" value={vitals[f.id] ?? ''}
                        onChange={e => setVitals(p => ({ ...p, [f.id]: e.target.value }))}
                        placeholder={f.placeholder} className="input-field text-sm pr-10 w-full" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#9E9C94] pointer-events-none">{f.unit}</span>
                    </div>
                    <p className="text-[10px] text-[#9E9C94] mt-0.5">Normal: {f.normal}</p>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setStep('symptoms')} className="btn-primary w-full py-3 justify-center text-sm flex items-center gap-1.5">
              Continue to symptom check <ChevronRight size={14} />
            </button>
          </div>
        )}

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

              {result && cfg && next && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                  className={`rounded-2xl border p-5 space-y-4 ${cfg.bgColor} ${cfg.border}`} role="alert">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${cfg.badgeBg}`}>{cfg.label}</span>
                    <span className={`text-2xl font-bold tabular-nums ${cfg.textColor}`}>{result.score}<span className="text-sm font-normal">/100</span></span>
                  </div>
                  <div>
                    <div className="h-3 bg-white/70 rounded-full overflow-hidden border border-white/50">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${cfg.barColor}`} />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>0 Low</span><span>40 Med</span><span>60 High</span><span className="text-red-400 font-semibold">75+ Emergency</span>
                    </div>
                  </div>
                  {result.autoEscalate && (
                    <div className="flex items-start gap-3 bg-red-600 text-white rounded-xl px-4 py-3" role="alert">
                      <Siren size={18} className="shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-semibold text-sm">Auto-escalation triggered</p>
                        <p className="text-xs text-red-100 mt-0.5">Score {result.score}/100 exceeded threshold. Nearest facility notified.</p>
                      </div>
                    </div>
                  )}
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
                  {result.probabilities && (
                    <div className="bg-white/60 rounded-xl p-3 space-y-1.5">
                      <p className={`text-[11px] font-semibold mb-2 ${cfg.textColor}`}>ML Probability Breakdown</p>
                      <ProbBar label="Low"       pct={result.probabilities.low}       color="bg-emerald-500" />
                      <ProbBar label="Medium"    pct={result.probabilities.medium}    color="bg-amber-400"   />
                      <ProbBar label="High"      pct={result.probabilities.high}      color="bg-orange-500"  />
                      <ProbBar label="Emergency" pct={result.probabilities.emergency} color="bg-red-600"     />
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-white/70 border border-white/50 rounded-full px-2 py-0.5 text-[#5F5E5A]">
                      <Brain size={9} className="text-teal-500" />
                      {result.mlUsed ? `XGBoost - ${result.confidence?.toFixed(1)}% confidence` : 'Rule-based fallback'}
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
                  <div className="flex gap-2 flex-wrap pt-1">
                    {result.autoEscalate ? (
                      <>
                        <a href="tel:104" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors">
                          <Siren size={14} /> Call 104
                        </a>
                        <button onClick={() => navigate('/asha/referrals')} className="btn-secondary text-sm py-2.5 px-4">View escalation</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => navigate(result.level === 'high' ? '/asha/referrals' : '/asha/followup')}
                          className={`${result.level === 'high' ? 'btn-coral' : 'btn-primary'} text-sm py-2.5 px-5 flex items-center gap-1.5`}>
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

            {step === 'symptoms' && (
              <div className="px-4 pb-4 pt-3 border-t border-[#D3D1C7] bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
                    placeholder="Type patient's answer..." rows={1} disabled={loading}
                    className="input-field resize-none flex-1 min-h-[44px] disabled:opacity-50" aria-label="Patient answer" />
                  <button type="button" className="p-2.5 rounded-xl border border-[#D3D1C7] text-[#5F5E5A] hover:bg-teal-50 transition-all" aria-label="Voice input">
                    <Mic size={17} />
                  </button>
                  <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || loading}
                    className="btn-primary p-2.5 rounded-xl disabled:opacity-40" aria-label="Send answer">
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
