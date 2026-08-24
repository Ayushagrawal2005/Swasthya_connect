/**
 * Add-on 4 — IVR Toll-Free Helpline Simulator
 * Shows the non-smartphone rural user pathway
 * Simulates 1800-XXX-XXXX IVR tree → symptom capture → case ID
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Volume2, CheckCircle, Mic, ArrowRight, RotateCcw, PhoneOff } from 'lucide-react'

type IvrState = 'idle' | 'dialing' | 'welcome' | 'menu' | 'symptoms' | 'risk' | 'done'

interface IvrOption { key: string; label: string; next: IvrState }

const menuOptions: IvrOption[] = [
  { key: '1', label: 'Describe symptoms & get care guidance', next: 'symptoms' },
  { key: '2', label: 'Book / check appointment status',       next: 'done' },
  { key: '3', label: 'Medicine availability at nearest PHC',  next: 'done' },
  { key: '4', label: 'Emergency — connect to health worker',  next: 'done' },
  { key: '9', label: 'Repeat menu in Hindi',                  next: 'menu' },
]

const symptomQuestions = [
  'क्या आपको बुखार है? (Fever?) — Press 1 for Yes, 2 for No',
  'क्या आपको सीने में दर्द है? (Chest pain?) — Press 1 for Yes, 2 for No',
  'दर्द की तीव्रता 1 से 5 में बताएं (Rate pain 1-5)',
]

const callLog: { time: string; event: string }[] = [
  { time: '10:32:01', event: 'Incoming call from +91 98765 43210' },
  { time: '10:32:02', event: 'IVR system answered — welcome message played (Hindi)' },
  { time: '10:32:14', event: 'Caller pressed 1 — Symptom assessment selected' },
  { time: '10:32:18', event: 'Q1: Fever? — Caller pressed 1 (Yes)' },
  { time: '10:32:24', event: 'Q2: Chest pain? — Caller pressed 2 (No)' },
  { time: '10:32:31', event: 'Q3: Pain severity — Caller pressed 3' },
  { time: '10:32:35', event: 'AI risk assessment: Moderate (score 42)' },
  { time: '10:32:36', event: 'Guidance SMS sent to +91 98765 43210 (Hindi)' },
  { time: '10:32:37', event: 'Case ID IVR-20260823-0047 generated' },
]

export function IvrSimulatorPage() {
  const [state, setState] = useState<IvrState>('idle')
  const [symIdx, setSymIdx]   = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [caseId] = useState('IVR-20260823-0047')

  function press(key: string) {
    if (state === 'menu') {
      const opt = menuOptions.find(o => o.key === key)
      if (opt) setState(opt.next)
    } else if (state === 'symptoms') {
      const next = [...answers, key]
      setAnswers(next)
      if (symIdx < symptomQuestions.length - 1) setSymIdx(p => p + 1)
      else setState('risk')
    }
  }

  function startCall() {
    setState('dialing')
    setTimeout(() => setState('welcome'), 1500)
    setTimeout(() => setState('menu'), 3000)
  }

  function reset() {
    setState('idle'); setSymIdx(0); setAnswers([])
  }

  const dialKeys = ['1','2','3','4','5','6','7','8','9','*','0','#']

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">IVR Helpline Simulator</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">
          Toll-free 1800-XXX-XXXX · For citizens without smartphones · Works on basic phones
        </p>
      </div>

      {/* IVR phone UI */}
      <div className="card p-6 max-w-xs mx-auto space-y-5">
        {/* Screen */}
        <div className="bg-[#1a2620] rounded-2xl p-4 min-h-[120px] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            {(state === 'dialing' || state === 'welcome' || state === 'menu' || state === 'symptoms' || state === 'risk' || state === 'done') && (
              <span className="w-2 h-2 rounded-full bg-green-400 status-dot-live" aria-hidden="true" />
            )}
            <span className="text-green-400 text-xs font-mono">
              {state === 'idle' ? 'Ready to dial' : state === 'dialing' ? 'Dialing…' : '1800-XXX-XXXX Connected'}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 text-xs text-center mt-4">
                Press Call to simulate dialing
              </motion.p>
            )}
            {state === 'welcome' && (
              <motion.p key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-xs leading-relaxed">
                <Volume2 size={12} className="inline mr-1" aria-hidden="true" />
                "स्वागत है SwasthyaConnect हेल्पलाइन पर। Welcome to SwasthyaConnect. Please choose your language..."
              </motion.p>
            )}
            {state === 'menu' && (
              <motion.p key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-xs leading-relaxed">
                <Volume2 size={12} className="inline mr-1" aria-hidden="true" />
                "Main menu — लक्षण बताएं: 1, Appointment: 2, Medicine: 3, Emergency: 4, Hindi repeat: 9"
              </motion.p>
            )}
            {state === 'symptoms' && (
              <motion.p key={symIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-white text-xs leading-relaxed">
                <Volume2 size={12} className="inline mr-1" aria-hidden="true" />
                {symptomQuestions[symIdx]}
              </motion.p>
            )}
            {state === 'risk' && (
              <motion.p key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300 text-xs leading-relaxed">
                <Volume2 size={12} className="inline mr-1" aria-hidden="true" />
                "Risk: Moderate. Please visit nearest PHC within 24 hours. Case ID: {caseId}. SMS sent."
              </motion.p>
            )}
            {state === 'done' && (
              <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-teal-300 text-xs">
                Service completed. Disconnecting.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Options panel */}
        {(state === 'menu' || state === 'symptoms') && (
          <div className="space-y-1.5">
            {state === 'menu' && menuOptions.map(opt => (
              <button key={opt.key} onClick={() => press(opt.key)}
                className="w-full flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg bg-gray-50 border border-[#D3D1C7] hover:bg-teal-50 hover:border-teal-300 transition-all">
                <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{opt.key}</span>
                {opt.label}
              </button>
            ))}
            {state === 'symptoms' && (
              <div className="grid grid-cols-3 gap-1.5">
                {['1','2','3','4','5'].map(k => (
                  <button key={k} onClick={() => press(k)}
                    className="py-3 rounded-xl bg-gray-50 border border-[#D3D1C7] text-sm font-semibold hover:bg-teal-50 hover:border-teal-400 transition-all">
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dial pad */}
        {state === 'idle' && (
          <div className="grid grid-cols-3 gap-2">
            {dialKeys.map(k => (
              <button key={k}
                className="py-3 rounded-xl bg-gray-50 border border-[#D3D1C7] text-sm font-semibold hover:bg-teal-50 transition-all text-[#2C2C2A]">
                {k}
              </button>
            ))}
          </div>
        )}

        {/* Call / end button */}
        <div className="flex gap-3">
          {state === 'idle' ? (
            <button onClick={startCall}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
              aria-label="Start call">
              <Phone size={20} aria-hidden="true" />
            </button>
          ) : (
            <button onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              aria-label="End call">
              <PhoneOff size={20} aria-hidden="true" />
            </button>
          )}
          {state === 'idle' && (
            <button
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[#5F5E5A] hover:bg-gray-200 transition-colors"
              aria-label="Voice input">
              <Mic size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Case result */}
      {(state === 'risk' || state === 'done') && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <p className="font-semibold text-[#2C2C2A]">Case created: {caseId}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[#5F5E5A]">Risk level</p>
              <p className="font-semibold text-amber-700 mt-0.5">Moderate (Score 42)</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3">
              <p className="text-[#5F5E5A]">Action</p>
              <p className="font-semibold text-teal-700 mt-0.5">Visit PHC in 24h</p>
            </div>
          </div>
          <p className="text-xs text-[#5F5E5A] bg-gray-50 rounded-xl px-3 py-2">
            SMS sent in Hindi to +91 98765 43210: "आपका केस ID {caseId} है। कृपया 24 घंटे में PHC जाएं।"
          </p>
        </motion.div>
      )}

      {/* Call log */}
      <div className="card p-5 space-y-3">
        <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Call activity log</p>
        <div className="space-y-1.5">
          {callLog.map((log, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className="font-mono text-[#5F5E5A] flex-shrink-0">{log.time}</span>
              <span className="text-[#2C2C2A]">{log.event}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 bg-indigo-50 border-indigo-100">
        <p className="text-xs text-indigo-800 leading-relaxed">
          The IVR system handles ~200 calls/day using cloud telephony (Exotel/Twilio). No smartphone needed — works on any basic phone. NLP engine processes Hindi/Marathi speech input and generates a risk-scored case record in the same system.
        </p>
      </div>
    </div>
  )
}
