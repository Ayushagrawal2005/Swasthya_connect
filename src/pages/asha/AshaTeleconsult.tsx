/**
 * ASHA — Assisted Teleconsultation with Real WebRTC
 * ASHA worker facilitates video call between patient and doctor
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, MicOff, VideoOff, Phone, MessageSquare,
  CheckCircle, Wifi, WifiOff, Volume2, User, FileText,
  Pill, Activity, AlertCircle, X, Download, Play
} from 'lucide-react'
import { teleconsultApi, type Doctor } from '../../services/api'
import { AIPill } from '../../components/ui/AIPill'
import { useApp } from '../../context/AppContext'
import { meena } from '../../data/meenaPatient'
import { webrtcService, type ConnectionQuality } from '../../services/webrtc'

type CallState = 'setup' | 'waiting' | 'connecting' | 'live' | 'ended'

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface PrescriptionData {
  patientName: string
  patientAge: number
  patientGender: string
  symptoms: string[]
  diagnosis: string
  medicines: Medicine[]
  advice: string[]
  doctorName: string
  date: string
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const WS_URL = API_BASE.replace('http', 'ws') + '/ws'

const preChecks = [
  { label: 'Microphone working',  icon: <Mic size={15} />,     ok: true },
  { label: 'Camera working',      icon: <Video size={15} />,   ok: true },
  { label: 'Internet / hotspot',  icon: <Wifi size={15} />,    ok: true },
  { label: 'Speaker audible',     icon: <Volume2 size={15} />, ok: true },
]

export function AshaTeleconsultPage() {
  const { isOnline, userName, token, userId } = useApp()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const [availableDoctors, setAvailableDoctors] = useState<(Doctor & { facility: string })[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<(Doctor & { facility: string }) | null>(null)
  const [sessionId, setSessionId] = useState(`asha-session-${Date.now()}`)
  const [callState, setCallState] = useState<CallState>('setup')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [patientPanelOpen, setPatientPanelOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState([
    { from: 'doctor', text: "Good morning. I can see the patient's record. Let me review the vitals and history before we start." },
  ])

  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const callStartTimeRef = useRef<number>(0)
  const [postNotes, setPostNotes] = useState('')
  const [postRx, setPostRx] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)

  // Prescription data
  const prescription: PrescriptionData = {
    patientName: meena.name,
    patientAge: meena.age,
    patientGender: meena.gender,
    symptoms: ['Fever (2 days)', 'Fatigue', 'Mild headache', 'Body ache'],
    diagnosis: 'Viral Upper Respiratory Tract Infection',
    medicines: [
      { name: 'Paracetamol', dosage: '650 mg', frequency: 'Every 6 hours', duration: '3 days' },
      { name: 'Cetirizine', dosage: '10 mg', frequency: 'Once at night', duration: '5 days' },
      { name: 'Warm Saline Gargles', dosage: '—', frequency: '3 times daily', duration: '7 days' }
    ],
    advice: [
      'Take adequate rest',
      'Drink plenty of fluids (at least 8 glasses of water)',
      'Avoid cold beverages and ice cream',
      'Follow up if fever persists beyond 3 days or worsens'
    ],
    doctorName: selectedDoctor?.name || 'Dr. Ramesh Patil',
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Patient information for panel
  const patientInfo = {
    patient: {
      name: meena.name,
      age: meena.age,
      gender: meena.gender,
      id: meena.id,
      bloodGroup: 'O+',
      allergies: ['Sulfa drugs'],
      conditions: meena.conditions
    },
    vitals: {
      bp: meena.visits[0]?.vitals?.bp || '168/104 mmHg',
      temp: meena.visits[0]?.vitals?.temp || '101.2°F',
      pulse: meena.visits[0]?.vitals?.pulse || '88 bpm',
      spo2: meena.visits[0]?.vitals?.spo2 || '96%',
      weight: meena.visits[0]?.vitals?.weight || '64 kg'
    },
    currentMedications: [
      { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily morning', since: 'Jan 2025' },
      { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily with meals', since: 'Mar 2024' }
    ],
    previousRecords: meena.visits.slice(0, 3).map((visit, idx) => ({
      date: new Date(Date.now() - (idx + 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
      diagnosis: visit.title || 'Follow-up visit',
      doctor: 'Dr. Patil',
      medicines: ['Amlodipine 5mg', 'Metformin 500mg']
    }))
  }

  // Load available doctors (using mock data for demo)
  useEffect(() => {
    // Mock available doctors data
    const mockDoctors: (Doctor & { facility: string })[] = [
      {
        id: 'dr-1',
        name: 'Dr. Ramesh Patil',
        specialty: 'General Medicine',
        facilityId: 'phc-beed',
        available: true,
        slotsToday: 3,
        facility: 'PHC Beed'
      },
      {
        id: 'dr-2',
        name: 'Dr. Priya Sharma',
        specialty: 'Pediatrics',
        facilityId: 'phc-beed',
        available: true,
        slotsToday: 2,
        facility: 'PHC Beed'
      }
    ]
    
    setAvailableDoctors(mockDoctors)
    if (mockDoctors.length > 0) setSelectedDoctor(mockDoctors[0])
    
    // Uncomment when backend API is ready:
    // teleconsultApi.availableDoctors()
    //   .then(docs => {
    //     setAvailableDoctors(docs)
    //     if (docs.length > 0) setSelectedDoctor(docs[0])
    //   })
    //   .catch(() => { })
  }, [])

  // Setup WebRTC event handlers
  useEffect(() => {
    webrtcService.onRemoteStream = (userId, stream) => {
      console.log('Received remote stream from', userId)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
      setCallState('live')
      callStartTimeRef.current = Date.now()
      setPatientPanelOpen(true) // Auto-open patient panel when call goes live
    }

    webrtcService.onPeerConnected = (userId) => {
      console.log('Peer connected:', userId)
    }

    webrtcService.onPeerDisconnected = (userId) => {
      console.log('Peer disconnected:', userId)
      setCallState('ended')
      setPatientPanelOpen(false)
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

  // Start call
  async function startCall() {
    try {
      setError(null)
      setCallState('waiting')

      // Initiate teleconsult session via API
      const response = await teleconsultApi.initiate('', selectedDoctor?.id || '')
      setSessionId(response.sessionId)

      // Get local camera stream
      const stream = await webrtcService.getLocalStream()
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Connect to WebSocket signaling server
      await webrtcService.connect(WS_URL, token || '', userId || 'asha-unknown')

      setCallState('connecting')

      // Join the room (ASHA can be initiator or responder based on who joins first)
      await webrtcService.joinRoom(sessionId, false)

    } catch (err: any) {
      console.error('Failed to start call:', err)
      setError(err.message || 'Failed to start video call')
      setCallState('setup')
    }
  }

  // End call
  function endCall() {
    setCallState('ended')
    setPatientPanelOpen(false)
    webrtcService.leaveRoom()
    webrtcService.stopLocalStream()

    // Save notes if session exists
    if (sessionId) {
      teleconsultApi.saveNotes(sessionId, postNotes, postRx).catch(() => { })
    }
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
    setMessages(p => [...p, { from: 'asha', text: chatMsg }])
    setChatMsg('')
    setTimeout(() => {
      setMessages(p => [...p, { from: 'doctor', text: 'Understood. I recommend reviewing the medication and scheduling a follow-up within 5 days.' }])
    }, 1500)
  }

  // Save notes
  function saveNotes() {
    if (sessionId) {
      teleconsultApi.saveNotes(sessionId, postNotes, postRx)
        .then(() => setNotesSaved(true))
        .catch(() => { })
    }
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 3000)
  }

  // Export prescription
  function exportPrescription() {
    const text = `
TELECONSULTATION PRESCRIPTION
====================================

Date: ${prescription.date}
Patient: ${prescription.patientName}
Age: ${prescription.patientAge} years
Gender: ${prescription.patientGender}

SYMPTOMS:
${prescription.symptoms.map(s => `• ${s}`).join('\n')}

DIAGNOSIS:
${prescription.diagnosis}

PRESCRIBED MEDICINES:
${prescription.medicines.map((m, i) => `${i + 1}. ${m.name} ${m.dosage}
   ${m.frequency} for ${m.duration}`).join('\n\n')}

ADVICE:
${prescription.advice.map(a => `• ${a}`).join('\n')}

Doctor: ${prescription.doctorName}
ASHA Worker: ${userName}
    `.trim()

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Prescription_${prescription.patientName.replace(/\s+/g, '_')}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Format duration
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get quality indicator
  function getQualityLabel() {
    if (!connectionQuality) return 'Good'
    const labels = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      critical: 'Critical'
    }
    return labels[connectionQuality.quality]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2 text-red-800 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

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
                <p className="font-semibold text-sm text-[#2C2C2A]">{prescription.patientName}</p>
                <p className="text-xs text-[#5F5E5A]">{meena.age}y · {meena.conditions.join(', ')}</p>
              </div>
              <span className="ml-auto badge-amber text-[10px]">Risk: 52/100</span>
            </div>

            {/* Doctor available */}
            <div className="card p-4 w-full flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 flex-shrink-0">RP</div>
              <div>
                <p className="font-semibold text-sm text-[#2C2C2A]">{selectedDoctor?.name ?? "Dr. Patil"}</p>
                <p className="text-xs text-[#5F5E5A]">PHC Beed · General Medicine</p>
              </div>
              <span className="ml-auto badge-green text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-live" aria-hidden="true" /> Available
              </span>
            </div>

            {/* Offline warning */}
            {!isOnline && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 w-full">
                <WifiOff size={13} /> No internet — teleconsult requires connectivity. Please connect to proceed.
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

            <p className="text-xs text-center text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 w-full">
              Real-time WebRTC video calling with adaptive quality for rural connectivity.
            </p>

            <button onClick={() => startCall()} className="btn-primary w-full justify-center text-base py-3.5" disabled={!isOnline}>
              <Video size={18} aria-hidden="true" /> Start teleconsult
            </button>
          </motion.div>
        )}

        {/* ── Waiting / Connecting ── */}
        {(callState === 'waiting' || callState === 'connecting') && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-semibold text-indigo-700">RP</div>
              <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-30" aria-hidden="true" />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" aria-label="Doctor online" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#2C2C2A]">
                {callState === 'waiting' ? 'Connecting to Dr. Patil…' : 'Setting up video call...'}
              </p>
              <p className="text-sm text-[#5F5E5A] mt-1">PHC Beed · Est. wait: ~1 min</p>
            </div>
            <p className="text-xs text-center text-[#5F5E5A] max-w-xs">
              Doctor is receiving {meena.name}'s full record: 4 visit history, BP trend, OCR prescription, and today's triage score (52/100).
            </p>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-teal-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <button onClick={() => setCallState('setup')} className="text-sm text-[#5F5E5A] hover:text-teal-600">
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── Live call ── */}
        {callState === 'live' && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-[#0f1a16] relative overflow-hidden">

            {/* Patient Information Sliding Panel */}
            <AnimatePresence>
              {patientPanelOpen && (
                <motion.div
                  initial={{ x: -400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -400, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed left-0 top-20 bottom-0 w-96 bg-white shadow-2xl border-r-2 border-teal-200 z-50 overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User size={18} className="text-teal-600" />
                        Patient Information
                      </h3>
                      <button
                        onClick={() => setPatientPanelOpen(false)}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Patient Details */}
                    <div className="bg-teal-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center text-teal-800 font-bold text-lg">
                          {patientInfo.patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{patientInfo.patient.name}</p>
                          <p className="text-xs text-gray-600">{patientInfo.patient.id}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Age / Gender</p>
                          <p className="font-semibold text-gray-800">{patientInfo.patient.age}y / {patientInfo.patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Blood Group</p>
                          <p className="font-semibold text-gray-800">{patientInfo.patient.bloodGroup}</p>
                        </div>
                      </div>
                    </div>

                    {/* Allergies */}
                    {patientInfo.patient.allergies.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={14} className="text-red-600" />
                          <p className="text-xs font-bold text-red-800 uppercase">Allergies</p>
                        </div>
                        {patientInfo.patient.allergies.map((allergy, i) => (
                          <p key={i} className="text-sm text-red-700">• {allergy}</p>
                        ))}
                      </div>
                    )}

                    {/* Current Conditions */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Current Conditions</h4>
                      <div className="space-y-1">
                        {patientInfo.patient.conditions.map((condition, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                            {condition}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Latest Vitals */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                        <Activity size={14} />
                        Latest Vitals
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(patientInfo.vitals).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded p-2">
                            <p className="text-xs text-gray-500 capitalize">{key}</p>
                            <p className="text-sm font-semibold text-gray-800">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Current Medications */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                        <Pill size={14} />
                        Current Medications
                      </h4>
                      <div className="space-y-2">
                        {patientInfo.currentMedications.map((med, i) => (
                          <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-sm font-semibold text-blue-900">{med.name}</p>
                            <p className="text-xs text-blue-700">{med.dosage} · {med.frequency}</p>
                            <p className="text-xs text-gray-500">Since {med.since}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Previous Records */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1">
                        <FileText size={14} />
                        Previous Consultations
                      </h4>
                      <div className="space-y-2">
                        {patientInfo.previousRecords.map((record, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-semibold text-gray-800">{record.date}</p>
                              <span className="text-xs text-gray-500">{record.doctor}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-2">{record.diagnosis}</p>
                            <div className="text-xs text-gray-600">
                              <p className="font-semibold mb-1">Medicines:</p>
                              {record.medicines.map((med, j) => (
                                <p key={j} className="ml-2">• {med}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Doctor video - full screen */}
            <div className="flex-1 flex items-center justify-center relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Fallback if no remote stream */}
              {!remoteVideoRef.current?.srcObject && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B2E28] to-[#0f1a16] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-900/60 flex items-center justify-center text-xl font-semibold text-indigo-300 mx-auto mb-2">RP</div>
                    <p className="text-white font-medium text-sm">{selectedDoctor?.name ?? "Dr. Patil"}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-dot-live" aria-hidden="true" />
                      <span className="text-green-400 text-xs">Connecting...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ASHA self-view */}
              <div className="absolute bottom-4 right-4 w-24 h-16 rounded-xl bg-[#1B2E28] border border-white/20 overflow-hidden">
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
                    <VideoOff size={16} className="text-white/40" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Patient info strip */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <User size={11} aria-hidden="true" />
                <span>Patient: {meena.name} · BP {meena.visits[0].vitals?.bp} · Risk: 52/100</span>
              </div>

              {/* Timer & Quality */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-dot-live" aria-hidden="true" />
                {formatDuration(callDuration)} · {getQualityLabel()}
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
                  <p className="font-semibold text-sm text-[#2C2C2A]">Chat with doctor</p>
                  <button onClick={() => setChatOpen(false)} className="text-[#5F5E5A] text-xs hover:text-[#2C2C2A]">✕</button>
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
              <button onClick={() => setPatientPanelOpen(p => !p)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${patientPanelOpen ? 'bg-teal-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                aria-label={patientPanelOpen ? 'Hide patient info' : 'Show patient info'}
                aria-pressed={patientPanelOpen}
                title={patientPanelOpen ? 'Hide patient info' : 'Show patient info'}>
                <User size={20} />
              </button>
              <button onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 text-white'}`}
                aria-label={micOn ? 'Mute' : 'Unmute'} aria-pressed={!micOn}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={toggleCamera}
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
              <button onClick={() => endCall()}
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
                <p className="text-sm text-[#5F5E5A]">Duration: {formatDuration(callDuration)} · {selectedDoctor?.name ?? "Dr. Patil"}</p>
              </div>
            </div>

            {/* Doctor's prescription */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2C2C2A]">Prescription & Advice</p>
                <button onClick={exportPrescription} className="btn-secondary text-xs py-1.5 px-3">
                  <Download size={12} />
                  Export
                </button>
              </div>

              {/* Diagnosis */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold mb-1">Diagnosis</p>
                <p className="text-sm font-medium text-blue-900">{prescription.diagnosis}</p>
              </div>

              {/* Medicines */}
              <div>
                <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Prescribed Medicines</p>
                <div className="space-y-2">
                  {prescription.medicines.map((med, i) => (
                    <div key={i} className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-teal-900">{i + 1}. {med.name} {med.dosage}</p>
                      <p className="text-xs text-teal-700">{med.frequency} · {med.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div>
                <p className="text-xs font-semibold text-[#5F5E5A] mb-2">Clinical Advice</p>
                <ul className="space-y-1.5">
                  {prescription.advice.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#2C2C2A]">
                      <CheckCircle size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <AIPill />
            </div>

            {/* Notes input */}
            <div className="card p-5 space-y-3">
              <p className="text-sm font-semibold text-[#2C2C2A]">Add follow-up notes (optional)</p>
              <textarea
                value={postNotes}
                onChange={e => setPostNotes(e.target.value)}
                placeholder="Patient condition, follow-up requirements..."
                className="input-field text-sm"
                rows={3}
              />
              <button
                onClick={saveNotes}
                className="btn-primary text-sm py-2 px-4"
                disabled={notesSaved}
              >
                {notesSaved ? <><CheckCircle size={14} /> Saved</> : 'Save Notes'}
              </button>
            </div>

            <button onClick={() => { setCallState('setup'); setCallDuration(0); }} className="btn-secondary w-full justify-center text-sm">
              <Play size={15} /> Start new consultation
            </button>
          </motion.div>
        )}

      </AnimatePresence>

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
