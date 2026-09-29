// Module 3 — Teleconsultation with Real WebRTC Video
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, MicOff, VideoOff, Phone, MessageSquare,
  CheckCircle, Wifi, WifiOff, Monitor, Volume2, AlertCircle,
} from 'lucide-react'
import { AIPill } from '../../components/ui/AIPill'
import { webrtcService, type ConnectionQuality } from '../../services/webrtc'
import { useApp } from '../../context/AppContext'

type CallState = 'setup' | 'waiting' | 'connecting' | 'live' | 'ended'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const WS_URL = API_BASE.replace('http', 'ws') + '/ws'

const preChecks = [
  { label: 'Camera working',      icon: <Video size={16} />,   ok: true },
  { label: 'Microphone',          icon: <Mic size={16} />,     ok: true },
  { label: 'Network connection',  icon: <Wifi size={16} />,    ok: true },
  { label: 'Speaker / earphones', icon: <Volume2 size={16} />, ok: true },
]

export function TeleconsultPage() {
  const { token, userId } = useApp()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const [callState, setCallState] = useState<CallState>('setup')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState([
    { from: 'doctor', text: "Good morning, Priya. I can see your history. How are you feeling today?" },
  ])
  
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [sessionId] = useState(`session-${Date.now()}`)
  const [callDuration, setCallDuration] = useState(0)
  const callStartTimeRef = useRef<number>(0)

  // Check WebRTC support on mount
  useEffect(() => {
    // Check if browser supports WebRTC
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support video calling. Please use Chrome, Firefox, or Edge.')
    }
  }, [])

  // Check permissions
  useEffect(() => {
    if (callState === 'setup') {
      // Check permissions when on setup page
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(() => setPermissionsGranted(true))
        .catch(() => setPermissionsGranted(false))
    }
  }, [callState])

  // Setup WebRTC event handlers
  useEffect(() => {
    webrtcService.onRemoteStream = (userId, stream) => {
      console.log('Received remote stream from', userId)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
      setCallState('live')
      callStartTimeRef.current = Date.now()
    }

    webrtcService.onPeerConnected = (userId) => {
      console.log('Peer connected:', userId)
    }

    webrtcService.onPeerDisconnected = (userId) => {
      console.log('Peer disconnected:', userId)
      setCallState('ended')
    }

    webrtcService.onConnectionQualityChange = (quality) => {
      setConnectionQuality(quality)
    }

    webrtcService.onError = (err) => {
      console.error('WebRTC error:', err)
      setError(err.message)
    }

    return () => {
      webrtcService.cleanup()
    }
  }, [])

  // Update call duration
  useEffect(() => {
    if (callState === 'live') {
      const interval = setInterval(() => {
        if (callStartTimeRef.current > 0) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [callState])

  // Initialize camera and join call
  async function startCall() {
    try {
      setError(null)
      setCallState('waiting')

      // Get local camera stream
      const stream = await webrtcService.getLocalStream()
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Connect to WebSocket signaling server
      await webrtcService.connect(WS_URL, token || '', userId || 'patient-unknown')

      setCallState('connecting')

      // Join the room (patient is not initiator, doctor will initiate)
      await webrtcService.joinRoom(sessionId, false)

    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start video call')
      setCallState('setup')
    }
  }

  // End call
  function endCall() {
    webrtcService.leaveRoom()
    webrtcService.stopLocalStream()
    setCallState('ended')
  }

  // Toggle microphone
  function toggleMic() {
    const newState = !micOn
    setMicOn(newState)
    webrtcService.toggleMicrophone(newState)
  }

  // Toggle camera
  function toggleCamera() {
    const newState = !camOn
    setCamOn(newState)
    webrtcService.toggleCamera(newState)
  }

  // Send chat message
  function sendMsg() {
    if (!chatMsg.trim()) return
    setMessages(p => [...p, { from: 'patient', text: chatMsg }])
    setChatMsg('')
    setTimeout(() => {
      setMessages(p => [...p, { from: 'doctor', text: "Understood. I'll review your BP trend and adjust medication." }])
    }, 1500)
  }

  // Format call duration
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get quality indicator
  function getQualityIndicator() {
    if (!connectionQuality) return null

    const qualityConfig = {
      excellent: { color: 'text-green-400', label: '4G · HD video', bars: 4 },
      good: { color: 'text-green-400', label: '4G · HD video', bars: 3 },
      fair: { color: 'text-amber-400', label: '3G · SD video', bars: 2 },
      poor: { color: 'text-red-400', label: '2G · Low quality', bars: 1 },
      critical: { color: 'text-red-400', label: '2G · Audio only', bars: 1 },
    }

    const config = qualityConfig[connectionQuality.quality]

    return (
      <div className={`flex items-center gap-1.5 ${config.color}`}>
        <div className="flex items-end gap-0.5" aria-label={config.label}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`w-1 rounded-sm transition-all ${i <= config.bars ? 'bg-current' : 'bg-white/20'}`}
              style={{ height: `${i * 4 + 4}px` }}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="text-xs">{config.label}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Error banner */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-b-4 border-red-300 px-6 py-4 flex items-center gap-3 text-red-800 text-base shadow-lg">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800 text-xl font-bold">✕</button>
        </div>
      )}

      {/* Setup / Waiting room */}
      {(callState === 'setup' || callState === 'waiting') && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full space-y-8 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white rounded-2xl shadow-2xl p-8 w-full text-center">
            <h1 className="text-3xl font-bold mb-3">Waiting Room</h1>
            <p className="text-lg text-blue-100">Dr. Ramesh Patil · PHC Beed</p>
          </div>
          
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-4xl font-bold text-indigo-700 shadow-2xl border-4 border-white">RP</div>
            {callState === 'waiting' && (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-teal-400 animate-ping opacity-30" aria-hidden="true" />
                <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-lg" aria-label="Doctor online" />
              </>
            )}
          </div>

          {callState === 'setup' && (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full text-center border-2 border-gray-100">
                <p className="text-sm text-gray-600 font-bold mb-2 uppercase">Queue Position</p>
                <p className="text-6xl font-bold text-[#123B6D] tabular-nums">#2</p>
                <p className="text-lg text-gray-600 mt-3 font-medium">Est. wait: ~6 min</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 w-full border-2 border-gray-100">
                <p className="text-sm font-bold text-gray-600 mb-5 uppercase tracking-wide">Pre-call Checks</p>
                <div className="space-y-4">
                  {preChecks.map(c => (
                    <div key={c.label} className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3 text-gray-700 font-medium">{c.icon} {c.label}</div>
                      <CheckCircle size={20} className="text-green-500" aria-label="OK" />
                    </div>
                  ))}
                </div>
              </div>

              {!permissionsGranted && (
                <div className="text-base text-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-2xl px-6 py-4 w-full text-center font-medium shadow-md">
                  Camera/microphone permissions required. Click "Join call" to grant access.
                </div>
              )}

              <p className="text-base text-center text-indigo-800 bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-2xl px-6 py-4 font-medium">
                Real-time WebRTC video calling with adaptive quality based on your network connection.
              </p>

              <button onClick={startCall} className="bg-gradient-to-r from-[#E85D04] to-[#d94f03] text-white font-bold w-full py-5 rounded-2xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-3 text-xl disabled:opacity-50" disabled={!navigator.mediaDevices}>
                <Video size={24} aria-hidden="true" /> Join Call
              </button>
            </>
          )}

          {callState === 'waiting' && (
            <>
              <p className="text-lg text-gray-700 text-center font-medium">Connecting to doctor...</p>
              <div className="flex gap-2" aria-label="Loading">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-4 h-4 rounded-full bg-teal-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Connecting state */}
      {callState === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shadow-2xl">
            <Video size={48} className="text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-[#123B6D]">Connecting to doctor...</p>
          <p className="text-lg text-gray-600">Setting up video connection</p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-full bg-teal-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Live call */}
      {callState === 'live' && (
        <div className="flex-1 flex flex-col bg-[#0f1a16] relative overflow-hidden">
          {/* Remote video (doctor) - full screen */}
          <div className="flex-1 relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Fallback if no remote stream yet */}
            {!remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1B2E28] to-[#0f1a16] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-900/60 flex items-center justify-center text-xl font-semibold text-indigo-300 mx-auto mb-2">RP</div>
                  <p className="text-white font-medium text-sm">Dr. Ramesh Patil</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-dot-live" aria-hidden="true" />
                    <span className="text-green-400 text-xs">Connecting...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Local video (self view) - picture in picture */}
            <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl bg-[#1B2E28] border border-white/20 overflow-hidden shadow-lg">
              {camOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="w-full h-full bg-teal-900/40 flex items-center justify-center">
                  <VideoOff size={18} className="text-white/60" />
                </div>
              )}
            </div>

            {/* Connection quality indicator */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
              {getQualityIndicator()}
            </div>

            {/* Call duration */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-dot-live" aria-hidden="true" />
              {formatDuration(callDuration)}
            </div>

            {/* Network quality warning */}
            {connectionQuality?.quality === 'critical' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full flex items-center gap-2"
              >
                <WifiOff size={12} />
                <span>Poor connection - Audio only mode</span>
              </motion.div>
            )}
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col border-l border-[#D3D1C7] shadow-xl">
              <div className="p-3 border-b flex items-center justify-between">
                <p className="font-semibold text-sm">Chat</p>
                <button onClick={() => setChatOpen(false)} className="text-[#5F5E5A] text-xs hover:text-[#2C2C2A]" aria-label="Close chat">✕</button>
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
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Type…"
                  className="input-field text-xs py-2 flex-1"
                  aria-label="Chat message"
                />
                <button onClick={sendMsg} className="btn-primary text-xs py-2 px-3">Send</button>
              </div>
            </motion.div>
          )}

          {/* Call controls */}
          <div className="flex items-center justify-center gap-6 py-6 bg-black/70 backdrop-blur-md">
            <button
              onClick={toggleMic}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${micOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              aria-label={micOn ? 'Mute' : 'Unmute'}
              aria-pressed={!micOn}
            >
              {micOn ? <Mic size={28} /> : <MicOff size={28} />}
            </button>
            
            <button
              onClick={toggleCamera}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${camOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              aria-label={camOn ? 'Camera off' : 'Camera on'}
              aria-pressed={!camOn}
            >
              {camOn ? <Video size={28} /> : <VideoOff size={28} />}
            </button>
            
            <button
              onClick={() => setChatOpen(p => !p)}
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center relative transition-all duration-200"
              aria-label="Chat"
              aria-pressed={chatOpen}
            >
              <MessageSquare size={28} />
              {messages.length > 0 && <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" aria-hidden="true" />}
            </button>
            
            <button
              onClick={endCall}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center shadow-2xl transition-all duration-200"
              aria-label="End call"
            >
              <Phone size={32} className="rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}

      {/* Post-call */}
      {callState === 'ended' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full space-y-8 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-2xl">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#123B6D]">Call Ended</h2>
            <p className="text-lg text-gray-600 mt-3">
              Duration: {formatDuration(callDuration)} · Dr. Ramesh Patil
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full space-y-4 border-2 border-gray-100">
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Doctor's Notes</p>
            <p className="text-base text-gray-800 leading-relaxed">Continue iron supplementation. Repeat CBC in 2 weeks. BP review in 5 days.</p>
            <AIPill />
          </div>
          <button onClick={() => { setCallState('setup'); setCallDuration(0); }} className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white font-bold w-full py-4 rounded-2xl hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg">
            <Monitor size={20} /> Back to Waiting Room
          </button>
        </div>
      )}

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        .status-dot-live {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
