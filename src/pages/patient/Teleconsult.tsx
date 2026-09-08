// Module 3 — Teleconsultation + Add-on 2: Adaptive bandwidth streamer
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, MicOff, VideoOff, Phone, MessageSquare,
  CheckCircle, Wifi, WifiOff, Monitor, Volume2,
} from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'

type CallState = 'waiting' | 'live' | 'ended'
type Band = 'good' | 'poor' | 'critical'

const bandConfig: Record<Band, { label: string; bars: number; textColor: string; audioOnly: boolean }> = {
  good:     { label: '4G · HD video',   bars: 4, textColor: 'text-green-400',  audioOnly: false },
  poor:     { label: '3G · SD video',   bars: 2, textColor: 'text-amber-400',  audioOnly: false },
  critical: { label: '2G · Audio only', bars: 1, textColor: 'text-red-400',    audioOnly: true  },
}

const preChecks = [
  { label: 'Camera working',      icon: <Video size={16} />,   ok: true },
  { label: 'Microphone',          icon: <Mic size={16} />,     ok: true },
  { label: 'Network connection',  icon: <Wifi size={16} />,    ok: true },
  { label: 'Speaker / earphones', icon: <Volume2 size={16} />, ok: true },
]

export function TeleconsultPage() {
  const [callState, setCallState] = useState<CallState>('waiting')
  const [micOn,     setMicOn]     = useState(true)
  const [camOn,     setCamOn]     = useState(true)
  const [chatOpen,  setChatOpen]  = useState(false)
  const [chatMsg,   setChatMsg]   = useState('')
  const [band,      setBand]      = useState<Band>('good')
  const [bandToast, setBandToast] = useState('')
  const [messages,  setMessages]  = useState([
    { from: 'doctor', text: "Good morning, Priya. I can see your history. How are you feeling today?" },
  ])

  useEffect(() => {
    if (callState !== 'live') return
    const t1 = setTimeout(() => {
      setBand('poor'); setBandToast('Network degraded — switching to SD video (3G)')
      setTimeout(() => setBandToast(''), 3000)
    }, 8000)
    const t2 = setTimeout(() => {
      setBand('critical'); setBandToast('Weak signal — auto-switched to audio-only (2G)')
      setTimeout(() => setBandToast(''), 4000)
    }, 16000)
    const t3 = setTimeout(() => {
      setBand('good'); setBandToast('Network restored — video reconnected (4G)')
      setTimeout(() => setBandToast(''), 3000)
    }, 24000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [callState])

  function sendMsg() {
    if (!chatMsg.trim()) return
    setMessages(p => [...p, { from: 'patient', text: chatMsg }])
    setChatMsg('')
    setTimeout(() => {
      setMessages(p => [...p, { from: 'doctor', text: "Understood. I'll review your BP trend and adjust medication." }])
    }, 1500)
  }

  const cfg = bandConfig[band]


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Waiting room */}
      {callState === 'waiting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5 animate-fade-in">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#2C2C2A] mb-1">Waiting room</h1>
            <p className="text-sm text-[#5F5E5A]">Dr. Ramesh Patil · PHC Beed</p>
          </div>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-600">RP</div>
            <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-30" aria-hidden="true" />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" aria-label="Doctor online" />
          </div>
          <div className="card p-4 w-full text-center">
            <p className="text-xs text-[#5F5E5A] mb-1">Queue position</p>
            <p className="text-3xl font-semibold text-[#2C2C2A] tabular-nums">#2</p>
            <p className="text-sm text-[#5F5E5A] mt-1">Est. wait: ~6 min</p>
          </div>
          <div className="card p-4 w-full">
            <p className="text-xs font-semibold text-[#5F5E5A] mb-3 uppercase tracking-wide">Pre-call checks</p>
            <div className="space-y-2">
              {preChecks.map(c => (
                <div key={c.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#5F5E5A]">{c.icon} {c.label}</div>
                  <CheckCircle size={16} className="text-green-500" aria-label="OK" />
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-center text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
            Adaptive streaming enabled — if signal drops to 2G/3G the call auto-switches to audio-only to keep you connected.
          </p>
          <button onClick={() => setCallState('live')} className="btn-primary w-full justify-center text-base py-3.5">
            <Video size={18} aria-hidden="true" /> Join call
          </button>
        </div>
      )}


      {/* Live call */}
      {callState === 'live' && (
        <div className="flex-1 flex flex-col bg-[#0f1a16] relative overflow-hidden">
          <AnimatePresence>
            {bandToast && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap"
                role="status" aria-live="polite">
                {band === 'critical'
                  ? <WifiOff size={12} className="text-red-400" aria-hidden="true" />
                  : <Wifi size={12} className="text-amber-400" aria-hidden="true" />}
                {bandToast}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex-1 flex items-center justify-center relative">
            {cfg.audioOnly ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-900/60 flex items-center justify-center text-2xl font-semibold text-indigo-300">RP</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 status-dot-live" aria-hidden="true" />
                  <span className="text-red-400 text-sm font-medium">Audio only — low signal</span>
                </div>
                <div className="flex gap-1" aria-label="Audio waveform">
                  {[1,2,3,4].map(i => (
                    <motion.div key={i} className="w-1.5 bg-indigo-400 rounded-full"
                      animate={{ height: [8, 20 + i * 6, 8] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      aria-hidden="true" />
                  ))}
                </div>
                <p className="text-white/60 text-xs">Dr. Patil is speaking…</p>
              </div>
            ) : (
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
            )}
            {!cfg.audioOnly && (
              <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl bg-[#1B2E28] border border-white/20 flex items-center justify-center overflow-hidden">
                {camOn
                  ? <div className="w-full h-full bg-teal-900/40 flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-sm text-white font-semibold">PS</div></div>
                  : <VideoOff size={18} className="text-white/40" />}
              </div>
            )}
            <div className={`absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full text-xs ${cfg.textColor}`}>
              <div className="flex items-end gap-0.5" aria-label={cfg.label}>
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-1 rounded-sm transition-all ${i <= cfg.bars ? 'bg-current' : 'bg-white/20'}`}
                    style={{ height: `${i * 4 + 4}px` }} aria-hidden="true" />
                ))}
              </div>
              {cfg.label}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-dot-live" aria-hidden="true" />
              04:32
            </div>
          </div>
          {chatOpen && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col border-l border-[#D3D1C7]">
              <div className="p-3 border-b flex items-center justify-between">
                <p className="font-semibold text-sm">Chat</p>
                <button onClick={() => setChatOpen(false)} className="text-[#5F5E5A] text-xs" aria-label="Close chat">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'patient' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${m.from === 'patient' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-[#2C2C2A]'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Type…" className="input-field text-xs py-2 flex-1" aria-label="Chat message" />
                <button onClick={sendMsg} className="btn-primary text-xs py-2 px-3">Send</button>
              </div>
            </motion.div>
          )}
          <div className="flex items-center justify-center gap-4 py-5 bg-black/60 backdrop-blur-sm">
            <button onClick={() => setMicOn(p => !p)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
              aria-label={micOn ? 'Mute' : 'Unmute'} aria-pressed={!micOn}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={() => setCamOn(p => !p)} disabled={cfg.audioOnly}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn && !cfg.audioOnly ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
              aria-label={camOn ? 'Camera off' : 'Camera on'} aria-pressed={!camOn || cfg.audioOnly}>
              {camOn && !cfg.audioOnly ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button onClick={() => setChatOpen(p => !p)}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center relative"
              aria-label="Chat" aria-pressed={chatOpen}>
              <MessageSquare size={20} />
              {messages.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral-500" aria-hidden="true" />}
            </button>
            <button onClick={() => setCallState('ended')}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
              aria-label="End call">
              <Phone size={22} className="rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}


      {/* Post-call */}
      {callState === 'ended' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#2C2C2A]">Call ended</h2>
            <p className="text-sm text-[#5F5E5A] mt-1">Duration: 8 min 22 sec · Dr. Ramesh Patil</p>
          </div>
          <div className="card p-5 w-full space-y-3">
            <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide">Doctor's notes</p>
            <p className="text-sm text-[#2C2C2A] leading-relaxed">Continue iron supplementation. Repeat CBC in 2 weeks. BP review in 5 days.</p>
            <AIPill />
          </div>
          <button onClick={() => setCallState('waiting')} className="btn-secondary w-full justify-center text-sm">
            <Monitor size={15} /> Back to waiting room
          </button>
        </div>
      )}
    </div>
  )
}
