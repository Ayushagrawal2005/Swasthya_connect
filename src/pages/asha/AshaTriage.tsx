// ASHA — Assisted Triage (Module 2 — vitals + symptom scoring)
// Auto-escalates when score ≥ 75 per SwasthyaConnect risk scoring spec
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, RotateCcw, AlertTriangle, ArrowRight, Siren, Activity, Thermometer, Heart, Wind } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { computeRiskScore, riskDisplayConfig, type RiskLevel } from '../../lib/riskScoring'
import { useNavigate } from 'react-router-dom'

interface VitalField { id: 'bp' | 'temp' | 'spo2' | 'pulse'; label: string; placeholder: string; unit: string; icon: React.ReactNode; normal: string }

const vitalFields: VitalField[] = [
  { id: 'bp',    label: 'Blood pressure',  placeholder: '120/80', unit: 'mmHg', icon: <Activity size={15} />,    normal: '90/60 – 140/90' },
  { id: 'temp',  label: 'Temperature',     placeholder: '98.6',   unit: '°F',   icon: <Thermometer size={15} />, normal: '97 – 99.5' },
  { id: 'spo2',  label: 'SpO2',            placeholder: '98',     unit: '%',    icon: <Wind size={15} />,        normal: '95 – 100' },
  { id: 'pulse', label: 'Pulse rate',      placeholder: '80',     unit: 'bpm',  icon: <Heart size={15} />,       normal: '60 – 100' },
]

const questions = [
  "What is the patient's main complaint?",
  "How many days have the symptoms been present?",
  "On a scale of 1–10, how severe does the patient rate the discomfort?",
  "Any of these: chest pain, difficulty breathing, severe headache, convulsions, or heavy bleeding?",
  "Any known conditions? (pregnancy, diabetes, hypertension, TB, none)",
]

const nextStepForLevel: Record<RiskLevel, { text: string; cta: string }> = {
  low:       { text: 'Provide self-care guidance. Schedule follow-up in 7 days if symptoms persist.',                                                                    cta: 'Record & close' },
  medium:    { text: 'Book a PHC appointment within 24 hours. Record vitals and continue monitoring.',                                                                    cta: 'Book appointment' },
  high:      { text: 'Initiate teleconsultation with PHC doctor now. Prepare an urgent referral.',                                                                       cta: 'Start teleconsult' },
  emergency: { text: 'Score ≥ 75 — AUTOMATIC ESCALATION TRIGGERED. Nearest higher-tier facility notified. Arrange emergency transport immediately and call 104.',        cta: 'View escalation' },
}

export function AshaTriage() {
  const navigate = useNavigate()
  const [vitals, setVitals]               = useState<Record<string, string>>({})
  const [vitalsSubmitted, setVitalsSubmitted] = useState(false)
  const [messages, setMessages]           = useState<{ role: 'system' | 'user'; text: string }[]>([{ role: 'system', text: questions[0] }])
  const [input, setInput]                 = useState('')
  const [qIdx, setQIdx]                   = useState(0)
  const [answers, setAnswers]             = useState<string[]>([])
  const [result, setResult]               = useState<ReturnType<typeof computeRiskScore> | null>(null)
  const [autoEscalated, setAutoEscalated] = useState(false)

  useEffect(() => {
    if (result?.autoEscalate && !autoEscalated) setAutoEscalated(true)
  }, [result, autoEscalated])

  function handleSend() {
    if (!input.trim()) return
    const newAnswers = [...answers, input]
    setAnswers(newAnswers)
    setMessages(p => [...p, { role: 'user', text: input }])
    setInput('')
    const next = qIdx + 1
    if (next < questions.length) {
      setTimeout(() => {
        setMessages(p => [...p, { role: 'system', text: questions[next] }])
        setQIdx(next)
      }, 500)
    } else {
      setTimeout(() => {
        const scored = computeRiskScore({ vitals: vitals as any, answers: newAnswers })
        setResult(scored)
        const msg = scored.autoEscalate
          ? `⚠️ Risk score: ${scored.score}/100 — EMERGENCY threshold exceeded. Auto-escalation triggered.`
          : `Assessment complete. Risk score: ${scored.score}/100.`
        setMessages(p => [...p, { role: 'system', text: msg }])
      }, 500)
    }
  }

  function reset() {
    setVitals({}); setVitalsSubmitted(false)
    setMessages([{ role: 'system', text: questions[0] }])
    setInput(''); setQIdx(0); setAnswers([]); setResult(null); setAutoEscalated(false)
  }

  const cfg  = result ? riskDisplayConfig[result.level] : null
  const next = result ? nextStepForLevel[result.level] : null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#D3D1C7] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-semibold text-[#2C2C2A]">Patient triage</h1>
          <p className="text-xs text-[#5F5E5A]">ASHA-assisted · score ≥ 75 auto-escalates</p>
        </div>
        <div className="flex items-center gap-2">
          <AIPill />
          <button onClick={reset} className="p-2 rounded-lg text-[#5F5E5A] hover:bg-gray-100 transition-colors" aria-label="Restart">
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Step 1: Vitals ── */}
        {!vitalsSubmitted && (
          <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
              <h2 className="font-semibold text-sm text-[#2C2C2A]">Record vitals</h2>
              <span className="text-xs text-[#5F5E5A]">— fill what you have; others optional</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {vitalFields.map(f => (
                <div key={f.id}>
                  <label htmlFor={`v-${f.id}`} className="block text-xs font-medium text-[#2C2C2A] mb-1 flex items-center gap-1.5">
                    <span className="text-teal-500" aria-hidden="true">{f.icon}</span>{f.label}
                  </label>
                  <div className="relative">
                    <input id={`v-${f.id}`} type="text" value={vitals[f.id] || ''}
                      onChange={e => setVitals(p => ({ ...p, [f.id]: e.target.value }))}
                      placeholder={f.placeholder} className="input-field text-sm pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#5F5E5A] pointer-events-none">{f.unit}</span>
                  </div>
                  <p className="text-[10px] text-[#5F5E5A] mt-0.5">Normal: {f.normal}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setVitalsSubmitted(true)} className="btn-primary w-full justify-center py-3">
              Vitals recorded — continue to symptom check
            </button>
          </div>
        )}

        {/* ── Step 2: Symptom chat ── */}
        {vitalsSubmitted && (
          <div className="flex flex-col">
            {/* Progress */}
            {!result && (
              <div className="px-4 py-2 bg-gray-50 border-b border-[#D3D1C7] flex-shrink-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">2</div>
                  <span className="text-xs font-medium text-[#2C2C2A]">Symptom assessment</span>
                  <span className="text-xs text-[#5F5E5A]">Q{Math.min(qIdx+1, questions.length)}/{questions.length}</span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden"
                  role="progressbar" aria-valuenow={qIdx+1} aria-valuemin={0} aria-valuemax={questions.length}>
                  <div className="h-full bg-teal-500 transition-all" style={{ width: `${((qIdx+1)/questions.length)*100}%` }} />
                </div>
              </div>
            )}

            <div className="px-4 py-4 space-y-3" aria-live="polite">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${m.role === 'user' ? 'bg-teal-500 text-white rounded-br-md' : 'bg-white border border-[#D3D1C7] text-[#2C2C2A] rounded-bl-md shadow-card'}`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Risk result */}
              {result && cfg && next && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-card border p-5 space-y-4 ${cfg.bg}`}
                  role="alert" aria-live="assertive">

                  {/* Score meter */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                      <span className={`text-xl font-bold tabular-nums ${cfg.color}`}>{result.score}<span className="text-sm font-normal">/100</span></span>
                    </div>
                    <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-white/40"
                      role="meter" aria-valuenow={result.score} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`Risk score: ${result.score} out of 100`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${result.score >= 75 ? 'bg-red-500' : result.score >= 60 ? 'bg-coral-500' : result.score >= 40 ? 'bg-amber-400' : 'bg-teal-500'}`} />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 px-0.5">
                      <span>0</span><span className="ml-[38%]">40</span><span className="ml-[15%]">60</span>
                      <span className="ml-[8%] text-red-500 font-semibold">75 ↑ AUTO-ESCALATE</span>
                    </div>
                  </div>

                  {/* Auto-escalation banner */}
                  {result.autoEscalate && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 bg-red-600 text-white rounded-xl px-4 py-3" role="alert">
                      <Siren size={20} className="flex-shrink-0 mt-0.5 animate-pulse" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-sm">Auto-escalation triggered</p>
                        <p className="text-xs text-red-100 mt-0.5">
                          Score {result.score}/100 ≥ 75 threshold. Nearest higher-tier facility notified. Priority referral generated automatically.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Flags */}
                  {result.triggeredFlags.length > 0 && (
                    <ul className="space-y-1">
                      {result.triggeredFlags.map(f => (
                        <li key={f} className={`flex items-center gap-1.5 text-xs ${cfg.color}`}>
                          <AlertTriangle size={11} aria-hidden="true" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Score breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      { label: 'Vitals', val: result.breakdown.vitalsScore },
                      { label: 'Symptoms', val: result.breakdown.symptomsScore },
                      { label: 'Severity', val: result.breakdown.severityScore },
                    ].map(b => (
                      <div key={b.label} className="bg-white/70 rounded-lg py-2">
                        <p className={`font-bold text-base tabular-nums ${cfg.color}`}>{b.val}</p>
                        <p className="text-[#5F5E5A]">{b.label}</p>
                      </div>
                    ))}
                  </div>

                  <p className={`text-sm leading-relaxed ${cfg.color}`}>{next.text}</p>
                  <AIPill />

                  <div className="flex gap-2 flex-wrap">
                    {result.autoEscalate ? (
                      <>
                        <button onClick={() => navigate('/asha/emergency')}
                          className="btn-coral text-sm py-2.5 px-5 flex items-center gap-2">
                          <Siren size={15} aria-hidden="true" /> View escalation
                        </button>
                        <a href="tel:104" className="btn-secondary text-sm py-2.5 px-5">Call 104</a>
                      </>
                    ) : (
                      <>
                        <button onClick={() => navigate(result.level === 'high' ? '/asha/triage' : '/asha/followup')}
                          className={`${result.level === 'high' || result.level === 'emergency' ? 'btn-coral' : 'btn-primary'} text-sm py-2.5 px-5`}>
                          {next.cta} <ArrowRight size={14} aria-hidden="true" />
                        </button>
                        <button onClick={reset} className="btn-secondary text-sm py-2.5 px-5">New triage</button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {!result && (
              <div className="px-4 pb-4 border-t border-[#D3D1C7] pt-3 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Type patient's answer…" rows={1}
                    className="input-field resize-none flex-1 min-h-[48px]" aria-label="Patient answer" />
                  <button type="button" className="p-3 rounded-xl border border-[#D3D1C7] text-[#5F5E5A] hover:bg-teal-50 hover:text-teal-600 transition-all"
                    aria-label="Voice input"><Mic size={18} aria-hidden="true" /></button>
                  <button type="button" onClick={handleSend} disabled={!input.trim()}
                    className="btn-primary p-3 rounded-xl disabled:opacity-40"
                    aria-label="Send answer"><Send size={18} aria-hidden="true" /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
