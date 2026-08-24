/**
 * ASHA — Assisted Teleconsultation (Module 3, frontline-facilitated)
 * ANM/ASHA sets up a low-bandwidth audio/video call between patient and PHC doctor.
 * Doctor sees patient's longitudinal record on their side.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, MicOff, VideoOff, Phone, MessageSquare,
  CheckCircle, Wifi, WifiOff, Volume2, User, FileText,
  Monitor, Pill,
} from 'lucide-react'
import { meena } from '../../data/meenaPatient'
import { AIPill } from '../../components/ui/AIPill'
import { useApp } from '../../context/AppContext'

type CallState = 'setup' | 'waiting' | 'live' | 'ended'

const preChecks = [
  { label: 'Microphone working',  icon: <Mic size={15} />,     ok: true },
  { label: 'Camera working',      icon: <Video size={15} />,   ok: true },
  { label: 'Internet / hotspot',  icon: <Wifi size={15} />,    ok: true },
  { label: 'Speaker audible',     icon: <Volume2 size={15} />, ok: true },
]

export function AshaTeleconsultPage() {
  const { isOnline } = useApp()
  const [callState, setCallState] = useState<CallState>('setup')
  const [micOn, setMicOn]         = useState(true)
  const [camOn, setCamOn]         = useState(true)
  const [chatOpen, setChatOpen]   = useState(false)
  const [chatMsg, setChatMsg]     = useState('')
  const [messages, setMessages]   = useState([
    { from: 'doctor', text: `Good morning. I can see Meena's record. BP trend is concerning — 152→158→168. I see she was on Amlodipine before. Let me assess her today.` },
  ])
  const [postNotes, setPostNotes]   = useState('')
  const [postRx, setPostRx]         = useState('')
  const [notesSaved, setNotesSaved] = useState(false)

  function sendMsg() {
    if (!chatMsg.trim()) return
    setMessages(p => [...p, { from: 'asha', text: chatMsg }])
    setChatMsg('')
    setTimeout(() => {
      setMessages(p => [...p, { from: 'doctor', text: 'Thanks. Recommend increasing Amlodipine to 10mg and adding Losartan 50mg. She should come in for an in-person review within 5 days.' }])
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">

        {/* ── Setup ── */}
        {callState === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5 animate-fade-in">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[#2C2C2A]">Assisted teleconsult</h1>
              <p className="text-sm text-[#5F5E5A] mt-1">Connect patient with PHC doctor</p>
            </div>

            {/* Patient card */}
            <div className="card p-4 w-full flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center font-semibold text-teal-700 flex-shrink-0">MP</div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">{meena.name}</p>
                <p className="text-xs text-[#5F5E5A]">{meena.age}y · {meena.conditions.join(', ')}</p>
              </div>
              <span className="ml-auto badge-amber text-[10px]">Risk: 52/100</span>
            </div>

            {/* Doctor available */}
            <div className="card p-4 w-full flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 flex-shrink-0">RP</div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">Dr. Ramesh Patil</p>
                <p className="text-xs text-[#5F5E5A]">PHC Beed · General Medicine</p>
              </div>
              <span className="ml-auto badge-green text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-live" aria-hidden="true" /> Available
              </span>
            </div>

            {/* Offline warning */}
            {!isOnline && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 w-full">
                <WifiOff size={13} /> No internet — teleconsult requires connectivity. Audio-only fallback may be available.
              </div>
            )}

            {/* Pre-call checklist */}
            <div className="card p-4 w-full">
              <p className="text-xs font-semibold text-[#5F5E5A] mb-3 uppercase tracking-wide">Pre-call checklist</p>
              <div className="space-y-2">
                {preChecks.map(c => (
                  <div key={c.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-[#5F5E5A]">
                      <span aria-hidden="true">{c.icon}</span> {c.label}
                    </div>
                    <CheckCircle size={15} className="text-green-500" aria-label="OK" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setCallState('waiting')} className="btn-primary w-full justify-center text-base py-3.5">
              <Video size={18} aria-hidden="true" /> Start teleconsult
            </button>
          </motion.div>
        )}

        {/* ── Waiting room ── */}
        {callState === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-semibold text-indigo-700">RP</div>
              <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-30" aria-hidden="true" />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" aria-label="Doctor online" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#2C2C2A]">Connecting to Dr. Patil…</p>
              <p className="text-sm text-[#5F5E5A] mt-1">PHC Beed · Est. wait: ~1 min</p>
            </div>
            <p className="text-xs text-center text-[#5F5E5A] max-w-xs">
              Doctor is receiving Meena's full record: 4 visit history, BP trend (152→158→168), OCR prescription, and today's triage score (52/100).
            </p>
            <button onClick={() => setCallState('live')} className="btn-primary text-sm py-2.5 px-8">
              Doctor joined — join call
            </button>
            <button onClick={() => setCallState('setup')} className="text-sm text-[#5F5E5A] hover:text-teal-600">
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── Live call ── */}
        {callState === 'live' && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-[#0f1a16] relative overflow-hidden">
            {/* Doctor video */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-full h-full bg-gradient-to-br from-[#1B2E28] to-[#0f1a16] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-900/60 flex items-center justify-center text-xl font-semibold text-indigo-300 mx-auto mb-2">RP</div>
                  <p className="text-white font-medium text-sm">Dr. Ramesh Patil</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-dot-live" aria-hidden="true" />
                    <span className="text-green-400 text-xs">Live</span>
                  </div>
                </div>
              </div>

              {/* ANM self-view */}
              <div className="absolute bottom-4 right-4 w-24 h-16 rounded-xl bg-[#1B2E28] border border-white/20 flex items-center justify-center overflow-hidden">
                {camOn ? (
                  <div className="w-full h-full bg-teal-900/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-xs text-white font-semibold">KS</div>
                  </div>
                ) : (
                  <VideoOff size={16} className="text-white/40" aria-hidden="true" />
                )}
              </div>

              {/* Patient info strip */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <User size={11} aria-hidden="true" />
                <span>{meena.name} · BP {meena.visits[0].vitals?.bp} · Score 52</span>
              </div>

              {/* Timer */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-dot-live" aria-hidden="true" />
                03:14
              </div>
            </div>

            {/* Chat panel */}
            {chatOpen && (
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col border-l border-[#D3D1C7]">
                <div className="p-3 border-b flex items-center justify-between">
                  <p className="font-semibold text-sm text-[#2C2C2A]">Chat with doctor</p>
                  <button onClick={() => setChatOpen(false)} className="text-[#5F5E5A] text-xs">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2" aria-live="polite">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.from === 'asha' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed
                        ${m.from === 'asha' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-[#2C2C2A]'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    placeholder="Message doctor…" className="input-field text-xs py-2 flex-1" aria-label="Chat message" />
                  <button onClick={sendMsg} className="btn-primary text-xs py-2 px-3">Send</button>
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4 bg-black/60 backdrop-blur-sm">
              <button onClick={() => setMicOn(p => !p)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
                aria-label={micOn ? 'Mute' : 'Unmute'} aria-pressed={!micOn}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={() => setCamOn(p => !p)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
                aria-label={camOn ? 'Camera off' : 'Camera on'} aria-pressed={!camOn}>
                {camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={() => setChatOpen(p => !p)}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center relative"
                aria-label="Toggle chat" aria-pressed={chatOpen}>
                <MessageSquare size={20} />
                {messages.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral-500" aria-hidden="true" />}
              </button>
              <button onClick={() => setCallState('ended')}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                aria-label="End call">
                <Phone size={22} className="rotate-[135deg]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Post-call: doctor's notes ── */}
        {callState === 'ended' && (
          <motion.div key="ended" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#2C2C2A]">Call ended</h2>
                <p className="text-sm text-[#5F5E5A]">Duration: 6 min 42 sec · Dr. Ramesh Patil</p>
              </div>
            </div>

            {/* Doctor's notes from call */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-500" aria-hidden="true" />
                <p className="font-semibold text-sm text-[#2C2C2A]">Add doctor's notes to Meena's record</p>
                <AIPill />
              </div>
              <div>
                <label htmlFor="post-notes" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Consultation notes</label>
                <textarea id="post-notes" rows={3} value={postNotes} onChange={e => setPostNotes(e.target.value)}
                  placeholder="e.g. BP 168/104 on assessment. Amlodipine non-compliant. Increasing dose and adding Losartan. In-person review in 5 days."
                  className="input-field resize-none text-sm" />
              </div>
              <div>
                <label htmlFor="post-rx" className="block text-sm font-medium text-[#2C2C2A] mb-1.5 flex items-center gap-2">
                  <Pill size={14} className="text-teal-500" aria-hidden="true" /> Prescription
                </label>
                <textarea id="post-rx" rows={2} value={postRx} onChange={e => setPostRx(e.target.value)}
                  placeholder="e.g. Tab Amlodipine 10mg OD · Tab Losartan 50mg OD"
                  className="input-field resize-none text-sm" />
              </div>

              {!notesSaved ? (
                <button onClick={() => setNotesSaved(true)} className="btn-primary w-full justify-center text-sm py-2.5">
                  Save to Meena's record
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle size={15} /> Notes and prescription saved to Meena's longitudinal record.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCallState('setup')} className="btn-secondary flex-1 justify-center text-sm">
                <Monitor size={15} /> New consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
