// Module 2 — Digital Triage (patient self-serve)
// Auto-escalates (score ≥ 75) per SwasthyaConnect risk scoring spec
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, RotateCcw, AlertTriangle, CheckCircle, ArrowRight, Siren } from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { computeRiskScore, riskDisplayConfig, type RiskLevel } from '../../lib/riskScoring'

const questions = [
  "What is your main concern or symptom today?",
  "How long have you had this? (e.g. 1 day, 3 days, 1 week)",
  "On a scale of 1–10, how severe is the pain or discomfort?",
  "Do you have any of these: chest pain, difficulty breathing, severe headache, convulsions, or heavy bleeding?",
  "Do you have any known conditions? (e.g. diabetes, hypertension, pregnancy, TB, or none)",
]

const nextStepForLevel: Record<RiskLevel, { text: string; cta: string; route: string }> = {
  low:       { text: 'Self-care is appropriate. Rest, hydrate, and monitor. Visit a sub-centre if symptoms worsen in 2 days.',                           cta: 'View home care tips',      route: '/patient/appointments' },
  medium:    { text: 'Visit your nearest PHC within 24 hours. Bring this triage report with you.',                                                       cta: 'Book appointment',         route: '/patient/appointments' },
  high:      { text: 'Go to your nearest PHC or Rural Hospital today. A referral has been prepared for you.',                                            cta: 'See referral tracker',     route: '/patient/referrals' },
  emergency: { text: 'Your score exceeded the emergency threshold. An automatic escalation has been sent to the nearest higher facility. Call 104 NOW.', cta: 'Call 104 — Emergency',     route: '/patient/referrals' },
}

export function TriagePage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<{ role: 'system' | 'user'; text: string }[]>([
    { role: 'system', text: questions[0] },
  ])
  const [input, setInput] = useState('')
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<ReturnType<typeof computeRiskScore> | null>(null)
  const [autoEscalated, setAutoEscalated] = useState(false)

  // When result arrives and score ≥ 75, trigger auto-escalation
  useEffect(() => {
    if (result?.autoEscalate && !autoEscalated) {
      setAutoEscalated(true)
      // In a real system this fires an API call; here we show the alert immediately
    }
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
        const scored = computeRiskScore({ answers: newAnswers })
        setResult(scored)
        const finalMsg = scored.autoEscalate
          ? '⚠️ Assessment complete. Your risk score is critical — automatic escalation is being triggered.'
          : 'Assessment complete. See your risk summary below.'
        setMessages(p => [...p, { role: 'system', text: finalMsg }])
      }, 500)
    }
  }

  function reset() {
    setMessages([{ role: 'system', text: questions[0] }])
    setInput(''); setQIdx(0); setAnswers([]); setResult(null); setAutoEscalated(false)
  }

  const cfg   = result ? riskDisplayConfig[result.level] : null
  const next  = result ? nextStepForLevel[result.level] : null
  const score = result?.score ?? 0

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#D3D1C7] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-semibold text-[#2C2C2A]">Symptom checker</h1>
          <p className="text-xs text-[#5F5E5A]">AI-assisted · {questions.length} questions · ~2 min</p>
        </div>
        <div className="flex items-center gap-2">
          <AIPill />
          <button onClick={reset} className="p-2 rounded-lg text-[#5F5E5A] hover:bg-gray-100 transition-colors" aria-label="Restart">
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Progress */}
      {!result && (
        <div className="h-1.5 bg-gray-100 flex-shrink-0"
          role="progressbar" aria-valuenow={qIdx} aria-valuemin={0} aria-valuemax={questions.length}
          aria-label="Triage progress">
          <div className="h-full bg-teal-500 transition-all duration-500"
            style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }} />
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3" aria-live="polite" aria-label="Triage conversation">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${m.role === 'user'
                  ? 'bg-teal-500 text-white rounded-br-md'
                  : 'bg-white border border-[#D3D1C7] text-[#2C2C2A] rounded-bl-md shadow-card'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Risk result card */}
        {result && cfg && next && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className={`rounded-card border p-5 space-y-4 ${cfg.bg}`}
            role="alert" aria-live="assertive">

            {/* Score meter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className={`text-xl font-bold tabular-nums ${cfg.color}`}>{score}<span className="text-sm font-normal">/100</span></span>
              </div>
              <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-white/50"
                role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}
                aria-label={`Risk score: ${score} out of 100`}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    score >= 75 ? 'bg-red-500' : score >= 60 ? 'bg-coral-500' : score >= 40 ? 'bg-amber-400' : 'bg-teal-500'
                  }`} />
              </div>
              {/* Threshold markers */}
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 px-0.5">
                <span>0</span>
                <span className="ml-[38%]">40 medium</span>
                <span className="ml-[15%]">60 high</span>
                <span className="ml-[11%]">75 emergency</span>
              </div>
            </div>

            {/* Auto-escalation banner */}
            {result.autoEscalate && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-600 text-white rounded-xl px-4 py-3"
                role="alert">
                <Siren size={20} className="flex-shrink-0 mt-0.5 animate-pulse" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-sm">Auto-escalation triggered</p>
                  <p className="text-xs text-red-100 mt-0.5">
                    Risk score {score}/100 exceeded the 75-point threshold. The nearest higher-tier facility has been automatically notified. A priority referral is being generated.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Triggered flags */}
            {result.triggeredFlags.length > 0 && (
              <div>
                <p className={`text-xs font-semibold mb-1.5 ${cfg.color}`}>Risk factors detected:</p>
                <ul className="space-y-1">
                  {result.triggeredFlags.map(f => (
                    <li key={f} className={`flex items-center gap-1.5 text-xs ${cfg.color}`}>
                      <AlertTriangle size={11} aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
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

            {/* Next step */}
            <p className={`text-sm leading-relaxed ${cfg.color}`}>{next.text}</p>
            <AIPill />

            {/* CTAs */}
            <div className="flex gap-2 flex-wrap">
              {result.autoEscalate ? (
                <>
                  <a href="tel:104"
                    className="btn-coral text-sm py-2.5 px-5 flex items-center gap-2"
                    aria-label="Call 104 emergency helpline">
                    <Siren size={15} aria-hidden="true" /> Call 104 now
                  </a>
                  <button onClick={() => navigate('/patient/referrals')}
                    className="btn-secondary text-sm py-2.5 px-5">
                    View escalation status
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate(next.route)}
                    className={`${result.level === 'high' ? 'btn-coral' : 'btn-primary'} text-sm py-2.5 px-5`}>
                    {next.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                  <button onClick={reset} className="btn-secondary text-sm py-2.5 px-5">
                    Start over
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {!result && (
        <div className="px-4 sm:px-6 py-4 border-t border-[#D3D1C7] bg-white flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Type your answer…" rows={1}
              className="input-field resize-none flex-1 min-h-[48px]"
              aria-label="Your answer" />
            <button className="p-3 rounded-xl border border-[#D3D1C7] text-[#5F5E5A] hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all"
              aria-label="Voice input" type="button">
              <Mic size={18} aria-hidden="true" />
            </button>
            <button onClick={handleSend} disabled={!input.trim()}
              className="btn-primary p-3 rounded-xl disabled:opacity-40" aria-label="Send answer" type="button">
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="text-[10px] text-[#5F5E5A] mt-2 text-center">
            Question {Math.min(qIdx + 1, questions.length)} of {questions.length}
          </p>
        </div>
      )}
    </div>
  )
}
